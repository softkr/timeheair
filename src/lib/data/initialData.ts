import { Staff, Seat } from '../types';

export const initialStaff: Staff[] = [
  { id: 's001', name: '직원1' },
  { id: 's002', name: '직원2' },
];

export const initialSeats: Seat[] = [
  { id: 1, name: '1번 좌석', status: 'available' },
  { id: 2, name: '2번 좌석', status: 'available' },
  { id: 3, name: '3번 좌석', status: 'available' },
  { id: 4, name: '4번 좌석', status: 'available' },
  { id: 5, name: '5번 좌석', status: 'available' },
];

export const businessHours = {
  open: '10:00',
  close: '20:00',
  interval: 30, // 분
};

export const defaultCredentials = {
  username: 'admin',
  password: '1234',
};
