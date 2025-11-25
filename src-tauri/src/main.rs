#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri_plugin_shell::ShellExt;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            // 백엔드 sidecar 실행
            let sidecar_command = app.shell().sidecar("timehair-backend").unwrap();
            let (mut _rx, mut _child) = sidecar_command.spawn().expect("Failed to spawn backend sidecar");

            println!("Backend sidecar started successfully");
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
