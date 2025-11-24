"use client";

import React from "react";
import { Form, Input, Button, Card, Typography, message, Checkbox } from "antd";
import { UserOutlined, LockOutlined } from "@ant-design/icons";
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
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        padding: 24,
      }}
    >
      <Card
        style={{
          width: "100%",
          maxWidth: 440,
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
          borderRadius: 24,
        }}
        bodyStyle={{ padding: "48px 40px" }}
      >
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <Title
            level={1}
            style={{ color: "#1890ff", marginBottom: 8, fontSize: 36 }}
          >
            타임헤어
          </Title>
          <Text type="secondary" style={{ fontSize: 16 }}>
            관리 시스템
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
            rules={[{ required: true, message: "아이디를 입력해주세요" }]}
          >
            <Input
              prefix={<UserOutlined style={{ fontSize: 18 }} />}
              placeholder="아이디"
              style={{ height: 56, fontSize: 16, borderRadius: 12 }}
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: "비밀번호를 입력해주세요" }]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ fontSize: 18 }} />}
              placeholder="비밀번호"
              style={{ height: 56, fontSize: 16, borderRadius: 12 }}
            />
          </Form.Item>

          <Form.Item name="remember" valuePropName="checked">
            <Checkbox style={{ fontSize: 15 }}>로그인 상태 유지</Checkbox>
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, marginTop: 32 }}>
            <Button
              type="primary"
              htmlType="submit"
              block
              loading={loading}
              style={{
                height: 60,
                fontSize: 18,
                fontWeight: 600,
                borderRadius: 12,
              }}
            >
              로그인
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
