import { NextRequest, NextResponse } from 'next/server';
import {
  getAllApis,
  getApiById,
  createApi,
  updateApi,
  deleteApi,
  searchApis,
  getApiStats,
  incrementApiCallCount
} from '@/backend/services/hkApiService';

// GET - 获取API列表或搜索
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');
    const keyword = searchParams.get('keyword');
    const id = searchParams.get('id');
    const action = searchParams.get('action');

    // 获取统计信息
    if (action === 'stats') {
      const stats = await getApiStats();
      return NextResponse.json({
        success: true,
        data: stats
      });
    }

    // 获取单个API详情
    if (id) {
      const api = await getApiById(parseInt(id));
      if (!api) {
        return NextResponse.json(
          { success: false, message: 'API不存在' },
          { status: 404 }
        );
      }
      return NextResponse.json({
        success: true,
        data: api
      });
    }

    // 搜索API
    if (keyword) {
      const apis = await searchApis(keyword);
      return NextResponse.json({
        success: true,
        data: apis
      });
    }

    // 获取API列表
    const apis = await getAllApis(categoryId ? parseInt(categoryId) : undefined);
    return NextResponse.json({
      success: true,
      data: apis
    });
  } catch (error) {
    console.error('获取API列表失败:', error);
    return NextResponse.json(
      { success: false, message: '获取API列表失败' },
      { status: 500 }
    );
  }
}

