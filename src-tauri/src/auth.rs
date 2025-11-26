use chrono::{Duration, Utc};
use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, Validation};
use once_cell::sync::Lazy;
use serde::{Deserialize, Serialize};

use crate::database;
use crate::models::{LoginRequest, LoginResponse, UserInfo};

// JWT secret - generated once and stored
static JWT_SECRET: Lazy<Vec<u8>> = Lazy::new(|| {
    // Try to load from environment or generate
    if let Ok(secret) = std::env::var("JWT_SECRET") {
        return secret.into_bytes();
    }

    // Generate a random secret
    use std::collections::hash_map::DefaultHasher;
    use std::hash::{Hash, Hasher};

    let mut hasher = DefaultHasher::new();
    Utc::now()
        .timestamp_nanos_opt()
        .unwrap_or(0)
        .hash(&mut hasher);
    std::process::id().hash(&mut hasher);

    let hash = hasher.finish();
    format!("timehair_secret_{}", hash).into_bytes()
});

#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    pub sub: String, // user_id
    pub username: String,
    pub exp: i64, // expiration timestamp
    pub iat: i64, // issued at
}

pub fn generate_token(user_id: &str, username: &str) -> Result<String, String> {
    let now = Utc::now();
    let exp = now + Duration::hours(24);

    let claims = Claims {
        sub: user_id.to_string(),
        username: username.to_string(),
        exp: exp.timestamp(),
        iat: now.timestamp(),
    };

    encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(&JWT_SECRET),
    )
    .map_err(|e| format!("Failed to generate token: {}", e))
}

pub fn verify_token(token: &str) -> Result<Claims, String> {
    decode::<Claims>(
        token,
        &DecodingKey::from_secret(&JWT_SECRET),
        &Validation::default(),
    )
    .map(|data| data.claims)
    .map_err(|e| format!("Invalid token: {}", e))
}

pub fn login(req: LoginRequest) -> Result<LoginResponse, String> {
    // Find user by username
    let user = database::find_user_by_username(&req.username).ok_or("사용자를 찾을 수 없습니다")?;

    // Verify password
    if !bcrypt::verify(&req.password, &user.password).unwrap_or(false) {
        return Err("비밀번호가 일치하지 않습니다".to_string());
    }

    // Generate token
    let token = generate_token(&user.id, &user.username)?;

    Ok(LoginResponse {
        token,
        user: UserInfo {
            id: user.id,
            username: user.username,
            created_at: user.created_at,
        },
    })
}

pub fn get_current_user(token: &str) -> Result<UserInfo, String> {
    let claims = verify_token(token)?;

    let user = database::find_user_by_id(&claims.sub).ok_or("사용자를 찾을 수 없습니다")?;

    Ok(UserInfo {
        id: user.id,
        username: user.username,
        created_at: user.created_at,
    })
}
