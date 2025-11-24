"use client";

import React, { useState } from "react";
import {
  Typography,
  Table,
  Button,
  Input,
  Space,
  Modal,
  Form,
  message,
} from "antd";
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { MainLayout } from "@/components/common/MainLayout";
import { useStore } from "@/lib/store/useStore";
import { Member } from "@/lib/types";
import dayjs from "dayjs";

const { Title, Text } = Typography;

export default function MembersPage() {
  const { members, addMember, updateMember, deleteMember, ledger } = useStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [searchText, setSearchText] = useState("");
  const [form] = Form.useForm();

  const filteredMembers = members.filter((m) => {
    return m.name.includes(searchText) || m.phone.includes(searchText);
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("ko-KR").format(price) + "원";
  };

  const getMemberStats = (memberId: string) => {
    const memberLedger = ledger.filter((l) => l.memberId === memberId);
    const visitCount = memberLedger.length;
    const totalSpent = memberLedger.reduce((sum, l) => sum + l.totalPrice, 0);
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
      title: "고객 삭제",
      content: "정말 이 고객을 삭제하시겠습니까?",
      okText: "삭제",
      cancelText: "취소",
      okButtonProps: { danger: true },
      onOk: () => {
        deleteMember(id);
        message.success("고객이 삭제되었습니다");
      },
    });
  };

  const handleSubmit = () => {
    form.validateFields().then((values) => {
      if (editingMember) {
        updateMember(editingMember.id, values);
        message.success("고객 정보가 수정되었습니다");
      } else {
        const newMember: Member = {
          id: `member-${Date.now()}`,
          ...values,
          stamps: 0,
          createdAt: dayjs().toISOString(),
        };
        addMember(newMember);
        message.success("고객이 등록되었습니다");
      }

      setModalOpen(false);
      form.resetFields();
      setEditingMember(null);
    });
  };

  const columns = [
    {
      title: "이름",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "전화번호",
      dataIndex: "phone",
      key: "phone",
    },
    {
      title: "등록일",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date: string) => dayjs(date).format("YYYY-MM-DD"),
    },
    {
      title: "방문 횟수",
      key: "visitCount",
      render: (_: unknown, record: Member) =>
        getMemberStats(record.id).visitCount + "회",
    },
    {
      title: "총 결제액",
      key: "totalSpent",
      render: (_: unknown, record: Member) =>
        formatPrice(getMemberStats(record.id).totalSpent),
    },
    {
      title: "최근 방문",
      key: "lastVisit",
      render: (_: unknown, record: Member) =>
        getMemberStats(record.id).lastVisit,
    },
    {
      title: "스탬프",
      dataIndex: "stamps",
      key: "stamps",
      render: (stamps: number) => (
        <span
          style={{
            fontWeight: stamps >= 10 ? 600 : 400,
            color: stamps >= 10 ? "#52c41a" : undefined,
          }}
        >
          {stamps || 0}/10
        </span>
      ),
    },
    {
      title: "액션",
      key: "action",
      render: (_: unknown, record: Member) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          />
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
          />
        </Space>
      ),
    },
  ];

  return (
    <MainLayout>
      <div
        style={{
          marginBottom: 24,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Title level={4} style={{ margin: 0 }}>
          고객 관리
        </Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          새 고객
        </Button>
      </div>

      <div style={{ marginBottom: 16 }}>
        <Input
          placeholder="이름/전화번호 검색"
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 300 }}
        />
      </div>

      <Table
        dataSource={filteredMembers}
        columns={columns}
        rowKey="id"
        pagination={{ pageSize: 10 }}
        locale={{ emptyText: "등록된 고객이 없습니다" }}
      />

      <div style={{ marginTop: 16 }}>
        <Text type="secondary">총 {members.length}명</Text>
      </div>

      <Modal
        title={editingMember ? "고객 정보 수정" : "새 고객 등록"}
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false);
          form.resetFields();
          setEditingMember(null);
        }}
        onOk={handleSubmit}
        okText={editingMember ? "수정" : "등록"}
        cancelText="취소"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="이름"
            rules={[{ required: true, message: "이름을 입력해주세요" }]}
          >
            <Input placeholder="고객 이름" />
          </Form.Item>

          <Form.Item
            name="phone"
            label="전화번호"
            rules={[{ required: true, message: "전화번호를 입력해주세요" }]}
          >
            <Input placeholder="010-0000-0000" />
          </Form.Item>
        </Form>
      </Modal>
    </MainLayout>
  );
}
