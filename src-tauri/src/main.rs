#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::process::Command;
use std::sync::{Arc, Mutex};
use tauri::{Manager, RunEvent, State};

#[derive(Debug, Default)]
struct AppState {
    // 향후 프로세스 추적을 위한 필드 (현재는 사용하지 않음)
    _backend_child: Arc<Mutex<Option<()>>>,
}

fn main() {
    let app = tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .manage(AppState::default())
        .setup(|app| {
            // 앱 데이터 디렉토리 경로 가져오기 (크로스플랫폼)
            let app_data_dir = app
                .path()
                .app_data_dir()
                .expect("Failed to get app data dir");
            let db_path = app_data_dir.join("timehair.db");

            // 리소스 경로는 백엔드 바이너리를 위해서만 사용
            let resource_path = app
                .path()
                .resource_dir()
                .expect("Failed to get resource dir");

            println!("App Data Dir: {:?}", app_data_dir);
            println!("DB Path: {:?}", db_path);
            println!("Resource Path: {:?}", resource_path);

            // 앱 상태 가져오기 (향후 확장용)
            let _state: State<AppState> = app.state();

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

            // 백엔드 실행 (백그라운드로)
            if backend_path.exists() {
                #[cfg(unix)]
                {
                    match Command::new(&backend_path)
                        .env("DB_PATH", db_path.to_string_lossy().to_string())
                        .spawn()
                    {
                        Ok(child) => {
                            println!("Backend started successfully with PID: {:?}", child.id());
                            // 자식 프로세스를 앱에서 관리하지 않고 독립적으로 실행
                            std::mem::forget(child);
                        }
                        Err(e) => {
                            eprintln!("Failed to start backend: {:?}", e);
                        }
                    }
                }

                #[cfg(windows)]
                {
                    // Windows에서 백그라운드로 프로세스 실행
                    use std::os::windows::process::CommandExt;

                    match Command::new("cmd")
                        .args(&["/C", "start", "/B", &backend_path.to_string_lossy()])
                        .env("DB_PATH", db_path.to_string_lossy().to_string())
                        .creation_flags(0x08000000) // CREATE_NO_WINDOW
                        .spawn()
                    {
                        Ok(child) => {
                            println!("Backend started successfully with PID: {:?}", child.id());
                            std::mem::forget(child);
                        }
                        Err(e) => {
                            eprintln!("Failed to start backend: {:?}", e);
                            // fallback: 일반 실행
                            match Command::new(&backend_path)
                                .env("DB_PATH", db_path.to_string_lossy().to_string())
                                .spawn()
                            {
                                Ok(child) => {
                                    println!(
                                        "Backend started (fallback) with PID: {:?}",
                                        child.id()
                                    );
                                    std::mem::forget(child);
                                }
                                Err(e2) => {
                                    eprintln!("Failed to start backend (fallback): {:?}", e2);
                                }
                            }
                        }
                    }
                }
            } else {
                eprintln!("Backend binary not found at: {:?}", backend_path);
            }

            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("error while building tauri application");

    // 앱 이벤트 루프 처리
    app.run(|_app_handle, event| {
        match event {
            RunEvent::ExitRequested { .. } => {
                // 앱 종료 요청 시 백엔드 프로세스 정리 시도
                println!("App exit requested, cleaning up backend process...");

                // Windows에서는 taskkill로 프로세스 종료 시도
                #[cfg(windows)]
                {
                    let _ = Command::new("taskkill")
                        .args(&["/F", "/IM", "timehair-backend-x86_64-pc-windows-msvc.exe"])
                        .spawn();
                }

                // Unix/Mac에서는 pkill 사용
                #[cfg(unix)]
                {
                    let _ = Command::new("pkill")
                        .args(&["-f", "timehair-backend"])
                        .spawn();
                }
            }
            _ => {}
        }
    });
}
