/**
 * @file AuthContext.tsx
 * @description 认证上下文，管理当前登录用户信息、菜单权限和按钮权限。
 *              提供登录、登出、刷新用户信息等方法，以及权限检查 Hook。
 * @module 认证
 */

'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

/** 用户基本信息 */
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

/** 菜单项（树形结构） */
export interface AuthMenu {
  /** 菜单 ID */
  id: number;
  /** 菜单路由 key */
  key: string;
  /** 菜单显示名称 */
  label: string;
  /** 图标名称 */
  icon?: string;
  /** 父菜单 ID */
  parentId?: number | null;
  /** 排序号 */
  orderNum: number;
  /** 菜单类型：M-目录 C-菜单 */
  menuType: string;
  /** 子菜单列表 */
  children?: AuthMenu[];
}

/** 认证上下文类型 */
interface AuthContextType {
  /** 当前登录用户，未登录时为 null */
  user: AuthUser | null;
  /** 当前用户可访问的菜单树 */
  menus: AuthMenu[];
  /** 当前用户拥有的按钮权限标识集合，如 ['user:add', 'user:delete'] */
  perms: Set<string>;
  /** 是否正在初始化（首次加载 token 验证中） */
  loading: boolean;
  /** 是否已登录 */
  isLoggedIn: boolean;
  /**
   * 登录方法，将 token 存入 localStorage 并刷新用户信息。
   * @param token    - 服务端返回的 JWT Token
   * @param userData - 登录接口直接返回的用户数据，用于立即更新状态避免白屏
   */
  login: (token: string, userData?: AuthUser) => Promise<void>;
  /** 登出方法，清除 token 和用户信息 */
  logout: () => void;
  /** 刷新当前用户信息（token 不变，重新拉取权限） */
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

/** localStorage 中存储 token 的 key */
const TOKEN_KEY = 'auth_token';

/**
 * 认证上下文 Provider。
 * 应包裹在应用根组件，在 ThemeProvider 内部。
 *
 * @param children - 子组件
 */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  /** 当前登录用户信息 */
  const [user, setUser] = useState<AuthUser | null>(null);
  /** 当前用户可访问的菜单树 */
  const [menus, setMenus] = useState<AuthMenu[]>([]);
  /** 当前用户的按钮权限集合 */
  const [perms, setPerms] = useState<Set<string>>(new Set());
  /** 初始化加载状态 */
  const [loading, setLoading] = useState(true);

  /**
   * 从服务端拉取当前用户的完整权限信息。
   * 需要 localStorage 中存有有效 token。
   */
  const fetchUser = useCallback(async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      console.log('[AuthContext] fetchUser response:', data);

      if (data.success) {
        setUser(data.data.user);
        setMenus(data.data.menus);
        setPerms(new Set(data.data.perms));
      } else {
        // Token 无效或过期，清除本地存储
        localStorage.removeItem(TOKEN_KEY);
        setUser(null);
        setMenus([]);
        setPerms(new Set());
      }
    } catch {
      localStorage.removeItem(TOKEN_KEY);
    } finally {
      setLoading(false);
    }
  }, []);

  /** 组件挂载时自动验证本地 token */
  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  /**
   * 登录：保存 token 并拉取用户信息。
   * 直接用登录接口返回的用户数据先设置状态，再异步拉取完整权限信息。
   * @param token - 服务端返回的 JWT Token
   * @param userData - 登录接口直接返回的用户数据（可选，用于立即更新状态）
   */
  const login = async (token: string, userData?: AuthUser) => {
    localStorage.setItem(TOKEN_KEY, token);
    // 先用登录返回的基础用户数据立即更新，避免等待 fetchUser 的异步延迟
    if (userData) {
      setUser(userData);
    }
    await fetchUser();
  };

  /** 登出：清除 token 和所有用户状态 */
  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
    setMenus([]);
    setPerms(new Set());
  };

  /** 刷新用户信息（不改变 token） */
  const refreshUser = async () => {
    await fetchUser();
  };

  return (
    <AuthContext.Provider value={{
      user, menus, perms, loading,
      isLoggedIn: !!user,
      login, logout, refreshUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * 获取认证上下文 Hook。
 * @returns 认证上下文对象
 * @throws 在 AuthProvider 外部调用时抛出错误
 */
export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

/**
 * 权限检查 Hook，判断当前用户是否拥有指定按钮权限。
 *
 * @param perm - 权限标识，如 'user:add'、'log:delete'
 * @returns 有权限返回 true，否则返回 false
 *
 * @example
 * const canAdd = usePermission('user:add');
 * return canAdd ? <Button>新增</Button> : null;
 */
export function usePermission(perm: string): boolean {
  const { perms } = useAuth();
  return perms.has(perm);
}

/**
 * 获取存储在 localStorage 中的 JWT Token。
 * @returns token 字符串，不存在时返回 null
 */
export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}
