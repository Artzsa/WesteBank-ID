const cloudinary = require('cloudinary').v2;
const path = require('path');
const dotenv = require('dotenv');

// Paksa cari .env di folder backend
dotenv.config({ path: path.join(__dirname, '../../.env') });

console.log('☁️  [CLOUDINARY] Config Check:', {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME ? 'OK' : 'MISSING',
  api_key: process.env.CLOUDINARY_API_KEY ? 'OK' : 'MISSING',
  api_secret: process.env.CLOUDINARY_API_SECRET ? 'OK' : 'MISSING'
});

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

module.exports = cloudinary;
