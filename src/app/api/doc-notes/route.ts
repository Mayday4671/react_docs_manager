import { NextRequest, NextResponse } from 'next/server';
import { getDocNotes, getDocNoteById, createDocNote, updateDocNote, deleteDocNote } from '@/backend/services/docService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const categoryId = searchParams.get('categoryId');
    const keyword = searchParams.get('keyword');

    if (id) {
      const data = await getDocNoteById(parseInt(id));
      return NextResponse.json({ success: true, data });
    }

    const data = await getDocNotes(
      categoryId ? parseInt(categoryId) : undefined,
      keyword || undefined
    );
    return NextResponse.json({ success: true, data });
  } catch (e) {
    return NextResponse.json({ success: false, message: '获取笔记失败' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = await createDocNote(body);
    return NextResponse.json({ success: true, data });
  } catch (e) {
    return NextResponse.json({ success: false, message: '创建笔记失败' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...rest } = body;
    if (!id) return NextResponse.json({ success: false, message: '缺少ID' }, { status: 400 });
    const data = await updateDocNote(id, rest);
    return NextResponse.json({ success: true, data });
  } catch (e) {
    return NextResponse.json({ success: false, message: '更新笔记失败' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, message: '缺少ID' }, { status: 400 });
    await deleteDocNote(parseInt(id));
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ success: false, message: '删除笔记失败' }, { status: 500 });
  }
}
