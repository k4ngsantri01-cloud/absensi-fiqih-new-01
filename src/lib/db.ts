/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Kelas, Santri, MataPelajaran, Hissoh, Jadwal, Absensi, Semester, TahunAjaran, SupabaseConfig } from '../types';
import { getSupabaseClient } from './supabaseClient';

// Storage Keys (for UI state only, not for data)
const KEYS = {
  SUPABASE_CONFIG: 'absensi_fiqih_supabase_config',
  ACTIVE_PAGE_SAVE: 'absensi_fiqih_last_page',
};

// In-memory cache for all data (loaded from Supabase)
interface CacheState {
  kelas: Kelas[];
  santri: Santri[];
  mapel: MataPelajaran[];
  hissoh: Hissoh[];
  jadwal: Jadwal[];
  absensi: Absensi[];
  semester: Semester[];
  tahunAjaran: TahunAjaran[];
  loaded: boolean;
}

const cache: CacheState = {
  kelas: [],
  santri: [],
  mapel: [],
  hissoh: [],
  jadwal: [],
  absensi: [],
  semester: [],
  tahunAjaran: [],
  loaded: false,
};

// Seed Data for initial setup (only used if Supabase is empty)
const seedKelas: Kelas[] = [
  { id: 'k1', nama: '2 MTs A', tingkat: 'MTs' },
  { id: 'k2', nama: '2 MTs B', tingkat: 'MTs' },
  { id: 'k3', nama: '2 MTs C', tingkat: 'MTs' },
  { id: 'k4', nama: '2 MTs D', tingkat: 'MTs' },
  { id: 'k5', nama: '2 MTs E', tingkat: 'MTs' },
  { id: 'k6', nama: '2 MTs F', tingkat: 'MTs' },
  { id: 'k7', nama: '2 MTs G', tingkat: 'MTs' },
];

const seedMapel: MataPelajaran[] = [
  { id: 'm1', nama: 'Fiqih', kode: 'FIQ' },
  { id: 'm2', nama: 'Ushul Fiqih', kode: 'USF' },
  { id: 'm3', nama: 'Aqidah Akhlak', kode: 'AA' },
  { id: 'm4', nama: 'Al-Qur\'an Hadits', kode: 'QH' },
];

const seedHissoh: Hissoh[] = [
  { id: 'h1', nomor: 1, jam_mulai: '07:00', jam_selesai: '07:45', jam_mulai_istiwa: '06:30', jam_selesai_istiwa: '07:15' },
  { id: 'h2', nomor: 2, jam_mulai: '07:45', jam_selesai: '08:30', jam_mulai_istiwa: '07:15', jam_selesai_istiwa: '08:00' },
  { id: 'h3', nomor: 3, jam_mulai: '08:30', jam_selesai: '09:15', jam_mulai_istiwa: '08:00', jam_selesai_istiwa: '08:45' },
  { id: 'h4', nomor: 4, jam_mulai: '09:30', jam_selesai: '10:15', jam_mulai_istiwa: '09:00', jam_selesai_istiwa: '09:45' },
  { id: 'h5', nomor: 5, jam_mulai: '10:15', jam_selesai: '11:00', jam_mulai_istiwa: '09:45', jam_selesai_istiwa: '10:30' },
  { id: 'h6', nomor: 6, jam_mulai: '11:00', jam_selesai: '11:45', jam_mulai_istiwa: '10:30', jam_selesai_istiwa: '11:15' },
];

const seedSemester: Semester[] = [
  { id: 's1', nama: 'Semester Ganjil (CAWU 1)', aktif: true },
  { id: 's2', nama: 'Semester Genap (CAWU 2)', aktif: false },
];

const seedTahunAjaran: TahunAjaran[] = [
  { id: 't1', nama: '2025/2026', aktif: false },
  { id: 't2', nama: '2026/2027', aktif: true },
];

