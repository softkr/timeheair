"use client";

import React, { useState, useEffect } from "react";
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
  Tag,
  Badge,
} from "antd";
import {
  DeleteOutlined,
  CheckOutlined,
  UserOutlined,
  TeamOutlined,
  ShoppingCartOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import { useStore } from "@/lib/store/useStore";
import { serviceMenus, serviceCategories } from "@/lib/data/services";
import type { SelectedService, Reservation } from "@/lib/api/client";
import dayjs from "dayjs";

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
      reservationId?: string | null;
    },
  ) => void;
}

export function StartServiceModal({
  open,
  seatId,
  onClose,
  onStart,
}: StartServiceModalProps) {
  const { staff, members, reservations, incrementGuestCounter } = useStore();
  const [form] = Form.useForm();
  const [selectedServices, setSelectedServices] = useState<SelectedService[]>(
    [],
  );
  const [selectedCategory, setSelectedCategory] =
    useState<string>("기본 서비스");
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [selectedReservationId, setSelectedReservationId] = useState<
    string | null
  >(null);
  const [customerType, setCustomerType] = useState<
    "member" | "reservation" | "guest"
  >("guest");

  // 오늘 예약 중 대기 상태인 것만 필터링
  const todayReservations = reservations.filter((r) => {
    return (
      dayjs(r.reservedAt).isSame(dayjs(), "day") && r.status === "scheduled"
    );
  });

  // 모달 열릴 때 초기화
  useEffect(() => {
    if (open) {
      setCustomerType("guest");
      setSelectedMemberId(null);
      setSelectedReservationId(null);
      setSelectedServices([]);
      form.resetFields();
    }
  }, [open, form]);

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

      let memberName = "";
      let memberId: string | null = null;
      let reservationId: string | null = null;

      if (customerType === "reservation" && selectedReservationId) {
        const reservation = reservations.find(
          (r) => r.id === selectedReservationId,
        );
        if (reservation) {
          memberName = reservation.memberName || "손님(예약)";
          memberId = reservation.memberId || null;
          reservationId = reservation.id;
        }
      } else if (customerType === "member" && selectedMemberId) {
        const member = members.find((m) => m.id === selectedMemberId);
        if (member) {
          memberName = member.name;
          memberId = member.id;
        }
      } else {
        memberName = values.memberName || incrementGuestCounter();
      }

      onStart(seatId, {
        memberId,
        memberName,
        staffId: values.staffId,
        services: selectedServices,
        totalPrice,
        reservationId,
      });

      form.resetFields();
      setSelectedServices([]);
      setSelectedCategory("기본 서비스");
      setSelectedMemberId(null);
      setSelectedReservationId(null);
      setCustomerType("guest");
      onClose();
    });
  };

  const handleCancel = () => {
    form.resetFields();
    setSelectedServices([]);
    setSelectedCategory("기본 서비스");
    setSelectedMemberId(null);
    setSelectedReservationId(null);
    setCustomerType("guest");
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

  const handleReservationSelect = (reservationId: string | null) => {
    setSelectedReservationId(reservationId);
    if (reservationId) {
      const reservation = reservations.find((r) => r.id === reservationId);
      if (reservation) {
        form.setFieldValue(
          "memberName",
          reservation.memberName || "손님(예약)",
        );
        form.setFieldValue("staffId", reservation.staffId);
        // 예약의 서비스 목록 자동 설정
        setSelectedServices(reservation.services || []);
      }
    } else {
      form.setFieldValue("memberName", "");
      setSelectedServices([]);
    }
  };

  const handleCustomerTypeChange = (
    type: "member" | "reservation" | "guest",
  ) => {
    setCustomerType(type);
    setSelectedMemberId(null);
    setSelectedReservationId(null);
    form.setFieldValue("memberName", "");
    if (type !== "reservation") {
      setSelectedServices([]);
    }
  };

  const filteredMenus = serviceMenus.filter(
    (m) => m.category === selectedCategory,
  );

  // 선택된 멤버 정보
  const selectedMember = selectedMemberId
    ? members.find((m) => m.id === selectedMemberId)
    : null;

  // 선택된 예약 정보
  const selectedReservation = selectedReservationId
    ? reservations.find((r) => r.id === selectedReservationId)
    : null;

  return (
    <Modal
      title={
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: "#1890ff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ShoppingCartOutlined style={{ fontSize: 22, color: "#fff" }} />
          </div>
          <div>
            <Title level={4} style={{ margin: 0, fontSize: 22 }}>
              시술 시작
            </Title>
            <Text type="secondary" style={{ fontSize: 14 }}>
              서비스와 담당자를 선택해주세요
            </Text>
          </div>
        </div>
      }
      open={open}
      onCancel={handleCancel}
      footer={null}
      width={900}
      styles={{ body: { padding: "24px" } }}
    >
      <Form form={form} layout="vertical">
        {/* 고객 유형 선택 */}
        <div style={{ marginBottom: 16 }}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: 500,
              marginBottom: 8,
              display: "block",
            }}
          >
            고객 유형
          </Text>
          <Row gutter={12}>
            <Col span={8}>
              <Button
                block
                type={customerType === "reservation" ? "primary" : "default"}
                onClick={() => handleCustomerTypeChange("reservation")}
                icon={<CalendarOutlined />}
                size="large"
                style={{
                  height: 52,
                  borderRadius: 12,
                  fontSize: 16,
                }}
                disabled={todayReservations.length === 0}
              >
                예약 손님{" "}
                {todayReservations.length > 0 &&
                  `(${todayReservations.length})`}
              </Button>
            </Col>
            <Col span={8}>
              <Button
                block
                type={customerType === "member" ? "primary" : "default"}
                onClick={() => handleCustomerTypeChange("member")}
                icon={<UserOutlined />}
                size="large"
                style={{
                  height: 52,
                  borderRadius: 12,
                  fontSize: 16,
                }}
              >
                회원
              </Button>
            </Col>
            <Col span={8}>
              <Button
                block
                type={customerType === "guest" ? "primary" : "default"}
                onClick={() => handleCustomerTypeChange("guest")}
                size="large"
                style={{
                  height: 52,
                  borderRadius: 12,
                  fontSize: 16,
                }}
              >
                일반 손님
              </Button>
            </Col>
          </Row>
        </div>

        {/* 고객 및 담당자 선택 */}
        <Row gutter={20}>
          <Col span={12}>
            {customerType === "reservation" && (
              <Form.Item
                label={
                  <span style={{ fontSize: 16, fontWeight: 500 }}>
                    <CalendarOutlined style={{ marginRight: 8 }} />
                    예약 선택
                  </span>
                }
                style={{ marginBottom: 16 }}
              >
                <Select
                  placeholder="예약 손님 선택"
                  size="large"
                  style={{ width: "100%" }}
                  allowClear
                  value={selectedReservationId}
                  onChange={handleReservationSelect}
                >
                  {todayReservations.map((r) => (
                    <Select.Option key={r.id} value={r.id}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <span>
                          <Tag color="blue">
                            {dayjs(r.reservedAt).format("HH:mm")}
                          </Tag>
                          {r.memberName || "손님(예약)"}
                        </span>
                        <Text type="secondary" style={{ fontSize: 13 }}>
                          {r.staffName}
                        </Text>
                      </div>
                    </Select.Option>
                  ))}
                </Select>
                {selectedReservation && (
                  <div
                    style={{
                      marginTop: 8,
                      padding: "8px 12px",
                      background: "#e6f7ff",
                      borderRadius: 8,
                    }}
                  >
                    <Text style={{ fontSize: 14 }}>
                      서비스:{" "}
                      {selectedReservation.services
                        ?.map((s) => s.name)
                        .join(", ") || "-"}
                    </Text>
                    <br />
                    <Text style={{ fontSize: 14 }}>
                      금액:{" "}
                      <strong>
                        {formatPrice(selectedReservation.totalPrice)}
                      </strong>
                    </Text>
                  </div>
                )}
              </Form.Item>
            )}

            {customerType === "member" && (
              <Form.Item
                label={
                  <span style={{ fontSize: 16, fontWeight: 500 }}>
                    <UserOutlined style={{ marginRight: 8 }} />
                    회원 선택
                  </span>
                }
                style={{ marginBottom: 16 }}
              >
                <Select
                  placeholder="회원 검색"
                  size="large"
                  style={{ width: "100%" }}
                  allowClear
                  showSearch
                  optionFilterProp="children"
                  value={selectedMemberId}
                  onChange={handleMemberSelect}
                >
                  {members.map((m) => (
                    <Select.Option key={m.id} value={m.id}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <span>
                          {m.name} <Text type="secondary">({m.phone})</Text>
                        </span>
                        {(m.stamps || 0) >= 10 && (
                          <Tag color="green" style={{ marginLeft: 8 }}>
                            혜택가능
                          </Tag>
                        )}
                      </div>
                    </Select.Option>
                  ))}
                </Select>
                {selectedMember && (
                  <div
                    style={{
                      marginTop: 8,
                      padding: "8px 12px",
                      background: "#f0f5ff",
                      borderRadius: 8,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ fontSize: 14 }}>
                      스탬프: <strong>{selectedMember.stamps || 0}/10</strong>
                    </Text>
                    {(selectedMember.stamps || 0) >= 10 && (
                      <Tag color="green">혜택 적용 가능</Tag>
                    )}
                  </div>
                )}
              </Form.Item>
            )}

            {customerType === "guest" && (
              <Form.Item
                name="memberName"
                label={
                  <span style={{ fontSize: 16, fontWeight: 500 }}>
                    <UserOutlined style={{ marginRight: 8 }} />
                    손님 이름 (선택)
                  </span>
                }
                style={{ marginBottom: 16 }}
              >
                <Input
                  placeholder="미입력 시 '손님1' 형식으로 자동 생성"
                  size="large"
                />
              </Form.Item>
            )}

            {customerType !== "guest" && (
              <Form.Item name="memberName" hidden>
                <Input />
              </Form.Item>
            )}
          </Col>
          <Col span={12}>
            <Form.Item
              name="staffId"
              label={
                <span style={{ fontSize: 16, fontWeight: 500 }}>
                  <TeamOutlined style={{ marginRight: 8 }} />
                  담당자
                </span>
              }
              rules={[{ required: true, message: "담당자를 선택해주세요" }]}
              style={{ marginBottom: 16 }}
            >
              <Select placeholder="담당자 선택" size="large">
                {staff.map((s) => (
                  <Select.Option key={s.id} value={s.id}>
                    <Text style={{ fontSize: 16 }}>{s.name}</Text>
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Divider style={{ margin: "16px 0" }}>
          <Text style={{ fontSize: 16, fontWeight: 500 }}>서비스 선택</Text>
        </Divider>

        {/* 카테고리 탭 */}
        <div style={{ marginBottom: 16 }}>
          <Row gutter={[12, 12]}>
            {serviceCategories.map((cat) => (
              <Col key={cat}>
                <Button
                  type={selectedCategory === cat ? "primary" : "default"}
                  onClick={() => setSelectedCategory(cat)}
                  size="large"
                  style={{
                    height: 52,
                    paddingInline: 24,
                    borderRadius: 12,
                    fontSize: 16,
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
            maxHeight: 280,
            overflowY: "auto",
            marginBottom: 16,
            background: "#fafafa",
            borderRadius: 16,
            padding: 16,
          }}
        >
          <Row gutter={[12, 12]}>
            {filteredMenus.map((menu) => (
              <Col key={menu.id} span={12}>
                {menu.price ? (
                  <Button
                    block
                    size="large"
                    onClick={() => handleAddService(menu)}
                    style={{
                      height: 64,
                      textAlign: "left",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      borderRadius: 12,
                      padding: "0 20px",
                      background: "#fff",
                      border: "2px solid #e8e8e8",
                    }}
                  >
                    <span style={{ fontSize: 17, fontWeight: 500 }}>
                      {menu.name}
                    </span>
                    <span
                      style={{
                        color: "#1890ff",
                        fontSize: 17,
                        fontWeight: 600,
                      }}
                    >
                      {formatPrice(menu.price)}
                    </span>
                  </Button>
                ) : (
                  <Card
                    size="small"
                    style={{
                      borderRadius: 12,
                      border: "2px solid #e8e8e8",
                    }}
                    styles={{ body: { padding: 16 } }}
                  >
                    <div
                      style={{
                        fontWeight: 600,
                        marginBottom: 12,
                        fontSize: 17,
                      }}
                    >
                      {menu.name}
                    </div>
                    <Row gutter={8}>
                      <Col span={8}>
                        <Button
                          block
                          onClick={() => handleAddService(menu, "short")}
                          style={{
                            height: 56,
                            borderRadius: 10,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: 8,
                          }}
                        >
                          <span style={{ fontWeight: 600 }}>숏</span>
                          <span style={{ fontSize: 13, color: "#1890ff" }}>
                            {menu.prices?.short &&
                              formatPrice(menu.prices.short)}
                          </span>
                        </Button>
                      </Col>
                      <Col span={8}>
                        <Button
                          block
                          onClick={() => handleAddService(menu, "medium")}
                          style={{
                            height: 56,
                            borderRadius: 10,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: 8,
                          }}
                        >
                          <span style={{ fontWeight: 600 }}>미듐</span>
                          <span style={{ fontSize: 13, color: "#1890ff" }}>
                            {menu.prices?.medium &&
                              formatPrice(menu.prices.medium)}
                          </span>
                        </Button>
                      </Col>
                      <Col span={8}>
                        <Button
                          block
                          onClick={() => handleAddService(menu, "long")}
                          style={{
                            height: 56,
                            borderRadius: 10,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: 8,
                          }}
                        >
                          <span style={{ fontWeight: 600 }}>롱</span>
                          <span style={{ fontSize: 13, color: "#1890ff" }}>
                            {menu.prices?.long && formatPrice(menu.prices.long)}
                          </span>
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
        <div
          style={{
            background:
              selectedServices.length > 0
                ? "linear-gradient(135deg, #e6f7ff 0%, #bae7ff 100%)"
                : "#f5f5f5",
            borderRadius: 16,
            padding: 20,
            marginBottom: 16,
            minHeight: 120,
            border: selectedServices.length > 0 ? "2px solid #91d5ff" : "none",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <Text strong style={{ fontSize: 16 }}>
              <ShoppingCartOutlined style={{ marginRight: 8 }} />
              선택된 서비스
            </Text>
            {selectedServices.length > 0 && (
              <Badge
                count={selectedServices.length}
                style={{ backgroundColor: "#1890ff" }}
              />
            )}
          </div>

          {selectedServices.length === 0 ? (
            <div
              style={{ textAlign: "center", padding: "20px 0", color: "#999" }}
            >
              <Text type="secondary" style={{ fontSize: 16 }}>
                위에서 서비스를 선택해주세요
              </Text>
            </div>
          ) : (
            <div style={{ maxHeight: 160, overflowY: "auto" }}>
              {selectedServices.map((service, index) => (
                <div
                  key={index}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "12px 16px",
                    background: "rgba(255,255,255,0.8)",
                    borderRadius: 10,
                    marginBottom: index < selectedServices.length - 1 ? 8 : 0,
                  }}
                >
                  <span style={{ fontSize: 16 }}>
                    {service.name}
                    {service.length && (
                      <Tag color="blue" style={{ marginLeft: 8, fontSize: 13 }}>
                        {service.length}
                      </Tag>
                    )}
                  </span>
                  <span
                    style={{ display: "flex", alignItems: "center", gap: 12 }}
                  >
                    <Text strong style={{ fontSize: 17, color: "#1890ff" }}>
                      {formatPrice(service.price)}
                    </Text>
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined style={{ fontSize: 18 }} />}
                      onClick={() => handleRemoveService(index)}
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                      }}
                    />
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 총액 및 버튼 */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "20px 0 0",
            borderTop: "2px solid #f0f0f0",
          }}
        >
          <div>
            <Text style={{ fontSize: 16, color: "#666" }}>총 결제 금액</Text>
            <br />
            <Text
              strong
              style={{
                fontSize: 36,
                color: "#1890ff",
                fontWeight: 700,
              }}
            >
              {formatPrice(totalPrice)}
            </Text>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <Button
              size="large"
              onClick={handleCancel}
              style={{
                height: 60,
                paddingInline: 32,
                fontSize: 18,
                borderRadius: 14,
              }}
            >
              취소
            </Button>
            <Button
              type="primary"
              size="large"
              onClick={handleSubmit}
              disabled={selectedServices.length === 0}
              icon={<CheckOutlined style={{ fontSize: 20 }} />}
              style={{
                height: 60,
                paddingInline: 40,
                fontSize: 18,
                fontWeight: 600,
                borderRadius: 14,
                boxShadow: "0 4px 12px rgba(24, 144, 255, 0.3)",
              }}
            >
              시술 시작
            </Button>
          </div>
        </div>
      </Form>
    </Modal>
  );
}
