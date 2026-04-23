/**
 * @file MenuManagement.tsx
 * @description 菜单管理页面组件，提供菜单的增删改查、显示/状态切换等功能。
 *              菜单数据存储在数据库 sys_menu 表中，通过此页面可视化管理，
 *              无需直接操作数据库。
 * @module 系统管理
 */
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Table, Button, Space, Modal, Form, Input, Select, InputNumber,
  Tag, Switch, Popconfirm, App, theme, Row, Col, Tooltip,
} from 'antd';
import * as AntdIcons from '@ant-design/icons';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined,
  AppstoreOutlined, CheckCircleOutlined, StopOutlined,
  EyeOutlined, EyeInvisibleOutlined, KeyOutlined, SearchOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

const { useToken } = theme;

/**
 * componentMap 中已注册的组件 key 列表。
 * 新增组件后需同步维护此列表，用于菜单编辑时「绑定组件 Key」的下拉选项。
 */
const REGISTERED_KEYS = [
  'home', 'h5-player', 'user-management', 'role-management',
  'notification-management', 'log-management', 'config-management',
  'database-management', 'changelog-management', 'file-management',
  'hk-api-docs', 'doc-notes', 'menu-management', 'profile',
];

/**
 * 可选图标列表，来自 @ant-design/icons，仅列出常用图标。
 * IconPicker 组件使用此列表渲染图标网格，支持按名称搜索过滤。
 */
const ICON_OPTIONS = [
  'HomeOutlined','UserOutlined','TeamOutlined','SettingOutlined',
  'DatabaseOutlined','FileTextOutlined','AppstoreOutlined','BellOutlined',
  'RocketOutlined','FileOutlined','MenuOutlined','ApiOutlined',
  'FolderOpenOutlined','BookOutlined','VideoCameraOutlined','KeyOutlined',
  'BarChartOutlined','CloudOutlined','LockOutlined','SafetyOutlined',
  'DashboardOutlined','CalendarOutlined','MessageOutlined','ShopOutlined',
  'ToolOutlined','BugOutlined','CodeOutlined','GlobalOutlined',
  'PieChartOutlined','LineChartOutlined','TableOutlined','ProfileOutlined',
  'AuditOutlined','CrownOutlined','StarOutlined','HeartOutlined',
  'ThunderboltOutlined','FireOutlined','GiftOutlined','TrophyOutlined',
  'BankOutlined','CarOutlined','EnvironmentOutlined','PhoneOutlined',
  'MailOutlined','LinkOutlined','PaperClipOutlined','PictureOutlined',
  'PlayCircleOutlined','PauseCircleOutlined','SoundOutlined','WifiOutlined',
];

/**
 * 图标选择器组件。
 *
 * 点击触发弹窗，展示图标网格供用户选择，支持按名称搜索过滤。
 * 选中图标后高亮显示，并在触发区域同步预览图标和名称。
 * 点击清除按钮（✕）可重置为空。
 *
 * @param value    - 当前选中的图标名称，如 'HomeOutlined'
 * @param onChange - 选中/清除图标后的回调，传入图标名称字符串或空字符串
 */
