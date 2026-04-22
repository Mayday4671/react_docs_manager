/**
 * @file log.ts
 * @description 系统日志数据模型与查询参数类型定义
 * @module 系统管理
 */

/**
 * 系统日志记录（对应数据库 sys_log 表）
 */
export interface Log {
  /** 日志唯一标识 */
  id: number;
  /** 操作所属模块名称 */
  module: string;
  /** 操作行为描述 */
  action: string;
  /** HTTP 请求方法（GET / POST / PUT / DELETE 等） */
  method?: string | null;
  /** 请求 URL */
  url?: string | null;
  /** 客户端 IP 地址 */
  ip?: string | null;
  /** 客户端 User-Agent 字符串 */
  userAgent?: string | null;
  /** 请求参数（JSON 字符串） */
  params?: string | null;
  /** 响应结果摘要 */
  result?: string | null;
  /** 错误信息（操作失败时记录） */
  errorMsg?: string | null;
  /** 接口耗时（毫秒） */
  costTime?: number | null;
  /** 操作用户 ID */
  userId?: number | null;
  /** 操作用户名 */
  username?: string | null;
  /** 操作状态：1-成功 0-失败 */
  status: number;
  /** 日志创建时间 */
  createdAt: Date;
}

/**
 * 创建日志记录所需的数据结构
 */
export interface CreateLogData {
  /** 操作所属模块名称 */
  module: string;
  /** 操作行为描述 */
  action: string;
  /** HTTP 请求方法 */
  method?: string;
  /** 请求 URL */
  url?: string;
  /** 客户端 IP 地址 */
  ip?: string;
  /** 客户端 User-Agent 字符串 */
  userAgent?: string;
  /** 请求参数（JSON 字符串） */
  params?: string;
  /** 响应结果摘要 */
  result?: string;
  /** 错误信息 */
  errorMsg?: string;
  /** 接口耗时（毫秒） */
  costTime?: number;
  /** 操作用户 ID */
  userId?: number;
  /** 操作用户名 */
  username?: string;
  /** 操作状态：1-成功（默认）0-失败 */
  status?: number;
}

/**
 * 日志列表查询参数
 */
export interface LogQueryParams {
  /** 按模块名称过滤 */
  module?: string;
  /** 按操作行为过滤 */
  action?: string;
  /** 按用户 ID 过滤 */
  userId?: number;
  /** 按状态过滤：1-成功 0-失败 */
  status?: number;
  /** 查询起始时间（含） */
  startDate?: Date;
  /** 查询结束时间（含） */
  endDate?: Date;
  /** 当前页码，从 1 开始 */
  page?: number;
  /** 每页条数 */
  pageSize?: number;
}
