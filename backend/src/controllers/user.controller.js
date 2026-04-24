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
  const phoneNumber = normalizePhone(req.body.phoneNumber);
  console.log('Login attempt for (normalized):', phoneNumber);
  try {
    const user = await prisma.user.findUnique({
      where: { phoneNumber },
    });
    if (!user) {
      console.log('User not found in database:', phoneNumber);
      return res.status(404).json({ message: 'Nomor telepon tidak terdaftar' });
    }
    console.log('Login successful for:', user.name);
    res.json(user);
  } catch (error) {
    console.error('Login error:', error);
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
  getAllUsers,
  updateUser,
  deleteUser,
  getUserStats,
  getUserImpact,
};