const seedJadwal: Jadwal[] = [
  { id: 'j1', hari: 'Senin', kelas_id: 'k1', mapel_id: 'm1', hissoh_id: 'h1' },
  { id: 'j2', hari: 'Senin', kelas_id: 'k2', mapel_id: 'm1', hissoh_id: 'h2' },
  { id: 'j3', hari: 'Senin', kelas_id: 'k3', mapel_id: 'm2', hissoh_id: 'h3' },
  { id: 'j4', hari: 'Selasa', kelas_id: 'k1', mapel_id: 'm3', hissoh_id: 'h1' },
  { id: 'j5', hari: 'Selasa', kelas_id: 'k4', mapel_id: 'm1', hissoh_id: 'h2' },
  { id: 'j6', hari: 'Rabu', kelas_id: 'k5', mapel_id: 'm1', hissoh_id: 'h1' },
  { id: 'j7', hari: 'Rabu', kelas_id: 'k6', mapel_id: 'm4', hissoh_id: 'h2' },
  { id: 'j8', hari: 'Kamis', kelas_id: 'k7', mapel_id: 'm1', hissoh_id: 'h1' },
  { id: 'j9', hari: 'Kamis', kelas_id: 'k1', mapel_id: 'm2', hissoh_id: 'h2' },
  { id: 'j10', hari: 'Minggu', kelas_id: 'k2', mapel_id: 'm4', hissoh_id: 'h1' },
  { id: 'j11', hari: 'Sabtu', kelas_id: 'k3', mapel_id: 'm1', hissoh_id: 'h1' },
  { id: 'j12', hari: 'Sabtu', kelas_id: 'k4', mapel_id: 'm3', hissoh_id: 'h2' },
];

const seedSantri: Santri[] = [
  { id: 's01', no: 1001, nama: 'Ahmad Subarjo', kelas_id: 'k1', jk: 'L', status: 'Aktif' },
  { id: 's02', no: 1002, nama: 'Ridho Firmansyah', kelas_id: 'k1', jk: 'L', status: 'Aktif' },
  { id: 's03', no: 1003, nama: 'Muhammad Al-Fatih', kelas_id: 'k1', jk: 'L', status: 'Aktif' },
  { id: 's04', no: 1004, nama: 'Fatimah Az-Zahra', kelas_id: 'k1', jk: 'P', status: 'Aktif' },
  { id: 's05', no: 1005, nama: 'Zainab Al-Kubro *keluar', kelas_id: 'k1', jk: 'P', status: 'Keluar' },
  { id: 's06', no: 1006, nama: 'Budi Santoso', kelas_id: 'k2', jk: 'L', status: 'Aktif' },
  { id: 's07', no: 1007, nama: 'Siti Aminah', kelas_id: 'k2', jk: 'P', status: 'Aktif' },
  { id: 's08', no: 1008, nama: 'Umar Bin Khattab', kelas_id: 'k2', jk: 'L', status: 'Aktif' },
  { id: 's09', no: 1009, nama: 'Aisyah Humaira', kelas_id: 'k2', jk: 'P', status: 'Aktif' },
  { id: 's10', no: 1010, nama: 'Lukman Hakim', kelas_id: 'k3', jk: 'L', status: 'Aktif' },
  { id: 's11', no: 1011, nama: 'Khofifah Indah', kelas_id: 'k3', jk: 'P', status: 'Aktif' },
  { id: 's12', no: 1012, nama: 'Ali Imron', kelas_id: 'k3', jk: 'L', status: 'Aktif' },
  { id: 's13', no: 1013, nama: 'Farhan Ma\'ruf', kelas_id: 'k4', jk: 'L', status: 'Aktif' },
  { id: 's14', no: 1014, nama: 'Dewi Sartika', kelas_id: 'k4', jk: 'P', status: 'Aktif' },
  { id: 's15', no: 1015, nama: 'Ririn Ekawati *keluar', kelas_id: 'k3', jk: 'P', status: 'Keluar' },
  { id: 's16', no: 1016, nama: 'Rahmat Hidayat', kelas_id: 'k5', jk: 'L', status: 'Aktif' },
  { id: 's17', no: 1017, nama: 'Mega Utami', kelas_id: 'k5', jk: 'P', status: 'Aktif' },
  { id: 's18', no: 1018, nama: 'Hasan Basri', kelas_id: 'k6', jk: 'L', status: 'Aktif' },
  { id: 's19', no: 1019, nama: 'Lailatul Qodriyah', kelas_id: 'k6', jk: 'P', status: 'Aktif' },
  { id: 's20', no: 1020, nama: 'Ibrahim Ahmad', kelas_id: 'k7', jk: 'L', status: 'Aktif' },
  { id: 's21', no: 1021, nama: 'Siti Rahmawati', kelas_id: 'k7', jk: 'P', status: 'Aktif' },
  { id: 's22', no: 1022, nama: 'Yusuf Mansur', kelas_id: 'k1', jk: 'L', status: 'Aktif' },
  { id: 's23', no: 1023, nama: 'Hamzah Fansuri', kelas_id: 'k2', jk: 'L', status: 'Aktif' },
  { id: 's24', no: 1024, nama: 'Abdurrahman Wahid', kelas_id: 'k4', jk: 'L', status: 'Aktif' },
  { id: 's25', no: 1025, nama: 'Ki Hajar Dewantara', kelas_id: 'k7', jk: 'L', status: 'Aktif' },
];

