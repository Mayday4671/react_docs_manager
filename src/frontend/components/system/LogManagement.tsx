import React, { useState, useEffect } from 'react';
import { 
  Table, Button, Space, Modal, message, Tag, Card, 
  Select, DatePicker, Input, Row, Col, Statistic, theme
} from 'antd';
import { 
  FileTextOutlined, ReloadOutlined, SearchOutlined,
  CheckCircleOutlined, CloseCircleOutlined, EyeOutlined,
  RiseOutlined, FallOutlined, BarChartOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs, { Dayjs } from 'dayjs';
import { Area, Pie, Column } from '@ant-design/plots';

const { RangePicker } = DatePicker;

interface Log {
  id: number;
  module: string;
  action: string;
  method?: string;
  url?: string;
  ip?: string;
  userAgent?: string;
  params?: string;
  result?: string;
  errorMsg?: string;
  costTime?: number;
  userId?: number;
  username?: string;
  status: number;
  createdAt: string;
}

const LogManagement: React.FC = () => {
  const { token } = theme.useToken();
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewingLog, setViewingLog] = useState<Log | null>(null);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [stats, setStats] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  
  // 筛选条件
  const [filters, setFilters] = useState({
    action: undefined as string | undefined,
    status: undefined as number | undefined,
    dateRange: null as [Dayjs, Dayjs] | null,
    keyword: ''
  });

  // 获取统计数据
  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const res = await fetch('/api/logs?action=stats');
      const data = await res.json();
      if (data.success) setStats(data.data);
    } catch { /* ignore */ }
    finally { setStatsLoading(false); }
  };

  // 获取日志列表
  const fetchLogs = async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString()
      });
      
      if (filters.action) params.append('action', filters.action);
      if (filters.status !== undefined) params.append('status', filters.status.toString());
      if (filters.keyword) params.append('keyword', filters.keyword);
      if (filters.dateRange) {
        params.append('startDate', filters.dateRange[0].toISOString());
        params.append('endDate', filters.dateRange[1].toISOString());
      }

      const response = await fetch(`/api/logs?${params.toString()}`);
      const data = await response.json();
      setLogs(data.data);
      setPagination({
        current: data.page,
        pageSize: data.pageSize,
        total: data.total
      });
    } catch (error) {
      message.error('获取日志列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    fetchStats();
  }, []);

  // 查看详情
  const handleView = (log: Log) => {
    setViewingLog(log);
    setViewModalOpen(true);
  };

  // 搜索
  const handleSearch = () => {
    fetchLogs(1, pagination.pageSize);
  };

  // 重置筛选
  const handleReset = () => {
    setFilters({
      action: undefined,
      status: undefined,
      dateRange: null,
      keyword: ''
    });
    setTimeout(() => fetchLogs(1, pagination.pageSize), 0);
  };

  // 操作类型标签颜色
  const getActionColor = (action: string) => {
    const colors: Record<string, string> = {
      CREATE: 'green',
      UPDATE: 'blue',
      DELETE: 'red',
      LOGIN: 'cyan',
      LOGOUT: 'default',
      QUERY: 'purple'
    };
    return colors[action] || 'default';
  };

  // 表格列定义
  const columns: ColumnsType<Log> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '模块',
      dataIndex: 'module',
      key: 'module',
      width: 120,
      render: (text) => (
        <Space>
          <FileTextOutlined />
          <span>{text}</span>
        </Space>
      )
    },
    {
      title: '操作',
      dataIndex: 'action',
      key: 'action',
      width: 100,
      render: (action) => (
        <Tag color={getActionColor(action)}>
          {action}
        </Tag>
      )
    },
    {
      title: '请求方法',
      dataIndex: 'method',
      key: 'method',
      width: 100,
      render: (method) => method || '-'
    },
    {
      title: 'URL',
      dataIndex: 'url',
      key: 'url',
      ellipsis: true,
      render: (url) => url || '-'
    },
    {
      title: '操作用户',
      dataIndex: 'username',
      key: 'username',
      width: 120,
      render: (username) => username || '系统'
    },
    {
      title: 'IP地址',
      dataIndex: 'ip',
      key: 'ip',
      width: 140,
      render: (ip) => ip === '::1' ? '127.0.0.1 (本地)' : (ip || '-'),
    },
    {
      title: '耗时',
      dataIndex: 'costTime',
      key: 'costTime',
      width: 100,
      render: (time) => time ? `${time}ms` : '-',
      sorter: (a, b) => (a.costTime || 0) - (b.costTime || 0)
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => (
        <Tag 
          icon={status === 1 ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
          color={status === 1 ? 'success' : 'error'}
        >
          {status === 1 ? '成功' : '失败'}
        </Tag>
      )
    },
    {
      title: '操作时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (text) => new Date(text).toLocaleString('zh-CN')
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      fixed: 'right',
      render: (_, record) => (
        <Button 
          type="link" 
          size="small" 
          icon={<EyeOutlined />}
          onClick={() => handleView(record)}
        >
          详情
        </Button>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="总日志数"
              value={stats?.total ?? pagination.total}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="成功操作"
              value={stats?.successCount ?? 0}
              valueStyle={{ color: token.colorSuccess }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="失败操作"
              value={stats?.failCount ?? 0}
              valueStyle={{ color: token.colorError }}
              prefix={<CloseCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="成功率"
              value={stats?.successRate ?? 100}
              suffix="%"
              valueStyle={{ color: (stats?.successRate ?? 100) >= 90 ? token.colorSuccess : token.colorWarning }}
              prefix={<RiseOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* 图表区域 */}
      {stats && (
        <Row gutter={16} style={{ marginBottom: 16 }}>
          {/* 近7天操作趋势 */}
          <Col span={14}>
            <Card
              title={<span><BarChartOutlined style={{ marginRight: 6 }} />近7天操作趋势</span>}
              size="small"
              loading={statsLoading}
            >
              <Area
                data={stats.trend.flatMap((d: any) => [
                  { date: d.date, value: d.success, type: '成功' },
                  { date: d.date, value: d.fail, type: '失败' },
                ])}
                xField="date"
                yField="value"
                seriesField="type"
                color={[token.colorSuccess, token.colorError]}
                height={180}
                smooth
                areaStyle={{ fillOpacity: 0.15 }}
                legend={{ position: 'top-right' }}
                xAxis={{ label: { style: { fontSize: 11 } } }}
                yAxis={{ label: { style: { fontSize: 11 } } }}
              />
            </Card>
          </Col>

          {/* 模块操作分布 */}
          <Col span={10}>
            <Card
              title="模块操作分布（近30天）"
              size="small"
              loading={statsLoading}
            >
              {stats.moduleStats.length > 0 ? (
                <Column
                  data={stats.moduleStats}
                  xField="module"
                  yField="count"
                  color={token.colorPrimary}
                  height={180}
                  label={{ position: 'top', style: { fontSize: 10 } }}
                  xAxis={{ label: { style: { fontSize: 10 }, autoRotate: true } }}
                  yAxis={{ label: { style: { fontSize: 10 } } }}
                />
              ) : (
                <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: token.colorTextTertiary }}>
                  暂无数据
                </div>
              )}
            </Card>
          </Col>
        </Row>
      )}

      {/* 筛选栏 */}
      <Card style={{ marginBottom: 16 }}>
        <Space wrap style={{ marginBottom: 16 }}>
          <Select
            placeholder="操作类型"
            style={{ width: 120 }}
            allowClear
            value={filters.action}
            onChange={(value) => setFilters({ ...filters, action: value })}
          >
            <Select.Option value="CREATE">创建</Select.Option>
            <Select.Option value="UPDATE">更新</Select.Option>
            <Select.Option value="DELETE">删除</Select.Option>
            <Select.Option value="LOGIN">登录</Select.Option>
            <Select.Option value="LOGOUT">登出</Select.Option>
            <Select.Option value="QUERY">查询</Select.Option>
          </Select>

          <Select
            placeholder="状态"
            style={{ width: 120 }}
            allowClear
            value={filters.status}
            onChange={(value) => setFilters({ ...filters, status: value })}
          >
            <Select.Option value={1}>成功</Select.Option>
            <Select.Option value={0}>失败</Select.Option>
          </Select>

          <RangePicker
            showTime
            value={filters.dateRange}
            onChange={(dates) => setFilters({ ...filters, dateRange: dates as [Dayjs, Dayjs] | null })}
          />

          <Input
            placeholder="搜索用户名/IP/URL"
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
          <Button icon={<ReloadOutlined />} onClick={() => fetchLogs()}>
            刷新
          </Button>
        </Space>
      </Card>

      {/* 日志表格 */}
      <Card>
        <Table
          columns={columns}
          dataSource={logs}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1400 }}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条记录`,
            onChange: (page, pageSize) => fetchLogs(page, pageSize)
          }}
        />
      </Card>

      {/* 查看详情弹窗 */}
      <Modal
        title="日志详情"
        open={viewModalOpen}
        onCancel={() => setViewModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setViewModalOpen(false)}>
            关闭
          </Button>
        ]}
        width={800}
      >
        {viewingLog && (
          <div>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <p><strong>模块：</strong>{viewingLog.module}</p>
              </Col>
              <Col span={12}>
                <p><strong>操作：</strong>
                  <Tag color={getActionColor(viewingLog.action)}>{viewingLog.action}</Tag>
                </p>
              </Col>
              <Col span={12}>
                <p><strong>请求方法：</strong>{viewingLog.method || '-'}</p>
              </Col>
              <Col span={12}>
                <p><strong>状态：</strong>
                  <Tag 
                    icon={viewingLog.status === 1 ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
                    color={viewingLog.status === 1 ? 'success' : 'error'}
                  >
                    {viewingLog.status === 1 ? '成功' : '失败'}
                  </Tag>
                </p>
              </Col>
              <Col span={24}>
                <p><strong>URL：</strong>{viewingLog.url || '-'}</p>
              </Col>
              <Col span={12}>
                <p><strong>操作用户：</strong>{viewingLog.username || '系统'} (ID: {viewingLog.userId || '-'})</p>
              </Col>
              <Col span={12}>
                <p><strong>IP地址：</strong>{viewingLog.ip === '::1' ? '127.0.0.1 (本地)' : (viewingLog.ip || '-')}</p>
              </Col>
              <Col span={12}>
                <p><strong>耗时：</strong>{viewingLog.costTime ? `${viewingLog.costTime}ms` : '-'}</p>
              </Col>
              <Col span={12}>
                <p><strong>操作时间：</strong>{new Date(viewingLog.createdAt).toLocaleString('zh-CN')}</p>
              </Col>
            </Row>

            {viewingLog.params && (
              <>
                <p style={{ marginTop: 16 }}><strong>请求参数：</strong></p>
                <pre style={{
                  padding: '12px',
                  background: token.colorFillTertiary,
                  color: token.colorText,
                  borderRadius: '6px',
                  overflow: 'auto',
                  maxHeight: '200px',
                  fontSize: 12,
                  border: `1px solid ${token.colorBorderSecondary}`,
                }}>
                  {(() => { try { return JSON.stringify(JSON.parse(viewingLog.params!), null, 2); } catch { return viewingLog.params; } })()}
                </pre>
              </>
            )}

            {viewingLog.result && (
              <>
                <p style={{ marginTop: 16 }}><strong>操作结果：</strong></p>
                <pre style={{
                  padding: '12px',
                  background: token.colorFillTertiary,
                  color: token.colorText,
                  borderRadius: '6px',
                  overflow: 'auto',
                  maxHeight: '200px',
                  fontSize: 12,
                  border: `1px solid ${token.colorBorderSecondary}`,
                }}>
                  {viewingLog.result}
                </pre>
              </>
            )}

            {viewingLog.errorMsg && (
              <>
                <p style={{ marginTop: 16 }}><strong>错误信息：</strong></p>
                <div style={{
                  padding: '12px',
                  background: token.colorErrorBg,
                  borderRadius: '6px',
                  color: token.colorError,
                  whiteSpace: 'pre-wrap',
                  fontSize: 12,
                  border: `1px solid ${token.colorErrorBorder}`,
                }}>
                  {viewingLog.errorMsg}
                </div>
              </>
            )}

            {viewingLog.userAgent && (
              <>
                <p style={{ marginTop: 16 }}><strong>User Agent：</strong></p>
                <div style={{
                  padding: '12px',
                  background: token.colorFillTertiary,
                  borderRadius: '6px',
                  fontSize: '12px',
                  wordBreak: 'break-all',
                  color: token.colorTextSecondary,
                  border: `1px solid ${token.colorBorderSecondary}`,
                }}>
                  {viewingLog.userAgent}
                </div>
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default LogManagement;
