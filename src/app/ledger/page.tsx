'use client';

import React, { useState, useMemo } from 'react';
import { Typography, Table, DatePicker, Card, Row, Col, Statistic, Select } from 'antd';
import { DollarOutlined, ShoppingOutlined } from '@ant-design/icons';
import { MainLayout } from '@/components/common/MainLayout';
import { useStore } from '@/lib/store/useStore';
import { SelectedService, LedgerEntry } from '@/lib/types';
import dayjs, { Dayjs } from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import isoWeek from 'dayjs/plugin/isoWeek';

dayjs.extend(isBetween);
dayjs.extend(isoWeek);

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

export default function LedgerPage() {
  const { ledger, staff, seats } = useStore();
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([
    dayjs().startOf('day'),
    dayjs().endOf('day'),
  ]);
  const [filterType, setFilterType] = useState<'day' | 'week' | 'month' | 'custom'>('day');

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ko-KR').format(price) + '원';
  };

  const handleFilterChange = (type: 'day' | 'week' | 'month' | 'custom') => {
    setFilterType(type);
    const today = dayjs();

    switch (type) {
      case 'day':
        setDateRange([today.startOf('day'), today.endOf('day')]);
        break;
      case 'week':
        setDateRange([today.startOf('isoWeek'), today.endOf('isoWeek')]);
        break;
      case 'month':
        setDateRange([today.startOf('month'), today.endOf('month')]);
        break;
    }
  };

  const filteredLedger = useMemo(() => {
    return ledger.filter(entry => {
      const entryDate = dayjs(entry.completedAt);
      return entryDate.isBetween(dateRange[0], dateRange[1], null, '[]');
    });
  }, [ledger, dateRange]);

  // 통계 계산
  const stats = useMemo(() => {
    const totalRevenue = filteredLedger.reduce((sum, l) => sum + l.totalPrice, 0);
    const totalCount = filteredLedger.length;

    // 좌석별 매출
    const seatRevenue = seats.map(seat => {
      const seatLedger = filteredLedger.filter(l => l.seatId === seat.id);
      return {
        name: seat.name,
        revenue: seatLedger.reduce((sum, l) => sum + l.totalPrice, 0),
        count: seatLedger.length,
      };
    });

    // 직원별 매출
    const staffRevenue = staff.map(s => {
      const staffLedger = filteredLedger.filter(l => l.staffId === s.id);
      return {
        name: s.name,
        revenue: staffLedger.reduce((sum, l) => sum + l.totalPrice, 0),
        count: staffLedger.length,
      };
    });

    return { totalRevenue, totalCount, seatRevenue, staffRevenue };
  }, [filteredLedger, seats, staff]);

  const columns = [
    {
      title: '시간',
      dataIndex: 'completedAt',
      key: 'time',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm'),
      sorter: (a: LedgerEntry, b: LedgerEntry) =>
        dayjs(a.completedAt).unix() - dayjs(b.completedAt).unix(),
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
      title: '좌석',
      dataIndex: 'seatId',
      key: 'seat',
      render: (seatId: number) => `${seatId}번`,
    },
    {
      title: '담당',
      dataIndex: 'staffName',
      key: 'staff',
    },
    {
      title: '금액',
      dataIndex: 'totalPrice',
      key: 'price',
      render: (price: number) => (
        <Text strong style={{ color: '#1890ff' }}>
          {formatPrice(price)}
        </Text>
      ),
    },
  ];

  return (
    <MainLayout>
      <div style={{ marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0 }}>매출 리포트</Title>
      </div>

      <div style={{ marginBottom: 24 }}>
        <Row gutter={16} align="middle">
          <Col>
            <Select
              value={filterType}
              onChange={handleFilterChange}
              style={{ width: 120 }}
            >
              <Select.Option value="day">오늘</Select.Option>
              <Select.Option value="week">이번 주</Select.Option>
              <Select.Option value="month">이번 달</Select.Option>
              <Select.Option value="custom">기간 선택</Select.Option>
            </Select>
          </Col>
          <Col>
            <RangePicker
              value={dateRange}
              onChange={(dates) => {
                if (dates && dates[0] && dates[1]) {
                  setDateRange([dates[0], dates[1]]);
                  setFilterType('custom');
                }
              }}
            />
          </Col>
        </Row>
      </div>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="총 매출"
              value={stats.totalRevenue}
              prefix={<DollarOutlined />}
              suffix="원"
              formatter={(value) => new Intl.NumberFormat('ko-KR').format(value as number)}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="총 건수"
              value={stats.totalCount}
              prefix={<ShoppingOutlined />}
              suffix="건"
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} md={12}>
          <Card title="좌석별 매출" size="small">
            {stats.seatRevenue.map(seat => (
              <div key={seat.name} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text>{seat.name}</Text>
                <Text strong>{formatPrice(seat.revenue)} ({seat.count}건)</Text>
              </div>
            ))}
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="직원별 매출" size="small">
            {stats.staffRevenue.map(s => (
              <div key={s.name} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text>{s.name}</Text>
                <Text strong>{formatPrice(s.revenue)} ({s.count}건)</Text>
              </div>
            ))}
          </Card>
        </Col>
      </Row>

      <Card title="상세 내역">
        <Table
          dataSource={filteredLedger}
          columns={columns}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          locale={{ emptyText: '해당 기간에 매출이 없습니다' }}
        />
      </Card>
    </MainLayout>
  );
}
