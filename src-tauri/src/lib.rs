mod docker;
mod source;

use source::types::{Chapter, DownloadData, DownloadStatus, NovelData};
use std::collections::HashMap;
use std::sync::Mutex;
use tauri::{AppHandle, Emitter, Manager, State};
use tauri_plugin_updater::UpdaterExt;

#[tauri::command(rename_all = "snake_case")]
async fn download_novel_chapters(
    app: AppHandle,
    state: State<'_, Mutex<AppState>>,
    novel_id: &str,
    novel_url: &str,
    source_id: &str,
    source_url: &str,
    batch_size: usize,
    batch_delay: usize,
    start_downloading_from_index: usize,
    cf_headers: Option<HashMap<String, String>>,
) -> Result<Vec<Chapter>, String> {
    source::update_novel_download_status(&state, novel_id, &DownloadStatus::Downloading)
        .await
        .unwrap();
    match source::download_novel_chapters(
        &app,
        &state,
        NovelData {
            novel_id: novel_id.to_string(),
            novel_url: novel_url.to_string(),
            source_id: source_id.to_string(),
            source_url: source_url.to_string(),
            batch_size,
            batch_delay,
            start_downloading_from_index,
            cf_headers,
        },
    )
    .await
    {
        Ok(chapters) => {
            app.emit(
                "download-status",
                DownloadData {
                    novel_id: novel_id.to_string(),
                    status: DownloadStatus::Completed,
                    downloaded_chapters_count: chapters.len(),
                    downloaded_chapters: Some(chapters.clone()),
                },
            )
            .unwrap();
            Ok(chapters)
        }
        Err(e) => {
            app.emit(
                "download-status",
                DownloadData {
                    novel_id: novel_id.to_string(),
                    status: DownloadStatus::Error,
                    downloaded_chapters_count: 0,
                    downloaded_chapters: None,
                },
            )
            .unwrap();
            Err(e)
        }
    }
}

#[tauri::command(rename_all = "snake_case")]
async fn fetch_html(
    url: &str,
    headers: Option<HashMap<String, String>>,
    fetch_type: source::types::FetchType,
) -> Result<String, String> {
    source::fetch_html(url, &headers, fetch_type).await
}

#[tauri::command]
async fn fetch_image(
    url: &str,
    headers: Option<HashMap<String, String>>,
) -> Result<Vec<u8>, String> {
    source::fetch_image(url, &headers).await
}

#[tauri::command]
fn check_docker_status(app: AppHandle) -> bool {
    let is_started = docker::check_docker_status(&app);
    return is_started;
}

#[tauri::command]
fn start_cloudflare_resolver(app: AppHandle, port: usize) -> bool {
    let is_started = docker::start_cloudflare_resolver(&app, port);
    return is_started;
}

#[tauri::command]
fn stop_cloudflare_resolver(app: AppHandle) -> bool {
    return docker::stop_cloudflare_resolver(&app);
}

#[derive(Default)]
struct AppState {
    novel_status: HashMap<String, source::types::DownloadStatus>,
}
#[tauri::command(rename_all = "snake_case")]
async fn update_novel_download_status(
    state: State<'_, Mutex<AppState>>,
    novel_id: &str,
    status: source::types::DownloadStatus,
) -> Result<source::types::DownloadStatus, ()> {
    println!("update_novel_download_status: {:?}", status);
    return source::update_novel_download_status(&state, novel_id, &status).await;
}

#[tauri::command]
async fn check_for_update(app: AppHandle) -> Result<String, String> {
    if let Some(update) = app.updater().unwrap().check().await.unwrap() {
        return Ok(update.version);
    }
    return Err("No updates available".to_string());
}

#[tauri::command]
async fn install_update(app: tauri::AppHandle) -> tauri_plugin_updater::Result<()> {
    if let Some(update) = app.updater()?.check().await? {
        let mut downloaded = 0;

        // alternatively we could also call update.download() and update.install() separately
        update
            .download_and_install(
                |chunk_length, content_length| {
                    downloaded += chunk_length;
                    println!("downloaded {downloaded} from {content_length:?}");
                },
                || {
                    println!("download finished");
                },
            )
            .await?;

        println!("update installed");
        app.restart();
    }

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            app.manage(Mutex::new(AppState::default()));
            Ok(())
        })
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_persisted_scope::init())
        .invoke_handler(tauri::generate_handler![
            fetch_html,
            fetch_image,
            download_novel_chapters,
            update_novel_download_status,
            check_docker_status,
            start_cloudflare_resolver,
            stop_cloudflare_resolver,
            check_for_update,
            install_update
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
