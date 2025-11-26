// API URL 결정: Tauri 환경 감지 및 동적 URL 설정
const getApiBaseUrl = (): string => {
  // 1. 환경 변수 우선 (개발용)
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }

  // 2. Tauri 환경 감지 (타입 안전하게)
  if (
    typeof window !== "undefined" &&
    "document" in window &&
    !("documentMode" in window) &&
    window.location.protocol === "file:"
  ) {
    return "http://localhost:8080/api";
  }

  // 3. 일반 웹 환경 (개발 서버)
  if (
    typeof window !== "undefined" &&
    window.location.hostname === "localhost"
  ) {
    return "http://localhost:8080/api";
  }

  // 4. 프로덕션 웹 환경 (상대 경로)
  if (typeof window !== "undefined") {
    const protocol = window.location.protocol;
    const host = window.location.host;
    return `${protocol}//${host}/api`;
  }

  // 5. fallback
  return "http://localhost:8080/api";
};

const API_BASE_URL = getApiBaseUrl();

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
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

  async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { method = "GET", body, headers = {} } = options;

    const token = this.getToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    if (body) {
      headers["Content-Type"] = "application/json";
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "요청 실패" }));
      throw new Error(error.error || "요청 실패");
    }

    return response.json();
  }

  // Auth
  async login(username: string, password: string) {
    const response = await this.request<{
      token: string;
      user: { id: string; username: string };
    }>("/auth/login", { method: "POST", body: { username, password } });
    this.setToken(response.token);
    return response;
  }

  logout() {
    this.setToken(null);
  }

  async getCurrentUser() {
    return this.request<{ id: string; username: string }>("/auth/me");
  }

  // Members
  async getMembers(search?: string) {
    const query = search ? `?search=${encodeURIComponent(search)}` : "";
    return this.request<Member[]>(`/members${query}`);
  }

  async getMember(id: string) {
    return this.request<Member>(`/members/${id}`);
  }

  async searchMemberByPhone(phone: string) {
    return this.request<Member>(
      `/members/search?phone=${encodeURIComponent(phone)}`,
    );
  }

  async createMember(data: { name: string; phone: string }) {
    return this.request<Member>("/members", { method: "POST", body: data });
  }

  async updateMember(id: string, data: { name: string; phone: string }) {
    return this.request<Member>(`/members/${id}`, {
      method: "PUT",
      body: data,
    });
  }

  async deleteMember(id: string) {
    return this.request<{ message: string }>(`/members/${id}`, {
      method: "DELETE",
    });
  }

  async addStamp(id: string) {
    return this.request<Member>(`/members/${id}/stamp`, { method: "POST" });
  }

  async resetStamps(id: string) {
    return this.request<Member>(`/members/${id}/reset-stamps`, {
      method: "POST",
    });
  }

  // Staff
  async getStaff() {
    return this.request<Staff[]>("/staff");
  }

  async createStaff(data: { name: string }) {
    return this.request<Staff>("/staff", { method: "POST", body: data });
  }

  async updateStaff(id: string, data: { name: string }) {
    return this.request<Staff>(`/staff/${id}`, { method: "PUT", body: data });
  }

  async deleteStaff(id: string) {
    return this.request<{ message: string }>(`/staff/${id}`, {
      method: "DELETE",
    });
  }

  // Seats
  async getSeats() {
    return this.request<Seat[]>("/seats");
  }

  async getSeat(id: number) {
    return this.request<Seat>(`/seats/${id}`);
  }

  async startService(seatId: number, data: StartServiceRequest) {
    return this.request<Seat>(`/seats/${seatId}/start`, {
      method: "POST",
      body: data,
    });
  }

  async completeService(seatId: number) {
    return this.request<{ message: string; ledger: LedgerEntry }>(
      `/seats/${seatId}/complete`,
      { method: "POST" },
    );
  }

  async cancelService(seatId: number) {
    return this.request<{ message: string }>(`/seats/${seatId}/cancel`, {
      method: "POST",
    });
  }

  // Reservations
  async getReservations(params?: {
    status?: string;
    date?: string;
    all?: boolean;
  }) {
    const query = new URLSearchParams();
    if (params?.status) query.set("status", params.status);
    if (params?.date) query.set("date", params.date);
    if (params?.all) query.set("all", "true");
    const queryStr = query.toString();
    return this.request<Reservation[]>(
      `/reservations${queryStr ? `?${queryStr}` : ""}`,
    );
  }

  async getReservation(id: string) {
    return this.request<Reservation>(`/reservations/${id}`);
  }

  async createReservation(data: ReservationRequest) {
    return this.request<Reservation>("/reservations", {
      method: "POST",
      body: data,
    });
  }

  async updateReservation(id: string, data: ReservationRequest) {
    return this.request<Reservation>(`/reservations/${id}`, {
      method: "PUT",
      body: data,
    });
  }

  async updateReservationStatus(id: string, status: string) {
    return this.request<Reservation>(`/reservations/${id}/status`, {
      method: "PATCH",
      body: { status },
    });
  }

  async deleteReservation(id: string) {
    return this.request<{ message: string }>(`/reservations/${id}`, {
      method: "DELETE",
    });
  }

  // Ledger
  async getLedgerEntries(params?: {
    date?: string;
    startDate?: string;
    endDate?: string;
    staffId?: string;
  }) {
    const query = new URLSearchParams();
    if (params?.date) query.set("date", params.date);
    if (params?.startDate) query.set("startDate", params.startDate);
    if (params?.endDate) query.set("endDate", params.endDate);
    if (params?.staffId) query.set("staffId", params.staffId);
    const queryStr = query.toString();
    return this.request<LedgerEntry[]>(
      `/ledger${queryStr ? `?${queryStr}` : ""}`,
    );
  }

  async getLedgerSummary(params?: {
    date?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const query = new URLSearchParams();
    if (params?.date) query.set("date", params.date);
    if (params?.startDate) query.set("startDate", params.startDate);
    if (params?.endDate) query.set("endDate", params.endDate);
    const queryStr = query.toString();
    return this.request<LedgerSummary>(
      `/ledger/summary${queryStr ? `?${queryStr}` : ""}`,
    );
  }

  async getDailySummary(year?: string, month?: string) {
    const query = new URLSearchParams();
    if (year) query.set("year", year);
    if (month) query.set("month", month);
    const queryStr = query.toString();
    return this.request<DailySummary[]>(
      `/ledger/daily${queryStr ? `?${queryStr}` : ""}`,
    );
  }
}

// Types
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
  name: string;
  length?: string;
  price: number;
}

interface ServiceSession {
  id: string;
  seatId: number;
  memberId?: string;
  memberName: string;
  services?: SelectedService[];
  totalPrice: number;
  staffId: string;
  staffName: string;
  startTime: string;
  reservationId?: string;
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
  services: SelectedService[];
  totalPrice: number;
  staffId: string;
  staffName: string;
  reservationId?: string;
}

interface ReservationRequest {
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