const seedSupabase: SupabaseConfig = {
  url: '',
  anonKey: '',
  connected: false,
  latency: 0,
  lastSync: '-',
  mode: 'offline',
};

// Local storage helpers (for UI state only)
function getLocal<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (e) {
    console.error('Error reading localStorage', e);
    return defaultValue;
  }
}

function setLocal<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('Error writing localStorage', e);
  }
}

// Initialize on import
export function initDB() {
  if (!localStorage.getItem(KEYS.SUPABASE_CONFIG)) setLocal(KEYS.SUPABASE_CONFIG, seedSupabase);
}

// Initialize on import
initDB();

// Helper to get Supabase client with proper config
function getSupabaseInstance(): ReturnType<typeof getSupabaseClient> | null {
  try {
    const config = db.getSupabaseConfig();
    if (!config.url || !config.anonKey) return null;
    return getSupabaseClient();
  } catch {
    return null;
  }
}

// Initialize cache from Supabase on app startup
async function initializeCacheFromSupabase(): Promise<void> {
  const supabase = getSupabaseInstance();
  if (!supabase) {
    // If Supabase not configured, load seed data instead
    cache.kelas = seedKelas;
    cache.santri = seedSantri;
    cache.mapel = seedMapel;
    cache.hissoh = seedHissoh;
    cache.jadwal = seedJadwal;
    cache.semester = seedSemester;
    cache.tahunAjaran = seedTahunAjaran;
    cache.absensi = [];
    cache.loaded = true;
    return;
  }

  try {
    // Load all tables in parallel
    const [kelasData, santriData, mapelData, hissohData, jadwalData, absensiData, semesterData, tahunAjaranData] = await Promise.all([
      supabase.from('kelas').select('*').then(r => r.data || []),
      supabase.from('santri').select('*').then(r => r.data || []),
      supabase.from('mata_pelajaran').select('*').then(r => r.data || []),
      supabase.from('hissoh').select('*').then(r => r.data || []),
      supabase.from('jadwal').select('*').then(r => r.data || []),
      supabase.from('absensi').select('*').then(r => r.data || []),
      supabase.from('semester').select('*').then(r => r.data || []),
      supabase.from('tahun_ajaran').select('*').then(r => r.data || []),
    ]);

    cache.kelas = (kelasData as Kelas[]) || seedKelas;
    cache.santri = (santriData as Santri[]) || seedSantri;
    cache.mapel = (mapelData as MataPelajaran[]) || seedMapel;
    cache.hissoh = (hissohData as Hissoh[]) || seedHissoh;
    cache.jadwal = (jadwalData as Jadwal[]) || seedJadwal;
    cache.absensi = (absensiData as Absensi[]) || [];
    cache.semester = (semesterData as Semester[]) || seedSemester;
    cache.tahunAjaran = (tahunAjaranData as TahunAjaran[]) || seedTahunAjaran;
    cache.loaded = true;
  } catch (e) {
    console.error('Failed to initialize cache from Supabase:', e);
    // Fallback to seed data
    cache.kelas = seedKelas;
    cache.santri = seedSantri;
    cache.mapel = seedMapel;
    cache.hissoh = seedHissoh;
    cache.jadwal = seedJadwal;
    cache.semester = seedSemester;
    cache.tahunAjaran = seedTahunAjaran;
    cache.absensi = [];
    cache.loaded = true;
  }
}

