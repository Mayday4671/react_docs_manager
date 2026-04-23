/**
 * @file RoleManagement.tsx
 * @description 系统角色管理页面，支持角色的增删改查及菜单权限树配置
 * @module 系统管理
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Table, Button, Space, Modal, Form, Input, Tag, Popconfirm,
  Card, Row, Col, Statistic, Tree, App, theme, Tabs, Switch,
} from 'antd';
import {
  TeamOutlined, PlusOutlined, EditOutlined, DeleteOutlined,
  ReloadOutlined, SafetyOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

const { TextArea } = Input;
const { useToken } = theme;

/**
 * 角色数据结构
 */
interface Role {
  /** 角色唯一标识 */
  id: number;
  /** 角色显示名称 */
  roleName: string;
  /** 角色标识符（仅小写字母和下划线） */
  roleKey: string;
  /** 角色描述 */
  description?: string;
  /** 状态：1-启用 0-禁用 */
  status: number;
  /** 创建时间 */
  createdAt: string;
  /** 关联统计 */
  _count?: { users: number };
}

/**
 * 菜单树节点（用于权限配置）
 */
interface MenuNode {
  /** 菜单 ID */
  id: number;
  /** 菜单 key */
  key: string;
  /** 菜单名称 */
  label: string;
  /** 菜单类型：M-目录 C-菜单 F-按钮 */
  menuType: string;
  /** 按钮权限标识 */
  perms?: string;
  /** 子菜单 */
  children?: MenuNode[];
}

/**
 * 将菜单树转换为 antd Tree 所需的 DataNode 格式
 * @param nodes - 菜单节点列表
 * @returns antd Tree DataNode 数组
 */
function toTreeData(nodes: MenuNode[]): any[] {
  return nodes.map(n => ({
    title: (
      <span>
        {n.label}
        {n.menuType === 'F' && n.perms && (
          <Tag color="orange" style={{ marginLeft: 6, fontSize: 10 }}>{n.perms}</Tag>
        )}
      </span>
    ),
    key: n.id,
    children: n.children?.length ? toTreeData(n.children) : undefined,
  }));
}

/**
 * 递归收集树节点所有 key（用于全选）
 * @param nodes - 菜单节点列表
 * @returns 所有节点 ID 数组
 */
function collectAllKeys(nodes: MenuNode[]): number[] {
  const keys: number[] = [];
  const walk = (list: MenuNode[]) => {
    list.forEach(n => { keys.push(n.id); if (n.children) walk(n.children); });
  };
  walk(nodes);
  return keys;
}

/**
 * 角色管理组件
 *
 * 提供角色的增删改查，以及通过菜单权限树为角色分配菜单和按钮权限。
 */
