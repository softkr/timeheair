'use client';

import React, { useState } from 'react';
import { Typography, Table, Button, Tag, DatePicker, Input, Space, Modal, message } from 'antd';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { MainLayout } from '@/components/common/MainLayout';
import { NewReservationModal } from '@/components/reservations/NewReservationModal';
import { useStore } from '@/lib/store/useStore';
import { SelectedService, Reservation } from '@/lib/types';
import dayjs from 'dayjs';

const { Title } = Typography;

export default function ReservationsPage() {
  const { reservations, addReservation, updateReservation, deleteReservation, seats, updateSeat, staff } = useStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [searchText, setSearchText] = useState('');

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ko-KR').format(price) + '원';
  };

  const filteredReservations = reservations.filter(r => {
    const matchDate = dayjs(r.reservedAt).isSame(selectedDate, 'day');
    const matchSearch = !searchText ||
      r.memberName.includes(searchText) ||
      r.memberPhone?.includes(searchText);
    return matchDate && matchSearch;
  });

  const handleStartReservation = (reservation: Reservation) => {
    // 빈 좌석 찾기
    const availableSeats = seats.filter(s => s.status === 'available');

    if (availableSeats.length === 0) {
      message.error('빈 좌석이 없습니다');
      return;
    }

    Modal.confirm({
      title: '좌석 선택',
      content: (
        <div>
          <p>시술을 시작할 좌석을 선택하세요:</p>
          <Space wrap>
            {availableSeats.map(seat => (
              <Button
                key={seat.id}
                onClick={() => {
                  // 좌석 상태 업데이트
                  updateSeat(seat.id, {
                    status: 'in_use',
                    currentSession: {
                      id: `session-${Date.now()}`,
                      memberId: reservation.memberId,
                      memberName: reservation.memberName,
                      services: reservation.services,
                      totalPrice: reservation.totalPrice,
                      staffId: reservation.staffId,
                      staffName: reservation.staffName,
                      startTime: dayjs().toISOString(),
                      reservationId: reservation.id,
                    },
                  });

                  // 예약 상태 업데이트
                  updateReservation(reservation.id, {
                    status: 'in_progress',
                    seatId: seat.id,
                  });

                  message.success(`${seat.name}에서 시술이 시작되었습니다`);
                  Modal.destroyAll();
                }}
              >
                {seat.name}
              </Button>
            ))}
          </Space>
        </div>
      ),
      footer: null,
    });
  };

  const handleCancelReservation = (id: string) => {
    Modal.confirm({
      title: '예약 취소',
      content: '정말 예약을 취소하시겠습니까?',
      okText: '취소하기',
      cancelText: '닫기',
      okButtonProps: { danger: true },
      onOk: () => {
        updateReservation(id, { status: 'cancelled' });
        message.success('예약이 취소되었습니다');
      },
    });
  };

  const columns = [
    {
      title: '시간',
      dataIndex: 'reservedAt',
      key: 'time',
      render: (date: string) => dayjs(date).format('HH:mm'),
      sorter: (a: Reservation, b: Reservation) =>
        dayjs(a.reservedAt).unix() - dayjs(b.reservedAt).unix(),
    },
    {
      title: '고객',
      dataIndex: 'memberName',
      key: 'member',
    },
    {
      title: '서비스',
      dataIndex: 'services',
      key: 'services',
      render: (services: SelectedService[]) => services.map(s => s.name).join(', '),
    },
    {
      title: '금액',
      dataIndex: 'totalPrice',
      key: 'price',
      render: (price: number) => formatPrice(price),
    },
    {
      title: '좌석',
      dataIndex: 'seatId',
      key: 'seat',
      render: (seatId: number | null) => seatId ? `${seatId}번` : '-',
    },
    {
      title: '담당',
      dataIndex: 'staffName',
      key: 'staff',
    },
    {
      title: '상태',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const statusMap: Record<string, { color: string; text: string }> = {
          scheduled: { color: 'blue', text: '대기' },
          in_progress: { color: 'red', text: '진행중' },
          completed: { color: 'green', text: '완료' },
          cancelled: { color: 'default', text: '취소' },
        };
        const config = statusMap[status] || { color: 'default', text: status };
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: '액션',
      key: 'action',
      render: (_: unknown, record: Reservation) => (
        <Space>
          {record.status === 'scheduled' && (
            <>
              <Button
                type="primary"
                size="small"
                onClick={() => handleStartReservation(record)}
              >
                시작
              </Button>
              <Button
                size="small"
                danger
                onClick={() => handleCancelReservation(record.id)}
              >
                취소
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <MainLayout>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={4} style={{ margin: 0 }}>예약 관리</Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setModalOpen(true)}
        >
          새 예약
        </Button>
      </div>

      <div style={{ marginBottom: 16 }}>
        <Space>
          <DatePicker
            value={selectedDate}
            onChange={(date) => date && setSelectedDate(date)}
            allowClear={false}
          />
          <Input
            placeholder="고객명/전화번호 검색"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 200 }}
          />
        </Space>
      </div>

      <Table
        dataSource={filteredReservations}
        columns={columns}
        rowKey="id"
        pagination={{ pageSize: 10 }}
        locale={{ emptyText: '예약이 없습니다' }}
      />

      <NewReservationModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onAdd={addReservation}
      />
    </MainLayout>
  );
}
