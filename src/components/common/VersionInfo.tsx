"use client";

import { useState, useEffect } from "react";
import { Button, Typography, Space, message } from "antd";
import { SyncOutlined, InfoCircleOutlined } from "@ant-design/icons";
import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import { getVersion } from "@tauri-apps/api/app";

const { Text } = Typography;

export default function VersionInfo() {
  const [version, setVersion] = useState<string>("");
  const [checking, setChecking] = useState(false);

  // 컴포넌트 마운트 시 버전 가져오기
  useEffect(() => {
    if (typeof window !== "undefined" && "__TAURI__" in window) {
      getVersion()
        .then(setVersion)
        .catch(() => setVersion("0.0.0"));
    }
  }, []);

  const handleCheckUpdate = async () => {
    if (typeof window === "undefined" || !("__TAURI__" in window)) {
      message.info("업데이트는 데스크톱 앱에서만 가능합니다.");
      return;
    }

    setChecking(true);
    try {
      const update = await check();

      if (update?.available) {
        const shouldUpdate = window.confirm(
          `새로운 버전 ${update.version}이 출시되었습니다.\n지금 업데이트하시겠습니까?\n\n변경사항:\n${update.body || "새 버전이 출시되었습니다."}`,
        );

        if (shouldUpdate) {
          message.loading({
            content: "업데이트를 다운로드하는 중...",
            key: "update",
            duration: 0,
          });

          await update.downloadAndInstall();

          message.success({
            content: "업데이트가 완료되었습니다. 앱을 재시작합니다.",
            key: "update",
          });

          await relaunch();
        }
      } else {
        message.success("최신 버전을 사용 중입니다.");
      }
    } catch (error) {
      console.error("업데이트 확인 중 오류:", error);
      message.error("업데이트 확인에 실패했습니다.");
    } finally {
      setChecking(false);
    }
  };

  if (typeof window === "undefined" || !("__TAURI__" in window)) {
    return null;
  }

  return (
    <div
      style={{
        padding: "12px 16px",
        borderTop: "1px solid rgba(255,255,255,0.08)",
        background: "rgba(0,0,0,0.15)",
      }}
    >
      <Space direction="vertical" size={8} style={{ width: "100%" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <InfoCircleOutlined
            style={{ fontSize: 14, color: "rgba(255,255,255,0.5)" }}
          />
          <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>
            버전 {version}
          </Text>
        </div>
        <Button
          type="text"
          icon={<SyncOutlined spin={checking} style={{ fontSize: 16 }} />}
          onClick={handleCheckUpdate}
          loading={checking}
          style={{
            color: "rgba(255,255,255,0.7)",
            width: "100%",
            height: 40,
            fontSize: 14,
            borderRadius: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
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
          업데이트 확인
        </Button>
      </Space>
    </div>
  );
}
