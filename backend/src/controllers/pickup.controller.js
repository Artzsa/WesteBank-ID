const prisma = require('../utils/prisma');

const getAllPickups = async (req, res) => {
  try {
    const pickups = await prisma.pickup.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json(pickups);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createPickup = async (req, res) => {
  const { rt, date, time, volume } = req.body;
  try {
    const pickup = await prisma.pickup.create({
      data: { rt, date, time, volume, status: 'PENDING' },
    });
    res.status(201).json(pickup);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const updatePickup = async (req, res) => {
  const { id } = req.params;
  const { status, date, time, volume } = req.body;
  try {
    const pickup = await prisma.pickup.update({
      where: { id },
      data: { status, date, time, volume },
    });
    res.json(pickup);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const deletePickup = async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.pickup.delete({ where: { id } });
    res.json({ message: 'Pickup schedule deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getAllPickups,
  createPickup,
  updatePickup,
  deletePickup,
};
