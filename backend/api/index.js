const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const path = require('path');

// Load environment variables
dotenv.config();

const app = express();

// Security Middlewares
app.use(helmet({
  crossOriginResourcePolicy: false,
  contentSecurityPolicy: false,
}));

// Middleware Dasar
app.use(cors({
  origin: '*', 
  credentials: true
}));
app.use(express.json());
app.use('/uploads', express.static('public/uploads'));

// Ping route
app.get('/api/ping', (req, res) => {
  res.json({ status: 'ok', message: 'WasteBank API is running' });
});

// Routes
try {
  app.use('/api/waste', require('../src/routes/waste.routes'));
  app.use('/api/users', require('../src/routes/user.routes'));
  app.use('/api/leaderboard', require('../src/routes/leaderboard.routes'));
  app.use('/api/collector', require('../src/routes/collector.routes'));
  app.use('/api/pickups', require('../src/routes/pickup.routes'));
  app.use('/api/prices', require('../src/routes/price.routes'));
  app.use('/api/ai', require('../src/routes/ai.routes'));
  app.use('/api/broadcast', require('../src/routes/broadcast.routes'));
  app.use('/api/rewards', require('../src/routes/reward.routes'));
  app.use('/api/bot', require('../src/routes/bot.routes'));
} catch (err) {
  console.error('Error loading routes:', err.message);
}

// Export untuk Vercel
module.exports = app;



