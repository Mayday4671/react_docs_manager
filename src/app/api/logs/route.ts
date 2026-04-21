import { NextRequest, NextResponse } from 'next/server';
import { getLogs, getLogStats } from '@/backend/services/logService';

/**
 * GET /api/logs
 * GET /api/logs?action=stats  → 获取统计数据
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    if (searchParams.get('action') === 'stats') {
      const stats = await getLogStats();
      return NextResponse.json({ success: true, data: stats });
    }

    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const module = searchParams.get('module') || undefined;
    const action = searchParams.get('action') || undefined;
    const userId = searchParams.get('userId') ? parseInt(searchParams.get('userId')!) : undefined;
    const status = searchParams.get('status') ? parseInt(searchParams.get('status')!) : undefined;

    const result = await getLogs({ page, pageSize, module, action, userId, status });
    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to fetch logs:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
