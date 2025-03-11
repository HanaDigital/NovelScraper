use std::{thread::sleep, time::Duration};

use tauri::AppHandle;
use tauri_plugin_os::arch;
use tauri_plugin_shell::ShellExt;

pub fn check_docker_status(app: &AppHandle) -> bool {
    let shell = app.shell();
    match tauri::async_runtime::block_on(async move {
        shell.command("docker").args(["ps"]).output().await
    }) {
        Ok(output) => {
            if output.status.success() {
                println!("Result: {:?}", String::from_utf8(output.stdout));
                return true;
            } else {
                println!("Exit with code: {}", output.status.code().unwrap());
                return false;
            }
        }
        Err(e) => {
            println!("Error: {}", e);
            return false;
        }
    }
}

pub fn start_cloudflare_resolver(app: &AppHandle, port: usize) -> bool {
    if !check_docker_status(app) {
        return false;
    }

    let shell = app.shell();
    let start_cmd = ["start", "novelscraper-cloudflare-resolver"];

    match tauri::async_runtime::block_on(async move {
        shell.command("docker").args(start_cmd).output().await
    }) {
        Ok(start_output) => {
            if start_output.status.success() {
                println!("Result: {:?}", String::from_utf8(start_output.stdout));
                return true;
            } else {
                println!("Exit with code: {}", start_output.status.code().unwrap());
                println!("Error: {:?}", String::from_utf8(start_output.stderr));
            }
        }
        Err(e) => {
            println!("Error: {}", e);
            return false;
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
                println!("Result: {:?}", String::from_utf8(run_output.stdout));
                return true;
            } else {
                println!("Exit with code: {}", run_output.status.code().unwrap());
                println!("Error: {:?}", String::from_utf8(run_output.stderr));
                return false;
            }
        }
        Err(e) => {
            println!("Error: {}", e);
            return false;
        }
    }
}

pub fn stop_cloudflare_resolver(app: &AppHandle) -> bool {
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
                println!("Result: {:?}", String::from_utf8(output.stdout));
                return true;
            } else {
                println!("Exit with code: {}", output.status.code().unwrap());
                return false;
            }
        }
        Err(e) => {
            println!("Error: {}", e);
            return false;
        }
    }
}
