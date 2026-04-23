/**
 * @file authService.ts
 * @description 认证服务层，处理登录、注册、JWT 签发/验证及用户权限查询
 * @module 认证
 */

import { prisma } from '../database/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

/** JWT 载荷结构 */
export interface JwtPayload {
  /** 用户 ID */
  userId: number;
  /** 用户名 */
  username: string;
  /** 角色 ID，无角色时为 null */
  roleId: number | null;
}

/** 登录响应中的用户信息 */
export interface AuthUser {
  /** 用户 ID */
  id: number;
  /** 用户名 */
  username: string;
  /** 邮箱 */
  email: string | null;
  /** 手机号 */
  phone: string | null;
  /** 头像 URL */
  avatar: string | null;
  /** 账号状态：1-启用 0-禁用 */
  status: number;
  /** 角色信息，无角色时为 null */
  role: { id: number; roleName: string; roleKey: string } | null;
}

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-change-me';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * 对明文密码进行 bcrypt 哈希加密。
 * @param password - 明文密码
 * @returns 哈希后的密码字符串
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

/**
 * 验证明文密码与哈希密码是否匹配。
 * @param password - 明文密码
 * @param hash     - 数据库中存储的哈希密码
 * @returns 匹配返回 true，否则返回 false
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * 签发 JWT Token。
 * @param payload - JWT 载荷（userId / username / roleId）
 * @returns 签名后的 JWT 字符串
 */
export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions);
}

/**
 * 验证并解析 JWT Token。
 * @param token - 待验证的 JWT 字符串
 * @returns 解析后的载荷，验证失败时返回 null
 */
export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}

/**
 * 用户登录。
 * 验证用户名和密码，成功后返回 JWT Token 和用户信息。
 *
 * @param username - 登录用户名
 * @param password - 明文密码
 * @returns 登录成功返回 { token, user }，失败返回 { error }
 */
export async function login(username: string, password: string) {
  const user = await prisma.sysUser.findUnique({
    where: { username },
    include: { role: { select: { id: true, roleName: true, roleKey: true } } },
  });

  if (!user) return { error: '用户名或密码错误' };
  if (user.status === 0) return { error: '账号已被禁用，请联系管理员' };

  const valid = await verifyPassword(password, user.password);
  if (!valid) return { error: '用户名或密码错误' };

  const token = signToken({ userId: user.id, username: user.username, roleId: user.roleId });

  const authUser: AuthUser = {
    id: user.id,
    username: user.username,
    email: user.email,
    phone: user.phone,
    avatar: user.avatar,
    status: user.status,
    role: user.role,
  };

  return { token, user: authUser };
}

/**
 * 用户注册。
 * 检查用户名和邮箱唯一性，密码加密后创建用户。
 * 新注册用户默认无角色（roleId = null）。
 *
 * @param username - 用户名
 * @param password - 明文密码
 * @param email    - 邮箱（可选）
 * @returns 注册成功返回 { token, user }，失败返回 { error }
 */
export async function register(username: string, password: string, email?: string) {
  // 检查用户名唯一性
  const existUser = await prisma.sysUser.findUnique({ where: { username } });
  if (existUser) return { error: '用户名已存在' };

  // 检查邮箱唯一性
  if (email) {
    const existEmail = await prisma.sysUser.findUnique({ where: { email } });
    if (existEmail) return { error: '邮箱已被注册' };
  }

  const hashedPassword = await hashPassword(password);
  const user = await prisma.sysUser.create({
    data: { username, password: hashedPassword, email: email || null },
    include: { role: { select: { id: true, roleName: true, roleKey: true } } },
  });

  const token = signToken({ userId: user.id, username: user.username, roleId: user.roleId });

  const authUser: AuthUser = {
    id: user.id,
    username: user.username,
    email: user.email,
    phone: user.phone,
    avatar: user.avatar,
    status: user.status,
    role: user.role,
  };

  return { token, user: authUser };
}

/**
 * 获取当前登录用户的完整权限信息。
 * 包含用户基本信息、角色、可访问菜单列表和按钮权限标识集合。
 *
 * @param userId - 用户 ID
 * @returns 用户权限信息对象，用户不存在时返回 null
 */
