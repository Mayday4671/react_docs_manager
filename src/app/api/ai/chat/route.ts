/**
 * @file route.ts
 * @description AI 对话代理接口，支持 Chat（流式）和 Embedding 两种模式
 * @module AI对话
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAiConfigForRequest } from '@/backend/services/aiService';

/**
 * POST /api/ai/chat
 *
 * body:
 *   - configId: number        — AI 配置 ID
 *   - model: string           — 使用的模型名称
 *   - type: 'chat' | 'embedding'
 *   - messages: ChatMessage[] — type=chat 时必填
 *   - input: string           — type=embedding 时必填（待向量化的文本）
 *
 * Chat 模式返回 SSE 流；Embedding 模式返回 JSON。
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { configId, model, type = 'chat', messages, input } = body;

    if (!configId || !model) {
      return NextResponse.json({ success: false, error: '缺少 configId 或 model' }, { status: 400 });
    }

    const config = await getAiConfigForRequest(configId);

    // ── Embedding 模式 ──────────────────────────────────────
    if (type === 'embedding') {
      if (!input) return NextResponse.json({ success: false, error: '缺少 input' }, { status: 400 });

      const res = await fetch(`${config.baseUrl}/embeddings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${config.apiKey}` },
        body: JSON.stringify({ model, input }),
      });

      if (!res.ok) {
        const err = await res.text();
        return NextResponse.json({ success: false, error: `API 错误 ${res.status}: ${err}` }, { status: res.status });
      }

      const data = await res.json();
      const embedding = data?.data?.[0]?.embedding as number[] | undefined;
      const dim = embedding?.length ?? 0;

      return NextResponse.json({
        success: true,
        type: 'embedding',
        model,
        dimension: dim,
        // 只返回前 10 个维度预览，避免数据量过大
        preview: embedding?.slice(0, 10),
        usage: data?.usage,
      });
    }

    // ── Chat 流式模式 ────────────────────────────────────────
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ success: false, error: '缺少 messages' }, { status: 400 });
    }

    const upstream = await fetch(`${config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${config.apiKey}` },
      body: JSON.stringify({ model, messages, stream: true }),
    });

    if (!upstream.ok) {
      const err = await upstream.text();
      return NextResponse.json({ success: false, error: `API 错误 ${upstream.status}: ${err}` }, { status: upstream.status });
    }

    // 透传 SSE 流给前端
    return new Response(upstream.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (e: any) {
    console.error('[/api/ai/chat]', e);
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
