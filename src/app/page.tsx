"use client";

import React, { useState, useEffect } from "react";
import {
  Row,
  Col,
  Typography,
  Table,
  Tag,
  message,
  Modal,
  Card,
  Button,
  Spin,
} from "antd";
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import { MainLayout } from "@/components/common/MainLayout";
import { SeatCard } from "@/components/dashboard/SeatCard";
import { StartServiceModal } from "@/components/dashboard/StartServiceModal";
import { useStore } from "@/lib/store/useStore";
import type { SelectedService } from "@/lib/api/client";
import dayjs from "dayjs";

const { Title, Text } = Typography;

export default function DashboardPage() {
  const {
    seats,
    fetchSeats,
    reservations,
    fetchReservations,
    staff,
    fetchStaff,
    startService,
    completeService,
    addStamp,
  } = useStore();
  const [startModalOpen, setStartModalOpen] = useState(false);
  const [selectedSeatId, setSelectedSeatId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  // 초기 데이터 로드
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchSeats(), fetchReservations(), fetchStaff()]);
      setLoading(false);
    };
    loadData();
  }, [fetchSeats, fetchReservations, fetchStaff]);

  // 좌석 상태 통계
  const availableCount = seats.filter((s) => s.status === "available").length;
  const inUseCount = seats.filter((s) => s.status === "in_use").length;

  const handleClickAvailable = (seatId: number) => {
    setSelectedSeatId(seatId);
    setStartModalOpen(true);
  };

  const handleStartService = async (
    seatId: number,
    data: {
      memberId?: string | null;
      memberName: string;
      staffId: string;
      services: SelectedService[];
      totalPrice: number;
      reservationId?: string | null;
    },
  ) => {
    try {
      const staffMember = staff.find((s) => s.id === data.staffId);

      await startService(seatId, {
        memberId: data.memberId || undefined,
        memberName: data.memberName,
        services: data.services,
        totalPrice: data.totalPrice,
        staffId: data.staffId,
        staffName: staffMember?.name || "",
        reservationId: data.reservationId || undefined,
      });

      message.success("시술이 시작되었습니다");
    } catch (error) {
      message.error("시술 시작에 실패했습니다");
      console.error(error);
    }
  };

  const handleClickComplete = (seatId: number) => {
    const seat = seats.find((s) => s.id === seatId);
    if (!seat || !seat.currentSession) return;

    Modal.confirm({
      title: (
        <span style={{ fontSize: 20 }}>
          <CheckCircleOutlined style={{ color: "#52c41a", marginRight: 10 }} />
          시술 완료
        </span>
      ),
      content: (
        <div style={{ padding: "16px 0", fontSize: 17 }}>
          <strong>{seat.currentSession.memberName}</strong>님의 시술을
          완료하시겠습니까?
          <div
            style={{
              marginTop: 12,
              padding: 12,
              background: "#f5f5f5",
              borderRadius: 8,
            }}
          >
            <Text style={{ fontSize: 16 }}>
              결제 금액:{" "}
              <strong style={{ color: "#1890ff", fontSize: 20 }}>
                {new Intl.NumberFormat("ko-KR").format(
                  seat.currentSession.totalPrice,
                )}
                원
              </strong>
            </Text>
          </div>
        </div>
      ),
      okText: "완료",
      cancelText: "취소",
      okButtonProps: {
        size: "large",
        style: {
          height: 52,
          fontSize: 17,
          background: "#52c41a",
          borderColor: "#52c41a",
        },
      },
      cancelButtonProps: {
        size: "large",
        style: { height: 52, fontSize: 17 },
      },
      width: 480,
      onOk: async () => {
        try {
          const session = seat.currentSession;
          await completeService(seatId);

          // 멤버십 고객이면 스탬프 추가
          if (session?.memberId) {
            const newStamps = await addStamp(session.memberId);
            if (newStamps >= 10) {
              message.info(`스탬프 ${newStamps}개! 혜택 사용 가능`);
            } else {
              message.info(`스탬프 ${newStamps}/10`);
            }
          }

          message.success("시술이 완료되었습니다");
        } catch (error) {
          message.error("시술 완료에 실패했습니다");
          console.error(error);
        }
      },
    });
  };

  const todayReservations = reservations.filter((r) => {
    return (
      dayjs(r.reservedAt).isSame(dayjs(), "day") && r.status !== "cancelled"
    );
  });

  const reservationColumns = [
    {
      title: "시간",
      dataIndex: "reservedAt",
      key: "time",
      width: 100,
      render: (date: string) => (
        <span style={{ fontSize: 18, fontWeight: 600, color: "#333" }}>
          {dayjs(date).format("HH:mm")}
        </span>
      ),
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
          {services.map((s) => s.name).join(", ")}
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
      title: "상태",
      dataIndex: "status",
      key: "status",
      width: 100,
      render: (status: string) => {
        const statusMap: Record<string, { color: string; text: string }> = {
          scheduled: { color: "blue", text: "대기" },
          in_progress: { color: "red", text: "진행중" },
          completed: { color: "green", text: "완료" },
        };
        const config = statusMap[status] || { color: "default", text: status };
        return (
          <Tag
            color={config.color}
            style={{ fontSize: 15, padding: "6px 14px", fontWeight: 500 }}
          >
            {config.text}
          </Tag>
        );
      },
    },
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
      {/* 상단 통계 및 헤더 */}
      <Row gutter={20} style={{ marginBottom: 20 }}>
        <Col flex="auto">
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <Title level={3} style={{ margin: 0, fontSize: 26 }}>
              좌석 현황
            </Title>
            <div style={{ display: "flex", gap: 12 }}>
              <Tag
                color="green"
                style={{
                  fontSize: 15,
                  padding: "6px 16px",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <CheckCircleOutlined />
                비어있음 {availableCount}
              </Tag>
              <Tag
                color="red"
                style={{
                  fontSize: 15,
                  padding: "6px 16px",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <ClockCircleOutlined />
                시술중 {inUseCount}
              </Tag>
            </div>
          </div>
        </Col>
      </Row>

      {/* 좌석 그리드 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {seats.map((seat) => (
          <Col key={seat.id} xs={24} sm={12} md={8} lg={8} xl={6}>
            <SeatCard
              seat={seat}
              onClickAvailable={handleClickAvailable}
              onClickComplete={handleClickComplete}
            />
          </Col>
        ))}
      </Row>

      {/* 오늘 예약 */}
      <Card
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <CalendarOutlined style={{ fontSize: 22, color: "#1890ff" }} />
            <Title level={4} style={{ margin: 0, fontSize: 20 }}>
              오늘 예약
            </Title>
            <Tag color="blue" style={{ marginLeft: 8, fontSize: 14 }}>
              {todayReservations.length}건
            </Tag>
          </div>
        }
        style={{ borderRadius: 16 }}
        styles={{ body: { padding: 16 } }}
      >
        <Table
          dataSource={todayReservations}
          columns={reservationColumns}
          rowKey="id"
          pagination={false}
          locale={{
            emptyText: (
              <div className="empty-state">
                <CalendarOutlined className="empty-state-icon" />
                <div className="empty-state-text">오늘 예약이 없습니다</div>
                <Button
                  type="primary"
                  icon={<CalendarOutlined />}
                  onClick={() => (window.location.href = "/reservations")}
                  style={{ borderRadius: 10 }}
                >
                  새 예약 만들기
                </Button>
              </div>
            ),
          }}
          size="large"
        />
      </Card>

      <StartServiceModal
        open={startModalOpen}
        seatId={selectedSeatId}
        onClose={() => {
          setStartModalOpen(false);
          setSelectedSeatId(null);
        }}
        onStart={handleStartService}
      />
    </MainLayout>
  );
}