// API operations
export const db = {
  // Initialize cache from Supabase
  initializeData: async () => {
    await initializeCacheFromSupabase();
  },

  // Kelas operations
  getKelas: (): Kelas[] => [...cache.kelas],
  saveKelas: async (data: Kelas[]): Promise<void> => {
    cache.kelas = data;
    const supabase = getSupabaseInstance();
    if (supabase) {
      const { error } = await supabase.from('kelas').upsert(data, { onConflict: 'id' });
      if (error) {
        console.error('Error saving kelas to Supabase:', error);
        throw error;
      }
      db.updateSupabaseSyncTime();
    }
  },
  addKelas: async (item: Omit<Kelas, 'id'>): Promise<Kelas> => {
    const newItem: Kelas = { ...item, id: 'k_' + Date.now() };
    cache.kelas.push(newItem);
    const supabase = getSupabaseInstance();
    if (supabase) {
      const { error } = await supabase.from('kelas').insert([newItem]);
      if (error) {
        console.error('Error adding kelas to Supabase:', error);
        throw error;
      }
      db.updateSupabaseSyncTime();
    }
    return newItem;
  },
  updateKelas: async (item: Kelas): Promise<void> => {
    const index = cache.kelas.findIndex(x => x.id === item.id);
    if (index !== -1) {
      cache.kelas[index] = item;
      const supabase = getSupabaseInstance();
      if (supabase) {
        const { error } = await supabase.from('kelas').update(item).eq('id', item.id);
        if (error) {
          console.error('Error updating kelas in Supabase:', error);
          throw error;
        }
        db.updateSupabaseSyncTime();
      }
    }
  },
  deleteKelas: async (id: string): Promise<void> => {
    cache.kelas = cache.kelas.filter(x => x.id !== id);
    const supabase = getSupabaseInstance();
    if (supabase) {
      const { error } = await supabase.from('kelas').delete().eq('id', id);
      if (error) {
        console.error('Error deleting kelas from Supabase:', error);
        throw error;
      }
      db.updateSupabaseSyncTime();
    }
  },

  // Santri operations
  getSantri: (): Santri[] => [...cache.santri],
  saveSantri: async (data: Santri[]): Promise<void> => {
    cache.santri = data;
    const supabase = getSupabaseInstance();
    if (supabase) {
      const { error } = await supabase.from('santri').upsert(data, { onConflict: 'id' });
      if (error) {
        console.error('Error saving santri to Supabase:', error);
        throw error;
      }
      db.updateSupabaseSyncTime();
    }
  },
  addSantri: async (item: Omit<Santri, 'id'>): Promise<Santri> => {
    const newItem: Santri = { ...item, id: 's_' + Date.now() };
    cache.santri.push(newItem);
    const supabase = getSupabaseInstance();
    if (supabase) {
      const { error } = await supabase.from('santri').insert([newItem]);
      if (error) {
        console.error('Error adding santri to Supabase:', error);
        throw error;
      }
      db.updateSupabaseSyncTime();
    }
    return newItem;
  },
  updateSantri: async (item: Santri): Promise<void> => {
    const index = cache.santri.findIndex(x => x.id === item.id);
    if (index !== -1) {
      cache.santri[index] = item;
      const supabase = getSupabaseInstance();
      if (supabase) {
        const { error } = await supabase.from('santri').update(item).eq('id', item.id);
        if (error) {
          console.error('Error updating santri in Supabase:', error);
          throw error;
        }
        db.updateSupabaseSyncTime();
      }
    }
  },
  deleteSantri: async (id: string): Promise<void> => {
    cache.santri = cache.santri.filter(x => x.id !== id);
    const supabase = getSupabaseInstance();
    if (supabase) {
      const { error } = await supabase.from('santri').delete().eq('id', id);
      if (error) {
        console.error('Error deleting santri from Supabase:', error);
        throw error;
      }
      db.updateSupabaseSyncTime();
    }
  },

  // Mata Pelajaran operations
  getMapel: (): MataPelajaran[] => [...cache.mapel],
  saveMapel: async (data: MataPelajaran[]): Promise<void> => {
    cache.mapel = data;
    const supabase = getSupabaseInstance();
    if (supabase) {
      const { error } = await supabase.from('mata_pelajaran').upsert(data, { onConflict: 'id' });
      if (error) {
        console.error('Error saving mapel to Supabase:', error);
        throw error;
      }
      db.updateSupabaseSyncTime();
    }
  },
  addMapel: async (item: Omit<MataPelajaran, 'id'>): Promise<MataPelajaran> => {
    const newItem: MataPelajaran = { ...item, id: 'm_' + Date.now() };
    cache.mapel.push(newItem);
    const supabase = getSupabaseInstance();
    if (supabase) {
      const { error } = await supabase.from('mata_pelajaran').insert([newItem]);
      if (error) {
        console.error('Error adding mapel to Supabase:', error);
        throw error;
      }
      db.updateSupabaseSyncTime();
    }
    return newItem;
  },
  updateMapel: async (item: MataPelajaran): Promise<void> => {
    const index = cache.mapel.findIndex(x => x.id === item.id);
    if (index !== -1) {
      cache.mapel[index] = item;
      const supabase = getSupabaseInstance();
      if (supabase) {
        const { error } = await supabase.from('mata_pelajaran').update(item).eq('id', item.id);
        if (error) {
          console.error('Error updating mapel in Supabase:', error);
          throw error;
        }
        db.updateSupabaseSyncTime();
      }
    }
  },
  deleteMapel: async (id: string): Promise<void> => {
    cache.mapel = cache.mapel.filter(x => x.id !== id);
    const supabase = getSupabaseInstance();
    if (supabase) {
      const { error } = await supabase.from('mata_pelajaran').delete().eq('id', id);
      if (error) {
        console.error('Error deleting mapel from Supabase:', error);
        throw error;
      }
      db.updateSupabaseSyncTime();
    }
  },

  // Hissoh operations
  getHissoh: (): Hissoh[] => [...cache.hissoh],
  saveHissoh: async (data: Hissoh[]): Promise<void> => {
    cache.hissoh = data;
    const supabase = getSupabaseInstance();
    if (supabase) {
      const { error } = await supabase.from('hissoh').upsert(data, { onConflict: 'id' });
      if (error) {
        console.error('Error saving hissoh to Supabase:', error);
        throw error;
      }
      db.updateSupabaseSyncTime();
    }
  },
  addHissoh: async (item: Omit<Hissoh, 'id'>): Promise<Hissoh> => {
    const newItem: Hissoh = { ...item, id: 'h_' + Date.now() };
    cache.hissoh.push(newItem);
    const supabase = getSupabaseInstance();
    if (supabase) {
      const { error } = await supabase.from('hissoh').insert([newItem]);
      if (error) {
        console.error('Error adding hissoh to Supabase:', error);
        throw error;
      }
      db.updateSupabaseSyncTime();
    }
    return newItem;
  },
  updateHissoh: async (item: Hissoh): Promise<void> => {
    const index = cache.hissoh.findIndex(x => x.id === item.id);
    if (index !== -1) {
      cache.hissoh[index] = item;
      const supabase = getSupabaseInstance();
      if (supabase) {
        const { error } = await supabase.from('hissoh').update(item).eq('id', item.id);
        if (error) {
          console.error('Error updating hissoh in Supabase:', error);
          throw error;
        }
        db.updateSupabaseSyncTime();
      }
    }
  },
  deleteHissoh: async (id: string): Promise<void> => {
    cache.hissoh = cache.hissoh.filter(x => x.id !== id);
    const supabase = getSupabaseInstance();
    if (supabase) {
      const { error } = await supabase.from('hissoh').delete().eq('id', id);
      if (error) {
        console.error('Error deleting hissoh from Supabase:', error);
        throw error;
      }
      db.updateSupabaseSyncTime();
    }
  },

  // Jadwal operations
  getJadwal: (): Jadwal[] => [...cache.jadwal],
  saveJadwal: async (data: Jadwal[]): Promise<void> => {
    cache.jadwal = data;
    const supabase = getSupabaseInstance();
    if (supabase) {
      const { error } = await supabase.from('jadwal').upsert(data, { onConflict: 'id' });
      if (error) {
        console.error('Error saving jadwal to Supabase:', error);
        throw error;
      }
      db.updateSupabaseSyncTime();
    }
  },
  addJadwal: async (item: Omit<Jadwal, 'id'>): Promise<Jadwal> => {
    const newItem: Jadwal = { ...item, id: 'j_' + Date.now() };
    cache.jadwal.push(newItem);
    const supabase = getSupabaseInstance();
    if (supabase) {
      const { error } = await supabase.from('jadwal').insert([newItem]);
      if (error) {
        console.error('Error adding jadwal to Supabase:', error);
        throw error;
      }
      db.updateSupabaseSyncTime();
    }
    return newItem;
  },
  updateJadwal: async (item: Jadwal): Promise<void> => {
    const index = cache.jadwal.findIndex(x => x.id === item.id);
    if (index !== -1) {
      cache.jadwal[index] = item;
      const supabase = getSupabaseInstance();
      if (supabase) {
        const { error } = await supabase.from('jadwal').update(item).eq('id', item.id);
        if (error) {
          console.error('Error updating jadwal in Supabase:', error);
          throw error;
        }
        db.updateSupabaseSyncTime();
      }
    }
  },
  deleteJadwal: async (id: string): Promise<void> => {
    cache.jadwal = cache.jadwal.filter(x => x.id !== id);
    const supabase = getSupabaseInstance();
    if (supabase) {
      const { error } = await supabase.from('jadwal').delete().eq('id', id);
      if (error) {
        console.error('Error deleting jadwal from Supabase:', error);
        throw error;
      }
      db.updateSupabaseSyncTime();
    }
  },

  // Absensi operations
  getAbsensi: (): Absensi[] => [...cache.absensi],
  saveAbsensi: async (data: Absensi[]): Promise<void> => {
    cache.absensi = data;
    const supabase = getSupabaseInstance();
    if (supabase) {
      const { error } = await supabase.from('absensi').upsert(data, { onConflict: 'id' });
      if (error) {
        console.error('Error saving absensi to Supabase:', error);
        throw error;
      }
      db.updateSupabaseSyncTime();
    }
  },
  saveBatchAbsensi: async (batch: Absensi[]): Promise<void> => {
    batch.forEach(newItem => {
      const idx = cache.absensi.findIndex(
        x =>
          x.tanggal === newItem.tanggal &&
          x.kelas_id === newItem.kelas_id &&
          x.mapel_id === newItem.mapel_id &&
          x.hissoh_id === newItem.hissoh_id &&
          x.santri_id === newItem.santri_id
      );
      if (idx !== -1) {
        cache.absensi[idx] = newItem;
      } else {
        cache.absensi.push(newItem);
      }
    });
    const supabase = getSupabaseInstance();
    if (supabase) {
      const { error } = await supabase.from('absensi').upsert(batch, { onConflict: 'id' });
      if (error) {
        console.error('Error saving batch absensi to Supabase:', error);
        throw error;
      }
      db.updateSupabaseSyncTime();
    }
  },
  deleteAbsensiForSession: async (tanggal: string, kelas_id: string, mapel_id: string, hissoh_id: string): Promise<void> => {
    cache.absensi = cache.absensi.filter(
      x => !(x.tanggal === tanggal && x.kelas_id === kelas_id && x.mapel_id === mapel_id && x.hissoh_id === hissoh_id)
    );
    const supabase = getSupabaseInstance();
    if (supabase) {
      const { error } = await supabase
        .from('absensi')
        .delete()
        .eq('tanggal', tanggal)
        .eq('kelas_id', kelas_id)
        .eq('mapel_id', mapel_id)
        .eq('hissoh_id', hissoh_id);
      if (error) {
        console.error('Error deleting absensi session from Supabase:', error);
        throw error;
      }
      db.updateSupabaseSyncTime();
    }
  },

  // Semester operations
  getSemester: (): Semester[] => [...cache.semester],
  saveSemester: async (data: Semester[]): Promise<void> => {
    cache.semester = data;
    const supabase = getSupabaseInstance();
    if (supabase) {
      const { error } = await supabase.from('semester').upsert(data, { onConflict: 'id' });
      if (error) {
        console.error('Error saving semester to Supabase:', error);
        throw error;
      }
      db.updateSupabaseSyncTime();
    }
  },
  setSemesterAktif: async (id: string): Promise<void> => {
    const updated = cache.semester.map(x => ({ ...x, aktif: x.id === id }));
    await db.saveSemester(updated);
  },

  // Tahun Ajaran operations
  getTahunAjaran: (): TahunAjaran[] => [...cache.tahunAjaran],
  saveTahunAjaran: async (data: TahunAjaran[]): Promise<void> => {
    cache.tahunAjaran = data;
    const supabase = getSupabaseInstance();
    if (supabase) {
      const { error } = await supabase.from('tahun_ajaran').upsert(data, { onConflict: 'id' });
      if (error) {
        console.error('Error saving tahun_ajaran to Supabase:', error);
        throw error;
      }
      db.updateSupabaseSyncTime();
    }
  },
  setTahunAjaranAktif: async (id: string): Promise<void> => {
    const updated = cache.tahunAjaran.map(x => ({ ...x, aktif: x.id === id }));
    await db.saveTahunAjaran(updated);
  },

  // Supabase Config
  getSupabaseConfig: (): SupabaseConfig => {
    const localConfig = getLocal<SupabaseConfig>(KEYS.SUPABASE_CONFIG, seedSupabase);
    const envUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim().replace(/^"|"$/g, '').trim();
    const envKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim().replace(/^"|"$/g, '').trim();
    
    return {
      ...localConfig,
      url: envUrl || localConfig.url,
      anonKey: envKey || localConfig.anonKey,
    };
  },
  saveSupabaseConfig: (config: SupabaseConfig): void => {
    const envUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim().replace(/^"|"$/g, '').trim();
    const envKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim().replace(/^"|"$/g, '').trim();
    
    const configToSave = {
      ...config,
      url: envUrl ? '' : config.url,
      anonKey: envKey ? '' : config.anonKey,
    };
    setLocal(KEYS.SUPABASE_CONFIG, configToSave);
  },
  updateSupabaseSyncTime: (): void => {
    const config = db.getSupabaseConfig();
    config.lastSync = new Date().toLocaleString('id-ID', { hour12: false });
    db.saveSupabaseConfig(config);
  },

  // Last Saved Page State
  getLastSavedPage: (): string => localStorage.getItem(KEYS.ACTIVE_PAGE_SAVE) || 'dashboard',
  saveLastPage: (page: string): void => localStorage.setItem(KEYS.ACTIVE_PAGE_SAVE, page),

  // Supabase Integration Functions
  testSupabase: async (_url: string, _anonKey: string): Promise<{ success: boolean; latency: number; error?: string }> => {
    try {
      const supabase = getSupabaseInstance();
      if (!supabase) {
        return { success: false, latency: 0, error: 'Supabase belum dikonfigurasi (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).' };
      }

      const startTime = Date.now();
      const { error } = await supabase.from('kelas').select('id').limit(1);
      const latency = Date.now() - startTime;

      if (error) {
        return { success: false, latency, error: error.message };
      }
      return { success: true, latency };
    } catch (e: any) {
      return { success: false, latency: 0, error: e?.message || 'Gagal terhubung ke Supabase.' };
    }
  },

  syncAllFromSupabase: async (): Promise<{ success: boolean; message: string }> => {
    const config = db.getSupabaseConfig();
    if (!config.url || !config.anonKey) return { success: false, message: 'Supabase URL atau Anon Key kosong' };

    try {
      const supabase = getSupabaseInstance();
      if (!supabase) return { success: false, message: 'Gagal terhubung ke Supabase' };

      const tables = ['kelas', 'santri', 'mata_pelajaran', 'hissoh', 'jadwal', 'absensi', 'semester', 'tahun_ajaran'];
      const results: { [key: string]: any[] | null } = {};

      for (const table of tables) {
        const { data, error } = await supabase.from(table).select('*');
        if (!error && data) {
          results[table] = data;
        }
      }

      if (Object.keys(results).length === 0) {
        return { success: false, message: 'Gagal mengambil data dari tabel Supabase. Pastikan tabel sudah dibuat.' };
      }

      // Update cache with retrieved data
      if (results['kelas']) cache.kelas = results['kelas'];
      if (results['santri']) cache.santri = results['santri'];
      if (results['mata_pelajaran']) cache.mapel = results['mata_pelajaran'];
      if (results['hissoh']) cache.hissoh = results['hissoh'];
      if (results['jadwal']) cache.jadwal = results['jadwal'];
      if (results['absensi']) cache.absensi = results['absensi'];
      if (results['semester']) cache.semester = results['semester'];
      if (results['tahun_ajaran']) cache.tahunAjaran = results['tahun_ajaran'];

      db.updateSupabaseSyncTime();
      return { success: true, message: `Sukses sinkronisasi ${Object.keys(results).length} tabel.` };
    } catch (e: any) {
      return { success: false, message: e.message || 'Terjadi kesalahan sinkronisasi' };
    }
  },

  syncAllToSupabase: async (): Promise<{ success: boolean; message: string }> => {
    const config = db.getSupabaseConfig();
    if (!config.url || !config.anonKey) return { success: false, message: 'Supabase URL atau Anon Key kosong' };

    try {
      const supabase = getSupabaseInstance();
      if (!supabase) return { success: false, message: 'Gagal terhubung ke Supabase' };

      const syncList = [
        { name: 'kelas', data: cache.kelas },
        { name: 'santri', data: cache.santri },
        { name: 'mata_pelajaran', data: cache.mapel },
        { name: 'hissoh', data: cache.hissoh },
        { name: 'jadwal', data: cache.jadwal },
        { name: 'absensi', data: cache.absensi },
        { name: 'semester', data: cache.semester },
        { name: 'tahun_ajaran', data: cache.tahunAjaran },
      ];

      let successCount = 0;
      for (const item of syncList) {
        if (item.data.length > 0) {
          const { error } = await supabase.from(item.name).upsert(item.data as any, { onConflict: 'id' });
          if (!error) successCount++;
        } else {
          successCount++;
        }
      }

      if (successCount > 0) {
        db.updateSupabaseSyncTime();
        return { 
          success: true, 
          message: `Sukses mengunggah ${successCount} dari ${syncList.length} tabel ke Supabase.` 
        };
      }
      return { success: false, message: 'Gagal mengunggah data. Pastikan RLS / skema tabel di Supabase sudah sesuai.' };
    } catch (e: any) {
      return { success: false, message: e.message || 'Terjadi kesalahan sinkronisasi' };
    }
  }
};
