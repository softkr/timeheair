#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::Manager;
use tauri_plugin_shell::ShellExt;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .setup(|app| {
            // 리소스 경로에서 DB 파일 경로 가져오기
            let resource_path = app
                .path()
                .resource_dir()
                .expect("Failed to get resource dir");
            let db_path = resource_path.join("timehair.db");

            println!("DB Path: {:?}", db_path);

            // 백엔드 sidecar 실행 (DB_PATH 환경변수 설정)
            match app.shell().sidecar("timehair-backend") {
                Ok(sidecar_command) => {
                    let sidecar_with_env =
                        sidecar_command.env("DB_PATH", db_path.to_string_lossy().to_string());

                    match sidecar_with_env.spawn() {
                        Ok((mut _rx, mut _child)) => {
                            println!("Backend sidecar started successfully");
                        }
                        Err(e) => {
                            eprintln!("Failed to spawn backend sidecar: {:?}", e);
                            // 백엔드 없이도 프론트엔드는 실행되도록 함
                        }
                    }
                }
                Err(e) => {
                    eprintln!("Failed to create sidecar command: {:?}", e);
                    // 백엔드 없이도 프론트엔드는 실행되도록 함
                }
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
