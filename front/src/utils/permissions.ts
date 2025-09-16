import AuthService from '@/services/authService';

// 用户角色枚举
export enum UserRole {
  SUPER_ADMIN = 'superAdmin',
  MANAGER = 'manager',
  AUDITOR = 'auditor',
  DESIGNER = 'designer',
  SPLITTING = 'splitting',
  CLERK = 'clerk',
  PROCUREMENT = 'procurement',
  SALESPERSON = 'salesperson',
  FINANCE = 'finance',
  WORKSHOP = 'workshop',
  SHIPPER = 'shipper'
}

// 页面模块枚举
export enum PageModule {
  DASHBOARD = 'dashboard',
  DESIGN = 'design',
  SPLIT = 'split',
  PRODUCTION = 'production',
  CONFIG = 'config'
}

// 模块权限配置
export const MODULE_PERMISSIONS: Record<PageModule, UserRole[]> = {
  [PageModule.DASHBOARD]: [
    UserRole.CLERK,
    UserRole.DESIGNER,
    UserRole.SPLITTING,
    UserRole.MANAGER,
    UserRole.AUDITOR,
    UserRole.PROCUREMENT,
    UserRole.SALESPERSON,
    UserRole.FINANCE,
    UserRole.WORKSHOP,
    UserRole.SHIPPER,
    UserRole.SUPER_ADMIN
  ],
  [PageModule.DESIGN]: [
    UserRole.CLERK,
    UserRole.DESIGNER,
    UserRole.MANAGER,
    UserRole.SALESPERSON,
    UserRole.FINANCE,
    UserRole.SUPER_ADMIN
  ],
  [PageModule.SPLIT]: [
    UserRole.CLERK,
    UserRole.SPLITTING,
    UserRole.MANAGER,
    UserRole.SALESPERSON,
    UserRole.FINANCE,
    UserRole.AUDITOR,
    UserRole.PROCUREMENT,
    UserRole.WORKSHOP,
    UserRole.SUPER_ADMIN
  ],
  [PageModule.PRODUCTION]: [
    UserRole.CLERK,
    UserRole.SALESPERSON,
    UserRole.FINANCE,
    UserRole.PROCUREMENT,
    UserRole.WORKSHOP,
    UserRole.SHIPPER,
    UserRole.SUPER_ADMIN
  ],
  [PageModule.CONFIG]: [
    UserRole.SUPER_ADMIN
  ]
};

// 权限检查类
export class PermissionService {
  /**
   * 获取当前用户角色
   */
  static getCurrentUserRole(): UserRole | null {
    const role = AuthService.getRole();
    return role as UserRole || null;
  }

  /**
   * 检查用户是否有访问指定模块的权限
   * @param module 页面模块
   * @param userRole 用户角色（可选，不传则使用当前登录用户角色）
   */
  static hasModulePermission(module: PageModule, userRole?: UserRole): boolean {
    const role = userRole || this.getCurrentUserRole();
    if (!role) {
      return false;
    }

    const allowedRoles = MODULE_PERMISSIONS[module];
    return allowedRoles.includes(role);
  }

  /**
   * 检查用户是否有设计管理权限
   */
  static hasDesignPermission(userRole?: UserRole): boolean {
    return this.hasModulePermission(PageModule.DESIGN, userRole);
  }

  /**
   * 检查用户是否有拆单管理权限
   */
  static hasSplitPermission(userRole?: UserRole): boolean {
    return this.hasModulePermission(PageModule.SPLIT, userRole);
  }

  /**
   * 检查用户是否有生产管理权限
   */
  static hasProductionPermission(userRole?: UserRole): boolean {
    return this.hasModulePermission(PageModule.PRODUCTION, userRole);
  }

  /**
   * 检查用户是否有系统配置权限
   */
  static hasConfigPermission(userRole?: UserRole): boolean {
    return this.hasModulePermission(PageModule.CONFIG, userRole);
  }

  /**
   * 获取用户可访问的所有模块
   * @param userRole 用户角色（可选，不传则使用当前登录用户角色）
   */
  static getAccessibleModules(userRole?: UserRole): PageModule[] {
    const role = userRole || this.getCurrentUserRole();
    if (!role) {
      return [];
    }

    const accessibleModules: PageModule[] = [];
    
    Object.entries(MODULE_PERMISSIONS).forEach(([module, allowedRoles]) => {
      if (allowedRoles.includes(role)) {
        accessibleModules.push(module as PageModule);
      }
    });

    return accessibleModules;
  }

  /**
   * 检查用户是否为超级管理员
   */
  static isSuperAdmin(userRole?: UserRole): boolean {
    const role = userRole || this.getCurrentUserRole();
    return role === UserRole.SUPER_ADMIN;
  }

  /**
   * 获取角色的中文显示名称
   */
  static getRoleDisplayName(role: UserRole): string {
    const roleNames: Record<UserRole, string> = {
      [UserRole.SUPER_ADMIN]: '超级管理员',
      [UserRole.MANAGER]: '主管',
      [UserRole.AUDITOR]: '审核员',
      [UserRole.DESIGNER]: '设计师',
      [UserRole.SPLITTING]: '拆单员',
      [UserRole.CLERK]: '录入员',
      [UserRole.PROCUREMENT]: '采购员',
      [UserRole.SALESPERSON]: '销售员',
      [UserRole.FINANCE]: '财务',
      [UserRole.WORKSHOP]: '车间',
      [UserRole.SHIPPER]: '发货员'
    };
    
    return roleNames[role] || role;
  }
}

export default PermissionService;