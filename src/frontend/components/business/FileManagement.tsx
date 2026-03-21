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

interface FileRecord {
  id: number;
  fileName: string;
  fileSize: number;
  fileType: string;
  fileExt: string;
  filePath: string;
  fileUrl: string;
  storageType: string;
  uploadBy?: number;
  uploadIp?: string;
  status: number;
  downloadCount: number;
  createdAt: string;
}

const FileManagement: React.FC = () => {
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewFile, setPreviewFile] = useState<FileRecord | null>(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  const [filters, setFilters] = useState({
    fileType: undefined as string | undefined,
    keyword: ''
  });

  // 获取文件列表
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

  // 格式化文件大小
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  // 预览文件
  const handlePreview = (file: FileRecord) => {
    setPreviewFile(file);
    setPreviewVisible(true);
  };

  // 下载文件
  const handleDownload = (file: FileRecord) => {
    window.open(file.fileUrl, '_blank');
    message.success('开始下载');
  };

  // 删除文件
  const handleDelete = async (id: number) => {
    message.info('删除功能开发中...');
  };

  // 搜索
  const handleSearch = () => {
    fetchFiles(1, pagination.pageSize);
  };

  // 重置筛选
  const handleReset = () => {
    setFilters({
      fileType: undefined,
      keyword: ''
    });
    setTimeout(() => fetchFiles(1, pagination.pageSize), 0);
  };

  // 文件类型图标
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

  // 表格列定义
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
