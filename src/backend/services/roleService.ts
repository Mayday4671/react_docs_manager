import { prisma } from '@/backend/database/prisma';

export async function getRoles() {
  return await prisma.sysRole.findMany({
    include: {
      _count: {
        select: { users: true }
      }
    },
    orderBy: { id: 'asc' }
  });
}

export async function createRole(data: {
  roleName: string;
  roleKey: string;
  description?: string;
  status?: number;
}) {
  return await prisma.sysRole.create({
    data: {
      roleName: data.roleName,
      roleKey: data.roleKey,
      description: data.description,
      status: data.status ?? 1
    }
  });
}

export async function updateRole(id: number, data: {
  roleName?: string;
  roleKey?: string;
  description?: string;
  status?: number;
}) {
  return await prisma.sysRole.update({
    where: { id },
    data
  });
}

export async function deleteRole(id: number) {
  return await prisma.sysRole.delete({
    where: { id }
  });
}
