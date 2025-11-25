"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  apiClient,
  Member,
  Staff,
  Seat,
  Reservation,
  LedgerEntry,
  StartServiceRequest,
  ReservationRequest,
  LedgerSummary,
} from "../api/client";

interface AuthState {
  isLoggedIn: boolean;
  user?: {
    username: string;
  };
}

interface AppState {
  // 로딩 상태
  loading: boolean;
  setLoading: (loading: boolean) => void;

  // 인증
  auth: AuthState;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  checkAuth: () => Promise<boolean>;

  // 직원
  staff: Staff[];
  fetchStaff: () => Promise<void>;

  // 좌석
  seats: Seat[];
  fetchSeats: () => Promise<void>;
  startService: (seatId: number, data: StartServiceRequest) => Promise<Seat>;
  completeService: (seatId: number) => Promise<LedgerEntry>;
  cancelService: (seatId: number) => Promise<void>;

  // 고객
  members: Member[];
  fetchMembers: (search?: string) => Promise<void>;
  searchMemberByPhone: (phone: string) => Promise<Member | null>;
  addMember: (data: { name: string; phone: string }) => Promise<Member>;
  updateMember: (
    id: string,
    data: { name: string; phone: string },
  ) => Promise<void>;
  deleteMember: (id: string) => Promise<void>;
  addStamp: (memberId: string) => Promise<number>;
  resetStamps: (memberId: string) => Promise<void>;

  // 예약
  reservations: Reservation[];
  fetchReservations: (params?: {
    status?: string;
    date?: string;
    all?: boolean;
  }) => Promise<void>;
  addReservation: (data: ReservationRequest) => Promise<Reservation>;
  updateReservation: (id: string, data: ReservationRequest) => Promise<void>;
  updateReservationStatus: (id: string, status: string) => Promise<void>;
  deleteReservation: (id: string) => Promise<void>;

  // 매출
  ledger: LedgerEntry[];
  ledgerSummary: LedgerSummary | null;
  fetchLedger: (params?: {
    date?: string;
    startDate?: string;
    endDate?: string;
    staffId?: string;
  }) => Promise<void>;
  fetchLedgerSummary: (params?: {
    date?: string;
    startDate?: string;
    endDate?: string;
  }) => Promise<void>;

  // 손님 카운터 (이름 미입력 시)
  guestCounter: number;
  incrementGuestCounter: () => string;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // 로딩 상태
      loading: false,
      setLoading: (loading) => set({ loading }),

      // 인증 상태
      auth: { isLoggedIn: false },

      login: async (username: string, password: string) => {
        try {
          const response = await apiClient.login(username, password);
          set({
            auth: {
              isLoggedIn: true,
              user: { username: response.user.username },
            },
          });
          return true;
        } catch {
          return false;
        }
      },

      logout: () => {
        apiClient.logout();
        set({ auth: { isLoggedIn: false, user: undefined } });
      },

      checkAuth: async () => {
        const token = apiClient.getToken();
        if (!token) {
          set({ auth: { isLoggedIn: false, user: undefined } });
          return false;
        }
        try {
          const user = await apiClient.getCurrentUser();
          set({
            auth: { isLoggedIn: true, user: { username: user.username } },
          });
          return true;
        } catch {
          apiClient.logout();
          set({ auth: { isLoggedIn: false, user: undefined } });
          return false;
        }
      },

      // 직원
      staff: [],
      fetchStaff: async () => {
        try {
          const staff = await apiClient.getStaff();
          set({ staff });
        } catch (error) {
          console.error("직원 목록 조회 실패:", error);
        }
      },

      // 좌석
      seats: [],
      fetchSeats: async () => {
        try {
          const seats = await apiClient.getSeats();
          set({ seats });
        } catch (error) {
          console.error("좌석 목록 조회 실패:", error);
        }
      },

      startService: async (seatId: number, data: StartServiceRequest) => {
        const seat = await apiClient.startService(seatId, data);
        await get().fetchSeats();
        return seat;
      },

      completeService: async (seatId: number) => {
        const result = await apiClient.completeService(seatId);
        await get().fetchSeats();
        return result.ledger;
      },

      cancelService: async (seatId: number) => {
        await apiClient.cancelService(seatId);
        await get().fetchSeats();
      },

      // 고객
      members: [],
      fetchMembers: async (search?: string) => {
        try {
          const members = await apiClient.getMembers(search);
          set({ members });
        } catch (error) {
          console.error("회원 목록 조회 실패:", error);
        }
      },

      searchMemberByPhone: async (phone: string) => {
        try {
          return await apiClient.searchMemberByPhone(phone);
        } catch {
          return null;
        }
      },

      addMember: async (data: { name: string; phone: string }) => {
        const member = await apiClient.createMember(data);
        await get().fetchMembers();
        return member;
      },

      updateMember: async (
        id: string,
        data: { name: string; phone: string },
      ) => {
        await apiClient.updateMember(id, data);
        await get().fetchMembers();
      },

      deleteMember: async (id: string) => {
        await apiClient.deleteMember(id);
        await get().fetchMembers();
      },

      addStamp: async (memberId: string) => {
        const member = await apiClient.addStamp(memberId);
        await get().fetchMembers();
        return member.stamps;
      },

      resetStamps: async (memberId: string) => {
        await apiClient.resetStamps(memberId);
        await get().fetchMembers();
      },

      // 예약
      reservations: [],
      fetchReservations: async (params) => {
        try {
          const reservations = await apiClient.getReservations(params);
          set({ reservations });
        } catch (error) {
          console.error("예약 목록 조회 실패:", error);
        }
      },

      addReservation: async (data: ReservationRequest) => {
        const reservation = await apiClient.createReservation(data);
        await get().fetchReservations();
        return reservation;
      },

      updateReservation: async (id: string, data: ReservationRequest) => {
        await apiClient.updateReservation(id, data);
        await get().fetchReservations();
      },

      updateReservationStatus: async (id: string, status: string) => {
        await apiClient.updateReservationStatus(id, status);
        await get().fetchReservations();
      },

      deleteReservation: async (id: string) => {
        await apiClient.deleteReservation(id);
        await get().fetchReservations();
      },

      // 매출
      ledger: [],
      ledgerSummary: null,
      fetchLedger: async (params) => {
        try {
          const ledger = await apiClient.getLedgerEntries(params);
          set({ ledger });
        } catch (error) {
          console.error("매출 목록 조회 실패:", error);
        }
      },

      fetchLedgerSummary: async (params) => {
        try {
          const summary = await apiClient.getLedgerSummary(params);
          set({ ledgerSummary: summary });
        } catch (error) {
          console.error("매출 요약 조회 실패:", error);
        }
      },

      // 손님 카운터
      guestCounter: 0,
      incrementGuestCounter: () => {
        const newCounter = get().guestCounter + 1;
        set({ guestCounter: newCounter });
        return `손님${newCounter}`;
      },
    }),
    {
      name: "timehair-storage",
      partialize: (state) => ({
        auth: state.auth,
        guestCounter: state.guestCounter,
      }),
    },
  ),
);
