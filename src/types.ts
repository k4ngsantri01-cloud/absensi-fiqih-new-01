/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Kelas {
  id: string;
  nama: string;
  tingkat: string;
}

export interface Santri {
  id: string;
  no: number;
  nama: string;
  kelas_id: string;
  jk: 'L' | 'P';
  status: 'Aktif' | 'Keluar';
}

export interface MataPelajaran {
  id: string;
  nama: string;
  kode: string;
}

export interface Hissoh {
  id: string;
  nomor: number; // 1, 2, 3, etc.
  jam_mulai: string; // e.g. "07:00"
  jam_selesai: string; // e.g. "07:45"
  jam_mulai_istiwa?: string; // e.g. "06:30"
  jam_selesai_istiwa?: string; // e.g. "07:15"
}

export interface Jadwal {
  id: string;
  hari: string; // e.g. "Senin", "Selasa", etc.
  kelas_id: string;
  mapel_id: string;
  hissoh_id: string;
}

export interface Absensi {
  id: string;
  tanggal: string; // YYYY-MM-DD
  hari: string;
  kelas_id: string;
  mapel_id: string;
  hissoh_id: string;
  santri_id: string;
  status: 'Hadir' | 'Izin' | 'Sakit' | 'Ghoib';
  jam_absen: string; // HH:mm:ss
}

export interface Semester {
  id: string;
  nama: string;
  aktif: boolean;
}

export interface TahunAjaran {
  id: string;
  nama: string;
  aktif: boolean;
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  connected: boolean;
  latency: number;
  lastSync: string;
  mode: 'online' | 'offline';
}

export type ActiveTab = 'dashboard' | 'jadwal' | 'presensi' | 'rekap' | 'santri' | 'setting';
