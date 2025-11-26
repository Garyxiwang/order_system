import AuthService from '@/services/authService';

// 用户角色枚举
export enum UserRole {
  SUPER_ADMIN = 'superAdmin',
  ADMIN = 'admin',
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
  DESIGN = 'design',
  SPLIT = 'split',
  PRODUCTION = 'production',
  CONFIG = 'config',
  QUOTATION = 'quotation',
  AFTER_SALES = 'after-sales'
}

// 模块权限配置
export const MODULE_PERMISSIONS: Record<PageModule, UserRole[]> = {
  [PageModule.DESIGN]: [
    UserRole.CLERK,
    UserRole.DESIGNER,
    UserRole.MANAGER,
    UserRole.SALESPERSON,
    UserRole.FINANCE,
    UserRole.ADMIN,
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
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  ],
  [PageModule.PRODUCTION]: [
    UserRole.CLERK,
    UserRole.SALESPERSON,
    UserRole.FINANCE,
    UserRole.PROCUREMENT,
    UserRole.WORKSHOP,
    UserRole.SHIPPER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  ],
  [PageModule.CONFIG]: [
    UserRole.SUPER_ADMIN
  ],
  [PageModule.QUOTATION]: [
    UserRole.SUPER_ADMIN
  ],
  [PageModule.AFTER_SALES]: [
    UserRole.CLERK,
    UserRole.DESIGNER,
    UserRole.SPLITTING,
    UserRole.MANAGER,
    UserRole.SALESPERSON,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  ]
};

// 设计管理操作权限枚举
export enum DesignAction {
  EDIT_ORDER = 'editOrder',        // 编辑订单
  UPDATE_PROGRESS = 'updateProgress', // 更新进度
  PLACE_ORDER = 'placeOrder',      // 下单
  CANCEL_ORDER = 'cancelOrder',    // 撤销
  DELETE_ORDER = 'deleteOrder',    // 删除订单
  EXPORT = 'export',               // 导出
  VIEW_ORDER_AMOUNT = 'viewOrderAmount' // 查看订单金额
}

// 拆单管理操作权限枚举
export enum SplitAction {
  EDIT_ORDER = 'editOrder',        // 编辑订单
  UPDATE_PROGRESS = 'updateProgress', // 更新进度
  ORDER_STATUS = 'orderStatus',    // 订单状态
  QUOTE_STATUS = 'quoteStatus',    // 报价状态
  PLACE_ORDER = 'placeOrder',      // 下单
  EXPORT = 'export',               // 导出
  VIEW_ORDER_AMOUNT = 'viewOrderAmount' // 查看订单金额
}

// 生产管理操作权限枚举
export enum ProductionAction {
  EDIT_ORDER = 'editOrder',        // 编辑订单
  PURCHASE_STATUS = 'purchaseStatus', // 采购状态
  PRODUCTION_PROGRESS = 'productionProgress', // 生产进度
  ORDER_STATUS = 'orderStatus',    // 订单状态
  EXPORT = 'export'                // 导出
}

// 设计进度操作权限枚举
export enum DesignProgressAction {
  ADD_PROGRESS = 'addProgress',    // 添加进度
  EDIT_PROGRESS = 'editProgress',   // 编辑进度（实际日期和备注）
  DELETE_PROGRESS = 'deleteProgress' // 删除进度
}

// 拆单进度操作权限枚举
export enum SplitProgressAction {
  EDIT_INTERNAL_ITEMS = 'editInternalItems',  // 编辑厂内生产项
  EDIT_EXTERNAL_ITEMS = 'editExternalItems'   // 编辑外购项
}

// 设计管理操作权限配置
export const DESIGN_ACTION_PERMISSIONS: Record<DesignAction, UserRole[]> = {
  [DesignAction.EDIT_ORDER]: [
    UserRole.CLERK,      // 录入员
    UserRole.ADMIN,      // 管理员
    UserRole.SUPER_ADMIN // 超管
  ],
  [DesignAction.UPDATE_PROGRESS]: [
    UserRole.CLERK,      // 录入员
    UserRole.DESIGNER,   // 设计师
    UserRole.MANAGER,    // 主管
    UserRole.ADMIN,      // 管理员
    UserRole.SUPER_ADMIN // 超管
  ],
  [DesignAction.PLACE_ORDER]: [
    UserRole.CLERK,      // 录入员
    UserRole.DESIGNER,   // 设计师
    UserRole.ADMIN,      // 管理员
    UserRole.SUPER_ADMIN // 超管
  ],
  [DesignAction.CANCEL_ORDER]: [
    UserRole.CLERK,      // 录入员
    UserRole.DESIGNER,   // 设计师
    UserRole.ADMIN,      // 管理员
    UserRole.SUPER_ADMIN // 超管
  ],
  [DesignAction.DELETE_ORDER]: [
    UserRole.ADMIN,      // 管理员
    UserRole.SUPER_ADMIN // 超管（仅允许超管删除以降低风险）
  ],
  [DesignAction.EXPORT]: [
    UserRole.FINANCE,    // 财务
    UserRole.ADMIN,      // 管理员
    UserRole.SUPER_ADMIN // 超管
  ],
  [DesignAction.VIEW_ORDER_AMOUNT]: [
    UserRole.CLERK,      // 录入员
    UserRole.FINANCE,    // 财务
    UserRole.SALESPERSON, // 销售
    UserRole.ADMIN,      // 管理员
    UserRole.SUPER_ADMIN // 超管
  ]
};

