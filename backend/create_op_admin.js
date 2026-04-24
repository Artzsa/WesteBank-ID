const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.upsert({
    where: { phoneNumber: '081111111111' },
    update: { role: 'ADMIN' },
    create: {
      phoneNumber: '081111111111',
      name: 'Admin Operasional',
      role: 'ADMIN',
      rt: 'RT 01',
      village: 'Cijaura'
    }
  });
  console.log(user);
}

main().finally(() => prisma.$disconnect());
