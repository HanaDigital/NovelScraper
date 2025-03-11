use crate::AppState;

use super::is_novel_download_cancelled;
use super::types::{Chapter, DownloadData, NovelData};
use futures::future::join_all;
use kuchikiki::traits::*;
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

        let mut batch_start_index = batch_index * novel_data.batch_size;
        let batch_end_index = min((batch_index + 1) * novel_data.batch_size, chapters.len());
        if novel_data.start_downloading_from_index >= batch_end_index {
            batch_index += 1;
            continue;
        }
        if novel_data.start_downloading_from_index > batch_start_index {
            batch_start_index = novel_data.start_downloading_from_index;
        }

        let chapters_batch = &mut chapters[batch_start_index..batch_end_index];
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

        app.emit(
            "download-status",
            DownloadData {
                novel_id: novel_data.novel_id.clone(),
                status: super::DownloadStatus::Downloading,
                downloaded_chapters_count: batch_end_index,
                downloaded_chapters: Some(chapters[batch_start_index..batch_end_index].to_vec()),
            },
        )
        .unwrap();
    }

    return Ok(chapters);
}

async fn get_chapter_urls(novel_data: &NovelData) -> Vec<super::Chapter> {
    let page_html = super::fetch_html(
        &format!("{}ajax/chapters", novel_data.novel_url),
        &novel_data.cf_headers,
        super::types::FetchType::POST,
    )
    .await
    .unwrap();
    let document = kuchikiki::parse_html().one(page_html);

    let mut chapters: Vec<super::Chapter> = vec![];
    document
        .select("li.wp-manga-chapter a")
        .unwrap()
        .rev()
        .for_each(|chapter_elem| {
            let title = chapter_elem.text_contents().trim().to_string();
            let url = chapter_elem
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

    let chapter_content_node = document
        .select_first(".c-blog-post .entry-content .reading-content .text-left")
        .unwrap();
    let chapter_content_html =
        super::clean_chapter_html(&mut chapter_content_node.as_node().to_string());

    chapter.content = Some(chapter_content_html);
}
