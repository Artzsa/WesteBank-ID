const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();

// Global Error Handler for Startup
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Middleware Dasar
app.use(cors({
  origin: '*', // Izinkan semua sementara untuk debug
  credentials: true
}));
app.use(express.json());

// Ping route (Sangat simple untuk tes awal)
app.get('/api/ping', (req, res) => {
  res.json({ 
    status: 'ok', 
    env: process.env.NODE_ENV,
    vercel: !!process.env.VERCEL
  });
});

// Import route lain secara dinamis agar jika satu error tidak mematikan semuanya
try {
  const prisma = require('../src/utils/prisma');
  const wasteRoutes = require('../src/routes/waste.routes');
  const userRoutes = require('../src/routes/user.routes');
  
  app.use('/api/waste', wasteRoutes);
  app.use('/api/users', userRoutes);
  
  // Route lainnya...
  app.use('/api/leaderboard', require('../src/routes/leaderboard.routes'));
  app.use('/api/collector', require('../src/routes/collector.routes'));
  app.use('/api/pickups', require('../src/routes/pickup.routes'));
  app.use('/api/prices', require('../src/routes/price.routes'));
} catch (err) {
  console.error('Error loading routes or prisma:', err.message);
  app.get('/api/error', (req, res) => res.json({ error: err.message, stack: err.stack }));
}

// Export untuk Vercel
module.exports = app;


