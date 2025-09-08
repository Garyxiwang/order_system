"use client";

import { useEffect } from "react";
import { ConfigProvider } from "antd";
import zhCN from "antd/locale/zh_CN";
import dayjs from "dayjs";
import "dayjs/locale/zh-cn";

interface LocaleProviderProps {
  children: React.ReactNode;
}

export default function LocaleProvider({ children }: LocaleProviderProps) {
  useEffect(() => {
    // 在客户端设置dayjs为中文
    dayjs.locale("zh-cn");
  }, []);

  return (
    <ConfigProvider locale={zhCN}>
      {children}
    </ConfigProvider>
  );
}