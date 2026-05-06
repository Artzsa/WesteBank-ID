const express = require('express');
const dotenv = require('dotenv');
const qrcode = require('qrcode-terminal');
const { Client, LocalAuth } = require('whatsapp-web.js');
const axios = require('axios');
const FormData = require('form-data');

dotenv.config();
const fs = require('fs');
const path = require('path');

const app = express();
const cors = require('cors');
app.use(cors());
app.use(express.json());
const BOT_SERVER_PORT = 5001;
const BACKEND_URL = process.env.BACKEND_URL || 'http://127.0.0.1:5000/api';

// AGGRESSIVE LOCK CLEANER
const authPath = path.join(__dirname, '.wwebjs_auth');
const cleanupLock = (dir) => {
  if (!fs.existsSync(dir)) return;
  try {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      if (file === 'SingletonLock' || file === 'lockfile' || file === 'DevToolsActivePort') {
        try { 
          fs.unlinkSync(fullPath); 
          console.log(`🔓 Removed lock: ${file}`); 
        } catch(e) {}
      } else if (fs.lstatSync(fullPath).isDirectory()) {
        cleanupLock(fullPath);
      }
    }
  } catch (e) {
    console.warn('⚠️ Cleanup warning:', e.message);
  }
};

// Jalankan pembersihan menyeluruh sebelum start
console.log('🧹 Membersihkan sisa sesi sebelumnya...');
cleanupLock(authPath);

const client = new Client({
  authStrategy: new LocalAuth({
    clientId: 'wastebank-prod',
    dataPath: authPath
  }),
  puppeteer: {
    headless: "new",
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--disable-extensions'
    ],
  }
});

console.log('🚀 Inisialisasi Bot...');
client.initialize().catch(async (err) => {
  console.error('❌ Gagal Inisialisasi:', err.message);
  if (err.message.includes('already running')) {
    console.log('🔄 Mencoba pembersihan darurat...');
    cleanupLock(authPath);
    setTimeout(() => client.initialize(), 2000);
  }
});


// Memori sementara untuk warga yang sedang daftar
const pendingRegistrations = {};

client.on('qr', (qr) => {
  qrcode.generate(qr, { small: true });
  console.log('QR RECEIVED', qr);
});

client.on('ready', () => {
  console.log('Client is ready!');
});

