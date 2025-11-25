"use client";

import React, { useState, useEffect } from "react";
import {
  Modal,
  Form,
  Select,
  Input,
  DatePicker,
  TimePicker,
  Typography,
  Divider,
  Button,
  Space,
  message,
} from "antd";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import { useStore } from "@/lib/store/useStore";
import { serviceMenus, serviceCategories } from "@/lib/data/services";
import type { SelectedService, ReservationRequest } from "@/lib/api/client";
import dayjs from "dayjs";

const { Text } = Typography;

interface NewReservationModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (reservation: ReservationRequest) => Promise<unknown>;
}

export function NewReservationModal({
  open,
  onClose,
  onAdd,
}: NewReservationModalProps) {
  const { staff, fetchStaff, members, fetchMembers, incrementGuestCounter } =
    useStore();
  const [form] = Form.useForm();
  const [selectedServices, setSelectedServices] = useState<SelectedService[]>(
    [],
  );
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  // 모달 열릴 때 데이터 로드
  useEffect(() => {
    if (open) {
      fetchStaff();
      fetchMembers();
    }
  }, [open, fetchStaff, fetchMembers]);

  const handleAddService = () => {
    setSelectedServices([...selectedServices, { name: "", price: 0 }]);
  };

  const handleRemoveService = (index: number) => {
    setSelectedServices(selectedServices.filter((_, i) => i !== index));
  };

  const handleServiceChange = (index: number, serviceId: string) => {
    const menu = serviceMenus.find((m) => m.id === serviceId);
    if (!menu) return;

    let price = 0;
    if (menu.price) {
      price = menu.price;
    }

    const newServices = [...selectedServices];
    newServices[index] = {
      name: menu.name,
      price,
    };
    setSelectedServices(newServices);
  };

  const handleLengthChange = (
    index: number,
    length: "short" | "medium" | "long",
  ) => {
    const service = selectedServices[index];
    const menu = serviceMenus.find((m) => m.name === service.name);
    if (!menu || !menu.prices) return;

    const price = menu.prices[length] || 0;
    const newServices = [...selectedServices];
    newServices[index] = {
      ...service,
      length,
      price,
    };
    setSelectedServices(newServices);
  };

  const totalPrice = selectedServices.reduce((sum, s) => sum + s.price, 0);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("ko-KR").format(price) + "원";
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      const staffMember = staff.find((s) => s.id === values.staffId);
      const memberName = values.memberName || incrementGuestCounter();

      const reservedAt = dayjs(values.date)
        .hour(values.time.hour())
        .minute(values.time.minute())
        .toISOString();

      const reservation: ReservationRequest = {
        memberId: values.memberId || undefined,
        memberName,
        memberPhone: values.memberPhone || undefined,
        seatId: undefined,
        staffId: values.staffId,
        staffName: staffMember?.name || "",
        services: selectedServices,
        totalPrice,
        reservedAt,
        estimatedDuration: 30,
      };

      await onAdd(reservation);
      message.success("예약이 등록되었습니다");
      form.resetFields();
      setSelectedServices([]);
      setSelectedCategory("");
      onClose();
    } catch (error) {
      if (error instanceof Error) {
        message.error(error.message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setSelectedServices([]);
    setSelectedCategory("");
    onClose();
  };

  const filteredMenus = selectedCategory
    ? serviceMenus.filter((m) => m.category === selectedCategory)
    : serviceMenus;

  // 시간 선택 옵션 생성 (10:00 ~ 20:00, 30분 간격)
  const disabledTime = () => ({
    disabledHours: () => [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 20, 21, 22, 23],
  });

  return (
    <Modal
      title="새 예약"
      open={open}
      onCancel={handleCancel}
      onOk={handleSubmit}
      okText="예약 확정"
      cancelText="취소"
      confirmLoading={submitting}
      width={600}
    >
      <Form form={form} layout="vertical">
        <Divider>고객 정보</Divider>

        <Form.Item name="memberName" label="고객명 (선택사항)">
          <Input placeholder="미입력 시 '손님1' 형식으로 자동 생성" />
        </Form.Item>

        <Form.Item name="memberPhone" label="전화번호 (선택사항)">
          <Input placeholder="010-0000-0000" />
        </Form.Item>

        <Divider>예약 정보</Divider>

        <Form.Item
          name="date"
          label="날짜"
          rules={[{ required: true, message: "날짜를 선택해주세요" }]}
          initialValue={dayjs()}
        >
          <DatePicker style={{ width: "100%" }} />
        </Form.Item>

        <Form.Item
          name="time"
          label="시간"
          rules={[{ required: true, message: "시간을 선택해주세요" }]}
        >
          <TimePicker
            format="HH:mm"
            minuteStep={30}
            disabledTime={disabledTime}
            style={{ width: "100%" }}
            needConfirm={false}
          />
        </Form.Item>

        <Form.Item
          name="staffId"
          label="담당 직원"
          rules={[{ required: true, message: "담당 직원을 선택해주세요" }]}
        >
          <Select placeholder="담당 직원 선택">
            {staff.map((s) => (
              <Select.Option key={s.id} value={s.id}>
                {s.name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Divider>서비스 선택</Divider>

        <Form.Item label="카테고리">
          <Select
            placeholder="카테고리 선택"
            allowClear
            onChange={setSelectedCategory}
            value={selectedCategory || undefined}
          >
            {serviceCategories.map((cat) => (
              <Select.Option key={cat} value={cat}>
                {cat}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        {selectedServices.map((service, index) => (
          <div
            key={index}
            style={{
              marginBottom: 16,
              padding: 16,
              background: "#fafafa",
              borderRadius: 8,
            }}
          >
            <Space direction="vertical" style={{ width: "100%" }}>
              <Space style={{ width: "100%", justifyContent: "space-between" }}>
                <Select
                  style={{ width: 300 }}
                  placeholder="서비스 선택"
                  onChange={(value) => handleServiceChange(index, value)}
                >
                  {filteredMenus.map((menu) => (
                    <Select.Option key={menu.id} value={menu.id}>
                      {menu.name}
                      {menu.price && ` - ${formatPrice(menu.price)}`}
                    </Select.Option>
                  ))}
                </Select>
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => handleRemoveService(index)}
                />
              </Space>

              {service.name &&
                serviceMenus.find((m) => m.name === service.name)?.prices && (
                  <Select
                    style={{ width: 200 }}
                    placeholder="길이 선택"
                    value={service.length}
                    onChange={(value) =>
                      handleLengthChange(
                        index,
                        value as "short" | "medium" | "long",
                      )
                    }
                  >
                    <Select.Option value="short">숏</Select.Option>
                    <Select.Option value="medium">미듐</Select.Option>
                    <Select.Option value="long">롱</Select.Option>
                  </Select>
                )}

              {service.price > 0 && (
                <Text strong>{formatPrice(service.price)}</Text>
              )}
            </Space>
          </div>
        ))}

        <Button
          type="dashed"
          onClick={handleAddService}
          icon={<PlusOutlined />}
          style={{ width: "100%", marginBottom: 16 }}
        >
          서비스 추가
        </Button>

        <Divider />

        <div style={{ textAlign: "right" }}>
          <Text style={{ fontSize: 18 }}>
            총 금액:{" "}
            <Text strong style={{ color: "#1890ff", fontSize: 20 }}>
              {formatPrice(totalPrice)}
            </Text>
          </Text>
        </div>

        <div
          style={{
            marginTop: 16,
            padding: 12,
            background: "#e6f7ff",
            borderRadius: 8,
          }}
        >
          <Text type="secondary">* 좌석은 시술 시작 시 배정됩니다</Text>
        </div>
      </Form>
    </Modal>
  );
}
