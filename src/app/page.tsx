"use client";

import React, { useState } from "react";
import {
  Row,
  Col,
  Typography,
  Table,
  Tag,
  message,
  Modal,
  Card,
  Input,
  Button,
  Space,
} from "antd";
import { SearchOutlined, UserOutlined } from "@ant-design/icons";
import { MainLayout } from "@/components/common/MainLayout";
import { SeatCard } from "@/components/dashboard/SeatCard";
import { StartServiceModal } from "@/components/dashboard/StartServiceModal";
import { useStore } from "@/lib/store/useStore";
import { SelectedService, Member } from "@/lib/types";
import dayjs from "dayjs";

const { Title, Text } = Typography;

export default function DashboardPage() {
  const {
    seats,
    updateSeat,
    reservations,
    addLedgerEntry,
    staff,
    addStamp,
    members,
  } = useStore();
  const [startModalOpen, setStartModalOpen] = useState(false);
  const [selectedSeatId, setSelectedSeatId] = useState<number | null>(null);
  const [memberSearchText, setMemberSearchText] = useState("");
  const [showMemberSearch, setShowMemberSearch] = useState(false);

  // 회원 검색 결과
  const searchedMembers = memberSearchText
    ? members.filter(
        (m) =>
          m.name.includes(memberSearchText) ||
          m.phone.includes(memberSearchText),
      )
    : [];

  const handleClickAvailable = (seatId: number) => {
    setSelectedSeatId(seatId);
    setStartModalOpen(true);
  };

  const handleStartService = (
    seatId: number,
    data: {
      memberId?: string | null;
      memberName: string;
      staffId: string;
      services: SelectedService[];
      totalPrice: number;
    },
  ) => {
    const staffMember = staff.find((s) => s.id === data.staffId);

    updateSeat(seatId, {
      status: "in_use",
      currentSession: {
        id: `session-${Date.now()}`,
        memberId: data.memberId,
        memberName: data.memberName,
        services: data.services,
        totalPrice: data.totalPrice,
        staffId: data.staffId,
        staffName: staffMember?.name || "",
        startTime: dayjs().toISOString(),
      },
    });

    message.success("시술이 시작되었습니다");
  };

  const handleClickComplete = (seatId: number) => {
    const seat = seats.find((s) => s.id === seatId);
    if (!seat || !seat.currentSession) return;

    Modal.confirm({
      title: "시술 완료",
      content: `${seat.currentSession.memberName}님의 시술을 완료하시겠습니까?`,
      okText: "완료",
      cancelText: "취소",
      onOk: () => {
        addLedgerEntry({
          id: `ledger-${Date.now()}`,
          memberId: seat.currentSession?.memberId,
          memberName: seat.currentSession?.memberName || "",
          seatId: seatId,
          staffId: seat.currentSession?.staffId || "",
          staffName: seat.currentSession?.staffName || "",
          services: seat.currentSession?.services || [],
          totalPrice: seat.currentSession?.totalPrice || 0,
          completedAt: dayjs().toISOString(),
        });

        // 멤버십 고객이면 스탬프 추가
        if (seat.currentSession?.memberId) {
          const newStamps = addStamp(seat.currentSession.memberId);
          if (newStamps >= 10) {
            message.info(`스탬프 ${newStamps}개! 혜택 사용 가능`);
          } else {
            message.info(`스탬프 ${newStamps}/10`);
          }
        }

        updateSeat(seatId, {
          status: "available",
          currentSession: undefined,
        });

        message.success("시술이 완료되었습니다");
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
      render: (date: string) => (
        <span style={{ fontSize: 16, fontWeight: 500 }}>
          {dayjs(date).format("HH:mm")}
        </span>
      ),
    },
    {
      title: "고객",
      dataIndex: "memberName",
      key: "member",
      render: (name: string) => <span style={{ fontSize: 16 }}>{name}</span>,
    },
    {
      title: "서비스",
      dataIndex: "services",
      key: "services",
      render: (services: SelectedService[]) => (
        <span style={{ fontSize: 15 }}>
          {services.map((s) => s.name).join(", ")}
        </span>
      ),
    },
    {
      title: "담당",
      dataIndex: "staffName",
      key: "staff",
      render: (name: string) => <span style={{ fontSize: 15 }}>{name}</span>,
    },
    {
      title: "상태",
      dataIndex: "status",
      key: "status",
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
            style={{ fontSize: 14, padding: "4px 12px" }}
          >
            {config.text}
          </Tag>
        );
      },
    },
  ];

  return (
    <MainLayout>
      <Row gutter={12} style={{ marginBottom: 12 }}>
        <Col flex="auto">
          <Title level={4} style={{ margin: 0 }}>
            좌석 현황
          </Title>
        </Col>
        <Col>
          <Button
            icon={<UserOutlined />}
            onClick={() => setShowMemberSearch(!showMemberSearch)}
            type={showMemberSearch ? "primary" : "default"}
          >
            회원 조회
          </Button>
        </Col>
      </Row>

      {showMemberSearch && (
        <Card
          size="small"
          style={{ marginBottom: 16, borderRadius: 8 }}
          bodyStyle={{ padding: 12 }}
        >
          <Input
            placeholder="이름 또는 전화번호로 검색"
            prefix={<SearchOutlined />}
            value={memberSearchText}
            onChange={(e) => setMemberSearchText(e.target.value)}
            size="large"
            style={{ marginBottom: 12 }}
            allowClear
          />
          {memberSearchText && (
            <div style={{ maxHeight: 200, overflowY: "auto" }}>
              {searchedMembers.length > 0 ? (
                searchedMembers.map((member) => (
                  <div
                    key={member.id}
                    style={{
                      padding: "12px",
                      borderBottom: "1px solid #f0f0f0",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <Text strong style={{ fontSize: 16 }}>
                        {member.name}
                      </Text>
                      <br />
                      <Text type="secondary">{member.phone}</Text>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <Text
                        style={{
                          color:
                            (member.stamps || 0) >= 10 ? "#52c41a" : undefined,
                          fontWeight: (member.stamps || 0) >= 10 ? 600 : 400,
                        }}
                      >
                        스탬프 {member.stamps || 0}/10
                      </Text>
                      {(member.stamps || 0) >= 10 && (
                        <Tag color="green" style={{ marginLeft: 8 }}>
                          혜택가능
                        </Tag>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <Text type="secondary">검색 결과가 없습니다</Text>
              )}
            </div>
          )}
        </Card>
      )}

      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        {seats.map((seat) => (
          <Col key={seat.id} xs={24} sm={12} md={8} lg={8} xl={4.8}>
            <SeatCard
              seat={seat}
              onClickAvailable={handleClickAvailable}
              onClickComplete={handleClickComplete}
            />
          </Col>
        ))}
      </Row>

      <Card
        title={
          <Title level={5} style={{ margin: 0 }}>
            오늘 예약
          </Title>
        }
        style={{ borderRadius: 8 }}
        bodyStyle={{ padding: 12 }}
      >
        <Table
          dataSource={todayReservations}
          columns={reservationColumns}
          rowKey="id"
          pagination={false}
          locale={{ emptyText: "오늘 예약이 없습니다" }}
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
