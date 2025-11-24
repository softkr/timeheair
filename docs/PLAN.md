# 미용실 관리 시스템 계획서

## 1. 프로젝트 개요

| 항목 | 내용 |
|------|------|
| 프로젝트명 | 타임헤어 관리 시스템 |
| 목적 | 좌석별 시술 현황, 예약, 매출, 고객 관리 |
| 좌석 수 | 5개 |
| 직원 수 | 2명 |

---

## 2. 주요 기능

### 2.0 로그인/인증
- 아이디/비밀번호 로그인
- 로그인 상태 유지 (세션/토큰)
- 로그아웃
- 미인증 시 로그인 페이지로 리다이렉트
- 계정: 1개 (공용)
- 초기 계정: admin / 1234 (첫 로그인 후 변경 권장)

### 2.1 대시보드 (좌석 현황)
- 5개 좌석 실시간 상태 표시
  - 비어있음 (초록)
  - 시술중 (빨강)
  - 예약됨 (노랑)
- 시술중인 좌석 정보:
  - 서비스명 및 옵션
  - 금액
  - 담당 직원
  - 고객명
- 예약된 좌석 정보:
  - 예약 시간
  - 고객명

### 2.2 예약 관리
- 예약 생성
  - 고객 선택 (기존 고객 검색 또는 신규 등록)
  - 서비스 선택 (다중 선택 가능)
  - 좌석 선택
  - 담당 직원 선택
  - 날짜/시간 선택
- 예약 목록 조회
- 예약 수정/취소
- 예약 상태 변경 (예약됨 → 시술중 → 완료)

### 2.3 고객 관리 (멤버십)
- 고객 등록
  - 이름
  - 전화번호
- 고객 검색 (이름/전화번호)
- 고객 목록 조회
- 고객별 방문 이력 조회

### 2.4 매출 리포트
- 일별 매출
- 주별 매출
- 월별 매출
- 좌석별 매출
- 직원별 매출
- 서비스별 매출

---

## 3. 데이터 구조

### 3.1 고객 (members)
```javascript
{
  id: string,
  name: string,           // 이름
  phone: string,          // 전화번호
  createdAt: string       // 등록일
}
```

### 3.2 직원 (staff)
```javascript
{
  id: string,
  name: string            // 이름
}
// 초기 데이터: 2명
```

### 3.3 좌석 (seats)
```javascript
{
  id: number,             // 1~5
  name: string,           // "1번 좌석"
  status: string          // available, in_use, reserved
}
// 초기 데이터: 5개
```

### 3.4 서비스 (services)
```javascript
{
  id: string,
  category: string,       // 카테고리
  name: string,           // 서비스명
  prices: {
    short: number,        // 숏 가격
    medium: number,       // 미듐 가격
    long: number          // 롱 가격
  },
  // 또는 단일 가격
  price: number,
  options: [              // 추가 옵션
    { name: string, price: number }
  ]
}
```

### 3.5 예약 (reservations)
```javascript
{
  id: string,
  // 고객 정보는 선택사항 (옵션)
  memberId: string | null,
  memberName: string | null,
  memberPhone: string | null,
  // seatId는 예약 시 없음 - 시술 시작할 때 배정
  seatId: number | null,
  staffId: string,
  staffName: string,
  services: [
    {
      name: string,
      length: string,     // short, medium, long (해당시)
      price: number
    }
  ],
  totalPrice: number,
  reservedAt: string,     // 예약 일시
  estimatedDuration: number, // 예상 소요시간 (분)
  status: string,         // scheduled, in_progress, completed, cancelled
  createdAt: string
}
```

### 3.6 매출 (ledger)
```javascript
{
  id: string,
  reservationId: string,
  memberId: string,
  memberName: string,
  seatId: number,
  staffId: string,
  staffName: string,
  services: [...],
  totalPrice: number,
  completedAt: string     // 완료 일시
}
```

---

## 4. 화면 구성

### 4.1 페이지 목록

| 페이지 | 경로 | 설명 |
|--------|------|------|
| 로그인 | `/login` | 아이디/비밀번호 인증 |
| 대시보드 | `/` | 좌석 현황 메인 화면 |
| 예약 관리 | `/reservations` | 예약 목록 및 관리 |
| 예약 생성 | `/reservations/new` | 새 예약 생성 |
| 고객 관리 | `/members` | 고객 목록 및 관리 |
| 매출 리포트 | `/ledger` | 매출 현황 및 통계 |

### 4.2 공통 레이아웃
- 상단: 헤더 (로고, 현재 시간)
- 좌측: 네비게이션 메뉴
- 중앙: 메인 콘텐츠

---

## 5. 사용자 플로우

### 5.1 예약 생성 플로우
1. 예약 관리 페이지에서 "새 예약" 클릭
2. 고객 검색 또는 신규 등록
3. 서비스 선택 (카테고리 → 서비스 → 길이/옵션)
4. 날짜/시간 선택
5. 담당 직원 선택
6. 예약 확인 및 저장
* **좌석은 예약 시 선택하지 않음** (시술 시작 시 배정)

