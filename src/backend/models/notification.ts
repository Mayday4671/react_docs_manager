/**
 * @file notification.ts
 * @description 通知公告数据模型与操作参数类型定义
 * @module 系统管理
 */

/**
 * 通知公告记录（对应数据库 tbl_notification 表）
 */
export interface Notification {
  /** 通知唯一标识 */
  id: number;
  /** 通知标题 */
  title: string;
  /** 通知正文内容（支持富文本） */
  content?: string | null;
  /** 通知类型（如：notice-公告 / info-消息 / warning-警告） */
  type: string;
  /** 优先级：数字越大优先级越高 */
  priority: number;
  /** 通知状态：1-已发布 0-草稿 */
  status: number;
  /** 累计阅读次数 */
  readCount: number;
  /** 定时发布时间，null 表示立即发布 */
  publishAt?: Date | null;
  /** 过期时间，null 表示永不过期 */
  expireAt?: Date | null;
  /** 创建人用户 ID */
  createdBy?: number | null;
  /** 最后更新人用户 ID */
  updatedBy?: number | null;
  /** 创建时间 */
  createdAt: Date;
  /** 最后更新时间 */
  updatedAt: Date;
}

/**
 * 创建通知所需的数据结构
 */
export interface CreateNotificationData {
  /** 通知标题 */
  title: string;
  /** 通知正文内容 */
  content?: string;
  /** 通知类型 */
  type?: string;
  /** 优先级 */
  priority?: number;
  /** 通知状态：1-已发布 0-草稿 */
  status?: number;
  /** 定时发布时间 */
  publishAt?: Date;
  /** 过期时间 */
  expireAt?: Date;
  /** 创建人用户 ID */
  createdBy?: number;
}

/**
 * 更新通知所需的数据结构（所有字段均为可选）
 */
export interface UpdateNotificationData {
  /** 通知标题 */
  title?: string;
  /** 通知正文内容 */
  content?: string;
  /** 通知类型 */
  type?: string;
  /** 优先级 */
  priority?: number;
  /** 通知状态：1-已发布 0-草稿 */
  status?: number;
  /** 定时发布时间 */
  publishAt?: Date;
  /** 过期时间 */
  expireAt?: Date;
  /** 最后更新人用户 ID */
  updatedBy?: number;
}
