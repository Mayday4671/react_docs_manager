'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Input,
  Button,
  Tag,
  Typography,
  Space,
  Statistic,
  Badge,
  message,
  Spin,
  Empty,
  Tree,
  Drawer,
  Descriptions,
  Select,
  Modal,
  Form,
  Switch,
  Collapse,
  Tooltip,
  App,
} from 'antd';
import {
  ApiOutlined,
  FolderOutlined,
  PlayCircleOutlined,
  InfoCircleOutlined,
  ClockCircleOutlined,
  EyeOutlined,
  FolderOpenOutlined,
  SettingOutlined,
  SaveOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { useTheme } from '@/frontend/context/ThemeContext';
import JsonView from '@uiw/react-json-view';

const { Search } = Input;
const { Text, Title, Paragraph } = Typography;

interface ApiCategory {
  id: number;
  name: string;
  description?: string;
  icon?: string;
  parentId?: number | null;
  orderNum: number;
  apis?: HkApi[];
  children?: ApiCategory[];
}

interface HkApi {
  id: number;
  name: string;
  path: string;
  method: string;
  description?: string;
  summary?: string;
  categoryId: number;
  category?: {
    id: number;
    name: string;
    description?: string;
    icon?: string;
    orderNum: number;
  };
  requestHeaders?: string;
  requestParams?: string;
  requestBody?: string;
  responseExample?: string;
  responseSchema?: string;
  version?: string;
  deprecated: number;
  needAuth: number;
  rateLimit?: string;
  notes?: string;
  callCount: number;
  lastCall?: string;
  status: number;
}

interface ApiStats {
  totalApis: number;
  totalCategories: number;
  totalCalls: number;
  recentApis: HkApi[];
}

const HkApiDocs: React.FC = () => {
  const { darkMode, colorPrimary } = useTheme();
  const { message: messageApi, modal: modalApi } = App.useApp();
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<ApiCategory | null>(null);
  const [selectedApi, setSelectedApi] = useState<HkApi | null>(null);
  const [stats, setStats] = useState<ApiStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchResults, setSearchResults] = useState<HkApi[]>([]);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([]);
  
  // API调试配置状态
  const [debugConfig, setDebugConfig] = useState({
    baseUrl: 'http://127.0.0.1:80',
    appKey: '',
    appSecret: ''
  });
  const [debugResponse, setDebugResponse] = useState<string>('');
  const [debugLoading, setDebugLoading] = useState(false);
  const [editedRequestBody, setEditedRequestBody] = useState<string>('');
  const [isUsingSavedBody, setIsUsingSavedBody] = useState(false);
  
  // 配置管理状态
  const [savedConfigs, setSavedConfigs] = useState<any[]>([]);
  const [selectedConfigId, setSelectedConfigId] = useState<number | null>(null);
  const [configModalVisible, setConfigModalVisible] = useState(false);
  const [configManageModalVisible, setConfigManageModalVisible] = useState(false);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [configToDelete, setConfigToDelete] = useState<any>(null);
  const [configForm, setConfigForm] = useState({
    name: '',
    baseUrl: '',
    appKey: '',
    appSecret: '',
    description: '',
    isDefault: 0
  });

  // 获取分类和API数据
  const fetchData = async () => {
    try {
      setLoading(true);
      const [categoriesRes, statsRes] = await Promise.all([
        fetch('/api/hk-categories'),
        fetch('/api/hk-apis?action=stats')
      ]);

      if (categoriesRes.ok) {
        const categoriesData = await categoriesRes.json();
        console.log('获取到的分类数据:', categoriesData);
        setCategories(categoriesData.data || []);
        // 默认选择第一个分类
        if (categoriesData.data && categoriesData.data.length > 0) {
          setSelectedCategory(categoriesData.data[0]);
        }
      } else {
        console.error('获取分类失败:', categoriesRes.status, categoriesRes.statusText);
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.data);
      }
    } catch (error) {
      console.error('获取数据失败:', error);
      messageApi.error('获取数据失败');
    } finally {
      setLoading(false);
    }
  };

  // 搜索API
  const handleSearch = async (keyword: string) => {
    setSearchKeyword(keyword);
    if (!keyword.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const response = await fetch(`/api/hk-apis?keyword=${encodeURIComponent(keyword)}`);
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.data || []);
      }
    } catch (error) {
      console.error('搜索失败:', error);
      messageApi.error('搜索失败');
    }
  };

  // 增加API调用次数
  const handleApiCall = async (apiId: number) => {
    try {
      await fetch('/api/hk-apis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'increment-call', id: apiId })
      });
      messageApi.success('API调用成功');
      // 刷新数据
      fetchData();
    } catch (error) {
      console.error('更新调用统计失败:', error);
    }
  };

  // 查看API详情
  const handleViewApiDetail = (api: HkApi) => {
    setSelectedApi(api);
    setDrawerVisible(true);
    
    // 初始化请求体编辑器
    // 优先使用保存的请求体，否则使用API的示例
    try {
      const savedBodies = JSON.parse(localStorage.getItem('hk-api-saved-bodies') || '{}');
      if (savedBodies[api.id]) {
        // 使用保存的请求体
        setEditedRequestBody(savedBodies[api.id]);
        setIsUsingSavedBody(true);
      } else if (api.requestBody) {
        // 使用API的示例请求体
        try {
          const parsed = JSON.parse(api.requestBody);
          setEditedRequestBody(JSON.stringify(parsed, null, 2));
        } catch {
          setEditedRequestBody(api.requestBody);
        }
        setIsUsingSavedBody(false);
      } else {
        setEditedRequestBody('{}');
        setIsUsingSavedBody(false);
      }
    } catch {
      // localStorage读取失败，使用API的示例
      if (api.requestBody) {
        try {
          const parsed = JSON.parse(api.requestBody);
          setEditedRequestBody(JSON.stringify(parsed, null, 2));
        } catch {
          setEditedRequestBody(api.requestBody);
        }
      } else {
        setEditedRequestBody('{}');
      }
      setIsUsingSavedBody(false);
    }
    
    setDebugResponse(''); // 清空之前的响应
  };

  // 加载保存的配置
  const loadSavedConfigs = async () => {
    try {
      const response = await fetch('/api/hk-configs');
      if (response.ok) {
        const data = await response.json();
        setSavedConfigs(data.data || []);
        
        // 加载默认配置
        const defaultConfig = data.data?.find((c: any) => c.isDefault === 1);
        if (defaultConfig) {
          setDebugConfig({
            baseUrl: defaultConfig.baseUrl,
            appKey: defaultConfig.appKey,
            appSecret: defaultConfig.appSecret
          });
          setSelectedConfigId(defaultConfig.id);
        }
      }
    } catch (error) {
      console.error('加载配置失败:', error);
    }
  };

  // 选择配置
  const handleSelectConfig = (configId: number) => {
    const config = savedConfigs.find(c => c.id === configId);
    if (config) {
      setDebugConfig({
        baseUrl: config.baseUrl,
        appKey: config.appKey,
        appSecret: config.appSecret
      });
      setSelectedConfigId(configId);
      messageApi.success(`已切换到配置：${config.name}`);
    }
  };

  // 保存当前配置
  const handleSaveConfig = () => {
    setConfigForm({
      name: '',
      baseUrl: debugConfig.baseUrl,
      appKey: debugConfig.appKey,
      appSecret: debugConfig.appSecret,
      description: '',
      isDefault: 0
    });
    setConfigModalVisible(true);
  };

  // 提交保存配置
  // 提交保存配置
  const handleSubmitConfig = async () => {
    if (!configForm.name) {
      messageApi.error('请输入配置名称');
      return;
    }
    
    try {
      console.log('发送的配置数据:', configForm);
      
      const response = await fetch('/api/hk-configs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(configForm)
      });
      
      const result = await response.json();
      console.log('服务器响应:', result);
      
      if (response.ok && result.success) {
        messageApi.success('配置保存成功');
        setConfigModalVisible(false);
        loadSavedConfigs();
      } else {
        messageApi.error(result.message || '配置保存失败');
      }
    } catch (error: any) {
      console.error('保存配置失败:', error);
      messageApi.error(`配置保存失败: ${error.message}`);
    }
  };

  // 删除配置
  const handleDeleteConfig = async (configId: number) => {
    try {
      const response = await fetch(`/api/hk-configs?id=${configId}`, {
        method: 'DELETE'
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        messageApi.success('配置删除成功');
        await loadSavedConfigs();
        if (selectedConfigId === configId) {
          setSelectedConfigId(null);
        }
      } else {
        messageApi.error(result.message || '配置删除失败');
        console.error('删除失败:', result);
      }
    } catch (error) {
      console.error('删除配置失败:', error);
      messageApi.error('配置删除失败');
    }
  };

  // 设置默认配置
  const handleSetDefaultConfig = async (configId: number) => {
    try {
      const response = await fetch('/api/hk-configs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'set-default', id: configId })
      });
      
      if (response.ok) {
        messageApi.success('设置默认配置成功');
        loadSavedConfigs();
      } else {
        messageApi.error('设置默认配置失败');
      }
    } catch (error) {
      console.error('设置默认配置失败:', error);
      messageApi.error('设置默认配置失败');
    }
  };

  useEffect(() => {
    fetchData();
    loadSavedConfigs();
  }, []);

  // 构建树形数据（支持多级分类）
  const buildTreeData = () => {
    if (!categories || categories.length === 0) {
      console.log('buildTreeData: 没有分类数据');
      return [];
    }

    console.log('buildTreeData: 开始构建树形数据，分类数量:', categories.length);

    const buildNode = (category: ApiCategory): any => {
      const hasChildren = category.children && category.children.length > 0;
      const hasApis = category.apis && category.apis.length > 0;
      
      const node: any = {
        title: (
          <Space>
            <span>{category.name}</span>
            {hasApis && (
              <Badge 
                count={category.apis?.length || 0}
                color={colorPrimary}
              />
            )}
          </Space>
        ),
        key: `category-${category.id}`,
        icon: <FolderOutlined />,
        data: category,
      };

      // 如果有子分类，递归构建
      if (hasChildren) {
        node.children = category.children!.map(child => buildNode(child));
      }

      // 如果有API，添加到children中
      if (hasApis) {
        const apiNodes = category.apis!.map(api => ({
          title: (
            <Tooltip title={api.name} placement="right" mouseEnterDelay={0.5}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                width: '100%',
                maxWidth: '100%',
                overflow: 'hidden',
                boxSizing: 'border-box'
              }}>
                <Tag color={getMethodColor(api.method)} style={{ flexShrink: 0, margin: 0 }}>
                  {api.method}
                </Tag>
                <span style={{ 
                  overflow: 'hidden', 
                  textOverflow: 'ellipsis', 
                  whiteSpace: 'nowrap',
                  flex: 1,
                  minWidth: 0,
                  display: 'block'
                }}>
                  {api.name}
                </span>
                {api.deprecated === 1 && <Tag color="red" style={{ flexShrink: 0, margin: 0 }}>弃用</Tag>}
              </div>
            </Tooltip>
          ),
          key: `api-${api.id}`,
          icon: <ApiOutlined />,
          isLeaf: true,
          data: api
        }));

        if (node.children) {
          node.children = [...node.children, ...apiNodes];
        } else {
          node.children = apiNodes;
        }
      }

      return node;
    };

    const treeData = categories.map(category => buildNode(category));
    console.log('buildTreeData: 构建完成，树节点数量:', treeData.length);
    return treeData;
  };

  // 获取方法标签颜色
  const getMethodColor = (method: string) => {
    const colors: Record<string, string> = {
      'GET': 'green',
      'POST': 'blue',
      'PUT': 'orange',
      'DELETE': 'red',
      'PATCH': 'purple'
    };
    return colors[method.toUpperCase()] || 'default';
  };

  // 递归查找分类
  const findCategoryById = (categories: ApiCategory[], id: number): ApiCategory | null => {
    for (const cat of categories) {
      if (cat.id === id) return cat;
      if (cat.children && cat.children.length > 0) {
        const found = findCategoryById(cat.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  // 树节点选择处理
  const handleTreeSelect = (selectedKeys: React.Key[], info: any) => {
    const key = selectedKeys[0];
    if (!key) return;

    console.log('树节点选择:', key, info.node);

    if (key.toString().startsWith('category-')) {
      const categoryId = parseInt(key.toString().replace('category-', ''));
      const category = findCategoryById(categories, categoryId);
      console.log('找到分类:', category);
      if (category) {
        setSelectedCategory(category);
      }
    } else if (key.toString().startsWith('api-')) {
      const apiData = info.node.data;
      if (apiData) {
        handleViewApiDetail(apiData);
      }
    }
  };

  // 渲染API列表项
  const renderApiListItem = (api: HkApi) => {
    return (
      <div key={api.id} style={{ marginBottom: '8px' }}>
        <div 
          style={{
            backgroundColor: darkMode ? '#1f1f1f' : '#f8fafc',
            borderRadius: '6px',
            padding: '10px 14px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            border: `1px solid ${darkMode ? '#434343' : '#e2e8f0'}`,
            boxShadow: darkMode ? '0 1px 2px rgba(0, 0, 0, 0.3)' : '0 1px 2px rgba(0, 0, 0, 0.05)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = darkMode ? '#2a2a2a' : '#f1f5f9';
            e.currentTarget.style.boxShadow = darkMode ? '0 2px 8px rgba(0, 0, 0, 0.4)' : '0 2px 8px rgba(0, 0, 0, 0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = darkMode ? '#1f1f1f' : '#f8fafc';
            e.currentTarget.style.boxShadow = darkMode ? '0 1px 2px rgba(0, 0, 0, 0.3)' : '0 1px 2px rgba(0, 0, 0, 0.05)';
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {/* 左侧：HTTP方法标签 + API信息 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              {/* HTTP方法标签 - 圆角矩形 */}
              <div style={{ flexShrink: 0 }}>
                <span 
                  style={{
                    display: 'inline-block',
                    padding: '4px 12px',
                    borderRadius: '8px',
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: '14px',
                    minWidth: '60px',
                    textAlign: 'center',
                    backgroundColor: 
                      api.method === 'GET' ? '#3b82f6' : 
                      api.method === 'POST' ? '#10b981' : 
                      api.method === 'PUT' ? '#f59e0b' : 
                      api.method === 'DELETE' ? '#ef4444' : '#6b7280'
                  }}
                >
                  {api.method}
                </span>
              </div>
              
              {/* API名称和路径 */}
              <div style={{ flex: 1 }}>
                <div style={{ 
                  color: darkMode ? '#f1f5f9' : '#111827', 
                  fontWeight: '500', 
                  fontSize: '16px', 
                  marginBottom: '4px' 
                }}>
                  {api.name}
                </div>
                <div style={{ 
                  color: darkMode ? '#94a3b8' : '#6b7280', 
                  fontSize: '14px' 
                }}>
                  {api.path}
                </div>
              </div>
            </div>
            
            {/* 右侧：调用次数 + 操作按钮 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {/* 调用次数 - 直接显示并凸显 */}
              <div 
                style={{
                  backgroundColor: darkMode ? '#1e3a5f' : '#dbeafe',
                  color: darkMode ? '#60a5fa' : '#1e40af',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <EyeOutlined style={{ fontSize: '12px' }} />
                {api.callCount}
              </div>
              
              {/* 详情按钮 - 更凸显 */}
              <Button 
                type="primary"
                size="small"
                icon={<InfoCircleOutlined />}
                onClick={(e) => {
                  e.stopPropagation();
                  handleViewApiDetail(api);
                }}
                style={{ 
                  backgroundColor: '#3b82f6',
                  borderColor: '#3b82f6',
                  fontSize: '12px'
                }}
              >
                详情
              </Button>
              
              {/* 调用按钮 */}
              <Button 
                type="default"
                size="small"
                icon={<PlayCircleOutlined />}
                onClick={(e) => {
                  e.stopPropagation();
                  handleApiCall(api.id);
                }}
                style={{ 
                  color: '#10b981',
                  borderColor: '#10b981',
                  fontSize: '12px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#10b981';
                  e.currentTarget.style.color = 'white';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#10b981';
                }}
              >
                调用
              </Button>
            </div>
          </div>
          
          {/* 状态标签 - 如果有的话 */}
          {(api.deprecated === 1 || api.needAuth === 1 || api.version) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
              {api.deprecated === 1 && (
                <Tag color="red" className="text-xs">已弃用</Tag>
              )}
              {api.needAuth === 1 && (
                <Tag color="orange" className="text-xs">需认证</Tag>
              )}
              {api.version && (
                <Tag color="blue" className="text-xs">v{api.version}</Tag>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  // 渲染统计卡片
  const renderStatsCards = () => {
    if (!stats) return null;

    return (
      <Row gutter={[8, 8]}>
        <Col xs={12} sm={6}>
          <Card 
            size="small" 
            styles={{ 
              body: { padding: '8px 12px', textAlign: 'center' } 
            }}
            style={{
              backgroundColor: 'transparent',
              borderColor: darkMode ? '#303030' : '#d9d9d9'
            }}
          >
            <Statistic
              title="API总数"
              value={stats.totalApis}
              prefix={<ApiOutlined />}
              valueStyle={{ color: '#1890ff', fontSize: '16px' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card 
            size="small" 
            styles={{ 
              body: { padding: '8px 12px', textAlign: 'center' } 
            }}
            style={{
              backgroundColor: 'transparent',
              borderColor: darkMode ? '#303030' : '#d9d9d9'
            }}
          >
            <Statistic
              title="分类总数"
              value={stats.totalCategories}
              prefix={<FolderOutlined />}
              valueStyle={{ color: '#52c41a', fontSize: '16px' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card 
            size="small" 
            styles={{ 
              body: { padding: '8px 12px', textAlign: 'center' } 
            }}
            style={{
              backgroundColor: 'transparent',
              borderColor: darkMode ? '#303030' : '#d9d9d9'
            }}
          >
            <Statistic
              title="总调用次数"
              value={stats.totalCalls}
              prefix={<PlayCircleOutlined />}
              valueStyle={{ color: '#fa8c16', fontSize: '16px' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card 
            size="small" 
            styles={{ 
              body: { padding: '8px 12px', textAlign: 'center' } 
            }}
            style={{
              backgroundColor: 'transparent',
              borderColor: darkMode ? '#303030' : '#d9d9d9'
            }}
          >
            <Statistic
              title="最近使用"
              value={stats.recentApis.length}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#722ed1', fontSize: '16px' }}
            />
          </Card>
        </Col>
      </Row>
    );
  };

  // 实际调用API
  const handleRealApiCall = async () => {
    if (!debugConfig.baseUrl) {
      messageApi.error('请输入目标地址');
      return;
    }
    if (!debugConfig.appKey || !debugConfig.appSecret) {
      messageApi.error('请输入AppKey和AppSecret');
      return;
    }

    setDebugLoading(true);
    setDebugResponse('正在调用API...');

    try {
      if (!selectedApi) return;

      // 准备请求体 - 使用编辑后的请求体
      let requestBody = null;
      if (editedRequestBody && editedRequestBody.trim()) {
        try {
          requestBody = JSON.parse(editedRequestBody);
        } catch (error) {
          messageApi.error('请求体JSON格式错误');
          setDebugLoading(false);
          return;
        }
      }
      
      const requestParams = selectedApi.requestParams ? JSON.parse(selectedApi.requestParams) : null;

      // 通过后端代理调用，避免CORS问题
      const response = await fetch('/api/hk-apis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'proxy-call',
          config: {
            baseUrl: debugConfig.baseUrl,
            appKey: debugConfig.appKey,
            appSecret: debugConfig.appSecret,
            path: selectedApi.path,
            method: selectedApi.method,
            requestBody,
            requestParams
          }
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setDebugResponse(JSON.stringify(result.data, null, 2));
        messageApi.success('API调用成功');
      } else {
        setDebugResponse(`调用失败: ${result.error || '未知错误'}`);
        messageApi.error(result.error || 'API调用失败');
      }
    } catch (error: any) {
      setDebugResponse(`调用失败: ${error.message}`);
      messageApi.error('API调用失败');
    } finally {
      setDebugLoading(false);
    }
  };

  // 渲染API详情抽屉
  const renderApiDetailDrawer = () => {
    if (!selectedApi) return null;

    const tryParseJson = (jsonStr?: string) => {
      if (!jsonStr) return null;
      try {
        return JSON.parse(jsonStr);
      } catch {
        return jsonStr;
      }
    };

    return (
      <Drawer
        title={
          <Space>
            <Tag color={getMethodColor(selectedApi.method)}>{selectedApi.method}</Tag>
            <span>{selectedApi.name}</span>
            {selectedApi.deprecated === 1 && <Tag color="red">已弃用</Tag>}
            {selectedApi.needAuth === 1 && <Tag color="orange">需认证</Tag>}
          </Space>
        }
        width={720}
        open={drawerVisible}
        onClose={() => {
          setDrawerVisible(false);
          setSelectedApi(null);
        }}
      >
        <Space direction="vertical" size="large" className="w-full" style={{ width: '100%' }}>
          {/* API调试配置 */}
          <Card title="API调试配置" size="small">
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              {/* 配置选择 */}
              <div>
                <Text strong>选择配置：</Text>
                <Space style={{ marginTop: 8, width: '100%' }}>
                  <Select
                    style={{ flex: 1, minWidth: 200 }}
                    placeholder="选择已保存的配置"
                    value={selectedConfigId}
                    onChange={handleSelectConfig}
                    allowClear
                    onClear={() => setSelectedConfigId(null)}
                  >
                    {savedConfigs.map(config => (
                      <Select.Option key={config.id} value={config.id}>
                        {config.name} {config.isDefault === 1 && <Tag color="blue">默认</Tag>}
                      </Select.Option>
                    ))}
                  </Select>
                  <Button 
                    icon={<SettingOutlined />}
                    onClick={() => {
                      // 打开配置管理Modal
                      setConfigManageModalVisible(true);
                    }}
                  >
                    管理配置
                  </Button>
                  <Button 
                    type="primary"
                    icon={<SaveOutlined />}
                    onClick={handleSaveConfig}
                  >
                    保存配置
                  </Button>
                </Space>
              </div>
              
              <div>
                <Text strong>目标地址：</Text>
                <Input
                  placeholder="http://127.0.0.1:80"
                  value={debugConfig.baseUrl}
                  onChange={(e) => setDebugConfig({ ...debugConfig, baseUrl: e.target.value })}
                  style={{ marginTop: 8 }}
                />
              </div>
              <div>
                <Text strong>AppKey：</Text>
                <Input
                  placeholder="请输入AppKey"
                  value={debugConfig.appKey}
                  onChange={(e) => setDebugConfig({ ...debugConfig, appKey: e.target.value })}
                  style={{ marginTop: 8 }}
                />
              </div>
              <div>
                <Text strong>AppSecret：</Text>
                <Input.Password
                  placeholder="请输入AppSecret"
                  value={debugConfig.appSecret}
                  onChange={(e) => setDebugConfig({ ...debugConfig, appSecret: e.target.value })}
                  style={{ marginTop: 8 }}
                />
              </div>
              
              {/* 请求体编辑器 */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <Space size="small">
                    <Text strong>请求体（可编辑）：</Text>
                    {isUsingSavedBody && (
                      <Tag color="blue" style={{ fontSize: '11px', padding: '0 6px' }}>已保存</Tag>
                    )}
                  </Space>
                  <Space size="small">
                    <Button 
                      size="small"
                      onClick={() => {
                        try {
                          const parsed = JSON.parse(editedRequestBody);
                          setEditedRequestBody(JSON.stringify(parsed, null, 2));
                          messageApi.success('格式化成功');
                        } catch {
                          messageApi.error('JSON格式错误');
                        }
                      }}
                    >
                      格式化
                    </Button>
                    <Button 
                      size="small"
                      onClick={() => {
                        // 重置为API的原始示例，而不是硬编码的示例
                        if (selectedApi?.requestBody) {
                          try {
                            const parsed = JSON.parse(selectedApi.requestBody);
                            setEditedRequestBody(JSON.stringify(parsed, null, 2));
                            setIsUsingSavedBody(false);
                            messageApi.success('已重置为原始示例');
                          } catch {
                            setEditedRequestBody(selectedApi.requestBody);
                            setIsUsingSavedBody(false);
                            messageApi.success('已重置为原始示例');
                          }
                        } else {
                          setEditedRequestBody('{}');
                          setIsUsingSavedBody(false);
                          messageApi.info('该API没有示例请求体');
                        }
                      }}
                    >
                      重置示例
                    </Button>
                    <Button 
                      size="small"
                      type="primary"
                      onClick={() => {
                        // 保存编辑后的请求体到localStorage
                        if (selectedApi) {
                          try {
                            // 验证JSON格式
                            JSON.parse(editedRequestBody);
                            const savedBodies = JSON.parse(localStorage.getItem('hk-api-saved-bodies') || '{}');
                            savedBodies[selectedApi.id] = editedRequestBody;
                            localStorage.setItem('hk-api-saved-bodies', JSON.stringify(savedBodies));
                            setIsUsingSavedBody(true);
                            messageApi.success('请求体已保存');
                          } catch {
                            messageApi.error('JSON格式错误，无法保存');
                          }
                        }
                      }}
                    >
                      保存
                    </Button>
                  </Space>
                </div>
                <Input.TextArea
                  rows={10}
                  value={editedRequestBody}
                  onChange={(e) => setEditedRequestBody(e.target.value)}
                  placeholder='请输入JSON格式的请求体，例如：{"pageNo": 1, "pageSize": 10}'
                  style={{ 
                    marginTop: 8,
                    fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                    fontSize: '13px',
                    backgroundColor: darkMode ? '#1f1f1f' : '#ffffff',
                    color: darkMode ? '#f1f5f9' : '#000000',
                    border: `1px solid ${darkMode ? '#434343' : '#d9d9d9'}`,
                    borderRadius: '4px'
                  }}
                />
                <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginTop: 4 }}>
                  提示：根据API文档修改请求参数，例如添加 pageNo、pageSize 等必需参数
                </Text>
              </div>
              
              <Button 
                type="primary" 
                icon={<PlayCircleOutlined />}
                onClick={handleRealApiCall}
                loading={debugLoading}
                block
              >
                调用远程API
              </Button>
              
              {debugResponse && (
                <div>
                  <Text strong>响应结果：</Text>
                  <div style={{ 
                    marginTop: 8,
                    border: `1px solid ${darkMode ? '#434343' : '#d9d9d9'}`,
                    borderRadius: '4px',
                    overflow: 'hidden'
                  }}>
                    <div style={{ 
                      backgroundColor: darkMode ? '#1f1f1f' : '#ffffff',
                      padding: '12px',
                      fontSize: '13px',
                      maxHeight: '600px',
                      overflow: 'auto',
                      wordBreak: 'break-all',
                      whiteSpace: 'pre-wrap'
                    }}>
                      <JsonView
                        value={(() => {
                          try {
                            return JSON.parse(debugResponse);
                          } catch {
                            return { error: '无法解析JSON', raw: debugResponse };
                          }
                        })()}
                        collapsed={false}
                        displayDataTypes={false}
                        shortenTextAfterLength={0}
                        style={{
                          backgroundColor: 'transparent'
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </Space>
          </Card>

          {/* 基本信息 */}
          <Card title="基本信息" size="small">
            <Descriptions column={1} size="small">
              <Descriptions.Item label="API路径">
                <Text code>{selectedApi.path}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="请求方法">
                <Tag color={getMethodColor(selectedApi.method)}>{selectedApi.method}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="所属分类">
                {selectedApi.category?.name || selectedCategory?.name || '未知分类'}
              </Descriptions.Item>
              {selectedApi.version && (
                <Descriptions.Item label="版本">
                  <Tag color="blue">{selectedApi.version}</Tag>
                </Descriptions.Item>
              )}
              {selectedApi.rateLimit && (
                <Descriptions.Item label="限流说明">
                  {selectedApi.rateLimit}
                </Descriptions.Item>
              )}
              <Descriptions.Item label="调用统计">
                <Space>
                  <Badge count={selectedApi.callCount} showZero />
                  <Text type="secondary">次调用</Text>
                </Space>
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {/* API描述 */}
          {(selectedApi.description || selectedApi.summary) && (
            <Card title="接口说明" size="small">
              {selectedApi.summary && (
                <Paragraph><Text strong>摘要：</Text>{selectedApi.summary}</Paragraph>
              )}
              {selectedApi.description && (
                <Paragraph>{selectedApi.description}</Paragraph>
              )}
            </Card>
          )}

          {/* 请求参数（参考示例） */}
          {(selectedApi.requestParams || selectedApi.requestBody) && (
            <Collapse 
              size="small"
              items={[
                {
                  key: 'request-params',
                  label: '请求参数（参考示例）',
                  children: (
                    <Space direction="vertical" style={{ width: '100%' }} size="middle">
                      {selectedApi.requestParams && (
                        <div>
                          <Text type="secondary" style={{ display: 'block', marginBottom: '8px', fontSize: '12px' }}>
                            URL参数（仅供参考）：
                          </Text>
                          <div style={{ 
                            border: `1px solid ${darkMode ? '#434343' : '#d9d9d9'}`,
                            borderRadius: '4px',
                            overflow: 'hidden'
                          }}>
                            <JsonView
                              value={tryParseJson(selectedApi.requestParams) || {}}
                              collapsed={1}
                              displayDataTypes={false}
                              style={{
                                backgroundColor: darkMode ? '#1f1f1f' : '#f5f5f5',
                                padding: '12px',
                                fontSize: '13px',
                                maxHeight: '200px',
                                overflow: 'auto'
                              }}
                            />
                          </div>
                        </div>
                      )}
                      {selectedApi.requestBody && (
                        <div>
                          <Text type="secondary" style={{ display: 'block', marginBottom: '8px', fontSize: '12px' }}>
                            请求体（仅供参考）：
                          </Text>
                          <div style={{ 
                            border: `1px solid ${darkMode ? '#434343' : '#d9d9d9'}`,
                            borderRadius: '4px',
                            overflow: 'hidden'
                          }}>
                            <JsonView
                              value={tryParseJson(selectedApi.requestBody) || {}}
                              collapsed={1}
                              displayDataTypes={false}
                              style={{
                                backgroundColor: darkMode ? '#1f1f1f' : '#f5f5f5',
                                padding: '12px',
                                fontSize: '13px',
                                maxHeight: '200px',
                                overflow: 'auto'
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </Space>
                  )
                }
              ]}
            />
          )}

          {/* 响应信息（参考示例，非实际调用结果） */}
          {(selectedApi.responseExample || selectedApi.responseSchema) && (
            <Collapse 
              size="small"
              items={[
                {
                  key: 'response-info',
                  label: '响应信息（参考示例）',
                  children: (
                    <Space direction="vertical" style={{ width: '100%' }} size="middle">
                      {selectedApi.responseExample && (
                        <div>
                          <Text type="secondary" style={{ display: 'block', marginBottom: '8px', fontSize: '12px' }}>
                            响应示例（仅供参考，实际结果请查看下方"调用结果"）：
                          </Text>
                          <div style={{ 
                            border: `1px solid ${darkMode ? '#434343' : '#d9d9d9'}`,
                            borderRadius: '4px',
                            overflow: 'hidden'
                          }}>
                            <JsonView
                              value={tryParseJson(selectedApi.responseExample) || {}}
                              collapsed={1}
                              displayDataTypes={false}
                              style={{
                                backgroundColor: darkMode ? '#1f1f1f' : '#f5f5f5',
                                padding: '12px',
                                fontSize: '13px',
                                maxHeight: '200px',
                                overflow: 'auto'
                              }}
                            />
                          </div>
                        </div>
                      )}
                      {selectedApi.responseSchema && (
                        <div>
                          <Text type="secondary" style={{ display: 'block', marginBottom: '8px', fontSize: '12px' }}>
                            响应结构：
                          </Text>
                          <div style={{ 
                            border: `1px solid ${darkMode ? '#434343' : '#d9d9d9'}`,
                            borderRadius: '4px',
                            overflow: 'hidden'
                          }}>
                            <JsonView
                              value={tryParseJson(selectedApi.responseSchema) || {}}
                              collapsed={1}
                              displayDataTypes={false}
                              style={{
                                backgroundColor: darkMode ? '#1f1f1f' : '#f5f5f5',
                                padding: '12px',
                                fontSize: '13px',
                                maxHeight: '200px',
                                overflow: 'auto'
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </Space>
                  )
                }
              ]}
            />
          )}

          {/* 备注信息 */}
          {selectedApi.notes && (
            <Card title="备注说明" size="small">
              <Paragraph>{selectedApi.notes}</Paragraph>
            </Card>
          )}
        </Space>
      </Drawer>
    );
  };

  return (
    <App>
      <div style={{ 
        height: 'calc(100vh - 185px)',
        display: 'flex', 
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
      {/* 标题区域 */}
      <div style={{ flexShrink: 0, padding: '16px 16px', borderBottom: `1px solid ${darkMode ? '#303030' : '#f0f0f0'}` }}>
        <Title level={2} style={{ margin: 0, fontSize: '18px' }}>
          <ApiOutlined style={{ marginRight: '8px' }} />
          HK API 文档
        </Title>
        <Paragraph type="secondary" style={{ margin: 0, fontSize: '12px' }}>
          HK 融合通信应用平台 OpenAPI 接口文档，提供完整的接口说明和调用示例。
        </Paragraph>
      </div>

      {/* 统计卡片区域 */}
      <div style={{ flexShrink: 0, padding: '8px 16px' }}>
        {renderStatsCards()}
      </div>

      {/* 主内容区域 */}
      <div style={{ 
        flex: 1,
        minHeight: 0,
        display: 'flex',
        padding: '0 16px 16px',
        overflow: 'hidden'
      }}>
        <div style={{ display: 'flex', gap: '16px', width: '100%', height: '100%' }}>
          {/* 左侧分类树 */}
          <div style={{ width: '25%', minHeight: 0 }}>
            <Card 
              title="API分类" 
              size="small"
              style={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                backgroundColor: 'transparent',
                borderColor: darkMode ? '#303030' : '#d9d9d9'
              }}
              styles={{ 
                body: { 
                  flex: 1,
                  minHeight: 0,
                  overflow: 'auto',
                  padding: '12px'
                },
                header: {
                  borderColor: darkMode ? '#303030' : '#f0f0f0'
                }
              }}
              extra={
                <Search
                  placeholder="搜索API..."
                  allowClear
                  size="small"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  onSearch={handleSearch}
                  style={{ width: 140 }}
                />
              }
            >
              {loading ? (
                <div style={{ textAlign: 'center', padding: '32px 0' }}>
                  <Spin />
                </div>
              ) : searchKeyword ? (
                <div>
                  <div style={{ 
                    marginBottom: '8px', 
                    padding: '6px', 
                    backgroundColor: darkMode ? '#1f1f1f' : '#f0f9ff', 
                    borderRadius: '4px', 
                    border: `1px solid ${darkMode ? '#434343' : '#bae6fd'}` 
                  }}>
                    <Text type="secondary">
                      找到 <Text strong style={{ color: darkMode ? '#60a5fa' : '#0369a1' }}>{searchResults.length}</Text> 个相关API
                    </Text>
                  </div>
                  <div>
                    {searchResults.map(api => renderApiListItem(api))}
                  </div>
                </div>
              ) : categories.length === 0 ? (
                <Empty description="暂无分类数据" />
              ) : (
                <Tree
                  showIcon
                  expandedKeys={expandedKeys}
                  onExpand={setExpandedKeys}
                  onSelect={handleTreeSelect}
                  treeData={buildTreeData()}
                />
              )}
            </Card>
          </div>

          {/* 右侧API列表 */}
          <div style={{ flex: 1, minHeight: 0 }}>
            <Card 
              title={
                selectedCategory ? (
                  <Space>
                    <FolderOpenOutlined />
                    <span>{selectedCategory.name}</span>
                    <Badge 
                      count={selectedCategory.apis?.length || 0}
                      color={colorPrimary}
                    />
                  </Space>
                ) : (
                  "选择分类查看API"
                )
              }
              size="small"
              style={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                backgroundColor: 'transparent',
                borderColor: darkMode ? '#303030' : '#d9d9d9'
              }}
              styles={{ 
                body: { 
                  flex: 1, 
                  overflow: 'hidden',
                  padding: 0,
                  display: 'flex',
                  flexDirection: 'column'
                },
                header: {
                  borderColor: darkMode ? '#303030' : '#f0f0f0'
                }
              }}
            >
              {loading ? (
                <div style={{ textAlign: 'center', padding: '24px 0' }}>
                  <Spin />
                </div>
              ) : selectedCategory && selectedCategory.apis && selectedCategory.apis.length > 0 ? (
                <>
                  <div style={{ flex: 1, overflow: 'auto', padding: '12px' }}>
                    {selectedCategory.apis.map(api => renderApiListItem(api))}
                  </div>
                  <div style={{ 
                    flexShrink: 0,
                    padding: '8px 12px',
                    borderTop: `1px solid ${darkMode ? '#434343' : '#e2e8f0'}`, 
                    textAlign: 'center',
                    backgroundColor: darkMode ? '#1f1f1f' : '#fafafa'
                  }}>
                    <Text type="secondary" style={{ fontSize: '13px' }}>
                      共 {selectedCategory.apis.length} 个API接口
                    </Text>
                  </div>
                </>
              ) : (
                <Empty 
                  description={selectedCategory ? "该分类下暂无API" : "请选择左侧分类查看API列表"} 
                />
              )}
            </Card>
          </div>
        </div>
      </div>

      {/* API详情抽屉 */}
      {renderApiDetailDrawer()}
      
      {/* 保存配置Modal */}
      <Modal
        title="保存API调试配置"
        open={configModalVisible}
        onOk={handleSubmitConfig}
        onCancel={() => setConfigModalVisible(false)}
        okText="保存"
        cancelText="取消"
      >
        <Form layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item label="配置名称" required>
            <Input
              placeholder="例如：内网环境、外网环境"
              value={configForm.name}
              onChange={(e) => setConfigForm({ ...configForm, name: e.target.value })}
            />
          </Form.Item>
          <Form.Item label="目标地址">
            <Input
              value={configForm.baseUrl}
              onChange={(e) => setConfigForm({ ...configForm, baseUrl: e.target.value })}
              disabled
            />
          </Form.Item>
          <Form.Item label="AppKey">
            <Input
              value={configForm.appKey}
              onChange={(e) => setConfigForm({ ...configForm, appKey: e.target.value })}
              disabled
            />
          </Form.Item>
          <Form.Item label="配置描述">
            <Input.TextArea
              placeholder="可选，描述此配置的用途"
              value={configForm.description}
              onChange={(e) => setConfigForm({ ...configForm, description: e.target.value })}
              rows={3}
            />
          </Form.Item>
          <Form.Item>
            <Space>
              <Switch
                checked={configForm.isDefault === 1}
                onChange={(checked) => setConfigForm({ ...configForm, isDefault: checked ? 1 : 0 })}
              />
              <Text>设为默认配置</Text>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 配置管理Modal */}
      <Modal
        title="配置管理"
        open={configManageModalVisible}
        onCancel={() => setConfigManageModalVisible(false)}
        footer={null}
        width={600}
      >
        {savedConfigs.length === 0 ? (
          <Empty description="暂无保存的配置" />
        ) : (
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            {savedConfigs.map(config => (
              <Card key={config.id} size="small" style={{ marginBottom: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Space direction="vertical" style={{ flex: 1 }} size="small">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Text strong>{config.name}</Text>
                      {config.isDefault === 1 && <Tag color="blue">默认</Tag>}
                    </div>
                    <Text type="secondary" style={{ fontSize: '12px' }}>{config.baseUrl}</Text>
                    {config.description && (
                      <Text type="secondary" style={{ fontSize: '12px' }}>{config.description}</Text>
                    )}
                  </Space>
                  <Space>
                    {config.isDefault !== 1 && (
                      <Button 
                        size="small" 
                        onClick={() => {
                          handleSetDefaultConfig(config.id);
                        }}
                      >
                        设为默认
                      </Button>
                    )}
                    <Button 
                      size="small" 
                      danger
                      onClick={() => {
                        setConfigToDelete(config);
                        setDeleteConfirmVisible(true);
                      }}
                    >
                      删除
                    </Button>
                  </Space>
                </div>
              </Card>
            ))}
          </Space>
        )}
      </Modal>

      {/* 删除确认Modal */}
      <Modal
        title="确认删除"
        open={deleteConfirmVisible}
        onOk={async () => {
          if (configToDelete) {
            await handleDeleteConfig(configToDelete.id);
            setDeleteConfirmVisible(false);
            setConfigToDelete(null);
          }
        }}
        onCancel={() => {
          setDeleteConfirmVisible(false);
          setConfigToDelete(null);
        }}
        okText="确定"
        cancelText="取消"
        okButtonProps={{ danger: true }}
      >
        <p>确定要删除配置"{configToDelete?.name}"吗？</p>
      </Modal>
      </div>
    </App>
  );
};

export default HkApiDocs;
