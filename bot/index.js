/**
 * ============================================================
 *  WasteBank ID — WhatsApp Bot
 *  Versi 2.0 | Lebih Robust, Aman, dan Production-Ready
 * ============================================================
 */

'use strict';

const express = require('express');
const dotenv = require('dotenv');
const qrcode = require('qrcode-terminal');
const { Client, LocalAuth } = require('whatsapp-web.js');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

dotenv.config();

// ─── Konstanta & Konfigurasi ────────────────────────────────
const BOT_SERVER_PORT = process.env.BOT_PORT || 5001;
const BASE_URL = process.env.BACKEND_BASE_URL || 'http://127.0.0.1:5000';
const BACKEND_URL = `${BASE_URL}/api`;
const DASHBOARD_URL = process.env.DASHBOARD_URL || 'http://localhost:5173';
const PENDING_FILE = path.join(__dirname, 'pending_registrations.json');
const AUTH_PATH = path.join(__dirname, '.wwebjs_auth');

// Rate limiting: max request per nomor per window (ms)
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW = 60_000; // 1 menit

// ─── Logger Sederhana ───────────────────────────────────────
const log = {
  info: (...a) => console.log(`ℹ️  [INFO]`, ...a),
  ok: (...a) => console.log(`✅ [OK]  `, ...a),
  warn: (...a) => console.warn(`⚠️  [WARN]`, ...a),
  error: (...a) => console.error(`❌ [ERR] `, ...a),
  debug: (...a) => process.env.DEBUG === 'true' && console.log(`🔍 [DBG] `, ...a),
};

// ─── Persistent Storage untuk Registrasi Pending ────────────
function loadPending() {
  try {
    if (fs.existsSync(PENDING_FILE)) {
      return JSON.parse(fs.readFileSync(PENDING_FILE, 'utf8'));
    }
  } catch (e) {
    log.warn('Gagal load pending registrations:', e.message);
  }
  return {};
}

function savePending(data) {
  try {
    fs.writeFileSync(PENDING_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    log.warn('Gagal simpan pending registrations:', e.message);
  }
}

const pendingRegistrations = loadPending();

// ─── Rate Limiter ───────────────────────────────────────────
const rateLimitMap = new Map();

function isRateLimited(phone) {
  const now = Date.now();
  const entry = rateLimitMap.get(phone) || { count: 0, start: now };

  if (now - entry.start > RATE_LIMIT_WINDOW) {
    // Reset window
    rateLimitMap.set(phone, { count: 1, start: now });
    return false;
  }

  if (entry.count >= RATE_LIMIT_MAX) return true;

  entry.count++;
  rateLimitMap.set(phone, entry);
  return false;
}

// ─── Cleanup Lock Puppeteer ─────────────────────────────────
function cleanupLock(dir) {
  if (!fs.existsSync(dir)) return;
  try {
    for (const file of fs.readdirSync(dir)) {
      const fullPath = path.join(dir, file);
      const LOCK_FILES = new Set(['SingletonLock', 'lockfile', 'DevToolsActivePort']);
      if (LOCK_FILES.has(file)) {
        try { fs.unlinkSync(fullPath); log.info(`Lock dihapus: ${file}`); } catch (_) { }
      } else if (fs.lstatSync(fullPath).isDirectory()) {
        cleanupLock(fullPath);
      }
    }
  } catch (e) {
    log.warn('Cleanup warning:', e.message);
  }
}

// ─── WhatsApp Client ────────────────────────────────────────
log.info('🧹 Membersihkan sisa sesi sebelumnya...');
cleanupLock(AUTH_PATH);

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  },
});

// ─── Helper: Format Nomor ───────────────────────────────────
/** Konversi "628xxx" → "08xxx" */
function toLocalPhone(rawPhone) {
  return rawPhone.startsWith('62') ? '0' + rawPhone.substring(2) : rawPhone;
}

/** Konversi "08xxx" atau "628xxx" → "628xxx@c.us" */
function toWhatsAppId(phone) {
  const normalized = phone.startsWith('0')
    ? '62' + phone.substring(1)
    : phone;
  return `${normalized}@c.us`;
}

// ─── Helper: Reply Aman ─────────────────────────────────────
async function safeReply(msg, text) {
  try {
    await msg.reply(text);
  } catch (e) {
    log.warn('Gagal reply pesan:', e.message);
  }
}

