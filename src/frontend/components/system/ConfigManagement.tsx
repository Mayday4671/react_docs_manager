import React, { useState, useEffect } from 'react';
import { 
  Table, Button, Space, Modal, Form, Input, Select, message, 
  Tag, Popconfirm, Card, Tabs 
} from 'antd';
import { 
  SettingOutlined, PlusOutlined, EditOutlined, DeleteOutlined,
  ReloadOutlined, SearchOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

const { TextArea } = Input;

interface Config {
  id: number;
  configKey: string;
  configValue: string;
  configType: string;
  remark?: string;
  createdAt: string;
  updatedAt: string;
}

const ConfigManagement: React.FC = () => {
  const [configs, setConfigs] = useState<Config[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<Config | null>(null);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchText, setSearchText] = useState('');
  const [form] = Form.useForm();

  // 获取配置列表
  const fetchConfigs = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/configs');
      const data = await response.json();
      setConfigs(data.data || []);
    } catch (error) {
      message.error('获取配置列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigs();
  }, []);

  // 过滤配置
  const filteredConfigs = configs.filter(config => {
    const matchTab = activeTab === 'all' || config.configType === activeTab;
    const matchSearch = !searchText || 
      config.configKey.toLowerCase().includes(searchText.toLowerCase()) ||
      config.configValue.toLowerCase().includes(searchText.toLowerCase());
    return matchTab && matchSearch;
  });

  // 打开新增/编辑弹窗
  const handleOpenModal = (config?: Config) => {
    if (config) {
      setEditingConfig(config);
      form.setFieldsValue(config);
    } else {
      setEditingConfig(null);
      form.resetFields();
    }
    setIsModalOpen(true);
  };

  // 提交表单
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      if (editingConfig) {
        // 更新配置
        const response = await fetch('/api/configs', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingConfig.id,
            ...values
          })
        });
        
        if (response.ok) {
          message.success('配置更新成功');
          setIsModalOpen(false);
          form.resetFields();
          fetchConfigs();
        } else {
          message.error('配置更新失败');
        }
      } else {
        const response = await fetch('/api/configs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(values)
        });
        
        if (response.ok) {
          message.success('配置创建成功');
          setIsModalOpen(false);
          form.resetFields();
          fetchConfigs();
        } else {
          message.error('配置创建失败');
        }
      }
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  // 删除配置
  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`/api/configs?id=${id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        message.success('配置删除成功');
        fetchConfigs();
      } else {
        message.error('配置删除失败');
      }
    } catch (error) {
      message.error('配置删除失败');
    }
  };

  // 表格列定义
  const columns: ColumnsType<Config> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '配置键',
      dataIndex: 'configKey',
      key: 'configKey',
      render: (text) => (
        <Space>
          <SettingOutlined />
          <Tag color="blue">{text}</Tag>
        </Space>
      )
    },
    {
      title: '配置值',
      dataIndex: 'configValue',
      key: 'configValue',
      ellipsis: true,
    },
    {
      title: '类型',
      dataIndex: 'configType',
      key: 'configType',
      width: 120,
      render: (type) => (
        <Tag color={type === 'system' ? 'purple' : 'green'}>
          {type === 'system' ? '系统配置' : '业务配置'}
        </Tag>
      )
    },
    {
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
      ellipsis: true,
      render: (text) => text || '-'
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
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
            title="确定要删除这个配置吗？"
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

  const tabItems = [
    { key: 'all', label: `全部 (${configs.length})` },
    { key: 'system', label: `系统配置 (${configs.filter(c => c.configType === 'system').length})` },
    { key: 'business', label: `业务配置 (${configs.filter(c => c.configType === 'business').length})` },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }}>
          <Space>
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={() => handleOpenModal()}
            >
              新增配置
            </Button>
            <Button 
              icon={<ReloadOutlined />}
              onClick={() => fetchConfigs()}
            >
              刷新
            </Button>
          </Space>
          <Input
            placeholder="搜索配置键或值"
            prefix={<SearchOutlined />}
            style={{ width: 250 }}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
          />
        </Space>

        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab}
          items={tabItems}
          style={{ marginBottom: 16 }}
        />

        <Table
          columns={columns}
          dataSource={filteredConfigs}
          rowKey="id"
          loading={loading}
        />
      </Card>

      {/* 新增/编辑弹窗 */}
      <Modal
        title={editingConfig ? '编辑配置' : '新增配置'}
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
            label="配置键"
            name="configKey"
            rules={[
              { required: true, message: '请输入配置键' },
              { pattern: /^[a-z0-9._-]+$/, message: '只能包含小写字母、数字、点、下划线和横线' }
            ]}
          >
            <Input placeholder="如：system.name" disabled={!!editingConfig} />
          </Form.Item>

          <Form.Item
            label="配置值"
            name="configValue"
            rules={[{ required: true, message: '请输入配置值' }]}
          >
            <TextArea rows={3} placeholder="请输入配置值" />
          </Form.Item>

          <Form.Item
            label="配置类型"
            name="configType"
            initialValue="system"
            rules={[{ required: true, message: '请选择配置类型' }]}
          >
            <Select>
              <Select.Option value="system">系统配置</Select.Option>
              <Select.Option value="business">业务配置</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="备注"
            name="remark"
          >
            <TextArea rows={2} placeholder="请输入备注说明" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ConfigManagement;