client.on('message_create', async (msg) => {
  const content = msg.body || msg.caption || '';
  const chat = await msg.getChat();
  const contact = await msg.getContact();
  const phone = contact.number;

  // --- LOGIKA PENDAFTARAN MANDIRI ---
  if (content.toLowerCase().includes('#daftar')) {
    return msg.reply(`Selamat datang di *WasteBank ID*! 🎉\n\nSilakan daftar dengan membalas pesan ini menggunakan format:\n\n*#reg #[Nama Lengkap] #[RT/RW]*\n\nContoh: #reg #Budi Santoso #RT 05/RW 02`);
  }

  if (content.toLowerCase().startsWith('#reg')) {
    const parts = content.split('#').map(p => p.trim());
    if (parts.length < 4) {
      return msg.reply('Format salah. Gunakan: *#reg #[Nama] #[Alamat]*');
    }
    
    pendingRegistrations[phone] = {
      name: parts[2],
      rt: parts[3],
      phoneNumber: `0${phone.substring(2)}` // Convert 62... to 0...
    };

    return msg.reply(`Data diterima, *${parts[2]}*!\n\nLangkah terakhir: Silakan kirimkan *Lokasi (Pin Maps)* rumah Anda sekarang melalui WhatsApp (Klik ikon Lampiran > Lokasi > Kirim Lokasi Saat Ini).`);
  }

  // --- CEK SALDO & DAMPAK LINGKUNGAN ---
  if (content.toLowerCase().startsWith('#cek')) {
    try {
      const res = await axios.get(`${BACKEND_URL}/users/${phone}/impact`);
      const d = res.data;

      const reply = `Alhamdulillah, Bapak/Ibu *${d.name}* ✅

Poin Anda saat ini: *${d.totalPoints.toLocaleString()} Pts*
Wilayah: ${d.rt}

♻️ *RINCIAN SETORAN:*
• Plastik: ${d.breakdown.PLASTIK.toFixed(1)} Kg
• Kertas: ${d.breakdown.KERTAS.toFixed(1)} Kg
• Logam: ${d.breakdown.LOGAM.toFixed(1)} Kg
• Kaca: ${d.breakdown.KACA.toFixed(1)} Kg

🌍 *DAMPAK LINGKUNGAN:*
Total sampah Anda telah menyelamatkan bumi sebesar *${d.co2Saved} kg CO₂* 

💡 *Setara menghemat listrik selama ${d.electricityDays} hari!*

Tukarkan poin Anda di: *http://localhost:5173/rewards*
Terima kasih sudah menjaga lingkungan! 💚`;

      return msg.reply(reply);
    } catch (err) {
      if (err.response?.status === 404) {
        return msg.reply('Maaf, nomor Anda belum terdaftar. Silakan ketik *#daftar* untuk memulai! 😊');
      }
      return msg.reply('Gagal mengambil data. Silakan coba lagi nanti.');
    }
  }

  if (msg.type === 'location') {
    if (pendingRegistrations[phone]) {
      const { name, rt, phoneNumber } = pendingRegistrations[phone];
      const { latitude, longitude } = msg.location;

      console.log(`[BOT] Menerima lokasi dari ${name}: ${latitude}, ${longitude}`);

      // Reverse Geocoding di sisi Bot
      let village = '', district = '', regency = '', province = '';
      try {
        console.log(`[GEO] Mencari alamat untuk: ${latitude}, ${longitude}...`);
        const geoRes = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`, {
          headers: { 'User-Agent': 'WasteBankID-Bot/1.0' }
        });
        const addr = geoRes.data.address;
        if (addr) {
          village = addr.village || addr.suburb || addr.hamlet || addr.neighbourhood || '';
          district = addr.city_district || addr.district || addr.town || '';
          regency = addr.city || addr.regency || addr.county || addr.municipality || '';
          province = addr.state || '';
          console.log(`[GEO] Alamat ditemukan: ${village}, ${district}`);
        }
      } catch (geoErr) {
        console.error('Bot Geocoding Error:', geoErr.message);
      }

      try {
        await axios.post(`${BACKEND_URL}/users/register`, {
          name, rt, phoneNumber, latitude, longitude,
          village, district, regency, province
        });
        
        delete pendingRegistrations[phone];
        return msg.reply(`✨ *PENDAFTARAN BERHASIL!* ✨\n\nSelamat ${name}, akun Anda sudah aktif.\nAlamat terdeteksi: *${village}, ${district}*.\n\nSekarang Anda bisa mulai menabung sampah dengan mengirim foto + hashtag *#setor*.`);
      } catch (err) {
        console.error('Registration error:', err.response?.data || err.message);
        return msg.reply('Maaf, pendaftaran gagal. Mungkin nomor Anda sudah terdaftar atau server sedang sibuk.');
      }
    }
  }

  // --- LOGIKA SETOR SAMPAH (EXISTING) ---
  if (content.toLowerCase().includes('#setor')) {
    console.log(`--- Pesan #setor terdeteksi ---`);
    console.log(`Tipe Pesan: ${msg.type}`);
    console.log(`Has Media: ${msg.hasMedia}`);
    
    if (!msg.hasMedia) {
      console.log('Abaikan: Tidak ada media (mencegah loop)');
      return;
    }
    console.log('Memproses setoran...');

    try {

      // 1. Get user from backend
      let user;
      try {
        const response = await axios.get(`${BACKEND_URL}/users/${phone}`);
        user = response.data;
      } catch (error) {
        if (error.response && error.response.status === 404) {
          return msg.reply('Anda belum terdaftar. Silakan daftar ke admin kelurahan terlebih dahulu.');
        }
        throw error;
      }

      // 2. Download media
      const media = await msg.downloadMedia();
      const buffer = Buffer.from(media.data, 'base64');
      
      // 3. Upload to Local Backend
      const formData = new FormData();
      formData.append('image', buffer, {
        filename: `waste_${phone}_${Date.now()}.${media.mimetype.split('/')[1]}`,
        contentType: media.mimetype,
      });

      console.log('Uploading image to local storage...');
      const uploadRes = await axios.post(`${BACKEND_URL.replace('/api', '')}/api/upload`, formData, {
        headers: {
          ...formData.getHeaders(),
        },
      });

      const imageUrl = uploadRes.data.imageUrl;

      // 4. Send to Backend API for Submission
      const submission = await axios.post(`${BACKEND_URL}/waste/submit`, {
        userId: user.id,
        imageUrl,
      });

      msg.reply(`Alhamdulillah, Bapak/Ibu *${user.name}* ✅

Setoran sampah Anda sudah kami terima:
📦 Jenis: *${submission.data.predictedType}*
⚖️ Estimasi berat: *${submission.data.estimatedWeightKg} kg*
🌟 Poin yang didapat: *${submission.data.pointsAwarded.toLocaleString()} Pts*

Total poin Anda sekarang: *${(user.totalPoints + submission.data.pointsAwarded).toLocaleString()} Pts*

Tukarkan poin kapan saja via menu: *http://localhost:5173/rewards*

Terima kasih sudah menjaga lingkungan! Sampah Anda hari ini menyelamatkan bumi sebesar *${(submission.data.estimatedWeightKg * (submission.data.predictedType.toUpperCase() === 'PLASTIC' || submission.data.predictedType.toUpperCase() === 'PLASTIK' ? 2.5 : submission.data.predictedType.toUpperCase() === 'PAPER' || submission.data.predictedType.toUpperCase() === 'KERTAS' ? 1.2 : submission.data.predictedType.toUpperCase() === 'METAL' || submission.data.predictedType.toUpperCase() === 'LOGAM' ? 8.0 : 0.5)).toFixed(1)} kg CO₂* 🌍`);

      // 5. NOTIFIKASI KE PENGEPUL
      try {
        const usersRes = await axios.get(`${BACKEND_URL}/users`);
        const pengepuls = usersRes.data.filter(u => u.role === 'PENGEPUL');
        
        const taskMsg = `📢 *TUGAS TIMBANG BARU* 📢\n\n👤 Warga: *${user.name}*\n📍 Alamat: ${user.rt || '-'}\n📦 Prediksi AI: ${submission.data.predictedType}\n\nSegera meluncur ke lokasi dan input berat timbangannya di sini:\n🔗 http://localhost:5173/verification`;

        for (const p of pengepuls) {
          const pId = `62${p.phoneNumber.substring(1)}@c.us`;
          await client.sendMessage(pId, taskMsg);
        }
      } catch (adminErr) {
        console.error('Gagal mengirim notifikasi ke pengepul:', adminErr.message);
      }

    } catch (error) {
      console.error(error);
      msg.reply('Terjadi kesalahan saat memproses setoran Anda. Silakan coba lagi nanti.');
    }
  }
});

