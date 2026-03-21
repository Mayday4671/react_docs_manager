import React, { useState, useEffect } from 'react';
import { 
  Table, Button, Space, Modal, Form, Input, Select, message, 
  Tag, Popconfirm, Card, DatePicker, Timeline 
} from 'antd';
import { 
  RocketOutlined, PlusOutlined, EditOutlined, DeleteOutlined,
  EyeOutlined, ReloadOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

const { TextArea } = Input;

interface Changelog {
  id: number;
  version: string;
  title: string;
  content?: string;
  type: string;
  status: number;
  publishAt?: string;
  createdAt: string;
}

const ChangelogManagement: React.FC = () => {
  const [changelogs, setChangelogs] = useState<Changelog[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editingChangelog, setEditingChangelog] = useState<Changelog | null>(null);
  const [viewingChangelog, setViewingChangelog] = useState<Changelog | null>(null);
  const [form] = Form.useForm();

  // 获取更新日志列表
  const fetchChangelogs = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/changelogs');
      const data = await response.json();
      setChangelogs(data.data || []);
    } catch (error) {
      message.error('获取更新日志列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChangelogs();
  }, []);

  // 打开新增/编辑弹窗
  const handleOpenModal = (changelog?: Changelog) => {
    if (changelog) {
      setEditingChangelog(changelog);
      form.setFieldsValue({
        ...changelog,
        publishAt: changelog.publishAt ? dayjs(changelog.publishAt) : null
      });
    } else {
      setEditingChangelog(null);
      form.resetFields();
    }
    setIsModalOpen(true);
  };

  // 查看详情
  const handleView = (changelog: Changelog) => {
    setViewingChangelog(changelog);
    setViewModalOpen(true);
  };

  // 提交表单
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      const submitData = {
        ...values,
        publishAt: values.publishAt ? values.publishAt.toISOString() : null
      };

      if (editingChangelog) {
        message.info('更新功能开发中...');
      } else {
        const response = await fetch('/api/changelogs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(submitData)
        });
        
        if (response.ok) {
          message.success('更新日志创建成功');
          setIsModalOpen(false);
          form.resetFields();
          fetchChangelogs();
        } else {
          message.error('更新日志创建失败');
        }
      }
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  // 删除更新日志
  const handleDelete = async (id: number) => {
    message.info('删除功能开发中...');
  };

  // 类型标签颜色
  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      feature: 'blue',
      bugfix: 'red',
      improvement: 'green',
      breaking: 'orange'
    };
    return colors[type] || 'default';
  };

  // 类型文本
  const getTypeText = (type: string) => {
    const texts: Record<string, string> = {
      feature: '新功能',
      bugfix: '修复',
      improvement: '优化',
      breaking: '破坏性变更'
    };
    return texts[type] || type;
  };

  // 表格列定义
  const columns: ColumnsType<Changelog> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '版本号',
      dataIndex: 'version',
      key: 'version',
      width: 120,
      render: (text) => (
        <Space>
          <RocketOutlined />
          <Tag color="cyan">{text}</Tag>
        </Space>
      )
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      render: (text, record) => (
        <a onClick={() => handleView(record)}>{text}</a>
      )
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (type) => (
        <Tag color={getTypeColor(type)}>
          {getTypeText(type)}
        </Tag>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => (
        <Tag color={status === 1 ? 'success' : 'default'}>
          {status === 1 ? '已发布' : '草稿'}
        </Tag>
      )
    },
    {
      title: '发布时间',
      dataIndex: 'publishAt',
      key: 'publishAt',
      width: 180,
      render: (text) => text ? new Date(text).toLocaleString('zh-CN') : '-'
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button 
            type="link" 
            size="small" 
            icon={<EyeOutlined />}
            onClick={() => handleView(record)}
          >
            查看
          </Button>
          <Button 
            type="link" 
            size="small" 
            icon={<EditOutlined />}
            onClick={() => handleOpenModal(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这条更新日志吗？"
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
      <Card>
        <Space style={{ marginBottom: 16 }}>
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => handleOpenModal()}
          >
            新增更新日志
          </Button>
          <Button 
            icon={<ReloadOutlined />}
            onClick={() => fetchChangelogs()}
          >
            刷新
          </Button>
        </Space>

        <Table
          columns={columns}
          dataSource={changelogs}
          rowKey="id"
          loading={loading}
        />
      </Card>

      {/* 新增/编辑弹窗 */}
      <Modal
        title={editingChangelog ? '编辑更新日志' : '新增更新日志'}
        open={isModalOpen}
        onOk={handleSubmit}
        onCancel={() => {
          setIsModalOpen(false);
          form.resetFields();
        }}
        width={700}
        destroyOnHidden={false}
      >
        <Form
          form={form}
          layout="vertical"
          autoComplete="off"
        >
          <Form.Item
            label="版本号"
            name="version"
            rules={[
              { required: true, message: '请输入版本号' },
              { pattern: /^\d+\.\d+\.\d+$/, message: '版本号格式：x.y.z，如：1.0.0' }
            ]}
          >
            <Input placeholder="如：1.0.0" />
          </Form.Item>

          <Form.Item
            label="标题"
            name="title"
            rules={[{ required: true, message: '请输入标题' }]}
          >
            <Input placeholder="请输入更新标题" />
          </Form.Item>

          <Form.Item
            label="内容"
            name="content"
          >
            <TextArea rows={6} placeholder="请输入更新内容，支持换行" />
          </Form.Item>

          <Form.Item
            label="类型"
            name="type"
            initialValue="feature"
          >
            <Select>
              <Select.Option value="feature">新功能</Select.Option>
              <Select.Option value="bugfix">修复</Select.Option>
              <Select.Option value="improvement">优化</Select.Option>
              <Select.Option value="breaking">破坏性变更</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="状态"
            name="status"
            initialValue={1}
          >
            <Select>
              <Select.Option value={1}>已发布</Select.Option>
              <Select.Option value={0}>草稿</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="发布时间"
            name="publishAt"
          >
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>

      {/* 查看详情弹窗 */}
      <Modal
        title="更新日志详情"
        open={viewModalOpen}
        onCancel={() => setViewModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setViewModalOpen(false)}>
            关闭
          </Button>
        ]}
        width={700}
      >
        {viewingChangelog && (
          <div>
            <Space style={{ marginBottom: 16 }}>
              <Tag color="cyan" style={{ fontSize: 16 }}>
                v{viewingChangelog.version}
              </Tag>
              <Tag color={getTypeColor(viewingChangelog.type)}>
                {getTypeText(viewingChangelog.type)}
              </Tag>
              <Tag color={viewingChangelog.status === 1 ? 'success' : 'default'}>
                {viewingChangelog.status === 1 ? '已发布' : '草稿'}
              </Tag>
            </Space>
            
            <h3>{viewingChangelog.title}</h3>
            
            <p style={{ color: '#666', marginBottom: 16 }}>
              发布时间：{viewingChangelog.publishAt ? new Date(viewingChangelog.publishAt).toLocaleString('zh-CN') : '未发布'}
            </p>

            <div style={{ 
              padding: '16px', 
              background: '#f5f5f5', 
              borderRadius: '4px',
              whiteSpace: 'pre-wrap',
              lineHeight: 1.8
            }}>
              {viewingChangelog.content || '无内容'}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ChangelogManagement;
