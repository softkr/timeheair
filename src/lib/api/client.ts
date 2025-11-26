import { invoke } from "@tauri-apps/api/core";

// Types - camelCase for frontend usage
interface Member {
  id: string;
  name: string;
  phone: string;
  stamps: number;
  createdAt: string;
  updatedAt: string;
}

interface Staff {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

interface SelectedService {
  id?: number;
  serviceSessionId?: string;
  reservationId?: string;
  ledgerEntryId?: string;
  name: string;
  length?: string;
  price: number;
}

interface ServiceSession {
  id: string;
  seatId: number;
  memberId?: string;
  memberName: string;
  services: SelectedService[];
  totalPrice: number;
  staffId: string;
  staffName: string;
  startTime: string;
  reservationId?: string;
  createdAt: string;
  updatedAt: string;
}

interface Seat {
  id: number;
  name: string;
  status: "available" | "in_use" | "reserved";
  currentSession?: ServiceSession;
  createdAt: string;
  updatedAt: string;
}

interface Reservation {
  id: string;
  memberId?: string;
  memberName: string;
  memberPhone?: string;
  seatId?: number;
  staffId: string;
  staffName: string;
  services: SelectedService[];
  totalPrice: number;
  reservedAt: string;
  estimatedDuration: number;
  status: "scheduled" | "in_progress" | "completed" | "cancelled";
  createdAt: string;
  updatedAt: string;
}

interface LedgerEntry {
  id: string;
  reservationId?: string;
  memberId?: string;
  memberName: string;
  seatId: number;
  staffId: string;
  staffName: string;
  services: SelectedService[];
  totalPrice: number;
  completedAt: string;
  createdAt: string;
}

interface StartServiceRequest {
  memberId?: string;
  memberName: string;
  services: ServiceInput[];
  totalPrice: number;
  staffId: string;
  staffName: string;
  reservationId?: string;
}

interface ServiceInput {
  name: string;
  length?: string;
  price: number;
}

interface ReservationRequest {
  memberId?: string;
  memberName: string;
  memberPhone?: string;
  seatId?: number;
  staffId: string;
  staffName: string;
  services: ServiceInput[];
  totalPrice: number;
  reservedAt: string;
  estimatedDuration: number;
}

interface LedgerSummary {
  totalRevenue: number;
  totalCount: number;
  byStaff: {
    staffId: string;
    staffName: string;
    revenue: number;
    count: number;
  }[];
  byService: { serviceName: string; count: number; revenue: number }[];
}

interface DailySummary {
  date: string;
  revenue: number;
  count: number;
}

interface UserInfo {
  id: string;
  username: string;
  createdAt: string;
}

interface LoginResponse {
  token: string;
  user: UserInfo;
}

// Helper to convert snake_case to camelCase for frontend compatibility
function toCamelCase<T>(obj: unknown): T {
  if (obj === null || obj === undefined) return obj as T;
  if (Array.isArray(obj)) {
    return obj.map((item) => toCamelCase(item)) as T;
  }
  if (typeof obj === "object") {
    const newObj: Record<string, unknown> = {};
    for (const key of Object.keys(obj as object)) {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) =>
        letter.toUpperCase(),
      );
      newObj[camelKey] = toCamelCase((obj as Record<string, unknown>)[key]);
    }
    return newObj as T;
  }
  return obj as T;
}

// Helper to convert camelCase to snake_case for backend
function toSnakeCase<T>(obj: unknown): T {
  if (obj === null || obj === undefined) return obj as T;
  if (Array.isArray(obj)) {
    return obj.map((item) => toSnakeCase(item)) as T;
  }
  if (typeof obj === "object") {
    const newObj: Record<string, unknown> = {};
    for (const key of Object.keys(obj as object)) {
      const snakeKey = key.replace(/([A-Z])/g, "_$1").toLowerCase();
      newObj[snakeKey] = toSnakeCase((obj as Record<string, unknown>)[key]);
    }
    return newObj as T;
  }
  return obj as T;
}

