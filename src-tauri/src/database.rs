use chrono::Utc;
use once_cell::sync::OnceCell;
use parking_lot::Mutex;
use rusqlite::{Connection, Result};
use std::path::PathBuf;
use uuid::Uuid;

use crate::models::*;

static DB: OnceCell<Mutex<Connection>> = OnceCell::new();

pub fn init_database(app_data_dir: PathBuf) -> Result<()> {
    std::fs::create_dir_all(&app_data_dir).ok();
    let db_path = app_data_dir.join("timehair.db");

    let conn = Connection::open(&db_path)?;

    // Enable foreign keys
    conn.execute("PRAGMA foreign_keys = ON", [])?;

    // Create tables
    create_tables(&conn)?;

    // Seed initial data
    seed_data(&conn)?;

    DB.set(Mutex::new(conn)).ok();

    Ok(())
}

pub fn get_db() -> &'static Mutex<Connection> {
    DB.get().expect("Database not initialized")
}

fn create_tables(conn: &Connection) -> Result<()> {
    // Users table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            deleted_at TEXT
        )",
        [],
    )?;

    // Members table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS members (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            phone TEXT UNIQUE NOT NULL,
            stamps INTEGER DEFAULT 0,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            deleted_at TEXT
        )",
        [],
    )?;
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_members_phone ON members(phone)",
        [],
    )?;

    // Staff table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS staff (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            deleted_at TEXT
        )",
        [],
    )?;

    // Seats table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS seats (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            status TEXT DEFAULT 'available',
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            deleted_at TEXT
        )",
        [],
    )?;

    // Service sessions table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS service_sessions (
            id TEXT PRIMARY KEY,
            seat_id INTEGER NOT NULL,
            member_id TEXT,
            member_name TEXT NOT NULL,
            total_price INTEGER NOT NULL,
            staff_id TEXT NOT NULL,
            staff_name TEXT NOT NULL,
            start_time TEXT NOT NULL,
            reservation_id TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (seat_id) REFERENCES seats(id)
        )",
        [],
    )?;

    // Selected services table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS selected_services (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            service_session_id TEXT,
            reservation_id TEXT,
            ledger_entry_id TEXT,
            name TEXT NOT NULL,
            length TEXT,
            price INTEGER NOT NULL
        )",
        [],
    )?;

    // Reservations table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS reservations (
            id TEXT PRIMARY KEY,
            member_id TEXT,
            member_name TEXT NOT NULL,
            member_phone TEXT,
            seat_id INTEGER,
            staff_id TEXT NOT NULL,
            staff_name TEXT NOT NULL,
            total_price INTEGER NOT NULL,
            reserved_at TEXT NOT NULL,
            estimated_duration INTEGER NOT NULL,
            status TEXT DEFAULT 'scheduled',
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            deleted_at TEXT
        )",
        [],
    )?;

    // Ledger entries table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS ledger_entries (
            id TEXT PRIMARY KEY,
            reservation_id TEXT,
            member_id TEXT,
            member_name TEXT NOT NULL,
            seat_id INTEGER NOT NULL,
            staff_id TEXT NOT NULL,
            staff_name TEXT NOT NULL,
            total_price INTEGER NOT NULL,
            completed_at TEXT NOT NULL,
            created_at TEXT NOT NULL
        )",
        [],
    )?;

    Ok(())
}

fn seed_data(conn: &Connection) -> Result<()> {
    let now = Utc::now().to_rfc3339();

    // Check if admin user exists
    let user_count: i32 = conn.query_row(
        "SELECT COUNT(*) FROM users WHERE deleted_at IS NULL",
        [],
        |row| row.get(0),
    )?;

    if user_count == 0 {
        // Create default admin user
        let password_hash =
            bcrypt::hash("admin", bcrypt::DEFAULT_COST).expect("Failed to hash password");

        conn.execute(
            "INSERT INTO users (id, username, password, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5)",
            [&Uuid::new_v4().to_string(), "admin", &password_hash, &now, &now],
        )?;
    }

    // Check if staff exists
    let staff_count: i32 = conn.query_row(
        "SELECT COUNT(*) FROM staff WHERE deleted_at IS NULL",
        [],
        |row| row.get(0),
    )?;

    if staff_count == 0 {
        // Create default staff
        let staff_names = ["원장", "직원1", "직원2", "직원3", "직원4"];
        for name in staff_names {
            conn.execute(
                "INSERT INTO staff (id, name, created_at, updated_at) VALUES (?1, ?2, ?3, ?4)",
                [&Uuid::new_v4().to_string(), name, &now, &now],
            )?;
        }
    }

    // Check if seats exist
    let seat_count: i32 = conn.query_row(
        "SELECT COUNT(*) FROM seats WHERE deleted_at IS NULL",
        [],
        |row| row.get(0),
    )?;

    if seat_count == 0 {
        // Create default seats
        for i in 1..=6 {
            conn.execute(
                "INSERT INTO seats (id, name, status, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5)",
                [&i.to_string(), &format!("{}번 좌석", i), "available", &now, &now],
            )?;
        }
    }

    Ok(())
}