export async function getMe(userId: number) {
  const user = await prisma.sysUser.findUnique({
    where: { id: userId },
    include: { role: { select: { id: true, roleName: true, roleKey: true } } },
  });

  if (!user) return null;

  // 无角色用户：只能看到首页
  if (!user.roleId) {
    return {
      user: {
        id: user.id, username: user.username, email: user.email,
        phone: user.phone, avatar: user.avatar, status: user.status, role: null,
      },
      menus: [],
      perms: [] as string[],
    };
  }

  // 查询角色拥有的所有菜单（含按钮权限）
  const roleMenus = await prisma.sysRoleMenu.findMany({
    where: { roleId: user.roleId },
    include: {
      menu: {
        select: {
          id: true, key: true, label: true, icon: true, path: true,
          component: true, parentId: true, orderNum: true, menuType: true,
          visible: true, perms: true, status: true,
        },
      },
    },
  });

  const allMenus = roleMenus
    .map(rm => rm.menu)
    .filter(m => m.status === 1); // 过滤禁用菜单

  // 分离菜单（M/C）和按钮权限（F）
  const menus = allMenus.filter(m => m.menuType !== 'F' && m.visible === 1);
  const perms = allMenus
    .filter(m => m.menuType === 'F' && m.perms)
    .map(m => m.perms as string);

  // 构建树形菜单结构
  const menuTree = buildMenuTree(menus);

  return {
    user: {
      id: user.id, username: user.username, email: user.email,
      phone: user.phone, avatar: user.avatar, status: user.status,
      role: user.role,
    },
    menus: menuTree,
    perms,
  };
}

/**
 * 将扁平菜单列表构建为树形结构。
 * @param menus - 扁平菜单列表
 * @returns 树形菜单数组（顶级菜单 + 嵌套子菜单）
 */
function buildMenuTree(menus: any[]): any[] {
  const map = new Map<number, any>();
  menus.forEach(m => map.set(m.id, { ...m, children: [] }));

  const roots: any[] = [];
  map.forEach(m => {
    if (m.parentId && map.has(m.parentId)) {
      map.get(m.parentId).children.push(m);
    } else {
      roots.push(m);
    }
  });

  // 按 orderNum 排序
  const sort = (items: any[]) => {
    items.sort((a, b) => a.orderNum - b.orderNum);
    items.forEach(item => { if (item.children?.length) sort(item.children); });
    return items;
  };

  return sort(roots);
}

/**
 * 更新用户个人信息（不含密码）。
 * @param userId - 用户 ID
 * @param data   - 要更新的字段
 * @returns 更新后的用户信息
 */
export async function updateProfile(userId: number, data: {
  email?: string;
  phone?: string;
  avatar?: string;
}) {
  return prisma.sysUser.update({
    where: { id: userId },
    data,
    select: { id: true, username: true, email: true, phone: true, avatar: true, status: true },
  });
}

/**
 * 修改用户密码。
 * 验证旧密码正确后才允许修改。
 *
 * @param userId      - 用户 ID
 * @param oldPassword - 旧密码（明文）
 * @param newPassword - 新密码（明文）
 * @returns 成功返回 { success: true }，失败返回 { error }
 */
export async function changePassword(userId: number, oldPassword: string, newPassword: string) {
  const user = await prisma.sysUser.findUnique({ where: { id: userId } });
  if (!user) return { error: '用户不存在' };

  const valid = await verifyPassword(oldPassword, user.password);
  if (!valid) return { error: '旧密码错误' };

  const hashed = await hashPassword(newPassword);
  await prisma.sysUser.update({ where: { id: userId }, data: { password: hashed } });
  return { success: true };
}

/**
 * 为角色批量设置菜单权限（先清空再写入）。
 * @param roleId  - 角色 ID
 * @param menuIds - 要授权的菜单 ID 列表
 */
export async function setRoleMenus(roleId: number, menuIds: number[]) {
  await prisma.sysRoleMenu.deleteMany({ where: { roleId } });
  if (menuIds.length > 0) {
    await prisma.sysRoleMenu.createMany({
      data: menuIds.map(menuId => ({ roleId, menuId })),
    });
  }
}

/**
 * 获取角色已拥有的菜单 ID 列表。
 * @param roleId - 角色 ID
 * @returns 菜单 ID 数组
 */
export async function getRoleMenuIds(roleId: number): Promise<number[]> {
  const records = await prisma.sysRoleMenu.findMany({
    where: { roleId },
    select: { menuId: true },
  });
  return records.map(r => r.menuId);
}
