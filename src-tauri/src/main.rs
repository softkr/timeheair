#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod auth;
mod database;
mod models;

use models::*;
use tauri::Manager;

// ==================== Auth Commands ====================
#[tauri::command]
fn login(request: LoginRequest) -> Result<LoginResponse, String> {
    auth::login(request)
}

#[tauri::command]
fn get_current_user(token: String) -> Result<UserInfo, String> {
    auth::get_current_user(&token)
}

// ==================== Member Commands ====================
#[tauri::command]
fn get_members(search: Option<String>) -> Vec<Member> {
    database::get_members(search.as_deref())
}

#[tauri::command]
fn get_member(id: String) -> Result<Member, String> {
    database::get_member_by_id(&id).ok_or("회원을 찾을 수 없습니다".to_string())
}

#[tauri::command]
fn search_member_by_phone(phone: String) -> Result<Member, String> {
    database::get_member_by_phone(&phone).ok_or("회원을 찾을 수 없습니다".to_string())
}

#[tauri::command]
fn create_member(request: CreateMemberRequest) -> Result<Member, String> {
    // Check if phone already exists
    if database::phone_exists(&request.phone, None) {
        return Err("이미 등록된 전화번호입니다".to_string());
    }

    database::create_member(&request.name, &request.phone)
        .map_err(|e| format!("회원 생성 실패: {}", e))
}

#[tauri::command]
fn update_member(id: String, request: UpdateMemberRequest) -> Result<Member, String> {
    // Check if phone already exists (excluding current member)
    if database::phone_exists(&request.phone, Some(&id)) {
        return Err("이미 등록된 전화번호입니다".to_string());
    }

    database::update_member(&id, &request.name, &request.phone)
        .map_err(|e| format!("회원 수정 실패: {}", e))
}

#[tauri::command]
fn delete_member(id: String) -> Result<(), String> {
    database::delete_member(&id).map_err(|e| format!("회원 삭제 실패: {}", e))
}

#[tauri::command]
fn add_stamp(id: String) -> Result<Member, String> {
    database::add_stamp(&id).map_err(|e| format!("스탬프 추가 실패: {}", e))
}

#[tauri::command]
fn reset_stamps(id: String) -> Result<Member, String> {
    database::reset_stamps(&id).map_err(|e| format!("스탬프 초기화 실패: {}", e))
}

// ==================== Staff Commands ====================
#[tauri::command]
fn get_staff_list() -> Vec<Staff> {
    database::get_staff_list()
}

#[tauri::command]
fn get_staff(id: String) -> Result<Staff, String> {
    database::get_staff_by_id(&id).ok_or("직원을 찾을 수 없습니다".to_string())
}

#[tauri::command]
fn create_staff(request: CreateStaffRequest) -> Result<Staff, String> {
    database::create_staff(&request.name).map_err(|e| format!("직원 생성 실패: {}", e))
}

#[tauri::command]
fn update_staff(id: String, request: UpdateStaffRequest) -> Result<Staff, String> {
    database::update_staff(&id, &request.name).map_err(|e| format!("직원 수정 실패: {}", e))
}

#[tauri::command]
fn delete_staff(id: String) -> Result<(), String> {
    database::delete_staff(&id).map_err(|e| format!("직원 삭제 실패: {}", e))
}

// ==================== Seat Commands ====================
#[tauri::command]
fn get_seats() -> Vec<Seat> {
    database::get_seats()
}

#[tauri::command]
fn get_seat(id: i32) -> Result<Seat, String> {
    database::get_seat_by_id(id).ok_or("좌석을 찾을 수 없습니다".to_string())
}

#[tauri::command]
fn start_service(id: i32, request: StartServiceRequest) -> Result<Seat, String> {
    // Check if seat is available
    let seat = database::get_seat_by_id(id).ok_or("좌석을 찾을 수 없습니다")?;

    if seat.status != SeatStatus::Available && seat.status != SeatStatus::Reserved {
        return Err("이미 사용 중인 좌석입니다".to_string());
    }

    // Create service session
    database::create_session(
        id,
        request.member_id.as_deref(),
        &request.member_name,
        &request.staff_id,
        &request.staff_name,
        &request.services,
        request.total_price,
        request.reservation_id.as_deref(),
    )
    .map_err(|e| format!("세션 생성 실패: {}", e))?;

    // Update seat status
    database::update_seat_status(id, SeatStatus::InUse)
        .map_err(|e| format!("좌석 상태 업데이트 실패: {}", e))?;

    // Update reservation status if exists
    if let Some(reservation_id) = &request.reservation_id {
        let _ = database::update_reservation_status(reservation_id, ReservationStatus::InProgress);
    }

    database::get_seat_by_id(id).ok_or("좌석을 찾을 수 없습니다".to_string())
}

