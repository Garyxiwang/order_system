/**
 * 日期时间工具函数
 */

/**
 * 格式化日期时间为 YYYY-MM-DD HH:mm:ss 格式
 * @param dateString - 日期字符串或Date对象
 * @returns 格式化后的日期时间字符串，如果输入无效则返回 '-'
 */
export const formatDateTime = (dateString: string | Date | null | undefined): string => {
  if (!dateString) return '-';
  
  try {
    const date = new Date(dateString);
    
    // 检查日期是否有效
    if (isNaN(date.getTime())) {
      return '-';
    }
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  } catch (error) {
    console.error('日期格式化错误:', error);
    return '-';
  }
};

/**
 * 格式化日期为 YYYY-MM-DD 格式
 * @param dateString - 日期字符串或Date对象
 * @returns 格式化后的日期字符串，如果输入无效则返回 '-'
 */
export const formatDate = (dateString: string | Date | null | undefined): string => {
  if (!dateString) return '-';
  
  try {
    const date = new Date(dateString);
    
    // 检查日期是否有效
    if (isNaN(date.getTime())) {
      return '-';
    }
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error('日期格式化错误:', error);
    return '-';
  }
};

/**
 * 格式化时间为 HH:mm:ss 格式
 * @param dateString - 日期字符串或Date对象
 * @returns 格式化后的时间字符串，如果输入无效则返回 '-'
 */
export const formatTime = (dateString: string | Date | null | undefined): string => {
  if (!dateString) return '-';
  
  try {
    const date = new Date(dateString);
    
    // 检查日期是否有效
    if (isNaN(date.getTime())) {
      return '-';
    }
    
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return `${hours}:${minutes}:${seconds}`;
  } catch (error) {
    console.error('时间格式化错误:', error);
    return '-';
  }
};