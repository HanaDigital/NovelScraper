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
    let mut chapters = get_chapter_urls(novel_data).await;
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

async fn get_chapter_urls(novel_data: &NovelData) -> Vec<super::Chapter> {
    let novel_id = novel_data
        .novel_url
        .split("/")
        .last()
        .expect(format!("Couldn't get novel id for {}", novel_data.novel_title).as_str());
    let page_html = super::fetch_html(
        &format!(
            "{}/ajax/chapter-archive?novelId={}",
            novel_data.source_url, novel_id
        ),
        &novel_data.cf_headers,
        super::types::FetchType::GET,
    )
    .await
    .expect(
        format!(
            "Couldn't fetch chapters html for {}",
            novel_data.novel_title
        )
        .as_str(),
    );
    let document = kuchikiki::parse_html().one(page_html);

    let mut chapters: Vec<super::Chapter> = vec![];
    document
        .select("ul.list-chapter li")
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

    return chapters;
}

fn get_chapter_content_from_html(
    novel_data: &NovelData,
    chapter: &mut super::Chapter,
    chapter_html: &str,
) -> Result<(), String> {
    let document = kuchikiki::parse_html().one(chapter_html);

    let chapter_content_node = document.select_first("#chr-content").expect(
        format!(
            "Couldn't find chapter content node for {} : {}",
            novel_data.novel_title, chapter.title
        )
        .as_str(),
    );
    let mut chapter_content_html =
        super::clean_chapter_html(&mut chapter_content_node.as_node().to_string());

    let chapter_title = document
        .select_first("#chapter .chr-title")
        .expect(
            format!(
                "Couldn't find chapter title node for {} : {}",
                novel_data.novel_title, chapter.title
            )
            .as_str(),
        )
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
