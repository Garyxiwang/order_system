/**
 * 服务端日志工具
 * 提供统一的日志记录功能，支持在服务端和客户端环境中使用
 */

// 日志类型
export enum LogType {
  NAVIGATION = 'NAVIGATION',
  MENU_CLICK = 'MENU_CLICK',
  SYSTEM = 'SYSTEM',
  ERROR = 'ERROR',
  WARNING = 'WARNING',
  INFO = 'INFO'
}

// 日志级别
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARNING = 2,
  ERROR = 3
}

// 当前日志级别，可以通过环境变量配置
const currentLogLevel = LogLevel.DEBUG;

/**
 * 服务端日志记录函数
 * @param type 日志类型
 * @param message 日志消息
 * @param level 日志级别
 */
export const logToServer = (type: string, message: string, level: LogLevel = LogLevel.INFO) => {
  // 如果当前日志级别高于设定级别，则不记录
  if (level < currentLogLevel) return;
  
  // 确保只在服务端执行，并且process.stdout存在
  if (typeof window !== 'undefined' || typeof process === 'undefined' || !process.stdout || typeof process.stdout.write !== 'function') {
    return;
  }
  
  try {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${type}] ${message}`;
    
    // 根据日志级别设置不同颜色
    let coloredMessage = logMessage;
    switch (level) {
      case LogLevel.ERROR:
        coloredMessage = `\x1b[31m${logMessage}\x1b[0m`; // 红色
        break;
      case LogLevel.WARNING:
        coloredMessage = `\x1b[33m${logMessage}\x1b[0m`; // 黄色
        break;
      case LogLevel.INFO:
        coloredMessage = `\x1b[36m${logMessage}\x1b[0m`; // 青色
        break;
      case LogLevel.DEBUG:
        coloredMessage = `\x1b[90m${logMessage}\x1b[0m`; // 灰色
        break;
    }
    
    process.stdout.write(`${coloredMessage}\n`);
  } catch (error: any) {
    // 如果出现错误，使用console.log作为备选
    console.log(`[SERVER LOG ERROR] 无法写入服务端日志: ${error.message}`);
  }
};

/**
 * 客户端日志记录函数
 * @param type 日志类型
 * @param message 日志消息
 * @param level 日志级别
 */
export const logToClient = (type: string, message: string, level: LogLevel = LogLevel.INFO) => {
  // 如果当前日志级别高于设定级别，则不记录
  if (level < currentLogLevel) return;
  
  // 确保只在客户端执行
  if (typeof window === 'undefined') return;
  
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${type}] ${message}`;
  
  // 根据日志级别使用不同的控制台方法
  switch (level) {
    case LogLevel.ERROR:
      console.error(logMessage);
      break;
    case LogLevel.WARNING:
      console.warn(logMessage);
      break;
    case LogLevel.INFO:
      console.info(logMessage);
      break;
    case LogLevel.DEBUG:
      console.debug(logMessage);
      break;
  }
};

/**
 * 通用日志记录函数，同时在服务端和客户端记录日志
 * @param type 日志类型
 * @param message 日志消息
 * @param level 日志级别
 */
export const log = (type: string, message: string, level: LogLevel = LogLevel.INFO) => {
  try {
    // 尝试在服务端记录日志
    logToServer(type, message, level);
  } catch (error: any) {
    // 如果服务端日志失败，不做任何处理
  }
  
  try {
    // 尝试在客户端记录日志
    logToClient(type, message, level);
  } catch (error: any) {
    // 如果客户端日志失败，使用基本的console.log作为备选
    console.log(`[${type}] ${message}`);
  }
};

// 导出便捷的日志函数
export const logger = {
  navigation: (path: string) => log(LogType.NAVIGATION, `页面已跳转到: ${path}`),
  menuClick: (label: string, path: string) => log(LogType.MENU_CLICK, `用户点击了菜单: ${label} 跳转到: ${path}`),
  system: (message: string) => log(LogType.SYSTEM, message),
  error: (message: string) => log(LogType.ERROR, message, LogLevel.ERROR),
  warning: (message: string) => log(LogType.WARNING, message, LogLevel.WARNING),
  info: (message: string) => log(LogType.INFO, message, LogLevel.INFO),
  debug: (message: string) => log(LogType.INFO, message, LogLevel.DEBUG)
};

export default logger;