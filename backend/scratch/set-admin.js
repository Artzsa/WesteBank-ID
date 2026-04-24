const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function makeAdmin() {
  const phone = '083822144338';
  try {
    const user = await prisma.user.upsert({
      where: { phoneNumber: phone },
      update: { role: 'ADMIN' },
      create: {
        phoneNumber: phone,
        name: 'Admin Utama',
        role: 'ADMIN',
        rt: 'RW 00',
        village: 'Kelurahan Pusat',
        district: 'Kecamatan Pusat',
        regency: 'Kabupaten Pusat',
        province: 'Provinsi Pusat'
      }
    });
    console.log('✅ BERHASIL! Nomor ' + phone + ' sekarang adalah ADMIN.');
    console.log(user);
  } catch (err) {
    console.error('❌ Gagal membuat Admin:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

makeAdmin();