class ApiClient {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem("auth_token", token);
    } else {
      localStorage.removeItem("auth_token");
    }
  }

  getToken(): string | null {
    if (this.token) return this.token;
    if (typeof window !== "undefined") {
      this.token = localStorage.getItem("auth_token");
    }
    return this.token;
  }

  // Auth
  async login(username: string, password: string) {
    const response = await invoke<unknown>("login", {
      request: { username, password },
    });
    const result = toCamelCase<LoginResponse>(response);
    this.setToken(result.token);
    return result;
  }

  logout() {
    this.setToken(null);
  }

  async getCurrentUser() {
    const token = this.getToken();
    if (!token) throw new Error("인증이 필요합니다");
    const user = await invoke<unknown>("get_current_user", { token });
    return toCamelCase<UserInfo>(user);
  }

  // Members
  async getMembers(search?: string) {
    const members = await invoke<unknown>("get_members", {
      search: search || null,
    });
    return toCamelCase<Member[]>(members);
  }

  async getMember(id: string) {
    const member = await invoke<unknown>("get_member", { id });
    return toCamelCase<Member>(member);
  }

  async searchMemberByPhone(phone: string) {
    const member = await invoke<unknown>("search_member_by_phone", { phone });
    return toCamelCase<Member>(member);
  }

  async createMember(data: { name: string; phone: string }) {
    const member = await invoke<unknown>("create_member", {
      request: data,
    });
    return toCamelCase<Member>(member);
  }

  async updateMember(id: string, data: { name: string; phone: string }) {
    const member = await invoke<unknown>("update_member", {
      id,
      request: data,
    });
    return toCamelCase<Member>(member);
  }

  async deleteMember(id: string) {
    await invoke("delete_member", { id });
    return { message: "회원이 삭제되었습니다" };
  }

  async addStamp(id: string) {
    const member = await invoke<unknown>("add_stamp", { id });
    return toCamelCase<Member>(member);
  }

  async resetStamps(id: string) {
    const member = await invoke<unknown>("reset_stamps", { id });
    return toCamelCase<Member>(member);
  }

  // Staff
  async getStaff() {
    const staff = await invoke<unknown>("get_staff_list");
    return toCamelCase<Staff[]>(staff);
  }

  async createStaff(data: { name: string }) {
    const staff = await invoke<unknown>("create_staff", {
      request: data,
    });
    return toCamelCase<Staff>(staff);
  }

  async updateStaff(id: string, data: { name: string }) {
    const staff = await invoke<unknown>("update_staff", {
      id,
      request: data,
    });
    return toCamelCase<Staff>(staff);
  }

  async deleteStaff(id: string) {
    await invoke("delete_staff", { id });
    return { message: "직원이 삭제되었습니다" };
  }

  // Seats
  async getSeats() {
    const seats = await invoke<unknown>("get_seats");
    return toCamelCase<Seat[]>(seats);
  }

  async getSeat(id: number) {
    const seat = await invoke<unknown>("get_seat", { id });
    return toCamelCase<Seat>(seat);
  }

  async startService(seatId: number, data: StartServiceRequest) {
    const seat = await invoke<unknown>("start_service", {
      id: seatId,
      request: toSnakeCase(data),
    });
    return toCamelCase<Seat>(seat);
  }

  async completeService(seatId: number) {
    const ledger = await invoke<unknown>("complete_service", {
      id: seatId,
    });
    return {
      message: "서비스가 완료되었습니다",
      ledger: toCamelCase<LedgerEntry>(ledger),
    };
  }

  async cancelService(seatId: number) {
    await invoke("cancel_service", { id: seatId });
    return { message: "서비스가 취소되었습니다" };
  }

  // Reservations
  async getReservations(params?: {
    status?: string;
    date?: string;
    all?: boolean;
  }) {
    const reservations = await invoke<unknown>("get_reservations", {
      status: params?.status || null,
      date: params?.date || null,
      all: params?.all ? "true" : null,
    });
    return toCamelCase<Reservation[]>(reservations);
  }

  async getReservation(id: string) {
    const reservation = await invoke<unknown>("get_reservation", { id });
    return toCamelCase<Reservation>(reservation);
  }

  async createReservation(data: ReservationRequest) {
    const reservation = await invoke<unknown>("create_reservation", {
      request: toSnakeCase(data),
    });
    return toCamelCase<Reservation>(reservation);
  }

  async updateReservation(id: string, data: ReservationRequest) {
    const reservation = await invoke<unknown>("update_reservation", {
      id,
      request: toSnakeCase(data),
    });
    return toCamelCase<Reservation>(reservation);
  }

  async updateReservationStatus(id: string, status: string) {
    const reservation = await invoke<unknown>("update_reservation_status", {
      id,
      request: { status },
    });
    return toCamelCase<Reservation>(reservation);
  }

  async deleteReservation(id: string) {
    await invoke("delete_reservation", { id });
    return { message: "예약이 삭제되었습니다" };
  }

  // Ledger
  async getLedgerEntries(params?: {
    date?: string;
    startDate?: string;
    endDate?: string;
    staffId?: string;
  }) {
    const entries = await invoke<unknown>("get_ledger_entries", {
      date: params?.date || null,
      start_date: params?.startDate || null,
      end_date: params?.endDate || null,
      staff_id: params?.staffId || null,
    });
    return toCamelCase<LedgerEntry[]>(entries);
  }

  async getLedgerSummary(params?: {
    date?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const summary = await invoke<unknown>("get_ledger_summary", {
      date: params?.date || null,
      start_date: params?.startDate || null,
      end_date: params?.endDate || null,
    });
    return toCamelCase<LedgerSummary>(summary);
  }

  async getDailySummary(year?: string, month?: string) {
    const summaries = await invoke<unknown>("get_daily_summary", {
      year: year ? parseInt(year) : null,
      month: month ? parseInt(month) : null,
    });
    return toCamelCase<DailySummary[]>(summaries);
  }
}

export const apiClient = new ApiClient();
export type {
  Member,
  Staff,
  SelectedService,
  ServiceSession,
  Seat,
  Reservation,
  LedgerEntry,
  StartServiceRequest,
  ReservationRequest,
  LedgerSummary,
  DailySummary,
};