// ==================== User Operations ====================
pub fn find_user_by_username(username: &str) -> Option<User> {
    let conn = get_db().lock();
    conn.query_row(
        "SELECT id, username, password, created_at, updated_at FROM users WHERE username = ?1 AND deleted_at IS NULL",
        [username],
        |row| {
            Ok(User {
                id: row.get(0)?,
                username: row.get(1)?,
                password: row.get(2)?,
                created_at: row.get::<_, String>(3)?.parse().unwrap_or_default(),
                updated_at: row.get::<_, String>(4)?.parse().unwrap_or_default(),
            })
        },
    ).ok()
}

pub fn find_user_by_id(id: &str) -> Option<User> {
    let conn = get_db().lock();
    conn.query_row(
        "SELECT id, username, password, created_at, updated_at FROM users WHERE id = ?1 AND deleted_at IS NULL",
        [id],
        |row| {
            Ok(User {
                id: row.get(0)?,
                username: row.get(1)?,
                password: row.get(2)?,
                created_at: row.get::<_, String>(3)?.parse().unwrap_or_default(),
                updated_at: row.get::<_, String>(4)?.parse().unwrap_or_default(),
            })
        },
    ).ok()
}

// ==================== Member Operations ====================
pub fn get_members(search: Option<&str>) -> Vec<Member> {
    let conn = get_db().lock();

    if let Some(search) = search {
        let search_pattern = format!("%{}%", search);
        let mut stmt = conn
            .prepare("SELECT id, name, phone, stamps, created_at, updated_at FROM members WHERE deleted_at IS NULL AND (name LIKE ?1 OR phone LIKE ?1) ORDER BY created_at DESC")
            .unwrap();
        let iter = stmt
            .query_map([&search_pattern], |row| {
                Ok(Member {
                    id: row.get(0)?,
                    name: row.get(1)?,
                    phone: row.get(2)?,
                    stamps: row.get(3)?,
                    created_at: row.get::<_, String>(4)?.parse().unwrap_or_default(),
                    updated_at: row.get::<_, String>(5)?.parse().unwrap_or_default(),
                })
            })
            .unwrap();
        iter.filter_map(|r| r.ok()).collect()
    } else {
        let mut stmt = conn
            .prepare("SELECT id, name, phone, stamps, created_at, updated_at FROM members WHERE deleted_at IS NULL ORDER BY created_at DESC")
            .unwrap();
        let iter = stmt
            .query_map([], |row| {
                Ok(Member {
                    id: row.get(0)?,
                    name: row.get(1)?,
                    phone: row.get(2)?,
                    stamps: row.get(3)?,
                    created_at: row.get::<_, String>(4)?.parse().unwrap_or_default(),
                    updated_at: row.get::<_, String>(5)?.parse().unwrap_or_default(),
                })
            })
            .unwrap();
        iter.filter_map(|r| r.ok()).collect()
    }
}

pub fn get_member_by_id(id: &str) -> Option<Member> {
    let conn = get_db().lock();
    conn.query_row(
        "SELECT id, name, phone, stamps, created_at, updated_at FROM members WHERE id = ?1 AND deleted_at IS NULL",
        [id],
        |row| {
            Ok(Member {
                id: row.get(0)?,
                name: row.get(1)?,
                phone: row.get(2)?,
                stamps: row.get(3)?,
                created_at: row.get::<_, String>(4)?.parse().unwrap_or_default(),
                updated_at: row.get::<_, String>(5)?.parse().unwrap_or_default(),
            })
        },
    ).ok()
}

pub fn get_member_by_phone(phone: &str) -> Option<Member> {
    let conn = get_db().lock();
    conn.query_row(
        "SELECT id, name, phone, stamps, created_at, updated_at FROM members WHERE phone = ?1 AND deleted_at IS NULL",
        [phone],
        |row| {
            Ok(Member {
                id: row.get(0)?,
                name: row.get(1)?,
                phone: row.get(2)?,
                stamps: row.get(3)?,
                created_at: row.get::<_, String>(4)?.parse().unwrap_or_default(),
                updated_at: row.get::<_, String>(5)?.parse().unwrap_or_default(),
            })
        },
    ).ok()
}

