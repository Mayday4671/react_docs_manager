/**
 * @file prisma.ts
 * @description Prisma 客户端单例，避免开发热重载时重复创建连接
 * @module 数据库
 */

import { PrismaClient } from '@prisma/client'

/** 利用 globalThis 在 Next.js 热重载时复用同一个 PrismaClient 实例 */
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

/** 全局共享的 Prisma 客户端实例 */
export const prisma = globalForPrisma.prisma || new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
