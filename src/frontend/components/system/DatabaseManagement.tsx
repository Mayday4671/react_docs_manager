import React, { useState, useEffect } from 'react';
import { 
  Card, Row, Col, Statistic, Table, Tag, Button, Space, 
  Tabs, message, Spin, Alert 
} from 'antd';
import { 
  DatabaseOutlined, UserOutlined, TeamOutlined, SettingOutlined,
  FileTextOutlined, BellOutlined, RocketOutlined, FileOutlined,
  ReloadOutlined, RightOutlined, TableOutlined, MenuOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useRouter } from 'next/navigation';

// 图标映射
const iconMap: Record<string, React.ReactNode> = {
  UserOutlined: <UserOutlined />,
  TeamOutlined: <TeamOutlined />,
  MenuOutlined: <MenuOutlined />,
  SettingOutlined: <SettingOutlined />,
  FileTextOutlined: <FileTextOutlined />,
  BellOutlined: <BellOutlined />,
  RocketOutlined: <RocketOutlined />,
  FileOutlined: <FileOutlined />,
  DatabaseOutlined: <DatabaseOutlined />,
  TableOutlined: <TableOutlined />,
};

interface TableInfo {
  name: string;
  displayName: string;
  icon: string; // 改为字符串类型
  color: string;
  count: number;
  description: string;
  route: string;
  category: 'system' | 'business';
}

const DatabaseManagement: React.FC = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [tableStats, setTableStats] = useState<TableInfo[]>([]);
  const [activeTab, setActiveTab] = useState<string>('all');

  // 获取所有表的统计信息
  const fetchTableStats = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/database/stats');
      const data = await response.json();
      
      if (data.success && Array.isArray(data.data)) {
        setTableStats(data.data);
      } else {
        console.error('Invalid data format:', data);
        message.error('获取数据库统计失败：数据格式错误');
        setTableStats([]);
      }
    } catch (error) {
      console.error('Fetch error:', error);
      message.error('获取数据库统计失败');
      setTableStats([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTableStats();
  }, []);

  // 跳转到管理页面
  const handleNavigate = (route: string) => {
    router.push(route);
  };

  // 过滤表格数据
  const filteredTables = tableStats.filter(table => 
    activeTab === 'all' || table.category === activeTab
  );

  // 系统表
  const systemTables = tableStats.filter(t => t.category === 'system');
  const businessTables = tableStats.filter(t => t.category === 'business');

  // 总记录数
  const totalRecords = tableStats.reduce((sum, t) => sum + t.count, 0);

  // 表格列定义
  const columns: ColumnsType<TableInfo> = [
    {
      title: '表名',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <Space>
          {iconMap[record.icon] || <DatabaseOutlined />}
          <span style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>
            {text || ''}
          </span>
        </Space>
      )
    },
    {
      title: '显示名称',
      dataIndex: 'displayName',
      key: 'displayName',
      render: (text) => <strong>{text || ''}</strong>
    },
    {
      title: '类型',
      dataIndex: 'category',
      key: 'category',
      width: 120,
      render: (category) => (
        <Tag color={category === 'system' ? 'purple' : 'green'}>
          {category === 'system' ? '系统表' : '业务表'}
        </Tag>
      )
    },
    {
      title: '记录数',
      dataIndex: 'count',
      key: 'count',
      width: 120,
      sorter: (a, b) => a.count - b.count,
      render: (count) => (
        <Tag color="blue" style={{ fontSize: 14, padding: '4px 12px' }}>
          {(count || 0).toLocaleString()}
        </Tag>
      )
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (text) => text || ''
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Button 
          type="primary" 
          size="small"
          icon={<RightOutlined />}
          onClick={() => handleNavigate(record.route)}
        >
          管理
        </Button>
      ),
    },
  ];

  const tabItems = [
    { 
      key: 'all', 
      label: `全部表 (${tableStats.length})`,
      icon: <DatabaseOutlined />
    },
    { 
      key: 'system', 
      label: `系统表 (${systemTables.length})`,
      icon: <SettingOutlined />
    },
    { 
      key: 'business', 
      label: `业务表 (${businessTables.length})`,
      icon: <TableOutlined />
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      {/* 页面标题 */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 24 }}>
          <DatabaseOutlined style={{ marginRight: 8 }} />
          数据库管理
        </h2>
        <p style={{ color: '#666', marginTop: 8 }}>
          查看所有数据库表的统计信息，快速访问各个管理页面
        </p>
      </div>

      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="数据库表总数"
              value={tableStats.length || 0}
              prefix={<DatabaseOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="系统表"
              value={systemTables.length || 0}
              prefix={<SettingOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="业务表"
              value={businessTables.length || 0}
              prefix={<TableOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="总记录数"
              value={totalRecords || 0}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 快速访问卡片 */}
      {tableStats.length > 0 && (
        <Card 
          title={
            <Space>
              <RocketOutlined />
              <span>快速访问</span>
            </Space>
          }
          style={{ marginBottom: 24 }}
        >
          <Row gutter={[12, 12]}>
            {tableStats.map((table) => (
              <Col span={3} key={table.name || Math.random()}>
                <Card
                  hoverable
                  onClick={() => handleNavigate(table.route)}
                  style={{ 
                    borderColor: table.color || '#d9d9d9',
                    cursor: 'pointer',
                    minHeight: 120
                  }}
                  styles={{ body: { padding: 12 } }}
                >
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 24, color: table.color || '#1890ff', marginBottom: 6 }}>
                      {iconMap[table.icon] || <DatabaseOutlined />}
                    </div>
                    <div style={{ 
                      fontWeight: 'bold', 
                      marginBottom: 4, 
                      fontSize: 12,
                      lineHeight: '14px',
                      height: 28,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {table.displayName || '未知表'}
                    </div>
                    <div style={{ fontSize: 18, color: table.color || '#1890ff', fontWeight: 'bold', marginBottom: 2 }}>
                      {table.count || 0}
                    </div>
                    <div style={{ fontSize: 10, color: '#999', lineHeight: '12px' }}>
                      {table.name || ''}
                    </div>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </Card>
      )}

      {/* 详细表格 */}
      <Card>
        <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }}>
          <Tabs 
            activeKey={activeTab} 
            onChange={setActiveTab}
            items={tabItems}
          />
          <Button 
            icon={<ReloadOutlined />}
            onClick={fetchTableStats}
            loading={loading}
          >
            刷新
          </Button>
        </Space>

        <Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={filteredTables}
            rowKey="name"
            pagination={false}
          />
        </Spin>
      </Card>

      {/* 提示信息 */}
      <Alert
        message="数据库管理说明"
        description={
          <div>
            <p>• <strong>系统表 (sys_*)</strong>: 存储系统核心数据，如用户、角色、菜单、配置、日志等</p>
            <p>• <strong>业务表 (tbl_*)</strong>: 存储业务数据，如通知、更新日志、文件等</p>
            <p>• 点击"管理"按钮可以快速跳转到对应的管理页面</p>
            <p>• 点击快速访问卡片也可以直接跳转</p>
          </div>
        }
        type="info"
        showIcon
        style={{ marginTop: 24 }}
      />
    </div>
  );
};

export default DatabaseManagement;
