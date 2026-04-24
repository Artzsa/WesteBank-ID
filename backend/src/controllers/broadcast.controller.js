const prisma = require('../utils/prisma');

const getBroadcastHistory = async (req, res) => {
  try {
    const history = await prisma.broadcastLog.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const logBroadcast = async (req, res) => {
  const { title, message, targetCount } = req.body;
  try {
    const log = await prisma.broadcastLog.create({
      data: {
        title,
        message,
        targetCount
      }
    });
    res.status(201).json(log);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

module.exports = {
  getBroadcastHistory,
  logBroadcast
};
