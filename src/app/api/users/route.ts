import { NextRequest, NextResponse } from 'next/server';
import { getAllUsers, createUser } from '@/backend/services/userService';
import { createLog } from '@/backend/services/logService';

/**
 * GET /api/users
 * 获取用户列表
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
 * 创建用户
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
 * 更新用户
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
    const user = await updateUser(id, data);

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
 * DELETE /api/users
 * 删除用户
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
