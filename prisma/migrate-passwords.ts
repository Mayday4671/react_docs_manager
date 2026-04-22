/**
 * 密码迁移脚本：将数据库中的明文密码迁移为 bcrypt 哈希
 * 运行：npx tsx prisma/migrate-passwords.ts
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.sysUser.findMany({ select: { id: true, username: true, password: true } });

  for (const user of users) {
    // 跳过已经是 bcrypt 哈希的密码（bcrypt 哈希以 $2a$ 或 $2b$ 开头）
    if (user.password.startsWith('$2')) {
      console.log(`✅ ${user.username} 密码已是哈希，跳过`);
      continue;
    }

    const hashed = await bcrypt.hash(user.password, 12);
    await prisma.sysUser.update({ where: { id: user.id }, data: { password: hashed } });
    console.log(`🔐 ${user.username} 密码已加密`);
  }

  console.log('\n✅ 密码迁移完成');
}

main().catch(console.error).finally(() => prisma.$disconnect());