pub fn create_member(name: &str, phone: &str) -> Result<Member> {
    let conn = get_db().lock();
    let id = Uuid::new_v4().to_string();
    let now = Utc::now();
    let now_str = now.to_rfc3339();

    conn.execute(
        "INSERT INTO members (id, name, phone, stamps, created_at, updated_at) VALUES (?1, ?2, ?3, 0, ?4, ?5)",
        [&id, name, phone, &now_str, &now_str],
    )?;

    Ok(Member {
        id,
        name: name.to_string(),
        phone: phone.to_string(),
        stamps: 0,
        created_at: now,
        updated_at: now,
    })
}

pub fn update_member(id: &str, name: &str, phone: &str) -> Result<Member> {
    {
        let conn = get_db().lock();
        let now = Utc::now().to_rfc3339();
        conn.execute(
            "UPDATE members SET name = ?1, phone = ?2, updated_at = ?3 WHERE id = ?4 AND deleted_at IS NULL",
            [name, phone, &now, id],
        )?;
    }
    get_member_by_id(id).ok_or(rusqlite::Error::QueryReturnedNoRows)
}

pub fn delete_member(id: &str) -> Result<()> {
    let conn = get_db().lock();
    let now = Utc::now().to_rfc3339();
    conn.execute(
        "UPDATE members SET deleted_at = ?1 WHERE id = ?2",
        [&now, id],
    )?;
    Ok(())
}

pub fn add_stamp(id: &str) -> Result<Member> {
    {
        let conn = get_db().lock();
        let now = Utc::now().to_rfc3339();
        conn.execute(
            "UPDATE members SET stamps = stamps + 1, updated_at = ?1 WHERE id = ?2 AND deleted_at IS NULL",
            [&now, id],
        )?;
    }
    get_member_by_id(id).ok_or(rusqlite::Error::QueryReturnedNoRows)
}

pub fn reset_stamps(id: &str) -> Result<Member> {
    {
        let conn = get_db().lock();
        let now = Utc::now().to_rfc3339();
        conn.execute(
            "UPDATE members SET stamps = 0, updated_at = ?1 WHERE id = ?2 AND deleted_at IS NULL",
            [&now, id],
        )?;
    }
    get_member_by_id(id).ok_or(rusqlite::Error::QueryReturnedNoRows)
}

pub fn phone_exists(phone: &str, exclude_id: Option<&str>) -> bool {
    let conn = get_db().lock();
    let count: i32 = if let Some(exclude) = exclude_id {
        conn.query_row(
            "SELECT COUNT(*) FROM members WHERE phone = ?1 AND id != ?2 AND deleted_at IS NULL",
            [phone, exclude],
            |row| row.get(0),
        )
        .unwrap_or(0)
    } else {
        conn.query_row(
            "SELECT COUNT(*) FROM members WHERE phone = ?1 AND deleted_at IS NULL",
            [phone],
            |row| row.get(0),
        )
        .unwrap_or(0)
    };
    count > 0
}

// ==================== Staff Operations ====================
pub fn get_staff_list() -> Vec<Staff> {
    let conn = get_db().lock();
    let mut stmt = conn
        .prepare("SELECT id, name, created_at, updated_at FROM staff WHERE deleted_at IS NULL ORDER BY created_at ASC")
        .unwrap();

    let iter = stmt
        .query_map([], |row| {
            Ok(Staff {
                id: row.get(0)?,
                name: row.get(1)?,
                created_at: row.get::<_, String>(2)?.parse().unwrap_or_default(),
                updated_at: row.get::<_, String>(3)?.parse().unwrap_or_default(),
            })
        })
        .unwrap();

    iter.filter_map(|r| r.ok()).collect()
}

pub fn get_staff_by_id(id: &str) -> Option<Staff> {
    let conn = get_db().lock();
    conn.query_row(
        "SELECT id, name, created_at, updated_at FROM staff WHERE id = ?1 AND deleted_at IS NULL",
        [id],
        |row| {
            Ok(Staff {
                id: row.get(0)?,
                name: row.get(1)?,
                created_at: row.get::<_, String>(2)?.parse().unwrap_or_default(),
                updated_at: row.get::<_, String>(3)?.parse().unwrap_or_default(),
            })
        },
    )
    .ok()
}

