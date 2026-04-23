/**
 * @file route.ts
 * @description 文件上传 API，支持图片上传，返回可访问的 URL
 * @module 文件管理
 */

import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

/** 允许上传的图片 MIME 类型 */
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
/** 最大文件大小：5MB */
const MAX_SIZE = 5 * 1024 * 1024;

/**
 * POST /api/upload
 *
 * 上传文件（multipart/form-data），返回文件访问 URL。
 * 支持 type 参数指定上传类型（avatar / file），不同类型存不同目录。
 *
 * @param request - Next.js 请求对象，body 为 multipart/form-data，包含 file 字段
 * @returns { success: true, url: string } 或错误信息
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const type = (formData.get('type') as string) || 'file';

    if (!file) {
      return NextResponse.json({ success: false, error: '未选择文件' }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ success: false, error: '只支持 JPG/PNG/GIF/WebP 格式' }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ success: false, error: '文件大小不能超过 5MB' }, { status: 400 });
    }

    // 生成唯一文件名
    const ext = file.name.split('.').pop() || 'jpg';
    const fileName = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const subDir = type === 'avatar' ? 'avatars' : 'files';
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', subDir);

    // 确保目录存在
    await mkdir(uploadDir, { recursive: true });

    // 写入文件
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(uploadDir, fileName), buffer);

    const url = `/uploads/${subDir}/${fileName}`;
    return NextResponse.json({ success: true, url });
  } catch (error: any) {
    console.error('[/api/upload]', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
