/**
 * @file menu.ts
 * @description 菜单数据模型与操作参数类型定义
 * @module 系统管理
 */

/**
 * 菜单项接口（对应数据库 sys_menu 表）
 */
export interface Menu {
  /** 菜单唯一标识 */
  id: number;
  /** 菜单路由 key，对应前端 componentMap 中的 key */
  key: string;
  /** 菜单显示名称 */
  label: string;
  /** 菜单图标名称（来自 @ant-design/icons） */
  icon?: string | null;
  /** 菜单路由路径 */
  path?: string | null;
  /** 绑定的前端组件标识 */
  component?: string | null;
  /** 父菜单 ID，null 表示顶级菜单 */
  parentId?: number | null;
  /** 排序号，数字越小越靠前 */
  orderNum: number;
  /** 菜单类型：M-目录（有子菜单）/ C-菜单（叶子节点） */
  menuType: string;
  /** 是否显示：1-显示 0-隐藏 */
  visible: number;
  /** 菜单状态：1-启用 0-禁用 */
  status: number;
  /** 创建人用户 ID */
  createdBy?: number | null;
  /** 最后更新人用户 ID */
  updatedBy?: number | null;
  /** 创建时间 */
  createdAt: Date;
  /** 最后更新时间 */
  updatedAt: Date;
  /** 子菜单列表（树形结构时使用） */
  children?: Menu[];
}

/**
 * 创建菜单所需的数据结构
 */
export interface CreateMenuData {
  /** 菜单路由 key */
  key: string;
  /** 菜单显示名称 */
  label: string;
  /** 菜单图标名称 */
  icon?: string;
  /** 菜单路由路径 */
  path?: string;
  /** 绑定的前端组件标识 */
  component?: string;
  /** 父菜单 ID */
  parentId?: number;
  /** 排序号 */
  orderNum?: number;
  /** 菜单类型：M-目录 / C-菜单 */
  menuType?: string;
  /** 是否显示：1-显示 0-隐藏 */
  visible?: number;
  /** 菜单状态：1-启用 0-禁用 */
  status?: number;
  /** 创建人用户 ID */
  createdBy?: number;
}

/**
 * 更新菜单所需的数据结构（所有字段均为可选）
 */
export interface UpdateMenuData {
  /** 菜单路由 key */
  key?: string;
  /** 菜单显示名称 */
  label?: string;
  /** 菜单图标名称 */
  icon?: string;
  /** 菜单路由路径 */
  path?: string;
  /** 绑定的前端组件标识 */
  component?: string;
  /** 父菜单 ID */
  parentId?: number;
  /** 排序号 */
  orderNum?: number;
  /** 菜单类型：M-目录 / C-菜单 */
  menuType?: string;
  /** 是否显示：1-显示 0-隐藏 */
  visible?: number;
  /** 菜单状态：1-启用 0-禁用 */
  status?: number;
  /** 最后更新人用户 ID */
  updatedBy?: number;
}

/**
 * 菜单列表查询参数
 */
export interface MenuQueryParams {
  /** 按父菜单 ID 过滤，null 表示查询顶级菜单 */
  parentId?: number | null;
  /** 是否同时返回子菜单（树形结构） */
  includeChildren?: boolean;
  /** 按菜单类型过滤：M-目录 / C-菜单 */
  menuType?: string;
  /** 按状态过滤：1-启用 0-禁用 */
  status?: number;
}