pub fn create_staff(name: &str) -> Result<Staff> {
    let conn = get_db().lock();
    let id = Uuid::new_v4().to_string();
    let now = Utc::now();
    let now_str = now.to_rfc3339();

    conn.execute(
        "INSERT INTO staff (id, name, created_at, updated_at) VALUES (?1, ?2, ?3, ?4)",
        [&id, name, &now_str, &now_str],
    )?;

    Ok(Staff {
        id,
        name: name.to_string(),
        created_at: now,
        updated_at: now,
    })
}

pub fn update_staff(id: &str, name: &str) -> Result<Staff> {
    {
        let conn = get_db().lock();
        let now = Utc::now().to_rfc3339();
        conn.execute(
            "UPDATE staff SET name = ?1, updated_at = ?2 WHERE id = ?3 AND deleted_at IS NULL",
            [name, &now, id],
        )?;
    }
    get_staff_by_id(id).ok_or(rusqlite::Error::QueryReturnedNoRows)
}

pub fn delete_staff(id: &str) -> Result<()> {
    let conn = get_db().lock();
    let now = Utc::now().to_rfc3339();
    conn.execute("UPDATE staff SET deleted_at = ?1 WHERE id = ?2", [&now, id])?;
    Ok(())
}

// ==================== Seat Operations ====================
pub fn get_seats() -> Vec<Seat> {
    let seat_ids: Vec<(i32, String, String, String, String)> = {
        let conn = get_db().lock();
        let mut stmt = conn
            .prepare("SELECT id, name, status, created_at, updated_at FROM seats WHERE deleted_at IS NULL ORDER BY id ASC")
            .unwrap();

        stmt.query_map([], |row| {
            Ok((
                row.get::<_, i32>(0)?,
                row.get::<_, String>(1)?,
                row.get::<_, String>(2)?,
                row.get::<_, String>(3)?,
                row.get::<_, String>(4)?,
            ))
        })
        .unwrap()
        .filter_map(|r| r.ok())
        .collect()
    };

    // Load current sessions for each seat
    seat_ids
        .into_iter()
        .map(|(id, name, status, created_at, updated_at)| {
            Seat {
                id,
                name,
                status: SeatStatus::from_str(&status),
                current_session: get_session_by_seat_id(id),
                created_at: created_at.parse().unwrap_or_default(),
                updated_at: updated_at.parse().unwrap_or_default(),
            }
        })
        .collect()
}

pub fn get_seat_by_id(id: i32) -> Option<Seat> {
    let seat_data: Option<(i32, String, String, String, String)> = {
        let conn = get_db().lock();
        conn.query_row(
            "SELECT id, name, status, created_at, updated_at FROM seats WHERE id = ?1 AND deleted_at IS NULL",
            [id],
            |row| {
                Ok((
                    row.get::<_, i32>(0)?,
                    row.get::<_, String>(1)?,
                    row.get::<_, String>(2)?,
                    row.get::<_, String>(3)?,
                    row.get::<_, String>(4)?,
                ))
            },
        ).ok()
    };

    seat_data.map(|(id, name, status, created_at, updated_at)| {
        Seat {
            id,
            name,
            status: SeatStatus::from_str(&status),
            current_session: get_session_by_seat_id(id),
            created_at: created_at.parse().unwrap_or_default(),
            updated_at: updated_at.parse().unwrap_or_default(),
        }
    })
}

pub fn update_seat_status(id: i32, status: SeatStatus) -> Result<()> {
    let conn = get_db().lock();
    let now = Utc::now().to_rfc3339();
    conn.execute(
        "UPDATE seats SET status = ?1, updated_at = ?2 WHERE id = ?3",
        [status.as_str(), &now, &id.to_string()],
    )?;
    Ok(())
}

