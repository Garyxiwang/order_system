'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  
  useEffect(() => {
    // 重定向到登录页面
    router.push('/login');
  }, [router]);
  
  // 返回空内容，因为页面会立即重定向
  return null;
}
