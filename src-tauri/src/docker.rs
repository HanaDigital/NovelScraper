use std::{thread::sleep, time::Duration};

use tauri::AppHandle;
use tauri_plugin_os::arch;
use tauri_plugin_shell::ShellExt;

pub fn check_docker_status(app: &AppHandle) -> Result<bool, String> {
    let shell = app.shell();
    match tauri::async_runtime::block_on(async move {
        shell.command("docker").args(["ps"]).output().await
    }) {
        Ok(output) => {
            if output.status.success() {
                return Ok(true);
            } else {
                return Err(String::from_utf8(output.stderr).unwrap());
            }
        }
        Err(e) => {
            println!("Error: {}", e);
            return Err(e.to_string());
        }
    }
}

pub fn start_cloudflare_resolver(app: &AppHandle, port: usize) -> Result<bool, String> {
    let shell = app.shell();
    let start_cmd = ["start", "novelscraper-cloudflare-resolver"];

    match tauri::async_runtime::block_on(async move {
        shell.command("docker").args(start_cmd).output().await
    }) {
        Ok(start_output) => {
            if start_output.status.success() {
                return Ok(true);
            }
        }
        Err(e) => {
            println!("Error: {}", e);
            return Err(e.to_string());
        }
    }

    let image = if arch() == "aarch64" {
        sleep(Duration::from_secs(1));
        "drnyt/cf-clearance-scraper-arm64:latest"
    } else {
        "zfcsoftware/cf-clearance-scraper:latest"
    };
    let port_link = format!("{port}:3000");
    let run_cmd = [
        "run",
        "-d",
        "--name",
        "novelscraper-cloudflare-resolver",
        "-p",
        port_link.as_str(),
        "-e",
        "browserLimit=20",
        "-e",
        "timeOut=60000",
        image,
    ];

    match tauri::async_runtime::block_on(async move {
        shell.command("docker").args(run_cmd).output().await
    }) {
        Ok(run_output) => {
            if run_output.status.success() {
                return Ok(true);
            } else {
                return Err(String::from_utf8(run_output.stderr).unwrap());
            }
        }
        Err(e) => {
            println!("Error: {}", e);
            return Err(e.to_string());
        }
    }
}

pub fn stop_cloudflare_resolver(app: &AppHandle) -> Result<bool, String> {
    let shell = app.shell();
    match tauri::async_runtime::block_on(async move {
        shell
            .command("docker")
            .args(["stop", "novelscraper-cloudflare-resolver"])
            .output()
            .await
    }) {
        Ok(output) => {
            if output.status.success() {
                return Ok(true);
            } else {
                return Err(String::from_utf8(output.stderr).unwrap());
            }
        }
        Err(e) => {
            println!("Error: {}", e);
            return Err(e.to_string());
        }
    }
}
