use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

// ==================== User (Admin) ====================
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct User {
    pub id: String,
    pub username: String,
    #[serde(skip_serializing)]
    pub password: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct LoginRequest {
    pub username: String,
    pub password: String,
}

#[derive(Debug, Serialize)]
pub struct LoginResponse {
    pub token: String,
    pub user: UserInfo,
}

#[derive(Debug, Serialize)]
pub struct UserInfo {
    pub id: String,
    pub username: String,
    pub created_at: DateTime<Utc>,
}

// ==================== Member (Customer) ====================
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Member {
    pub id: String,
    pub name: String,
    pub phone: String,
    pub stamps: i32,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct CreateMemberRequest {
    pub name: String,
    pub phone: String,
}

#[derive(Debug, Deserialize)]
pub struct UpdateMemberRequest {
    pub name: String,
    pub phone: String,
}

// ==================== Staff ====================
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Staff {
    pub id: String,
    pub name: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct CreateStaffRequest {
    pub name: String,
}

#[derive(Debug, Deserialize)]
pub struct UpdateStaffRequest {
    pub name: String,
}

// ==================== Seat ====================
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum SeatStatus {
    Available,
    InUse,
    Reserved,
}

impl SeatStatus {
    pub fn as_str(&self) -> &'static str {
        match self {
            SeatStatus::Available => "available",
            SeatStatus::InUse => "in_use",
            SeatStatus::Reserved => "reserved",
        }
    }

    pub fn from_str(s: &str) -> Self {
        match s {
            "in_use" => SeatStatus::InUse,
            "reserved" => SeatStatus::Reserved,
            _ => SeatStatus::Available,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Seat {
    pub id: i32,
    pub name: String,
    pub status: SeatStatus,
    pub current_session: Option<ServiceSession>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

// ==================== ServiceSession ====================
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ServiceSession {
    pub id: String,
    pub seat_id: i32,
    pub member_id: Option<String>,
    pub member_name: String,
    pub services: Vec<SelectedService>,
    pub total_price: i32,
    pub staff_id: String,
    pub staff_name: String,
    pub start_time: DateTime<Utc>,
    pub reservation_id: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct StartServiceRequest {
    pub member_id: Option<String>,
    pub member_name: String,
    pub staff_id: String,
    pub staff_name: String,
    pub services: Vec<ServiceInput>,
    pub total_price: i32,
    pub reservation_id: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct ServiceInput {
    pub name: String,
    pub length: Option<String>,
    pub price: i32,
}

// ==================== SelectedService ====================
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SelectedService {
    pub id: i32,
    pub service_session_id: Option<String>,
    pub reservation_id: Option<String>,
    pub ledger_entry_id: Option<String>,
    pub name: String,
    pub length: Option<String>,
    pub price: i32,
}

// ==================== Reservation ====================
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ReservationStatus {
    Scheduled,
    InProgress,
    Completed,
    Cancelled,
}

impl ReservationStatus {
    pub fn as_str(&self) -> &'static str {
        match self {
            ReservationStatus::Scheduled => "scheduled",
            ReservationStatus::InProgress => "in_progress",
            ReservationStatus::Completed => "completed",
            ReservationStatus::Cancelled => "cancelled",
        }
    }

    pub fn from_str(s: &str) -> Self {
        match s {
            "in_progress" => ReservationStatus::InProgress,
            "completed" => ReservationStatus::Completed,
            "cancelled" => ReservationStatus::Cancelled,
            _ => ReservationStatus::Scheduled,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Reservation {
    pub id: String,
    pub member_id: Option<String>,
    pub member_name: String,
    pub member_phone: Option<String>,
    pub seat_id: Option<i32>,
    pub staff_id: String,
    pub staff_name: String,
    pub services: Vec<SelectedService>,
    pub total_price: i32,
    pub reserved_at: DateTime<Utc>,
    pub estimated_duration: i32,
    pub status: ReservationStatus,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct CreateReservationRequest {
    pub member_id: Option<String>,
    pub member_name: String,
    pub member_phone: Option<String>,
    pub seat_id: Option<i32>,
    pub staff_id: String,
    pub staff_name: String,
    pub services: Vec<ServiceInput>,
    pub total_price: i32,
    pub reserved_at: DateTime<Utc>,
    pub estimated_duration: i32,
}

#[derive(Debug, Deserialize)]
pub struct UpdateReservationRequest {
    pub member_id: Option<String>,
    pub member_name: String,
    pub member_phone: Option<String>,
    pub seat_id: Option<i32>,
    pub staff_id: String,
    pub staff_name: String,
    pub services: Vec<ServiceInput>,
    pub total_price: i32,
    pub reserved_at: DateTime<Utc>,
    pub estimated_duration: i32,
}

#[derive(Debug, Deserialize)]
pub struct UpdateReservationStatusRequest {
    pub status: ReservationStatus,
}

// ==================== Ledger ====================
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LedgerEntry {
    pub id: String,
    pub reservation_id: Option<String>,
    pub member_id: Option<String>,
    pub member_name: String,
    pub seat_id: i32,
    pub staff_id: String,
    pub staff_name: String,
    pub services: Vec<SelectedService>,
    pub total_price: i32,
    pub completed_at: DateTime<Utc>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LedgerSummary {
    pub total_revenue: i32,
    pub total_count: i32,
    pub by_staff: Vec<StaffRevenue>,
    pub by_service: Vec<ServiceCount>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StaffRevenue {
    pub staff_id: String,
    pub staff_name: String,
    pub revenue: i32,
    pub count: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ServiceCount {
    pub service_name: String,
    pub count: i32,
    pub revenue: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DailySummary {
    pub date: String,
    pub revenue: i32,
    pub count: i32,
}

// ==================== Query Parameters ====================
#[derive(Debug, Deserialize, Default)]
pub struct MemberQuery {
    pub search: Option<String>,
}

#[derive(Debug, Deserialize, Default)]
pub struct ReservationQuery {
    pub status: Option<String>,
    pub date: Option<String>,
    pub all: Option<String>,
}

#[derive(Debug, Deserialize, Default)]
pub struct LedgerQuery {
    pub date: Option<String>,
    pub start_date: Option<String>,
    pub end_date: Option<String>,
    pub staff_id: Option<String>,
}

#[derive(Debug, Deserialize, Default)]
pub struct DailySummaryQuery {
    pub year: Option<i32>,
    pub month: Option<u32>,
}
