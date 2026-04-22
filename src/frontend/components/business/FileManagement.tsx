/**
 * @file FileManagement.tsx
 * @description 文件管理页面，支持文件列表展示、预览、下载、删除及按类型/关键词筛选
 * @module 业务管理
 */

import React, { useState, useEffect } from 'react';
import { 
  Table, Button, Space, Modal, message, Tag, Card, 
  Row, Col, Statistic, Input, Select, Popconfirm, Image 
} from 'antd';
import { 
  FileOutlined, ReloadOutlined, DeleteOutlined, DownloadOutlined,
  EyeOutlined, SearchOutlined, CloudUploadOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

/**
 * 文件记录数据结构
 */
interface FileRecord {
  /** 文件唯一标识 */
  id: number;
  /** 原始文件名 */
  fileName: string;
  /** 文件大小（字节） */
  fileSize: number;
  /** MIME 类型，如 image/jpeg */
  fileType: string;
  /** 文件扩展名，如 .jpg */
  fileExt: string;
  /** 服务器存储路径 */
  filePath: string;
  /** 可访问的文件 URL */
  fileUrl: string;
  /** 存储方式：local-本地存储 / oss-对象存储 */
  storageType: string;
  /** 上传用户 ID */
  uploadBy?: number;
  /** 上传者 IP 地址 */
  uploadIp?: string;
  /** 状态：1-正常 0-禁用 */
  status: number;
  /** 下载次数 */
  downloadCount: number;
  /** 上传时间（ISO 字符串） */
  createdAt: string;
}

/**
 * 文件管理组件
 *
 * 提供文件的列表展示、预览、下载及删除功能，支持按文件类型和关键词筛选，
 * 顶部展示文件数量、总大小、下载次数等统计信息。
 */
const FileManagement: React.FC = () => {
  /** 文件列表数据 */
  const [files, setFiles] = useState<FileRecord[]>([]);
  /** 表格加载状态 */
  const [loading, setLoading] = useState(false);
  /** 文件预览弹窗是否打开 */
  const [previewVisible, setPreviewVisible] = useState(false);
  /** 当前正在预览的文件 */
  const [previewFile, setPreviewFile] = useState<FileRecord | null>(null);
  /** 分页配置：当前页、每页条数、总条数 */
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  /** 筛选条件：文件类型和关键词 */
  const [filters, setFilters] = useState({
    fileType: undefined as string | undefined,
    keyword: ''
  });

  /**
   * 获取文件列表
   * @param page - 当前页码，默认第 1 页
   * @param pageSize - 每页条数，默认 10 条
   * @returns Promise<void>
   */
  const fetchFiles = async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString()
      });
      
      if (filters.fileType) params.append('fileType', filters.fileType);
      if (filters.keyword) params.append('keyword', filters.keyword);

      const response = await fetch(`/api/files?${params.toString()}`);
      const data = await response.json();
      setFiles(data.data || []);
      setPagination({
        current: data.page || page,
        pageSize: data.pageSize || pageSize,
        total: data.total || 0
      });
    } catch (error) {
      message.error('获取文件列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  /**
   * 格式化文件大小为可读字符串
   * @param bytes - 文件字节数
   * @returns 格式化后的大小字符串，如 "1.23 MB"
   */
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  /**
   * 打开文件预览弹窗
   * @param file - 要预览的文件记录
   */
  const handlePreview = (file: FileRecord) => {
    setPreviewFile(file);
    setPreviewVisible(true);
  };

  /**
   * 在新标签页中下载文件
   * @param file - 要下载的文件记录
   */
  const handleDownload = (file: FileRecord) => {
    window.open(file.fileUrl, '_blank');
    message.success('开始下载');
  };

  /**
   * 删除指定文件
   * @param id - 要删除的文件 ID
   */
  const handleDelete = async (id: number) => {
    message.info('删除功能开发中...');
  };

  /**
   * 触发文件列表搜索（重置到第一页）
   */
  const handleSearch = () => {
    fetchFiles(1, pagination.pageSize);
  };

  /**
   * 重置筛选条件并刷新列表
   */
  const handleReset = () => {
    setFilters({
      fileType: undefined,
      keyword: ''
    });
    setTimeout(() => fetchFiles(1, pagination.pageSize), 0);
  };

  /**
   * 根据 MIME 类型返回对应的 Emoji 图标
   * @param fileType - 文件 MIME 类型字符串
   * @returns 对应类型的 Emoji 字符
   */
  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return '🖼️';
    if (fileType.startsWith('video/')) return '🎬';
    if (fileType.startsWith('audio/')) return '🎵';
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('word')) return '📝';
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) return '📊';
    if (fileType.includes('zip') || fileType.includes('rar')) return '📦';
    return '📁';
  };

  /** 表格列定义 */
  const columns: ColumnsType<FileRecord> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '文件名',
      dataIndex: 'fileName',
      key: 'fileName',
      ellipsis: true,
      render: (text, record) => (
        <Space>
          <span style={{ fontSize: 18 }}>{getFileIcon(record.fileType)}</span>
          <a onClick={() => handlePreview(record)}>{text}</a>
        </Space>
      )
    },
    {
      title: '文件大小',
      dataIndex: 'fileSize',
      key: 'fileSize',
      width: 120,
      render: (size) => formatFileSize(size),
      sorter: (a, b) => a.fileSize - b.fileSize
    },
    {
      title: '文件类型',
      dataIndex: 'fileType',
      key: 'fileType',
      width: 150,
      ellipsis: true,
      render: (type) => <Tag>{type}</Tag>
    },
    {
      title: '存储方式',
      dataIndex: 'storageType',
      key: 'storageType',
      width: 100,
      render: (type) => (
        <Tag color={type === 'local' ? 'blue' : 'green'}>
          {type.toUpperCase()}
        </Tag>
      )
    },
    {
      title: '下载次数',
      dataIndex: 'downloadCount',
      key: 'downloadCount',
      width: 100,
      sorter: (a, b) => a.downloadCount - b.downloadCount
    },
    {
      title: '上传IP',
      dataIndex: 'uploadIp',
      key: 'uploadIp',
      width: 140,
      render: (ip) => ip || '-'
    },
    {
      title: '上传时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (text) => new Date(text).toLocaleString('zh-CN')
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
            onClick={() => handlePreview(record)}
          >
            预览
          </Button>
          <Button 
            type="link" 
            size="small" 
            icon={<DownloadOutlined />}
            onClick={() => handleDownload(record)}
          >
            下载
          </Button>
          <Popconfirm
            title="确定要删除这个文件吗？"
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

  /** 当前页文件总大小（字节） */
  const totalSize = files.reduce((sum, f) => sum + f.fileSize, 0);

  return (
    <div style={{ padding: '24px' }}>
      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="总文件数"
              value={pagination.total}
              prefix={<FileOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="总大小"
              value={formatFileSize(totalSize)}
              prefix={<CloudUploadOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="总下载次数"
              value={files.reduce((sum, f) => sum + f.downloadCount, 0)}
              prefix={<DownloadOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="今日上传"
              value={0}
            />
          </Card>
        </Col>
      </Row>

      {/* 筛选栏 */}
      <Card style={{ marginBottom: 16 }}>
        <Space wrap>
          <Select
            placeholder="文件类型"
            style={{ width: 150 }}
            allowClear
            value={filters.fileType}
            onChange={(value) => setFilters({ ...filters, fileType: value })}
          >
            <Select.Option value="image">图片</Select.Option>
            <Select.Option value="video">视频</Select.Option>
            <Select.Option value="audio">音频</Select.Option>
            <Select.Option value="document">文档</Select.Option>
            <Select.Option value="archive">压缩包</Select.Option>
          </Select>

          <Input
            placeholder="搜索文件名"
            style={{ width: 200 }}
            value={filters.keyword}
            onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
            prefix={<SearchOutlined />}
          />

          <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
            搜索
          </Button>
          <Button onClick={handleReset}>
            重置
          </Button>
          <Button icon={<ReloadOutlined />} onClick={() => fetchFiles()}>
            刷新
          </Button>
        </Space>
      </Card>

      {/* 文件表格 */}
      <Card>
        <Table
          columns={columns}
          dataSource={files}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1400 }}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 个文件`,
            onChange: (page, pageSize) => fetchFiles(page, pageSize)
          }}
        />
      </Card>

      {/* 预览弹窗 */}
      <Modal
        title="文件详情"
        open={previewVisible}
        onCancel={() => setPreviewVisible(false)}
        footer={[
          <Button key="download" type="primary" icon={<DownloadOutlined />} onClick={() => previewFile && handleDownload(previewFile)}>
            下载
          </Button>,
          <Button key="close" onClick={() => setPreviewVisible(false)}>
            关闭
          </Button>
        ]}
        width={800}
      >
        {previewFile && (
          <div>
            <p><strong>文件名：</strong>{previewFile.fileName}</p>
            <p><strong>文件大小：</strong>{formatFileSize(previewFile.fileSize)}</p>
            <p><strong>文件类型：</strong><Tag>{previewFile.fileType}</Tag></p>
            <p><strong>存储方式：</strong>
              <Tag color={previewFile.storageType === 'local' ? 'blue' : 'green'}>
                {previewFile.storageType.toUpperCase()}
              </Tag>
            </p>
            <p><strong>下载次数：</strong>{previewFile.downloadCount}</p>
            <p><strong>上传IP：</strong>{previewFile.uploadIp || '-'}</p>
            <p><strong>上传时间：</strong>{new Date(previewFile.createdAt).toLocaleString('zh-CN')}</p>
            
            {previewFile.fileType.startsWith('image/') && (
              <div style={{ marginTop: 16, textAlign: 'center' }}>
                <Image
                  src={previewFile.fileUrl}
                  alt={previewFile.fileName}
                  style={{ maxWidth: '100%' }}
                />
              </div>
            )}
            
            {!previewFile.fileType.startsWith('image/') && (
              <div style={{ 
                marginTop: 16, 
                padding: '40px', 
                background: '#f5f5f5', 
                borderRadius: '4px',
                textAlign: 'center'
              }}>
                <p style={{ fontSize: 48 }}>{getFileIcon(previewFile.fileType)}</p>
                <p>此文件类型不支持预览，请下载后查看</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default FileManagement;