// client.initialize(); <- DIHAPUS KARENA SUDAH ADA DI ATAS (SETTIMEOUT)

// API untuk Backend mengirim pesan lewat Bot
app.post('/send-message', async (req, res) => {
  const { phoneNumber, message } = req.body;
  console.log(`\n📩 [INCOMING] Permintaan kirim pesan ke: ${phoneNumber}`);
  
  try {
    // 1. Cek status bot
    if (!client.info || !client.info.wid) {
      console.error('❌ [ERROR] Bot belum siap/belum login QR!');
      return res.status(503).json({ success: false, error: 'Bot belum login' });
    }

    const chatId = phoneNumber.startsWith('0') 
      ? `62${phoneNumber.substring(1)}@c.us` 
      : `${phoneNumber}@c.us`;
    
    console.log(`🔗 [FORMAT] Mengirim ke ID: ${chatId}`);

    const result = await client.sendMessage(chatId, message);
    
    if (result) {
      console.log('✅ [SUCCESS] Pesan berhasil dikirim ke WhatsApp!');
      res.json({ success: true, message: 'Pesan terkirim' });
    } else {
      console.warn('⚠️ [WARNING] Pesan gagal dikirim (tanpa error).');
      res.json({ success: false, message: 'Gagal kirim (no result)' });
    }
  } catch (error) {
    console.error('❌ [FATAL ERROR]:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(BOT_SERVER_PORT, () => {
  console.log(`Bot notification server is running on port ${BOT_SERVER_PORT}`);
});
