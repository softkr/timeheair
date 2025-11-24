"use client";

import React from "react";
import { Card, Tag, Typography, Button } from "antd";
import {
  UserOutlined,
  ClockCircleOutlined,
  ScissorOutlined,
} from "@ant-design/icons";
import { Seat } from "@/lib/types";
import dayjs from "dayjs";

const { Text, Title } = Typography;

interface SeatCardProps {
  seat: Seat;
  onClickAvailable: (seatId: number) => void;
  onClickComplete: (seatId: number) => void;
}

export function SeatCard({
  seat,
  onClickAvailable,
  onClickComplete,
}: SeatCardProps) {
  const getStatusColor = () => {
    switch (seat.status) {
      case "available":
        return "#52c41a";
      case "in_use":
        return "#ff4d4f";
      case "reserved":
        return "#faad14";
      default:
        return "#d9d9d9";
    }
  };

  const getStatusText = () => {
    switch (seat.status) {
      case "available":
        return "비어있음";
      case "in_use":
        return "시술중";
      case "reserved":
        return "예약됨";
      default:
        return "";
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("ko-KR").format(price) + "원";
  };

  return (
    <Card
      className="kiosk-seat-card"
      style={{
        borderTop: `6px solid ${getStatusColor()}`,
        height: "100%",
        background: seat.status === "available" ? "#fff" : "#fafafa",
      }}
      bodyStyle={{ padding: "12px" }}
    >
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <Title level={3} style={{ margin: 0, fontSize: 24 }}>
          {seat.name}
        </Title>
        <Tag
          color={getStatusColor()}
          style={{
            marginTop: 12,
            fontSize: 16,
            padding: "6px 16px",
            borderRadius: 20,
          }}
        >
          {getStatusText()}
        </Tag>
      </div>

      {seat.status === "available" && (
        <div style={{ textAlign: "center", paddingTop: 20 }}>
          <Button
            type="primary"
            size="large"
            onClick={() => onClickAvailable(seat.id)}
            style={{
              width: "100%",
              height: 60,
              fontSize: 18,
              borderRadius: 12,
            }}
            icon={<ScissorOutlined />}
          >
            시술 시작
          </Button>
        </div>
      )}

      {seat.status === "in_use" && seat.currentSession && (
        <div>
          <div
            style={{
              marginBottom: 12,
              padding: "12px 16px",
              background: "#fff",
              borderRadius: 12,
            }}
          >
            <div style={{ marginBottom: 8 }}>
              <UserOutlined style={{ marginRight: 8, fontSize: 18 }} />
              <Text strong style={{ fontSize: 18 }}>
                {seat.currentSession.memberName}
              </Text>
            </div>

            <div style={{ marginBottom: 8 }}>
              {seat.currentSession.services.map((service, index) => (
                <div key={index}>
                  <Text style={{ fontSize: 15 }}>{service.name}</Text>
                  {service.length && (
                    <Text type="secondary"> ({service.length})</Text>
                  )}
                </div>
              ))}
            </div>

            <div style={{ marginBottom: 8 }}>
              <Text strong style={{ color: "#1890ff", fontSize: 22 }}>
                {formatPrice(seat.currentSession.totalPrice)}
              </Text>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <Text type="secondary" style={{ fontSize: 14 }}>
                {seat.currentSession.staffName}
              </Text>
              <Text type="secondary" style={{ fontSize: 14 }}>
                <ClockCircleOutlined style={{ marginRight: 4 }} />
                {dayjs(seat.currentSession.startTime).format("HH:mm")}
              </Text>
            </div>
          </div>

          <Button
            type="primary"
            size="large"
            style={{
              background: "#52c41a",
              borderColor: "#52c41a",
              width: "100%",
              height: 56,
              fontSize: 18,
              borderRadius: 12,
            }}
            onClick={() => onClickComplete(seat.id)}
          >
            시술 완료
          </Button>
        </div>
      )}

      {seat.status === "reserved" && (
        <div style={{ textAlign: "center", paddingTop: 20 }}>
          <Text type="secondary" style={{ fontSize: 16 }}>
            예약 대기중
          </Text>
        </div>
      )}
    </Card>
  );
}
