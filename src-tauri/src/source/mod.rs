pub mod novelbin;
pub mod novelfull;
pub mod novgo;
pub mod types;

use futures::future::join_all;
use isahc::{prelude::*, Request};
use regex::Regex;
use std::cmp::min;
use std::sync::Mutex;
use std::{collections::HashMap, thread, time::Duration};
use tauri::{AppHandle, Emitter, State};
use types::{Chapter, DownloadData, DownloadStatus, FetchType, NovelData, SourceDownloadResult};

use crate::AppState;

pub async fn download_novel_chapters(
    app: &AppHandle,
    state: &State<'_, Mutex<AppState>>,
    novel_data: &NovelData,
) -> Result<SourceDownloadResult, String> {
    if novel_data.source_id == "novelfull" {
        return novelfull::download_novel_chapters(app, state, novel_data).await;
    } else if novel_data.source_id == "novelbin" {
        return novelbin::download_novel_chapters(app, state, novel_data).await;
    } else if novel_data.source_id == "novgo" {
        return novgo::download_novel_chapters(app, state, novel_data).await;
    }
    Err(format!("Source {} not found", novel_data.source_id))
}

pub async fn fetch_html(
    url: &str,
    headers: &Option<HashMap<String, String>>,
    fetch_type: FetchType,
) -> Result<String, String> {
    let mut req_builder = if fetch_type == FetchType::GET {
        Request::get(url)
    } else {
        Request::post(url)
    };
    if headers.is_some() {
        for (key, value) in headers.as_ref().unwrap() {
            req_builder = req_builder.header(key, value);
        }
    }

    let mut res = req_builder
        .body(())
        .unwrap()
        .send()
        .expect(format!("Couldn't send request for {:?}:{}", fetch_type, url).as_str());
    let text_result = res
        .text()
        .expect(format!("Couldn't get text for {:?}:{}", fetch_type, url).as_str());
    Ok(text_result)
}

pub async fn fetch_image(
    url: &str,
    headers: &Option<HashMap<String, String>>,
) -> Result<Vec<u8>, String> {
    let mut req_builder = Request::get(url);

    if headers.is_some() {
        for (key, value) in headers.as_ref().unwrap() {
            req_builder = req_builder.header(key, value);
        }
    }

    let mut res = req_builder
        .body(())
        .unwrap()
        .send()
        .expect(format!("Couldn't send request for {}", url).as_str());
    let bytes_result = res
        .bytes()
        .expect(format!("Couldn't get bytes for {}", url).as_str());
    Ok(bytes_result)
}

pub async fn update_novel_download_status(
    state: &State<'_, Mutex<AppState>>,
    novel_id: &str,
    status: &types::DownloadStatus,
) -> Result<types::DownloadStatus, String> {
    let mut state = state.lock().expect("Couldn't lock state");
    state
        .novel_status
        .insert(novel_id.to_string(), status.clone());
    Ok(status.clone())
}

pub async fn is_novel_download_cancelled(
    state: &State<'_, Mutex<AppState>>,
    novel_id: &str,
) -> bool {
    let state = state.lock().expect("Couldn't lock state");
    return state
        .novel_status
        .get(novel_id)
        .expect("Couldn't get novel status")
        == &DownloadStatus::Cancelled;
}

async fn download_chapters(
    app: &AppHandle,
    state: &tauri::State<'_, std::sync::Mutex<AppState>>,
    novel_data: &NovelData,
    chapters: Vec<Chapter>,
    get_chapter_content_from_html_fn: fn(&NovelData, &mut Chapter, &str) -> Result<(), String>,
    chapter_count_offset: usize,
) -> Result<SourceDownloadResult, String> {
    let mut downloaded_chapters: Vec<super::Chapter> = vec![];

    let mut batch_index: usize = 0;
    while (batch_index * novel_data.batch_size) < chapters.len() {
        thread::sleep(Duration::from_secs(novel_data.batch_delay as u64));

        // Check if the download is cancelled
        if is_novel_download_cancelled(state, &novel_data.novel_id).await {
            return Ok(SourceDownloadResult {
                status: DownloadStatus::Cancelled,
                chapters: downloaded_chapters,
            });
        }

        let batch_start_index = batch_index * novel_data.batch_size;
        let batch_end_index = min((batch_index + 1) * novel_data.batch_size, chapters.len());

        let chapters_batch = &chapters[batch_start_index..batch_end_index];
        let chapter_html_futures = chapters_batch
            .iter()
            .map(|chapter| fetch_html(&chapter.url, &novel_data.cf_headers, FetchType::GET));

        let chapter_html_vec = join_all(chapter_html_futures).await;
        for i in 0..chapter_html_vec.len() {
            let mut chapter = chapters_batch[i].clone();
            let chapter_html = chapter_html_vec[i]
                .as_ref()
                .expect(format!("Couldn't get chapter html for {}", chapter.title).as_str());
            get_chapter_content_from_html_fn(novel_data, &mut chapter, chapter_html)?;
            downloaded_chapters.push(chapter);
        }

        batch_index += 1;

        app.emit(
            "download-status",
            DownloadData {
                novel_id: novel_data.novel_id.clone(),
                status: super::DownloadStatus::Downloading,
                downloaded_chapters_count: novel_data.pre_downloaded_chapters_count
                    + downloaded_chapters.len()
                    + chapter_count_offset,
                downloaded_chapters: Some(
                    downloaded_chapters[batch_start_index..batch_end_index].to_vec(),
                ),
            },
        )
        .expect("Couldn't emit download status!");
    }

    Ok(SourceDownloadResult {
        status: DownloadStatus::Completed,
        chapters: downloaded_chapters,
    })
}

fn clean_chapter_html(html: &mut String) -> String {
    let class_re = Regex::new(r#"class=".*?""#).unwrap();
    let mut html = class_re.replace_all(&html, "").to_string();
    let id_re = Regex::new(r#"id=".*?""#).unwrap();
    html = id_re.replace_all(&html, "").to_string();
    let style_re = Regex::new(r#"style=".*?""#).unwrap();
    html = style_re.replace_all(&html, "").to_string();
    let data_re = Regex::new(r#"data-.*?=".*?""#).unwrap();
    html = data_re.replace_all(&html, "").to_string();
    let comment_re = Regex::new(r#"<!--.*?-->"#).unwrap();
    html = comment_re.replace_all(&html, "").to_string();
    let iframe_re = Regex::new(r#"<iframe.*?</iframe>"#).unwrap();
    html = iframe_re.replace_all(&html, "").to_string();
    let script_re = Regex::new(r#"<script.*?</script>"#).unwrap();
    html = script_re.replace_all(&html, "").to_string();

    // Fix unclosed br tags
    let br_re = Regex::new(r#"<br.*?>"#).unwrap();
    html = br_re.replace_all(&html, "<br />").to_string();

    return html;
}
