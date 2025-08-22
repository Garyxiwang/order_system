/**
 * 服务端日志记录脚本
 * 用于在服务器启动时记录日志
 * 
 * 使用方法：在package.json的scripts中添加
 * "dev": "node src/scripts/server-logger.js && next dev"
 */

import fs from 'fs';
import path from 'path';

// 创建日志目录
const logDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

// 获取当前日期作为日志文件名
const date = new Date();
const logFileName = `server-${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}.log`;
const logFilePath = path.join(logDir, logFileName);

// 记录服务器启动日志
const startupLog = `[${new Date().toISOString()}] [SYSTEM] 服务器启动\n`;

// 将日志写入文件
fs.appendFileSync(logFilePath, startupLog);

// 重定向控制台输出到日志文件
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
const originalConsoleInfo = console.info;

// 创建一个写入日志文件的函数
function logToFile(message, type = 'LOG') {
  try {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${type}] ${message}\n`;
    
    try {
      fs.appendFileSync(logFilePath, logMessage);
    } catch (fileError) {
      // 如果写入文件失败，只输出到控制台，不抛出错误
      originalConsoleError(`无法写入日志文件: ${fileError.message}`);
    }
    
    // 同时输出到原始控制台
    return logMessage;
  } catch (error) {
    // 如果发生任何错误，确保不会中断程序
    originalConsoleError(`日志记录错误: ${error.message}`);
    return message;
  }
}

// 重写控制台方法
console.log = function() {
  try {
    const message = Array.from(arguments).join(' ');
    originalConsoleLog(logToFile(message, 'LOG'));
  } catch {
    // 如果发生错误，回退到原始的console.log
    originalConsoleLog(...arguments);
  }
};

console.error = function() {
  try {
    const message = Array.from(arguments).join(' ');
    originalConsoleError(logToFile(message, 'ERROR'));
  } catch {
    // 如果发生错误，回退到原始的console.error
    originalConsoleError(...arguments);
  }
};

console.warn = function() {
  try {
    const message = Array.from(arguments).join(' ');
    originalConsoleWarn(logToFile(message, 'WARN'));
  } catch {
    // 如果发生错误，回退到原始的console.warn
    originalConsoleWarn(...arguments);
  }
};

console.info = function() {
  try {
    const message = Array.from(arguments).join(' ');
    originalConsoleInfo(logToFile(message, 'INFO'));
  } catch {
    // 如果发生错误，回退到原始的console.info
    originalConsoleInfo(...arguments);
  }
};

// 输出服务器启动信息
console.log('服务器日志记录已启动，日志文件：' + logFilePath);