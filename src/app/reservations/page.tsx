'use client';

import React, { useState } from 'react';
import { Typography, Table, Button, Tag, DatePicker, Input, Space, Modal, message, Row, Col, Card } from 'antd';
import { PlusOutlined, SearchOutlined, CalendarOutlined, PlayCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { MainLayout } from '@/components/common/MainLayout';
import { NewReservationModal } from '@/components/reservations/NewReservationModal';
import { useStore } from '@/lib/store/useStore';
import { SelectedService, Reservation } from '@/lib/types';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

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
      title: (
        <span style={{ fontSize: 20 }}>
          <PlayCircleOutlined style={{ color: '#1890ff', marginRight: 10 }} />
          좌석 선택
        </span>
      ),
      content: (
        <div style={{ padding: '16px 0' }}>
          <Text style={{ fontSize: 16, marginBottom: 16, display: 'block' }}>
            시술을 시작할 좌석을 선택하세요:
          </Text>
          <Row gutter={[12, 12]}>
            {availableSeats.map(seat => (
              <Col key={seat.id} span={8}>
                <Button
                  size="large"
                  style={{
                    width: '100%',
                    height: 60,
                    fontSize: 17,
                    borderRadius: 12,
                    background: '#f6ffed',
                    borderColor: '#b7eb8f',
                  }}
                  onClick={() => {
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
              </Col>
            ))}
          </Row>
        </div>
      ),
      footer: null,
      width: 500,
    });
  };

  const handleCancelReservation = (id: string) => {
    Modal.confirm({
      title: (
        <span style={{ fontSize: 20 }}>
          <CloseCircleOutlined style={{ color: '#ff4d4f', marginRight: 10 }} />
          예약 취소
        </span>
      ),
      content: (
        <Text style={{ fontSize: 17 }}>
          정말 예약을 취소하시겠습니까?
        </Text>
      ),
      okText: '취소하기',
      cancelText: '닫기',
      okButtonProps: {
        danger: true,
        size: 'large',
        style: { height: 52, fontSize: 17 }
      },
      cancelButtonProps: {
        size: 'large',
        style: { height: 52, fontSize: 17 }
      },
      width: 420,
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
      width: 100,
      render: (date: string) => (
        <span style={{ fontSize: 18, fontWeight: 600, color: '#333' }}>
          {dayjs(date).format('HH:mm')}
        </span>
      ),
      sorter: (a: Reservation, b: Reservation) =>
        dayjs(a.reservedAt).unix() - dayjs(b.reservedAt).unix(),
    },
    {
      title: '고객',
      dataIndex: 'memberName',
      key: 'member',
      width: 120,
      render: (name: string) => (
        <span style={{ fontSize: 17, fontWeight: 500 }}>{name}</span>
      ),
    },
    {
      title: '서비스',
      dataIndex: 'services',
      key: 'services',
      render: (services: SelectedService[]) => (
        <span style={{ fontSize: 16, color: '#666' }}>
          {services.map(s => s.name).join(', ')}
        </span>
      ),
    },
    {
      title: '금액',
      dataIndex: 'totalPrice',
      key: 'price',
      width: 120,
      render: (price: number) => (
        <span style={{ fontSize: 17, fontWeight: 600, color: '#1890ff' }}>
          {formatPrice(price)}
        </span>
      ),
    },
    {
      title: '담당',
      dataIndex: 'staffName',
      key: 'staff',
      width: 100,
      render: (name: string) => (
        <span style={{ fontSize: 16 }}>{name}</span>
      ),
    },
    {
      title: '상태',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const statusMap: Record<string, { color: string; text: string }> = {
          scheduled: { color: 'blue', text: '대기' },
          in_progress: { color: 'red', text: '진행중' },
          completed: { color: 'green', text: '완료' },
          cancelled: { color: 'default', text: '취소' },
        };
        const config = statusMap[status] || { color: 'default', text: status };
        return (
          <Tag
            color={config.color}
            style={{ fontSize: 15, padding: '6px 14px', fontWeight: 500 }}
          >
            {config.text}
          </Tag>
        );
      },
    },
    {
      title: '액션',
      key: 'action',
      width: 180,
      render: (_: unknown, record: Reservation) => (
        <Space size={8}>
          {record.status === 'scheduled' && (
            <>
              <Button
                type="primary"
                size="large"
                onClick={() => handleStartReservation(record)}
                style={{
                  height: 44,
                  fontSize: 15,
                  borderRadius: 10,
                }}
                icon={<PlayCircleOutlined />}
              >
                시작
              </Button>
              <Button
                size="large"
                danger
                onClick={() => handleCancelReservation(record.id)}
                style={{
                  height: 44,
                  fontSize: 15,
                  borderRadius: 10,
                }}
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
      {/* 헤더 */}
      <Row gutter={20} style={{ marginBottom: 24 }}>
        <Col flex="auto">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <CalendarOutlined style={{ fontSize: 28, color: '#1890ff' }} />
            <Title level={3} style={{ margin: 0, fontSize: 26 }}>예약 관리</Title>
            <Tag color="blue" style={{ fontSize: 15, padding: '6px 14px' }}>
              {filteredReservations.length}건
            </Tag>
          </div>
        </Col>
        <Col>
          <Button
            type="primary"
            icon={<PlusOutlined style={{ fontSize: 18 }} />}
            onClick={() => setModalOpen(true)}
            size="large"
            style={{
              height: 52,
              paddingInline: 28,
              fontSize: 17,
              borderRadius: 12,
            }}
          >
            새 예약
          </Button>
        </Col>
      </Row>

      {/* 필터 */}
      <Card
        style={{ marginBottom: 20, borderRadius: 16 }}
        styles={{ body: { padding: 20 } }}
      >
        <Row gutter={16} align="middle">
          <Col>
            <DatePicker
              value={selectedDate}
              onChange={(date) => date && setSelectedDate(date)}
              allowClear={false}
              size="large"
              style={{ width: 180 }}
            />
          </Col>
          <Col flex="auto">
            <Input
              placeholder="고객명/전화번호 검색"
              prefix={<SearchOutlined style={{ fontSize: 18, color: '#999' }} />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              size="large"
              style={{ maxWidth: 300 }}
              allowClear
            />
          </Col>
          <Col>
            <Text style={{ fontSize: 15, color: '#666' }}>
              {selectedDate.format('YYYY년 MM월 DD일 (ddd)')}
            </Text>
          </Col>
        </Row>
      </Card>

      {/* 테이블 */}
      <Card style={{ borderRadius: 16 }} styles={{ body: { padding: 16 } }}>
        <Table
          dataSource={filteredReservations}
          columns={columns}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showTotal: (total) => `총 ${total}건`,
          }}
          locale={{
            emptyText: (
              <div style={{ padding: '60px 0' }}>
                <CalendarOutlined style={{ fontSize: 56, color: '#d9d9d9', marginBottom: 16 }} />
                <br />
                <Text type="secondary" style={{ fontSize: 17 }}>
                  해당 날짜에 예약이 없습니다
                </Text>
              </div>
            )
          }}
          size="large"
        />
      </Card>

      <NewReservationModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onAdd={addReservation}
      />
    </MainLayout>
  );
}
