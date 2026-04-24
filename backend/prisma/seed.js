const prisma = require('../src/utils/prisma');

async function main() {
  console.log('Updating database with new test numbers...');

  // Hapus data lama agar bersih
  await prisma.wasteSubmission.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.rTStock.deleteMany({});

  // 1. Create Admin
  const admin = await prisma.user.create({
    data: {
      phoneNumber: '083822144337',
      name: 'Admin WasteBank ID',
      role: 'ADMIN',
    },
  });

  // 2. Create Pengepul
  const pengepul = await prisma.user.create({
    data: {
      phoneNumber: '089520223556',
      name: 'Pak Budi (Pengepul)',
      rt: 'RT 07/RW 04',
      role: 'PENGEPUL',
    },
  });

  // 3. Create Warga
  const warga = await prisma.user.create({
    data: {
      phoneNumber: '085640167646',
      name: 'Ibu Siti Rahayu',
      rt: 'RT 03/RW 02',
      role: 'WARGA',
      totalPoints: 1240,
    },
  });

  // 4. Create dummy RT stocks
  await prisma.rTStock.create({
    data: {
      rt: 'RT 07/RW 04',
      totalPlasticKg: 42.5,
      totalPaperKg: 12.8,
      totalCanKg: 5.2,
    },
  });

  console.log('Database updated successfully with new numbers!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
