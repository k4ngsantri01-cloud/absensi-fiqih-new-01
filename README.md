<div align="center">
<img width="1200" height="475" alt="Absensi Fiqih App" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Aplikasi Absensi Fiqih - React + Vite + Supabase

Aplikasi web untuk manajemen absensi siswa pada mata pelajaran Fiqih. Aplikasi ini dibangun menggunakan React + Vite dan terhubung langsung ke Supabase sebagai backend database.

## 🚀 Fitur Utama

- **Dashboard**: Ringkasan data absensi dan statistik
- **Jadwal Mengajar**: Manajemen jadwal kelas dan mata pelajaran
- **Presensi**: Pencatatan absensi siswa real-time
- **Rekap**: Laporan dan rekapitulasi absensi
- **Data Santri**: Manajemen data siswa dan kelas
- **Pengaturan**: Konfigurasi semester, tahun ajaran, dan koneksi Supabase
- **Dark Mode**: Dukungan tema gelap
- **PWA**: Bisa diinstal sebagai aplikasi web

## 📋 Persyaratan

- Node.js 18+ 
- Akun Supabase gratis (https://supabase.com)
- Browser modern (Chrome, Firefox, Safari, Edge)

## 🔧 Setup & Instalasi

### 1. Clone atau download proyek ini

### 2. Install dependencies
```bash
npm install
```

### 3. Setup Supabase Database

1. Buat project baru di [Supabase](https://supabase.com/dashboard)
2. Copy file `SUPABASE_SCHEMA.sql` 
3. Buka SQL Editor di Supabase dashboard
4. Paste konten dari `SUPABASE_SCHEMA.sql` dan jalankan query

### 4. Konfigurasi Environment Variables

1. Copy file `.env.example` menjadi `.env.local`:
```bash
cp .env.example .env.local
```

2. Update `.env.local` dengan kredensial Supabase Anda:
```env
VITE_SUPABASE_URL=https://akztjzhmhjvsuwilrgmo.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFrenRqemhtaGp2c3V3aWxyZ21vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMyMTE0MzksImV4cCI6MjA5ODc4NzQzOX0.dhDI13VlmucC9ictFqj-Htq8CdtcpLlOSbl69hO_Grg
```

**Cara mendapatkan kredensial:**
- Buka Supabase Dashboard → Settings → API
- Copy **Project URL** untuk `VITE_SUPABASE_URL`
- Copy **anon public key** untuk `VITE_SUPABASE_ANON_KEY`

### 5. Jalankan development server
```bash
npm run dev
```

Aplikasi akan terbuka di `http://localhost:5173`

## 📦 Build & Deploy

### Build untuk production
```bash
npm run build
```

Output akan berada di folder `dist/`

### Deploy ke hosting (Vercel, Netlify, GitHub Pages, dll)

Aplikasi ini adalah pure frontend React + Vite, jadi dapat dideploy ke hosting statis:

**Opsi 1: Vercel**
```bash
npm install -g vercel
vercel
```

**Opsi 2: Netlify**
1. Hubungkan repository ke Netlify
2. Set build command: `npm run build`
3. Set publish directory: `dist`

**Opsi 3: GitHub Pages**
Ikuti dokumentasi GitHub Pages dan pastikan untuk set VITE_SUPABASE_* environment variables di hosting platform Anda.

## 🔌 Arsitektur

### Frontend Only
- **React 19** - UI framework
- **Vite** - Build tool & dev server
- **Tailwind CSS** - Styling
- **Supabase JS** - Database client

### Database (Supabase)
- **PostgreSQL** - Database engine
- **Realtime** - Real-time capabilities (opsional)
- **Row Level Security** - Authorization

### Data Flow
```
React Components
    ↓
db module (in-memory cache)
    ↓
Supabase Client
    ↓
Supabase API
    ↓
PostgreSQL Database
```

## 📱 Operasi CRUD

Semua operasi CRUD (Create, Read, Update, Delete) dilakukan langsung dari browser ke Supabase:

- **Kelas**: Tambah, edit, hapus kelas
- **Santri**: Manajemen data siswa
- **Mata Pelajaran**: Pengaturan mata pelajaran
- **Hissoh**: Manajemen sesi jam belajar
- **Jadwal**: Penjadwalan mengajar
- **Absensi**: Pencatatan kehadiran
- **Semester & Tahun Ajaran**: Pengaturan kalender akademik

## ⚙️ Konfigurasi Lanjutan

### Row Level Security (RLS)

Supabase telah mengaktifkan RLS pada tabel. Kebijakan permissif sudah ditetapkan untuk mengizinkan aplikasi frontend mengakses data menggunakan anon key publik.

Jika ingin menambah keamanan lebih lanjut, Anda dapat:
1. Implementasikan authentication (login)
2. Terapkan RLS policies yang lebih ketat

### Offline Support

Aplikasi saat ini akan menggunakan seed data jika Supabase tidak terhubung. Untuk offline support yang lebih baik, pertimbangkan:
- IndexedDB untuk caching lokal
- Service Workers untuk PWA offline mode
- Sync queue untuk data yang dibuat offline

## 🐛 Troubleshooting

### "Supabase belum dikonfigurasi"
- Pastikan `.env.local` sudah dibuat
- Periksa kembali VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY
- Restart dev server setelah update .env

### "Koneksi Supabase gagal"
- Periksa kredensial di `.env.local`
- Pastikan proyek Supabase aktif
- Cek network tab di browser devtools

### "Tabel tidak ditemukan"
- Pastikan `SUPABASE_SCHEMA.sql` sudah dijalankan di SQL Editor Supabase
- Pastikan tidak ada error saat menjalankan SQL

### Build error
- Hapus folder `node_modules` dan `.dist`
- Jalankan `npm install` lagi
- Jalankan `npm run build`

## 📚 Teknologi & Dependencies

```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.66.0",
    "react": "^19.0.1",
    "react-dom": "^19.0.1",
    "vite": "^6.2.3",
    "@tailwindcss/vite": "^4.1.14",
    "lucide-react": "^0.546.0",
    "motion": "^12.23.24"
  }
}
```

## 📄 License

Apache 2.0

## 🤝 Kontribusi

Silakan buat pull request atau buka issue untuk saran dan perbaikan.

---

**Catatan**: Aplikasi ini tidak menggunakan backend server apapun. Semua operasi dilakukan langsung dari frontend ke Supabase.
