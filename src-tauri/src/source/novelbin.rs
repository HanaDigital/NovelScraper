use crate::AppState;

use super::types::{NovelData, SourceDownloadResult};
use kuchikiki::traits::*;
use regex::Regex;
use std::vec;
use tauri::AppHandle;

pub async fn download_novel_chapters(
    app: &AppHandle,
    state: &tauri::State<'_, std::sync::Mutex<AppState>>,
    novel_data: &NovelData,
) -> Result<SourceDownloadResult, String> {
    let mut chapters = get_chapter_urls(novel_data).await?;
    // Remove chapters that have already been downloaded
    chapters.drain(0..novel_data.pre_downloaded_chapters_count);

    super::download_chapters(
        app,
        state,
        novel_data,
        chapters,
        get_chapter_content_from_html,
        0,
    )
    .await
}

async fn get_chapter_urls(novel_data: &NovelData) -> Result<Vec<super::Chapter>, String> {
    let Some(novel_id) = novel_data.novel_url.split("/").last() else {
        return Err("Couldn't get novel id".to_string());
    };
    let page_html = super::fetch_html(
        &format!(
            "{}/ajax/chapter-archive?novelId={}",
            novel_data.source_url, novel_id
        ),
        &novel_data.cf_headers,
        super::types::FetchType::GET,
    )
    .await?;
    let document = kuchikiki::parse_html().one(page_html);

    let mut chapters: Vec<super::Chapter> = vec![];
    let chapter_link_elems = document
        .select("ul.list-chapter li a")
        .map_err(|_| format!("Couldn't find chapter link nodes"))?;

    for link_elem in chapter_link_elems {
        let title = link_elem.text_contents().trim().to_string();
        let attributes = link_elem.attributes.borrow();
        let Some(url) = attributes.get("href") else {
            return Err(format!("Couldn't get chapter url for {}", title));
        };
        let chapter = super::Chapter {
            title,
            url: url.to_string(),
            content: None,
        };
        chapters.push(chapter);
    }

    return Ok(chapters);
}

fn get_chapter_content_from_html(
    chapter: &mut super::Chapter,
    chapter_html: &str,
) -> Result<(), String> {
    let document = kuchikiki::parse_html().one(chapter_html);

    let chapter_content_node = document
        .select_first("#chr-content")
        .map_err(|_| format!("Couldn't find chapter content node for {}", chapter.title))?;

    let mut chapter_content_html =
        super::clean_chapter_html(&mut chapter_content_node.as_node().to_string());

    let chapter_title = document
        .select_first("#chapter .chr-title")
        .map_err(|_| format!("Couldn't find chapter title node for {}", chapter.title))?
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
    Ok(())
}
