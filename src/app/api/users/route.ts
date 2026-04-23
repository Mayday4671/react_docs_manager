/**
 * @file route.ts
 * @description 用户管理 CRUD API 路由，支持获取、创建、更新、删除操作，并记录操作日志
 * @module 系统管理 / 用户管理
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAllUsers, createUser } from '@/backend/services/userService';
import { createLog } from '@/backend/services/logService';

/**
 * GET /api/users
 *
 * 分页获取用户列表，支持按状态过滤，同时关联返回角色信息。
 *
 * @param request - Next.js 请求对象，支持查询参数：page / pageSize / status
 * @returns 包含用户列表和分页信息的 JSON 响应
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const status = searchParams.get('status') ? parseInt(searchParams.get('status')!) : undefined;

    const result = await getAllUsers({ page, pageSize, status });

    // 记录日志
    await createLog({
      module: 'user',
      action: 'LIST',
      method: 'GET',
      url: request.url,
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent') || undefined,
      params: JSON.stringify({ page, pageSize, status }),
      result: 'success',
      costTime: Date.now() - startTime,
      status: 1
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to fetch users:', error);
    
    // 记录错误日志
    await createLog({
      module: 'user',
      action: 'LIST',
      method: 'GET',
      url: request.url,
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      errorMsg: error instanceof Error ? error.message : 'Unknown error',
      costTime: Date.now() - startTime,
      status: 0
    });

    return NextResponse.json(
      { error: 'Internal Server Error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/users
 *
 * 创建新用户，username 和 password 为必填字段，并记录操作日志。
 * 注意：密码以明文传输，服务层负责加密存储。
 *
 * @param request - Next.js 请求对象，body 须包含 username / password 字段
 * @returns 包含新建用户记录的 JSON 响应（HTTP 201）
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body = await request.json();
    const { username, password, email, phone, avatar, roleId } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'Username and password are required' },
        { status: 400 }
      );
    }

    const user = await createUser({
      username,
      password,
      email,
      phone,
      avatar,
      roleId
    });

    // 记录日志
    await createLog({
      module: 'user',
      action: 'CREATE',
      method: 'POST',
      url: request.url,
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent') || undefined,
      params: JSON.stringify({ username, email }),
      result: 'success',
      costTime: Date.now() - startTime,
      status: 1
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error('Failed to create user:', error);
    
    // 记录错误日志
    await createLog({
      module: 'user',
      action: 'CREATE',
      method: 'POST',
      url: request.url,
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      errorMsg: error instanceof Error ? error.message : 'Unknown error',
      costTime: Date.now() - startTime,
      status: 0
    });

    return NextResponse.json(
      { error: 'Internal Server Error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}


/**
 * PUT /api/users
 *
 * 更新指定 ID 的用户信息，并记录操作日志。
 *
 * @param request - Next.js 请求对象，body 须包含 id 字段及待更新字段
 * @returns 包含更新后用户记录的 JSON 响应
 */
export async function PUT(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body = await request.json();
    const { id, ...data } = body;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'User ID is required' },
        { status: 400 }
      );
    }

    const { updateUser } = await import('@/backend/services/userService');
    const { hashPassword } = await import('@/backend/services/authService');

    // 只取允许更新的字段，过滤掉 role 关联对象、时间戳等 Prisma 不接受的字段
    const updateData: any = {};
    if (data.username !== undefined) updateData.username = data.username;
    if (data.email !== undefined) updateData.email = data.email || null;
    if (data.phone !== undefined) updateData.phone = data.phone || null;
    if (data.avatar !== undefined) updateData.avatar = data.avatar || null;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.roleId !== undefined) updateData.roleId = data.roleId || null;
    // 密码不为空时才更新，且需要加密
    if (data.password && data.password.trim()) {
      updateData.password = await hashPassword(data.password);
    }

    const user = await updateUser(id, updateData);

    // 记录日志
    await createLog({
      module: 'user',
      action: 'UPDATE',
      method: 'PUT',
      url: request.url,
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent') || undefined,
      params: JSON.stringify({ id, ...data }),
      result: 'success',
      costTime: Date.now() - startTime,
      status: 1
    });

    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    console.error('Failed to update user:', error);
    
    // 记录错误日志
    await createLog({
      module: 'user',
      action: 'UPDATE',
      method: 'PUT',
      url: request.url,
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      errorMsg: error instanceof Error ? error.message : 'Unknown error',
      costTime: Date.now() - startTime,
      status: 0
    });

    return NextResponse.json(
      { error: 'Internal Server Error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/users?id={id}
 *
 * 删除指定 ID 的用户，并记录操作日志。
 *
 * @param request - Next.js 请求对象，查询参数须包含 id
 * @returns 操作结果的 JSON 响应
 */
export async function DELETE(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'User ID is required' },
        { status: 400 }
      );
    }

    const { deleteUser } = await import('@/backend/services/userService');
    await deleteUser(parseInt(id));

    // 记录日志
    await createLog({
      module: 'user',
      action: 'DELETE',
      method: 'DELETE',
      url: request.url,
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent') || undefined,
      params: JSON.stringify({ id }),
      result: 'success',
      costTime: Date.now() - startTime,
      status: 1
    });

    return NextResponse.json({ success: true, message: '删除成功' });
  } catch (error) {
    console.error('Failed to delete user:', error);
    
    // 记录错误日志
    await createLog({
      module: 'user',
      action: 'DELETE',
      method: 'DELETE',
      url: request.url,
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      errorMsg: error instanceof Error ? error.message : 'Unknown error',
      costTime: Date.now() - startTime,
      status: 0
    });

    return NextResponse.json(
      { error: 'Internal Server Error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
