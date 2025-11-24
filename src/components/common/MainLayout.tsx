"use client";

import React, { useState, useEffect } from "react";
import { Layout, Menu, Typography, Button } from "antd";
import {
  DashboardOutlined,
  CalendarOutlined,
  UserOutlined,
  DollarOutlined,
  LogoutOutlined,
} from "@ant-design/icons";
import { useRouter, usePathname } from "next/navigation";
import { useStore } from "@/lib/store/useStore";
import dayjs from "dayjs";

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { auth, logout } = useStore();
  const [currentTime, setCurrentTime] = useState(
    dayjs().format("YYYY-MM-DD HH:mm:ss"),
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(dayjs().format("YYYY-MM-DD HH:mm:ss"));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!auth.isLoggedIn && pathname !== "/login") {
      router.push("/login");
    }
  }, [auth.isLoggedIn, pathname, router]);

  if (!auth.isLoggedIn) {
    return null;
  }

  const menuItems = [
    {
      key: "/",
      icon: <DashboardOutlined style={{ fontSize: 20 }} />,
      label: <span style={{ fontSize: 16 }}>대시보드</span>,
    },
    {
      key: "/reservations",
      icon: <CalendarOutlined style={{ fontSize: 20 }} />,
      label: <span style={{ fontSize: 16 }}>예약</span>,
    },
    {
      key: "/members",
      icon: <UserOutlined style={{ fontSize: 20 }} />,
      label: <span style={{ fontSize: 16 }}>고객</span>,
    },
    {
      key: "/ledger",
      icon: <DollarOutlined style={{ fontSize: 20 }} />,
      label: <span style={{ fontSize: 16 }}>매출</span>,
    },
  ];

  const handleMenuClick = (e: { key: string }) => {
    router.push(e.key);
  };

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider
        width={220}
        style={{
          background: "#001529",
          position: "fixed",
          left: 0,
          top: 0,
          bottom: 0,
        }}
      >
        <div
          style={{
            height: 80,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderBottom: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <Title level={3} style={{ margin: 0, color: "#fff" }}>
            타임헤어
          </Title>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[pathname]}
          items={menuItems}
          onClick={handleMenuClick}
          style={{
            borderRight: 0,
            paddingTop: 16,
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 0,
            width: "100%",
            padding: 16,
            borderTop: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <Button
            type="text"
            icon={<LogoutOutlined />}
            onClick={handleLogout}
            style={{
              color: "rgba(255,255,255,0.65)",
              width: "100%",
              height: 48,
              fontSize: 15,
            }}
          >
            로그아웃
          </Button>
        </div>
      </Sider>
      <Layout style={{ marginLeft: 220 }}>
        <Header
          style={{
            padding: "0 32px",
            background: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            borderBottom: "1px solid #f0f0f0",
            height: 64,
            position: "sticky",
            top: 0,
            zIndex: 100,
          }}
        >
          <Text style={{ fontSize: 18, fontWeight: 500 }}>{currentTime}</Text>
        </Header>
        <Content
          style={{
            margin: 12,
            padding: 16,
            background: "#fff",
            borderRadius: 12,
            minHeight: "calc(100vh - 88px)",
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}
