use std::collections::HashMap;

use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, Serialize)]
pub struct NovelData {
    pub novel_id: String,
    pub novel_title: String,
    pub novel_url: String,
    pub source_id: String,
    pub source_url: String,
    pub batch_size: usize,
    pub batch_delay: usize,
    pub pre_downloaded_chapters_count: usize,
    pub cf_headers: Option<HashMap<String, String>>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Chapter {
    pub title: String,
    pub url: String,
    pub content: Option<String>,
}

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
pub enum DownloadStatus {
    Downloading,
    Paused,
    Completed,
    Cancelled,
    Error,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct DownloadData {
    pub novel_id: String,
    pub status: DownloadStatus,
    pub downloaded_chapters_count: usize,
    pub downloaded_chapters: Option<Vec<Chapter>>,
}

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
pub enum FetchType {
    GET,
    POST,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct SourceDownloadResult {
    pub status: DownloadStatus,
    pub chapters: Vec<Chapter>,
}
