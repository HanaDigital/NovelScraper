use crate::AppState;

use super::download_chapters;
use super::types::{DownloadStatus, NovelData, SourceDownloadResult};
use kuchikiki::traits::*;
use regex::Regex;
use std::sync::Mutex;
use std::vec;
use tauri::{AppHandle, State};

pub async fn download_novel_chapters(
    app: &AppHandle,
    state: &State<'_, Mutex<AppState>>,
    novel_data: &NovelData,
) -> Result<SourceDownloadResult, String> {
    let mut downloaded_chapters: Vec<super::Chapter> = vec![];

    let total_pages = get_total_pages(novel_data).await?;
    let max_chapters_per_page = get_page_chapter_urls(&novel_data, 1).await?.len();
    let starting_page = (novel_data.pre_downloaded_chapters_count as f32
        / max_chapters_per_page as f32)
        .floor() as usize
        + 1;

    for page_num in starting_page..=total_pages {
        // Get all the chapters on the current page
        let mut page_chapters = get_page_chapter_urls(&novel_data, page_num).await?;

        let batch_offset: i32 = novel_data.pre_downloaded_chapters_count as i32
            - ((page_num - 1) * max_chapters_per_page) as i32;
        if batch_offset > 0 {
            page_chapters.drain(0..batch_offset as usize);
        }

        let res = download_chapters(
            app,
            state,
            novel_data,
            page_chapters,
            get_chapter_content_from_html,
            downloaded_chapters.len(),
        )
        .await;

        if res.is_err() {
            return res;
        }

        let res_status = res.as_ref().unwrap().status.clone();
        downloaded_chapters.extend(res.unwrap().chapters.clone());

        if res_status != DownloadStatus::Completed {
            return Ok(SourceDownloadResult {
                status: res_status,
                chapters: downloaded_chapters,
            });
        }
    }

    return Ok(SourceDownloadResult {
        status: DownloadStatus::Completed,
        chapters: downloaded_chapters,
    });
}

async fn get_total_pages(novel_data: &NovelData) -> Result<usize, String> {
    let novel_html = super::fetch_html(
        &novel_data.novel_url,
        &novel_data.cf_headers,
        super::types::FetchType::GET,
    )
    .await?;
    let document = kuchikiki::parse_html().one(novel_html);

    let total_pages;

    let last_page_node = match document.select("#list-chapter ul.pagination > li.last a") {
        Ok(mut nodes) => nodes.next(),
        Err(_) => None,
    };

    match last_page_node {
        Some(node) => {
            let last_page_url = node
                .attributes
                .borrow()
                .get("href")
                .expect(
                    format!("Couldn't get last page url for {}", novel_data.novel_title).as_str(),
                )
                .to_string();
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

    return Ok(total_pages);
}

async fn get_page_chapter_urls(
    novel_data: &NovelData,
    page: usize,
) -> Result<Vec<super::Chapter>, String> {
    let page_html = super::fetch_html(
        &format!("{}?page={}", novel_data.novel_url, page),
        &novel_data.cf_headers,
        super::types::FetchType::GET,
    )
    .await?;
    let document = kuchikiki::parse_html().one(page_html);

    let mut page_chapters: Vec<super::Chapter> = vec![];
    document
        .select("#list-chapter .row ul.list-chapter > li")
        .expect(format!("Couldn't find chapter links for {}", novel_data.novel_title).as_str())
        .for_each(|chapter_elem| {
            let chapter_link_elem = chapter_elem.as_node().select_first("a").expect(
                format!(
                    "Couldn't find chapter link for {} : {}",
                    novel_data.novel_title,
                    chapter_elem.as_node().to_string()
                )
                .as_str(),
            );
            let title = chapter_link_elem.text_contents().trim().to_string();
            let url = chapter_link_elem
                .attributes
                .borrow()
                .get("href")
                .expect(
                    format!(
                        "Couldn't get chapter url for {}:{}",
                        novel_data.novel_title, title
                    )
                    .as_str(),
                )
                .to_string();
            let chapter = super::Chapter {
                title,
                url: format!("{}{}", novel_data.source_url, url),
                content: None,
            };
            page_chapters.push(chapter);
        });

    return Ok(page_chapters);
}

fn get_chapter_content_from_html(
    novel_data: &NovelData,
    chapter: &mut super::Chapter,
    chapter_html: &str,
) -> Result<(), String> {
    let document = kuchikiki::parse_html().one(chapter_html);
    let chapter_content_node = document.select_first("#chapter-content").expect(
        format!(
            "Couldn't find chapter content node for {} : {}",
            novel_data.novel_title, chapter.title
        )
        .as_str(),
    );
    let mut chapter_content_html =
        super::clean_chapter_html(&mut chapter_content_node.as_node().to_string());

    let error_re = Regex::new(
        r#"<div align="left"[\s\S]*?If you find any errors \( Ads popup, ads redirect, broken links, non-standard content, etc.. \)[\s\S]*?<\/div>"#,
    ).unwrap();
    chapter_content_html = error_re.replace_all(&chapter_content_html, "").to_string();

    chapter.content = Some(chapter_content_html);
    Ok(())
}
