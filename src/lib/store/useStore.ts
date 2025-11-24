"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  Member,
  Staff,
  Seat,
  Reservation,
  LedgerEntry,
  AuthState,
} from "../types";
import {
  initialStaff,
  initialSeats,
  defaultCredentials,
} from "../data/initialData";

interface AppState {
  // 인증
  auth: AuthState;
  login: (username: string, password: string) => boolean;
  logout: () => void;

  // 직원
  staff: Staff[];

  // 좌석
  seats: Seat[];
  updateSeat: (seatId: number, updates: Partial<Seat>) => void;

  // 고객
  members: Member[];
  addMember: (member: Member) => void;
  updateMember: (id: string, updates: Partial<Member>) => void;
  deleteMember: (id: string) => void;
  addStamp: (memberId: string) => number; // 스탬프 추가, 현재 스탬프 수 반환
  useStamps: (memberId: string) => void; // 10개 사용

  // 예약
  reservations: Reservation[];
  addReservation: (reservation: Reservation) => void;
  updateReservation: (id: string, updates: Partial<Reservation>) => void;
  deleteReservation: (id: string) => void;

  // 매출
  ledger: LedgerEntry[];
  addLedgerEntry: (entry: LedgerEntry) => void;

  // 손님 카운터 (이름 미입력 시)
  guestCounter: number;
  incrementGuestCounter: () => string;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // 인증 상태
      auth: { isLoggedIn: false },

      login: (username: string, password: string) => {
        if (
          username === defaultCredentials.username &&
          password === defaultCredentials.password
        ) {
          set({ auth: { isLoggedIn: true, user: { username } } });
          return true;
        }
        return false;
      },

      logout: () => {
        set({ auth: { isLoggedIn: false, user: undefined } });
      },

      // 직원
      staff: initialStaff,

      // 좌석
      seats: initialSeats,
      updateSeat: (seatId, updates) => {
        set((state) => ({
          seats: state.seats.map((seat) =>
            seat.id === seatId ? { ...seat, ...updates } : seat,
          ),
        }));
      },

      // 고객
      members: [],
      addMember: (member) => {
        set((state) => ({
          members: [...state.members, member],
        }));
      },
      updateMember: (id, updates) => {
        set((state) => ({
          members: state.members.map((member) =>
            member.id === id ? { ...member, ...updates } : member,
          ),
        }));
      },
      deleteMember: (id) => {
        set((state) => ({
          members: state.members.filter((member) => member.id !== id),
        }));
      },
      addStamp: (memberId) => {
        const member = get().members.find((m) => m.id === memberId);
        if (!member) return 0;

        const newStamps = member.stamps + 1;
        set((state) => ({
          members: state.members.map((m) =>
            m.id === memberId ? { ...m, stamps: newStamps } : m,
          ),
        }));
        return newStamps;
      },
      useStamps: (memberId) => {
        set((state) => ({
          members: state.members.map((m) =>
            m.id === memberId
              ? { ...m, stamps: Math.max(0, m.stamps - 10) }
              : m,
          ),
        }));
      },

      // 예약
      reservations: [],
      addReservation: (reservation) => {
        set((state) => ({
          reservations: [...state.reservations, reservation],
        }));
      },
      updateReservation: (id, updates) => {
        set((state) => ({
          reservations: state.reservations.map((res) =>
            res.id === id ? { ...res, ...updates } : res,
          ),
        }));
      },
      deleteReservation: (id) => {
        set((state) => ({
          reservations: state.reservations.filter((res) => res.id !== id),
        }));
      },

      // 매출
      ledger: [],
      addLedgerEntry: (entry) => {
        set((state) => ({
          ledger: [...state.ledger, entry],
        }));
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
    },
  ),
);
