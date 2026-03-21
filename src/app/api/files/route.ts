import { NextRequest, NextResponse } from 'next/server';
import { getFiles } from '@/backend/services/fileService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    
    const result = await getFiles(page, pageSize);
    return NextResponse.json(result);
  } catch (error) {
    console.error('获取文件列表失败:', error);
    return NextResponse.json(
      { success: false, message: '获取文件列表失败' },
      { status: 500 }
    );
  }
}
