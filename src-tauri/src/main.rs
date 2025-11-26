#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::process::Command;
use tauri::Manager;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .setup(|app| {
            // 리소스 경로에서 DB 파일 및 백엔드 바이너리 경로 가져오기
            let resource_path = app
                .path()
                .resource_dir()
                .expect("Failed to get resource dir");
            let db_path = resource_path.join("timehair.db");

            println!("Resource Path: {:?}", resource_path);
            println!("DB Path: {:?}", db_path);

            // 플랫폼별 백엔드 바이너리 이름 결정
            let backend_name = if cfg!(target_os = "windows") {
                "timehair-backend-x86_64-pc-windows-msvc.exe"
            } else if cfg!(target_os = "macos") {
                if cfg!(target_arch = "aarch64") {
                    "timehair-backend-aarch64-apple-darwin"
                } else {
                    "timehair-backend-x86_64-apple-darwin"
                }
            } else {
                "timehair-backend-x86_64-unknown-linux-gnu"
            };

            let backend_path = resource_path.join("binaries").join(backend_name);
            println!("Backend Path: {:?}", backend_path);

            // 백엔드 실행
            if backend_path.exists() {
                match Command::new(&backend_path)
                    .env("DB_PATH", db_path.to_string_lossy().to_string())
                    .spawn()
                {
                    Ok(mut child) => {
                        println!("Backend started successfully with PID: {:?}", child.id());
                        // 백엔드를 백그라운드에서 실행
                        std::thread::spawn(move || {
                            let _ = child.wait();
                        });
                    }
                    Err(e) => {
                        eprintln!("Failed to start backend: {:?}", e);
                    }
                }
            } else {
                eprintln!("Backend binary not found at: {:?}", backend_path);
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
