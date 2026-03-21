/**
 * 日志数据模型
 */

export interface Log {
  id: number;
  module: string;
  action: string;
  method?: string | null;
  url?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  params?: string | null;
  result?: string | null;
  errorMsg?: string | null;
  costTime?: number | null;
  userId?: number | null;
  username?: string | null;
  status: number;
  createdAt: Date;
}

export interface CreateLogData {
  module: string;
  action: string;
  method?: string;
  url?: string;
  ip?: string;
  userAgent?: string;
  params?: string;
  result?: string;
  errorMsg?: string;
  costTime?: number;
  userId?: number;
  username?: string;
  status?: number;
}

export interface LogQueryParams {
  module?: string;
  action?: string;
  userId?: number;
  status?: number;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  pageSize?: number;
}
