const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const updated = await prisma.user.updateMany({
    where: { role: 'ADMIN' },
    data: { role: 'SUPER_ADMIN' }
  });
  console.log(`Updated ${updated.count} users to SUPER_ADMIN`);
}

main().finally(() => prisma.$disconnect());
