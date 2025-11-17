# 报价系统需求设计文档

## 一、项目概述

### 1.1 项目背景
报价系统是订单管理系统的新增模块，用于管理定制家具/橱柜的报价配置和报价单生成。系统需要支持复杂的配置项管理、灵活的报价单生成和导出功能。

### 1.2 目标用户
- **设计师**：创建和管理报价单，配置产品规格
- **销售员**：查看报价单，与客户沟通
- **管理员**：管理报价配置项，维护价格体系

### 1.3 核心功能
1. **报价配置管理**：管理各类产品配置项（柜体、门板、配件等）
2. **报价单生成**：基于配置快速生成报价单
3. **报价单管理**：查看、编辑、导出报价单
4. **价格管理**：维护产品价格体系

---

## 二、功能需求分析

### 2.1 报价配置管理模块

#### 2.1.1 配置分类管理
系统需要支持以下配置分类：

| 分类 | 子项 | 配置属性 |
|------|------|----------|
| **柜体部分** | 柜体 | 基材、颜色 |
| | 柜门 | 基材、颜色、厚度 |
| | 背板 | 基材、颜色、厚度 |
| **见光板** | - | 基材、颜色、厚度（默认18mm） |
| **墙板** | - | 基材、颜色、厚度 |
| **格栅** | - | 基材、颜色、厚度 |
| **灯带** | - | 类型（中性/白光/暖光） |
| **开关** | - | 类型（人体/触摸/手扫/门碰/集控） |
| **变压器** | - | 功率（36W/60W/100W/200W） |
| **拉手** | - | 类型（烤漆牛角拉手/柜体免拉手/型材通体拉手/成品拉手/型材免拉手） |
| **抽屉** | - | 抽屉类型、托底轨 |
| **成品五金类** | 裤架/格子抽、拉篮、洗菜盆、调味篮等 | 规格、价格 |
| **石材类及配件** | 石材、一体盆、龙头、角阀、岩板 | 规格、价格 |
| **铝板类** | - | 规格、价格 |
| **木门、门套及钛镁合金门** | - | 规格、价格 |
| **圆弧及其他异形** | - | 规格示例、数量、单位、备注 |

#### 2.1.2 配置项数据结构
每个配置项包含：
- **基本信息**：名称、分类、类型
- **属性配置**：基材、颜色、厚度等
- **价格信息**：单价、计价单位
- **特殊说明**：备注、适用场景

#### 2.1.3 功能点
- ✅ 配置分类的增删改查
- ✅ 配置项的增删改查
- ✅ 配置项属性管理（基材、颜色、厚度等）
- ✅ 价格管理（支持批量导入/导出）
- ✅ 配置模板管理（常用配置组合）

---

### 2.2 报价单生成模块

#### 2.2.1 报价单基本信息
- **客户信息**：客户名称、电话、地址
- **订单信息**：订单编号、设计师、销售员、拆单员
- **时间信息**：报价日期
- **备注信息**：备注

#### 2.2.2 报价单项目列表
每个项目包含：
- **项目分类**：按房间/区域分类（主卧、客卧、厨房、客厅等）
- **柜名/规格**：具体产品名称
- **尺寸信息**：高、宽（单位：mm）
- **数量信息**：数量、单位（平方/米/项/扇/个/块/根/套）
- **价格信息**：单价、合计
- **材质配置**：
  - 柜体颜色材质
  - 门板颜色材质
  - 背板材质
- **备注**：特殊说明

#### 2.2.3 报价单统计
- **合计金额**：所有项目金额总和
- **优惠金额**：可设置优惠
- **优惠后总金额**：最终报价金额

#### 2.2.4 功能点
- ✅ 创建报价单（支持从订单导入）
- ✅ 添加报价项目（支持按房间分组）
- ✅ 选择配置项快速填充
- ✅ 自动计算金额
- ✅ 支持优惠设置
- ✅ 报价单预览
- ✅ 报价单导出（Excel/PDF）
- ✅ 报价单打印

---

### 2.3 报价单管理模块

