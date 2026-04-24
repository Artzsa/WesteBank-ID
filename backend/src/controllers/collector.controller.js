const prisma = require('../utils/prisma');

const getRTStocks = async (req, res) => {
  try {
    const stocks = await prisma.rTStock.findMany({
      orderBy: { rt: 'asc' },
    });
    res.json(stocks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await prisma.user.count({
      where: { role: 'WARGA' }
    });

    const users = await prisma.user.findMany({
      select: { totalPoints: true }
    });
    const totalPoints = users.reduce((acc, curr) => acc + curr.totalPoints, 0);

    const submissions = await prisma.wasteSubmission.findMany({
      where: { status: 'APPROVED' },
      select: {
        actualWeightKg: true,
        estimatedWeightKg: true
      }
    });

    const totalWeightKg = submissions.reduce((acc, curr) => 
      acc + (curr.actualWeightKg || curr.estimatedWeightKg || 0), 0
    );

    // Placeholder for "Pencairan" (Withdrawals) - can be extended later
    const totalWithdrawals = 0; 

    // Calculate Weekly Volume (Last 7 Days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const weeklySubmissions = await prisma.wasteSubmission.findMany({
      where: {
        status: { in: ['VERIFIED', 'APPROVED'] },
        createdAt: { gte: sevenDaysAgo }
      },
      select: {
        estimatedWeightKg: true,
        actualWeightKg: true,
        createdAt: true
      }
    });

    const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    const dailyVolume = Array(7).fill(0).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const dayName = days[d.getDay()];
      const total = weeklySubmissions
        .filter(s => new Date(s.createdAt).toDateString() === d.toDateString())
        .reduce((acc, curr) => acc + (curr.actualWeightKg || curr.estimatedWeightKg || 0), 0);
      return { day: dayName, volume: total };
    });

    // Calculate Monthly Volume (Last 6 Months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const monthlySubmissions = await prisma.wasteSubmission.findMany({
      where: {
        status: { in: ['VERIFIED', 'APPROVED'] },
        createdAt: { gte: sixMonthsAgo }
      },
      select: {
        estimatedWeightKg: true,
        actualWeightKg: true,
        createdAt: true
      }
    });

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const monthlyVolume = Array(6).fill(0).map((_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - (5 - i));
      const monthName = monthNames[d.getMonth()];
      const total = monthlySubmissions
        .filter(s => {
          const sDate = new Date(s.createdAt);
          return sDate.getMonth() === d.getMonth() && sDate.getFullYear() === d.getFullYear();
        })
        .reduce((acc, curr) => acc + (curr.actualWeightKg || curr.estimatedWeightKg || 0), 0);
      return { month: monthName, volume: total };
    });

    res.json({
      totalUsers,
      totalPoints,
      totalWeightKg,
      totalWithdrawals,
      dailyVolume,
      monthlyVolume
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getPickupSchedules = async (req, res) => {
  try {
    const schedules = await prisma.pickup.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json(schedules);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createPickupSchedule = async (req, res) => {
  const { rt, date, time, volume } = req.body;
  try {
    const schedule = await prisma.pickup.create({
      data: {
        rt,
        date,
        time,
        volume,
        status: 'PENDING',
      },
    });
    res.status(201).json(schedule);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const completePickup = async (req, res) => {
  const { id } = req.params;
  try {
    const schedule = await prisma.pickup.update({
      where: { id },
      data: {
        status: 'COMPLETED',
      },
    });
    res.json(schedule);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

module.exports = {
  getRTStocks,
  getDashboardStats,
  getPickupSchedules,
  createPickupSchedule,
  completePickup,
};

