"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Typography,
  Table,
  DatePicker,
  Card,
  Row,
  Col,
  Tag,
  Button,
  Spin,
} from "antd";
import {
  DollarOutlined,
  ShoppingOutlined,
  BarChartOutlined,
  TeamOutlined,
  EnvironmentOutlined,
} from "@ant-design/icons";
import { MainLayout } from "@/components/common/MainLayout";
import { useStore } from "@/lib/store/useStore";
import type { SelectedService, LedgerEntry } from "@/lib/api/client";
import dayjs, { Dayjs } from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import isoWeek from "dayjs/plugin/isoWeek";

dayjs.extend(isBetween);
dayjs.extend(isoWeek);

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

export default function LedgerPage() {
  const { ledger, fetchLedger, staff, fetchStaff, seats, fetchSeats } =
    useStore();
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([
    dayjs().startOf("day"),
    dayjs().endOf("day"),
  ]);
  const [filterType, setFilterType] = useState<
    "day" | "week" | "month" | "custom"
  >("day");
  const [loading, setLoading] = useState(true);

  // 초기 데이터 로드
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchStaff(), fetchSeats()]);
      setLoading(false);
    };
    loadData();
  }, [fetchStaff, fetchSeats]);

  // 날짜 변경시 매출 데이터 로드
  useEffect(() => {
    const loadLedger = async () => {
      await fetchLedger({
        startDate: dateRange[0].format("YYYY-MM-DD"),
        endDate: dateRange[1].format("YYYY-MM-DD"),
      });
    };
    loadLedger();
  }, [dateRange, fetchLedger]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("ko-KR").format(price) + "원";
  };

  const handleFilterChange = (type: "day" | "week" | "month" | "custom") => {
    setFilterType(type);
    const today = dayjs();

    switch (type) {
      case "day":
        setDateRange([today.startOf("day"), today.endOf("day")]);
        break;
      case "week":
        setDateRange([today.startOf("isoWeek"), today.endOf("isoWeek")]);
        break;
      case "month":
        setDateRange([today.startOf("month"), today.endOf("month")]);
        break;
    }
  };

  // 통계 계산
  const stats = useMemo(() => {
    const totalRevenue = ledger.reduce((sum, l) => sum + l.totalPrice, 0);
    const totalCount = ledger.length;
    const avgPrice = totalCount > 0 ? Math.round(totalRevenue / totalCount) : 0;

    // 좌석별 매출
    const seatRevenue = seats
      .map((seat) => {
        const seatLedger = ledger.filter(
          (l: LedgerEntry) => l.seatId === seat.id,
        );
        return {
          name: seat.name,
          revenue: seatLedger.reduce(
            (sum: number, l: LedgerEntry) => sum + l.totalPrice,
            0,
          ),
          count: seatLedger.length,
        };
      })
      .sort((a, b) => b.revenue - a.revenue);

    // 직원별 매출
    const staffRevenue = staff
      .map((s) => {
        const staffLedger = ledger.filter(
          (l: LedgerEntry) => l.staffId === s.id,
        );
        return {
          name: s.name,
          revenue: staffLedger.reduce(
            (sum: number, l: LedgerEntry) => sum + l.totalPrice,
            0,
          ),
          count: staffLedger.length,
        };
      })
      .sort((a, b) => b.revenue - a.revenue);

    return { totalRevenue, totalCount, avgPrice, seatRevenue, staffRevenue };
  }, [ledger, seats, staff]);

  const columns = [
    {
      title: "시간",
      dataIndex: "completedAt",
      key: "time",
      width: 160,
      render: (date: string) => (
        <span style={{ fontSize: 16 }}>
          {dayjs(date).format("MM/DD HH:mm")}
        </span>
      ),
      sorter: (a: LedgerEntry, b: LedgerEntry) =>
        dayjs(a.completedAt).unix() - dayjs(b.completedAt).unix(),
    },
    {
      title: "고객",
      dataIndex: "memberName",
      key: "member",
      width: 120,
      render: (name: string) => (
        <span style={{ fontSize: 17, fontWeight: 500 }}>{name}</span>
      ),
    },
    {
      title: "서비스",
      dataIndex: "services",
      key: "services",
      render: (services: SelectedService[]) => (
        <span style={{ fontSize: 16, color: "#666" }}>
          {services?.map((s) => s.name).join(", ") || "-"}
        </span>
      ),
    },
    {
      title: "담당",
      dataIndex: "staffName",
      key: "staff",
      width: 100,
      render: (name: string) => <span style={{ fontSize: 16 }}>{name}</span>,
    },
    {
      title: "금액",
      dataIndex: "totalPrice",
      key: "price",
      width: 140,
      render: (price: number) => (
        <Text strong style={{ color: "#1890ff", fontSize: 18 }}>
          {formatPrice(price)}
        </Text>
      ),
    },
  ];

  const filterButtons = [
    { key: "day", label: "오늘" },
    { key: "week", label: "이번 주" },
    { key: "month", label: "이번 달" },
  ];

  if (loading) {
    return (
      <MainLayout>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "60vh",
          }}
        >
          <Spin size="large" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      {/* 헤더 */}
      <Row gutter={20} style={{ marginBottom: 24 }}>
        <Col flex="auto">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <BarChartOutlined style={{ fontSize: 28, color: "#1890ff" }} />
            <Title level={3} style={{ margin: 0, fontSize: 26 }}>
              매출 리포트
            </Title>
          </div>
        </Col>
      </Row>

      {/* 필터 */}
      <Card
        style={{ marginBottom: 20, borderRadius: 16 }}
        styles={{ body: { padding: 20 } }}
      >
        <Row gutter={16} align="middle">
          <Col>
            <div style={{ display: "flex", gap: 8 }}>
              {filterButtons.map((btn) => (
                <Button
                  key={btn.key}
                  type={filterType === btn.key ? "primary" : "default"}
                  onClick={() =>
                    handleFilterChange(btn.key as "day" | "week" | "month")
                  }
                  size="large"
                  style={{
                    height: 48,
                    paddingInline: 24,
                    fontSize: 16,
                    borderRadius: 10,
                  }}
                >
                  {btn.label}
                </Button>
              ))}
            </div>
          </Col>
          <Col flex="auto">
            <RangePicker
              value={dateRange}
              onChange={(dates) => {
                if (dates && dates[0] && dates[1]) {
                  setDateRange([dates[0], dates[1]]);
                  setFilterType("custom");
                }
              }}
              size="large"
              style={{ width: "100%", maxWidth: 320 }}
            />
          </Col>
          <Col>
            <Text style={{ fontSize: 15, color: "#666" }}>
              {dateRange[0].format("YYYY.MM.DD")} ~{" "}
              {dateRange[1].format("YYYY.MM.DD")}
            </Text>
          </Col>
        </Row>
      </Card>

      {/* 통계 카드 */}
      <Row gutter={20} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={8}>
          <Card
            style={{
              borderRadius: 16,
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            }}
            styles={{ body: { padding: 24 } }}
          >
            <div
              style={{
                color: "rgba(255,255,255,0.8)",
                fontSize: 15,
                marginBottom: 8,
              }}
            >
              <DollarOutlined style={{ marginRight: 8 }} />총 매출
            </div>
            <div style={{ color: "#fff", fontSize: 36, fontWeight: 700 }}>
              {new Intl.NumberFormat("ko-KR").format(stats.totalRevenue)}
              <span style={{ fontSize: 18, fontWeight: 400, marginLeft: 4 }}>
                원
              </span>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card style={{ borderRadius: 16 }} styles={{ body: { padding: 24 } }}>
            <div style={{ color: "#666", fontSize: 15, marginBottom: 8 }}>
              <ShoppingOutlined style={{ marginRight: 8 }} />총 건수
            </div>
            <div style={{ color: "#333", fontSize: 36, fontWeight: 700 }}>
              {stats.totalCount}
              <span style={{ fontSize: 18, fontWeight: 400, marginLeft: 4 }}>
                건
              </span>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card style={{ borderRadius: 16 }} styles={{ body: { padding: 24 } }}>
            <div style={{ color: "#666", fontSize: 15, marginBottom: 8 }}>
              <BarChartOutlined style={{ marginRight: 8 }} />
              평균 단가
            </div>
            <div style={{ color: "#1890ff", fontSize: 36, fontWeight: 700 }}>
              {new Intl.NumberFormat("ko-KR").format(stats.avgPrice)}
              <span style={{ fontSize: 18, fontWeight: 400, marginLeft: 4 }}>
                원
              </span>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 세부 매출 */}
      <Row gutter={20} style={{ marginBottom: 24 }}>
        <Col xs={24} md={12}>
          <Card
            title={
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <EnvironmentOutlined
                  style={{ fontSize: 20, color: "#1890ff" }}
                />
                <span style={{ fontSize: 18 }}>좌석별 매출</span>
              </div>
            }
            style={{ borderRadius: 16, height: "100%" }}
            styles={{ body: { padding: 20 } }}
          >
            {stats.seatRevenue.map((seat, index) => (
              <div
                key={seat.name}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "14px 16px",
                  background: index === 0 ? "#f0f5ff" : "transparent",
                  borderRadius: 10,
                  marginBottom: 8,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  {index === 0 && <Tag color="gold">TOP</Tag>}
                  <Text style={{ fontSize: 17 }}>{seat.name}</Text>
                </div>
                <div style={{ textAlign: "right" }}>
                  <Text strong style={{ fontSize: 18, color: "#1890ff" }}>
                    {formatPrice(seat.revenue)}
                  </Text>
                  <Text
                    type="secondary"
                    style={{ marginLeft: 8, fontSize: 14 }}
                  >
                    {seat.count}건
                  </Text>
                </div>
              </div>
            ))}
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card
            title={
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <TeamOutlined style={{ fontSize: 20, color: "#52c41a" }} />
                <span style={{ fontSize: 18 }}>직원별 매출</span>
              </div>
            }
            style={{ borderRadius: 16, height: "100%" }}
            styles={{ body: { padding: 20 } }}
          >
            {stats.staffRevenue.map((s, index) => (
              <div
                key={s.name}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "14px 16px",
                  background: index === 0 ? "#f6ffed" : "transparent",
                  borderRadius: 10,
                  marginBottom: 8,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  {index === 0 && <Tag color="gold">TOP</Tag>}
                  <Text style={{ fontSize: 17 }}>{s.name}</Text>
                </div>
                <div style={{ textAlign: "right" }}>
                  <Text strong style={{ fontSize: 18, color: "#52c41a" }}>
                    {formatPrice(s.revenue)}
                  </Text>
                  <Text
                    type="secondary"
                    style={{ marginLeft: 8, fontSize: 14 }}
                  >
                    {s.count}건
                  </Text>
                </div>
              </div>
            ))}
          </Card>
        </Col>
      </Row>

      {/* 상세 내역 */}
      <Card
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <ShoppingOutlined style={{ fontSize: 20, color: "#1890ff" }} />
            <span style={{ fontSize: 18 }}>상세 내역</span>
            <Tag color="blue" style={{ marginLeft: 8 }}>
              {ledger.length}건
            </Tag>
          </div>
        }
        style={{ borderRadius: 16 }}
        styles={{ body: { padding: 16 } }}
      >
        <Table
          dataSource={ledger}
          columns={columns}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showTotal: (total) => `총 ${total}건`,
          }}
          locale={{
            emptyText: (
              <div className="empty-state">
                <DollarOutlined className="empty-state-icon" />
                <div className="empty-state-text">
                  해당 기간에 매출이 없습니다
                </div>
                <Button
                  type="default"
                  onClick={() => handleFilterChange("month")}
                  style={{ borderRadius: 10 }}
                >
                  이번 달 전체 보기
                </Button>
              </div>
            ),
          }}
          size="large"
        />
      </Card>
    </MainLayout>
  );
}
