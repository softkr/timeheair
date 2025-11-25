"use client";

import React, { useState, useEffect } from "react";
import { Card, Tag, Typography, Button, Progress } from "antd";
import {
  UserOutlined,
  ClockCircleOutlined,
  ScissorOutlined,
  CheckCircleOutlined,
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
  const [elapsedMinutes, setElapsedMinutes] = useState(0);

  // 경과 시간 업데이트
  useEffect(() => {
    if (seat.status === "in_use" && seat.currentSession?.startTime) {
      const updateElapsed = () => {
        const start = dayjs(seat.currentSession?.startTime);
        const now = dayjs();
        setElapsedMinutes(now.diff(start, "minute"));
      };

      updateElapsed();
      const timer = setInterval(updateElapsed, 60000);
      return () => clearInterval(timer);
    }
  }, [seat.status, seat.currentSession?.startTime]);

  const getStatusConfig = () => {
    switch (seat.status) {
      case "available":
        return {
          color: "#52c41a",
          bgColor: "linear-gradient(135deg, #f6ffed 0%, #d9f7be 100%)",
          text: "비어있음",
          borderColor: "#b7eb8f",
        };
      case "in_use":
        return {
          color: "#ff4d4f",
          bgColor: "linear-gradient(135deg, #fff1f0 0%, #ffccc7 100%)",
          text: "시술중",
          borderColor: "#ffa39e",
        };
      case "reserved":
        return {
          color: "#faad14",
          bgColor: "linear-gradient(135deg, #fffbe6 0%, #ffe58f 100%)",
          text: "예약됨",
          borderColor: "#ffd666",
        };
      default:
        return {
          color: "#d9d9d9",
          bgColor: "#fafafa",
          text: "",
          borderColor: "#d9d9d9",
        };
    }
  };

  const statusConfig = getStatusConfig();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("ko-KR").format(price) + "원";
  };

  const formatElapsedTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}분`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}시간 ${mins}분`;
  };

  return (
    <Card
      className={`kiosk-seat-card ${seat.status === "in_use" ? "status-in-use" : ""}`}
      style={{
        height: "100%",
        background: statusConfig.bgColor,
        border: `2px solid ${statusConfig.borderColor}`,
        position: "relative",
        overflow: "hidden",
      }}
      styles={{ body: { padding: "20px" } }}
    >
      {/* 상단 상태 바 */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 8,
          background: statusConfig.color,
        }}
      />

      {/* 좌석 이름 및 상태 */}
      <div style={{ textAlign: "center", marginBottom: 20, paddingTop: 8 }}>
        <Title
          level={2}
          style={{
            margin: 0,
            fontSize: 32,
            fontWeight: 700,
            color: "#333",
          }}
        >
          {seat.name}
        </Title>
        <Tag
          color={statusConfig.color}
          style={{
            marginTop: 12,
            fontSize: 16,
            padding: "8px 20px",
            borderRadius: 20,
            fontWeight: 600,
          }}
        >
          {statusConfig.text}
        </Tag>
      </div>

      {/* 비어있는 좌석 */}
      {seat.status === "available" && (
        <div style={{ textAlign: "center", paddingTop: 30 }}>
          <div
            style={{
              width: 80,
              height: 80,
              margin: "0 auto 24px",
              borderRadius: "50%",
              background: "rgba(82, 196, 26, 0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ScissorOutlined
              style={{ fontSize: 36, color: statusConfig.color }}
            />
          </div>
          <Button
            type="primary"
            size="large"
            onClick={() => onClickAvailable(seat.id)}
            style={{
              width: "100%",
              height: 64,
              fontSize: 20,
              fontWeight: 600,
              borderRadius: 16,
              background: statusConfig.color,
              borderColor: statusConfig.color,
              boxShadow: "0 4px 12px rgba(82, 196, 26, 0.3)",
            }}
            icon={<ScissorOutlined style={{ fontSize: 22 }} />}
          >
            시술 시작
          </Button>
        </div>
      )}

      {/* 시술 중인 좌석 */}
      {seat.status === "in_use" && seat.currentSession && (
        <div>
          {/* 고객 정보 카드 */}
          <div
            style={{
              marginBottom: 16,
              padding: "16px 20px",
              background: "rgba(255, 255, 255, 0.9)",
              borderRadius: 16,
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)",
            }}
          >
            {/* 고객명 */}
            <div
              style={{
                marginBottom: 12,
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  background: "#1890ff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <UserOutlined style={{ fontSize: 20, color: "#fff" }} />
              </div>
              <Text strong style={{ fontSize: 20, color: "#333" }}>
                {seat.currentSession.memberName}
              </Text>
            </div>

            {/* 서비스 목록 */}
            <div
              style={{
                marginBottom: 12,
                padding: "10px 12px",
                background: "#f5f5f5",
                borderRadius: 10,
              }}
            >
              {seat.currentSession.services.map((service, index) => (
                <div
                  key={index}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: index < seat.currentSession!.services.length - 1 ? 6 : 0,
                  }}
                >
                  <Text style={{ fontSize: 16, color: "#666" }}>
                    {service.name}
                    {service.length && (
                      <span style={{ color: "#999" }}> ({service.length})</span>
                    )}
                  </Text>
                  <Text style={{ fontSize: 16, color: "#333" }}>
                    {formatPrice(service.price)}
                  </Text>
                </div>
              ))}
            </div>

            {/* 총 금액 */}
            <div
              style={{
                textAlign: "center",
                padding: "12px 0",
                borderTop: "1px dashed #e8e8e8",
              }}
            >
              <Text style={{ fontSize: 14, color: "#999" }}>총 금액</Text>
              <br />
              <Text
                strong
                style={{ fontSize: 28, color: "#1890ff", fontWeight: 700 }}
              >
                {formatPrice(seat.currentSession.totalPrice)}
              </Text>
            </div>

            {/* 담당자 및 시간 */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: 12,
                padding: "10px 12px",
                background: "#fafafa",
                borderRadius: 10,
              }}
            >
              <Text style={{ fontSize: 15, color: "#666" }}>
                담당: <strong>{seat.currentSession.staffName}</strong>
              </Text>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <ClockCircleOutlined style={{ color: "#ff4d4f" }} />
                <Text style={{ fontSize: 15, color: "#ff4d4f", fontWeight: 600 }}>
                  {formatElapsedTime(elapsedMinutes)}
                </Text>
              </div>
            </div>
          </div>

          {/* 완료 버튼 */}
          <Button
            type="primary"
            size="large"
            style={{
              background: "#52c41a",
              borderColor: "#52c41a",
              width: "100%",
              height: 64,
              fontSize: 20,
              fontWeight: 600,
              borderRadius: 16,
              boxShadow: "0 4px 12px rgba(82, 196, 26, 0.3)",
            }}
            onClick={() => onClickComplete(seat.id)}
            icon={<CheckCircleOutlined style={{ fontSize: 22 }} />}
          >
            시술 완료
          </Button>
        </div>
      )}

      {/* 예약된 좌석 */}
      {seat.status === "reserved" && (
        <div style={{ textAlign: "center", paddingTop: 30 }}>
          <div
            style={{
              width: 80,
              height: 80,
              margin: "0 auto 24px",
              borderRadius: "50%",
              background: "rgba(250, 173, 20, 0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ClockCircleOutlined
              style={{ fontSize: 36, color: statusConfig.color }}
            />
          </div>
          <Text style={{ fontSize: 18, color: "#999" }}>예약 대기중</Text>
        </div>
      )}
    </Card>
  );
}
