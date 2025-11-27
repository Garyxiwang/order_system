// 报价类目数据类型定义
export interface QuotationCategoryLevel1 {
  id: number;
  name: string;
  remark?: string;
  material_ids?: number[]; // 关联的基材ID列表
  created_at?: string;
  updated_at?: string;
}

export interface QuotationCategoryLevel2 {
  id: number;
  name: string;
  parent_id: number;
  pricing_unit?: string; // 计价单位：平方、米、个、套、项
  remark?: string;
  created_at?: string;
  updated_at?: string;
}

export interface QuotationCategoryTree {
  level1: QuotationCategoryLevel1;
  level2: QuotationCategoryLevel2[];
}

// 创建一级类目请求数据类型
export interface CreateCategoryLevel1Data {
  name: string;
  remark?: string;
  material_ids?: number[]; // 关联的基材ID列表
}

// 创建二级类目请求数据类型
export interface CreateCategoryLevel2Data {
  name: string;
  parent_id: number;
  pricing_unit?: string; // 计价单位：平方、米、个、套、项
  remark?: string;
}

// 基材数据类型定义
export interface MaterialData {
  id: number;
  name: string;
  remark?: string;
  dealer_price?: number; // 经销商价格
  owner_price?: number; // 业主价格
  color_ids?: number[]; // 关联的颜色ID列表
  created_at?: string;
  updated_at?: string;
}

// 创建基材请求数据类型
export interface CreateMaterialData {
  name: string;
  remark?: string;
  dealer_price?: number;
  owner_price?: number;
  color_ids?: number[]; // 关联的颜色ID列表
}

// 更新基材请求数据类型
export interface UpdateMaterialData {
  name?: string;
  remark?: string;
  dealer_price?: number;
  owner_price?: number;
}

// 颜色数据类型定义
export interface ColorData {
  id: number;
  name: string;
  remark?: string;
  created_at?: string;
  updated_at?: string;
}

// 创建颜色请求数据类型
export interface CreateColorData {
  name: string;
  remark?: string;
}

// 更新颜色请求数据类型
export interface UpdateColorData {
  name?: string;
  remark?: string;
}

// ========== 项目配置数据类型定义 ==========
export interface ProjectData {
  id: number;
  name: string;
  remark?: string;
  created_at?: string;
  updated_at?: string;
}

// 创建项目请求数据类型
export interface CreateProjectData {
  name: string;
  remark?: string;
}

// 更新项目请求数据类型
export interface UpdateProjectData {
  name?: string;
  remark?: string;
}

// ========== Mock 数据存储 ==========
// 使用内存存储模拟数据库，刷新页面会重置
const mockCategoryLevel1: QuotationCategoryLevel1[] = [
  { id: 1, name: '柜体', remark: '', created_at: new Date().toISOString() },
  { id: 2, name: '墙板', remark: '', created_at: new Date().toISOString() },
  { id: 3, name: '灯带', remark: '', created_at: new Date().toISOString() },
  { id: 4, name: '拉手', remark: '', created_at: new Date().toISOString() },
];

let mockCategoryLevel2: QuotationCategoryLevel2[] = [
  { id: 1, name: '高柜', parent_id: 1, pricing_unit: '平方', remark: '', created_at: new Date().toISOString() },
  { id: 2, name: '吊柜', parent_id: 1, pricing_unit: '平方', remark: '', created_at: new Date().toISOString() },
  { id: 3, name: '地柜', parent_id: 1, pricing_unit: '平方', remark: '', created_at: new Date().toISOString() },
  { id: 4, name: '背景墙', parent_id: 2, pricing_unit: '米', remark: '', created_at: new Date().toISOString() },
  { id: 5, name: '中性光', parent_id: 3, pricing_unit: '米', remark: '', created_at: new Date().toISOString() },
  { id: 6, name: '白光', parent_id: 3, pricing_unit: '米', remark: '', created_at: new Date().toISOString() },
  { id: 7, name: '暖光', parent_id: 3, pricing_unit: '米', remark: '', created_at: new Date().toISOString() },
  { id: 8, name: '烤漆牛角拉手', parent_id: 4, pricing_unit: '个', remark: '', created_at: new Date().toISOString() },
  { id: 9, name: '型材通体拉手', parent_id: 4, pricing_unit: '个', remark: '', created_at: new Date().toISOString() },
];

const mockMaterials: MaterialData[] = [
  { id: 1, name: '特级橡木', remark: '', dealer_price: 280, owner_price: 320, created_at: new Date().toISOString() },
  { id: 2, name: 'PET欧松板', remark: '', dealer_price: 300, owner_price: 350, created_at: new Date().toISOString() },
  { id: 3, name: '09颗粒', remark: '背板材质', dealer_price: 180, owner_price: 220, created_at: new Date().toISOString() },
  { id: 4, name: '石英石', remark: '台面材质', dealer_price: 450, owner_price: 550, created_at: new Date().toISOString() },
];

