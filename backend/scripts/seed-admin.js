const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createSuperAdmin() {
  const phoneNumber = '098709870987';
  try {
    const user = await prisma.user.upsert({
      where: { phoneNumber },
      update: {
        role: 'SUPER_ADMIN',
        name: 'Super Admin Utama',
        village: 'WasteBank Central',
      },
      create: {
        phoneNumber,
        name: 'Super Admin Utama',
        role: 'SUPER_ADMIN',
        rt: '00',
        village: 'WasteBank Central',
        district: 'Pusat',
        regency: 'WasteBank City',
        province: 'Sistem',
      }
    });
    console.log('✅ Super Admin berhasil dibuat/diperbarui:', user.phoneNumber);
  } catch (error) {
    console.error('❌ Gagal membuat Super Admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createSuperAdmin();
