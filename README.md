# 💰 DuitKu — Aplikasi Pencatat Keuangan Pribadi

> Aplikasi keuangan pribadi berbasis web yang dapat diinstall di Android layaknya aplikasi native.

🌐 **Live Demo:** [webduitku.netlify.app](https://webduitku.netlify.app)

---

## 📱 Tentang DuitKu

DuitKu adalah aplikasi pencatat keuangan pribadi yang dibangun dengan pendekatan **mobile-first** dan dapat diinstall langsung ke homescreen Android sebagai Progressive Web App (PWA). Data tersimpan di cloud sehingga bisa diakses dari perangkat manapun.

---

## ✨ Fitur

**💳 Manajemen Akun & Saldo**
- Kas / dompet, multi rekening bank, investasi
- Tracking emas Pegadaian dengan harga live otomatis (XAU/IDR) atau input manual
- Net worth otomatis dari semua akun

**📝 Transaksi**
- Catat pemasukan & pengeluaran per akun
- Pilih kategori pengeluaran
- Void transaksi dengan reversal saldo otomatis
- Riwayat 15 transaksi terbaru di dashboard

**🎯 Budget & Target**
- Alokasi budget per kategori dengan progress bar
- Target tabungan berjangka — kalkulasi otomatis tabungan per bulan
- Estimasi bulan tercapainya target

**👤 Profil & Akun**
- Edit nama depan & belakang
- Ganti password (verifikasi password lama)
- Hapus akun dengan 3 lapis validasi
- Tombol install app langsung dari profil

**🔐 Autentikasi Lengkap**
- Register dengan nama, email, dan password
- Verifikasi email dengan template branded
- Lupa password — reset via email
- Halaman konfirmasi setelah verifikasi & reset password

**📲 PWA**
- Installable di Android layaknya aplikasi native
- Tampil fullscreen tanpa browser bar
- Service worker dengan strategi network-first

---

## 🛠️ Tech Stack

| Teknologi | Kegunaan |
|-----------|----------|
| HTML, CSS, JavaScript | Frontend — Vanilla JS tanpa framework |
| [Vite](https://vitejs.dev) | Build tool & development server |
| [Supabase](https://supabase.com) | Backend as a Service — database & autentikasi |
| [Netlify](https://netlify.com) | Hosting & continuous deployment |
| Gmail SMTP | Custom email untuk verifikasi & reset password |
| GitHub | Version control |

---

## 🗄️ Struktur Database (Supabase)

```
transactions   — Riwayat pemasukan & pengeluaran per user
bank_accounts  — Daftar rekening bank (multi akun)
budgets        — Alokasi budget per kategori
goals          — Target tabungan berjangka
settings       — Saldo kas, investasi, data emas, dan nama user
```

Semua tabel dilindungi dengan **Row Level Security (RLS)** — setiap user hanya bisa mengakses data miliknya sendiri.

---

## 📁 Struktur Project

```
duitku/
├── public/
│   ├── icon.svg            # App icon (huruf D merah)
│   ├── manifest.json       # PWA manifest
│   └── sw.js               # Service worker (network-first)
├── src/
│   ├── auth.js             # Login, register, lupa & reset password
│   ├── profile.js          # Halaman profil user
│   ├── storage.js          # Semua operasi database (Supabase)
│   ├── toast.js            # Notifikasi toast
│   ├── verified.js         # Halaman konfirmasi email
│   └── style.css           # Global styles
├── index.html
├── main.js                 # Entry point, render logic & routing
├── supabase.js             # Supabase client
├── vite.config.js          # Vite configuration
└── netlify.toml            # Netlify build & redirect config
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

**5. Build untuk production:**
```bash
npm run build
```

---

## 📲 Install di Android

1. Buka [webduitku.netlify.app](https://webduitku.netlify.app) di Chrome Android
2. Login ke akun DuitKu
3. Buka halaman **Profil** → ketuk **Install Aplikasi**
4. Atau ketuk menu **⋮** → **Add to Home Screen**
5. DuitKu siap digunakan layaknya aplikasi native

---

## 🔒 Keamanan

- Row Level Security (RLS) aktif di semua tabel
- XSS protection dengan sanitasi input (`escapeHtml`)
- Password lama diverifikasi sebelum ganti password baru
- Hapus akun memerlukan 3 lapis konfirmasi termasuk ketik ulang email
- Credentials Supabase disimpan di environment variables, tidak di kode

---

## 👤 Developer

**Maydhika Putra Setiawan**  
📧 maydhikasetiawan@gmail.com  
🔗 [LinkedIn](https://linkedin.com/in/maydhikaputra)  
💻 [GitHub](https://github.com/maydhikasetiawan)

---

> Dibangun sebagai project portofolio untuk mendemonstrasikan implementasi PWA, cloud database, autentikasi lengkap, dan keamanan aplikasi web modern.

---

## 📄 Lisensi

Didistribusikan di bawah [MIT License](LICENSE).  
© 2026 Maydhika Putra Setiawan
