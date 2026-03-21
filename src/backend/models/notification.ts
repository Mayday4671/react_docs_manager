/**
 * 通知数据模型
 */

export interface Notification {
  id: number;
  title: string;
  content?: string | null;
  type: string;
  priority: number;
  status: number;
  readCount: number;
  publishAt?: Date | null;
  expireAt?: Date | null;
  createdBy?: number | null;
  updatedBy?: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateNotificationData {
  title: string;
  content?: string;
  type?: string;
  priority?: number;
  status?: number;
  publishAt?: Date;
  expireAt?: Date;
  createdBy?: number;
}

export interface UpdateNotificationData {
  title?: string;
  content?: string;
  type?: string;
  priority?: number;
  status?: number;
  publishAt?: Date;
  expireAt?: Date;
  updatedBy?: number;
}
