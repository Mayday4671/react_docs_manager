/**
 * @file user.ts
 * @description 用户数据模型与操作参数类型定义
 * @module 系统管理
 */

/**
 * 用户记录（对应数据库 sys_user 表）
 */
export interface User {
  /** 用户唯一标识 */
  id: number;
  /** 登录用户名（唯一） */
  username: string;
  /** 加密后的密码哈希 */
  password: string;
  /** 用户邮箱 */
  email?: string | null;
  /** 用户手机号 */
  phone?: string | null;
  /** 用户头像 URL 或路径 */
  avatar?: string | null;
  /** 账号状态：1-启用 0-禁用 */
  status: number;
  /** 关联角色 ID */
  roleId?: number | null;
  /** 创建人用户 ID */
  createdBy?: number | null;
  /** 最后更新人用户 ID */
  updatedBy?: number | null;
  /** 账号创建时间 */
  createdAt: Date;
  /** 最后更新时间 */
  updatedAt: Date;
}

/**
 * 创建用户所需的数据结构
 */
export interface CreateUserData {
  /** 登录用户名 */
  username: string;
  /** 明文密码（服务层负责加密） */
  password: string;
  /** 用户邮箱 */
  email?: string;
  /** 用户手机号 */
  phone?: string;
  /** 用户头像 URL 或路径 */
  avatar?: string;
  /** 关联角色 ID */
  roleId?: number;
  /** 创建人用户 ID */
  createdBy?: number;
}

/**
 * 更新用户所需的数据结构（所有字段均为可选）
 */
export interface UpdateUserData {
  /** 登录用户名 */
  username?: string;
  /** 新密码（服务层负责加密） */
  password?: string;
  /** 用户邮箱 */
  email?: string;
  /** 用户手机号 */
  phone?: string;
  /** 用户头像 URL 或路径 */
  avatar?: string;
  /** 账号状态：1-启用 0-禁用 */
  status?: number;
  /** 关联角色 ID */
  roleId?: number;
  /** 最后更新人用户 ID */
  updatedBy?: number;
}

/**
 * 用户列表查询参数
 */
export interface UserQueryParams {
  /** 按用户名模糊搜索 */
  username?: string;
  /** 按邮箱模糊搜索 */
  email?: string;
  /** 按账号状态过滤：1-启用 0-禁用 */
  status?: number;
  /** 按角色 ID 过滤 */
  roleId?: number;
  /** 当前页码，从 1 开始 */
  page?: number;
  /** 每页条数 */
  pageSize?: number;
}
