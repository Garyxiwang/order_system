/**
 * 日期时间工具函数
 */
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

// 配置dayjs插件
dayjs.extend(utc);
dayjs.extend(timezone);

/**
 * 格式化日期时间为 YYYY-MM-DD HH:mm:ss 格式（北京时间）
 * @param dateString - 日期字符串或Date对象
 * @returns 格式化后的日期时间字符串，如果输入无效则返回 '-'
 */
export const formatDateTime = (dateString: string | Date | null | undefined): string => {
  if (!dateString) return '-';
  
  try {
    // 使用dayjs处理时区转换
    return dayjs(dateString).tz('Asia/Shanghai').format('YYYY-MM-DD HH:mm:ss');
  } catch (error) {
    console.error('日期格式化错误:', error);
    return '-';
  }
};

/**
 * 格式化日期为 YYYY-MM-DD 格式（北京时间）
 * @param dateString - 日期字符串或Date对象
 * @returns 格式化后的日期字符串，如果输入无效则返回 '-'
 */
export const formatDate = (dateString: string | Date | null | undefined): string => {
  if (!dateString) return '-';
  
  try {
    // 使用dayjs处理时区转换
    return dayjs(dateString).tz('Asia/Shanghai').format('YYYY-MM-DD');
  } catch (error) {
    console.error('日期格式化错误:', error);
    return '-';
  }
};

/**
 * 格式化时间为 HH:mm:ss 格式（北京时间）
 * @param dateString - 日期字符串或Date对象
 * @returns 格式化后的时间字符串，如果输入无效则返回 '-'
 */
export const formatTime = (dateString: string | Date | null | undefined): string => {
  if (!dateString) return '-';
  
  try {
    // 使用dayjs处理时区转换
    return dayjs(dateString).tz('Asia/Shanghai').format('HH:mm:ss');
  } catch (error) {
    console.error('时间格式化错误:', error);
    return '-';
  }
};

/**
 * 获取当前北京时间
 * @returns 当前北京时间的dayjs对象
 */
export const getCurrentBeijingTime = () => {
  return dayjs().tz('Asia/Shanghai');
};

/**
 * 将UTC时间转换为北京时间显示
 * @param utcDateString - UTC时间字符串
 * @returns 北京时间格式的字符串
 */
export const utcToBeijingDisplay = (utcDateString: string | null | undefined): string => {
  if (!utcDateString) return '-';
  
  try {
    return dayjs.utc(utcDateString).tz('Asia/Shanghai').format('YYYY-MM-DD HH:mm:ss');
  } catch (error) {
    console.error('UTC转北京时间错误:', error);
    return '-';
  }
};