const mockColors: ColorData[] = [
  { id: 1, name: 'TB-9009', remark: '', created_at: new Date().toISOString() },
  { id: 2, name: '婷兰灰肤感', remark: '', created_at: new Date().toISOString() },
  { id: 3, name: '白色', remark: '', created_at: new Date().toISOString() },
  { id: 4, name: '香奈儿白', remark: '', created_at: new Date().toISOString() },
];

const mockProjects: ProjectData[] = [
  { id: 1, name: '主卧', remark: '', created_at: new Date().toISOString() },
  { id: 2, name: '次卧', remark: '', created_at: new Date().toISOString() },
  { id: 3, name: '客厅', remark: '', created_at: new Date().toISOString() },
];

// 关联关系存储
const categoryLevel1MaterialMap: Map<number, number[]> = new Map();
const materialColorMap: Map<number, number[]> = new Map();

let nextCategoryLevel1Id = 5;
let nextCategoryLevel2Id = 10;
let nextMaterialId = 5;
let nextColorId = 5;
let nextProjectId = 4;

// 模拟异步延迟
const delay = (ms: number = 300) => new Promise(resolve => setTimeout(resolve, ms));

// 报价配置服务类（使用 Mock 数据）
export class QuotationConfigService {
  // ========== 报价类目相关 ==========
  
  // 获取报价类目树形结构
  static async getCategoryTree(): Promise<QuotationCategoryTree[]> {
    await delay();
    // 构建树形结构，并添加关联的基材ID
    const tree: QuotationCategoryTree[] = mockCategoryLevel1.map(level1 => ({
      level1: {
        ...level1,
        material_ids: categoryLevel1MaterialMap.get(level1.id) || [],
      },
      level2: mockCategoryLevel2.filter(level2 => level2.parent_id === level1.id),
    }));
    return tree;
  }

