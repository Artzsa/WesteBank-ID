const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const prisma = require('./utils/prisma');
const PORT = process.env.PORT || 5000;

const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',') 
  : ['http://localhost:5173', 'http://localhost:5174', 'http://127.0.0.1:5173', 'http://127.0.0.1:5174', 'https://westebankid.cnfstore.id'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Security Middlewares
app.use(helmet({
  crossOriginResourcePolicy: false, // Allow images to be loaded from /uploads
  contentSecurityPolicy: false,     // Disable CSP for local dev
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Increased limit for chatty dashboards
  message: 'Too many requests from this IP, please try again after 15 minutes'
});
app.use('/api/', limiter);

app.use(express.json());
app.use('/uploads', express.static('public/uploads'));

const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'public/uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png/;
  const mimetype = allowedTypes.test(file.mimetype);
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());

  if (mimetype && extname) {
    return cb(null, true);
  }
  cb(new Error('Hanya file gambar (JPG/PNG) yang diperbolehkan!'));
};

const upload = multer({ 
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB Limit
});

app.post('/api/upload', (req, res) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ message: err.message });
    }
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    res.json({ imageUrl });
  });
});

// Basic Route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to WasteBank ID API' });
});

// Import Routes
const wasteRoutes = require('./routes/waste.routes');
const userRoutes = require('./routes/user.routes');
const leaderboardRoutes = require('./routes/leaderboard.routes');
const collectorRoutes = require('./routes/collector.routes');
const pickupRoutes = require('./routes/pickup.routes');
const priceRoutes = require('./routes/price.routes');
const aiRoutes = require('./routes/ai.routes');
const broadcastRoutes = require('./routes/broadcast.routes');
const rewardRoutes = require('./routes/reward.routes');
const priceController = require('./controllers/price.controller');
const backupService = require('./services/backup.service');

priceController.seedPrices();
// backupService.performBackup(); // Uncomment to test backup on startup

app.use('/api/waste', wasteRoutes);
app.use('/api/users', userRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/collector', collectorRoutes);
app.use('/api/pickups', pickupRoutes);
app.use('/api/prices', priceRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/broadcast', broadcastRoutes);
app.use('/api/rewards', rewardRoutes);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

module.exports = { app, prisma };
