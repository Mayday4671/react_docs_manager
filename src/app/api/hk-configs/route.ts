import { NextRequest, NextResponse } from 'next/server';
import {
  getAllConfigs,
  getDefaultConfig,
  getConfigById,
  createConfig,
  updateConfig,
  deleteConfig,
  setDefaultConfig
} from '@/backend/services/hkApiConfigService';

// GET - 获取配置列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const action = searchParams.get('action');

    // 获取默认配置
    if (action === 'default') {
      const config = await getDefaultConfig();
      return NextResponse.json({
        success: true,
        data: config
      });
    }

    // 获取单个配置
    if (id) {
      const config = await getConfigById(parseInt(id));
      if (!config) {
        return NextResponse.json(
          { success: false, message: '配置不存在' },
          { status: 404 }
        );
      }
      return NextResponse.json({
        success: true,
        data: config
      });
    }

    // 获取所有配置
    const configs = await getAllConfigs();
    return NextResponse.json({
      success: true,
      data: configs
    });
  } catch (error) {
    console.error('获取配置失败:', error);
    return NextResponse.json(
      { success: false, message: '获取配置失败' },
      { status: 500 }
    );
  }
}

// POST - 创建配置
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('收到的请求数据:', body);
    
    const { action, id, ...configData } = body;

    // 设置默认配置
    if (action === 'set-default') {
      if (!id) {
        return NextResponse.json(
          { success: false, message: '配置ID不能为空' },
          { status: 400 }
        );
      }
      
      const config = await setDefaultConfig(id);
      return NextResponse.json({
        success: true,
        data: config,
        message: '设置默认配置成功'
      });
    }

    // 创建配置
    const { name, baseUrl, appKey, appSecret } = configData;
    
    console.log('解析的配置数据:', { name, baseUrl, appKey, appSecret });

    if (!name || !baseUrl || !appKey || !appSecret) {
      console.log('验证失败:', { 
        hasName: !!name, 
        hasBaseUrl: !!baseUrl, 
        hasAppKey: !!appKey, 
        hasAppSecret: !!appSecret 
      });
      return NextResponse.json(
        { success: false, message: '配置名称、目标地址、AppKey和AppSecret不能为空' },
        { status: 400 }
      );
    }

    console.log('开始创建配置...');
    const config = await createConfig(configData);
    console.log('配置创建成功:', config);

    return NextResponse.json({
      success: true,
      data: config,
      message: '创建配置成功'
    });
  } catch (error: any) {
    console.error('创建配置失败:', error);
    console.error('错误堆栈:', error.stack);
    return NextResponse.json(
      { success: false, message: `创建配置失败: ${error.message}` },
      { status: 500 }
    );
  }
}

// PUT - 更新配置
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, message: '配置ID不能为空' },
        { status: 400 }
      );
    }

    const config = await updateConfig(id, updateData);

    return NextResponse.json({
      success: true,
      data: config,
      message: '更新配置成功'
    });
  } catch (error) {
    console.error('更新配置失败:', error);
    return NextResponse.json(
      { success: false, message: '更新配置失败' },
      { status: 500 }
    );
  }
}

// DELETE - 删除配置
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, message: '配置ID不能为空' },
        { status: 400 }
      );
    }

    await deleteConfig(parseInt(id));

    return NextResponse.json({
      success: true,
      message: '删除配置成功'
    });
  } catch (error) {
    console.error('删除配置失败:', error);
    return NextResponse.json(
      { success: false, message: '删除配置失败' },
      { status: 500 }
    );
  }
}
