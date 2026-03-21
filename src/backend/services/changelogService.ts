import { prisma } from '@/backend/database/prisma';

export async function getChangelogs() {
  return await prisma.tblChangelog.findMany({
    orderBy: { publishAt: 'desc' }
  });
}

export async function createChangelog(data: {
  version: string;
  title: string;
  content?: string;
  type?: string;
  status?: number;
  publishAt?: string;
}) {
  return await prisma.tblChangelog.create({
    data: {
      version: data.version,
      title: data.title,
      content: data.content,
      type: data.type || 'feature',
      status: data.status ?? 1,
      publishAt: data.publishAt ? new Date(data.publishAt) : null
    }
  });
}

export async function updateChangelog(id: number, data: {
  version?: string;
  title?: string;
  content?: string;
  type?: string;
  status?: number;
  publishAt?: string;
}) {
  return await prisma.tblChangelog.update({
    where: { id },
    data: {
      ...data,
      publishAt: data.publishAt ? new Date(data.publishAt) : undefined
    }
  });
}

export async function deleteChangelog(id: number) {
  return await prisma.tblChangelog.delete({
    where: { id }
  });
}