const IconPicker: React.FC<{
  value?: string;
  onChange?: (v: string) => void;
}> = ({ value, onChange }) => {
  const { token } = useToken();
  /** 图标选择弹窗是否打开 */
  const [open, setOpen] = useState(false);
  /** 图标搜索关键词 */
  const [search, setSearch] = useState('');

  /** 根据搜索关键词过滤图标列表 */
  const filtered = ICON_OPTIONS.filter(name =>
    name.toLowerCase().includes(search.toLowerCase())
  );

  /**
   * 动态渲染指定名称的 Ant Design 图标组件。
   * @param name - 图标名称，如 'HomeOutlined'
   * @returns 图标 JSX 元素，名称不存在时返回 null
   */
  const renderIcon = (name: string) => {
    const IconComp = (AntdIcons as any)[name];
    return IconComp ? <IconComp /> : null;
  };

  return (
    <>
      <div
        onClick={() => setOpen(true)}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '4px 11px', borderRadius: token.borderRadius,
          border: `1px solid ${token.colorBorder}`,
          cursor: 'pointer', minHeight: 32,
          background: token.colorBgContainer,
        }}
      >
        {value ? (
          <>
            <span style={{ fontSize: 16 }}>{renderIcon(value)}</span>
            <span style={{ flex: 1, fontSize: 13 }}>{value}</span>
          </>
        ) : (
          <span style={{ color: token.colorTextPlaceholder, fontSize: 13 }}>点击选择图标</span>
        )}
        {value && (
          <Button
            type="text" size="small"
            style={{ color: token.colorTextTertiary, padding: '0 2px', height: 20 }}
            onClick={e => { e.stopPropagation(); onChange?.(''); }}
          >
            ✕
          </Button>
        )}
      </div>

      <Modal
        title="选择图标"
        open={open}
        onCancel={() => { setOpen(false); setSearch(''); }}
        footer={null}
        width={560}
      >
        <Input
          prefix={<SearchOutlined />}
          placeholder="搜索图标名称..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ marginBottom: 12 }}
          allowClear
        />
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(8, 1fr)',
          gap: 6,
          maxHeight: 360,
          overflowY: 'auto',
          padding: '4px 2px',
        }}>
          {filtered.map(name => (
            <Tooltip key={name} title={name} placement="top" mouseEnterDelay={0.5}>
              <div
                onClick={() => { onChange?.(name); setOpen(false); setSearch(''); }}
                style={{
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  padding: '8px 4px', borderRadius: 6, cursor: 'pointer',
                  background: value === name ? `${token.colorPrimary}18` : 'transparent',
                  border: `1px solid ${value === name ? token.colorPrimary : 'transparent'}`,
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => {
                  if (value !== name) (e.currentTarget as HTMLElement).style.background = token.colorFillTertiary;
                }}
                onMouseLeave={e => {
                  if (value !== name) (e.currentTarget as HTMLElement).style.background = 'transparent';
                }}
              >
                <span style={{ fontSize: 20, color: value === name ? token.colorPrimary : token.colorText }}>
                  {renderIcon(name)}
                </span>
              </div>
            </Tooltip>
          ))}
        </div>
      </Modal>
    </>
  );
};

/**
 * 菜单项数据结构，对应数据库 sys_menu 表字段。
 */
interface MenuItem {
  /** 菜单自增主键 */
  id: number;
  /** 菜单唯一标识，对应 componentMap 中注册的组件 key */
  key: string;
  /** 菜单显示名称 */
  label: string;
  /** 图标名称，来自 @ant-design/icons，如 'HomeOutlined' */
  icon?: string;
  /** 路由路径，如 /system/users */
  path?: string;
  /** 绑定的前端组件 key，与 componentMap 中的 key 对应 */
  component?: string;
  /** 父菜单 ID，null 表示顶级菜单 */
  parentId?: number | null;
  /** 排序号，数字越小越靠前 */
  orderNum: number;
  /** 菜单类型：M-目录（有子菜单）/ C-菜单（叶子节点） */
  menuType: string;
  /** 是否显示：1-显示 0-隐藏（隐藏后侧边栏不渲染该菜单） */
  visible: number;
  /** 启用状态：1-启用 0-禁用 */
  status: number;
  /** 子菜单列表，叶子节点为 undefined（非空数组，避免 antd Table 显示展开按钮） */
  children?: MenuItem[];
}

/**
 * 菜单管理主组件。
 *
 * 以树形表格展示所有菜单（含禁用/隐藏），支持新增、编辑、删除，
 * 以及行内快速切换显示/启用状态。
 * 新增时自动生成不重复 key，手动修改 key 时实时校验唯一性。
 */
