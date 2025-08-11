'use client';

import React from 'react';
import { Menu } from 'antd';
import { FileOutlined, ShoppingCartOutlined, SettingOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const SideMenu: React.FC = () => {
  const pathname = usePathname();
  
  // 根据当前路径确定选中的菜单项
  const getSelectedKey = () => {
    if (pathname.startsWith('/design')) return ['design'];
    if (pathname.startsWith('/split')) return ['split'];
    if (pathname.startsWith('/config')) return ['config'];
    return [];
  };

  const menuItems = [
    {
      key: 'design',
      icon: <FileOutlined />,
      label: <Link href="/design">设计页</Link>,
    },
    {
      key: 'split',
      icon: <ShoppingCartOutlined />,
      label: <Link href="/split">拆单页</Link>,
    },
    {
      key: 'config',
      icon: <SettingOutlined />,
      label: <Link href="/config">配置页</Link>,
    },
  ];

  return (
    <Menu
      mode="inline"
      selectedKeys={getSelectedKey()}
      items={menuItems}
      className="border-r-0"
    />
  );
};

export default SideMenu;