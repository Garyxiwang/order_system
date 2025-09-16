import api from './api';

// 登录请求数据类型
export interface LoginRequest {
  username: string;
  password: string;
}

// 登录响应数据类型
export interface LoginResponse {
  code: number;
  message: string;
  data: {
    username: string;
    role: string;
  };
}

// 修改密码请求数据类型
export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}

// 修改密码响应数据类型
export interface ChangePasswordResponse {
  code: number;
  message: string;
  data: object;
}

// 用户信息类型
export interface UserInfo {
  username: string;
  role: string;
}

// 认证服务类
export class AuthService {
  // 登录方法
  static async login(loginData: LoginRequest): Promise<UserInfo> {
    try {
      const response = await api.post('/v1/auth/login', loginData) as LoginResponse;
      
      if (response.code === 200) {
        // 登录成功，返回用户信息
        return {
          username: response.data.username,
          role: response.data.role
        };
      } else {
        // 登录失败，抛出包含后端错误信息的错误
        const error = new Error(response.message || '登录失败') as Error & { response?: { data: LoginResponse } };
        // 添加响应数据到错误对象，方便前端处理
        error.response = { data: response };
        throw error;
      }
    } catch (error) {
      console.error('登录失败:', error);
      throw error;
    }
  }

  // 存储用户信息到localStorage
  static setUserInfo(userInfo: UserInfo): void {
    localStorage.setItem('userInfo', JSON.stringify(userInfo));
    localStorage.setItem('username', userInfo.username);
    localStorage.setItem('role', userInfo.role);
    
    // 触发自定义事件，通知其他组件用户信息已更新
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('userInfoUpdated'));
    }
  }

  // 从localStorage获取用户信息
  static getUserInfo(): UserInfo | null {
    try {
      const userInfoStr = localStorage.getItem('userInfo');
      if (userInfoStr) {
        return JSON.parse(userInfoStr);
      }
      
      // 兼容旧版本存储方式
      const username = localStorage.getItem('username');
      const role = localStorage.getItem('role');
      if (username && role) {
        return { username, role };
      }
      
      return null;
    } catch (error) {
      console.error('获取用户信息失败:', error);
      return null;
    }
  }

  // 清除用户信息
  static clearUserInfo(): void {
    localStorage.removeItem('userInfo');
    localStorage.removeItem('username');
    localStorage.removeItem('role');
    
    // 触发自定义事件，通知其他组件用户信息已清除
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('userInfoUpdated'));
    }
  }

  // 检查是否已登录
  static isLoggedIn(): boolean {
    return this.getUserInfo() !== null;
  }

  // 获取用户名
  static getUsername(): string | null {
    const userInfo = this.getUserInfo();
    return userInfo ? userInfo.username : null;
  }

  // 获取用户角色
  static getRole(): string | null {
    const userInfo = this.getUserInfo();
    return userInfo ? userInfo.role : null;
  }

  // 修改密码方法
  static async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    try {
      const currentUser = this.getUserInfo();
      if (!currentUser) {
        throw new Error('用户未登录');
      }

      const response = await api.post('/v1/auth/change-password', {
        old_password: oldPassword,
        new_password: newPassword
      }, {
        headers: {
          'X-Username': encodeURIComponent(currentUser.username)
        }
      }) as ChangePasswordResponse;
      
      if (response.code === 200) {
        // 修改密码成功
        return;
      } else {
        // 修改密码失败，抛出包含后端错误信息的错误
        const error = new Error(response.message || '修改密码失败') as Error & { response?: { data: ChangePasswordResponse } };
        error.response = { data: response };
        throw error;
      }
    } catch (error) {
      console.error('修改密码失败:', error);
      throw error;
    }
  }
}

export default AuthService;