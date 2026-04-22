/**
 * @file route.ts
 * @description 通知公告 CRUD API 路由，支持获取、创建、更新、删除操作，并记录操作日志
 * @module 系统管理 / 通知管理
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAllNotifications, createNotification } from '@/backend/services/notificationService';
import { createLog } from '@/backend/services/logService';

/**
 * GET /api/notifications
 *
 * 分页获取通知公告列表，支持按类型和状态过滤。
 *
 * @param request - Next.js 请求对象，支持查询参数：page / pageSize / type / status
 * @returns 包含通知列表和分页信息的 JSON 响应
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const type = searchParams.get('type') || undefined;
    const status = searchParams.get('status') ? parseInt(searchParams.get('status')!) : undefined;

    const result = await getAllNotifications({ page, pageSize, type, status });

    // 记录日志
    await createLog({
      module: 'notification',
      action: 'LIST',
      method: 'GET',
      url: request.url,
      ip: request.headers.get('x-forwarded-for') || 'unknown',
      costTime: Date.now() - startTime,
      status: 1
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to fetch notifications:', error);
    
    await createLog({
      module: 'notification',
      action: 'LIST',
      method: 'GET',
      url: request.url,
      errorMsg: error instanceof Error ? error.message : 'Unknown error',
      costTime: Date.now() - startTime,
      status: 0
    });

    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/notifications
 *
 * 创建新的通知公告，并记录操作日志。
 *
 * @param request - Next.js 请求对象，body 为通知数据 JSON
 * @returns 包含新建通知记录的 JSON 响应（HTTP 201）
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body = await request.json();
    const notification = await createNotification(body);

    await createLog({
      module: 'notification',
      action: 'CREATE',
      method: 'POST',
      url: request.url,
      ip: request.headers.get('x-forwarded-for') || 'unknown',
      params: JSON.stringify(body),
      costTime: Date.now() - startTime,
      status: 1
    });

    return NextResponse.json(notification, { status: 201 });
  } catch (error) {
    console.error('Failed to create notification:', error);
    
    await createLog({
      module: 'notification',
      action: 'CREATE',
      method: 'POST',
      url: request.url,
      errorMsg: error instanceof Error ? error.message : 'Unknown error',
      costTime: Date.now() - startTime,
      status: 0
    });

    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}


/**
 * PUT /api/notifications
 *
 * 更新指定 ID 的通知公告。
 *
 * @param request - Next.js 请求对象，body 须包含 id 字段及待更新字段
 * @returns 包含更新后通知记录的 JSON 响应
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...data } = body;
    
    if (!id) {
      return NextResponse.json(
        { success: false, message: '缺少通知ID' },
        { status: 400 }
      );
    }

    const { updateNotification } = await import('@/backend/services/notificationService');
    const notification = await updateNotification(id, data);
    
    return NextResponse.json({
      success: true,
      data: notification
    });
  } catch (error) {
    console.error('更新通知失败:', error);
    return NextResponse.json(
      { success: false, message: '更新通知失败' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/notifications?id={id}
 *
 * 删除指定 ID 的通知公告。
 *
 * @param request - Next.js 请求对象，查询参数须包含 id
 * @returns 操作结果的 JSON 响应
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { success: false, message: '缺少通知ID' },
        { status: 400 }
      );
    }

    const { deleteNotification } = await import('@/backend/services/notificationService');
    await deleteNotification(parseInt(id));
    
    return NextResponse.json({
      success: true,
      message: '删除成功'
    });
  } catch (error) {
    console.error('删除通知失败:', error);
    return NextResponse.json(
      { success: false, message: '删除通知失败' },
      { status: 500 }
    );
  }
}
