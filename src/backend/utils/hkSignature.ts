/**
 * @file hkSignature.ts
 * @description 海康威视 Artemis API 签名工具，实现 HMAC-SHA256 签名算法。
 *              签名规范参考海康威视官方文档（Java 版 HKSecretUtils）。
 * @module 海康API
 */

import crypto from 'crypto';

/**
 * 生成海康威视 Artemis API 请求签名。
 *
 * 待签名字符串格式：
 * ```
 * METHOD\n*\/*\napplication/json\nx-ca-key:APP_KEY\nPATH
 * ```
 *
 * @param path      - API 路径，如 /artemis/api/resource/v1/cameras
 * @param appKey    - 海康威视应用 Key
 * @param appSecret - 海康威视应用密钥，用于 HMAC-SHA256 签名
 * @param method    - HTTP 请求方法，默认 POST
 * @returns Base64 编码的签名字符串
 * @throws 签名生成失败时抛出原始错误
 */
export function generateSignature(
  path: string,
  appKey: string,
  appSecret: string,
  method: string = 'POST'
): string {
  try {
    /** 按规范拼接待签名字符串 */
    const stringToSign =
      `${method.toUpperCase()}\n` +
      `*/*\n` +
      `application/json\n` +
      `x-ca-key:${appKey}\n` +
      `${path}`;

    const hmac = crypto.createHmac('sha256', appSecret);
    hmac.update(stringToSign, 'utf8');
    return hmac.digest('base64');
  } catch (error) {
    console.error('生成签名失败:', error);
    throw error;
  }
}

/**
 * 构建海康威视 API 标准请求头。
 *
 * @param appKey    - 海康威视应用 Key
 * @param signature - 由 generateSignature 生成的签名字符串
 * @returns 包含认证信息的请求头对象
 */
export function buildHkHeaders(appKey: string, signature: string): Record<string, string> {
  return {
    'Accept': '*/*',
    'Content-Type': 'application/json',
    'X-Ca-Key': appKey,
    'X-Ca-Signature': signature,
    'X-Ca-Signature-Headers': 'x-ca-key',
  };
}
