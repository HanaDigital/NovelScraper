use crate::AppState;

use super::is_novel_download_cancelled;
use super::types::{Chapter, DownloadData, NovelData};
use futures::future::join_all;
use kuchikiki::traits::*;
use regex::Regex;
use std::sync::Mutex;
use std::time::Duration;
use std::{cmp::min, thread, vec};
use tauri::{AppHandle, Emitter, State};

pub async fn download_novel_chapters(
    app: &AppHandle,
    state: &State<'_, Mutex<AppState>>,
    novel_data: NovelData,
) -> Result<Vec<Chapter>, String> {
    let total_pages = get_total_pages(&novel_data).await;

    let mut chapters: Vec<super::Chapter> = vec![];
    let mut max_chapters_per_page = 0;
    for page_num in 1..=total_pages {
        // Get all the chapters on the current page
        let mut page_chapters = get_page_chapter_urls(&novel_data, page_num).await;
        max_chapters_per_page = max_chapters_per_page.max(page_chapters.len());

        let mut batch_index: usize = 0;
        while (batch_index * novel_data.batch_size) < page_chapters.len() {
            thread::sleep(Duration::from_secs(novel_data.batch_delay as u64));

            // Check if the download is cancelled
            if is_novel_download_cancelled(state, &novel_data.novel_id).await {
                return Err(format!("Download cancelled for {}", novel_data.novel_id));
            }

            let mut batch_start = batch_index * novel_data.batch_size;
            let batch_start_index = batch_start + (max_chapters_per_page * (page_num - 1));
            let batch_end = min(
                (batch_index + 1) * novel_data.batch_size,
                page_chapters.len(),
            );
            let batch_end_index = batch_end + (max_chapters_per_page * (page_num - 1));
            if novel_data.start_downloading_from_index >= batch_end_index {
                batch_index += 1;
                continue;
            }
            if novel_data.start_downloading_from_index > batch_start_index {
                batch_start += novel_data.start_downloading_from_index - batch_start_index;
            }

            let chapters_batch = &mut page_chapters[batch_start..batch_end];
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
                chapters.push(chapters_batch[i].clone());
            }

            batch_index += 1;

            app.emit(
                "download-status",
                DownloadData {
                    novel_id: novel_data.novel_id.clone(),
                    status: super::DownloadStatus::Downloading,
                    downloaded_chapters_count: novel_data.start_downloading_from_index
                        + chapters.len(),
                    downloaded_chapters: Some(chapters_batch.to_vec()),
                },
            )
            .unwrap();
        }
    }

    Ok(chapters)
}

async fn get_total_pages(novel_data: &NovelData) -> usize {
    let novel_html = super::fetch_html(
        &novel_data.novel_url,
        &novel_data.cf_headers,
        super::types::FetchType::GET,
    )
    .await
    .unwrap();
    let document = kuchikiki::parse_html().one(novel_html);

    let total_pages;

    let last_page_node = match document.select("#list-chapter ul.pagination > li.last a") {
        Ok(mut nodes) => nodes.next(),
        Err(_) => None,
    };

    match last_page_node {
        Some(node) => {
            let last_page_url = node.attributes.borrow().get("href").unwrap().to_string();
            let total_page = last_page_url
                .split("=")
                .last()
                .expect("Couldn't get last split at '='")
                .parse::<usize>()
                .unwrap_or(1);
            total_pages = total_page;
        }
        None => {
            total_pages = 1;
        }
    };

    return total_pages;
}

async fn get_page_chapter_urls(novel_data: &NovelData, page: usize) -> Vec<super::Chapter> {
    let page_html = super::fetch_html(
        &format!("{}?page={}", novel_data.novel_url, page),
        &novel_data.cf_headers,
        super::types::FetchType::GET,
    )
    .await
    .unwrap();
    let document = kuchikiki::parse_html().one(page_html);

    let mut page_chapters: Vec<super::Chapter> = vec![];
    document
        .select("#list-chapter .row ul.list-chapter > li")
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
                url: format!("{}{}", novel_data.source_url, url),
                content: None,
            };
            page_chapters.push(chapter);
        });

    return page_chapters;
}

fn get_chapter_content(chapter: &mut super::Chapter, chapter_html: &str) {
    let document = kuchikiki::parse_html().one(chapter_html);
    let chapter_content_node = document.select_first("#chapter-content").unwrap();
    let mut chapter_content_html =
        super::clean_chapter_html(&mut chapter_content_node.as_node().to_string());

    let error_re = Regex::new(r#"<div align="left"[\s\S]*?If you find any errors \( Ads popup, ads redirect, broken links, non-standard content, etc.. \)[\s\S]*?<\/div>"#).unwrap();
    chapter_content_html = error_re.replace_all(&chapter_content_html, "").to_string();

    chapter.content = Some(chapter_content_html);
}
