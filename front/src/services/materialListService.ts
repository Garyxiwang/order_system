// 物料清单数据类型定义
export interface MaterialListItem {
  id: number;
  order_number: string; // 关联的设计订单编号
  status: 'not_started' | 'in_progress' | 'revision' | 'submitted'; // 未开始、进行中、修订中、已提报
  quotation_type?: 'dealer' | 'owner'; // 报价类型：经销商、业主
  created_by: string; // 创建人（设计师）
  created_at: string;
  updated_at: string;
  submitted_at?: string; // 提报时间
}

// 报价项目数据类型
export interface QuotationProject {
  id: number;
  material_list_id: number;
  name: string; // 项目名称，如：主卧、厨房
  sort_order: number; // 排序
}

// 报价类目数据类型
export interface QuotationCategory {
  id: number;
  project_id: number;
  level1_category_id: number; // 一级类目ID
  level1_category_name: string; // 一级类目名称
  level2_category_id: number; // 二级类目ID
  level2_category_name: string; // 二级类目名称
  height?: number; // 高(mm)
  width?: number; // 宽(mm)
  quantity: number; // 数量
  unit: string; // 单位：平方、米、个、套、项
  material_id?: number; // 基材ID
  material_name?: string; // 基材名称
  color_id?: number; // 颜色ID
  color_name?: string; // 颜色名称
  remark?: string; // 备注
  // 报价相关字段（由录入员填写）
  unit_price?: number; // 单价（根据报价类型和基材自动计算）
  total_price?: number; // 合计（自动计算：数量 * 单价）
}

// 创建物料清单请求数据
export interface CreateMaterialListData {
  order_number: string;
  projects: Omit<QuotationProject, 'id' | 'material_list_id'>[];
  categories: Array<Omit<QuotationCategory, 'id' | 'project_id'> & {
    name?: string; // 项目名称，用于匹配项目
    sort_order?: number; // 项目索引，用于匹配项目
  }>;
}

// 更新物料清单请求数据
export interface UpdateMaterialListData {
  status?: 'not_started' | 'in_progress' | 'revision' | 'submitted';
  quotation_type?: 'dealer' | 'owner';
  projects?: Omit<QuotationProject, 'id' | 'material_list_id'>[];
  categories?: Array<Omit<QuotationCategory, 'id' | 'project_id'> & {
    name?: string; // 项目名称，用于匹配项目
    sort_order?: number; // 项目索引，用于匹配项目
  }>;
}

// ========== Mock 数据存储 ==========
let mockMaterialLists: MaterialListItem[] = [];
let mockProjects: QuotationProject[] = [];
let mockCategories: QuotationCategory[] = [];
// 快照存储：key为material_list_id，value包含提报时快照和修订前快照
let mockSnapshots: Map<number, {
  submitted_snapshot?: {
    projects: QuotationProject[];
    categories: QuotationCategory[];
    snapshot_at: string;
  };
  revision_snapshot?: {
    projects: QuotationProject[];
    categories: QuotationCategory[];
    snapshot_at: string;
  };
}> = new Map();

let nextMaterialListId = 1;
let nextProjectId = 1;
let nextCategoryId = 1;

// 模拟异步延迟
const delay = (ms: number = 300) => new Promise(resolve => setTimeout(resolve, ms));

// 物料清单服务类（使用 Mock 数据）
export class MaterialListService {
  // 获取物料清单列表（根据订单编号）
  static async getMaterialListByOrder(orderNumber: string): Promise<MaterialListItem | null> {
    await delay();
    return mockMaterialLists.find(item => item.order_number === orderNumber) || null;
  }

  // 获取物料清单详情（包含项目和类目）
  static async getMaterialListDetail(id: number): Promise<{
    materialList: MaterialListItem;
    projects: QuotationProject[];
    categories: QuotationCategory[];
  }> {
    await delay();
    const materialList = mockMaterialLists.find(item => item.id === id);
    if (!materialList) {
      throw new Error('物料清单不存在');
    }
    const projects = mockProjects.filter(p => {
      const list = mockMaterialLists.find(ml => ml.id === id);
      return list && p.material_list_id === id;
    });
    const categories = mockCategories.filter(c => {
      return projects.some(p => p.id === c.project_id);
    });
    return { materialList, projects, categories };
  }

