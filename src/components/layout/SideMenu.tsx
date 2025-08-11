'use client';

import React from 'react';
import { Menu } from 'antd';
import { FileOutlined, ShoppingCartOutlined, SettingOutlined, DashboardOutlined } from '@ant-design/icons';
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
      icon: <FileOutlined className="text-blue-600" />,
      label: <Link href="/design" className="text-gray-700 hover:text-blue-600 font-medium">设计管理</Link>,
    },
    {
      key: 'split',
      icon: <ShoppingCartOutlined className="text-blue-600" />,
      label: <Link href="/split" className="text-gray-700 hover:text-blue-600 font-medium">拆单管理</Link>,
    },
    {
      key: 'config',
      icon: <SettingOutlined className="text-blue-600" />,
      label: <Link href="/config" className="text-gray-700 hover:text-blue-600 font-medium">系统配置</Link>,
    },
  ];

  return (
    <Menu
      mode="inline"
      selectedKeys={getSelectedKey()}
      items={menuItems}
      className="border-r-0 bg-transparent"
      style={{ fontSize: '15px' }}
    />
  );
};

export default SideMenu;