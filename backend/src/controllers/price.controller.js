const prisma = require('../utils/prisma');

const getAllPrices = async (req, res) => {
  try {
    const prices = await prisma.wastePrice.findMany();
    res.json(prices);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updatePrice = async (req, res) => {
  const { type } = req.params;
  const { price } = req.body;
  try {
    const updated = await prisma.wastePrice.upsert({
      where: { type },
      update: { price: parseInt(price) },
      create: { type, price: parseInt(price) }
    });
    res.json(updated);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Seed initial prices if they don't exist
const seedPrices = async () => {
  const initialPrices = [
    { type: 'PLASTIK', price: 2000 },
    { type: 'KERTAS', price: 1500 },
    { type: 'LOGAM', price: 6000 },
    { type: 'KACA', price: 500 },
    { type: 'MINYAK', price: 3000 },
    { type: 'LAINNYA', price: 1000 }
  ];

  for (const item of initialPrices) {
    await prisma.wastePrice.upsert({
      where: { type: item.type },
      update: {},
      create: item
    });
  }
  console.log('Prices seeded successfully');
};

module.exports = {
  getAllPrices,
  updatePrice,
  seedPrices
};
