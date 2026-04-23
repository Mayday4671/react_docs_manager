/**
 * @file aiService.ts
 * @description AI 模型配置管理服务，包含 API Key 的 AES-256-GCM 加解密和模型调用代理
 * @module AI对话
 */

import { prisma } from '../database/prisma';
import crypto from 'crypto';

/** 加密算法 */
const ALGORITHM = 'aes-256-gcm';

/**
 * 获取加密密钥（从环境变量读取 hex 字符串并转为 Buffer）
 * @returns 32 字节的 Buffer
 */
function getEncryptKey(): Buffer {
  const keyHex = process.env.AI_ENCRYPT_KEY || '';
  if (keyHex.length < 64) {
    throw new Error('AI_ENCRYPT_KEY 未配置或长度不足，需要 64 位 hex 字符串（32字节）');
  }
  return Buffer.from(keyHex.slice(0, 64), 'hex');
}

/**
 * 加密 API Key。
 * 使用 AES-256-GCM，每次加密生成随机 IV，输出格式：iv:authTag:ciphertext（均为 hex）
 *
 * @param plaintext - 明文 API Key
 * @returns 加密后的字符串
 */
export function encryptApiKey(plaintext: string): string {
  const key = getEncryptKey();
  const iv = crypto.randomBytes(12); // GCM 推荐 12 字节 IV
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

/**
 * 解密 API Key。
 *
 * @param ciphertext - encryptApiKey 返回的加密字符串
 * @returns 明文 API Key
 */
export function decryptApiKey(ciphertext: string): string {
  const key = getEncryptKey();
  const [ivHex, authTagHex, encryptedHex] = ciphertext.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const encrypted = Buffer.from(encryptedHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  return decipher.update(encrypted).toString('utf8') + decipher.final('utf8');
}

/**
 * AI 模型配置数据结构（对外暴露，不含加密字段）
 */
export interface AiModelConfig {
  /** 配置 ID */
  id: number;
  /** 配置名称 */
  name: string;
  /** 厂商标识 */
  provider: string;
  /** API Base URL */
  baseUrl: string;
  /** 支持的模型列表 */
  models: string[];
  /** 默认模型 */
  defaultModel?: string | null;
  /** 状态：1-启用 0-禁用 */
  status: number;
  /** 创建时间 */
  createdAt: Date;
}

/**
 * 获取所有 AI 模型配置（不返回加密的 API Key）
 * @returns 配置列表
 */
export async function getAiConfigs(): Promise<AiModelConfig[]> {
  const configs = await prisma.aiModelConfig.findMany({
    where: { status: 1 },
    orderBy: { createdAt: 'desc' },
  });
  return configs.map(c => ({
    id: c.id, name: c.name, provider: c.provider, baseUrl: c.baseUrl,
    models: JSON.parse(c.models || '[]'),
    defaultModel: c.defaultModel, status: c.status, createdAt: c.createdAt,
  }));
}

/**
 * 获取所有配置（含禁用，用于管理页面）
 */
export async function getAllAiConfigs(): Promise<AiModelConfig[]> {
  const configs = await prisma.aiModelConfig.findMany({ orderBy: { createdAt: 'desc' } });
  return configs.map(c => ({
    id: c.id, name: c.name, provider: c.provider, baseUrl: c.baseUrl,
    models: JSON.parse(c.models || '[]'),
    defaultModel: c.defaultModel, status: c.status, createdAt: c.createdAt,
  }));
}

/**
 * 创建 AI 模型配置，API Key 加密后入库。
 *
 * @param data - 配置数据
 * @returns 创建后的配置（不含 API Key）
 */
export async function createAiConfig(data: {
  name: string;
  provider: string;
  baseUrl: string;
  apiKey: string;
  models: string[];
  defaultModel?: string;
}) {
  const apiKeyEnc = encryptApiKey(data.apiKey);
  const config = await prisma.aiModelConfig.create({
    data: {
      name: data.name, provider: data.provider, baseUrl: data.baseUrl,
      apiKeyEnc, models: JSON.stringify(data.models),
      defaultModel: data.defaultModel || data.models[0] || null,
    },
  });
  return { id: config.id, name: config.name };
}

/**
 * 更新 AI 模型配置。若传入新 apiKey 则重新加密，否则保持原密文不变。
 *
 * @param id     - 配置 ID
 * @param data   - 要更新的字段
 */
export async function updateAiConfig(id: number, data: {
  name?: string;
  provider?: string;
  baseUrl?: string;
  apiKey?: string;
  models?: string[];
  defaultModel?: string;
  status?: number;
}) {
  const updateData: any = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.provider !== undefined) updateData.provider = data.provider;
  if (data.baseUrl !== undefined) updateData.baseUrl = data.baseUrl;
  if (data.apiKey && data.apiKey.trim()) updateData.apiKeyEnc = encryptApiKey(data.apiKey);
  if (data.models !== undefined) updateData.models = JSON.stringify(data.models);
  if (data.defaultModel !== undefined) updateData.defaultModel = data.defaultModel;
  if (data.status !== undefined) updateData.status = data.status;
  return prisma.aiModelConfig.update({ where: { id }, data: updateData });
}

/**
 * 删除 AI 模型配置
 * @param id - 配置 ID
 */
export async function deleteAiConfig(id: number) {
  return prisma.aiModelConfig.delete({ where: { id } });
}

/**
 * 通过配置 ID 获取解密后的 API Key（仅后端调用，不对外暴露）
 * @param configId - 配置 ID
 * @returns 明文 API Key
 */
export async function getDecryptedApiKey(configId: number): Promise<string> {
  const config = await prisma.aiModelConfig.findUnique({ where: { id: configId } });
  if (!config) throw new Error('配置不存在');
  return decryptApiKey(config.apiKeyEnc);
}

/**
 * 获取配置的完整信息（含解密 API Key），用于发起 AI 请求
 * @param configId - 配置 ID
 */
export async function getAiConfigForRequest(configId: number) {
  const config = await prisma.aiModelConfig.findUnique({ where: { id: configId } });
  if (!config) throw new Error('配置不存在');
  return {
    baseUrl: config.baseUrl,
    apiKey: decryptApiKey(config.apiKeyEnc),
    models: JSON.parse(config.models || '[]') as string[],
  };
}