const MenuManagement: React.FC = () => {
  const { token } = useToken();
  const { message: messageApi } = App.useApp();

  /** 菜单树形数据列表（顶级菜单 + 子菜单） */
  const [menus, setMenus] = useState<MenuItem[]>([]);
  /** 表格加载状态 */
  const [loading, setLoading] = useState(false);
  /** 新增/编辑弹窗是否打开 */
  const [modalOpen, setModalOpen] = useState(false);
  /** 当前正在编辑的菜单项，null 表示新增模式 */
  const [editingMenu, setEditingMenu] = useState<MenuItem | null>(null);
  /** key 唯一性校验中的加载状态 */
  const [keyChecking, setKeyChecking] = useState(false);
  /** key 校验结果：ok-可用 / duplicate-已存在 / null-未校验 */
  const [keyStatus, setKeyStatus] = useState<'ok' | 'duplicate' | null>(null);
  /** 表单实例 */
  const [form] = Form.useForm();

  /**
   * 从后端获取全量菜单数据（含禁用/隐藏），用于管理页面展示。
   * 将空 children 数组转为 undefined，避免 antd Table 对无子节点的行显示展开按钮。
   */
  const fetchMenus = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/menu?admin=1');
      const data = await res.json();
      if (data.success) {
        /**
         * 递归清理空 children。
         * antd Table 对 children:[] 的行仍会渲染展开按钮，
         * 设为 undefined 可彻底隐藏展开图标。
         */
        const clean = (items: MenuItem[]): MenuItem[] =>
          items.map(m => ({
            ...m,
            children: m.children && m.children.length > 0 ? clean(m.children) : undefined,
          }));
        setMenus(clean(data.data));
      }
    } catch {
      messageApi.error('获取菜单失败');
    } finally {
      setLoading(false);
    }
  }, [messageApi]);

  useEffect(() => { fetchMenus(); }, [fetchMenus]);

  /**
   * 菜单名称变更时，自动调后端生成不重复 key 并填入表单。
   * 编辑模式下传入 excludeId，避免与自身 key 冲突。
   * @param label - 用户输入的菜单名称
   */
  const handleLabelChange = async (label: string) => {
    if (!label.trim()) return;
    try {
      const excludeId = editingMenu?.id;
      const url = `/api/menu?action=gen-key&label=${encodeURIComponent(label)}${excludeId ? `&excludeId=${excludeId}` : ''}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        form.setFieldValue('key', data.key);
        setKeyStatus('ok');
      }
    } catch { /* 网络异常时静默失败，不影响用户输入 */ }
  };

  /**
   * 手动修改 key 时实时校验唯一性。
   * 校验通过设置 keyStatus='ok'，重复设置 keyStatus='duplicate' 并阻止提交。
   * @param key - 用户手动输入的 key 值
   */
  const handleKeyChange = async (key: string) => {
    if (!key.trim()) { setKeyStatus(null); return; }
    setKeyChecking(true);
    try {
      const excludeId = editingMenu?.id;
      const url = `/api/menu?action=check-key&key=${encodeURIComponent(key)}${excludeId ? `&excludeId=${excludeId}` : ''}`;
      const res = await fetch(url);
      const data = await res.json();
      setKeyStatus(data.exists ? 'duplicate' : 'ok');
    } catch { /* 网络异常时静默失败 */ }
    finally { setKeyChecking(false); }
  };

  /**
   * 打开新增菜单弹窗，重置表单并设置默认值。
   * @param parentId - 父菜单 ID，传入时自动设置父菜单并将类型默认为 C（叶子菜单）
   */
  const handleAdd = (parentId?: number) => {
    setEditingMenu(null);
    setKeyStatus(null);
    form.resetFields();
    if (parentId) {
      form.setFieldValue('parentId', parentId);
      form.setFieldValue('menuType', 'C');
    } else {
      form.setFieldValue('menuType', 'M');
    }
    form.setFieldValue('visible', true);
    form.setFieldValue('status', true);
    form.setFieldValue('orderNum', 0);
    setModalOpen(true);
  };

  /**
   * 打开编辑菜单弹窗，将菜单数据回填到表单。
   * visible/status 字段从数字（1/0）转为布尔值以匹配 Switch 组件。
   * @param menu - 要编辑的菜单项数据
   */
  const handleEdit = (menu: MenuItem) => {
    setEditingMenu(menu);
    setKeyStatus('ok');
    form.setFieldsValue({
      ...menu,
      visible: menu.visible === 1,
      status: menu.status === 1,
      parentId: menu.parentId ?? undefined,
    });
    setModalOpen(true);
  };

  /**
   * 删除指定菜单项。
   * 有子菜单时拒绝删除并提示用户先删除子菜单。
   * @param id          - 要删除的菜单 ID
   * @param hasChildren - 是否有子菜单
   */
  const handleDelete = async (id: number, hasChildren: boolean) => {
    if (hasChildren) {
      messageApi.warning('请先删除子菜单');
      return;
    }
    try {
      const res = await fetch(`/api/menu?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        messageApi.success('删除成功');
        fetchMenus();
      } else {
        messageApi.error(data.error || '删除失败');
      }
    } catch {
      messageApi.error('删除失败');
    }
  };

  /**
   * 提交新增/编辑表单。
   * 提交前校验 key 唯一性，将 Switch 的布尔值转回数字存储。
   * 根据 editingMenu 是否为 null 判断新增还是编辑模式。
   */
  const handleSubmit = async () => {
    if (keyStatus === 'duplicate') {
      messageApi.error('Key 已存在，请修改');
      return;
    }
    try {
      const values = await form.validateFields();
      const payload = {
        ...values,
        visible: values.visible ? 1 : 0,
        status: values.status ? 1 : 0,
        parentId: values.parentId || null,
      };

      const isEdit = !!editingMenu;
      const res = await fetch('/api/menu', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isEdit ? { id: editingMenu!.id, ...payload } : payload),
      });
      const data = await res.json();

      if (data.success) {
        messageApi.success(isEdit ? '更新成功' : '创建成功');
        setModalOpen(false);
        fetchMenus();
      } else {
        messageApi.error(data.error || '操作失败');
      }
    } catch { /* 表单校验失败，antd 会自动显示错误提示 */ }
  };

  /**
   * 行内快速切换菜单的显示/启用状态，无需打开编辑弹窗。
   * @param id    - 菜单 ID
   * @param field - 要切换的字段：'visible'（显示）或 'status'（启用）
   * @param value - 切换后的布尔值，true=1 false=0
   */
  const handleToggle = async (id: number, field: 'visible' | 'status', value: boolean) => {
    try {
      const res = await fetch('/api/menu', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, [field]: value ? 1 : 0 }),
      });
      const data = await res.json();
      if (data.success) fetchMenus();
      else messageApi.error('操作失败');
    } catch {
      messageApi.error('操作失败');
    }
  };

  const columns: ColumnsType<MenuItem> = [
    {
      title: '菜单名称',
      dataIndex: 'label',
      key: 'label',
      width: 180,
      render: (label, record) => {
        const IconComp = record.icon ? (AntdIcons as any)[record.icon] : null;
        return (
          <Space>
            {record.menuType === 'M'
              ? (IconComp ? <IconComp style={{ color: token.colorPrimary }} /> : <AppstoreOutlined style={{ color: token.colorPrimary }} />)
              : (IconComp ? <IconComp style={{ color: token.colorTextSecondary }} /> : null)
            }
            <span style={{ fontWeight: record.menuType === 'M' ? 600 : 400 }}>{label}</span>
          </Space>
        );
      },
    },
    {
      title: 'Key',
      dataIndex: 'key',
      key: 'key',
      width: 160,
      render: (key) => (
        <Tag icon={<KeyOutlined />} color="blue" style={{ fontFamily: 'monospace', fontSize: 11 }}>
          {key}
        </Tag>
      ),
    },
    {
      title: '类型',
      dataIndex: 'menuType',
      key: 'menuType',
      width: 80,
      render: (type) => (
        <Tag color={type === 'M' ? 'purple' : 'cyan'}>
          {type === 'M' ? '目录' : '菜单'}
        </Tag>
      ),
    },
    {
      title: '排序',
      dataIndex: 'orderNum',
      key: 'orderNum',
      width: 70,
      align: 'center',
    },
    {
      title: '显示',
      dataIndex: 'visible',
      key: 'visible',
      width: 80,
      align: 'center',
      render: (visible, record) => (
        <Switch
          size="small"
          checked={visible === 1}
          onChange={(v) => handleToggle(record.id, 'visible', v)}
          checkedChildren={<EyeOutlined />}
          unCheckedChildren={<EyeInvisibleOutlined />}
        />
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      align: 'center',
      render: (status, record) => (
        <Switch
          size="small"
          checked={status === 1}
          onChange={(v) => handleToggle(record.id, 'status', v)}
          checkedChildren={<CheckCircleOutlined />}
          unCheckedChildren={<StopOutlined />}
        />
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 160,
      fixed: 'right',
      render: (_, record) => (
        <Space size={4}>
          {record.menuType === 'M' && (
            <Tooltip title="添加子菜单">
              <Button
                type="link" size="small" icon={<PlusOutlined />}
                onClick={() => handleAdd(record.id)}
              />
            </Tooltip>
          )}
          <Button
            type="link" size="small" icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title={record.children?.length ? '该目录下有子菜单，无法删除' : '确认删除此菜单？'}
            onConfirm={() => handleDelete(record.id, !!(record.children?.length))}
            okText="删除" cancelText="取消"
            okButtonProps={{ danger: true, disabled: !!(record.children?.length) }}
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      {/* 顶部操作栏 */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <span style={{ fontSize: 16, fontWeight: 600 }}>菜单管理</span>
        </Col>
        <Col>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={fetchMenus}>刷新</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => handleAdd()}>
              新增顶级菜单
            </Button>
          </Space>
        </Col>
      </Row>

      {/* 菜单树形表格 */}
      <Table
        columns={columns}
        dataSource={menus}
        rowKey="id"
        loading={loading}
        expandable={{
          defaultExpandAllRows: true,
        }}
        pagination={false}
        scroll={{ x: 900 }}
        size="middle"
        bordered
      />

      {/* 新增/编辑 Modal */}
      <Modal
        title={editingMenu ? '编辑菜单' : '新增菜单'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSubmit}
        okText={editingMenu ? '保存' : '创建'}
        width={600}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="菜单名称"
                name="label"
                rules={[{ required: true, message: '请输入菜单名称' }]}
              >
                <Input
                  placeholder="如：用户管理"
                  onChange={(e) => handleLabelChange(e.target.value)}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label={
                  <Space size={4}>
                    <span>菜单 Key</span>
                    {keyStatus === 'ok' && <Tag color="success" style={{ margin: 0 }}>可用</Tag>}
                    {keyStatus === 'duplicate' && <Tag color="error" style={{ margin: 0 }}>已存在</Tag>}
                    {keyChecking && <Tag style={{ margin: 0 }}>校验中...</Tag>}
                  </Space>
                }
                name="key"
                rules={[
                  { required: true, message: '请输入 Key' },
                  { pattern: /^[a-z0-9-]+$/, message: '只能包含小写字母、数字和连字符' },
                ]}
                validateStatus={keyStatus === 'duplicate' ? 'error' : keyStatus === 'ok' ? 'success' : ''}
              >
                <Input
                  placeholder="自动生成，可手动修改"
                  onChange={(e) => handleKeyChange(e.target.value)}
                  style={{ fontFamily: 'monospace' }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="父菜单" name="parentId">
                <Select
                  placeholder="不选则为顶级菜单"
                  allowClear
                  onChange={(v) => form.setFieldValue('menuType', v ? 'C' : 'M')}
                >
                  {menus.map(m => (
                    <Select.Option key={m.id} value={m.id}>{m.label}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="菜单类型" name="menuType">
                <Select>
                  <Select.Option value="M">目录（有子菜单）</Select.Option>
                  <Select.Option value="C">菜单（叶子节点）</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="图标" name="icon">
                <IconPicker />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="绑定组件 Key" name="component">
                <Select placeholder="选择已注册的组件" allowClear showSearch>
                  {REGISTERED_KEYS.map(k => (
                    <Select.Option key={k} value={k}>{k}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="路由路径" name="path">
                <Input placeholder="如：/system/users" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="排序号" name="orderNum">
                <InputNumber min={0} max={999} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item label="显示" name="visible" valuePropName="checked">
                <Switch checkedChildren="显示" unCheckedChildren="隐藏" />
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item label="启用" name="status" valuePropName="checked">
                <Switch checkedChildren="启用" unCheckedChildren="禁用" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default MenuManagement;
