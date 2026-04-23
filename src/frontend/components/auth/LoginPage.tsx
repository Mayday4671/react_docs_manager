/**
 * @file LoginPage.tsx
 * @description 登录/注册页面，全屏科技背景 + 居中卡片，跟随主题色
 * @module 认证
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Form, Input, Button, Typography, Tabs, App, theme } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { useAuth } from '@/frontend/context/AuthContext';
import { useTheme } from '@/frontend/context/ThemeContext';

const { Title, Text } = Typography;

interface LoginForm { username: string; password: string; }
interface RegisterForm { username: string; password: string; confirmPassword: string; email?: string; }
interface Particle { id: number; x: number; y: number; vx: number; vy: number; size: number; opacity: number; }

/**
 * Canvas 粒子连线动画
 */
const TechCanvas: React.FC<{ color: string }> = ({ color }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    resize();
    window.addEventListener('resize', resize);

    particlesRef.current = Array.from({ length: 50 }, (_, i) => ({
      id: i, x: Math.random() * canvas.width, y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3,
      size: Math.random() * 1.5 + 0.5, opacity: Math.random() * 0.5 + 0.2,
    }));

    const hex = color.replace('#', '');
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const particles = particlesRef.current;

      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = canvas.width; if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height; if (p.y > canvas.height) p.y = 0;
      });

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 100) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(${r},${g},${b},${(1 - dist / 100) * 0.2})`;
            ctx.lineWidth = 0.6;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      particles.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r},${g},${b},${p.opacity})`;
        ctx.fill();
      });

      animRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => { cancelAnimationFrame(animRef.current); window.removeEventListener('resize', resize); };
  }, [color]);

  return <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />;
};

