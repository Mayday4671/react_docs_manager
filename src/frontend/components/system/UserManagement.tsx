/**
 * @file UserManagement.tsx
 * @description 系统用户管理页面，支持用户的新增、编辑、删除及分页列表展示
 * @module 系统管理
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Table, Button, Space, Modal, Form, Input, Select, App,
  Tag, Popconfirm, Card, Row, Col, Statistic, Avatar, Tooltip, Spin,
} from 'antd';
import { 
  UserOutlined, PlusOutlined, EditOutlined, DeleteOutlined,
  ReloadOutlined, CameraOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { usePermission } from '@/frontend/context/AuthContext';

/**
 * 用户数据结构
 */
interface User {
  /** 用户唯一标识 */
  id: number;
  /** 登录用户名 */
  username: string;
  /** 用户邮箱 */
  email?: string;
  /** 用户手机号 */
  phone?: string;
  /** 状态：1-启用 0-禁用 */
  status: number;
  /** 关联角色 ID */
  roleId?: number;
  /** 关联角色信息 */
  role?: {
    /** 角色显示名称 */
    roleName: string;
  };
  /** 创建时间（ISO 字符串） */
  createdAt: string;
}

/**
 * 用户管理组件
 *
 * 提供系统用户的完整 CRUD 管理界面，顶部展示用户统计卡片，
 * 下方为用户列表表格，支持分页、新增和编辑弹窗。
 */