// ==================== Service Session Operations ====================
pub fn get_session_by_seat_id(seat_id: i32) -> Option<ServiceSession> {
    let session_data: Option<(String, i32, Option<String>, String, i32, String, String, String, Option<String>, String, String)> = {
        let conn = get_db().lock();
        conn.query_row(
            "SELECT id, seat_id, member_id, member_name, total_price, staff_id, staff_name, start_time, reservation_id, created_at, updated_at
             FROM service_sessions WHERE seat_id = ?1",
            [seat_id],
            |row| {
                Ok((
                    row.get::<_, String>(0)?,
                    row.get::<_, i32>(1)?,
                    row.get::<_, Option<String>>(2)?,
                    row.get::<_, String>(3)?,
                    row.get::<_, i32>(4)?,
                    row.get::<_, String>(5)?,
                    row.get::<_, String>(6)?,
                    row.get::<_, String>(7)?,
                    row.get::<_, Option<String>>(8)?,
                    row.get::<_, String>(9)?,
                    row.get::<_, String>(10)?,
                ))
            },
        ).ok()
    };

    session_data.map(|(id, seat_id, member_id, member_name, total_price, staff_id, staff_name, start_time, reservation_id, created_at, updated_at)| {
        let services = get_services_by_session_id(&id);
        ServiceSession {
            id,
            seat_id,
            member_id,
            member_name,
            services,
            total_price,
            staff_id,
            staff_name,
            start_time: start_time.parse().unwrap_or_default(),
            reservation_id,
            created_at: created_at.parse().unwrap_or_default(),
            updated_at: updated_at.parse().unwrap_or_default(),
        }
    })
}

pub fn create_session(
    seat_id: i32,
    member_id: Option<&str>,
    member_name: &str,
    staff_id: &str,
    staff_name: &str,
    services: &[ServiceInput],
    total_price: i32,
    reservation_id: Option<&str>,
) -> Result<ServiceSession> {
    let id = Uuid::new_v4().to_string();
    let now = Utc::now();
    let now_str = now.to_rfc3339();

    {
        let conn = get_db().lock();
        conn.execute(
            "INSERT INTO service_sessions (id, seat_id, member_id, member_name, total_price, staff_id, staff_name, start_time, reservation_id, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)",
            rusqlite::params![id, seat_id, member_id, member_name, total_price, staff_id, staff_name, now_str, reservation_id, now_str, now_str],
        )?;

        // Insert services
        for service in services {
            conn.execute(
                "INSERT INTO selected_services (service_session_id, name, length, price) VALUES (?1, ?2, ?3, ?4)",
                rusqlite::params![id, service.name, service.length, service.price],
            )?;
        }
    }

    Ok(ServiceSession {
        id: id.clone(),
        seat_id,
        member_id: member_id.map(|s| s.to_string()),
        member_name: member_name.to_string(),
        services: get_services_by_session_id(&id),
        total_price,
        staff_id: staff_id.to_string(),
        staff_name: staff_name.to_string(),
        start_time: now,
        reservation_id: reservation_id.map(|s| s.to_string()),
        created_at: now,
        updated_at: now,
    })
}

pub fn delete_session(seat_id: i32) -> Result<Option<ServiceSession>> {
    let session = get_session_by_seat_id(seat_id);

    if let Some(ref s) = session {
        let conn = get_db().lock();
        // Delete services
        conn.execute(
            "DELETE FROM selected_services WHERE service_session_id = ?1",
            [&s.id],
        )?;
        // Delete session
        conn.execute("DELETE FROM service_sessions WHERE id = ?1", [&s.id])?;
    }

    Ok(session)
}

pub fn get_services_by_session_id(session_id: &str) -> Vec<SelectedService> {
    let conn = get_db().lock();
    let mut stmt = conn
        .prepare("SELECT id, service_session_id, reservation_id, ledger_entry_id, name, length, price FROM selected_services WHERE service_session_id = ?1")
        .unwrap();

    stmt.query_map([session_id], |row| {
        Ok(SelectedService {
            id: row.get(0)?,
            service_session_id: row.get(1)?,
            reservation_id: row.get(2)?,
            ledger_entry_id: row.get(3)?,
            name: row.get(4)?,
            length: row.get(5)?,
            price: row.get(6)?,
        })
    })
    .unwrap()
    .filter_map(|r| r.ok())
    .collect()
}

// ==================== Reservation Operations ====================
pub fn get_reservations(query: &ReservationQuery) -> Vec<Reservation> {
    let reservation_ids: Vec<String> = {
        let conn = get_db().lock();

        let mut sql = String::from(
            "SELECT id FROM reservations WHERE deleted_at IS NULL"
        );

        let mut params: Vec<String> = vec![];

        if let Some(status) = &query.status {
            sql.push_str(" AND status = ?");
            params.push(status.clone());
        }

        if let Some(date) = &query.date {
            sql.push_str(" AND DATE(reserved_at) = ?");
            params.push(date.clone());
        } else if query.all.as_deref() != Some("true") {
            sql.push_str(" AND DATE(reserved_at) >= DATE('now')");
        }

        sql.push_str(" ORDER BY reserved_at ASC");

        let mut stmt = conn.prepare(&sql).unwrap();

        match params.len() {
            0 => stmt.query_map([], |row| row.get::<_, String>(0)).unwrap().filter_map(|r| r.ok()).collect(),
            1 => stmt.query_map([&params[0]], |row| row.get::<_, String>(0)).unwrap().filter_map(|r| r.ok()).collect(),
            2 => stmt.query_map([&params[0], &params[1]], |row| row.get::<_, String>(0)).unwrap().filter_map(|r| r.ok()).collect(),
            _ => vec![],
        }
    };

    // Load full reservations with services
    reservation_ids
        .into_iter()
        .filter_map(|id| get_reservation_by_id(&id))
        .collect()
}

