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
        throw new Error(response.message || '登录失败');
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
}

export default AuthService;