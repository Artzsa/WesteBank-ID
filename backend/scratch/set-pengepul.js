const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function makePengepul() {
  const phone = '083822144339';
  try {
    const user = await prisma.user.upsert({
      where: { phoneNumber: phone },
      update: { role: 'PENGEPUL' },
      create: {
        phoneNumber: phone,
        name: 'Pengepul Lapangan 1',
        role: 'PENGEPUL',
        rt: 'RW 01',
        village: 'Kelurahan Pusat',
        district: 'Kecamatan Pusat',
        regency: 'Kabupaten Pusat',
        province: 'Provinsi Pusat'
      }
    });
    console.log('✅ BERHASIL! Nomor ' + phone + ' sekarang adalah PENGEPUL.');
    console.log(user);
  } catch (err) {
    console.error('❌ Gagal membuat Pengepul:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

makePengepul();
