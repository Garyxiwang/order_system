# 日志系统使用说明

本项目实现了一个完整的日志系统，支持在客户端和服务端同时记录日志。

## 日志工具使用方法

### 1. 导入日志工具

```typescript
import logger from '@/utils/logger';
```

### 2. 记录不同类型的日志

```typescript
// 记录导航日志
logger.navigation('/some/path');

// 记录菜单点击日志
logger.menuClick('菜单名称', '/menu/path');

// 记录系统信息
logger.system('系统已启动');

// 记录错误信息
logger.error('发生错误');

// 记录警告信息
logger.warning('警告信息');

// 记录一般信息
logger.info('一般信息');

// 记录调试信息
logger.debug('调试信息');
```

### 3. 直接使用日志函数

如果需要自定义日志类型，可以直接使用日志函数：

```typescript
import { log, LogLevel } from '@/utils/logger';

// 记录自定义类型的日志
log('CUSTOM_TYPE', '自定义日志消息', LogLevel.INFO);
```

## 服务端日志

服务端日志会在终端中显示，并且可以通过以下方式启动服务来将日志保存到文件：

```bash
# 使用日志记录启动开发服务器
npm run dev
# 或
npm run dev:log

# 不使用日志记录启动开发服务器
npm run dev:no-log

# 使用日志记录启动生产服务器
npm run start:log
```

日志文件将保存在项目根目录的 `logs` 文件夹中，文件名格式为 `server-YYYY-MM-DD.log`。

## 中间件日志

项目使用了中间件来记录所有HTTP请求的日志，包括请求方法、路径、处理时间等信息。

## 日志级别

日志系统支持以下日志级别：

- DEBUG (0): 调试信息，最详细的日志
- INFO (1): 一般信息，默认级别
- WARNING (2): 警告信息
- ERROR (3): 错误信息，最严重的日志

可以在 `src/utils/logger.ts` 文件中修改 `currentLogLevel` 变量来调整日志级别，只有级别大于等于当前设置的日志才会被记录。