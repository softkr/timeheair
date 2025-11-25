"use client";

import React from "react";
import { Form, Input, Button, Card, Typography, message, Checkbox } from "antd";
import { UserOutlined, LockOutlined, ScissorOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store/useStore";

const { Title, Text } = Typography;

export default function LoginPage() {
  const router = useRouter();
  const { login } = useStore();
  const [loading, setLoading] = React.useState(false);

  const onFinish = (values: { username: string; password: string }) => {
    setLoading(true);

    setTimeout(() => {
      const success = login(values.username, values.password);

      if (success) {
        message.success("로그인 성공");
        router.push("/");
      } else {
        message.error("아이디 또는 비밀번호가 올바르지 않습니다");
      }

      setLoading(false);
    }, 500);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
        padding: 32,
      }}
    >
      <Card
        style={{
          width: "100%",
          maxWidth: 520,
          boxShadow: "0 25px 80px rgba(0, 0, 0, 0.4)",
          borderRadius: 28,
          border: "none",
        }}
        styles={{ body: { padding: "56px 48px" } }}
      >
        {/* 로고 영역 */}
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div
            style={{
              width: 80,
              height: 80,
              margin: "0 auto 20px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 8px 24px rgba(102, 126, 234, 0.4)",
            }}
          >
            <ScissorOutlined style={{ fontSize: 36, color: "#fff" }} />
          </div>
          <Title
            level={1}
            style={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              marginBottom: 8,
              fontSize: 42,
              fontWeight: 700,
              letterSpacing: 2,
            }}
          >
            타임헤어
          </Title>
          <Text style={{ fontSize: 17, color: "#888", letterSpacing: 1 }}>
            HAIR SALON MANAGEMENT SYSTEM
          </Text>
        </div>

        <Form
          name="login"
          onFinish={onFinish}
          autoComplete="off"
          layout="vertical"
          size="large"
        >
          <Form.Item
            name="username"
            label={<span style={{ fontSize: 15, fontWeight: 500, color: "#555" }}>아이디</span>}
            rules={[{ required: true, message: "아이디를 입력해주세요" }]}
            style={{ marginBottom: 20 }}
          >
            <Input
              prefix={
                <UserOutlined
                  style={{ fontSize: 20, color: "#999", marginRight: 8 }}
                />
              }
              placeholder="아이디를 입력하세요"
              aria-label="아이디"
              style={{
                height: 64,
                fontSize: 18,
                borderRadius: 16,
                border: "2px solid #e8e8e8",
                paddingLeft: 20,
              }}
            />
          </Form.Item>

          <Form.Item
            name="password"
            label={<span style={{ fontSize: 15, fontWeight: 500, color: "#555" }}>비밀번호</span>}
            rules={[{ required: true, message: "비밀번호를 입력해주세요" }]}
            style={{ marginBottom: 20 }}
          >
            <Input.Password
              prefix={
                <LockOutlined
                  style={{ fontSize: 20, color: "#999", marginRight: 8 }}
                />
              }
              placeholder="비밀번호를 입력하세요"
              aria-label="비밀번호"
              style={{
                height: 64,
                fontSize: 18,
                borderRadius: 16,
                border: "2px solid #e8e8e8",
                paddingLeft: 20,
              }}
            />
          </Form.Item>

          <Form.Item
            name="remember"
            valuePropName="checked"
            style={{ marginBottom: 32 }}
          >
            <Checkbox style={{ fontSize: 16 }}>로그인 상태 유지</Checkbox>
          </Form.Item>

          <Form.Item style={{ marginBottom: 0 }}>
            <Button
              type="primary"
              htmlType="submit"
              block
              loading={loading}
              style={{
                height: 68,
                fontSize: 20,
                fontWeight: 600,
                borderRadius: 16,
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                border: "none",
                boxShadow: "0 8px 24px rgba(102, 126, 234, 0.4)",
              }}
            >
              로그인
            </Button>
          </Form.Item>
        </Form>

        {/* 하단 안내 */}
        <div
          style={{
            textAlign: "center",
            marginTop: 32,
            padding: "16px 0",
            borderTop: "1px solid #f0f0f0",
          }}
        >
          <Text style={{ fontSize: 14, color: "#999" }}>
            문의: 010-0000-0000
          </Text>
        </div>
      </Card>
    </div>
  );
}
