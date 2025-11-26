"use client";

import { useEffect } from "react";
import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import { message } from "antd";

export default function UpdateChecker() {
  useEffect(() => {
    // 앱 시작 시 즉시 체크
    checkForUpdates();

    // 10분마다 주기적으로 체크
    const interval = setInterval(
      () => {
        checkForUpdates();
      },
      10 * 60 * 1000,
    ); // 10분 = 600,000ms

    return () => clearInterval(interval);
  }, []);

  const checkForUpdates = async () => {
    try {
      // Tauri 환경인지 확인
      if (typeof window !== "undefined" && "__TAURI__" in window) {
        const update = await check();

        if (update?.available) {
          const shouldUpdate = window.confirm(
            `새로운 버전 ${update.version}이 출시되었습니다.\n지금 업데이트하시겠습니까?\n\n변경사항:\n${update.body || "새 버전이 출시되었습니다."}`,
          );

          if (shouldUpdate) {
            message.loading("업데이트를 다운로드하는 중...", 0);

            await update.downloadAndInstall();

            message.destroy();
            message.success("업데이트가 완료되었습니다. 앱을 재시작합니다.");

            await relaunch();
          }
        }
      }
    } catch (error) {
      console.error("업데이트 확인 중 오류:", error);
    }
  };

  return null;
}
