/**
 * @file LoginPage.tsx
 * @description 登录/注册页面组件，支持账号密码登录和新用户注册，登录成功后跳转主页
 * @module 认证
 */

'use client';

import React, { useState } from 'react';
import {
  Form, Input, Button, Typography, Tabs, App, theme, Divider,
} from 'antd';
import {
  UserOutlined, LockOutlined, MailOutlined, RobotOutlined,
} from '@ant-design/icons';
import { useAuth } from '@/frontend/context/AuthContext';
import { useTheme } from '@/frontend/context/ThemeContext';

const { Title, Text } = Typography;

/** 登录表单字段 */
interface LoginForm {
  /** 用户名 */
  username: string;
  /** 密码 */
  password: string;
}

/** 注册表单字段 */
interface RegisterForm {
  /** 用户名 */
  username: string;
  /** 密码 */
  password: string;
  /** 确认密码 */
  confirmPassword: string;
  /** 邮箱（可选） */
  email?: string;
}

/**
 * 登录/注册页面组件。
 * 未登录时由 LayOut 渲染此页面，登录成功后切换到主布局。
 */
const LoginPage: React.FC = () => {
  const { token } = theme.useToken();
  const { colorPrimary } = useTheme();
  const { login } = useAuth();
  const { message: messageApi } = App.useApp();

  /** 当前激活的 Tab：login-登录 register-注册 */
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  /** 提交加载状态 */
  const [submitting, setSubmitting] = useState(false);

  const [loginForm] = Form.useForm<LoginForm>();
  const [registerForm] = Form.useForm<RegisterForm>();

  /**
   * 处理登录表单提交。
   * 调用 /api/auth 登录接口，成功后保存 token 并触发 AuthContext 刷新。
   * @param values - 登录表单数据
   */
  const handleLogin = async (values: LoginForm) => {
    setSubmitting(true);
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', ...values }),
      });
      const data = await res.json();
      if (data.success) {
        await login(data.data.token);
        messageApi.success(`欢迎回来，${data.data.user.username}！`);
      } else {
        messageApi.error(data.error || '登录失败');
      }
    } catch {
      messageApi.error('网络错误，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * 处理注册表单提交。
   * 调用 /api/auth 注册接口，成功后自动登录。
   * @param values - 注册表单数据
   */
  const handleRegister = async (values: RegisterForm) => {
    setSubmitting(true);
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'register',
          username: values.username,
          password: values.password,
          email: values.email,
        }),
      });
      const data = await res.json();
      if (data.success) {
        await login(data.data.token);
        messageApi.success('注册成功，欢迎加入！');
      } else {
        messageApi.error(data.error || '注册失败');
      }
    } catch {
      messageApi.error('网络错误，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: `linear-gradient(135deg, ${colorPrimary}22 0%, ${token.colorBgLayout} 50%, ${colorPrimary}11 100%)`,
      padding: 24,
    }}>
      {/* 登录卡片 */}
      <div style={{
        width: '100%',
        maxWidth: 420,
        background: token.colorBgContainer,
        borderRadius: 16,
        padding: '40px 40px 32px',
        boxShadow: `0 20px 60px rgba(0,0,0,0.12), 0 0 0 1px ${token.colorBorderSecondary}`,
      }}>
        {/* Logo + 标题 */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: `linear-gradient(135deg, ${colorPrimary}, ${colorPrimary}bb)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
            boxShadow: `0 8px 24px ${colorPrimary}44`,
          }}>
            <RobotOutlined style={{ fontSize: 28, color: '#fff' }} />
          </div>
          <Title level={3} style={{ margin: 0, fontWeight: 700 }}>管理系统</Title>
          <Text type="secondary" style={{ fontSize: 13 }}>
            {activeTab === 'login' ? '登录您的账号' : '创建新账号'}
          </Text>
        </div>

        {/* Tab 切换 */}
        <Tabs
          activeKey={activeTab}
          onChange={k => setActiveTab(k as 'login' | 'register')}
          centered
          items={[
            { key: 'login', label: '登录' },
            { key: 'register', label: '注册' },
          ]}
          style={{ marginBottom: 24 }}
        />

        {/* 登录表单 */}
        {activeTab === 'login' && (
          <Form form={loginForm} onFinish={handleLogin} size="large" layout="vertical">
            <Form.Item name="username" rules={[{ required: true, message: '请输入用户名' }]}>
              <Input prefix={<UserOutlined style={{ color: token.colorTextTertiary }} />} placeholder="用户名" />
            </Form.Item>
            <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
              <Input.Password prefix={<LockOutlined style={{ color: token.colorTextTertiary }} />} placeholder="密码" />
            </Form.Item>
            <Form.Item style={{ marginBottom: 0 }}>
              <Button
                type="primary" htmlType="submit" block loading={submitting}
                style={{
                  height: 44, fontSize: 15, fontWeight: 600,
                  background: `linear-gradient(135deg, ${colorPrimary}, ${colorPrimary}cc)`,
                  border: 'none',
                  boxShadow: `0 4px 16px ${colorPrimary}44`,
                }}
              >
                登录
              </Button>
            </Form.Item>
          </Form>
        )}

        {/* 注册表单 */}
        {activeTab === 'register' && (
          <Form form={registerForm} onFinish={handleRegister} size="large" layout="vertical">
            <Form.Item name="username" rules={[
              { required: true, message: '请输入用户名' },
              { min: 3, message: '用户名至少3个字符' },
              { max: 20, message: '用户名最多20个字符' },
              { pattern: /^[a-zA-Z0-9_\u4e00-\u9fa5]+$/, message: '用户名只能包含字母、数字、下划线和中文' },
            ]}>
              <Input prefix={<UserOutlined style={{ color: token.colorTextTertiary }} />} placeholder="用户名" />
            </Form.Item>
            <Form.Item name="email" rules={[{ type: 'email', message: '请输入有效的邮箱地址' }]}>
              <Input prefix={<MailOutlined style={{ color: token.colorTextTertiary }} />} placeholder="邮箱（可选）" />
            </Form.Item>
            <Form.Item name="password" rules={[
              { required: true, message: '请输入密码' },
              { min: 6, message: '密码至少6个字符' },
            ]}>
              <Input.Password prefix={<LockOutlined style={{ color: token.colorTextTertiary }} />} placeholder="密码（至少6位）" />
            </Form.Item>
            <Form.Item name="confirmPassword" dependencies={['password']} rules={[
              { required: true, message: '请确认密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) return Promise.resolve();
                  return Promise.reject(new Error('两次输入的密码不一致'));
                },
              }),
            ]}>
              <Input.Password prefix={<LockOutlined style={{ color: token.colorTextTertiary }} />} placeholder="确认密码" />
            </Form.Item>
            <Form.Item style={{ marginBottom: 0 }}>
              <Button
                type="primary" htmlType="submit" block loading={submitting}
                style={{
                  height: 44, fontSize: 15, fontWeight: 600,
                  background: `linear-gradient(135deg, ${colorPrimary}, ${colorPrimary}cc)`,
                  border: 'none',
                  boxShadow: `0 4px 16px ${colorPrimary}44`,
                }}
              >
                注册
              </Button>
            </Form.Item>
          </Form>
        )}

        <Divider style={{ margin: '24px 0 16px' }} />
        <Text type="secondary" style={{ fontSize: 12, display: 'block', textAlign: 'center' }}>
          注册即表示同意系统使用条款
        </Text>
      </div>
    </div>
  );
};

export default LoginPage;
