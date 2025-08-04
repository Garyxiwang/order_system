'use client';

import React from 'react';
import { createCache, extractStyle, StyleProvider } from '@ant-design/cssinjs';
import type Entity from '@ant-design/cssinjs/es/Cache';
import { useServerInsertedHTML } from 'next/navigation';

interface AntdRegistryProps {
  children: React.ReactNode;
}

const AntdRegistry = ({ children }: AntdRegistryProps) => {
  const cache = React.useMemo<Entity>(() => createCache(), []);
  
  useServerInsertedHTML(() => {
    return (
      <style 
        id="antd" 
        dangerouslySetInnerHTML={{ __html: extractStyle(cache, true) }} 
      />
    );
  });
  
  return <StyleProvider cache={cache}>{children}</StyleProvider>;
};

export default AntdRegistry;