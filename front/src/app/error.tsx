'use client'

import { useEffect } from 'react'
import { Button, Result } from 'antd'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Result
        status="500"
        title="500"
        subTitle="抱歉，页面出现了错误。"
        extra={
          <Button type="primary" onClick={() => reset()}>
            重试
          </Button>
        }
      />
    </div>
  )
}