fn map_reservation(row: &rusqlite::Row) -> rusqlite::Result<Reservation> {
    Ok(Reservation {
        id: row.get(0)?,
        member_id: row.get(1)?,
        member_name: row.get(2)?,
        member_phone: row.get(3)?,
        seat_id: row.get(4)?,
        staff_id: row.get(5)?,
        staff_name: row.get(6)?,
        services: vec![],
        total_price: row.get(7)?,
        reserved_at: row.get::<_, String>(8)?.parse().unwrap_or_default(),
        estimated_duration: row.get(9)?,
        status: ReservationStatus::from_str(&row.get::<_, String>(10)?),
        created_at: row.get::<_, String>(11)?.parse().unwrap_or_default(),
        updated_at: row.get::<_, String>(12)?.parse().unwrap_or_default(),
    })
}

pub fn get_reservation_by_id(id: &str) -> Option<Reservation> {
    let reservation_data: Option<Reservation> = {
        let conn = get_db().lock();
        conn.query_row(
            "SELECT id, member_id, member_name, member_phone, seat_id, staff_id, staff_name, total_price, reserved_at, estimated_duration, status, created_at, updated_at
             FROM reservations WHERE id = ?1 AND deleted_at IS NULL",
            [id],
            map_reservation,
        ).ok()
    };

    reservation_data.map(|mut r| {
        r.services = get_services_by_reservation_id(&r.id);
        r
    })
}

pub fn get_services_by_reservation_id(reservation_id: &str) -> Vec<SelectedService> {
    let conn = get_db().lock();
    let mut stmt = conn
        .prepare("SELECT id, service_session_id, reservation_id, ledger_entry_id, name, length, price FROM selected_services WHERE reservation_id = ?1")
        .unwrap();

    stmt.query_map([reservation_id], |row| {
        Ok(SelectedService {
            id: row.get(0)?,
            service_session_id: row.get(1)?,
            reservation_id: row.get(2)?,
            ledger_entry_id: row.get(3)?,
            name: row.get(4)?,
            length: row.get(5)?,
            price: row.get(6)?,
        })
    })
    .unwrap()
    .filter_map(|r| r.ok())
    .collect()
}

pub fn create_reservation(req: &CreateReservationRequest) -> Result<Reservation> {
    let id = Uuid::new_v4().to_string();
    let now = Utc::now();
    let now_str = now.to_rfc3339();

    {
        let conn = get_db().lock();
        conn.execute(
            "INSERT INTO reservations (id, member_id, member_name, member_phone, seat_id, staff_id, staff_name, total_price, reserved_at, estimated_duration, status, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)",
            rusqlite::params![
                id,
                req.member_id,
                req.member_name,
                req.member_phone,
                req.seat_id,
                req.staff_id,
                req.staff_name,
                req.total_price,
                req.reserved_at.to_rfc3339(),
                req.estimated_duration,
                "scheduled",
                now_str,
                now_str
            ],
        )?;

        // Insert services
        for service in &req.services {
            conn.execute(
                "INSERT INTO selected_services (reservation_id, name, length, price) VALUES (?1, ?2, ?3, ?4)",
                rusqlite::params![id, service.name, service.length, service.price],
            )?;
        }
    }

    get_reservation_by_id(&id).ok_or(rusqlite::Error::QueryReturnedNoRows)
}

pub fn update_reservation(id: &str, req: &UpdateReservationRequest) -> Result<Reservation> {
    {
        let conn = get_db().lock();
        let now = Utc::now().to_rfc3339();

        conn.execute(
            "UPDATE reservations SET member_id = ?1, member_name = ?2, member_phone = ?3, seat_id = ?4, staff_id = ?5, staff_name = ?6, total_price = ?7, reserved_at = ?8, estimated_duration = ?9, updated_at = ?10 WHERE id = ?11 AND deleted_at IS NULL",
            rusqlite::params![
                req.member_id,
                req.member_name,
                req.member_phone,
                req.seat_id,
                req.staff_id,
                req.staff_name,
                req.total_price,
                req.reserved_at.to_rfc3339(),
                req.estimated_duration,
                now,
                id
            ],
        )?;

        // Delete old services and insert new ones
        conn.execute("DELETE FROM selected_services WHERE reservation_id = ?1", [id])?;

        for service in &req.services {
            conn.execute(
                "INSERT INTO selected_services (reservation_id, name, length, price) VALUES (?1, ?2, ?3, ?4)",
                rusqlite::params![id, service.name, service.length, service.price],
            )?;
        }
    }

    get_reservation_by_id(id).ok_or(rusqlite::Error::QueryReturnedNoRows)
}

