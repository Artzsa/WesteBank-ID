const prisma = require('../utils/prisma');

const normalizePhone = (phone) => {
  if (!phone) return '';
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('62')) return '0' + cleaned.slice(2);
  return cleaned;
};

const getUserByPhone = async (req, res) => {
  const phoneNumber = normalizePhone(req.params.phoneNumber);
  try {
    const user = await prisma.user.findUnique({
      where: { phoneNumber },
    });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const registerUser = async (req, res) => {
  const { phoneNumber, name, rt, village, district, regency, province, role, latitude, longitude } = req.body;
  const normalizedPhone = normalizePhone(phoneNumber);
  
  try {
    const existingUser = await prisma.user.findUnique({
      where: { phoneNumber: normalizedPhone },
    });

    if (existingUser) {
      return res.status(400).json({ message: 'Nomor telepon sudah terdaftar di sistem' });
    }

    const user = await prisma.user.create({
      data: {
        phoneNumber: normalizedPhone,
        name,
        rt,
        village,
        district,
        regency,
        province,
        role: role || 'WARGA',
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
      },
    });
    res.status(201).json(user);
  } catch (error) {
    console.error('Registration Error:', error);
    res.status(400).json({ error: error.message, message: 'Gagal mendaftarkan warga' });
  }
};

const updatePoints = async (req, res) => {
  const { id } = req.params;
  const { points } = req.body;
  try {
    const user = await prisma.user.update({
      where: { id },
      data: {
        totalPoints: {
          increment: points,
        },
      },
    });
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateUser = async (req, res) => {
  const { id } = req.params;
  const { name, rt, village, district, regency, province, role, phoneNumber, latitude, longitude } = req.body;
  try {
    const user = await prisma.user.update({
      where: { id },
      data: { 
        name, rt, village, district, regency, province, role, phoneNumber,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null
      },
    });
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const deleteUser = async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.user.delete({ where: { id } });
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const login = async (req, res) => {
  const { phoneNumber, otpCode } = req.body;
  const normalizedPhone = normalizePhone(phoneNumber);
  
  try {
    const user = await prisma.user.findUnique({
      where: { phoneNumber: normalizedPhone },
    });

    if (!user) {
      return res.status(404).json({ message: 'Nomor telepon tidak terdaftar' });
    }

    // Cek OTP
    if (!user.otpCode || user.otpCode !== otpCode) {
      return res.status(401).json({ message: 'Kode OTP salah atau belum diminta' });
    }

    // Cek Kadaluarsa (10 menit)
    if (new Date() > user.otpExpires) {
      return res.status(401).json({ message: 'Kode OTP sudah kadaluarsa, silakan minta lagi' });
    }

    // Reset OTP setelah berhasil login agar tidak bisa dipakai lagi
    await prisma.user.update({
      where: { id: user.id },
      data: { otpCode: null, otpExpires: null }
    });

    console.log('Login successful for:', user.name);
    res.json(user);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message });
  }
};

const requestOTP = async (req, res) => {
  const phoneNumber = normalizePhone(req.body.phoneNumber);
  
  try {
    const user = await prisma.user.findUnique({
      where: { phoneNumber },
    });

    if (!user) {
      return res.status(404).json({ message: 'Nomor tidak terdaftar di sistem WasteBank' });
    }

    // Generate 4 digit code
    let otp = Math.floor(1000 + Math.random() * 9000).toString();
    
    // Khusus nomor testing, gunakan OTP default 0987
    if (phoneNumber === '083822144338' || phoneNumber === '083822144339' || phoneNumber === '098709870987') {
      otp = '0987';
    }
    
    const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 menit

    await prisma.user.update({
      where: { id: user.id },
      data: { otpCode: otp, otpExpires: expires }
    });

    // Kirim via Bot WhatsApp
    const botUrl = process.env.BOT_URL || 'http://localhost:5001';
    try {
      const axios = require('axios');
      await axios.post(`${botUrl}/send-message`, {
        phoneNumber: user.phoneNumber,
        message: `🔐 *KODE OTP WASTEBANK ID*\n\nKode rahasia Anda adalah: *${otp}*\n\nJangan berikan kode ini kepada siapapun. Kode berlaku selama 10 menit. Selamat menabung sampah! ♻️`
      });
      console.log(`OTP sent to ${user.phoneNumber}: ${otp}`);
      res.json({ success: true, message: 'OTP telah dikirim ke WhatsApp Anda' });
    } catch (botErr) {
      console.error('Bot Error:', botErr.message);
      // Tetap kirim sukses ke client (untuk testing lokal jika bot mati)
      res.json({ 
        success: true, 
        message: 'OTP digenerate (Bot sedang offline/tidak terjangkau)',
        debugOtp: process.env.NODE_ENV !== 'production' ? otp : undefined 
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


const getUserStats = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        _count: {
          select: { wasteSubmissions: { where: { status: 'APPROVED' } } }
        }
      }
    });

    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({
      totalPoints: user.totalPoints,
      totalVerifications: user._count.wasteSubmissions,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getUserImpact = async (req, res) => {
  const phoneNumber = normalizePhone(req.params.phoneNumber);
  try {
    const user = await prisma.user.findUnique({
      where: { phoneNumber },
      include: {
        wasteSubmissions: {
          where: { status: 'APPROVED' },
          select: { actualWeightKg: true, estimatedWeightKg: true, predictedType: true }
        }
      }
    });

    if (!user) return res.status(404).json({ message: 'Warga tidak ditemukan' });

    // Aggregate by category with mapping
    const stats = {
      PLASTIK: 0, KERTAS: 0, LOGAM: 0, KACA: 0, MINYAK: 0, TOTAL: 0
    };

    const typeMapping = {
      'PLASTIC': 'PLASTIK', 'PLASTIK': 'PLASTIK',
      'PAPER': 'KERTAS', 'KERTAS': 'KERTAS',
      'METAL': 'LOGAM', 'LOGAM': 'LOGAM',
      'GLASS': 'KACA', 'KACA': 'KACA',
      'OIL': 'MINYAK', 'MINYAK': 'MINYAK'
    };

    user.wasteSubmissions.forEach(sub => {
      const weight = sub.actualWeightKg || sub.estimatedWeightKg || 0;
      const rawType = sub.actualType || sub.predictedType || 'LAINNYA';
      const mappedType = typeMapping[rawType.toUpperCase()] || 'LAINNYA';
      
      if (stats[mappedType] !== undefined) stats[mappedType] += weight;
      stats.TOTAL += weight;
    });

    // Calculate CO2 Impact (Factors)
    const co2Saved = (stats.PLASTIK * 2.5) + (stats.KERTAS * 1.2) + (stats.LOGAM * 8.0) + (stats.KACA * 0.5);
    const electricityDays = co2Saved / 0.5; // 0.5 kg CO2 = 1 kWh (1 day typical usage)

    res.json({
      name: user.name,
      rt: user.rt,
      totalPoints: user.totalPoints,
      totalWeight: stats.TOTAL,
      breakdown: stats,
      co2Saved: co2Saved.toFixed(2),
      electricityDays: Math.floor(electricityDays)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getUserByPhone,
  registerUser,
  updatePoints,
  login,
  requestOTP,
  getAllUsers,

  updateUser,
  deleteUser,
  getUserStats,
  getUserImpact,
};

