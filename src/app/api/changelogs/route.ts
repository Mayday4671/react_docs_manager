import { NextRequest, NextResponse } from 'next/server';
import { createChangelog, getChangelogs, updateChangelog, deleteChangelog } from '@/backend/services/changelogService';

export async function GET(request: NextRequest) {
  try {
    const changelogs = await getChangelogs();
    return NextResponse.json({
      success: true,
      data: changelogs
    });
  } catch (error) {
    console.error('获取更新日志列表失败:', error);
    return NextResponse.json(
      { success: false, message: '获取更新日志列表失败' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const changelog = await createChangelog(body);
    return NextResponse.json({
      success: true,
      data: changelog
    });
  } catch (error) {
    console.error('创建更新日志失败:', error);
    return NextResponse.json(
      { success: false, message: '创建更新日志失败' },
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
        { success: false, message: '缺少日志ID' },
        { status: 400 }
      );
    }
    
    const changelog = await updateChangelog(id, data);
    return NextResponse.json({
      success: true,
      data: changelog
    });
  } catch (error) {
    console.error('更新更新日志失败:', error);
    return NextResponse.json(
      { success: false, message: '更新更新日志失败' },
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
        { success: false, message: '缺少日志ID' },
        { status: 400 }
      );
    }
    
    await deleteChangelog(parseInt(id));
    return NextResponse.json({
      success: true,
      message: '删除成功'
    });
  } catch (error) {
    console.error('删除更新日志失败:', error);
    return NextResponse.json(
      { success: false, message: '删除更新日志失败' },
      { status: 500 }
    );
  }
}
