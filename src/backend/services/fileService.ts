import { prisma } from '@/backend/database/prisma';

export async function getFiles(page: number = 1, pageSize: number = 10) {
  const skip = (page - 1) * pageSize;
  
  const [files, total] = await Promise.all([
    prisma.tblFile.findMany({
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.tblFile.count()
  ]);

  return {
    success: true,
    data: files,
    page,
    pageSize,
    total
  };
}
