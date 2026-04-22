/**
 * @file route.ts
 * @description 个人信息 API 路由，支持修改个人资料和密码
 * @module 认证
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, updateProfile, changePassword } from '@/backend/services/authService';

/**
 * 从请求头中提取并验证 JWT Token。
 * @param request - Next.js 请求对象
 * @returns 解析后的载荷，无效时返回 null
 */
function getTokenPayload(request: NextRequest) {
  const auth = request.headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  return verifyToken(auth.slice(7));
}

/**
 * PUT /api/profile
 * 根据 action 字段执行不同操作：
 *   - action='update'          → 更新个人资料（email / phone / avatar）
 *   - action='change-password' → 修改密码（需验证旧密码）
 *
 * @param request - Next.js 请求对象，需携带 Authorization: Bearer <token>
 * @returns 操作结果
 */
export async function PUT(request: NextRequest) {
  try {
    const payload = getTokenPayload(request);
    if (!payload) {
      return NextResponse.json({ success: false, error: '未登录或 Token 已过期' }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    if (action === 'update') {
      const { email, phone, avatar } = body;
      const user = await updateProfile(payload.userId, { email, phone, avatar });
      return NextResponse.json({ success: true, data: user });
    }

    if (action === 'change-password') {
      const { oldPassword, newPassword } = body;
      if (!oldPassword || !newPassword) {
        return NextResponse.json({ success: false, error: '旧密码和新密码不能为空' }, { status: 400 });
      }
      if (newPassword.length < 6) {
        return NextResponse.json({ success: false, error: '新密码长度不能少于6位' }, { status: 400 });
      }
      const result = await changePassword(payload.userId, oldPassword, newPassword);
      if (result.error) {
        return NextResponse.json({ success: false, error: result.error }, { status: 400 });
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: '未知 action' }, { status: 400 });
  } catch (error: any) {
    console.error('[PUT /api/profile]', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
