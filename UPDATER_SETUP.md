# Tauri 자동 업데이트 설정 가이드

## 1. 서명 키 생성

자동 업데이트를 위해서는 서명 키가 필요합니다. 다음 명령어로 키를 생성하세요:

```bash
yarn tauri signer generate -w ~/.tauri/timehair.key
```

비밀번호를 입력하라고 하면 원하는 비밀번호를 입력하세요 (예: `timehair2024`).

이 명령어는 두 가지를 생성합니다:
- **개인 키 (Private Key)**: `~/.tauri/timehair.key` - 비밀로 유지해야 함
- **공개 키 (Public Key)**: 터미널에 출력됨

## 2. GitHub Secrets 등록

GitHub 저장소에 다음 Secrets를 추가해야 합니다:

1. GitHub 저장소로 이동
2. `Settings` → `Secrets and variables` → `Actions` 클릭
3. `New repository secret` 버튼 클릭

다음 두 개의 Secret을 추가하세요:

### TAURI_SIGNING_PRIVATE_KEY
```bash
# 개인 키 내용 복사
cat ~/.tauri/timehair.key
```
위 명령어로 출력된 전체 내용을 복사하여 Secret 값으로 입력

### TAURI_SIGNING_PRIVATE_KEY_PASSWORD
키 생성 시 입력한 비밀번호를 Secret 값으로 입력 (예: `timehair2024`)

## 3. 공개 키를 Tauri 설정에 추가

터미널에 출력된 공개 키를 복사하여 `src-tauri/tauri.conf.json` 파일의 `pubkey` 필드에 입력하세요:

```json
{
  "plugins": {
    "updater": {
      "active": true,
      "endpoints": [
        "https://github.com/softkr/timeheair/releases/latest/download/latest.json"
      ],
      "dialog": true,
      "pubkey": "여기에_공개키_입력"
    }
  }
}
```

## 4. 변경사항 커밋 및 푸시

```bash
git add src-tauri/tauri.conf.json
git commit -m "Add updater public key"
git push
```

## 5. 릴리스 생성

이제 태그를 생성하여 릴리스를 만들면 자동 업데이트가 작동합니다:

```bash
git tag v0.1.0
git push origin v0.1.0
```

## 자동 업데이트 작동 방식

1. **앱 시작 시 자동 체크**: 사용자가 앱을 실행하면 자동으로 새 버전을 확인합니다.
2. **업데이트 알림**: 새 버전이 있으면 사용자에게 알림을 표시합니다.
3. **다운로드 및 설치**: 사용자가 승인하면 자동으로 다운로드하고 설치합니다.
4. **앱 재시작**: 설치 완료 후 앱을 자동으로 재시작합니다.

## 주의사항

- **개인 키는 절대 Git에 커밋하지 마세요!** GitHub Secrets에만 저장하세요.
- 공개 키는 Git에 커밋해도 안전합니다.
- 최초 릴리스(v0.1.0) 이후부터 자동 업데이트가 작동합니다.
