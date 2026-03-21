import crypto from 'crypto';

/**
 * 海康威视 API 签名工具
 * 根据海康威视 Artemis API 签名规范实现
 * 参考 Java 版本的 HKSecretUtils
 */

/**
 * 生成签名
 * @param path API路径，例如：/artemis/api/xmessage/v1/conference/query/page
 * @param appKey 应用Key
 * @param appSecret 应用密钥
 * @param method HTTP方法（GET 或 POST）
 * @returns 签名字符串
 */
export function generateSignature(
  path: string,
  appKey: string,
  appSecret: string,
  method: string = 'POST'
): string {
  try {
    console.log('签名函数输入参数:', {
      path,
      appKey,
      appSecret: appSecret.substring(0, 5) + '***', // 只显示前5位
      method
    });
    
    // 构建待签名字符串
    // 格式：METHOD\n*/*\napplication/json\nx-ca-key:APP_KEY\nPATH
    const stringToSign = 
      `${method.toUpperCase()}\n` +
      `*/*\n` +
      `application/json\n` +
      `x-ca-key:${appKey}\n` +
      `${path}`;
    
    console.log('待签名字符串:', stringToSign);
    console.log('待签名字符串（JSON）:', JSON.stringify(stringToSign));
    
    // 使用 HMAC-SHA256 生成签名
    const hmac = crypto.createHmac('sha256', appSecret);
    hmac.update(stringToSign, 'utf8');
    const signature = hmac.digest('base64');
    
    console.log('生成的签名:', signature);
    
    return signature;
  } catch (error) {
    console.error('生成签名失败:', error);
    throw error;
  }
}

/**
 * 构建海康威视 API 请求头
 * @param appKey 应用Key
 * @param signature 签名
 * @returns 请求头对象
 */
export function buildHkHeaders(appKey: string, signature: string): Record<string, string> {
  return {
    'Accept': '*/*',
    'Content-Type': 'application/json',
    'X-Ca-Key': appKey,
    'X-Ca-Signature': signature,
    'X-Ca-Signature-Headers': 'x-ca-key'
  };
}
