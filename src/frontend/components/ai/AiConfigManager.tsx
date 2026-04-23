/**
 * @file AiConfigManager.tsx
 * @description AI 模型配置管理组件，支持增删改查，API Key 加密存储
 * @module AI对话
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Table, Button, Space, Modal, Form, Input, Select, Tag,
  Popconfirm, App, theme, Switch,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined, KeyOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

const { useToken } = theme;

/** 厂商预设配置 */
const PROVIDER_PRESETS: Record<string, { label: string; baseUrl: string; models: string[] }> = {
  zhipu:    { label: '智谱 AI',    baseUrl: 'https://open.bigmodel.cn/api/paas/v4', models: ['glm-4', 'glm-4-flash', 'glm-3-turbo', 'embedding-3', 'embedding-2'] },
  deepseek: { label: 'DeepSeek',   baseUrl: 'https://api.deepseek.com/v1',          models: ['deepseek-chat', 'deepseek-coder'] },
  qwen:     { label: '通义千问',   baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1', models: ['qwen-turbo', 'qwen-plus', 'qwen-max', 'text-embedding-v3'] },
  openai:   { label: 'OpenAI',     baseUrl: 'https://api.openai.com/v1',            models: ['gpt-4o', 'gpt-4o-mini', 'gpt-3.5-turbo', 'text-embedding-3-small'] },
  custom:   { label: '自定义',     baseUrl: '',                                     models: [] },
};

/**
 * AI 模型配置数据结构
 */
interface AiConfig {
  /** 配置 ID */
  id: number;
  /** 配置名称 */
  name: string;
  /** 厂商标识 */
  provider: string;
  /** API Base URL */
  baseUrl: string;
  /** 支持的模型列表 */
  models: string[];
  /** 默认模型 */
  defaultModel?: string | null;
  /** 状态：1-启用 0-禁用 */
  status: number;
}

/**
 * AI 模型配置管理组件
 */
const AiConfigManager: React.FC = () => {
  const { token } = useToken();
  const { message: messageApi } = App.useApp();

  /** 配置列表 */
  const [configs, setConfigs] = useState<AiConfig[]>([]);
  /** 加载状态 */
  const [loading, setLoading] = useState(false);
  /** 弹窗是否打开 */
  const [modalOpen, setModalOpen] = useState(false);
  /** 当前编辑的配置，null 表示新增 */
  const [editing, setEditing] = useState<AiConfig | null>(null);
  /** 当前选中的厂商 */
  const [provider, setProvider] = useState('zhipu');
  /** 模型列表（可编辑） */
  const [modelList, setModelList] = useState<string[]>([]);

  const [form] = Form.useForm();

  /**
   * 获取配置列表
   */
  const fetchConfigs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ai/configs');
      const data = await res.json();
      if (data.success) setConfigs(data.data);
    } catch { messageApi.error('获取配置失败'); }
    finally { setLoading(false); }
  }, [messageApi]);

  useEffect(() => { fetchConfigs(); }, [fetchConfigs]);

  /**
   * 打开新增/编辑弹窗
   * @param config - 传入时为编辑模式
   */
  const handleOpen = (config?: AiConfig) => {
    if (config) {
      setEditing(config);
      setProvider(config.provider);
      setModelList(config.models);
      form.setFieldsValue({ ...config, apiKey: '', models: config.models.join('\n') });
    } else {
      setEditing(null);
      const preset = PROVIDER_PRESETS['zhipu'];
      setProvider('zhipu');
      setModelList(preset.models);
      form.resetFields();
      form.setFieldsValue({ provider: 'zhipu', baseUrl: preset.baseUrl, models: preset.models.join('\n') });
    }
    setModalOpen(true);
  };

  /**
   * 厂商切换时自动填充 Base URL 和模型列表
   * @param val - 厂商标识
   */
  const handleProviderChange = (val: string) => {
    setProvider(val);
    const preset = PROVIDER_PRESETS[val];
    if (preset) {
      form.setFieldsValue({ baseUrl: preset.baseUrl, models: preset.models.join('\n') });
      setModelList(preset.models);
    }
  };

  /**
   * 提交表单
   */
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const models = (values.models as string).split('\n').map((s: string) => s.trim()).filter(Boolean);
      const payload = { ...values, models, provider };

      const method = editing ? 'PUT' : 'POST';
      const body = editing ? { id: editing.id, ...payload } : payload;

      const res = await fetch('/api/ai/configs', {
        method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        messageApi.success(editing ? '更新成功' : '创建成功');
        setModalOpen(false);
        fetchConfigs();
      } else {
        messageApi.error(data.error || '操作失败');
      }
    } catch { /* 表单校验失败 */ }
  };

  /**
   * 删除配置
   * @param id - 配置 ID
   */
  const handleDelete = async (id: number) => {
    const res = await fetch(`/api/ai/configs?id=${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) { messageApi.success('删除成功'); fetchConfigs(); }
    else messageApi.error(data.error || '删除失败');
  };

  /** 表格列定义 */
  const columns: ColumnsType<AiConfig> = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    {
      title: '配置名称', dataIndex: 'name',
      render: (name, r) => <Space><KeyOutlined style={{ color: token.colorPrimary }} />{name}</Space>,
    },
    {
      title: '厂商', dataIndex: 'provider',
      render: p => <Tag color="blue">{PROVIDER_PRESETS[p]?.label || p}</Tag>,
    },
    { title: 'Base URL', dataIndex: 'baseUrl', ellipsis: true },
    {
      title: '模型', dataIndex: 'models',
      render: (models: string[]) => (
        <Space wrap size={4}>
          {models.slice(0, 3).map(m => <Tag key={m} style={{ fontSize: 11 }}>{m}</Tag>)}
          {models.length > 3 && <Tag>+{models.length - 3}</Tag>}
        </Space>
      ),
    },
    {
      title: '状态', dataIndex: 'status', width: 80,
      render: (s, r) => (
        <Switch size="small" checked={s === 1}
          onChange={async v => {
            await fetch('/api/ai/configs', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: r.id, status: v ? 1 : 0 }) });
            fetchConfigs();
          }}
        />
      ),
    },
    {
      title: '操作', width: 160, fixed: 'right',
      render: (_, r) => (
        <Space size={4}>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleOpen(r)}>编辑</Button>
          <Popconfirm title="确认删除？" onConfirm={() => handleDelete(r.id)} okButtonProps={{ danger: true }}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpen()}>新增配置</Button>
        <Button icon={<ReloadOutlined />} onClick={fetchConfigs}>刷新</Button>
      </Space>

      <Table columns={columns} dataSource={configs} rowKey="id" loading={loading} size="small" scroll={{ x: 800 }} />

      <Modal
        title={editing ? '编辑 AI 配置' : '新增 AI 配置'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        width={560}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="name" label="配置名称" rules={[{ required: true }]}>
            <Input placeholder="如：智谱-GLM4" />
          </Form.Item>
          <Form.Item name="provider" label="厂商">
            <Select onChange={handleProviderChange} options={Object.entries(PROVIDER_PRESETS).map(([k, v]) => ({ value: k, label: v.label }))} />
          </Form.Item>
          <Form.Item name="baseUrl" label="Base URL" rules={[{ required: true }]}>
            <Input placeholder="https://open.bigmodel.cn/api/paas/v4" />
          </Form.Item>
          <Form.Item name="apiKey" label={editing ? 'API Key（不填则保持不变）' : 'API Key'} rules={[{ required: !editing }]}>
            <Input.Password placeholder={editing ? '不填则保持原 Key 不变' : '请输入 API Key'} />
          </Form.Item>
          <Form.Item name="models" label="模型列表（每行一个）" rules={[{ required: true }]}>
            <Input.TextArea rows={4} placeholder={'glm-4\nembedding-3'} />
          </Form.Item>
          <Form.Item name="defaultModel" label="默认模型">
            <Input placeholder="留空则使用第一个模型" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AiConfigManager;
