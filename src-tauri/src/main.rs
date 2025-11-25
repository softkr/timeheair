#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::Manager;
use tauri_plugin_shell::ShellExt;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            // 리소스 경로에서 DB 파일 경로 가져오기
            let resource_path = app
                .path()
                .resource_dir()
                .expect("Failed to get resource dir");
            let db_path = resource_path.join("timehair.db");

            println!("DB Path: {:?}", db_path);

            // 백엔드 sidecar 실행 (DB_PATH 환경변수 설정)
            let sidecar_command = app
                .shell()
                .sidecar("timehair-backend")
                .unwrap()
                .env("DB_PATH", db_path.to_string_lossy().to_string());

            let (mut _rx, mut _child) = sidecar_command
                .spawn()
                .expect("Failed to spawn backend sidecar");

            println!("Backend sidecar started successfully");
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
