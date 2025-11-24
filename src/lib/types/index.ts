// 고객
export interface Member {
  id: string;
  name: string;
  phone: string;
  stamps: number; // 스탬프 개수 (10개 모으면 혜택)
  createdAt: string;
}

// 직원
export interface Staff {
  id: string;
  name: string;
}

// 좌석 상태
export type SeatStatus = "available" | "in_use" | "reserved";

// 좌석
export interface Seat {
  id: number;
  name: string;
  status: SeatStatus;
  currentSession?: ServiceSession;
}

// 서비스 세션 (현재 진행중인 시술)
export interface ServiceSession {
  id: string;
  memberId?: string | null;
  memberName: string;
  services: SelectedService[];
  totalPrice: number;
  staffId: string;
  staffName: string;
  startTime: string;
  reservationId?: string | null;
}

// 선택된 서비스
export interface SelectedService {
  name: string;
  length?: "short" | "medium" | "long";
  price: number;
}

// 예약
export interface Reservation {
  id: string;
  memberId?: string | null;
  memberName: string;
  memberPhone?: string | null;
  seatId?: number | null;
  staffId: string;
  staffName: string;
  services: SelectedService[];
  totalPrice: number;
  reservedAt: string;
  estimatedDuration: number;
  status: "scheduled" | "in_progress" | "completed" | "cancelled";
  createdAt: string;
}

// 매출
export interface LedgerEntry {
  id: string;
  reservationId?: string | null;
  memberId?: string | null;
  memberName: string;
  seatId: number;
  staffId: string;
  staffName: string;
  services: SelectedService[];
  totalPrice: number;
  completedAt: string;
}

// 서비스 메뉴
export interface ServiceMenu {
  id: string;
  category: string;
  name: string;
  price?: number;
  prices?: {
    short?: number;
    medium?: number;
    long?: number;
  };
  options?: ServiceOption[];
}

export interface ServiceOption {
  name: string;
  price: number;
}

// 인증
export interface AuthState {
  isLoggedIn: boolean;
  user?: {
    username: string;
  };
}
