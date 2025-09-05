import api from './api';

// 人员数据类型定义
export interface StaffData {
  username: string;
  role: string;
  created_at?: string;
}

// 人员服务类
export class StaffService {
  // 获取人员列表
  static async getStaffList(): Promise<StaffData[]> {
    try {
      const response = await api.get('/v1/users/') as unknown as {
        code: number;
        message: string;
        data: {
          users: StaffData[];
          total: number;
        };
      };
      return response.data.users;
    } catch (error) {
      console.error('获取人员列表失败:', error);
      throw error;
    }
  }

  // 新增人员
  static async createStaff(staffData: StaffData & { password?: string }): Promise<StaffData> {
    try {
      // 为新用户设置默认密码
      const createData = {
        ...staffData,
        password: staffData.password || '123456' // 默认密码
      };
      
      const response = await api.post('/v1/users/', createData) as unknown as {
        code: number;
        message: string;
        data: {
          user: StaffData;
        };
      };
      return {
        username: response.data.user.username,
        role: response.data.user.role,
        created_at: response.data.user.created_at
      };
    } catch (error) {
      console.error('新增人员失败:', error);
      throw error;
    }
  }

  // 删除人员
  static async deleteStaff(username: string): Promise<void> {
    try {
      await api.delete(`/v1/users/${username}/`);
    } catch (error) {
      console.error('删除人员失败:', error);
      throw error;
    }
  }
}

export default StaffService;