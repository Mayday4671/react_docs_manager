import React, { useState, useEffect } from 'react';
import { 
  Table, Button, Space, Modal, Form, Input, Select, message, 
  Tag, Popconfirm, Card, Badge, DatePicker 
} from 'antd';
import { 
  BellOutlined, PlusOutlined, EditOutlined, DeleteOutlined,
  EyeOutlined, ReloadOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

const { TextArea } = Input;

interface Notification {
  id: number;
  title: string;
  content?: string;
  type: string;
  priority: number;
  status: number;
  readCount: number;
  publishAt?: string;
  expireAt?: string;
  createdAt: string;
}

const NotificationManagement: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editingNotification, setEditingNotification] = useState<Notification | null>(null);
  const [viewingNotification, setViewingNotification] = useState<Notification | null>(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  const [form] = Form.useForm();

  // 获取通知列表
  const fetchNotifications = async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/notifications?page=${page}&pageSize=${pageSize}`);
      const data = await response.json();
      setNotifications(data.data);
      setPagination({
        current: data.page,
        pageSize: data.pageSize,
        total: data.total
      });
    } catch (error) {
      message.error('获取通知列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // 打开新增/编辑弹窗
  const handleOpenModal = (notification?: Notification) => {
    if (notification) {
      setEditingNotification(notification);
      form.setFieldsValue({
        ...notification,
        publishAt: notification.publishAt ? dayjs(notification.publishAt) : null,
        expireAt: notification.expireAt ? dayjs(notification.expireAt) : null
      });
    } else {
      setEditingNotification(null);
      form.resetFields();
    }
    setIsModalOpen(true);
  };

  // 查看详情
  const handleView = (notification: Notification) => {
    setViewingNotification(notification);
    setViewModalOpen(true);
  };

  // 提交表单
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      const submitData = {
        ...values,
        publishAt: values.publishAt ? values.publishAt.toISOString() : null,
        expireAt: values.expireAt ? values.expireAt.toISOString() : null
      };

      if (editingNotification) {
        message.info('更新功能开发中...');
      } else {
        const response = await fetch('/api/notifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(submitData)
        });
        
        if (response.ok) {
          message.success('通知创建成功');
          setIsModalOpen(false);
          form.resetFields();
          fetchNotifications();
        } else {
          message.error('通知创建失败');
        }
      }
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  // 删除通知
  const handleDelete = async (id: number) => {
    message.info('删除功能开发中...');
  };

  // 类型标签颜色
  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      info: 'blue',
      success: 'green',
      warning: 'orange',
      error: 'red'
    };
    return colors[type] || 'default';
  };

  // 优先级标签
  const getPriorityTag = (priority: number) => {
    const tags: Record<number, { text: string; color: string }> = {
      0: { text: '普通', color: 'default' },
      1: { text: '重要', color: 'orange' },
      2: { text: '紧急', color: 'red' }
    };
    const tag = tags[priority] || tags[0];
    return <Tag color={tag.color}>{tag.text}</Tag>;
  };

  // 表格列定义
  const columns: ColumnsType<Notification> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      render: (text, record) => (
        <Space>
          <BellOutlined />
          <a onClick={() => handleView(record)}>{text}</a>
          {record.readCount > 0 && (
            <Badge count={record.readCount} style={{ backgroundColor: '#52c41a' }} />
          )}
        </Space>
      )
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type) => (
        <Tag color={getTypeColor(type)}>
          {type.toUpperCase()}
        </Tag>
      )
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 100,
      render: (priority) => getPriorityTag(priority)
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
      title: '阅读次数',
      dataIndex: 'readCount',
      key: 'readCount',
      width: 100,
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
            title="确定要删除这条通知吗？"
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
            新增通知
          </Button>
          <Button 
            icon={<ReloadOutlined />}
            onClick={() => fetchNotifications()}
          >
            刷新
          </Button>
        </Space>

        <Table
          columns={columns}
          dataSource={notifications}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1200 }}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条记录`,
            onChange: (page, pageSize) => fetchNotifications(page, pageSize)
          }}
        />
      </Card>

      {/* 新增/编辑弹窗 */}
      <Modal
        title={editingNotification ? '编辑通知' : '新增通知'}
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
            label="标题"
            name="title"
            rules={[{ required: true, message: '请输入标题' }]}
          >
            <Input placeholder="请输入通知标题" />
          </Form.Item>

          <Form.Item
            label="内容"
            name="content"
          >
            <TextArea rows={4} placeholder="请输入通知内容" />
          </Form.Item>

          <Form.Item
            label="类型"
            name="type"
            initialValue="info"
          >
            <Select>
              <Select.Option value="info">信息</Select.Option>
              <Select.Option value="success">成功</Select.Option>
              <Select.Option value="warning">警告</Select.Option>
              <Select.Option value="error">错误</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="优先级"
            name="priority"
            initialValue={0}
          >
            <Select>
              <Select.Option value={0}>普通</Select.Option>
              <Select.Option value={1}>重要</Select.Option>
              <Select.Option value={2}>紧急</Select.Option>
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

          <Form.Item
            label="过期时间"
            name="expireAt"
          >
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>

      {/* 查看详情弹窗 */}
      <Modal
        title="通知详情"
        open={viewModalOpen}
        onCancel={() => setViewModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setViewModalOpen(false)}>
            关闭
          </Button>
        ]}
        width={700}
      >
        {viewingNotification && (
          <div>
            <p><strong>标题：</strong>{viewingNotification.title}</p>
            <p><strong>类型：</strong><Tag color={getTypeColor(viewingNotification.type)}>{viewingNotification.type}</Tag></p>
            <p><strong>优先级：</strong>{getPriorityTag(viewingNotification.priority)}</p>
            <p><strong>状态：</strong>
              <Tag color={viewingNotification.status === 1 ? 'success' : 'default'}>
                {viewingNotification.status === 1 ? '已发布' : '草稿'}
              </Tag>
            </p>
            <p><strong>阅读次数：</strong>{viewingNotification.readCount}</p>
            <p><strong>内容：</strong></p>
            <div style={{ 
              padding: '12px', 
              background: '#f5f5f5', 
              borderRadius: '4px',
              whiteSpace: 'pre-wrap'
            }}>
              {viewingNotification.content || '无内容'}
            </div>
            <p style={{ marginTop: 16 }}>
              <strong>发布时间：</strong>
              {viewingNotification.publishAt ? new Date(viewingNotification.publishAt).toLocaleString('zh-CN') : '-'}
            </p>
            <p>
              <strong>过期时间：</strong>
              {viewingNotification.expireAt ? new Date(viewingNotification.expireAt).toLocaleString('zh-CN') : '-'}
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default NotificationManagement;
