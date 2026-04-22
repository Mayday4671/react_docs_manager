/**
 * @file route.ts
 * @description 认证 API 路由，处理登录、注册、获取当前用户信息
 * @module 认证
 */

import { NextRequest, NextResponse } from 'next/server';
import { login, register, getMe, verifyToken } from '@/backend/services/authService';

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
 * GET /api/auth
 * 获取当前登录用户的完整信息（含角色、菜单权限、按钮权限）。
 * 需要在请求头携带 Authorization: Bearer <token>。
 *
 * @param request - Next.js 请求对象
 * @returns 用户信息、菜单树、权限标识列表
 */
export async function GET(request: NextRequest) {
  try {
    const payload = getTokenPayload(request);
    if (!payload) {
      return NextResponse.json({ success: false, error: '未登录或 Token 已过期' }, { status: 401 });
    }

    const data = await getMe(payload.userId);
    if (!data) {
      return NextResponse.json({ success: false, error: '用户不存在' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('[GET /api/auth]', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/auth
 * 根据 action 字段执行不同操作：
 *   - action='login'    → 用户登录
 *   - action='register' → 用户注册
 *
 * @param request - Next.js 请求对象，body 须包含 action 字段
 * @returns 登录/注册成功返回 { token, user }，失败返回错误信息
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'login') {
      const { username, password } = body;
      if (!username || !password) {
        return NextResponse.json({ success: false, error: '用户名和密码不能为空' }, { status: 400 });
      }
      const result = await login(username, password);
      if (result.error) {
        return NextResponse.json({ success: false, error: result.error }, { status: 401 });
      }
      return NextResponse.json({ success: true, data: result });
    }

    if (action === 'register') {
      const { username, password, email } = body;
      if (!username || !password) {
        return NextResponse.json({ success: false, error: '用户名和密码不能为空' }, { status: 400 });
      }
      if (password.length < 6) {
        return NextResponse.json({ success: false, error: '密码长度不能少于6位' }, { status: 400 });
      }
      const result = await register(username, password, email);
      if (result.error) {
        return NextResponse.json({ success: false, error: result.error }, { status: 400 });
      }
      return NextResponse.json({ success: true, data: result });
    }

    return NextResponse.json({ success: false, error: '未知 action' }, { status: 400 });
  } catch (error: any) {
    console.error('[POST /api/auth]', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