// POST - 创建API或增加调用次数或代理调用
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, id, config, ...apiData } = body;

    // 代理调用海康威视API
    if (action === 'proxy-call') {
      if (!config || !config.baseUrl || !config.appKey || !config.appSecret || !config.path || !config.method) {
        return NextResponse.json(
          { success: false, error: '配置参数不完整' },
          { status: 400 }
        );
      }

      try {
        const { generateSignature, buildHkHeaders } = await import('@/backend/utils/hkSignature');
        
        // 解析 baseUrl 获取路径前缀
        const parsedBaseUrl = new URL(config.baseUrl);
        const baseUrlPath = parsedBaseUrl.pathname.replace(/\/$/, ''); // 去除末尾斜杠
        
        // 构建完整路径用于签名和请求
        // 如果 baseUrl 包含路径前缀（如 /artemis），需要将其加到 path 前面
        let fullPath = config.path;
        if (baseUrlPath && baseUrlPath !== '/' && !config.path.startsWith(baseUrlPath)) {
          // path 不包含 baseUrl 的路径前缀，需要补全
          fullPath = baseUrlPath + config.path;
        }
        
        // 构建查询字符串（用于签名，不进行URL编码）
        let queryStringForSignature = '';
        let queryStringForUrl = '';
        
        if (config.requestParams) {
          // 对于签名：按字母顺序排序参数，使用原始值，不进行URL编码
          const sortedKeys = Object.keys(config.requestParams).sort();
          const paramPairsForSignature: string[] = [];
          const paramPairsForUrl: string[] = [];
          
          for (const key of sortedKeys) {
            const value = config.requestParams[key];
            // 签名用：原始值
            paramPairsForSignature.push(`${key}=${value}`);
            // URL用：对特殊字符进行编码（特别是 # 字符）
            const encodedValue = String(value).replace(/#/g, '%23');
            paramPairsForUrl.push(`${key}=${encodedValue}`);
          }
          
          queryStringForSignature = paramPairsForSignature.join('&');
          queryStringForUrl = paramPairsForUrl.join('&');
        }
        
        // 签名时需要包含查询参数（使用未编码的版本）
        const signaturePath = queryStringForSignature ? `${fullPath}?${queryStringForSignature}` : fullPath;
        
        console.log('路径处理:', {
          baseUrl: config.baseUrl,
          baseUrlPath,
          originalPath: config.path,
          fullPath,
          requestParams: config.requestParams,
          sortedKeys: config.requestParams ? Object.keys(config.requestParams).sort() : [],
          queryStringForSignature,
          queryStringForUrl,
          signaturePath,
          method: config.method
        });
        
        // 签名时使用完整路径（包含未编码的查询参数）
        const signature = generateSignature(
          signaturePath,
          config.appKey,
          config.appSecret,
          config.method
        );
        
        // 构建请求头
        const headers = buildHkHeaders(config.appKey, signature);
        
        // 构建完整URL（使用协议+域名+端口+完整路径）
        const baseOrigin = `${parsedBaseUrl.protocol}//${parsedBaseUrl.host}`;
        let requestUrl = `${baseOrigin}${fullPath}`;
        
        // 添加查询参数到URL（使用编码后的版本）
        if (queryStringForUrl) {
          requestUrl = `${requestUrl}?${queryStringForUrl}`;
        }
        
        console.log('URL构建:', {
          baseOrigin,
          fullPath,
          queryStringForUrl,
          finalUrl: requestUrl
        });

        // 发送请求
        const fetchOptions: RequestInit = {
          method: config.method,
          headers,
        };

        if (config.requestBody && (config.method === 'POST' || config.method === 'PUT' || config.method === 'PATCH')) {
          fetchOptions.body = JSON.stringify(config.requestBody);
        }

        console.log('代理调用海康API:', {
          url: requestUrl,
          method: config.method,
          headers,
          hasBody: !!config.requestBody,
          requestBody: config.requestBody
        });

        // 对于 HTTPS 请求，需要处理自签名证书
        let response;
        const isHttps = requestUrl.startsWith('https://');
        
        if (isHttps) {
          // 使用 node:https 模块来处理自签名证书
          const https = require('https');
          const { URL } = require('url');
          const parsedUrl = new URL(requestUrl);
          
          const options = {
            hostname: parsedUrl.hostname,
            port: parsedUrl.port || 443,
            path: parsedUrl.pathname + parsedUrl.search,
            method: config.method,
            headers,
            rejectUnauthorized: false // 忽略自签名证书
          };
          
          console.log('HTTPS请求选项:', options);
          
          // 使用 Promise 包装 https.request
          const httpsResponse = await new Promise<any>((resolve, reject) => {
            const req = https.request(options, (res: any) => {
              let data = '';
              res.on('data', (chunk: any) => {
                data += chunk;
              });
              res.on('end', () => {
                // 创建一个兼容的 headers 对象
                const headersObj = {
                  get: (name: string) => res.headers[name.toLowerCase()],
                  has: (name: string) => name.toLowerCase() in res.headers,
                  forEach: (callback: any) => {
                    Object.entries(res.headers).forEach(([key, value]) => {
                      callback(value, key);
                    });
                  }
                };
                
                resolve({
                  ok: res.statusCode >= 200 && res.statusCode < 300,
                  status: res.statusCode,
                  statusText: res.statusMessage,
                  headers: headersObj,
                  text: () => Promise.resolve(data),
                  json: () => Promise.resolve(JSON.parse(data))
                });
              });
            });
            
            req.on('error', reject);
            
            if (fetchOptions.body) {
              req.write(fetchOptions.body);
            }
            
            req.end();
          });
          
          response = httpsResponse;
        } else {
          response = await fetch(requestUrl, fetchOptions);
        }
        
        let responseData;
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          responseData = await response.json();
        } else {
          responseData = { text: await response.text() };
        }

        console.log('海康API响应:', {
          status: response.status,
          ok: response.ok,
          data: responseData
        });

        return NextResponse.json({
          success: response.ok,
          data: responseData,
          error: response.ok ? undefined : responseData.message || responseData.text || '调用失败',
          statusCode: response.status
        });
      } catch (error: any) {
        console.error('代理调用失败:', error);
        return NextResponse.json(
          { success: false, error: error.message || '代理调用失败' },
          { status: 500 }
        );
      }
    }

    // 增加API调用次数
    if (action === 'increment-call') {
      if (!id) {
        return NextResponse.json(
          { success: false, message: 'API ID不能为空' },
          { status: 400 }
        );
      }
      
      const api = await incrementApiCallCount(id);
      return NextResponse.json({
        success: true,
        data: api,
        message: '调用统计更新成功'
      });
    }

    // 创建API
    const { name, path, method, categoryId } = apiData;

    if (!name || !path || !method || !categoryId) {
      return NextResponse.json(
        { success: false, message: 'API名称、路径、方法和分类不能为空' },
        { status: 400 }
      );
    }

    const api = await createApi(apiData);

    return NextResponse.json({
      success: true,
      data: api,
      message: '创建API成功'
    });
  } catch (error) {
    console.error('创建API失败:', error);
    return NextResponse.json(
      { success: false, message: '创建API失败' },
      { status: 500 }
    );
  }
}

// PUT - 更新API
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'API ID不能为空' },
        { status: 400 }
      );
    }

    const api = await updateApi(id, updateData);

    return NextResponse.json({
      success: true,
      data: api,
      message: '更新API成功'
    });
  } catch (error) {
    console.error('更新API失败:', error);
    return NextResponse.json(
      { success: false, message: '更新API失败' },
      { status: 500 }
    );
  }
}

// DELETE - 删除API
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'API ID不能为空' },
        { status: 400 }
      );
    }

    await deleteApi(parseInt(id));

    return NextResponse.json({
      success: true,
      message: '删除API成功'
    });
  } catch (error) {
    console.error('删除API失败:', error);
    return NextResponse.json(
      { success: false, message: '删除API失败' },
      { status: 500 }
    );
  }
}