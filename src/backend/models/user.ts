/**
 * 用户数据模型
 */

export interface User {
  id: number;
  username: string;
  password: string;
  email?: string | null;
  phone?: string | null;
  avatar?: string | null;
  status: number;
  roleId?: number | null;
  createdBy?: number | null;
  updatedBy?: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserData {
  username: string;
  password: string;
  email?: string;
  phone?: string;
  avatar?: string;
  roleId?: number;
  createdBy?: number;
}

export interface UpdateUserData {
  username?: string;
  password?: string;
  email?: string;
  phone?: string;
  avatar?: string;
  status?: number;
  roleId?: number;
  updatedBy?: number;
}

export interface UserQueryParams {
  username?: string;
  email?: string;
  status?: number;
  roleId?: number;
  page?: number;
  pageSize?: number;
}