// 拆单管理操作权限配置
export const SPLIT_ACTION_PERMISSIONS: Record<SplitAction, UserRole[]> = {
  [SplitAction.EDIT_ORDER]: [
    UserRole.CLERK,      // 录入员
    UserRole.MANAGER,    // 主管
    UserRole.ADMIN,      // 管理员
    UserRole.SUPER_ADMIN // 超管
  ],
  [SplitAction.UPDATE_PROGRESS]: [
    UserRole.CLERK,      // 录入员
    UserRole.SPLITTING,  // 拆单员
    UserRole.MANAGER,    // 主管
    UserRole.PROCUREMENT, // 采购
    UserRole.ADMIN,      // 管理员
    UserRole.SUPER_ADMIN // 超管
  ],
  [SplitAction.ORDER_STATUS]: [
    UserRole.CLERK,      // 录入员
    UserRole.MANAGER,    // 主管
    UserRole.AUDITOR,    // 审核员
    UserRole.ADMIN,      // 管理员
    UserRole.SUPER_ADMIN // 超管
  ],
  [SplitAction.QUOTE_STATUS]: [
    UserRole.CLERK,      // 录入员
    UserRole.MANAGER,    // 主管
    UserRole.ADMIN,      // 管理员
    UserRole.SUPER_ADMIN // 超管
  ],
  [SplitAction.PLACE_ORDER]: [
    UserRole.CLERK,      // 录入员
    UserRole.MANAGER,    // 主管
    UserRole.ADMIN,      // 管理员
    UserRole.SUPER_ADMIN // 超管
  ],
  [SplitAction.EXPORT]: [
    UserRole.FINANCE,    // 财务
    UserRole.ADMIN,      // 管理员
    UserRole.SUPER_ADMIN // 超管
  ],
  [SplitAction.VIEW_ORDER_AMOUNT]: [
    UserRole.CLERK,      // 录入员
    UserRole.SALESPERSON, // 销售
    UserRole.FINANCE,    // 财务
    UserRole.ADMIN,      // 管理员
    UserRole.SUPER_ADMIN // 超管
  ]
};

// 生产管理操作权限配置
export const PRODUCTION_ACTION_PERMISSIONS: Record<ProductionAction, UserRole[]> = {
  [ProductionAction.EDIT_ORDER]: [
    UserRole.SHIPPER,    // 发货员
    UserRole.ADMIN,      // 管理员
    UserRole.SUPER_ADMIN // 超管
  ],
  [ProductionAction.PURCHASE_STATUS]: [
    UserRole.PROCUREMENT, // 采购
    UserRole.ADMIN,      // 管理员
    UserRole.SUPER_ADMIN // 超管
  ],
  [ProductionAction.PRODUCTION_PROGRESS]: [
    UserRole.WORKSHOP,   // 车间
    UserRole.ADMIN,      // 管理员
    UserRole.SUPER_ADMIN // 超管
  ],
  [ProductionAction.ORDER_STATUS]: [
    UserRole.SHIPPER,    // 发货员
    UserRole.ADMIN,      // 管理员
    UserRole.SUPER_ADMIN // 超管
  ],
  [ProductionAction.EXPORT]: [
    UserRole.FINANCE,    // 财务
    UserRole.ADMIN,      // 管理员
    UserRole.SUPER_ADMIN // 超管
  ]
};

// 设计进度操作权限配置
export const DESIGN_PROGRESS_ACTION_PERMISSIONS: Record<DesignProgressAction, UserRole[]> = {
  [DesignProgressAction.ADD_PROGRESS]: [
    UserRole.CLERK,      // 录入员
    UserRole.MANAGER,    // 主管
    UserRole.ADMIN,      // 管理员
    UserRole.SUPER_ADMIN // 超管
  ],
  [DesignProgressAction.EDIT_PROGRESS]: [
    UserRole.CLERK,      // 录入员
    UserRole.DESIGNER,   // 设计师
    UserRole.MANAGER,    // 主管
    UserRole.ADMIN,      // 管理员
    UserRole.SUPER_ADMIN // 超管
  ],
  [DesignProgressAction.DELETE_PROGRESS]: [
    UserRole.CLERK,      // 录入员
    UserRole.ADMIN,      // 管理员
    UserRole.SUPER_ADMIN // 超管
  ]
};