// ─── Helper: Axios dengan Timeout ──────────────────────────
const api = axios.create({
  baseURL: BACKEND_URL,
  timeout: 10_000,
});

// ─── Reverse Geocoding ──────────────────────────────────────
async function reverseGeocode(lat, lon) {
  try {
    const res = await axios.get('https://nominatim.openstreetmap.org/reverse', {
      params: { format: 'json', lat, lon },
      headers: { 'User-Agent': 'WasteBankID-Bot/2.0' },
      timeout: 8_000,
    });
    const addr = res.data?.address || {};
    return {
      village: addr.village || addr.suburb || addr.hamlet || addr.neighbourhood || '',
      district: addr.city_district || addr.district || addr.town || '',
      regency: addr.city || addr.regency || addr.county || addr.municipality || '',
      province: addr.state || '',
    };
  } catch (_) {
    return { village: '', district: '', regency: '', province: '' };
  }
}

// ════════════════════════════════════════════════════════════
//  Handler Perintah
// ════════════════════════════════════════════════════════════

async function handlePing(msg) {
  return safeReply(msg, 'Pong! 🚀 Bot WasteBank ID aktif dan siap melayani.');
}

async function handleDaftar(msg) {
  const text =
    `Selamat datang di *WasteBank ID*! ♻️\n\n` +
    `Untuk mendaftar, balas dengan format:\n\n` +
    `*#reg #[Nama Lengkap] #[RT/RW]*\n\n` +
    `Contoh:\n_#reg #Budi Santoso #RT 05/RW 02_`;
  return safeReply(msg, text);
}

async function handleReg(msg, content, rawPhone, phone) {
  const parts = content.split('#').map(p => p.trim()).filter(Boolean);
  // parts[0]="reg", parts[1]=Nama, parts[2]=RT
  if (parts.length < 3) {
    return safeReply(msg, '⚠️ Format salah.\n\nGunakan: *#reg #[Nama] #[RT/RW]*');
  }

  pendingRegistrations[rawPhone] = {
    name: parts[1],
    rt: parts[2],
    phoneNumber: phone,
  };
  savePending(pendingRegistrations);

  return safeReply(
    msg,
    `Data diterima, *${parts[1]}*! ✅\n\n` +
    `Langkah terakhir: Kirimkan *📍 Lokasi (Pin Maps)* rumah Anda.\n\n` +
    `Caranya: Klik ikon Lampiran → Lokasi → Kirim Lokasi Saat Ini.`
  );
}

async function handleCek(msg, phone) {
  try {
    const { data: d } = await api.get(`/users/${phone}/impact`);

    const reply =
      `Alhamdulillah, Bapak/Ibu *${d.name}* ✅\n\n` +
      `🏅 *Poin Saat Ini:* ${d.totalPoints.toLocaleString('id-ID')} Pts\n` +
      `📍 *Wilayah:* ${d.rt}\n\n` +
      `♻️ *RINCIAN SETORAN:*\n` +
      `• Plastik : ${d.breakdown.PLASTIK.toFixed(1)} Kg\n` +
      `• Kertas  : ${d.breakdown.KERTAS.toFixed(1)} Kg\n` +
      `• Logam   : ${d.breakdown.LOGAM.toFixed(1)} Kg\n` +
      `• Kaca    : ${d.breakdown.KACA.toFixed(1)} Kg\n\n` +
      `🌍 *DAMPAK LINGKUNGAN:*\n` +
      `Sampah Anda telah menghemat *${d.co2Saved} kg CO₂*\n` +
      `💡 Setara menghemat listrik selama *${d.electricityDays} hari!*\n\n` +
      `🎁 Tukar poin di: ${DASHBOARD_URL}/rewards\n\n` +
      `Terima kasih sudah menjaga lingkungan! 💚`;

    return safeReply(msg, reply);
  } catch (err) {
    if (err.response?.status === 404) {
      return safeReply(msg,
        'Maaf, nomor Anda belum terdaftar. Ketik *#daftar* untuk mendaftar. 😊'
      );
    }
    log.error('handleCek:', err.message);
    return safeReply(msg, '⚠️ Gagal mengambil data. Silakan coba lagi nanti.');
  }
}

