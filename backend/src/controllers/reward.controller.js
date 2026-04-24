const prisma = require('../utils/prisma');

const getRewards = async (req, res) => {
  try {
    const rewards = await prisma.reward.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(rewards);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createReward = async (req, res) => {
  const { name, pointsRequired, stock, imageUrl, category } = req.body;
  try {
    const reward = await prisma.reward.create({
      data: {
        name,
        pointsRequired: parseInt(pointsRequired),
        stock: parseInt(stock),
        imageUrl,
        category
      }
    });
    res.status(201).json(reward);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const updateReward = async (req, res) => {
  const { id } = req.params;
  const { name, pointsRequired, stock, imageUrl, category } = req.body;
  try {
    const reward = await prisma.reward.update({
      where: { id },
      data: {
        name,
        pointsRequired: pointsRequired ? parseInt(pointsRequired) : undefined,
        stock: stock ? parseInt(stock) : undefined,
        imageUrl,
        category
      }
    });
    res.json(reward);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const deleteReward = async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.reward.delete({ where: { id } });
    res.json({ message: 'Reward deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const redeemReward = async (req, res) => {
  const { userId, rewardId } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const reward = await prisma.reward.findUnique({ where: { id: rewardId } });

    if (!user || !reward) {
      return res.status(404).json({ message: 'User or Reward not found' });
    }

    if (user.totalPoints < reward.pointsRequired) {
      return res.status(400).json({ message: 'Insufficient points' });
    }

    if (reward.stock <= 0) {
      return res.status(400).json({ message: 'Out of stock' });
    }

    const [redemption, updatedUser, updatedReward] = await prisma.$transaction([
      prisma.redemption.create({
        data: {
          userId,
          rewardId,
          pointsUsed: reward.pointsRequired,
          status: 'PENDING'
        }
      }),
      prisma.user.update({
        where: { id: userId },
        data: { totalPoints: user.totalPoints - reward.pointsRequired }
      }),
      prisma.reward.update({
        where: { id: rewardId },
        data: { stock: reward.stock - 1 }
      })
    ]);

    res.json({ redemption, updatedUser, updatedReward });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getRedemptions = async (req, res) => {
  try {
    const redemptions = await prisma.redemption.findMany({
      include: {
        user: { select: { name: true, phoneNumber: true } },
        reward: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(redemptions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getRewards,
  createReward,
  updateReward,
  deleteReward,
  redeemReward,
  getRedemptions
};
