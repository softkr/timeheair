"use client";

import { useState } from "react";
import { Button, Space, message, Modal, Typography } from "antd";
import {
  CloudUploadOutlined,
  CloudDownloadOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import { invoke } from "@tauri-apps/api/core";
import { save, open } from "@tauri-apps/plugin-dialog";
import { relaunch } from "@tauri-apps/plugin-process";
import dayjs from "dayjs";

const { Text } = Typography;

export default function BackupRestore() {
  const [loading, setLoading] = useState<"backup" | "restore" | null>(null);

  const handleBackup = async () => {
    try {
      if (typeof window === "undefined" || !("__TAURI__" in window)) {
        message.error("Tauri 환경에서만 사용 가능합니다");
        return;
      }

      const defaultName = `timehair_backup_${dayjs().format("YYYYMMDD_HHmmss")}.db`;

      const filePath = await save({
        defaultPath: defaultName,
        filters: [{ name: "Database", extensions: ["db"] }],
      });

      if (!filePath) return;

      setLoading("backup");
      await invoke("backup_database", { path: filePath });
      message.success("백업이 완료되었습니다");
    } catch (error) {
      console.error("백업 실패:", error);
      message.error(`백업 실패: ${error}`);
    } finally {
      setLoading(null);
    }
  };

  const handleRestore = async () => {
    try {
      if (typeof window === "undefined" || !("__TAURI__" in window)) {
        message.error("Tauri 환경에서만 사용 가능합니다");
        return;
      }

      const filePath = await open({
        filters: [{ name: "Database", extensions: ["db"] }],
        multiple: false,
      });

      if (!filePath) return;

      Modal.confirm({
        title: (
          <span style={{ fontSize: 18 }}>
            <ExclamationCircleOutlined
              style={{ color: "#faad14", marginRight: 8 }}
            />
            데이터 복원
          </span>
        ),
        content: (
          <div style={{ fontSize: 15 }}>
            <p>현재 데이터가 백업 파일의 데이터로 교체됩니다.</p>
            <p style={{ color: "#ff4d4f", fontWeight: 500 }}>
              이 작업은 되돌릴 수 없습니다.
            </p>
            <p>복원 후 앱이 자동으로 재시작됩니다.</p>
          </div>
        ),
        okText: "복원",
        cancelText: "취소",
        okButtonProps: {
          danger: true,
          size: "large",
          style: { height: 44, fontSize: 15 },
        },
        cancelButtonProps: {
          size: "large",
          style: { height: 44, fontSize: 15 },
        },
        width: 420,
        onOk: async () => {
          try {
            setLoading("restore");
            await invoke("restore_database", { path: filePath });
            message.success("복원이 완료되었습니다. 앱을 재시작합니다...");
            setTimeout(async () => {
              await relaunch();
            }, 1500);
          } catch (error) {
            console.error("복원 실패:", error);
            message.error(`복원 실패: ${error}`);
            setLoading(null);
          }
        },
      });
    } catch (error) {
      console.error("파일 선택 실패:", error);
      message.error(`파일 선택 실패: ${error}`);
    }
  };

  return (
    <div
      style={{
        padding: "16px 20px",
        borderTop: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <Text
        style={{
          color: "rgba(255,255,255,0.5)",
          fontSize: 12,
          display: "block",
          marginBottom: 12,
        }}
      >
        데이터 관리
      </Text>
      <Space direction="vertical" style={{ width: "100%" }} size={8}>
        <Button
          icon={<CloudDownloadOutlined />}
          onClick={handleBackup}
          loading={loading === "backup"}
          style={{
            width: "100%",
            height: 40,
            fontSize: 14,
            borderRadius: 8,
            background: "rgba(255,255,255,0.1)",
            border: "none",
            color: "rgba(255,255,255,0.85)",
          }}
        >
          데이터 백업
        </Button>
        <Button
          icon={<CloudUploadOutlined />}
          onClick={handleRestore}
          loading={loading === "restore"}
          style={{
            width: "100%",
            height: 40,
            fontSize: 14,
            borderRadius: 8,
            background: "rgba(255,255,255,0.1)",
            border: "none",
            color: "rgba(255,255,255,0.85)",
          }}
        >
          데이터 복원
        </Button>
      </Space>
    </div>
  );
}
