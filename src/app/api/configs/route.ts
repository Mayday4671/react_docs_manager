import { NextRequest, NextResponse } from 'next/server';
import { createConfig, getConfigs, updateConfig, deleteConfig } from '@/backend/services/configService';

export async function GET(request: NextRequest) {
  try {
    const configs = await getConfigs();
    return NextResponse.json({
      success: true,
      data: configs
    });
  } catch (error) {
    console.error('获取配置列表失败:', error);
    return NextResponse.json(
      { success: false, message: '获取配置列表失败' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const config = await createConfig(body);
    return NextResponse.json({
      success: true,
      data: config
    });
  } catch (error) {
    console.error('创建配置失败:', error);
    return NextResponse.json(
      { success: false, message: '创建配置失败' },
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
        { success: false, message: '缺少配置ID' },
        { status: 400 }
      );
    }
    
    const config = await updateConfig(id, data);
    return NextResponse.json({
      success: true,
      data: config
    });
  } catch (error) {
    console.error('更新配置失败:', error);
    return NextResponse.json(
      { success: false, message: '更新配置失败' },
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
        { success: false, message: '缺少配置ID' },
        { status: 400 }
      );
    }
    
    await deleteConfig(parseInt(id));
    return NextResponse.json({
      success: true,
      message: '删除成功'
    });
  } catch (error) {
    console.error('删除配置失败:', error);
    return NextResponse.json(
      { success: false, message: '删除配置失败' },
      { status: 500 }
    );
  }
}