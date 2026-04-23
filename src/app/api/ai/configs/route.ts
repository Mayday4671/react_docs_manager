/**
 * @file route.ts
 * @description AI 模型配置 CRUD API，API Key 加密存储
 * @module AI对话
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAllAiConfigs, createAiConfig, updateAiConfig, deleteAiConfig } from '@/backend/services/aiService';

/**
 * GET /api/ai/configs — 获取所有 AI 模型配置（不含 API Key）
 */
export async function GET() {
  try {
    const data = await getAllAiConfigs();
    return NextResponse.json({ success: true, data });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

/**
 * POST /api/ai/configs — 创建 AI 模型配置
 * body: { name, provider, baseUrl, apiKey, models: string[], defaultModel? }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, provider, baseUrl, apiKey, models, defaultModel } = body;
    if (!name || !baseUrl || !apiKey) {
      return NextResponse.json({ success: false, error: '缺少必填字段' }, { status: 400 });
    }
    const data = await createAiConfig({ name, provider: provider || 'custom', baseUrl, apiKey, models: models || [], defaultModel });
    return NextResponse.json({ success: true, data });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

/**
 * PUT /api/ai/configs — 更新 AI 模型配置
 * body: { id, ...fields }，apiKey 为空则不更新
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...rest } = body;
    if (!id) return NextResponse.json({ success: false, error: '缺少 id' }, { status: 400 });
    await updateAiConfig(id, rest);
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

/**
 * DELETE /api/ai/configs?id=xxx — 删除 AI 模型配置
 */
export async function DELETE(request: NextRequest) {
  try {
    const id = parseInt(request.nextUrl.searchParams.get('id') || '');
    if (!id) return NextResponse.json({ success: false, error: '缺少 id' }, { status: 400 });
    await deleteAiConfig(id);
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