  // 创建一级类目
  static async createCategoryLevel1(data: CreateCategoryLevel1Data): Promise<QuotationCategoryLevel1> {
    await delay();
    const newCategory: QuotationCategoryLevel1 = {
      id: nextCategoryLevel1Id++,
      name: data.name,
      remark: data.remark,
      material_ids: data.material_ids || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    mockCategoryLevel1.push(newCategory);
    // 保存关联关系
    if (data.material_ids && data.material_ids.length > 0) {
      categoryLevel1MaterialMap.set(newCategory.id, data.material_ids);
    }
    return newCategory;
  }

  // 创建二级类目
  static async createCategoryLevel2(data: CreateCategoryLevel2Data): Promise<QuotationCategoryLevel2> {
    await delay();
    const newCategory: QuotationCategoryLevel2 = {
      id: nextCategoryLevel2Id++,
      name: data.name,
      parent_id: data.parent_id,
      pricing_unit: data.pricing_unit,
      remark: data.remark,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    mockCategoryLevel2.push(newCategory);
    return newCategory;
  }

  // 更新一级类目
  static async updateCategoryLevel1(id: number, data: Partial<CreateCategoryLevel1Data>): Promise<QuotationCategoryLevel1> {
    await delay();
    const index = mockCategoryLevel1.findIndex(item => item.id === id);
    if (index === -1) {
      throw new Error('一级类目不存在');
    }
    const updated = {
      ...mockCategoryLevel1[index],
      ...data,
      material_ids: data.material_ids !== undefined ? data.material_ids : mockCategoryLevel1[index].material_ids,
      updated_at: new Date().toISOString(),
    };
    mockCategoryLevel1[index] = updated;
    // 更新关联关系
    if (data.material_ids !== undefined) {
      if (data.material_ids.length > 0) {
        categoryLevel1MaterialMap.set(id, data.material_ids);
      } else {
        categoryLevel1MaterialMap.delete(id);
      }
    }
    return updated;
  }

  // 更新二级类目
  static async updateCategoryLevel2(id: number, data: Partial<CreateCategoryLevel2Data>): Promise<QuotationCategoryLevel2> {
    await delay();
    const index = mockCategoryLevel2.findIndex(item => item.id === id);
    if (index === -1) {
      throw new Error('二级类目不存在');
    }
    const updated = {
      ...mockCategoryLevel2[index],
      ...data,
      updated_at: new Date().toISOString(),
    };
    mockCategoryLevel2[index] = updated;
    return updated;
  }

  // 删除一级类目
  static async deleteCategoryLevel1(id: number): Promise<void> {
    await delay();
    const index = mockCategoryLevel1.findIndex(item => item.id === id);
    if (index === -1) {
      throw new Error('一级类目不存在');
    }
    // 同时删除所有子类目
    mockCategoryLevel2 = mockCategoryLevel2.filter(item => item.parent_id !== id);
    mockCategoryLevel1.splice(index, 1);
    // 删除关联关系
    categoryLevel1MaterialMap.delete(id);
  }

  // 删除二级类目
  static async deleteCategoryLevel2(id: number): Promise<void> {
    await delay();
    const index = mockCategoryLevel2.findIndex(item => item.id === id);
    if (index === -1) {
      throw new Error('二级类目不存在');
    }
    mockCategoryLevel2.splice(index, 1);
  }

  // ========== 基材管理相关 ==========
  
  // 获取基材列表
  static async getMaterialList(): Promise<MaterialData[]> {
    await delay();
    // 添加关联的颜色ID
    return mockMaterials.map(material => ({
      ...material,
      color_ids: materialColorMap.get(material.id) || [],
    }));
  }

  // 创建基材
  static async createMaterial(data: CreateMaterialData): Promise<MaterialData> {
    await delay();
    const newMaterial: MaterialData = {
      id: nextMaterialId++,
      name: data.name,
      remark: data.remark,
      dealer_price: data.dealer_price,
      owner_price: data.owner_price,
      color_ids: data.color_ids || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    mockMaterials.push(newMaterial);
    // 保存关联关系
    if (data.color_ids && data.color_ids.length > 0) {
      materialColorMap.set(newMaterial.id, data.color_ids);
    }
    return newMaterial;
  }

  // 更新基材
  static async updateMaterial(id: number, data: UpdateMaterialData & { color_ids?: number[] }): Promise<MaterialData> {
    await delay();
    const index = mockMaterials.findIndex(item => item.id === id);
    if (index === -1) {
      throw new Error('基材不存在');
    }
    const updated = {
      ...mockMaterials[index],
      ...data,
      color_ids: data.color_ids !== undefined ? data.color_ids : mockMaterials[index].color_ids,
      updated_at: new Date().toISOString(),
    };
    mockMaterials[index] = updated;
    // 更新关联关系
    if (data.color_ids !== undefined) {
      if (data.color_ids.length > 0) {
        materialColorMap.set(id, data.color_ids);
      } else {
        materialColorMap.delete(id);
      }
    }
    return updated;
  }

  // 删除基材
  static async deleteMaterial(id: number): Promise<void> {
    await delay();
    const index = mockMaterials.findIndex(item => item.id === id);
    if (index === -1) {
      throw new Error('基材不存在');
    }
    mockMaterials.splice(index, 1);
    // 删除关联关系
    materialColorMap.delete(id);
  }

  // ========== 颜色管理相关 ==========
  
  // 获取颜色列表
  static async getColorList(): Promise<ColorData[]> {
    await delay();
    return [...mockColors];
  }

  // 创建颜色
  static async createColor(data: CreateColorData): Promise<ColorData> {
    await delay();
    const newColor: ColorData = {
      id: nextColorId++,
      name: data.name,
      remark: data.remark,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    mockColors.push(newColor);
    return newColor;
  }

  // 更新颜色
  static async updateColor(id: number, data: UpdateColorData): Promise<ColorData> {
    await delay();
    const index = mockColors.findIndex(item => item.id === id);
    if (index === -1) {
      throw new Error('颜色不存在');
    }
    const updated = {
      ...mockColors[index],
      ...data,
      updated_at: new Date().toISOString(),
    };
    mockColors[index] = updated;
    return updated;
  }

  // 删除颜色
  static async deleteColor(id: number): Promise<void> {
    await delay();
    const index = mockColors.findIndex(item => item.id === id);
    if (index === -1) {
      throw new Error('颜色不存在');
    }
    mockColors.splice(index, 1);
    // 从所有基材的关联关系中移除该颜色
    materialColorMap.forEach((colorIds, materialId) => {
      const newColorIds = colorIds.filter(cid => cid !== id);
      if (newColorIds.length > 0) {
        materialColorMap.set(materialId, newColorIds);
      } else {
        materialColorMap.delete(materialId);
      }
    });
  }

  // ========== 项目配置相关 ==========
  
  // 获取项目列表
  static async getProjectList(): Promise<ProjectData[]> {
    await delay();
    return [...mockProjects];
  }

  // 创建项目
  static async createProject(data: CreateProjectData): Promise<ProjectData> {
    await delay();
    const newProject: ProjectData = {
      id: nextProjectId++,
      name: data.name,
      remark: data.remark,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    mockProjects.push(newProject);
    return newProject;
  }

  // 更新项目
  static async updateProject(id: number, data: UpdateProjectData): Promise<ProjectData> {
    await delay();
    const index = mockProjects.findIndex(item => item.id === id);
    if (index === -1) {
      throw new Error('项目不存在');
    }
    const updated = {
      ...mockProjects[index],
      ...data,
      updated_at: new Date().toISOString(),
    };
    mockProjects[index] = updated;
    return updated;
  }

  // 删除项目
  static async deleteProject(id: number): Promise<void> {
    await delay();
    const index = mockProjects.findIndex(item => item.id === id);
    if (index === -1) {
      throw new Error('项目不存在');
    }
    mockProjects.splice(index, 1);
  }
}

export default QuotationConfigService;