const RoleManagement: React.FC = () => {
  const { token } = useToken();
  const { message: messageApi } = App.useApp();

  /** 角色列表 */
  const [roles, setRoles] = useState<Role[]>([]);
  /** 表格加载状态 */
  const [loading, setLoading] = useState(false);
  /** 新增/编辑弹窗是否打开 */
  const [modalOpen, setModalOpen] = useState(false);
  /** 当前编辑的角色，null 表示新增 */
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  /** 权限配置弹窗是否打开 */
  const [permModalOpen, setPermModalOpen] = useState(false);
  /** 当前配置权限的角色 */
  const [permRole, setPermRole] = useState<Role | null>(null);
  /** 全量菜单树（用于权限配置） */
  const [menuTree, setMenuTree] = useState<MenuNode[]>([]);
  /** 当前角色已选中的菜单 ID 列表 */
  const [checkedKeys, setCheckedKeys] = useState<number[]>([]);
  /** 权限保存加载状态 */
  const [permSaving, setPermSaving] = useState(false);

  const [form] = Form.useForm();

  /**
   * 获取角色列表
   */
  const fetchRoles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/roles');
      const data = await res.json();
      setRoles(data.data || []);
    } catch {
      messageApi.error('获取角色列表失败');
    } finally {
      setLoading(false);
    }
  }, [messageApi]);

  /**
   * 获取全量菜单树（管理员视角，含所有菜单和按钮）
   */
  const fetchMenuTree = useCallback(async () => {
    try {
      const res = await fetch('/api/menu?admin=1');
      const data = await res.json();
      if (data.success) setMenuTree(data.data);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    fetchRoles();
    fetchMenuTree();
  }, [fetchRoles, fetchMenuTree]);

  /**
   * 打开新增/编辑弹窗
   * @param role - 传入时为编辑模式
   */
  const handleOpenModal = (role?: Role) => {
    if (role) {
      setEditingRole(role);
      form.setFieldsValue({ ...role });
    } else {
      setEditingRole(null);
      form.resetFields();
      form.setFieldValue('status', 1);
    }
    setModalOpen(true);
  };

  /**
   * 提交新增/编辑表单
   */
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const method = editingRole ? 'PUT' : 'POST';
      const body = editingRole ? { id: editingRole.id, ...values } : values;

      const res = await fetch('/api/roles', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (data.success) {
        messageApi.success(editingRole ? '更新成功' : '创建成功');
        setModalOpen(false);
        fetchRoles();
      } else {
        messageApi.error(data.message || '操作失败');
      }
    } catch { /* 表单校验失败 */ }
  };

  /**
   * 删除角色
   * @param id - 角色 ID
   */
  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/roles?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        messageApi.success('删除成功');
        fetchRoles();
      } else {
        messageApi.error(data.message || '删除失败');
      }
    } catch {
      messageApi.error('删除失败');
    }
  };

  /**
   * 打开权限配置弹窗，加载该角色已有的菜单权限
   * @param role - 要配置权限的角色
   */
  const handleOpenPerm = async (role: Role) => {
    setPermRole(role);
    setPermModalOpen(true);
    try {
      const res = await fetch(`/api/role-menus?roleId=${role.id}`);
      const data = await res.json();
      if (data.success) setCheckedKeys(data.data);
    } catch { /* ignore */ }
  };

  /**
   * 保存角色菜单权限
   */
  const handleSavePerm = async () => {
    if (!permRole) return;
    setPermSaving(true);
    try {
      const res = await fetch('/api/role-menus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roleId: permRole.id, menuIds: checkedKeys }),
      });
      const data = await res.json();
      if (data.success) {
        messageApi.success('权限保存成功');
        setPermModalOpen(false);
      } else {
        messageApi.error('保存失败');
      }
    } catch {
      messageApi.error('保存失败');
    } finally {
      setPermSaving(false);
    }
  };

  /** 全选所有菜单 */
  const handleCheckAll = () => setCheckedKeys(collectAllKeys(menuTree));
  /** 清空所有选中 */
  const handleUncheckAll = () => setCheckedKeys([]);

  /** 表格列定义 */
  const columns: ColumnsType<Role> = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 70 },
    {
      title: '角色名称', dataIndex: 'roleName', key: 'roleName',
      render: text => <Space><TeamOutlined /><span>{text}</span></Space>,
    },
    {
      title: '角色标识', dataIndex: 'roleKey', key: 'roleKey',
      render: text => <Tag color="blue">{text}</Tag>,
    },
    { title: '描述', dataIndex: 'description', key: 'description', ellipsis: true, render: t => t || '-' },
    { title: '用户数', dataIndex: '_count', key: 'userCount', width: 80, render: c => c?.users || 0 },
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 90,
      render: status => <Tag color={status === 1 ? 'success' : 'error'}>{status === 1 ? '启用' : '禁用'}</Tag>,
    },
    {
      title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 170,
      render: t => new Date(t).toLocaleString('zh-CN'),
    },
    {
      title: '操作', key: 'action', width: 200, fixed: 'right',
      render: (_, record) => (
        <Space size={4}>
          <Button type="link" size="small" icon={<SafetyOutlined />} onClick={() => handleOpenPerm(record)}>权限</Button>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleOpenModal(record)}>编辑</Button>
          <Popconfirm
            title="确定删除此角色？"
            description="删除后该角色下的用户将失去角色关联"
            onConfirm={() => handleDelete(record.id)}
            okText="删除" cancelText="取消" okButtonProps={{ danger: true }}
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const allKeys = collectAllKeys(menuTree);

  return (
    <div style={{ padding: 24 }}>
      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}><Card><Statistic title="总角色数" value={roles.length} prefix={<TeamOutlined />} /></Card></Col>
        <Col span={6}><Card><Statistic title="启用角色" value={roles.filter(r => r.status === 1).length} valueStyle={{ color: token.colorSuccess }} /></Card></Col>
        <Col span={6}><Card><Statistic title="禁用角色" value={roles.filter(r => r.status === 0).length} valueStyle={{ color: token.colorError }} /></Card></Col>
        <Col span={6}><Card><Statistic title="总用户数" value={roles.reduce((s, r) => s + (r._count?.users || 0), 0)} /></Card></Col>
      </Row>

      {/* 操作栏 + 表格 */}
      <Card>
        <Space style={{ marginBottom: 16 }}>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpenModal()}>新增角色</Button>
          <Button icon={<ReloadOutlined />} onClick={fetchRoles}>刷新</Button>
        </Space>
        <Table columns={columns} dataSource={roles} rowKey="id" loading={loading} scroll={{ x: 900 }} />
      </Card>

      {/* 新增/编辑弹窗 */}
      <Modal
        title={editingRole ? '编辑角色' : '新增角色'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        okText={editingRole ? '保存' : '创建'}
        width={520}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="roleName" label="角色名称" rules={[{ required: true, message: '请输入角色名称' }]}>
            <Input placeholder="如：超级管理员" />
          </Form.Item>
          <Form.Item name="roleKey" label="角色标识" rules={[
            { required: true, message: '请输入角色标识' },
            { pattern: /^[a-z_]+$/, message: '只能包含小写字母和下划线' },
          ]}>
            <Input placeholder="如：admin" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <TextArea rows={3} placeholder="角色描述（可选）" />
          </Form.Item>
          <Form.Item name="status" label="状态" valuePropName="checked"
            getValueFromEvent={v => v ? 1 : 0}
            getValueProps={v => ({ checked: v === 1 })}>
            <Switch checkedChildren="启用" unCheckedChildren="禁用" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 菜单权限配置弹窗 */}
      <Modal
        title={`配置菜单权限 — ${permRole?.roleName}`}
        open={permModalOpen}
        onOk={handleSavePerm}
        onCancel={() => setPermModalOpen(false)}
        okText="保存权限"
        confirmLoading={permSaving}
        width={480}
        destroyOnHidden
      >
        <div style={{ marginBottom: 12, display: 'flex', gap: 8 }}>
          <Button size="small" onClick={handleCheckAll}>全选</Button>
          <Button size="small" onClick={handleUncheckAll}>清空</Button>
          <span style={{ fontSize: 12, color: token.colorTextSecondary, marginLeft: 4 }}>
            已选 {checkedKeys.length} / {allKeys.length} 项
          </span>
        </div>
        <div style={{
          border: `1px solid ${token.colorBorderSecondary}`,
          borderRadius: 6, padding: '8px 12px',
          maxHeight: 420, overflowY: 'auto',
          background: token.colorBgLayout,
        }}>
          {menuTree.length > 0 ? (
            <Tree
              checkable
              checkedKeys={checkedKeys}
              onCheck={(keys) => setCheckedKeys(keys as number[])}
              treeData={toTreeData(menuTree)}
              defaultExpandAll
              selectable={false}
            />
          ) : (
            <div style={{ textAlign: 'center', padding: 24, color: token.colorTextTertiary }}>
              暂无菜单数据
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default RoleManagement;