#### 2.3.1 报价单列表
- 支持按客户、设计师、日期筛选
- 支持按订单编号、客户名称搜索
- 显示报价单状态（草稿/已发送/已确认）

#### 2.3.2 报价单操作
- 查看详情
- 编辑报价单
- 复制报价单
- 删除报价单
- 发送给客户（邮件/微信）
- 转为订单

---

## 三、数据库设计

### 3.1 报价配置表 (quotation_configs)

```sql
CREATE TABLE quotation_configs (
    id SERIAL PRIMARY KEY,
    category VARCHAR(50) NOT NULL COMMENT '配置分类',
    sub_category VARCHAR(50) COMMENT '子分类',
    name VARCHAR(100) NOT NULL COMMENT '配置名称',
    config_type VARCHAR(50) NOT NULL COMMENT '配置类型',
    attributes JSONB COMMENT '配置属性（基材、颜色、厚度等）',
    unit VARCHAR(20) COMMENT '计价单位',
    base_price DECIMAL(10, 2) COMMENT '基础价格',
    is_active BOOLEAN DEFAULT true COMMENT '是否启用',
    sort_order INTEGER DEFAULT 0 COMMENT '排序',
    remarks TEXT COMMENT '备注',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 3.2 报价单表 (quotations)

```sql
CREATE TABLE quotations (
    id SERIAL PRIMARY KEY,
    quotation_number VARCHAR(50) UNIQUE NOT NULL COMMENT '报价单编号',
    customer_name VARCHAR(100) NOT NULL COMMENT '客户名称',
    customer_phone VARCHAR(20) COMMENT '客户电话',
    customer_address TEXT COMMENT '客户地址',
    designer VARCHAR(50) COMMENT '设计师',
    salesperson VARCHAR(50) COMMENT '销售员',
    splitter VARCHAR(50) COMMENT '拆单员',
    quotation_date DATE NOT NULL COMMENT '报价日期',
    total_amount DECIMAL(12, 2) DEFAULT 0 COMMENT '合计金额',
    discount_amount DECIMAL(12, 2) DEFAULT 0 COMMENT '优惠金额',
    final_amount DECIMAL(12, 2) DEFAULT 0 COMMENT '优惠后总金额',
    status VARCHAR(20) DEFAULT 'draft' COMMENT '状态：draft/sent/confirmed',
    remarks TEXT COMMENT '备注',
    created_by INTEGER COMMENT '创建人ID',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 3.3 报价单项目表 (quotation_items)

```sql
CREATE TABLE quotation_items (
    id SERIAL PRIMARY KEY,
    quotation_id INTEGER NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
    project_category VARCHAR(50) COMMENT '项目分类（房间/区域）',
    cabinet_name VARCHAR(200) COMMENT '柜名/规格',
    height DECIMAL(10, 2) COMMENT '高度（mm）',
    width DECIMAL(10, 2) COMMENT '宽度（mm）',
    quantity DECIMAL(10, 2) NOT NULL COMMENT '数量',
    unit VARCHAR(20) NOT NULL COMMENT '单位',
    unit_price DECIMAL(10, 2) NOT NULL COMMENT '单价',
    total_price DECIMAL(12, 2) NOT NULL COMMENT '合计',
    cabinet_material TEXT COMMENT '柜体颜色材质',
    door_material TEXT COMMENT '门板颜色材质',
    back_panel_material TEXT COMMENT '背板材质',
    remarks TEXT COMMENT '备注',
    sort_order INTEGER DEFAULT 0 COMMENT '排序',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 3.4 配置属性表 (config_attributes)

```sql
CREATE TABLE config_attributes (
    id SERIAL PRIMARY KEY,
    config_id INTEGER NOT NULL REFERENCES quotation_configs(id) ON DELETE CASCADE,
    attribute_type VARCHAR(50) NOT NULL COMMENT '属性类型（base_material/color/thickness等）',
    attribute_name VARCHAR(100) NOT NULL COMMENT '属性名称',
    attribute_value VARCHAR(200) COMMENT '属性值',
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 3.5 价格表 (prices)

```sql
CREATE TABLE prices (
    id SERIAL PRIMARY KEY,
    config_id INTEGER NOT NULL REFERENCES quotation_configs(id) ON DELETE CASCADE,
    price_type VARCHAR(50) COMMENT '价格类型（base/wholesale/retail）',
    unit_price DECIMAL(10, 2) NOT NULL COMMENT '单价',
    effective_date DATE COMMENT '生效日期',
    expiry_date DATE COMMENT '失效日期',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 四、API接口设计

### 4.1 报价配置管理接口

#### 4.1.1 配置分类管理
```
GET    /api/v1/quotation/configs/categories          # 获取所有配置分类
POST   /api/v1/quotation/configs/categories          # 创建配置分类
PUT    /api/v1/quotation/configs/categories/:id      # 更新配置分类
DELETE /api/v1/quotation/configs/categories/:id     # 删除配置分类
```

#### 4.1.2 配置项管理
```
GET    /api/v1/quotation/configs                     # 获取配置列表（支持筛选）
POST   /api/v1/quotation/configs                    # 创建配置项
GET    /api/v1/quotation/configs/:id                # 获取配置详情
PUT    /api/v1/quotation/configs/:id                # 更新配置项
DELETE /api/v1/quotation/configs/:id                # 删除配置项
```

#### 4.1.3 配置属性管理
```
GET    /api/v1/quotation/configs/:id/attributes      # 获取配置属性
POST   /api/v1/quotation/configs/:id/attributes     # 添加配置属性
PUT    /api/v1/quotation/configs/:id/attributes/:attr_id  # 更新属性
DELETE /api/v1/quotation/configs/:id/attributes/:attr_id  # 删除属性
```

#### 4.1.4 价格管理
```
GET    /api/v1/quotation/configs/:id/prices          # 获取价格列表
POST   /api/v1/quotation/configs/:id/prices         # 设置价格
PUT    /api/v1/quotation/prices/:id                 # 更新价格
DELETE /api/v1/quotation/prices/:id                 # 删除价格
POST   /api/v1/quotation/prices/batch-import        # 批量导入价格
```

### 4.2 报价单管理接口

#### 4.2.1 报价单CRUD
```
GET    /api/v1/quotations                           # 获取报价单列表
POST   /api/v1/quotations                           # 创建报价单
GET    /api/v1/quotations/:id                       # 获取报价单详情
PUT    /api/v1/quotations/:id                       # 更新报价单
DELETE /api/v1/quotations/:id                       # 删除报价单
POST   /api/v1/quotations/:id/copy                  # 复制报价单
POST   /api/v1/quotations/:id/convert-to-order      # 转为订单
```

#### 4.2.2 报价单项目管理
```
GET    /api/v1/quotations/:id/items                 # 获取报价单项目列表
POST   /api/v1/quotations/:id/items                 # 添加报价项目
PUT    /api/v1/quotations/:id/items/:item_id        # 更新报价项目
DELETE /api/v1/quotations/:id/items/:item_id        # 删除报价项目
POST   /api/v1/quotations/:id/items/batch          # 批量添加项目
```

#### 4.2.3 报价单导出
```
GET    /api/v1/quotations/:id/export/excel          # 导出Excel
GET    /api/v1/quotations/:id/export/pdf            # 导出PDF
GET    /api/v1/quotations/:id/preview               # 预览报价单
```

---

## 五、前端页面设计

### 5.1 页面结构

```
/quotation
├── /config                    # 报价配置管理
│   ├── page.tsx              # 配置列表页
│   ├── createModal.tsx       # 创建配置弹窗
│   └── editModal.tsx         # 编辑配置弹窗
├── /list                      # 报价单列表
│   └── page.tsx              # 报价单列表页
├── /create                    # 创建报价单
│   └── page.tsx              # 创建报价单页
├── /detail/:id                # 报价单详情
│   └── page.tsx              # 报价单详情页
└── /edit/:id                  # 编辑报价单
    └── page.tsx              # 编辑报价单页
```

### 5.2 核心组件

- `QuotationConfigList` - 配置列表组件
- `QuotationConfigForm` - 配置表单组件
- `QuotationList` - 报价单列表组件
- `QuotationForm` - 报价单表单组件
- `QuotationItemTable` - 报价项目表格组件
- `ConfigSelector` - 配置选择器组件
- `QuotationPreview` - 报价单预览组件
- `QuotationExport` - 报价单导出组件

---

## 六、业务流程

### 6.1 报价单创建流程

```
1. 选择客户（或从订单导入）
   ↓
2. 填写基本信息（客户信息、设计师等）
   ↓
3. 添加报价项目
   ├─ 方式1：手动添加
   ├─ 方式2：从配置库选择
   └─ 方式3：从订单导入
   ↓
4. 配置每个项目的材质和规格
   ↓
5. 自动计算金额
   ↓
6. 设置优惠（可选）
   ↓
7. 预览报价单
   ↓
8. 保存/导出/发送
```

### 6.2 配置管理流程

```
1. 选择配置分类
   ↓
2. 创建配置项
   ├─ 填写基本信息
   ├─ 配置属性（基材、颜色、厚度等）
   └─ 设置价格
   ↓
3. 保存配置
   ↓
4. 配置可用于报价单生成
```

---

## 七、技术实现要点

### 7.1 前端技术
- **框架**：Next.js 14 + TypeScript
- **UI组件**：Ant Design 5.x
- **表格组件**：Ant Design Table（支持可编辑单元格）
- **表单管理**：Ant Design Form
- **数据可视化**：ECharts（可选，用于价格趋势分析）
- **导出功能**：xlsx（Excel导出）、jsPDF（PDF导出）

### 7.2 后端技术
- **框架**：FastAPI
- **数据库**：PostgreSQL
- **ORM**：SQLAlchemy 2.0
- **数据验证**：Pydantic
- **文件导出**：openpyxl（Excel）、reportlab（PDF）

### 7.3 关键功能实现

#### 7.3.1 可编辑表格
使用 Ant Design 的 `editable` 功能实现报价项目的行内编辑。

#### 7.3.2 配置选择器
实现一个弹窗组件，支持：
- 按分类筛选配置
- 搜索配置项
- 预览配置详情
- 一键添加到报价单

#### 7.3.3 自动计算
- 实时计算每个项目的合计金额
- 自动汇总总金额
- 优惠后金额计算

#### 7.4.4 导出功能
- Excel导出：保持原有格式，支持公式计算
- PDF导出：生成标准报价单格式

---

## 八、开发计划

### 阶段一：基础功能（1-2周）
- [ ] 数据库表设计和创建
- [ ] 后端API开发（配置管理、报价单CRUD）
- [ ] 前端页面框架搭建
- [ ] 配置管理页面

### 阶段二：核心功能（2-3周）
- [ ] 报价单创建页面
- [ ] 报价项目管理（添加、编辑、删除）
- [ ] 配置选择器组件
- [ ] 自动计算功能

### 阶段三：高级功能（1-2周）
- [ ] 报价单预览
- [ ] Excel导出
- [ ] PDF导出
- [ ] 报价单打印

### 阶段四：优化和完善（1周）
- [ ] 性能优化
- [ ] 用户体验优化
- [ ] 测试和bug修复
- [ ] 文档完善

---

## 九、注意事项

1. **数据一致性**：确保配置项删除时不影响已生成的报价单
2. **价格管理**：支持价格历史记录，便于追溯
3. **权限控制**：不同角色对报价单的操作权限不同
4. **性能优化**：报价单项目较多时，注意表格渲染性能
5. **导出格式**：确保导出的Excel/PDF格式符合业务需求

---

## 十、扩展功能（后续版本）

1. **报价模板**：支持保存常用报价单为模板
2. **价格审批**：特殊价格需要审批流程
3. **报价对比**：支持多个报价单对比
4. **统计分析**：报价单统计分析报表
5. **移动端支持**：小程序端查看报价单

