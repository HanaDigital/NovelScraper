pub mod novelbin;
pub mod novelfull;
pub mod types;

use std::collections::HashMap;

use isahc::{prelude::*, Request};
use regex::Regex;
use std::sync::Mutex;
use tauri::{AppHandle, State};
use types::{Chapter, DownloadStatus, FetchType, NovelData};

use crate::AppState;

pub async fn download_novel_chapters(
    app: &AppHandle,
    state: &State<'_, Mutex<AppState>>,
    novel_data: NovelData,
) -> Result<Vec<Chapter>, String> {
    if novel_data.source_id == "novelfull" {
        return novelfull::download_novel_chapters(app, state, novel_data).await;
    } else if novel_data.source_id == "novelbin" {
        return novelbin::download_novel_chapters(app, state, novel_data).await;
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
    // println!("!!!URL & HEADERS: {}\n{:?}", url, headers);
    if headers.is_some() {
        for (key, value) in headers.as_ref().unwrap() {
            req_builder = req_builder.header(key, value);
        }
    }

    let res_result = req_builder.body(()).unwrap().send();
    let mut res = match res_result {
        Ok(res) => res,
        Err(e) => {
            return Err(e.to_string());
        }
    };
    let text_result = res.text();
    // println!("!!!URL Response: {:?}", text_result);
    match text_result {
        Ok(text) => Ok(text),
        Err(e) => {
            return Err(e.to_string());
        }
    }
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

    let res_result = req_builder.body(()).unwrap().send();
    let mut res = match res_result {
        Ok(res) => res,
        Err(e) => {
            return Err(e.to_string());
        }
    };
    let bytes_result = res.bytes();
    match bytes_result {
        Ok(bytes) => Ok(bytes),
        Err(e) => {
            return Err(e.to_string());
        }
    }
}

pub async fn update_novel_download_status(
    state: &State<'_, Mutex<AppState>>,
    novel_id: &str,
    status: &types::DownloadStatus,
) -> Result<types::DownloadStatus, ()> {
    let mut state = state.lock().unwrap();
    state
        .novel_status
        .insert(novel_id.to_string(), status.clone());
    Ok(status.clone())
}

pub async fn is_novel_download_cancelled(
    state: &State<'_, Mutex<AppState>>,
    novel_id: &str,
) -> bool {
    let state = state.lock().unwrap();
    return state.novel_status.get(novel_id).unwrap() == &DownloadStatus::Cancelled;
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