#[tauri::command]
fn complete_service(id: i32) -> Result<LedgerEntry, String> {
    // Get current session
    let session = database::get_session_by_seat_id(id).ok_or("진행 중인 서비스가 없습니다")?;

    // Create ledger entry
    let ledger_entry =
        database::create_ledger_entry(&session).map_err(|e| format!("매출 기록 실패: {}", e))?;

    // Add stamp if member exists
    if let Some(member_id) = &session.member_id {
        let _ = database::add_stamp(member_id);
    }

    // Update reservation status if exists
    if let Some(reservation_id) = &session.reservation_id {
        let _ = database::update_reservation_status(reservation_id, ReservationStatus::Completed);
    }

    // Delete session and update seat status
    database::delete_session(id).map_err(|e| format!("세션 삭제 실패: {}", e))?;
    database::update_seat_status(id, SeatStatus::Available)
        .map_err(|e| format!("좌석 상태 업데이트 실패: {}", e))?;

    Ok(ledger_entry)
}

#[tauri::command]
fn cancel_service(id: i32) -> Result<(), String> {
    // Get current session
    let session = database::get_session_by_seat_id(id).ok_or("진행 중인 서비스가 없습니다")?;

    // Update reservation status back to scheduled if exists
    if let Some(reservation_id) = &session.reservation_id {
        let _ = database::update_reservation_status(reservation_id, ReservationStatus::Scheduled);
    }

    // Delete session and update seat status
    database::delete_session(id).map_err(|e| format!("세션 삭제 실패: {}", e))?;
    database::update_seat_status(id, SeatStatus::Available)
        .map_err(|e| format!("좌석 상태 업데이트 실패: {}", e))?;

    Ok(())
}

// ==================== Reservation Commands ====================
#[tauri::command]
fn get_reservations(
    status: Option<String>,
    date: Option<String>,
    all: Option<String>,
) -> Vec<Reservation> {
    let query = ReservationQuery { status, date, all };
    database::get_reservations(&query)
}

#[tauri::command]
fn get_reservation(id: String) -> Result<Reservation, String> {
    database::get_reservation_by_id(&id).ok_or("예약을 찾을 수 없습니다".to_string())
}

#[tauri::command]
fn create_reservation(request: CreateReservationRequest) -> Result<Reservation, String> {
    database::create_reservation(&request).map_err(|e| format!("예약 생성 실패: {}", e))
}

#[tauri::command]
fn update_reservation(
    id: String,
    request: UpdateReservationRequest,
) -> Result<Reservation, String> {
    database::update_reservation(&id, &request).map_err(|e| format!("예약 수정 실패: {}", e))
}

#[tauri::command]
fn update_reservation_status(
    id: String,
    request: UpdateReservationStatusRequest,
) -> Result<Reservation, String> {
    database::update_reservation_status(&id, request.status)
        .map_err(|e| format!("예약 상태 업데이트 실패: {}", e))
}

#[tauri::command]
fn delete_reservation(id: String) -> Result<(), String> {
    database::delete_reservation(&id).map_err(|e| format!("예약 삭제 실패: {}", e))
}

// ==================== Backup Commands ====================
#[tauri::command]
fn backup_database(path: String) -> Result<(), String> {
    database::backup_database(&path)
}

#[tauri::command]
fn restore_database(path: String) -> Result<(), String> {
    database::restore_database(&path)
}

#[tauri::command]
fn get_db_path() -> Result<String, String> {
    database::get_db_path()
        .map(|p| p.to_string_lossy().to_string())
        .ok_or("DB 경로를 찾을 수 없습니다".to_string())
}

// ==================== Ledger Commands ====================
#[tauri::command]
fn get_ledger_entries(
    date: Option<String>,
    start_date: Option<String>,
    end_date: Option<String>,
    staff_id: Option<String>,
) -> Vec<LedgerEntry> {
    let query = LedgerQuery {
        date,
        start_date,
        end_date,
        staff_id,
    };
    database::get_ledger_entries(&query)
}

#[tauri::command]
fn get_ledger_summary(
    date: Option<String>,
    start_date: Option<String>,
    end_date: Option<String>,
) -> LedgerSummary {
    let query = LedgerQuery {
        date,
        start_date,
        end_date,
        staff_id: None,
    };
    database::get_ledger_summary(&query)
}

#[tauri::command]
fn get_daily_summary(year: Option<i32>, month: Option<u32>) -> Vec<DailySummary> {
    let now = chrono::Utc::now();
    let y = year.unwrap_or(now.format("%Y").to_string().parse().unwrap_or(2025));
    let m = month.unwrap_or(now.format("%m").to_string().parse().unwrap_or(1));
    database::get_daily_summary(y, m)
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            // Initialize database
            let app_data_dir = app
                .path()
                .app_data_dir()
                .expect("Failed to get app data dir");

            println!("App Data Dir: {:?}", app_data_dir);

            database::init_database(app_data_dir).expect("Failed to initialize database");

            println!("Database initialized successfully");

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // Auth
            login,
            get_current_user,
            // Members
            get_members,
            get_member,
            search_member_by_phone,
            create_member,
            update_member,
            delete_member,
            add_stamp,
            reset_stamps,
            // Staff
            get_staff_list,
            get_staff,
            create_staff,
            update_staff,
            delete_staff,
            // Seats
            get_seats,
            get_seat,
            start_service,
            complete_service,
            cancel_service,
            // Reservations
            get_reservations,
            get_reservation,
            create_reservation,
            update_reservation,
            update_reservation_status,
            delete_reservation,
            // Ledger
            get_ledger_entries,
            get_ledger_summary,
            get_daily_summary,
            // Backup
            backup_database,
            restore_database,
            get_db_path,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
