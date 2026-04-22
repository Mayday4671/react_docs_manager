/**
 * @file ProfilePage.tsx
 * @description 个人信息页面，支持查看和修改个人资料、修改密码
 * @module 认证
 */

'use client';

import React, { useState } from 'react';
import {
  Card, Form, Input, Button, Avatar, Typography, Space,
  Divider, Tag, App, Row, Col, theme,
} from 'antd';
import {
  UserOutlined, MailOutlined, PhoneOutlined, LockOutlined,
  EditOutlined, SaveOutlined, CloseOutlined,
} from '@ant-design/icons';
import { useAuth } from '@/frontend/context/AuthContext';
import { getToken } from '@/frontend/context/AuthContext';

const { Title, Text } = Typography;

/**
 * 个人信息页面组件。
 * 展示当前登录用户的基本信息，支持修改邮箱、手机号和密码。
 */
const ProfilePage: React.FC = () => {
  const { token } = theme.useToken();
  const { user, refreshUser } = useAuth();
  const { message: messageApi } = App.useApp();

  /** 是否处于编辑个人资料模式 */
  const [editingProfile, setEditingProfile] = useState(false);
  /** 是否处于修改密码模式 */
  const [editingPassword, setEditingPassword] = useState(false);
  /** 提交加载状态 */
  const [submitting, setSubmitting] = useState(false);

  const [profileForm] = Form.useForm();
  const [passwordForm] = Form.useForm();

  /**
   * 提交个人资料修改。
   * 调用 PUT /api/profile?action=update 接口。
   */
  const handleUpdateProfile = async (values: any) => {
    setSubmitting(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ action: 'update', ...values }),
      });
      const data = await res.json();
      if (data.success) {
        messageApi.success('个人资料已更新');
        setEditingProfile(false);
        await refreshUser();
      } else {
        messageApi.error(data.error || '更新失败');
      }
    } catch {
      messageApi.error('网络错误');
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * 提交密码修改。
   * 调用 PUT /api/profile?action=change-password 接口。
   */
  const handleChangePassword = async (values: any) => {
    setSubmitting(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ action: 'change-password', ...values }),
      });
      const data = await res.json();
      if (data.success) {
        messageApi.success('密码修改成功');
        setEditingPassword(false);
        passwordForm.resetFields();
      } else {
        messageApi.error(data.error || '修改失败');
      }
    } catch {
      messageApi.error('网络错误');
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <div style={{ maxWidth: 680, margin: '0 auto' }}>
      {/* 基本信息卡片 */}
      <Card
        title={
          <Space>
            <UserOutlined />
            <span>个人信息</span>
          </Space>
        }
        extra={
          !editingProfile ? (
            <Button
              type="text" icon={<EditOutlined />}
              onClick={() => {
                profileForm.setFieldsValue({ email: user.email, phone: user.phone });
                setEditingProfile(true);
              }}
            >
              编辑
            </Button>
          ) : (
            <Space>
              <Button icon={<CloseOutlined />} onClick={() => setEditingProfile(false)}>取消</Button>
              <Button type="primary" icon={<SaveOutlined />} loading={submitting} onClick={() => profileForm.submit()}>保存</Button>
            </Space>
          )
        }
        style={{ marginBottom: 16 }}
      >
        {/* 头像 + 用户名 + 角色 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24 }}>
          <Avatar
            size={72}
            src={user.avatar}
            icon={<UserOutlined />}
            style={{ background: token.colorPrimary, flexShrink: 0 }}
          />
          <div>
            <Title level={4} style={{ margin: 0 }}>{user.username}</Title>
            <Space style={{ marginTop: 4 }}>
              {user.role ? (
                <Tag color="blue">{user.role.roleName}</Tag>
              ) : (
                <Tag color="default">暂无角色</Tag>
              )}
              <Tag color={user.status === 1 ? 'success' : 'error'}>
                {user.status === 1 ? '正常' : '已禁用'}
              </Tag>
            </Space>
          </div>
        </div>

        <Divider style={{ margin: '0 0 20px' }} />

        {/* 查看模式 */}
        {!editingProfile && (
          <Row gutter={[16, 12]}>
            <Col span={12}>
              <Space>
                <MailOutlined style={{ color: token.colorTextTertiary }} />
                <Text type="secondary">邮箱：</Text>
                <Text>{user.email || '未设置'}</Text>
              </Space>
            </Col>
            <Col span={12}>
              <Space>
                <PhoneOutlined style={{ color: token.colorTextTertiary }} />
                <Text type="secondary">手机：</Text>
                <Text>{user.phone || '未设置'}</Text>
              </Space>
            </Col>
          </Row>
        )}

        {/* 编辑模式 */}
        {editingProfile && (
          <Form form={profileForm} onFinish={handleUpdateProfile} layout="vertical">
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="email" label="邮箱" rules={[{ type: 'email', message: '请输入有效邮箱' }]}>
                  <Input prefix={<MailOutlined />} placeholder="请输入邮箱" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="phone" label="手机号">
                  <Input prefix={<PhoneOutlined />} placeholder="请输入手机号" />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        )}
      </Card>

      {/* 修改密码卡片 */}
      <Card
        title={
          <Space>
            <LockOutlined />
            <span>修改密码</span>
          </Space>
        }
        extra={
          !editingPassword ? (
            <Button type="text" icon={<EditOutlined />} onClick={() => setEditingPassword(true)}>
              修改
            </Button>
          ) : (
            <Space>
              <Button icon={<CloseOutlined />} onClick={() => { setEditingPassword(false); passwordForm.resetFields(); }}>取消</Button>
              <Button type="primary" icon={<SaveOutlined />} loading={submitting} onClick={() => passwordForm.submit()}>保存</Button>
            </Space>
          )
        }
      >
        {!editingPassword ? (
          <Text type="secondary">点击「修改」按钮更改登录密码</Text>
        ) : (
          <Form form={passwordForm} onFinish={handleChangePassword} layout="vertical">
            <Form.Item name="oldPassword" label="当前密码" rules={[{ required: true, message: '请输入当前密码' }]}>
              <Input.Password prefix={<LockOutlined />} placeholder="请输入当前密码" />
            </Form.Item>
            <Form.Item name="newPassword" label="新密码" rules={[
              { required: true, message: '请输入新密码' },
              { min: 6, message: '密码至少6个字符' },
            ]}>
              <Input.Password prefix={<LockOutlined />} placeholder="请输入新密码（至少6位）" />
            </Form.Item>
            <Form.Item name="confirmPassword" label="确认新密码" dependencies={['newPassword']} rules={[
              { required: true, message: '请确认新密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) return Promise.resolve();
                  return Promise.reject(new Error('两次输入的密码不一致'));
                },
              }),
            ]}>
              <Input.Password prefix={<LockOutlined />} placeholder="请再次输入新密码" />
            </Form.Item>
          </Form>
        )}
      </Card>
    </div>
  );
};

export default ProfilePage;
