import api from './api';

// 类目数据类型定义
export interface CategoryData {
  id: number;
  name: string;
  category_type: string;
  created_at?: string;
  updated_at?: string;
}

// 创建类目请求数据类型
export interface CreateCategoryData {
  name: string;
  category_type: string;
}

// 类目服务类
export class CategoryService {
  // 获取类目列表
  static async getCategoryList(): Promise<CategoryData[]> {
    try {
      const response = await api.get('/v1/categories') as unknown as {
        categories: CategoryData[];
        total: number;
      };
      return response.categories;
    } catch (error) {
      console.error('获取类目列表失败:', error);
      throw error;
    }
  }

  // 新增类目
  static async createCategory(categoryData: CreateCategoryData): Promise<CategoryData> {
    try {
      const response = await api.post('/v1/categories', categoryData) as unknown as {
        message: string;
        category_id: number;
        name: string;
        category_type: string;
      };
      
      return {
        id: response.category_id,
        name: response.name,
        category_type: response.category_type
      };
    } catch (error) {
      console.error('新增类目失败:', error);
      throw error;
    }
  }

  // 删除类目
  static async deleteCategory(categoryId: number): Promise<void> {
    try {
      await api.delete(`/v1/categories/${categoryId}`);
    } catch (error) {
      console.error('删除类目失败:', error);
      throw error;
    }
  }
}

export default CategoryService;