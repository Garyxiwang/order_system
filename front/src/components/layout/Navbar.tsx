'use client';

import React, { useState } from 'react';
import { Layout, Menu, Button, Drawer } from 'antd';
import { MenuOutlined, ShoppingCartOutlined, UserOutlined, SettingOutlined } from '@ant-design/icons';
import Link from 'next/link';

const { Header } = Layout;

const Navbar: React.FC = () => {
  const [visible, setVisible] = useState(false);

  const showDrawer = () => {
    setVisible(true);
  };

  const onClose = () => {
    setVisible(false);
  };

  const menuItems = [
    {
      key: 'design',
      icon: <UserOutlined />,
      label: <Link href="/design">设计页</Link>,
    },
    {
      key: 'split',
      icon: <ShoppingCartOutlined />,
      label: <Link href="/split">拆单页</Link>,
    },
    {
      key: 'production',
      icon: <ShoppingCartOutlined />,
      label: <Link href="/production">生产页</Link>,
    },
    {
      key: 'config',
      icon: <SettingOutlined />,
      label: <Link href="/config">配置页</Link>,
    },
  ];

  return (
    <>
      <Header className="flex justify-between items-center bg-white shadow-sm px-4 h-16">
        <div className="flex items-center">
          <div className="text-xl font-bold mr-8">进度管理系统</div>
          <div className="hidden md:block">
            <Menu mode="horizontal" items={menuItems} />
          </div>
        </div>
        <div className="block md:hidden">
          <Button type="text" icon={<MenuOutlined />} onClick={showDrawer} />
        </div>
      </Header>

      <Drawer
        title="菜单"
        placement="right"
        onClose={onClose}
        open={visible}
        width={250}
      >
        <Menu
          mode="vertical"
          items={menuItems}
          onClick={onClose}
        />
      </Drawer>
    </>
  );
};

export default Navbar;