pub fn update_reservation_status(id: &str, status: ReservationStatus) -> Result<Reservation> {
    {
        let conn = get_db().lock();
        let now = Utc::now().to_rfc3339();

        conn.execute(
            "UPDATE reservations SET status = ?1, updated_at = ?2 WHERE id = ?3 AND deleted_at IS NULL",
            [status.as_str(), &now, id],
        )?;
    }

    get_reservation_by_id(id).ok_or(rusqlite::Error::QueryReturnedNoRows)
}

pub fn delete_reservation(id: &str) -> Result<()> {
    let conn = get_db().lock();
    let now = Utc::now().to_rfc3339();

    // Delete services
    conn.execute("DELETE FROM selected_services WHERE reservation_id = ?1", [id])?;

    // Soft delete reservation
    conn.execute(
        "UPDATE reservations SET deleted_at = ?1 WHERE id = ?2",
        [&now, id],
    )?;

    Ok(())
}

// ==================== Ledger Operations ====================
pub fn get_ledger_entries(query: &LedgerQuery) -> Vec<LedgerEntry> {
    let entry_ids: Vec<String> = {
        let conn = get_db().lock();

        let mut sql = String::from("SELECT id FROM ledger_entries WHERE 1=1");

        let mut params: Vec<String> = vec![];

        if let Some(date) = &query.date {
            sql.push_str(" AND DATE(completed_at) = ?");
            params.push(date.clone());
        } else if query.start_date.is_some() && query.end_date.is_some() {
            sql.push_str(" AND DATE(completed_at) >= ? AND DATE(completed_at) <= ?");
            params.push(query.start_date.clone().unwrap());
            params.push(query.end_date.clone().unwrap());
        }

        if let Some(staff_id) = &query.staff_id {
            sql.push_str(" AND staff_id = ?");
            params.push(staff_id.clone());
        }

        sql.push_str(" ORDER BY completed_at DESC");

        let mut stmt = conn.prepare(&sql).unwrap();

        match params.len() {
            0 => stmt.query_map([], |row| row.get::<_, String>(0)).unwrap().filter_map(|r| r.ok()).collect(),
            1 => stmt.query_map([&params[0]], |row| row.get::<_, String>(0)).unwrap().filter_map(|r| r.ok()).collect(),
            2 => stmt.query_map([&params[0], &params[1]], |row| row.get::<_, String>(0)).unwrap().filter_map(|r| r.ok()).collect(),
            3 => stmt.query_map([&params[0], &params[1], &params[2]], |row| row.get::<_, String>(0)).unwrap().filter_map(|r| r.ok()).collect(),
            _ => vec![],
        }
    };

    // Load full entries with services
    entry_ids
        .into_iter()
        .filter_map(|id| get_ledger_entry_by_id(&id))
        .collect()
}

fn get_ledger_entry_by_id(id: &str) -> Option<LedgerEntry> {
    let entry_data: Option<LedgerEntry> = {
        let conn = get_db().lock();
        conn.query_row(
            "SELECT id, reservation_id, member_id, member_name, seat_id, staff_id, staff_name, total_price, completed_at, created_at
             FROM ledger_entries WHERE id = ?1",
            [id],
            |row| {
                Ok(LedgerEntry {
                    id: row.get(0)?,
                    reservation_id: row.get(1)?,
                    member_id: row.get(2)?,
                    member_name: row.get(3)?,
                    seat_id: row.get(4)?,
                    staff_id: row.get(5)?,
                    staff_name: row.get(6)?,
                    services: vec![],
                    total_price: row.get(7)?,
                    completed_at: row.get::<_, String>(8)?.parse().unwrap_or_default(),
                    created_at: row.get::<_, String>(9)?.parse().unwrap_or_default(),
                })
            },
        ).ok()
    };

    entry_data.map(|mut e| {
        e.services = get_services_by_ledger_id(&e.id);
        e
    })
}

