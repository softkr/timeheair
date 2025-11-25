use tauri_plugin_shell::ShellExt;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            // 백엔드 sidecar 시작
            let sidecar_command = app.shell().sidecar("timehair-backend").unwrap();
            let (mut _rx, mut _child) = sidecar_command
                .spawn()
                .expect("Failed to spawn backend sidecar");

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