async function handleLocation(msg, rawPhone) {
  const pending = pendingRegistrations[rawPhone];
  if (!pending) return; // Lokasi tanpa konteks registrasi → abaikan

  const { latitude, longitude } = msg.location;
  const { name, rt, phoneNumber } = pending;

  log.info(`Lokasi diterima dari ${name}: ${latitude}, ${longitude}`);
  const geo = await reverseGeocode(latitude, longitude);

  try {
    await api.post('/users/register', {
      name, rt, phoneNumber, latitude, longitude, ...geo,
    });

    delete pendingRegistrations[rawPhone];
    savePending(pendingRegistrations);

    return safeReply(
      msg,
      `✨ *PENDAFTARAN BERHASIL!* ✨\n\n` +
      `Selamat *${name}*, akun Anda sudah aktif!\n\n` +
      `Ketik *#cek* untuk melihat saldo poin Anda kapan saja. 😊`
    );
  } catch (err) {
    log.error('handleLocation register:', err.response?.data || err.message);
    return safeReply(msg, '⚠️ Pendaftaran gagal. Silakan coba lagi atau hubungi admin.');
  }
}

async function handleSetor(msg, phone) {
  if (!msg.hasMedia) {
    return safeReply(msg, '⚠️ Setoran harus disertai *foto sampah*. Coba lagi dengan kirim foto + caption *#setor*.');
  }

  let user;
  try {
    const { data } = await api.get(`/users/${phone}`);
    user = data;
  } catch (err) {
    if (err.response?.status === 404) {
      return safeReply(msg, 'Maaf, nomor Anda belum terdaftar. Ketik *#daftar* untuk mendaftar. 😊');
    }
    return safeReply(msg, '⚠️ Gagal verifikasi akun. Coba lagi nanti.');
  }

  let media;
  try {
    media = await msg.downloadMedia();
  } catch (_) {
    return safeReply(msg, '⚠️ Gagal mengunduh foto. Pastikan koneksi stabil lalu coba lagi.');
  }

  try {
    const buffer = Buffer.from(media.data, 'base64');
    const ext = media.mimetype.split('/')[1] || 'jpg';
    const formData = new FormData();
    formData.append('image', buffer, {
      filename: `waste_${phone}_${Date.now()}.${ext}`,
      contentType: media.mimetype,
    });

    const { data: uploadData } = await axios.post(
      `${BASE_URL}/api/upload`,
      formData,
      { headers: formData.getHeaders(), timeout: 30_000 }
    );

    const { data: submission } = await api.post('/waste/submit', {
      userId: user.id,
      imageUrl: uploadData.imageUrl,
    });

    const newPoints = (user.totalPoints || 0) + (submission.pointsAwarded || 0);
    await safeReply(
      msg,
      `Alhamdulillah, terima kasih *${user.name}*! ✅\n\n` +
      `Poin Anda sekarang: *${newPoints.toLocaleString('id-ID')} Pts*\n\n` +
      `Terus jaga lingkungan! ♻️💚`
    );

    // Notifikasi Pengepul — ambil dari endpoint khusus, bukan semua user
    notifyPengepul(user.name).catch(() => { });

  } catch (err) {
    log.error('handleSetor:', err.message);
    return safeReply(msg, '⚠️ Gagal memproses setoran. Pastikan foto valid dan coba lagi.');
  }
}

async function notifyPengepul(senderName) {
  try {
    const { data: pengepuls } = await api.get('/users', { params: { role: 'PENGEPUL' } });
    const promises = pengepuls.map(p =>
      client
        .sendMessage(toWhatsAppId(p.phoneNumber), `📦 Tugas baru dari *${senderName}*. Silakan cek dashboard.`)
        .catch(e => log.warn(`Gagal notif pengepul ${p.phoneNumber}:`, e.message))
    );
    await Promise.all(promises);
  } catch (e) {
    log.warn('notifyPengepul:', e.message);
  }
}

function handleUnknownCommand(msg) {
  return safeReply(
    msg,
    `⚠️ *Perintah tidak dikenali.*\n\n` +
    `Gunakan salah satu perintah berikut:\n` +
    `• *#daftar* — Registrasi akun baru\n` +
    `• *#cek*    — Cek saldo & poin\n` +
    `• *#setor*  — Setor sampah (lampirkan foto)\n\n` +
    `Ketik *!ping* untuk tes koneksi bot.`
  );
}

// ════════════════════════════════════════════════════════════
//  Event Listener WhatsApp
// ════════════════════════════════════════════════════════════

client.on('qr', (qr) => {
  qrcode.generate(qr, { small: true });
  log.info('📲 Scan QR Code di atas untuk login!');
});

