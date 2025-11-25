"use client";

import React, { useState, useEffect } from "react";
import { Layout, Menu, Typography, Button, Badge, Modal, Spin } from "antd";
import {
  DashboardOutlined,
  CalendarOutlined,
  UserOutlined,
  DollarOutlined,
  LogoutOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import { useRouter, usePathname } from "next/navigation";
import { useStore } from "@/lib/store/useStore";
import Logo from "./Logo";
import dayjs from "dayjs";
import "dayjs/locale/ko";

dayjs.locale("ko");

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { auth, logout, checkAuth, seats } = useStore();
  const [currentTime, setCurrentTime] = useState(dayjs());
  const [authChecking, setAuthChecking] = useState(true);

  // 사용 중인 좌석 수
  const inUseCount = seats.filter((s) => s.status === "in_use").length;

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(dayjs());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 인증 상태 확인
  useEffect(() => {
    const verifyAuth = async () => {
      if (pathname === "/login") {
        setAuthChecking(false);
        return;
      }

      const isValid = await checkAuth();
      if (!isValid) {
        router.push("/login");
      }
      setAuthChecking(false);
    };
    verifyAuth();
  }, [pathname, checkAuth, router]);

  if (authChecking) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  if (!auth.isLoggedIn) {
    return null;
  }

  const menuItems = [
    {
      key: "/",
      icon: <DashboardOutlined style={{ fontSize: 24 }} />,
      label: (
        <span style={{ fontSize: 17, fontWeight: 500 }}>
          대시보드
          {inUseCount > 0 && (
            <Badge
              count={inUseCount}
              style={{
                marginLeft: 8,
                backgroundColor: "#ff4d4f",
                fontSize: 12,
              }}
            />
          )}
        </span>
      ),
    },
    {
      key: "/reservations",
      icon: <CalendarOutlined style={{ fontSize: 24 }} />,
      label: <span style={{ fontSize: 17, fontWeight: 500 }}>예약</span>,
    },
    {
      key: "/members",
      icon: <UserOutlined style={{ fontSize: 24 }} />,
      label: <span style={{ fontSize: 17, fontWeight: 500 }}>회원</span>,
    },
    {
      key: "/ledger",
      icon: <DollarOutlined style={{ fontSize: 24 }} />,
      label: <span style={{ fontSize: 17, fontWeight: 500 }}>매출</span>,
    },
  ];

  const handleMenuClick = (e: { key: string }) => {
    router.push(e.key);
  };

  const handleLogout = () => {
    Modal.confirm({
      title: (
        <span style={{ fontSize: 20 }}>
          <LogoutOutlined style={{ color: "#ff4d4f", marginRight: 10 }} />
          로그아웃
        </span>
      ),
      content: (
        <span style={{ fontSize: 17 }}>정말 로그아웃 하시겠습니까?</span>
      ),
      okText: "로그아웃",
      cancelText: "취소",
      okButtonProps: {
        danger: true,
        size: "large",
        style: { height: 52, fontSize: 17 },
      },
      cancelButtonProps: {
        size: "large",
        style: { height: 52, fontSize: 17 },
      },
      width: 420,
      onOk: () => {
        logout();
        router.push("/login");
      },
    });
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider
        width={260}
        style={{
          background: "linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)",
          position: "fixed",
          left: 0,
          top: 0,
          bottom: 0,
          boxShadow: "4px 0 20px rgba(0, 0, 0, 0.15)",
        }}
      >
        {/* 로고 영역 */}
        <div
          style={{
            height: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            background: "rgba(255,255,255,0.02)",
          }}
        >
          <div
            style={{
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <Logo size="medium" />
            <Title
              level={4}
              style={{
                margin: 0,
                color: "#fff",
                fontSize: 16,
                fontWeight: 700,
                letterSpacing: 2,
              }}
            >
              타임헤어
            </Title>
            <Text
              style={{
                color: "rgba(255,255,255,0.5)",
                fontSize: 12,
                letterSpacing: 1,
              }}
            >
              HAIR SALON
            </Text>
          </div>
        </div>

        {/* 메뉴 */}
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[pathname]}
          items={menuItems}
          onClick={handleMenuClick}
          style={{
            borderRight: 0,
            paddingTop: 20,
            background: "transparent",
          }}
        />

        {/* 로그아웃 버튼 */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            width: "100%",
            padding: 20,
            borderTop: "1px solid rgba(255,255,255,0.08)",
            background: "rgba(0,0,0,0.1)",
          }}
        >
          <Button
            type="text"
            icon={<LogoutOutlined style={{ fontSize: 20 }} />}
            onClick={handleLogout}
            style={{
              color: "rgba(255,255,255,0.7)",
              width: "100%",
              height: 56,
              fontSize: 16,
              borderRadius: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.1)";
              e.currentTarget.style.color = "#fff";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "rgba(255,255,255,0.7)";
            }}
          >
            로그아웃
          </Button>
        </div>
      </Sider>

      <Layout style={{ marginLeft: 260 }}>
        {/* 헤더 */}
        <Header
          style={{
            padding: "0 32px",
            background: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid #e8e8e8",
            height: 80,
            position: "sticky",
            top: 0,
            zIndex: 100,
            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
          }}
        >
          {/* 현재 페이지 제목 */}
          <div>
            <Text
              style={{
                fontSize: 14,
                color: "#999",
                textTransform: "uppercase",
                letterSpacing: 1,
              }}
            >
              {pathname === "/" && "Dashboard"}
              {pathname === "/reservations" && "Reservations"}
              {pathname === "/members" && "Members"}
              {pathname === "/ledger" && "Sales Report"}
            </Text>
          </div>

          {/* 시간 표시 */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              background: "#f5f5f5",
              padding: "8px 16px",
              borderRadius: 10,
            }}
          >
            <ClockCircleOutlined style={{ fontSize: 20, color: "#1890ff" }} />
            <Text
              style={{
                fontSize: 18,
                fontWeight: 600,
                color: "#333",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {currentTime.format("MM월 DD일 (ddd) HH:mm")}
            </Text>
          </div>
        </Header>

        {/* 콘텐츠 */}
        <Content
          style={{
            margin: 16,
            padding: 24,
            background: "#fff",
            borderRadius: 16,
            minHeight: "calc(100vh - 112px)",
            boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
          }}
        >
          {children}
        </Content>

        {/* 모바일 하단 네비게이션 */}
        <div className="mobile-bottom-nav">
          {[
            { key: "/", icon: <DashboardOutlined />, label: "대시보드" },
            { key: "/reservations", icon: <CalendarOutlined />, label: "예약" },
            { key: "/members", icon: <UserOutlined />, label: "회원" },
            { key: "/ledger", icon: <DollarOutlined />, label: "매출" },
          ].map((item) => (
            <div
              key={item.key}
              className={`mobile-nav-item ${pathname === item.key ? "active" : ""}`}
              onClick={() => router.push(item.key)}
            >
              <span className="mobile-nav-icon">{item.icon}</span>
              <span className="mobile-nav-label">{item.label}</span>
            </div>
          ))}
        </div>
      </Layout>
    </Layout>
  );
}