const UserManagement: React.FC = () => {
  /** 用户列表数据 */
  const [users, setUsers] = useState<User[]>([]);
  /** 表格加载状态 */
  const [loading, setLoading] = useState(false);
  /** 新增/编辑弹窗是否打开 */
  const [isModalOpen, setIsModalOpen] = useState(false);
  /** 当前正在编辑的用户，null 表示新增模式 */
  const [editingUser, setEditingUser] = useState<User | null>(null);
  /** 分页配置：当前页、每页条数、总条数 */
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [form] = Form.useForm();

  /** 按钮权限 */
  const canAdd = usePermission('user:add');
  const canEdit = usePermission('user:edit');
  const canDelete = usePermission('user:delete');

  const { message } = App.useApp();

  /** 角色列表（用于下拉选择） */
  const [roles, setRoles] = useState<Array<{ id: number; roleName: string }>>([]);
  /** 头像上传加载状态 */
  const [avatarUploading, setAvatarUploading] = useState(false);
  /** 当前编辑用户的头像预览 URL */
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  /** 隐藏的文件输入 ref */
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/roles').then(r => r.json()).then(d => { if (d.data) setRoles(d.data); });
  }, []);

  /**
   * 上传头像文件，成功后更新预览和表单值
   * @param e - 文件输入变更事件
   */
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'avatar');
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.success) {
        setAvatarPreview(data.url);
        form.setFieldValue('avatar', data.url);
        message.success('头像上传成功');
      } else {
        message.error(data.error || '上传失败');
      }
    } catch {
      message.error('上传失败');
    } finally {
      setAvatarUploading(false);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };

  /**
   * 获取用户列表
   * @param page - 当前页码，默认第 1 页
   * @param pageSize - 每页条数，默认 10 条
   * @returns Promise<void>
   */
  const fetchUsers = async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/users?page=${page}&pageSize=${pageSize}`);
      const data = await response.json();
      setUsers(data.data);
      setPagination({
        current: data.page,
        pageSize: data.pageSize,
        total: data.total
      });
    } catch (error) {
      message.error('获取用户列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  /**
   * 打开新增或编辑弹窗
   * @param user - 传入时为编辑模式，不传时为新增模式
   */
  const handleOpenModal = (user?: User) => {
    if (user) {
      setEditingUser(user);
      const { ...rest } = user as any;
      form.setFieldsValue({ ...rest, password: '' });
      setAvatarPreview((user as any).avatar || '');
    } else {
      setEditingUser(null);
      form.resetFields();
      setAvatarPreview('');
    }
    setIsModalOpen(true);
  };

  /**
   * 提交新增或编辑表单
   * @returns Promise<void>
   */
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      if (editingUser) {
        const response = await fetch('/api/users', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingUser.id, ...values })
        });
        const data = await response.json();
        if (data.success) {
          message.success('用户更新成功');
          setIsModalOpen(false);
          fetchUsers();
        } else {
          message.error(data.message || '用户更新失败');
        }
      } else {
        const response = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(values)
        });
        const data = await response.json();
        if (data.success || response.ok) {
          message.success('用户创建成功');
          setIsModalOpen(false);
          form.resetFields();
          fetchUsers();
        } else {
          message.error(data.message || '用户创建失败');
        }
      }
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  /**
   * 删除指定用户
   * @param id - 要删除的用户 ID
   */
  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`/api/users?id=${id}`, { method: 'DELETE' });
      const data = await response.json();
      if (data.success) {
        message.success('用户删除成功');
        fetchUsers();
      } else {
        message.error(data.message || '用户删除失败');
      }
    } catch {
      message.error('用户删除失败');
    }
  };

  /** 表格列定义 */
  const columns: ColumnsType<User> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
      render: (text, record: any) => (
        <Space>
          <Avatar
            size={32}
            src={record.avatar}
            icon={<UserOutlined />}
            style={{ flexShrink: 0 }}
          />
          <span>{text}</span>
        </Space>
      )
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      render: (role) => role?.roleName || '-'
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 1 ? 'success' : 'error'}>
          {status === 1 ? '启用' : '禁用'}
        </Tag>
      )
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (text) => new Date(text).toLocaleString('zh-CN')
    },
    {
      title: '操作',
      key: 'action',
      width: 160,
      render: (_, record) => (
        <Space size={4}>
          {canEdit && (
            <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleOpenModal(record)}>编辑</Button>
          )}
          {canDelete && (
            <Popconfirm title="确定要删除这个用户吗？" onConfirm={() => handleDelete(record.id)} okText="确定" cancelText="取消">
              <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="总用户数"
              value={pagination.total}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="启用用户"
              value={users.filter(u => u.status === 1).length}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="禁用用户"
              value={users.filter(u => u.status === 0).length}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="今日新增"
              value={0}
            />
          </Card>
        </Col>
      </Row>

      {/* 操作栏 */}
      <Card>
        <Space style={{ marginBottom: 16 }}>
          {canAdd && (
            <Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpenModal()}>
              新增用户
            </Button>
          )}
          <Button icon={<ReloadOutlined />} onClick={() => fetchUsers()}
          >
            刷新
          </Button>
        </Space>

        {/* 用户表格 */}
        <Table
          columns={columns}
          dataSource={users}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条记录`,
            onChange: (page, pageSize) => fetchUsers(page, pageSize)
          }}
        />
      </Card>

      {/* 新增/编辑弹窗 */}
      <Modal
        title={editingUser ? '编辑用户' : '新增用户'}
        open={isModalOpen}
        onOk={handleSubmit}
        onCancel={() => {
          setIsModalOpen(false);
          form.resetFields();
        }}
        width={600}
        destroyOnHidden={false}
      >
        <Form
          form={form}
          layout="vertical"
          autoComplete="off"
        >
          <Form.Item
            label="用户名"
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="请输入用户名" />
          </Form.Item>

          <Form.Item
            label={editingUser ? '密码（不填则不修改）' : '密码'}
            name="password"
            rules={[
              { required: !editingUser, message: '请输入密码' },
              { min: 6, message: '密码至少6位' }
            ]}
          >
            <Input.Password placeholder={editingUser ? '不填则保持原密码不变' : '请输入密码'} />
          </Form.Item>

          <Form.Item
            label="邮箱"
            name="email"
            rules={[
              { type: 'email', message: '请输入有效的邮箱地址' }
            ]}
          >
            <Input placeholder="请输入邮箱" />
          </Form.Item>

          <Form.Item
            label="手机号"
            name="phone"
            rules={[
              { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号' }
            ]}
          >
            <Input placeholder="请输入手机号" />
          </Form.Item>

          <Form.Item label="头像" name="avatar">
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <Tooltip title="点击更换头像">
                <div style={{ position: 'relative', cursor: 'pointer' }}
                  onClick={() => avatarInputRef.current?.click()}>
                  <Spin spinning={avatarUploading}>
                    <Avatar
                      size={64}
                      src={avatarPreview || undefined}
                      icon={<UserOutlined />}
                      style={{ display: 'block' }}
                    />
                  </Spin>
                  <div style={{
                    position: 'absolute', inset: 0, borderRadius: '50%',
                    background: 'rgba(0,0,0,0.45)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    opacity: 0, transition: 'opacity 0.2s',
                  }}
                    onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                    onMouseLeave={e => (e.currentTarget.style.opacity = '0')}
                  >
                    <CameraOutlined style={{ color: '#fff', fontSize: 18 }} />
                  </div>
                </div>
              </Tooltip>
              <div>
                <Button size="small" onClick={() => avatarInputRef.current?.click()} loading={avatarUploading}>
                  上传头像
                </Button>
                <div style={{ fontSize: 11, color: '#999', marginTop: 4 }}>支持 JPG/PNG，最大 5MB</div>
              </div>
              <input ref={avatarInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarUpload} />
            </div>
          </Form.Item>

          <Form.Item label="角色" name="roleId">
            <Select placeholder="请选择角色" allowClear>
              {roles.map(r => (
                <Select.Option key={r.id} value={r.id}>{r.roleName}</Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="状态"
            name="status"
            initialValue={1}
          >
            <Select>
              <Select.Option value={1}>启用</Select.Option>
              <Select.Option value={0}>禁用</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default UserManagement;
