# 🌿 WasteBank ID - Smart Waste Management System

**WasteBank ID** adalah platform pengelolaan bank sampah modern berbasis Digital & AI. Sistem ini mengintegrasikan Dashboard Admin yang intuitif dengan WhatsApp Bot untuk memudahkan warga dalam menabung sampah, memantau poin, dan melihat dampak positif mereka terhadap lingkungan.

---

## 🚀 Fitur Utama
- **🤖 WhatsApp Bot AI**: Verifikasi setoran sampah otomatis menggunakan foto.
- **🌍 Impact Tracker**: Kalkulasi otomatis penghematan emisi CO₂ dan penghematan energi listrik.
- **📢 Broadcast Command Center**: Kirim notifikasi massal ke warga dengan jeda aman & dukungan AI (DeepSeek).
- **📊 Real-time Analytics**: Pantau statistik setoran, pertumbuhan warga, dan tren harga pasar.
- **📄 Professional Reporting**: Export laporan keuangan dan setoran dalam format PDF.
- **🛡️ Multi-Role System**: Akses khusus untuk Admin, Pengepul (Petugas Lapangan), dan Warga.

---

## 🛠️ Tech Stack
- **Frontend**: React.js, Vite, Tailwind CSS, DaisyUI.
- **Backend**: Node.js, Express, Prisma ORM.
- **Database**: PostgreSQL / SQLite (via Prisma).
- **Bot**: WhatsApp-web.js (Puppeteer).
- **AI Integration**: DeepSeek AI (untuk edukasi & klasifikasi).

---

## 📦 Panduan Instalasi

### 1. Persyaratan Sistem
- Node.js (v18 ke atas)
- WhatsApp (untuk scan QR Bot)
- Koneksi Internet

### 2. Persiapan Folder
Sistem ini terdiri dari 3 bagian utama: `backend`, `bot`, dan `dashboard`.

### 3. Instalasi Dependency
Jalankan perintah berikut di terminal utama:
```bash
# Install dependency di root
npm install

# Install dependency di tiap modul
cd backend && npm install
cd ../bot && npm install
cd ../dashboard && npm install
```

### 4. Konfigurasi Environment (`.env`)
Salin file `.env.example` atau buat baru di folder masing-masing:

**Folder `backend/.env`:**
```env
DATABASE_URL="file:./dev.db"
DEEPSEEK_API_KEY="sk-xxxxxxxxxxx"
PORT=5000
```

**Folder `bot/.env`:**
```env
BACKEND_URL="http://localhost:5000/api"
PORT=5001
```

---

## 🏃 Cara Menjalankan Aplikasi

Anda tidak perlu membuka 3 terminal. Cukup jalankan satu perintah di folder utama:
```bash
npm run dev
```

**Layanan yang akan berjalan:**
- **Dashboard**: `http://localhost:5173` (Admin)
- **Backend API**: `http://localhost:5000`
- **WA Bot Server**: `http://localhost:5001`

---

## 📱 Panduan Penggunaan WhatsApp Bot

1. Setelah menjalankan `npm run dev`, cek terminal **[1] bot**.
2. Scan **QR Code** yang muncul menggunakan WhatsApp di HP Anda.
3. Gunakan perintah berikut:
   - `#cek` : Cek saldo poin, rincian KG, dan dampak lingkungan.
   - (Kirim Foto) : Kirim foto sampah untuk melakukan setoran otomatis.

---

## ⚠️ Tips Stabilitas (Windows)
Jika Bot mengalami error `The browser is already running`:
- Sistem sudah dilengkapi **Auto-Recovery**. Tunggu 5-10 detik untuk restart otomatis.
- Jika masih macet, hapus folder `bot/.wwebjs_auth` secara manual.

---

## 🤝 Kontribusi
Project ini dikembangkan untuk mewujudkan lingkungan yang lebih bersih dan warga yang lebih berdaya. Mari kita jaga bumi kita! 🌍♻️

**WasteBank ID - Ubah Sampah Jadi Berkah.**
# WesteBank-ID
