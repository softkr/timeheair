"use client";

import React, { useState } from "react";
import {
  Modal,
  Form,
  Select,
  Input,
  Typography,
  Divider,
  Button,
  Row,
  Col,
  Card,
} from "antd";
import { PlusOutlined, DeleteOutlined, CheckOutlined } from "@ant-design/icons";
import { useStore } from "@/lib/store/useStore";
import { serviceMenus, serviceCategories } from "@/lib/data/services";
import { SelectedService } from "@/lib/types";

const { Text, Title } = Typography;

interface StartServiceModalProps {
  open: boolean;
  seatId: number | null;
  onClose: () => void;
  onStart: (
    seatId: number,
    data: {
      memberId?: string | null;
      memberName: string;
      staffId: string;
      services: SelectedService[];
      totalPrice: number;
    },
  ) => void;
}

export function StartServiceModal({
  open,
  seatId,
  onClose,
  onStart,
}: StartServiceModalProps) {
  const { staff, members, incrementGuestCounter } = useStore();
  const [form] = Form.useForm();
  const [selectedServices, setSelectedServices] = useState<SelectedService[]>(
    [],
  );
  const [selectedCategory, setSelectedCategory] =
    useState<string>("기본 서비스");
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

  const handleAddService = (
    menu: (typeof serviceMenus)[0],
    length?: "short" | "medium" | "long",
  ) => {
    let price = 0;
    if (menu.price) {
      price = menu.price;
    } else if (menu.prices && length) {
      price = menu.prices[length] || 0;
    }

    setSelectedServices([
      ...selectedServices,
      {
        name: menu.name,
        length,
        price,
      },
    ]);
  };

  const handleRemoveService = (index: number) => {
    setSelectedServices(selectedServices.filter((_, i) => i !== index));
  };

  const totalPrice = selectedServices.reduce((sum, s) => sum + s.price, 0);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("ko-KR").format(price) + "원";
  };

  const handleSubmit = () => {
    form.validateFields().then((values) => {
      if (seatId === null) return;

      const memberName = values.memberName || incrementGuestCounter();

      onStart(seatId, {
        memberId: selectedMemberId,
        memberName,
        staffId: values.staffId,
        services: selectedServices,
        totalPrice,
      });

      form.resetFields();
      setSelectedServices([]);
      setSelectedCategory("기본 서비스");
      onClose();
    });
  };

  const handleCancel = () => {
    form.resetFields();
    setSelectedServices([]);
    setSelectedCategory("기본 서비스");
    setSelectedMemberId(null);
    onClose();
  };

  const handleMemberSelect = (memberId: string | null) => {
    setSelectedMemberId(memberId);
    if (memberId) {
      const member = members.find((m) => m.id === memberId);
      if (member) {
        form.setFieldValue("memberName", member.name);
      }
    } else {
      form.setFieldValue("memberName", "");
    }
  };

  const filteredMenus = serviceMenus.filter(
    (m) => m.category === selectedCategory,
  );

  return (
    <Modal
      title={
        <Title level={4} style={{ margin: 0 }}>
          시술 시작
        </Title>
      }
      open={open}
      onCancel={handleCancel}
      footer={null}
      width={800}
      styles={{ body: { padding: "16px" } }}
    >
      <Form form={form} layout="vertical">
        <Row gutter={12}>
          <Col span={12}>
            <Form.Item label="고객 선택" style={{ marginBottom: 12 }}>
              <Select
                placeholder="멤버 검색 또는 손님"
                size="large"
                style={{ height: 48, width: "100%" }}
                allowClear
                showSearch
                optionFilterProp="children"
                value={selectedMemberId}
                onChange={handleMemberSelect}
              >
                {members.map((m) => (
                  <Select.Option key={m.id} value={m.id}>
                    {m.name} ({m.phone})
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item name="memberName" hidden>
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="staffId"
              label="담당"
              rules={[{ required: true, message: "선택해주세요" }]}
              style={{ marginBottom: 12 }}
            >
              <Select
                placeholder="담당 선택"
                size="large"
                style={{ height: 48 }}
              >
                {staff.map((s) => (
                  <Select.Option key={s.id} value={s.id}>
                    {s.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Divider style={{ margin: "12px 0" }}>서비스 선택</Divider>

        {/* 카테고리 탭 */}
        <div style={{ marginBottom: 12 }}>
          <Row gutter={[8, 8]}>
            {serviceCategories.map((cat) => (
              <Col key={cat}>
                <Button
                  type={selectedCategory === cat ? "primary" : "default"}
                  onClick={() => setSelectedCategory(cat)}
                  size="large"
                  style={{
                    height: 44,
                    borderRadius: 8,
                    fontWeight: selectedCategory === cat ? 600 : 400,
                  }}
                >
                  {cat}
                </Button>
              </Col>
            ))}
          </Row>
        </div>

        {/* 서비스 목록 */}
        <div
          style={{
            maxHeight: 240,
            overflowY: "auto",
            marginBottom: 12,
            border: "1px solid #f0f0f0",
            borderRadius: 8,
            padding: 8,
          }}
        >
          <Row gutter={[8, 8]}>
            {filteredMenus.map((menu) => (
              <Col key={menu.id} span={12}>
                {menu.price ? (
                  <Button
                    block
                    size="large"
                    onClick={() => handleAddService(menu)}
                    style={{
                      height: 52,
                      textAlign: "left",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      borderRadius: 8,
                    }}
                  >
                    <span>{menu.name}</span>
                    <span style={{ color: "#1890ff" }}>
                      {formatPrice(menu.price)}
                    </span>
                  </Button>
                ) : (
                  <Card
                    size="small"
                    style={{ borderRadius: 8 }}
                    bodyStyle={{ padding: 8 }}
                  >
                    <div style={{ fontWeight: 500, marginBottom: 8 }}>
                      {menu.name}
                    </div>
                    <Row gutter={4}>
                      <Col span={8}>
                        <Button
                          block
                          size="small"
                          onClick={() => handleAddService(menu, "short")}
                        >
                          숏{" "}
                          {menu.prices?.short && formatPrice(menu.prices.short)}
                        </Button>
                      </Col>
                      <Col span={8}>
                        <Button
                          block
                          size="small"
                          onClick={() => handleAddService(menu, "medium")}
                        >
                          미듐{" "}
                          {menu.prices?.medium &&
                            formatPrice(menu.prices.medium)}
                        </Button>
                      </Col>
                      <Col span={8}>
                        <Button
                          block
                          size="small"
                          onClick={() => handleAddService(menu, "long")}
                        >
                          롱{" "}
                          {menu.prices?.long && formatPrice(menu.prices.long)}
                        </Button>
                      </Col>
                    </Row>
                  </Card>
                )}
              </Col>
            ))}
          </Row>
        </div>

        {/* 선택된 서비스 */}
        {selectedServices.length > 0 && (
          <div
            style={{
              background: "#f5f5f5",
              borderRadius: 8,
              padding: 12,
              marginBottom: 12,
            }}
          >
            <Text strong style={{ display: "block", marginBottom: 8 }}>
              선택된 서비스
            </Text>
            {selectedServices.map((service, index) => (
              <div
                key={index}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "6px 0",
                  borderBottom:
                    index < selectedServices.length - 1
                      ? "1px solid #e8e8e8"
                      : "none",
                }}
              >
                <span>
                  {service.name}
                  {service.length && (
                    <Text type="secondary"> ({service.length})</Text>
                  )}
                </span>
                <span>
                  <Text strong style={{ marginRight: 12 }}>
                    {formatPrice(service.price)}
                  </Text>
                  <Button
                    type="text"
                    danger
                    size="small"
                    icon={<DeleteOutlined />}
                    onClick={() => handleRemoveService(index)}
                  />
                </span>
              </div>
            ))}
          </div>
        )}

        {/* 총액 및 버튼 */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "12px 0",
          }}
        >
          <div>
            <Text style={{ fontSize: 16 }}>총 금액: </Text>
            <Text strong style={{ fontSize: 24, color: "#1890ff" }}>
              {formatPrice(totalPrice)}
            </Text>
          </div>
          <div>
            <Button
              size="large"
              onClick={handleCancel}
              style={{ marginRight: 8, height: 48, paddingInline: 24 }}
            >
              취소
            </Button>
            <Button
              type="primary"
              size="large"
              onClick={handleSubmit}
              disabled={selectedServices.length === 0}
              icon={<CheckOutlined />}
              style={{ height: 48, paddingInline: 32 }}
            >
              시술 시작
            </Button>
          </div>
        </div>
      </Form>
    </Modal>
  );
}
