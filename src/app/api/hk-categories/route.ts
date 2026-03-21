import { NextRequest, NextResponse } from 'next/server';
import {
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory
} from '@/backend/services/hkApiService';

// GET - 获取所有分类
export async function GET() {
  try {
    const categories = await getAllCategories();
    return NextResponse.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('获取API分类失败:', error);
    return NextResponse.json(
      { success: false, message: '获取API分类失败' },
      { status: 500 }
    );
  }
}

// POST - 创建分类
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, icon, orderNum } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, message: '分类名称不能为空' },
        { status: 400 }
      );
    }

    const category = await createCategory({
      name,
      description,
      icon,
      orderNum: orderNum || 0
    });

    return NextResponse.json({
      success: true,
      data: category,
      message: '创建分类成功'
    });
  } catch (error) {
    console.error('创建API分类失败:', error);
    return NextResponse.json(
      { success: false, message: '创建API分类失败' },
      { status: 500 }
    );
  }
}

// PUT - 更新分类
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, message: '分类ID不能为空' },
        { status: 400 }
      );
    }

    const category = await updateCategory(id, updateData);

    return NextResponse.json({
      success: true,
      data: category,
      message: '更新分类成功'
    });
  } catch (error) {
    console.error('更新API分类失败:', error);
    return NextResponse.json(
      { success: false, message: '更新API分类失败' },
      { status: 500 }
    );
  }
}

// DELETE - 删除分类
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, message: '分类ID不能为空' },
        { status: 400 }
      );
    }

    await deleteCategory(parseInt(id));

    return NextResponse.json({
      success: true,
      message: '删除分类成功'
    });
  } catch (error) {
    console.error('删除API分类失败:', error);
    return NextResponse.json(
      { success: false, message: '删除API分类失败' },
      { status: 500 }
    );
  }
}