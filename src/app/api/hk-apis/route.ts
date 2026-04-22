/**
 * @file route.ts
 * @description 海康威视 API 管理路由，支持 API 条目的增删改查、统计、搜索及代理调用
 * @module 海康API / API管理
 */

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

/**
 * GET /api/hk-apis
 * GET /api/hk-apis?action=stats              → 获取 API 统计信息
 * GET /api/hk-apis?id={id}                   → 获取单个 API 详情
 * GET /api/hk-apis?keyword={kw}              → 关键词搜索 API
 * GET /api/hk-apis?categoryId={id}           → 按分类过滤 API 列表
 *
 * @param request - Next.js 请求对象
 * @returns 包含 API 数据（统计、单条或列表）的 JSON 响应
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');
    const keyword = searchParams.get('keyword');
    const id = searchParams.get('id');
    const action = searchParams.get('action');

    if (action === 'stats') {
      const stats = await getApiStats();
      return NextResponse.json({
        success: true,
        data: stats
      });
    }

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

    if (keyword) {
      const apis = await searchApis(keyword);
      return NextResponse.json({
        success: true,
        data: apis
      });
    }

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

/**
 * POST /api/hk-apis
 * POST /api/hk-apis { action: 'proxy-call', config: {...} }    → 代理调用海康威视 API
 * POST /api/hk-apis { action: 'increment-call', id: number }   → 增加指定 API 的调用计数
 * POST /api/hk-apis { name, path, method, categoryId, ... }    → 创建新 API 条目
 *
 * @param request - Next.js 请求对象，body 为操作数据 JSON
 * @returns 操作结果的 JSON 响应
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, id, config, ...apiData } = body;

    if (action === 'proxy-call') {
      if (!config || !config.baseUrl || !config.appKey || !config.appSecret || !config.path || !config.method) {
        return NextResponse.json(
          { success: false, error: '配置参数不完整' },
          { status: 400 }
        );
      }

      try {
        const { generateSignature, buildHkHeaders } = await import('@/backend/utils/hkSignature');

        const parsedBaseUrl = new URL(config.baseUrl);
        const baseUrlPath = parsedBaseUrl.pathname.replace(/\/$/, '');

        // 若 baseUrl 包含路径前缀（如 /artemis），且 path 尚未包含该前缀，则补全
        let fullPath = config.path;
        if (baseUrlPath && baseUrlPath !== '/' && !config.path.startsWith(baseUrlPath)) {
          fullPath = baseUrlPath + config.path;
        }

        let queryStringForSignature = '';
        let queryStringForUrl = '';

        if (config.requestParams) {
          // 按字母顺序排序参数：签名使用原始值，URL 对特殊字符编码
          const sortedKeys = Object.keys(config.requestParams).sort();
          const paramPairsForSignature: string[] = [];
          const paramPairsForUrl: string[] = [];

          for (const key of sortedKeys) {
            const value = config.requestParams[key];
            paramPairsForSignature.push(`${key}=${value}`);
            const encodedValue = String(value).replace(/#/g, '%23');
            paramPairsForUrl.push(`${key}=${encodedValue}`);
          }

          queryStringForSignature = paramPairsForSignature.join('&');
          queryStringForUrl = paramPairsForUrl.join('&');
        }

        // 签名路径需包含未编码的查询参数
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

        const signature = generateSignature(
          signaturePath,
          config.appKey,
          config.appSecret,
          config.method
        );

        const headers = buildHkHeaders(config.appKey, signature);

        const baseOrigin = `${parsedBaseUrl.protocol}//${parsedBaseUrl.host}`;
        let requestUrl = `${baseOrigin}${fullPath}`;

        if (queryStringForUrl) {
          requestUrl = `${requestUrl}?${queryStringForUrl}`;
        }

        console.log('URL构建:', {
          baseOrigin,
          fullPath,
          queryStringForUrl,
          finalUrl: requestUrl
        });

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

        let response;
        const isHttps = requestUrl.startsWith('https://');

        if (isHttps) {
          // HTTPS 请求使用 node:https 模块以支持自签名证书
          const https = require('https');
          const { URL } = require('url');
          const parsedUrl = new URL(requestUrl);

          const options = {
            hostname: parsedUrl.hostname,
            port: parsedUrl.port || 443,
            path: parsedUrl.pathname + parsedUrl.search,
            method: config.method,
            headers,
            rejectUnauthorized: false
          };

          console.log('HTTPS请求选项:', options);

          const httpsResponse = await new Promise<any>((resolve, reject) => {
            const req = https.request(options, (res: any) => {
              let data = '';
              res.on('data', (chunk: any) => {
                data += chunk;
              });
              res.on('end', () => {
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

/**
 * PUT /api/hk-apis
 *
 * 更新指定 ID 的 API 条目。
 *
 * @param request - Next.js 请求对象，body 须包含 id 字段及待更新字段
 * @returns 包含更新后 API 记录的 JSON 响应
 */
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

/**
 * DELETE /api/hk-apis?id={id}
 *
 * 删除指定 ID 的 API 条目。
 *
 * @param request - Next.js 请求对象，查询参数须包含 id
 * @returns 操作结果的 JSON 响应
 */
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