const LoginPage: React.FC = () => {
  const { token } = theme.useToken();
  const { colorPrimary, darkMode } = useTheme();
  const { login } = useAuth();
  const { message: messageApi } = App.useApp();

  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [submitting, setSubmitting] = useState(false);
  const [loginForm] = Form.useForm<LoginForm>();
  const [registerForm] = Form.useForm<RegisterForm>();

  const handleLogin = async (values: LoginForm) => {
    setSubmitting(true);
    try {
      const res = await fetch('/api/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'login', ...values }) });
      const data = await res.json();
      if (data.success) { await login(data.data.token, data.data.user); messageApi.success(`欢迎回来，${data.data.user.username}！`); }
      else messageApi.error(data.error || '登录失败');
    } catch { messageApi.error('网络错误'); } finally { setSubmitting(false); }
  };

  const handleRegister = async (values: RegisterForm) => {
    setSubmitting(true);
    try {
      const res = await fetch('/api/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'register', username: values.username, password: values.password, email: values.email }) });
      const data = await res.json();
      if (data.success) { await login(data.data.token, data.data.user); messageApi.success('注册成功！'); }
      else messageApi.error(data.error || '注册失败');
    } catch { messageApi.error('网络错误'); } finally { setSubmitting(false); }
  };

  const inputStyle = {
    borderRadius: 10, height: 44,
    background: 'rgba(255,255,255,0.06)',
    borderColor: 'rgba(255,255,255,0.15)',
    color: '#e2e8f0',
  };

  const labelStyle = { color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: 500 } as React.CSSProperties;

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      position: 'relative', overflow: 'hidden',
      background: 'linear-gradient(145deg, #0a0e1a 0%, #0d1526 40%, #0a1020 100%)',
    }}>
      {/* Canvas 粒子动画 */}
      <TechCanvas color={colorPrimary} />

      {/* 网格背景 - 极淡，仅作纹理 */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)',
        backgroundSize: '80px 80px',
      }} />

      {/* 装饰光晕 */}
      <div style={{
        position: 'absolute', top: '20%', left: '15%',
        width: 500, height: 500, borderRadius: '50%',
        background: `radial-gradient(circle, ${colorPrimary}18 0%, transparent 70%)`,
        filter: 'blur(80px)', pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '10%', right: '20%',
        width: 400, height: 400, borderRadius: '50%',
        background: `radial-gradient(circle, ${colorPrimary}12 0%, transparent 70%)`,
        filter: 'blur(60px)', pointerEvents: 'none',
      }} />

      {/* 登录卡片 - 永远用深色毛玻璃，不跟随系统亮暗模式 */}
      <div style={{
        position: 'relative', zIndex: 1,
        width: '100%', maxWidth: 440,
        background: 'rgba(15, 21, 36, 0.75)',
        borderRadius: 24,
        padding: '48px 44px',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: `1px solid rgba(255,255,255,0.06)`,
        boxShadow: `0 30px 80px rgba(0,0,0,0.5), 0 0 0 1px ${colorPrimary}22, 0 0 60px ${colorPrimary}18`,
      }}>
        {/* Logo + 标题 */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ position: 'relative', display: 'inline-block', marginBottom: 20 }}>
            <div style={{
              width: 72, height: 72, borderRadius: '50%',
              background: `linear-gradient(135deg, ${colorPrimary}, ${colorPrimary}dd)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: `0 12px 32px ${colorPrimary}55, inset 0 2px 8px rgba(255,255,255,0.2)`,
            }}>
              <ThunderboltOutlined style={{ fontSize: 36, color: '#fff' }} />
            </div>
            <div style={{
              position: 'absolute', inset: -6, borderRadius: '50%',
              border: `2px solid ${colorPrimary}44`,
              animation: 'pulse 2.5s ease-in-out infinite',
            }} />
          </div>
          <Title level={2} style={{ margin: '0 0 6px', fontWeight: 800, color: '#f0f6fc' }}>
            DDYB-系统
          </Title>
          <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
            {activeTab === 'login' ? '欢迎回来' : '创建您的账号'}
          </Text>
        </div>

        {/* Tab */}
        <Tabs
          activeKey={activeTab}
          onChange={k => setActiveTab(k as 'login' | 'register')}
          centered
          items={[{ key: 'login', label: '登录' }, { key: 'register', label: '注册' }]}
          style={{ marginBottom: 24 }}
          className="login-tabs"
        />

        {/* 登录表单 */}
        {activeTab === 'login' && (
          <Form form={loginForm} onFinish={handleLogin} layout="vertical"
            initialValues={{ username: 'admin', password: 'admin123' }}
          >
            <Form.Item name="username" label={<span style={labelStyle}>用户名</span>}
              rules={[{ required: true, message: '请输入用户名' }]}>
              <Input size="large" prefix={<UserOutlined style={{ color: colorPrimary }} />} placeholder="请输入用户名" style={inputStyle} />
            </Form.Item>
            <Form.Item name="password" label={<span style={labelStyle}>密码</span>}
              rules={[{ required: true, message: '请输入密码' }]}>
              <Input.Password size="large" prefix={<LockOutlined style={{ color: colorPrimary }} />} placeholder="请输入密码" style={inputStyle} />
            </Form.Item>
            <Form.Item style={{ marginTop: 28, marginBottom: 0 }}>
              <Button
                type="primary" htmlType="submit" block size="large" loading={submitting}
                style={{
                  height: 48, fontSize: 15, fontWeight: 700, borderRadius: 12, border: 'none',
                  background: `linear-gradient(135deg, ${colorPrimary}, ${colorPrimary}cc)`,
                  boxShadow: `0 6px 24px ${colorPrimary}44`,
                  transition: 'all 0.25s',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 10px 32px ${colorPrimary}55`; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = `0 6px 24px ${colorPrimary}44`; }}
              >
                登录
              </Button>
            </Form.Item>
          </Form>
        )}

        {/* 注册表单 */}
        {activeTab === 'register' && (
          <Form form={registerForm} onFinish={handleRegister} layout="vertical">
            {[
              { name: 'username', label: '用户名', placeholder: '请输入用户名', icon: <UserOutlined style={{ color: colorPrimary }} />, type: 'text',
                rules: [{ required: true, message: '请输入用户名' }, { min: 3, message: '至少3个字符' }, { pattern: /^[a-zA-Z0-9_\u4e00-\u9fa5]+$/, message: '只能包含字母、数字、下划线和中文' }] },
              { name: 'email', label: '邮箱（可选）', placeholder: '请输入邮箱', icon: <MailOutlined style={{ color: colorPrimary }} />, type: 'text',
                rules: [{ type: 'email' as const, message: '请输入有效邮箱' }] },
              { name: 'password', label: '密码', placeholder: '至少6位', icon: <LockOutlined style={{ color: colorPrimary }} />, type: 'password',
                rules: [{ required: true, message: '请输入密码' }, { min: 6, message: '至少6个字符' }] },
              { name: 'confirmPassword', label: '确认密码', placeholder: '再次输入密码', icon: <LockOutlined style={{ color: colorPrimary }} />, type: 'password',
                rules: [{ required: true, message: '请确认密码' }, ({ getFieldValue }: any) => ({ validator(_: any, value: string) { if (!value || getFieldValue('password') === value) return Promise.resolve(); return Promise.reject(new Error('两次密码不一致')); } })] },
            ].map(field => (
              <Form.Item key={field.name} name={field.name}
                label={<span style={labelStyle}>{field.label}</span>}
                rules={field.rules as any}
              >
                {field.type === 'password'
                  ? <Input.Password size="large" prefix={field.icon} placeholder={field.placeholder} style={inputStyle} />
                  : <Input size="large" prefix={field.icon} placeholder={field.placeholder} style={inputStyle} />
                }
              </Form.Item>
            ))}
            <Form.Item style={{ marginTop: 28, marginBottom: 0 }}>
              <Button
                type="primary" htmlType="submit" block size="large" loading={submitting}
                style={{
                  height: 48, fontSize: 15, fontWeight: 700, borderRadius: 12, border: 'none',
                  background: `linear-gradient(135deg, ${colorPrimary}, ${colorPrimary}cc)`,
                  boxShadow: `0 6px 24px ${colorPrimary}44`,
                  transition: 'all 0.25s',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 10px 32px ${colorPrimary}55`; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = `0 6px 24px ${colorPrimary}44`; }}
              >
                注册
              </Button>
            </Form.Item>
          </Form>
        )}

        <Text style={{ display: 'block', textAlign: 'center', marginTop: 24, fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
          注册即表示同意系统使用条款
        </Text>
      </div>

      <style>{`
        @keyframes pulse { 0%, 100% { transform: scale(1); opacity: 0.5; } 50% { transform: scale(1.15); opacity: 0.3; } }
        .login-tabs .ant-tabs-tab { color: rgba(255,255,255,0.45) !important; }
        .login-tabs .ant-tabs-tab:hover { color: rgba(255,255,255,0.75) !important; }
        .login-tabs .ant-tabs-tab-active .ant-tabs-tab-btn { color: ${colorPrimary} !important; }
        .login-tabs .ant-tabs-ink-bar { background: ${colorPrimary} !important; }
        .login-tabs .ant-tabs-nav::before { border-color: rgba(255,255,255,0.08) !important; }
      `}</style>
    </div>
  );
};

export default LoginPage;
