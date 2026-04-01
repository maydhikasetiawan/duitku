# 💰 DuitKu — Aplikasi Pencatat Keuangan Pribadi

> Aplikasi keuangan pribadi berbasis web yang dapat diinstall di Android layaknya aplikasi native.

🌐 **Live Demo:** [webduitku.netlify.app](https://webduitku.netlify.app)

---

## 📱 Tampilan

DuitKu dirancang dengan pendekatan **mobile-first** dan dapat diinstall langsung ke homescreen Android sebagai Progressive Web App (PWA).

---

## ✨ Fitur

- 📊 **Dashboard** — Total kekayaan bersih, arus kas bulanan, dan riwayat transaksi
- 💵 **Multi Akun** — Kas, beberapa rekening bank, investasi, dan emas Pegadaian
- 🥇 **Tracking Emas** — Input gramasi emas dengan harga live otomatis atau manual
- 🎯 **Budget** — Alokasi dan monitoring pengeluaran per kategori
- 🏆 **Target Tabungan** — Kalkulasi otomatis tabungan per bulan untuk mencapai target
- ✕ **Void Transaksi** — Pembatalan transaksi dengan reversal saldo otomatis
- 🔐 **Autentikasi** — Login dan register dengan email & password
- ☁️ **Cloud Storage** — Data tersimpan di cloud, bisa diakses dari perangkat manapun
- 📲 **PWA** — Installable di Android, tampil fullscreen layaknya aplikasi native

---

## 🛠️ Tech Stack

| Teknologi | Kegunaan |
|-----------|----------|
| HTML, CSS, JavaScript | Frontend — Vanilla JS tanpa framework |
| [Vite](https://vitejs.dev) | Build tool & development server |
| [Supabase](https://supabase.com) | Backend as a Service — database & autentikasi |
| [Netlify](https://netlify.com) | Hosting & continuous deployment |
| GitHub | Version control |

---

## 🗄️ Struktur Database (Supabase)

```
transactions   — Riwayat pemasukan & pengeluaran
bank_accounts  — Daftar rekening bank
budgets        — Alokasi budget per kategori
goals          — Target tabungan berjangka
settings       — Saldo kas, investasi, dan data emas
```

Semua tabel dilindungi dengan **Row Level Security (RLS)** — setiap user hanya bisa mengakses data miliknya sendiri.

---

## 📁 Struktur Project

```
duitku/
├── public/
│   ├── icon.svg          # App icon
│   ├── manifest.json     # PWA manifest
│   └── sw.js             # Service worker
├── src/
│   ├── auth.js           # Halaman login & register
│   ├── storage.js        # Semua operasi database (Supabase)
│   ├── toast.js          # Notifikasi toast
│   └── style.css         # Global styles
├── index.html
├── main.js               # Entry point & render logic
├── supabase.js           # Supabase client
└── vite.config.js
```

---

## 🚀 Cara Menjalankan Lokal

**1. Clone repository:**
```bash
git clone https://github.com/maydhikasetiawan/duitku.git
cd duitku
```

**2. Install dependencies:**
```bash
npm install
```

**3. Buat file `.env`:**
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**4. Jalankan development server:**
```bash
npm run dev
```

Buka `http://localhost:5173` di browser.

---

## 📲 Install di Android

1. Buka [webduitku.netlify.app](https://webduitku.netlify.app) di Chrome Android
2. Ketuk menu **⋮** → **Add to Home Screen**
3. DuitKu siap digunakan layaknya aplikasi native

---

## 👤 Developer

**Maydhika Putra Setiawan**  
📧 maydhikasetiawan@gmail.com  
🔗 [LinkedIn](https://linkedin.com/in/maydhikaputra)  
💻 [GitHub](https://github.com/maydhikasetiawan)

---

> Dibangun sebagai project portofolio untuk mendemonstrasikan implementasi PWA, cloud database, dan autentikasi pada aplikasi web modern.

---

## 📄 Lisensi

Didistribusikan di bawah [MIT License](LICENSE).  
© 2026 Maydhika Putra Setiawan
