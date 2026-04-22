/**
 * @file route.ts
 * @description 系统配置 CRUD API 路由，支持获取、创建、更新、删除操作
 * @module 系统管理 / 系统配置
 */

import { NextRequest, NextResponse } from 'next/server';
import { createConfig, getConfigs, updateConfig, deleteConfig } from '@/backend/services/configService';

/**
 * GET /api/configs
 *
 * 获取全部系统配置列表。
 *
 * @param request - Next.js 请求对象
 * @returns 包含配置数组的 JSON 响应
 */
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

/**
 * POST /api/configs
 *
 * 创建新的系统配置项。
 *
 * @param request - Next.js 请求对象，body 为配置数据 JSON
 * @returns 包含新建配置记录的 JSON 响应
 */
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

/**
 * PUT /api/configs
 *
 * 更新指定 ID 的系统配置。
 *
 * @param request - Next.js 请求对象，body 须包含 id 字段及待更新字段
 * @returns 包含更新后配置记录的 JSON 响应
 */
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

/**
 * DELETE /api/configs?id={id}
 *
 * 删除指定 ID 的系统配置。
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
