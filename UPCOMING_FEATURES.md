# 🚀 WasteBank ID - Upcoming Features & Roadmap

File ini digunakan untuk diskusi dan merencanakan fitur-fitur baru sebelum dieksekusi. 
Status: 🟡 *Pending* | 🟢 *Approved* | 🔵 *In Progress* | ✅ *Done*

---

## 🤖 WhatsApp Bot Enhancements
- [ ] **🟡 Perintah `#harga`**: Warga bisa cek daftar harga sampah terbaru langsung dari WA.
- [ ] **🟡 Perintah `#panduan`**: Instruksi lengkap cara pilah sampah (Bilas, Pisah, Setor).
- [ ] **🟡 Milestones Certificate**: Otomatis kirim PDF "Sertifikat Pahlawan Lingkungan" jika warga mencapai total setoran 50kg/100kg.
- [ ] **🟡 Educational CMS & Auto-Scheduler**: Perpustakaan konten edukasi yang bisa dijadwalkan pengirimannya secara otomatis oleh Bot (misal: tiap Rabu pagi).

## 📊 Dashboard & Analytics
- [x] **✅ Chart.js Integration**: Ganti tabel angka dengan Grafik Batang & Garis yang interaktif untuk tren setoran bulanan.
- [x] **✅ Broadcast History**: Catatan lengkap semua pesan yang pernah dikirim melalui Command Center (Log waktu, Target, & Status).
- [x] **✅ Reward Catalog Management**: Halaman khusus untuk mengelola stok sembako, token listrik, dan sistem "Redeem" poin di kantor.

## 🛡️ Keamanan & Infrastruktur
- [x] **✅ Multi-Admin System**: Pembedaan hak akses antara Admin Utama (Kelurahan) dan Admin Operasional (Bank Sampah).
- [x] **✅ Auto-Backup Database**: Pencadangan data otomatis setiap minggu untuk keamanan data warga.

## 🛡️ Security Hardening & Privacy
- [x] **✅ Helmet.js Integration**: Menambahkan perisai header HTTP untuk mencegah serangan XSS dan Clickjacking.
- [x] **✅ Express Rate Limiter**: Membatasi jumlah permintaan per IP untuk mencegah serangan Brute Force dan DDoS.
- [x] **✅ Secure File Filter**: Memperketat sistem upload foto agar hanya menerima file gambar (JPG/PNG), mencegah upload file berbahaya (.exe/.js).
- [x] **✅ Advanced Validation**: Validasi data input yang lebih ketat menggunakan Zod/Joi untuk memastikan tidak ada kode jahat yang masuk ke database.

## 📡 Integrasi IoT (Internet of Things)
- [ ] **🟡 Smart Bin Level**: Sensor ultrasonik di bak sampah komunal RT untuk deteksi "Kapasitas Penuh". Bot akan otomatis panggil Pengepul jika sampah sudah 90%.
- [ ] **🟡 Smart Bin Lock (QR Access)**: Bak sampah hanya bisa dibuka dengan Scan QR dari Bot WA (Mencegah orang luar membuang sampah sembarangan).
- [ ] **🟡 IoT Smart Scale**: Timbangan digital yang terhubung via WiFi/Bluetooth untuk input berat sampah otomatis ke Dashboard tanpa ketik manual.

---

## 📝 Ruang Diskusi
*Tulis ide baru Anda di sini...*

1. **Ide 1**: (Belum ada)
2. **Ide 2**: (Belum ada)

---

> **Cara Update**: Jika ada fitur yang ingin dikerjakan, cukup beritahu Antigravity: *"Gas kerjain fitur #harga!"*