// 拆单进度操作权限配置
export const SPLIT_PROGRESS_ACTION_PERMISSIONS: Record<SplitProgressAction, UserRole[]> = {
  [SplitProgressAction.EDIT_INTERNAL_ITEMS]: [
    UserRole.CLERK,      // 录入员
    UserRole.SPLITTING,  // 拆单员
    UserRole.MANAGER,    // 主管
    UserRole.ADMIN,      // 管理员
    UserRole.SUPER_ADMIN // 超管
  ],
  [SplitProgressAction.EDIT_EXTERNAL_ITEMS]: [
    UserRole.CLERK,      // 录入员
    UserRole.PROCUREMENT, // 采购员
    UserRole.MANAGER,    // 主管
    UserRole.ADMIN,      // 管理员
    UserRole.SUPER_ADMIN // 超管
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
   * 检查用户是否有设计管理特定操作权限
   * @param action 设计管理操作
   * @param userRole 用户角色（可选，不传则使用当前登录用户角色）
   */
  static hasDesignActionPermission(action: DesignAction, userRole?: UserRole): boolean {
    const role = userRole || this.getCurrentUserRole();
    if (!role) {
      return false;
    }

    const allowedRoles = DESIGN_ACTION_PERMISSIONS[action];
    return allowedRoles.includes(role);
  }

  /**
   * 检查用户是否可以编辑订单
   */
  static canEditOrder(userRole?: UserRole): boolean {
    return this.hasDesignActionPermission(DesignAction.EDIT_ORDER, userRole);
  }

  /**
   * 检查用户是否可以更新进度
   */
  static canUpdateProgress(userRole?: UserRole): boolean {
    return this.hasDesignActionPermission(DesignAction.UPDATE_PROGRESS, userRole);
  }

  /**
   * 检查用户是否可以下单
   */
  static canPlaceOrder(userRole?: UserRole): boolean {
    return this.hasDesignActionPermission(DesignAction.PLACE_ORDER, userRole);
  }

  /**
   * 检查用户是否可以撤销订单
   */
  static canCancelOrder(userRole?: UserRole): boolean {
    return this.hasDesignActionPermission(DesignAction.CANCEL_ORDER, userRole);
  }

  /**
   * 检查用户是否可以删除订单
   */
  static canDeleteOrder(userRole?: UserRole): boolean {
    return this.hasDesignActionPermission(DesignAction.DELETE_ORDER, userRole);
  }

  /**
   * 检查用户是否可以导出
   */
  static canExport(userRole?: UserRole): boolean {
    return this.hasDesignActionPermission(DesignAction.EXPORT, userRole);
  }

  /**
   * 检查用户是否可以查看订单金额
   */
  static canViewOrderAmount(userRole?: UserRole): boolean {
    return this.hasDesignActionPermission(DesignAction.VIEW_ORDER_AMOUNT, userRole);
  }

  /**
   * 检查用户是否有拆单管理权限
   */
  static hasSplitPermission(userRole?: UserRole): boolean {
    return this.hasModulePermission(PageModule.SPLIT, userRole);
  }

  /**
   * 检查用户是否有拆单管理特定操作权限
   * @param action 拆单管理操作
   * @param userRole 用户角色（可选，不传则使用当前登录用户角色）
   */
  static hasSplitActionPermission(action: SplitAction, userRole?: UserRole): boolean {
    const role = userRole || this.getCurrentUserRole();
    if (!role) {
      return false;
    }

    const allowedRoles = SPLIT_ACTION_PERMISSIONS[action];
    return allowedRoles.includes(role);
  }

  /**
   * 检查用户是否可以编辑拆单订单
   */
  static canEditSplitOrder(userRole?: UserRole): boolean {
    return this.hasSplitActionPermission(SplitAction.EDIT_ORDER, userRole);
  }

  /**
   * 检查用户是否可以更新拆单进度
   */
  static canUpdateSplitProgress(userRole?: UserRole): boolean {
    return this.hasSplitActionPermission(SplitAction.UPDATE_PROGRESS, userRole);
  }

  /**
   * 检查用户是否可以修改订单状态
   */
  static canUpdateOrderStatus(userRole?: UserRole): boolean {
    return this.hasSplitActionPermission(SplitAction.ORDER_STATUS, userRole);
  }

  /**
   * 检查用户是否可以修改报价状态
   */
  static canUpdateQuoteStatus(userRole?: UserRole): boolean {
    return this.hasSplitActionPermission(SplitAction.QUOTE_STATUS, userRole);
  }

  /**
   * 检查用户是否可以拆单下单
   */
  static canPlaceSplitOrder(userRole?: UserRole): boolean {
    return this.hasSplitActionPermission(SplitAction.PLACE_ORDER, userRole);
  }

  /**
   * 检查用户是否可以导出拆单数据
   */
  static canExportSplit(userRole?: UserRole): boolean {
    return this.hasSplitActionPermission(SplitAction.EXPORT, userRole);
  }

  /**
   * 检查用户是否可以查看拆单页面订单金额
   */
  static canViewSplitOrderAmount(userRole?: UserRole): boolean {
    return this.hasSplitActionPermission(SplitAction.VIEW_ORDER_AMOUNT, userRole);
  }

  /**
   * 检查用户是否有生产管理权限
   */
  static hasProductionPermission(userRole?: UserRole): boolean {
    return this.hasModulePermission(PageModule.PRODUCTION, userRole);
  }

  /**
   * 检查用户是否有生产管理操作权限
   */
  static hasProductionActionPermission(action: ProductionAction, userRole?: UserRole): boolean {
    const role = userRole || this.getCurrentUserRole();
    if (!role) {
      return false;
    }
    return PRODUCTION_ACTION_PERMISSIONS[action]?.includes(role) || false;
  }

  /**
   * 检查用户是否可以编辑生产订单
   */
  static canEditProductionOrder(userRole?: UserRole): boolean {
    return this.hasProductionActionPermission(ProductionAction.EDIT_ORDER, userRole);
  }

  /**
   * 检查用户是否可以管理采购状态
   */
  static canManagePurchaseStatus(userRole?: UserRole): boolean {
    return this.hasProductionActionPermission(ProductionAction.PURCHASE_STATUS, userRole);
  }

  /**
   * 检查用户是否可以管理生产进度
   */
  static canManageProductionProgress(userRole?: UserRole): boolean {
    return this.hasProductionActionPermission(ProductionAction.PRODUCTION_PROGRESS, userRole);
  }

  /**
   * 检查用户是否可以管理生产订单状态
   */
  static canManageProductionOrderStatus(userRole?: UserRole): boolean {
    return this.hasProductionActionPermission(ProductionAction.ORDER_STATUS, userRole);
  }

  /**
   * 检查用户是否可以导出生产数据
   */
  static canExportProduction(userRole?: UserRole): boolean {
    return this.hasProductionActionPermission(ProductionAction.EXPORT, userRole);
  }

  /**
   * 检查用户是否有设计进度操作权限
   */
  static hasDesignProgressActionPermission(action: DesignProgressAction, userRole?: UserRole): boolean {
    const role = userRole || this.getCurrentUserRole();
    if (!role) {
      return false;
    }
    return DESIGN_PROGRESS_ACTION_PERMISSIONS[action]?.includes(role) || false;
  }

  /**
   * 检查用户是否可以添加设计进度
   */
  static canAddDesignProgress(userRole?: UserRole): boolean {
    return this.hasDesignProgressActionPermission(DesignProgressAction.ADD_PROGRESS, userRole);
  }

  /**
   * 检查用户是否可以编辑设计进度（实际日期和备注）
   */
  static canEditDesignProgress(userRole?: UserRole): boolean {
    return this.hasDesignProgressActionPermission(DesignProgressAction.EDIT_PROGRESS, userRole);
  }

  /**
   * 检查用户是否可以删除设计进度
   */
  static canDeleteDesignProgress(userRole?: UserRole): boolean {
    return this.hasDesignProgressActionPermission(DesignProgressAction.DELETE_PROGRESS, userRole);
  }

  /**
   * 检查用户是否有拆单进度操作权限
   */
  static hasSplitProgressActionPermission(action: SplitProgressAction, userRole?: UserRole): boolean {
    const role = userRole || this.getCurrentUserRole();
    if (!role) {
      return false;
    }
    return SPLIT_PROGRESS_ACTION_PERMISSIONS[action]?.includes(role) || false;
  }

  /**
   * 检查用户是否可以编辑厂内生产项
   */
  static canEditInternalItems(userRole?: UserRole): boolean {
    return this.hasSplitProgressActionPermission(SplitProgressAction.EDIT_INTERNAL_ITEMS, userRole);
  }

  /**
   * 检查用户是否可以编辑外购项
   */
  static canEditExternalItems(userRole?: UserRole): boolean {
    return this.hasSplitProgressActionPermission(SplitProgressAction.EDIT_EXTERNAL_ITEMS, userRole);
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
      [UserRole.ADMIN]: '管理员',
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