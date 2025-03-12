use crate::AppState;

use super::types::{NovelData, SourceDownloadResult};
use kuchikiki::traits::*;
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
    let page_html = super::fetch_html(
        &format!("{}ajax/chapters", novel_data.novel_url),
        &novel_data.cf_headers,
        super::types::FetchType::POST,
    )
    .await
    .expect(format!("Couldn't fetch html for {}", novel_data.novel_title).as_str());
    let document = kuchikiki::parse_html().one(page_html);

    let mut chapters: Vec<super::Chapter> = vec![];
    document
        .select("li.wp-manga-chapter a")
        .expect(format!("Couldn't find chapter links for {}", novel_data.novel_title).as_str())
        .rev()
        .for_each(|chapter_elem| {
            let title = chapter_elem.text_contents().trim().to_string();
            let url = chapter_elem
                .attributes
                .borrow()
                .get("href")
                .expect(
                    format!(
                        "Couldn't get chapter url for {} : {}",
                        novel_data.novel_title, title
                    )
                    .as_str(),
                )
                .to_string();
            let chapter = super::Chapter {
                title,
                url,
                content: None,
            };
            chapters.push(chapter);
        });

    return Ok(chapters);
}

fn get_chapter_content_from_html(
    novel_data: &NovelData,
    chapter: &mut super::Chapter,
    chapter_html: &str,
) -> Result<(), String> {
    let document = kuchikiki::parse_html().one(chapter_html);

    let chapter_content_node = document
        .select_first(".c-blog-post .entry-content .reading-content .text-left")
        .expect(
            format!(
                "Couldn't find chapter content node for {} : {}",
                novel_data.novel_title, chapter.title
            )
            .as_str(),
        );
    let chapter_content_html =
        super::clean_chapter_html(&mut chapter_content_node.as_node().to_string());

    chapter.content = Some(chapter_content_html);
    Ok(())
}
