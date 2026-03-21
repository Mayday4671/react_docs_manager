import { NextRequest, NextResponse } from 'next/server';
import { createRole, getRoles, updateRole, deleteRole } from '@/backend/services/roleService';

export async function GET(request: NextRequest) {
  try {
    const roles = await getRoles();
    return NextResponse.json({
      success: true,
      data: roles
    });
  } catch (error) {
    console.error('获取角色列表失败:', error);
    return NextResponse.json(
      { success: false, message: '获取角色列表失败' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const role = await createRole(body);
    return NextResponse.json({
      success: true,
      data: role
    });
  } catch (error) {
    console.error('创建角色失败:', error);
    return NextResponse.json(
      { success: false, message: '创建角色失败' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...data } = body;
    
    if (!id) {
      return NextResponse.json(
        { success: false, message: '缺少角色ID' },
        { status: 400 }
      );
    }
    
    const role = await updateRole(id, data);
    return NextResponse.json({
      success: true,
      data: role
    });
  } catch (error) {
    console.error('更新角色失败:', error);
    return NextResponse.json(
      { success: false, message: '更新角色失败' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { success: false, message: '缺少角色ID' },
        { status: 400 }
      );
    }
    
    await deleteRole(parseInt(id));
    return NextResponse.json({
      success: true,
      message: '删除成功'
    });
  } catch (error) {
    console.error('删除角色失败:', error);
    return NextResponse.json(
      { success: false, message: '删除角色失败' },
      { status: 500 }
    );
  }
}
