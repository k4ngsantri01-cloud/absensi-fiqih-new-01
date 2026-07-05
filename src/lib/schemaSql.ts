export const SUPABASE_SCHEMA_SQL = `-- ==========================================
-- SQL SCHEMA SETUP FOR SUPABASE
-- Aplikasi Absensi Fiqih New OE
-- ==========================================

-- Table: Kelas
CREATE TABLE IF NOT EXISTS kelas (
    id TEXT PRIMARY KEY,
    nama TEXT NOT NULL,
    tingkat TEXT NOT NULL
);

-- Table: Mata Pelajaran
CREATE TABLE IF NOT EXISTS mata_pelajaran (
    id TEXT PRIMARY KEY,
    nama TEXT NOT NULL,
    kode TEXT NOT NULL
);

-- Table: Hissoh (Sesi Jam Mengajar)
CREATE TABLE IF NOT EXISTS hissoh (
    id TEXT PRIMARY KEY,
    nomor INTEGER NOT NULL,
    jam_mulai TEXT NOT NULL,
    jam_selesai TEXT NOT NULL,
    jam_mulai_istiwa TEXT,
    jam_selesai_istiwa TEXT
);

-- Table: Semester
CREATE TABLE IF NOT EXISTS semester (
    id TEXT PRIMARY KEY,
    nama TEXT NOT NULL,
    aktif BOOLEAN NOT NULL DEFAULT false
);

-- Table: Tahun Ajaran
CREATE TABLE IF NOT EXISTS tahun_ajaran (
    id TEXT PRIMARY KEY,
    nama TEXT NOT NULL,
    aktif BOOLEAN NOT NULL DEFAULT false
);

-- Table: Santri (Siswa)
CREATE TABLE IF NOT EXISTS santri (
    id TEXT PRIMARY KEY,
    no INTEGER NOT NULL,
    nama TEXT NOT NULL,
    kelas_id TEXT REFERENCES kelas(id) ON DELETE CASCADE,
    jk TEXT CHECK (jk IN ('L', 'P')),
    status TEXT CHECK (status IN ('Aktif', 'Keluar')) NOT NULL DEFAULT 'Aktif'
);

-- Table: Jadwal Mengajar
CREATE TABLE IF NOT EXISTS jadwal (
    id TEXT PRIMARY KEY,
    hari TEXT NOT NULL,
    kelas_id TEXT REFERENCES kelas(id) ON DELETE CASCADE,
    mapel_id TEXT REFERENCES mata_pelajaran(id) ON DELETE CASCADE,
    hissoh_id TEXT REFERENCES hissoh(id) ON DELETE CASCADE
);

-- Table: Absensi (Catatan Kehadiran)
CREATE TABLE IF NOT EXISTS absensi (
    id TEXT PRIMARY KEY,
    tanggal TEXT NOT NULL, -- Format: YYYY-MM-DD
    hari TEXT NOT NULL,
    kelas_id TEXT REFERENCES kelas(id) ON DELETE CASCADE,
    mapel_id TEXT REFERENCES mata_pelajaran(id) ON DELETE CASCADE,
    hissoh_id TEXT REFERENCES hissoh(id) ON DELETE CASCADE,
    santri_id TEXT REFERENCES santri(id) ON DELETE CASCADE,
    status TEXT CHECK (status IN ('Hadir', 'Izin', 'Sakit', 'Ghoib')) NOT NULL,
    jam_absen TEXT NOT NULL -- Format: HH:mm:ss
);

-- ==========================================
-- ENABLE ROW LEVEL SECURITY (RLS) & POLICIES
-- ==========================================
ALTER TABLE kelas ENABLE ROW LEVEL SECURITY;
ALTER TABLE mata_pelajaran ENABLE ROW LEVEL SECURITY;
ALTER TABLE hissoh ENABLE ROW LEVEL SECURITY;
ALTER TABLE semester ENABLE ROW LEVEL SECURITY;
ALTER TABLE tahun_ajaran ENABLE ROW LEVEL SECURITY;
ALTER TABLE santri ENABLE ROW LEVEL SECURITY;
ALTER TABLE jadwal ENABLE ROW LEVEL SECURITY;
ALTER TABLE absensi ENABLE ROW LEVEL SECURITY;

-- Create ALL-ACCESS Policies (allows SELECT, INSERT, UPDATE, DELETE for anon and authenticated roles)
CREATE POLICY "Allow all actions on kelas" ON kelas FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all actions on mata_pelajaran" ON mata_pelajaran FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all actions on hissoh" ON hissoh FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all actions on semester" ON semester FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all actions on tahun_ajaran" ON tahun_ajaran FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all actions on santri" ON santri FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all actions on jadwal" ON jadwal FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all actions on absensi" ON absensi FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- ==========================================
-- INSERT SEED DATA (DEFAULT DATA)
-- ==========================================
INSERT INTO kelas (id, nama, tingkat) VALUES
('k1', '2 MTs A', 'MTs'),
('k2', '2 MTs B', 'MTs'),
('k3', '2 MTs C', 'MTs'),
('k4', '2 MTs D', 'MTs'),
('k5', '2 MTs E', 'MTs'),
('k6', '2 MTs F', 'MTs'),
('k7', '2 MTs G', 'MTs')
ON CONFLICT (id) DO NOTHING;

INSERT INTO mata_pelajaran (id, nama, kode) VALUES
('m1', 'Fiqih', 'FIQ'),
('m2', 'Ushul Fiqih', 'USF'),
('m3', 'Aqidah Akhlak', 'AA'),
('m4', 'Al-Qur''an Hadits', 'QH')
ON CONFLICT (id) DO NOTHING;

INSERT INTO hissoh (id, nomor, jam_mulai, jam_selesai, jam_mulai_istiwa, jam_selesai_istiwa) VALUES
('h1', 1, '07:00', '07:45', '06:30', '07:15'),
('h2', 2, '07:45', '08:30', '07:15', '08:00'),
('h3', 3, '08:30', '09:15', '08:00', '08:45'),
('h4', 4, '09:30', '10:15', '09:00', '09:45'),
('h5', 5, '10:15', '11:00', '09:45', '10:30'),
('h6', 6, '11:00', '11:45', '10:30', '11:15')
ON CONFLICT (id) DO NOTHING;

INSERT INTO semester (id, nama, aktif) VALUES
('s1', 'Semester Ganjil (CAWU 1)', true),
('s2', 'Semester Genap (CAWU 2)', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO tahun_ajaran (id, nama, aktif) VALUES
('t1', '2025/2026', false),
('t2', '2026/2027', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO jadwal (id, hari, kelas_id, mapel_id, hissoh_id) VALUES
('j1', 'Senin', 'k1', 'm1', 'h1'),
('j2', 'Senin', 'k2', 'm1', 'h2'),
('j3', 'Senin', 'k3', 'm2', 'h3'),
('j4', 'Selasa', 'k1', 'm3', 'h1'),
('j5', 'Selasa', 'k4', 'm1', 'h2'),
('j6', 'Rabu', 'k5', 'm1', 'h1'),
('j7', 'Rabu', 'k6', 'm4', 'h2'),
('j8', 'Kamis', 'k7', 'm1', 'h1'),
('j9', 'Kamis', 'k1', 'm2', 'h2'),
('j10', 'Minggu', 'k2', 'm4', 'h1'),
('j11', 'Sabtu', 'k3', 'm1', 'h1'),
('j12', 'Sabtu', 'k4', 'm3', 'h2')
ON CONFLICT (id) DO NOTHING;

INSERT INTO santri (id, no, nama, kelas_id, jk, status) VALUES
('s01', 1001, 'Ahmad Subarjo', 'k1', 'L', 'Aktif'),
('s02', 1002, 'Ridho Firmansyah', 'k1', 'L', 'Aktif'),
('s03', 1003, 'Muhammad Al-Fatih', 'k1', 'L', 'Aktif'),
('s04', 1004, 'Fatimah Az-Zahra', 'k1', 'P', 'Aktif'),
('s05', 1005, 'Zainab Al-Kubro *keluar', 'k1', 'P', 'Keluar'),
('s06', 1006, 'Budi Santoso', 'k2', 'L', 'Aktif'),
('s07', 1007, 'Siti Aminah', 'k2', 'P', 'Aktif'),
('s08', 1008, 'Umar Bin Khattab', 'k2', 'L', 'Aktif'),
('s09', 1009, 'Aisyah Humaira', 'k2', 'P', 'Aktif'),
('s10', 1010, 'Lukman Hakim', 'k3', 'L', 'Aktif'),
('s11', 1011, 'Khofifah Indah', 'k3', 'P', 'Aktif'),
('s12', 1012, 'Ali Imron', 'k3', 'L', 'Aktif'),
('s13', 1013, 'Farhan Ma''ruf', 'k4', 'L', 'Aktif'),
('s14', 1014, 'Dewi Sartika', 'k4', 'P', 'Aktif'),
('s15', 1015, 'Ririn Ekawati *keluar', 'k3', 'P', 'Keluar'),
('s16', 1016, 'Rahmat Hidayat', 'k5', 'L', 'Aktif'),
('s17', 1017, 'Mega Utami', 'k5', 'P', 'Aktif'),
('s18', 1018, 'Hasan Basri', 'k6', 'L', 'Aktif'),
('s19', 1019, 'Lailatul Qodriyah', 'k6', 'P', 'Aktif'),
('s20', 1020, 'Ibrahim Ahmad', 'k7', 'L', 'Aktif'),
('s21', 1021, 'Siti Rahmawati', 'k7', 'P', 'Aktif'),
('s22', 1022, 'Yusuf Mansur', 'k1', 'L', 'Aktif'),
('s23', 1023, 'Hamzah Fansuri', 'k2', 'L', 'Aktif'),
('s24', 1024, 'Abdurrahman Wahid', 'k4', 'L', 'Aktif'),
('s25', 1025, 'Ki Hajar Dewantara', 'k7', 'L', 'Aktif')
ON CONFLICT (id) DO NOTHING;
`;
