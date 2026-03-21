import { NextRequest, NextResponse } from 'next/server';
import { getAllNotifications, createNotification } from '@/backend/services/notificationService';
import { createLog } from '@/backend/services/logService';

/**
 * GET /api/notifications
 * 获取通知列表
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
 * 创建通知
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
 * 更新通知
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
 * DELETE /api/notifications
 * 删除通知
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
