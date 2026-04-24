const prisma = require('../utils/prisma');

const getRTLeaderboard = async (req, res) => {
  try {
    const rtStocks = await prisma.rTStock.findMany({
      orderBy: [
        { totalPlasticKg: 'desc' },
        { totalPaperKg: 'desc' },
        { totalCanKg: 'desc' },
      ],
    });

    // Calculate a simple "cleanliness score" or just rank by total weight
    const leaderboard = rtStocks.map(stock => ({
      rt: stock.rt,
      points: Math.round((stock.totalPlasticKg + stock.totalPaperKg + stock.totalCanKg) * 10), // Example: 1kg = 10 pts for ranking
      totalWeight: stock.totalPlasticKg + stock.totalPaperKg + stock.totalCanKg,
    })).sort((a, b) => b.points - a.points);

    res.json(leaderboard);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getUserLeaderboard = async (req, res) => {
  try {
    const topUsers = await prisma.user.findMany({
      where: { role: 'WARGA' },
      orderBy: { totalPoints: 'desc' },
      take: 10,
    });
    res.json(topUsers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getRTLeaderboard,
  getUserLeaderboard,
};
