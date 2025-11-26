package config

import (
	"crypto/rand"
	"encoding/hex"
	"io/ioutil"
	"os"
	"path/filepath"
)

type Config struct {
	Port      string
	DBPath    string
	JWTSecret string
}

func Load() *Config {
	// 1. 환경 변수에서 JWT 시크릿 확인
	jwtSecret := getEnv("JWT_SECRET", "")

	// 2. 환경 변수에 없으면 파일에서 확인
	if jwtSecret == "" {
		secretFile := getEnv("JWT_SECRET_FILE", "./jwt_secret.txt")
		if secret, err := loadSecretFromFile(secretFile); err == nil && secret != "" {
			jwtSecret = secret
		}
	}

	// 3. 파일에도 없으면 새로 생성하고 저장
	if jwtSecret == "" {
		jwtSecret = generateRandomSecret()
		secretFile := getEnv("JWT_SECRET_FILE", "./jwt_secret.txt")
		if err := saveSecretToFile(secretFile, jwtSecret); err != nil {
			// 저장 실패시 메모리에서만 사용 (경고 로그)
			println("Warning: Failed to save JWT secret to file:", err.Error())
		}
	}

	return &Config{
		Port:      getEnv("PORT", "8080"),
		DBPath:    getEnv("DB_PATH", "./timehair.db"),
		JWTSecret: jwtSecret,
	}
}

func generateRandomSecret() string {
	bytes := make([]byte, 32) // 256-bit key
	if _, err := rand.Read(bytes); err != nil {
		// 매우 드문 경우지만 fallback 처리
		panic("Failed to generate random secret: " + err.Error())
	}
	return hex.EncodeToString(bytes)
}

func loadSecretFromFile(filePath string) (string, error) {
	data, err := ioutil.ReadFile(filePath)
	if err != nil {
		return "", err
	}
	return string(data), nil
}

func saveSecretToFile(filePath, secret string) error {
	// 디렉토리 생성
	dir := filepath.Dir(filePath)
	if err := os.MkdirAll(dir, 0700); err != nil {
		return err
	}

	// 파일 저장 (권한 600: 소유자만 읽기/쓰기 가능)
	return ioutil.WriteFile(filePath, []byte(secret), 0600)
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