pub fn get_services_by_ledger_id(ledger_id: &str) -> Vec<SelectedService> {
    let conn = get_db().lock();
    let mut stmt = conn
        .prepare("SELECT id, service_session_id, reservation_id, ledger_entry_id, name, length, price FROM selected_services WHERE ledger_entry_id = ?1")
        .unwrap();

    stmt.query_map([ledger_id], |row| {
        Ok(SelectedService {
            id: row.get(0)?,
            service_session_id: row.get(1)?,
            reservation_id: row.get(2)?,
            ledger_entry_id: row.get(3)?,
            name: row.get(4)?,
            length: row.get(5)?,
            price: row.get(6)?,
        })
    })
    .unwrap()
    .filter_map(|r| r.ok())
    .collect()
}

pub fn create_ledger_entry(session: &ServiceSession) -> Result<LedgerEntry> {
    let id = Uuid::new_v4().to_string();
    let now = Utc::now();
    let now_str = now.to_rfc3339();

    {
        let conn = get_db().lock();
        conn.execute(
            "INSERT INTO ledger_entries (id, reservation_id, member_id, member_name, seat_id, staff_id, staff_name, total_price, completed_at, created_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)",
            rusqlite::params![
                id,
                session.reservation_id,
                session.member_id,
                session.member_name,
                session.seat_id,
                session.staff_id,
                session.staff_name,
                session.total_price,
                now_str,
                now_str
            ],
        )?;

        // Copy services to ledger
        for service in &session.services {
            conn.execute(
                "INSERT INTO selected_services (ledger_entry_id, name, length, price) VALUES (?1, ?2, ?3, ?4)",
                rusqlite::params![id, service.name, service.length, service.price],
            )?;
        }
    }

    Ok(LedgerEntry {
        id: id.clone(),
        reservation_id: session.reservation_id.clone(),
        member_id: session.member_id.clone(),
        member_name: session.member_name.clone(),
        seat_id: session.seat_id,
        staff_id: session.staff_id.clone(),
        staff_name: session.staff_name.clone(),
        services: get_services_by_ledger_id(&id),
        total_price: session.total_price,
        completed_at: now,
        created_at: now,
    })
}

pub fn get_ledger_summary(query: &LedgerQuery) -> LedgerSummary {
    let entries = get_ledger_entries(query);

    let total_revenue: i32 = entries.iter().map(|e| e.total_price).sum();
    let total_count = entries.len() as i32;

    // Group by staff
    let mut staff_map: std::collections::HashMap<String, (String, i32, i32)> =
        std::collections::HashMap::new();
    for entry in &entries {
        let e = staff_map
            .entry(entry.staff_id.clone())
            .or_insert((entry.staff_name.clone(), 0, 0));
        e.1 += entry.total_price;
        e.2 += 1;
    }
    let by_staff: Vec<StaffRevenue> = staff_map
        .into_iter()
        .map(|(id, (name, revenue, count))| StaffRevenue {
            staff_id: id,
            staff_name: name,
            revenue,
            count,
        })
        .collect();

    // Group by service
    let mut service_map: std::collections::HashMap<String, (i32, i32)> =
        std::collections::HashMap::new();
    for entry in &entries {
        for service in &entry.services {
            let e = service_map.entry(service.name.clone()).or_insert((0, 0));
            e.0 += 1;
            e.1 += service.price;
        }
    }
    let by_service: Vec<ServiceCount> = service_map
        .into_iter()
        .map(|(name, (count, revenue))| ServiceCount {
            service_name: name,
            count,
            revenue,
        })
        .collect();

    LedgerSummary {
        total_revenue,
        total_count,
        by_staff,
        by_service,
    }
}

pub fn get_daily_summary(year: i32, month: u32) -> Vec<DailySummary> {
    let conn = get_db().lock();

    let mut stmt = conn
        .prepare(
            "SELECT DATE(completed_at) as date, SUM(total_price) as revenue, COUNT(*) as count
             FROM ledger_entries
             WHERE strftime('%Y', completed_at) = ? AND strftime('%m', completed_at) = ?
             GROUP BY DATE(completed_at)
             ORDER BY date ASC",
        )
        .unwrap();

    let year_str = format!("{:04}", year);
    let month_str = format!("{:02}", month);

    stmt.query_map([&year_str, &month_str], |row| {
        Ok(DailySummary {
            date: row.get(0)?,
            revenue: row.get(1)?,
            count: row.get(2)?,
        })
    })
    .unwrap()
    .filter_map(|r| r.ok())
    .collect()
}
