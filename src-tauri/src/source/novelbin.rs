use crate::AppState;

use super::is_novel_download_cancelled;
use super::types::{Chapter, DownloadData, NovelData};
use futures::future::join_all;
use kuchikiki::traits::*;
use regex::Regex;
use std::time::Duration;
use std::{cmp::min, thread, vec};
use tauri::{AppHandle, Emitter};

pub async fn download_novel_chapters(
    app: &AppHandle,
    state: &tauri::State<'_, std::sync::Mutex<AppState>>,
    novel_data: NovelData,
) -> Result<Vec<Chapter>, String> {
    let mut chapters = get_chapter_urls(&novel_data).await;
    let mut batch_index: usize = 0;
    while (batch_index * novel_data.batch_size) < chapters.len() {
        thread::sleep(Duration::from_secs(novel_data.batch_delay as u64));

        // Check if the download is cancelled
        if is_novel_download_cancelled(state, &novel_data.novel_id).await {
            return Err(format!("Download cancelled for {}", novel_data.novel_id));
        }

        let mut batch_start = batch_index * novel_data.batch_size;
        let batch_end = min((batch_index + 1) * novel_data.batch_size, chapters.len());
        if novel_data.start_downloading_from_index >= batch_end {
            batch_index += 1;
            continue;
        }
        if novel_data.start_downloading_from_index > batch_start {
            batch_start = novel_data.start_downloading_from_index;
        }

        let chapters_batch = &mut chapters[batch_start..batch_end];
        let chapter_html_futures = chapters_batch.iter().map(|chapter| {
            super::fetch_html(
                &chapter.url,
                &novel_data.cf_headers,
                super::types::FetchType::GET,
            )
        });

        let chapter_html_vec = join_all(chapter_html_futures).await;
        for i in 0..chapter_html_vec.len() {
            let chapter_html = chapter_html_vec[i].as_ref().unwrap();
            get_chapter_content(&mut chapters_batch[i], chapter_html);
        }

        batch_index += 1;

        let download_count = novel_data.start_downloading_from_index + batch_end;
        app.emit(
            "download-status",
            DownloadData {
                novel_id: novel_data.novel_id.clone(),
                status: super::DownloadStatus::Downloading,
                downloaded_chapters_count: download_count,
                downloaded_chapters: Some(chapters[batch_start..batch_end].to_vec()),
            },
        )
        .unwrap();
    }

    return Ok(chapters);
}

async fn get_chapter_urls(novel_data: &NovelData) -> Vec<super::Chapter> {
    let novel_id = novel_data.novel_url.split("/").last().unwrap();
    let page_html = super::fetch_html(
        &format!(
            "{}/ajax/chapter-archive?novelId={}",
            novel_data.source_url, novel_id
        ),
        &novel_data.cf_headers,
        super::types::FetchType::GET,
    )
    .await
    .unwrap();
    let document = kuchikiki::parse_html().one(page_html);

    let mut chapters: Vec<super::Chapter> = vec![];
    document
        .select("ul.list-chapter li")
        .unwrap()
        .for_each(|chapter_elem| {
            let chapter_link_elem = chapter_elem.as_node().select("a").unwrap().next().unwrap();
            let title = chapter_link_elem.text_contents().trim().to_string();
            let url = chapter_link_elem
                .attributes
                .borrow()
                .get("href")
                .unwrap()
                .to_string();
            let chapter = super::Chapter {
                title,
                url,
                content: None,
            };
            chapters.push(chapter);
        });

    return chapters;
}

fn get_chapter_content(chapter: &mut super::Chapter, chapter_html: &str) {
    let document = kuchikiki::parse_html().one(chapter_html);

    let chapter_content_node = document.select_first("#chr-content").unwrap();
    let mut chapter_content_html =
        super::clean_chapter_html(&mut chapter_content_node.as_node().to_string());

    let chapter_title = document
        .select_first("#chapter .chr-title")
        .unwrap()
        .text_contents()
        .trim()
        .to_string();
    if !chapter_title.is_empty() {
        chapter_content_html = format!("<h1>{}</h1>", chapter_title) + &chapter_content_html;
    }

    let ad_re = Regex::new(r#"<div class="PUBFUTURE">.*?</div>"#).unwrap();
    chapter_content_html = ad_re.replace_all(&chapter_content_html, "").to_string();
    let schedule_re = Regex::new(r#"<div class="schedule-text">.*?</div>"#).unwrap();
    chapter_content_html = schedule_re
        .replace_all(&chapter_content_html, "")
        .to_string();

    chapter.content = Some(chapter_content_html);
}
