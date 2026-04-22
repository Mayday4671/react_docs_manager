/**
 * @file RoleManagement.tsx
 * @description 系统角色管理页面，支持角色的新增、编辑、删除及统计概览展示
 * @module 系统管理
 */

import React, { useState, useEffect } from 'react';
import { 
  Table, Button, Space, Modal, Form, Input, message, 
  Tag, Popconfirm, Card, Row, Col, Statistic 
} from 'antd';
import { 
  TeamOutlined, PlusOutlined, EditOutlined, DeleteOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

const { TextArea } = Input;

/**
 * 角色数据结构
 */
interface Role {
  /** 角色唯一标识 */
  id: number;
  /** 角色显示名称 */
  roleName: string;
  /** 角色标识符，用于权限判断（仅小写字母和下划线） */
  roleKey: string;
  /** 角色描述信息 */
  description?: string;
  /** 状态：1-启用 0-禁用 */
  status: number;
  /** 创建时间（ISO 字符串） */
  createdAt: string;
  /** 关联统计数据 */
  _count?: {
    /** 该角色下的用户数量 */
    users: number;
  };
}

/**
 * 角色管理组件
 *
 * 提供系统角色的完整 CRUD 管理界面，顶部展示角色统计卡片，
 * 下方为角色列表表格，支持新增和编辑弹窗。
 */
const RoleManagement: React.FC = () => {
  /** 角色列表数据 */
  const [roles, setRoles] = useState<Role[]>([]);
  /** 表格加载状态 */
  const [loading, setLoading] = useState(false);
  /** 新增/编辑弹窗是否打开 */
  const [isModalOpen, setIsModalOpen] = useState(false);
  /** 当前正在编辑的角色，null 表示新增模式 */
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [form] = Form.useForm();

  /**
   * 获取角色列表
   * @returns Promise<void>
   */
  const fetchRoles = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/roles');
      const data = await response.json();
      setRoles(data.data || []);
    } catch (error) {
      message.error('获取角色列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  /**
   * 打开新增或编辑弹窗
   * @param role - 传入时为编辑模式，不传时为新增模式
   */
  const handleOpenModal = (role?: Role) => {
    if (role) {
      setEditingRole(role);
      form.setFieldsValue(role);
    } else {
      setEditingRole(null);
      form.resetFields();
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
      
      if (editingRole) {
        message.info('更新功能开发中...');
      } else {
        const response = await fetch('/api/roles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(values)
        });
        
        if (response.ok) {
          message.success('角色创建成功');
          setIsModalOpen(false);
          form.resetFields();
          fetchRoles();
        } else {
          message.error('角色创建失败');
        }
      }
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  /**
   * 删除指定角色
   * @param id - 要删除的角色 ID
   */
  const handleDelete = async (id: number) => {
    message.info('删除功能开发中...');
  };

  /** 表格列定义 */
  const columns: ColumnsType<Role> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '角色名称',
      dataIndex: 'roleName',
      key: 'roleName',
      render: (text) => (
        <Space>
          <TeamOutlined />
          <span>{text}</span>
        </Space>
      )
    },
    {
      title: '角色标识',
      dataIndex: 'roleKey',
      key: 'roleKey',
      render: (text) => <Tag color="blue">{text}</Tag>
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (text) => text || '-'
    },
    {
      title: '用户数',
      dataIndex: '_count',
      key: 'userCount',
      width: 100,
      render: (count) => count?.users || 0
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
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
      width: 180,
      render: (text) => new Date(text).toLocaleString('zh-CN')
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_, record) => (
        <Space>
          <Button 
            type="link" 
            size="small" 
            icon={<EditOutlined />}
            onClick={() => handleOpenModal(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个角色吗？"
            description="删除后该角色下的用户将失去角色关联"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button 
              type="link" 
              size="small" 
              danger
              icon={<DeleteOutlined />}
            >
              删除
            </Button>
          </Popconfirm>
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
              title="总角色数"
              value={roles.length}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="启用角色"
              value={roles.filter(r => r.status === 1).length}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="禁用角色"
              value={roles.filter(r => r.status === 0).length}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="总用户数"
              value={roles.reduce((sum, r) => sum + (r._count?.users || 0), 0)}
            />
          </Card>
        </Col>
      </Row>

      {/* 操作栏 */}
      <Card>
        <Space style={{ marginBottom: 16 }}>
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => handleOpenModal()}
          >
            新增角色
          </Button>
          <Button 
            icon={<ReloadOutlined />}
            onClick={() => fetchRoles()}
          >
            刷新
          </Button>
        </Space>

        {/* 角色表格 */}
        <Table
          columns={columns}
          dataSource={roles}
          rowKey="id"
          loading={loading}
        />
      </Card>

      {/* 新增/编辑弹窗 */}
      <Modal
        title={editingRole ? '编辑角色' : '新增角色'}
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
            label="角色名称"
            name="roleName"
            rules={[{ required: true, message: '请输入角色名称' }]}
          >
            <Input placeholder="请输入角色名称，如：管理员" />
          </Form.Item>

          <Form.Item
            label="角色标识"
            name="roleKey"
            rules={[
              { required: true, message: '请输入角色标识' },
              { pattern: /^[a-z_]+$/, message: '只能包含小写字母和下划线' }
            ]}
          >
            <Input placeholder="请输入角色标识，如：admin" />
          </Form.Item>

          <Form.Item
            label="描述"
            name="description"
          >
            <TextArea rows={3} placeholder="请输入角色描述" />
          </Form.Item>

          <Form.Item
            label="状态"
            name="status"
            initialValue={1}
          >
            <Space>
              <Button 
                type={form.getFieldValue('status') === 1 ? 'primary' : 'default'}
                onClick={() => form.setFieldValue('status', 1)}
              >
                启用
              </Button>
              <Button 
                type={form.getFieldValue('status') === 0 ? 'primary' : 'default'}
                onClick={() => form.setFieldValue('status', 0)}
              >
                禁用
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default RoleManagement;