  // 创建物料清单
  static async createMaterialList(data: CreateMaterialListData): Promise<MaterialListItem> {
    await delay();
    const newMaterialList: MaterialListItem = {
      id: nextMaterialListId++,
      order_number: data.order_number,
      status: 'not_started',
      created_by: 'current_user', // 实际应该从认证信息获取
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    mockMaterialLists.push(newMaterialList);

    // 创建项目
    const projects = data.projects.map((project, index) => ({
      id: nextProjectId++,
      material_list_id: newMaterialList.id,
      name: project.name,
      sort_order: project.sort_order || index,
    }));
    mockProjects.push(...projects);

    // 创建类目
    const categories = data.categories.map(category => {
      const project = projects.find(p => p.name === category.name || p.sort_order === category.sort_order);
      if (!project) {
        throw new Error('项目不存在');
      }
      return {
        id: nextCategoryId++,
        project_id: project.id,
        level1_category_id: category.level1_category_id,
        level1_category_name: category.level1_category_name,
        level2_category_id: category.level2_category_id,
        level2_category_name: category.level2_category_name,
        height: category.height,
        width: category.width,
        quantity: category.quantity,
        unit: category.unit,
        material_id: category.material_id,
        material_name: category.material_name,
        color_id: category.color_id,
        color_name: category.color_name,
        remark: category.remark,
      };
    });
    mockCategories.push(...categories);

    return newMaterialList;
  }

  // 更新物料清单
  static async updateMaterialList(id: number, data: UpdateMaterialListData): Promise<MaterialListItem> {
    await delay();
    const index = mockMaterialLists.findIndex(item => item.id === id);
    if (index === -1) {
      throw new Error('物料清单不存在');
    }

    const updated = {
      ...mockMaterialLists[index],
      ...data,
      updated_at: new Date().toISOString(),
    };

    if (data.status === 'submitted' && !updated.submitted_at) {
      updated.submitted_at = new Date().toISOString();
    }

    mockMaterialLists[index] = updated;

    // 更新项目和类目
    if (data.projects) {
      // 删除旧项目
      mockProjects = mockProjects.filter(p => p.material_list_id !== id);
      // 添加新项目
      const newProjects = data.projects.map((project, idx) => ({
        id: nextProjectId++,
        material_list_id: id,
        name: project.name,
        sort_order: project.sort_order || idx,
      }));
      mockProjects.push(...newProjects);
    }

    if (data.categories) {
      // 获取当前项目的类目
      const currentProjects = mockProjects.filter(p => p.material_list_id === id);
      const oldProjectIds = currentProjects.map(p => p.id);
      const existingCategories = mockCategories.filter(c => oldProjectIds.includes(c.project_id));
      
      // 更新现有类目或创建新类目
      data.categories.forEach(category => {
        const project = currentProjects.find(p => p.name === category.name || p.sort_order === category.sort_order);
        if (!project) {
          throw new Error('项目不存在');
        }
        
        // 查找是否已存在相同的类目（通过项目ID、一级类目ID、二级类目ID匹配）
        const existingCategory = existingCategories.find(
          c => c.project_id === project.id &&
               c.level1_category_id === category.level1_category_id &&
               c.level2_category_id === category.level2_category_id
        );
        
        if (existingCategory) {
          // 更新现有类目
          const index = mockCategories.findIndex(c => c.id === existingCategory.id);
          if (index !== -1) {
            mockCategories[index] = {
              ...mockCategories[index],
              level1_category_name: category.level1_category_name,
              level2_category_name: category.level2_category_name,
              height: category.height,
              width: category.width,
              quantity: category.quantity,
              unit: category.unit,
              material_id: category.material_id,
              material_name: category.material_name,
              color_id: category.color_id,
              color_name: category.color_name,
              remark: category.remark,
              unit_price: category.unit_price,
              total_price: category.total_price,
            };
          }
        } else {
          // 创建新类目
          mockCategories.push({
            id: nextCategoryId++,
            project_id: project.id,
            level1_category_id: category.level1_category_id,
            level1_category_name: category.level1_category_name,
            level2_category_id: category.level2_category_id,
            level2_category_name: category.level2_category_name,
            height: category.height,
            width: category.width,
            quantity: category.quantity,
            unit: category.unit,
            material_id: category.material_id,
            material_name: category.material_name,
            color_id: category.color_id,
            color_name: category.color_name,
            remark: category.remark,
            unit_price: category.unit_price,
            total_price: category.total_price,
          });
        }
      });
      
      // 删除不在更新列表中的类目（如果更新列表包含所有类目，则不会删除）
      // 这里我们保留所有现有类目，只更新匹配的类目
    }

    return updated;
  }

  // 计算报价（根据报价类型和基材价格）
  static async calculateQuotation(
    materialListId: number,
    quotationType: 'dealer' | 'owner'
  ): Promise<QuotationCategory[]> {
    await delay();
    
    // 获取物料清单详情
    const { categories } = await this.getMaterialListDetail(materialListId);
    
    // 从基材服务获取价格
    const { QuotationConfigService } = await import('./quotationConfigService');
    const materials = await QuotationConfigService.getMaterialList();
    
    // 构建基材价格映射
    const materialPrices: Record<number, { dealer: number; owner: number }> = {};
    materials.forEach(material => {
      if (material.dealer_price !== undefined && material.owner_price !== undefined) {
        materialPrices[material.id] = {
          dealer: material.dealer_price,
          owner: material.owner_price,
        };
      }
    });

    // 计算每个类目的单价和合计
    const calculatedCategories = categories.map(category => {
      let unitPrice = 0;
      if (category.material_id) {
        const price = materialPrices[category.material_id];
        if (price) {
          unitPrice = quotationType === 'dealer' ? price.dealer : price.owner;
        }
      }
      const totalPrice = category.quantity * unitPrice;

      return {
        ...category,
        unit_price: unitPrice,
        total_price: totalPrice,
      };
    });

    return calculatedCategories;
  }

  // 提交物料清单（设计师操作）
  static async submitMaterialList(id: number): Promise<MaterialListItem> {
    await delay();
    // 保存提报时的快照，供后续对比使用
    const detail = await this.getMaterialListDetail(id);
    const snapshot = mockSnapshots.get(id) || {};
    snapshot.submitted_snapshot = {
      projects: JSON.parse(JSON.stringify(detail.projects)),
      categories: JSON.parse(JSON.stringify(detail.categories)),
      snapshot_at: new Date().toISOString(),
    };
    mockSnapshots.set(id, snapshot);
    return this.updateMaterialList(id, { status: 'submitted' });
  }

  // 保存物料清单（设计师操作，状态变为进行中）
  static async saveMaterialList(id: number, data: UpdateMaterialListData): Promise<MaterialListItem> {
    await delay();
    return this.updateMaterialList(id, { ...data, status: 'in_progress' });
  }

  // 修订物料清单（录入员操作，状态变为修订中）
  static async reviseMaterialList(id: number): Promise<MaterialListItem> {
    await delay();
    // 保存修订前的快照（当前提报的数据），供设计师对比使用
    const detail = await this.getMaterialListDetail(id);
    const snapshot = mockSnapshots.get(id) || {};
    snapshot.revision_snapshot = {
      projects: JSON.parse(JSON.stringify(detail.projects)),
      categories: JSON.parse(JSON.stringify(detail.categories)),
      snapshot_at: new Date().toISOString(),
    };
    mockSnapshots.set(id, snapshot);
    return this.updateMaterialList(id, { status: 'revision' });
  }

  // 获取提报时快照（用于设计师对比）
  static async getSubmittedSnapshot(id: number): Promise<{
    projects: QuotationProject[];
    categories: QuotationCategory[];
    snapshot_at: string;
  } | null> {
    await delay();
    const snapshot = mockSnapshots.get(id);
    return snapshot?.submitted_snapshot || null;
  }

  // 获取修订前快照（用于录入员对比）
  static async getRevisionSnapshot(id: number): Promise<{
    projects: QuotationProject[];
    categories: QuotationCategory[];
    snapshot_at: string;
  } | null> {
    await delay();
    const snapshot = mockSnapshots.get(id);
    return snapshot?.revision_snapshot || null;
  }

  // 完成报价（录入员操作）
  static async completeQuotation(id: number): Promise<MaterialListItem> {
    await delay();
    const materialList = mockMaterialLists.find(item => item.id === id);
    if (!materialList) {
      throw new Error('物料清单不存在');
    }
    // 报价完成，状态可以保持为已提报或新增一个完成状态
    // 这里暂时保持已提报状态
    return materialList;
  }
}

export default MaterialListService;

