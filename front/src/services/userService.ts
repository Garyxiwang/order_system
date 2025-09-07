import api from './api';

// 用户数据类型定义
export interface UserData {
  username: string;
  role: string;
  created_at?: string;
}

// 用户角色枚举
export enum UserRole {
  SUPER_ADMIN = 'superAdmin',
  ADMIN = 'admin',
  MANAGER = 'manager',
  DESIGNER = 'designer',
  SPLITTING = 'splitting',
  CLERK = 'clerk',
  PROCUREMENT = 'procurement',
  SALESPERSON = 'salesperson',
  FINANCE = 'finance',
  WORKSHOP = 'workshop',
  SHIPPER = 'shipper',
  CUSTOMER = 'customer'
}

// 用户服务类
export class UserService {
  // 获取用户列表
  static async getUserList(): Promise<UserData[]> {
    try {
      const response = await api.get('/v1/users/') as unknown as {
        code: number;
        message: string;
        data: {
          users: UserData[];
          total: number;
        };
      };
      return response.data.users;
    } catch (error) {
      console.error('获取用户列表失败:', error);
      throw error;
    }
  }

  // 根据角色获取用户列表
  static async getUsersByRole(role: UserRole): Promise<UserData[]> {
    try {
      const allUsers = await this.getUserList();
      return allUsers.filter(user => user.role === role);
    } catch (error) {
      console.error('根据角色获取用户列表失败:', error);
      throw error;
    }
  }

  // 获取设计师列表
  static async getDesigners(): Promise<UserData[]> {
    return this.getUsersByRole(UserRole.DESIGNER);
  }

  // 获取销售员列表
  static async getSalespersons(): Promise<UserData[]> {
    return this.getUsersByRole(UserRole.SALESPERSON);
  }
}

export default UserService;