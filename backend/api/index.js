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
const cloudinary = require('cloudinary').v2;

// Cloudinary Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

app.use(express.json());
app.use('/uploads', express.static('public/uploads'));

// Konfigurasi Multer (Memori)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

// Route Upload ke Cloudinary dengan Kompresi Sharp
app.post('/api/upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    // 1. Kompres di server dulu agar upload ke Cloudinary lebih ringan
    const compressedBuffer = await sharp(req.file.buffer)
      .resize(1080, null, { withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toBuffer();

    // 2. Upload ke Cloudinary menggunakan Promise agar Vercel menunggu sampai selesai
    const uploadToCloudinary = (buffer) => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: 'wastebank-id', resource_type: 'image' },
          (error, result) => {
            if (result) resolve(result);
            else reject(error);
          }
        );
        stream.end(buffer);
      });
    };

    const result = await uploadToCloudinary(compressedBuffer);
    res.json({ imageUrl: result.secure_url });
  } catch (err) {
    console.error('Upload Process Error:', err);
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



