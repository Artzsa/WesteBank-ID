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
const multer = require('multer');
const sharp = require('sharp');
const fs = require('fs');

app.use(express.json());
app.use('/uploads', express.static('public/uploads'));

// Konfigurasi Multer (Simpan di memori dulu)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // Limit 10MB
});

// Route Upload dengan Kompresi
app.post('/api/upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const fileName = `${Date.now()}-compressed.jpg`;
    const filePath = path.join('public/uploads', fileName);

    // Pastikan folder uploads ada
    if (!fs.existsSync('public/uploads')) {
      fs.mkdirSync('public/uploads', { recursive: true });
    }

    // Proses Kompresi dengan Sharp
    await sharp(req.file.buffer)
      .resize(1080, null, { withoutEnlargement: true }) // Maks lebar 1080px
      .jpeg({ quality: 80 }) // Kompres kualitas ke 80%
      .toFile(filePath);

    const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${fileName}`;
    res.json({ imageUrl });
  } catch (err) {
    console.error('Compression Error:', err);
    res.status(500).json({ message: 'Gagal memproses gambar', error: err.message });
  }
});

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