### 5.2 시술 진행 플로우
1. 예약 목록에서 해당 예약 확인
2. 고객 도착 시 "시술 시작" 클릭
3. **빈 좌석 중 선택하여 배정**
4. 좌석 상태가 "시술중"으로 변경
5. 시술 완료 시 "완료" 클릭
6. 매출 자동 기록
7. 좌석 상태가 "비어있음"으로 변경

### 5.3 워크인 (예약 없는 고객) 플로우
1. 대시보드에서 빈 좌석 클릭
2. 서비스 선택 (메뉴/가격)
3. 즉시 시술 시작
4. 시술 완료 후 매출 기록
* 고객 정보는 선택사항 (멤버십 적립 원할 때만)
* 이름 미입력 시 자동으로 "손님1", "손님2" 등으로 표시

---

## 6. 기술 스택

| 영역 | 기술 |
|------|------|
| 프레임워크 | Next.js 14 (App Router) |
| 언어 | TypeScript |
| UI 프레임워크 | **Ant Design 5** |
| 차트 | Ant Design Charts |
| 상태관리 | Zustand |
| 데이터 저장 | LocalStorage (MVP) → Prisma + SQLite/PostgreSQL |
| 날짜 처리 | dayjs (Ant Design 기본) |
| PWA | next-pwa (앱처럼 설치 가능) |

---

## 7. 개발 단계

### Phase 1: 기본 구조
- 프로젝트 세팅 (Vite + React)
- 레이아웃 및 라우팅 구성
- 기본 데이터 구조 정의
- LocalStorage 유틸리티

### Phase 2: 핵심 기능
- 대시보드 (좌석 현황)
- 서비스/가격 데이터
- 고객 관리 (CRUD)
- 직원 데이터

### Phase 3: 예약 시스템
- 예약 생성
- 예약 목록
- 예약 상태 관리
- 좌석 상태 연동

### Phase 4: 매출 관리
- 매출 기록
- 리포트 화면
- 기간별/항목별 집계

### Phase 5: 개선
- UI/UX 개선
- 반응형 디자인
- 데이터 백업/복원

---

## 8. 파일 구조

```
src/
├── app/
│   ├── layout.tsx           // 루트 레이아웃
│   ├── page.tsx             // 대시보드 (메인)
│   ├── globals.css
│   ├── reservations/
│   │   ├── page.tsx         // 예약 목록
│   │   └── new/
│   │       └── page.tsx     // 새 예약
│   ├── members/
│   │   └── page.tsx         // 고객 관리
│   └── ledger/
│       └── page.tsx         // 매출 리포트
├── components/
│   ├── common/
│   │   ├── Header.tsx
│   │   └── Navigation.tsx
│   ├── dashboard/
│   │   ├── SeatCard.tsx
│   │   └── SeatGrid.tsx
│   ├── reservations/
│   │   ├── ReservationForm.tsx
│   │   ├── ReservationList.tsx
│   │   └── ServiceSelector.tsx
│   ├── members/
│   │   ├── MemberForm.tsx
│   │   └── MemberList.tsx
│   └── ledger/
│       ├── LedgerTable.tsx
│       └── ReportChart.tsx
├── lib/
│   ├── data/
│   │   ├── services.ts      // 서비스/가격 데이터
│   │   └── initialData.ts   // 초기 데이터 (좌석, 직원)
│   ├── hooks/
│   │   ├── useLocalStorage.ts
│   │   └── useReservations.ts
│   ├── utils/
│   │   ├── storage.ts       // LocalStorage 유틸리티
│   │   ├── formatters.ts    // 가격, 날짜 포맷
│   │   └── calculations.ts  // 매출 계산
│   └── types/
│       └── index.ts         // TypeScript 타입 정의
└── context/
    └── AppContext.tsx       // 전역 상태
```

---

## 9. 초기 데이터

### 9.1 직원
| ID | 이름 |
|----|------|
| s001 | (직원1 이름) |
| s002 | (직원2 이름) |

### 9.2 좌석
| ID | 이름 |
|----|------|
| 1 | 1번 좌석 |
| 2 | 2번 좌석 |
| 3 | 3번 좌석 |
| 4 | 4번 좌석 |
| 5 | 5번 좌석 |

---

## 10. 추후 확장 고려사항

- 클라우드 데이터 저장 (Firebase, Supabase)
- SMS 예약 알림
- 정산 기능
- 재고 관리 (제품)
- 다중 지점 관리

---

## 운영 정보

| 항목 | 내용 |
|------|------|
| 영업 시간 | 10:00 ~ 20:00 |
| 예약 단위 | 30분 |

---

## 확인 필요 사항

1. **직원 이름**: 2명의 직원 이름을 알려주세요
2. **서비스별 소요시간**: 기본 소요시간 설정이 필요한지?
