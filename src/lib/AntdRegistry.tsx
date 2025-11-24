'use client';

import React from 'react';
import { ConfigProvider } from 'antd';
import koKR from 'antd/locale/ko_KR';

export function AntdRegistry({ children }: { children: React.ReactNode }) {
  return (
    <ConfigProvider
      locale={koKR}
      theme={{
        token: {
          colorPrimary: '#1890ff',
          borderRadius: 8,
        },
      }}
    >
      {children}
    </ConfigProvider>
  );
}