client.on('authenticated', () => log.ok('Login WhatsApp berhasil!'));
client.on('auth_failure', (m) => log.error('Login gagal:', m));
client.on('ready', () => log.ok('🚀 Bot SIAP menerima pesan!'));

client.on('message_create', async (msg) => {
  try {
    const content = (msg.body || msg.caption || '').trim();
    const lc = content.toLowerCase();

    log.debug(`[MSG] from=${msg.from} fromMe=${msg.fromMe} type=${msg.type} body="${content}"`);

    // ── Abaikan pesan grup ──
    const chat = await msg.getChat();
    if (chat.isGroup) return;

    // ── Anti-loop: pesan dari diri sendiri hanya proses jika perintah ──
    if (msg.fromMe && !content.startsWith('#') && !content.startsWith('!')) return;

    // ── Ekstrak nomor ──
    const rawPhone = msg.fromMe ? client.info.wid.user : msg.from.split('@')[0];
    const phone = toLocalPhone(rawPhone);

    // ── Rate Limiting ──
    if (isRateLimited(rawPhone)) {
      log.warn(`Rate limit: ${phone}`);
      return safeReply(msg, '⚠️ Terlalu banyak permintaan. Harap tunggu sebentar.');
    }

    log.info(`[PESAN] ${phone} → "${content.substring(0, 80)}"`);

    // ── Routing Perintah ──
    if (lc === '!ping') return handlePing(msg);
    if (lc.includes('#daftar')) return handleDaftar(msg);
    if (lc.startsWith('#reg')) return handleReg(msg, content, rawPhone, phone);
    if (lc.startsWith('#cek')) return handleCek(msg, phone);
    if (msg.type === 'location') return handleLocation(msg, rawPhone);
    if (lc.includes('#setor')) return handleSetor(msg, phone);

    // ── Perintah # tidak dikenal ──
    if (content.startsWith('#')) return handleUnknownCommand(msg);

  } catch (err) {
    // Error global: jangan expose detail teknis ke user
    log.error('[CRITICAL]', err.message, err.stack);
    try {
      await msg.reply('⚠️ Terjadi kesalahan pada sistem. Silakan coba lagi nanti.');
    } catch (_) { }
  }
});

// ════════════════════════════════════════════════════════════
//  Inisialisasi WhatsApp Client
// ════════════════════════════════════════════════════════════

async function startClient(retries = 3) {
  try {
    await client.initialize();
  } catch (err) {
    log.error('Gagal inisialisasi:', err.message);
    if (retries > 0 && err.message.includes('already running')) {
      log.info(`🔄 Retry inisialisasi... (sisa ${retries}x)`);
      cleanupLock(AUTH_PATH);
      await new Promise(r => setTimeout(r, 3000));
      return startClient(retries - 1);
    }
    process.exit(1);
  }
}

startClient();

// ════════════════════════════════════════════════════════════
//  Express API Server
// ════════════════════════════════════════════════════════════

const app = express();
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  const ready = !!(client.info?.wid);
  res.status(ready ? 200 : 503).json({
    status: ready ? 'ok' : 'not_ready',
    bot: ready ? 'connected' : 'disconnected',
    uptime: process.uptime(),
  });
});

// Kirim pesan dari backend
app.post('/send-message', async (req, res) => {
  const { phoneNumber, message } = req.body;

  if (!phoneNumber || !message) {
    return res.status(400).json({ success: false, error: 'phoneNumber dan message wajib diisi.' });
  }

  if (!client.info?.wid) {
    return res.status(503).json({ success: false, error: 'Bot belum login. Scan QR terlebih dahulu.' });
  }

  try {
    const chatId = toWhatsAppId(phoneNumber);
    log.info(`[SEND] → ${chatId}`);
    await client.sendMessage(chatId, message);
    return res.json({ success: true, message: 'Pesan berhasil dikirim.' });
  } catch (err) {
    log.error('[SEND] Gagal:', err.message);
    return res.status(500).json({ success: false, error: 'Gagal mengirim pesan.' });
  }
});

app.listen(BOT_SERVER_PORT, () => {
  log.ok(`🌐 Bot server berjalan di port ${BOT_SERVER_PORT}`);
});

// ─── Graceful Shutdown ──────────────────────────────────────
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

async function shutdown(signal) {
  log.info(`[${signal}] Mematikan bot...`);
  savePending(pendingRegistrations);
  try { await client.destroy(); } catch (_) { }
  process.exit(0);
}
