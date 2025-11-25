"use client";

import React, { useState, useEffect } from "react";
import {
  Typography,
  Table,
  Button,
  Input,
  Space,
  Modal,
  Form,
  message,
  Row,
  Col,
  Card,
  Tag,
  Progress,
  Spin,
} from "antd";
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
  TrophyOutlined,
} from "@ant-design/icons";
import { MainLayout } from "@/components/common/MainLayout";
import { useStore } from "@/lib/store/useStore";
import type { Member, LedgerEntry } from "@/lib/api/client";
import dayjs from "dayjs";

const { Title, Text } = Typography;

export default function MembersPage() {
  const {
    members,
    fetchMembers,
    addMember,
    updateMember,
    deleteMember,
    ledger,
    fetchLedger,
  } = useStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [searchText, setSearchText] = useState("");
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // 초기 데이터 로드
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchMembers(),
        fetchLedger({ startDate: "2020-01-01" }), // 전체 매출 기록 조회
      ]);
      setLoading(false);
    };
    loadData();
  }, [fetchMembers, fetchLedger]);

  // 검색 처리
  useEffect(() => {
    const delaySearch = setTimeout(() => {
      fetchMembers(searchText || undefined);
    }, 300);
    return () => clearTimeout(delaySearch);
  }, [searchText, fetchMembers]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("ko-KR").format(price) + "원";
  };

  const getMemberStats = (memberId: string) => {
    const memberLedger = ledger.filter(
      (l: LedgerEntry) => l.memberId === memberId,
    );
    const visitCount = memberLedger.length;
    const totalSpent = memberLedger.reduce(
      (sum: number, l: LedgerEntry) => sum + l.totalPrice,
      0,
    );
    const lastVisit =
      memberLedger.length > 0
        ? dayjs(memberLedger[memberLedger.length - 1].completedAt).format(
            "YYYY-MM-DD",
          )
        : "-";

    return { visitCount, totalSpent, lastVisit };
  };

  const handleAdd = () => {
    setEditingMember(null);
    form.resetFields();
    setModalOpen(true);
  };

  const handleEdit = (member: Member) => {
    setEditingMember(member);
    form.setFieldsValue(member);
    setModalOpen(true);
  };

  const handleDelete = (id: string) => {
    Modal.confirm({
      title: (
        <span style={{ fontSize: 20 }}>
          <DeleteOutlined style={{ color: "#ff4d4f", marginRight: 10 }} />
          회원 삭제
        </span>
      ),
      content: (
        <Text style={{ fontSize: 17 }}>정말 이 회원을 삭제하시겠습니까?</Text>
      ),
      okText: "삭제",
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
      onOk: async () => {
        try {
          await deleteMember(id);
          message.success("회원이 삭제되었습니다");
        } catch (error) {
          message.error("회원 삭제에 실패했습니다");
          console.error(error);
        }
      },
    });
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      if (editingMember) {
        await updateMember(editingMember.id, values);
        message.success("회원 정보가 수정되었습니다");
      } else {
        await addMember(values);
        message.success("회원이 등록되었습니다");
      }

      setModalOpen(false);
      form.resetFields();
      setEditingMember(null);
    } catch (error) {
      if (error instanceof Error) {
        message.error(error.message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      title: "이름",
      dataIndex: "name",
      key: "name",
      width: 120,
      render: (name: string) => (
        <span style={{ fontSize: 17, fontWeight: 500 }}>{name}</span>
      ),
    },
    {
      title: "전화번호",
      dataIndex: "phone",
      key: "phone",
      width: 140,
      render: (phone: string) => <span style={{ fontSize: 16 }}>{phone}</span>,
    },
    {
      title: "등록일",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 120,
      render: (date: string) => (
        <span style={{ fontSize: 15, color: "#666" }}>
          {dayjs(date).format("YYYY-MM-DD")}
        </span>
      ),
    },
    {
      title: "방문 횟수",
      key: "visitCount",
      width: 100,
      render: (_: unknown, record: Member) => (
        <span style={{ fontSize: 16, fontWeight: 500 }}>
          {getMemberStats(record.id).visitCount}회
        </span>
      ),
    },
    {
      title: "총 결제액",
      key: "totalSpent",
      width: 140,
      render: (_: unknown, record: Member) => (
        <span style={{ fontSize: 17, fontWeight: 600, color: "#1890ff" }}>
          {formatPrice(getMemberStats(record.id).totalSpent)}
        </span>
      ),
    },
    {
      title: "최근 방문",
      key: "lastVisit",
      width: 120,
      render: (_: unknown, record: Member) => (
        <span style={{ fontSize: 15, color: "#666" }}>
          {getMemberStats(record.id).lastVisit}
        </span>
      ),
    },
    {
      title: "스탬프",
      dataIndex: "stamps",
      key: "stamps",
      width: 140,
      render: (stamps: number) => (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Progress
            percent={(stamps || 0) * 10}
            size="small"
            showInfo={false}
            strokeColor={stamps >= 10 ? "#52c41a" : "#1890ff"}
            style={{ width: 60 }}
          />
          <span
            style={{
              fontSize: 16,
              fontWeight: stamps >= 10 ? 600 : 400,
              color: stamps >= 10 ? "#52c41a" : "#333",
            }}
          >
            {stamps || 0}/10
          </span>
          {stamps >= 10 && (
            <TrophyOutlined style={{ color: "#faad14", fontSize: 18 }} />
          )}
        </div>
      ),
    },
    {
      title: "액션",
      key: "action",
      width: 120,
      render: (_: unknown, record: Member) => (
        <Space size={8}>
          <Button
            type="text"
            size="large"
            icon={<EditOutlined style={{ fontSize: 18 }} />}
            onClick={() => handleEdit(record)}
            style={{ width: 44, height: 44, borderRadius: 10 }}
          />
          <Button
            type="text"
            danger
            size="large"
            icon={<DeleteOutlined style={{ fontSize: 18 }} />}
            onClick={() => handleDelete(record.id)}
            style={{ width: 44, height: 44, borderRadius: 10 }}
          />
        </Space>
      ),
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
      {/* 헤더 */}
      <Row gutter={20} style={{ marginBottom: 24 }}>
        <Col flex="auto">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <UserOutlined style={{ fontSize: 28, color: "#1890ff" }} />
            <Title level={3} style={{ margin: 0, fontSize: 26 }}>
              회원 관리
            </Title>
            <Tag color="blue" style={{ fontSize: 15, padding: "6px 14px" }}>
              총 {members.length}명
            </Tag>
          </div>
        </Col>
        <Col>
          <Button
            type="primary"
            icon={<PlusOutlined style={{ fontSize: 18 }} />}
            onClick={handleAdd}
            size="large"
            style={{
              height: 52,
              paddingInline: 28,
              fontSize: 17,
              borderRadius: 12,
            }}
          >
            새 회원
          </Button>
        </Col>
      </Row>

      {/* 검색 */}
      <Card
        style={{ marginBottom: 20, borderRadius: 16 }}
        styles={{ body: { padding: 20 } }}
      >
        <Input
          placeholder="이름/전화번호 검색"
          prefix={<SearchOutlined style={{ fontSize: 18, color: "#999" }} />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          size="large"
          style={{ maxWidth: 400 }}
          allowClear
        />
      </Card>

      {/* 테이블 */}
      <Card style={{ borderRadius: 16 }} styles={{ body: { padding: 16 } }}>
        <Table
          dataSource={members}
          columns={columns}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showTotal: (total) => `총 ${total}명`,
          }}
          locale={{
            emptyText: (
              <div className="empty-state">
                <UserOutlined className="empty-state-icon" />
                <div className="empty-state-text">등록된 회원이 없습니다</div>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={handleAdd}
                  style={{ borderRadius: 10 }}
                >
                  새 회원 등록하기
                </Button>
              </div>
            ),
          }}
          size="large"
        />
      </Card>

      {/* 회원 등록/수정 모달 */}
      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: "#1890ff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <UserOutlined style={{ fontSize: 20, color: "#fff" }} />
            </div>
            <span style={{ fontSize: 20, fontWeight: 600 }}>
              {editingMember ? "회원 정보 수정" : "새 회원 등록"}
            </span>
          </div>
        }
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false);
          form.resetFields();
          setEditingMember(null);
        }}
        footer={
          <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
            <Button
              size="large"
              onClick={() => {
                setModalOpen(false);
                form.resetFields();
                setEditingMember(null);
              }}
              style={{
                height: 52,
                paddingInline: 28,
                fontSize: 17,
                borderRadius: 12,
              }}
            >
              취소
            </Button>
            <Button
              type="primary"
              size="large"
              onClick={handleSubmit}
              loading={submitting}
              style={{
                height: 52,
                paddingInline: 32,
                fontSize: 17,
                borderRadius: 12,
              }}
            >
              {editingMember ? "수정" : "등록"}
            </Button>
          </div>
        }
        width={500}
        styles={{ body: { padding: 24 } }}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="name"
            label={<span style={{ fontSize: 16, fontWeight: 500 }}>이름</span>}
            rules={[{ required: true, message: "이름을 입력해주세요" }]}
          >
            <Input placeholder="회원 이름" size="large" />
          </Form.Item>

          <Form.Item
            name="phone"
            label={
              <span style={{ fontSize: 16, fontWeight: 500 }}>전화번호</span>
            }
            rules={[{ required: true, message: "전화번호를 입력해주세요" }]}
          >
            <Input placeholder="010-0000-0000" size="large" />
          </Form.Item>
        </Form>
      </Modal>
    </MainLayout>
  );
}
