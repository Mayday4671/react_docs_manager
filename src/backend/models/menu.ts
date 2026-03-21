/**
 * 菜单数据模型和类型定义
 */

/**
 * 菜单项接口（数据库模型）
 */
export interface Menu {
  id: number;
  key: string;
  label: string;
  icon?: string | null;
  path?: string | null;
  component?: string | null;
  parentId?: number | null;
  orderNum: number;
  menuType: string;
  visible: number;
  status: number;
  createdBy?: number | null;
  updatedBy?: number | null;
  createdAt: Date;
  updatedAt: Date;
  children?: Menu[];
}

/**
 * 创建菜单项的数据
 */
export interface CreateMenuData {
  key: string;
  label: string;
  icon?: string;
  path?: string;
  component?: string;
  parentId?: number;
  orderNum?: number;
  menuType?: string;
  visible?: number;
  status?: number;
  createdBy?: number;
}

/**
 * 更新菜单项的数据
 */
export interface UpdateMenuData {
  key?: string;
  label?: string;
  icon?: string;
  path?: string;
  component?: string;
  parentId?: number;
  orderNum?: number;
  menuType?: string;
  visible?: number;
  status?: number;
  updatedBy?: number;
}

/**
 * 菜单查询参数
 */
export interface MenuQueryParams {
  parentId?: number | null;
  includeChildren?: boolean;
  menuType?: string;
  status?: number;
}
