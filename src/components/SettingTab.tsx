/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Settings,
  Database,
  Calendar,
  Clock,
  BookOpen,
  GraduationCap,
  RefreshCw,
  Plus,
  Trash2,
  CheckCircle,
  ToggleLeft,
  ToggleRight,
  AlertTriangle,
  Play,
  ArrowRightLeft,
  X,
  Edit2,
  Copy,
  Check
} from 'lucide-react';
import { Kelas, MataPelajaran, Hissoh, Jadwal, Semester, TahunAjaran, SupabaseConfig } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { SUPABASE_SCHEMA_SQL } from '../lib/schemaSql';

interface SettingTabProps {
  kelas: Kelas[];
  mapel: MataPelajaran[];
  hissoh: Hissoh[];
  jadwal: Jadwal[];
  semesters: Semester[];
  tahunAjarans: TahunAjaran[];
  supabaseConfig: SupabaseConfig;
  onUpdateKelas: (data: Kelas[]) => void;
  onUpdateMapel: (data: MataPelajaran[]) => void;
  onUpdateHissoh: (data: Hissoh[]) => void;
  onUpdateJadwal: (data: Jadwal[]) => void;
  onUpdateSemesters: (data: Semester[]) => void;
  onUpdateTahunAjarans: (data: TahunAjaran[]) => void;
  onUpdateSupabaseConfig: (config: SupabaseConfig) => void;
  onTestSupabase: (url: string, key: string) => Promise<{ success: boolean; latency: number; error?: string }>;
  onPushSupabase: () => Promise<{ success: boolean; message: string }>;
  onPullSupabase: () => Promise<{ success: boolean; message: string }>;
  onShowToast: (text: string, type: 'success' | 'error' | 'info') => void;
  totalSantri: number;
  totalAbsensi: number;
}

export default function SettingTab({
  kelas,
  mapel,
  hissoh,
  jadwal,
  semesters,
  tahunAjarans,
  supabaseConfig,
  onUpdateKelas,
  onUpdateMapel,
  onUpdateHissoh,
  onUpdateJadwal,
  onUpdateSemesters,
  onUpdateTahunAjarans,
  onUpdateSupabaseConfig,
  onTestSupabase,
  onPushSupabase,
  onPullSupabase,
  onShowToast,
  totalSantri,
  totalAbsensi,
}: SettingTabProps) {
  // Navigation for settings sub-categories
  type SubSetting = 'supabase' | 'jadwal' | 'hissoh' | 'kelas' | 'mapel' | 'semester';
  const [activeSubTab, setActiveSubTab] = useState<SubSetting>('supabase');

  // Supabase states
  const envUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim().replace(/^"|"$/g, '').trim();
  const envKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim().replace(/^"|"$/g, '').trim();
  const isEnvConfigured = !!(envUrl && envKey);

  const [dbMode, setDbMode] = useState<'online' | 'offline'>(supabaseConfig.mode);
  const [isTestingConn, setIsTestingConn] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [showPullConfirm, setShowPullConfirm] = useState(false);
  const [showSqlGuide, setShowSqlGuide] = useState(false);

  // Form helpers
  const [newKelasNama, setNewKelasNama] = useState('');
  const [newKelasTingkat, setNewKelasTingkat] = useState('MTs');

  const [newMapelNama, setNewMapelNama] = useState('');
  const [newMapelKode, setNewMapelKode] = useState('');

  const [newHissohNo, setNewHissohNo] = useState<number>(() => {
    return hissoh.length > 0 ? Math.max(...hissoh.map(h => h.nomor)) + 1 : 1;
  });
  const [newHissohMulai, setNewHissohMulai] = useState('07:00');
  const [newHissohSelesai, setNewHissohSelesai] = useState('07:45');
  const [newHissohMulaiIstiwa, setNewHissohMulaiIstiwa] = useState('06:30');
  const [newHissohSelesaiIstiwa, setNewHissohSelesaiIstiwa] = useState('07:15');

  // Jadwal creator fields
  const [newJadwalHari, setNewJadwalHari] = useState('Senin');
  const [newJadwalHissohId, setNewJadwalHissohId] = useState(hissoh[0]?.id || '');
  const [newJadwalKelasId, setNewJadwalKelasId] = useState(kelas[0]?.id || '');
  const [newJadwalMapelId, setNewJadwalMapelId] = useState(mapel[0]?.id || '');

  // Term additions
  const [newSemesterNama, setNewSemesterNama] = useState('');
  const [newTahunAjaranNama, setNewTahunAjaranNama] = useState('');

  // Save Supabase credentials / mode
  const handleSaveSupabase = async () => {
    const activeUrl = envUrl || supabaseConfig.url;
    const activeKey = envKey || supabaseConfig.anonKey;
    const updatedConfig: SupabaseConfig = {
      ...supabaseConfig,
      url: activeUrl,
      anonKey: activeKey,
      mode: dbMode,
    };
    onUpdateSupabaseConfig(updatedConfig);
    onShowToast('Mode Sinkronisasi berhasil disimpan', 'success');
  };

  // Copy SQL script to clipboard helper
  const handleCopySql = () => {
    try {
      navigator.clipboard.writeText(SUPABASE_SCHEMA_SQL);
      setCopiedSql(true);
      onShowToast('Skema SQL database Supabase berhasil disalin!', 'success');
      setTimeout(() => setCopiedSql(false), 2500);
    } catch (e) {
      onShowToast('Gagal menyalin otomatis, silakan salin teks secara manual', 'error');
    }
  };

  // Test Supabase connection
  const handleTestSupabase = async () => {
    const activeUrl = envUrl || supabaseConfig.url;
    const activeKey = envKey || supabaseConfig.anonKey;

    if (!activeUrl || !activeKey) {
      onShowToast('Konfigurasi URL dan Anon Key Supabase di file .env tidak ditemukan', 'error');
      return;
    }
    setIsTestingConn(true);
    onShowToast('Sedang mengetes koneksi Supabase...', 'info');

    const result = await onTestSupabase(activeUrl, activeKey);
    setIsTestingConn(false);

    if (result.success) {
      const updatedConfig: SupabaseConfig = {
        ...supabaseConfig,
        url: activeUrl,
        anonKey: activeKey,
        connected: true,
        latency: result.latency,
        mode: 'online',
      };
      onUpdateSupabaseConfig(updatedConfig);
      onShowToast(`Koneksi Sukses! Latency: ${result.latency}ms`, 'success');
    } else {
      const updatedConfig: SupabaseConfig = {
        ...supabaseConfig,
        connected: false,
        latency: 0,
        mode: 'offline',
      };
      onUpdateSupabaseConfig(updatedConfig);
      onShowToast(`Koneksi Gagal: ${result.error || 'Server error'}`, 'error');
    }
  };

  // Pull data from Supabase
  const handlePullSupabase = () => {
    setShowPullConfirm(true);
  };

  const executePullSupabase = async () => {
    setShowPullConfirm(false);
    setIsSyncing(true);
    onShowToast('Mengunduh database dari Supabase...', 'info');
    const result = await onPullSupabase();
    setIsSyncing(false);
    if (result.success) {
      onShowToast(result.message, 'success');
    } else {
      onShowToast(result.message, 'error');
    }
  };

  // Push data to Supabase
  const handlePushSupabase = async () => {
    setIsSyncing(true);
    onShowToast('Mengunggah database lokal ke Supabase...', 'info');
    const result = await onPushSupabase();
    setIsSyncing(false);
    if (result.success) {
      onShowToast(result.message, 'success');
    } else {
      onShowToast(result.message, 'error');
    }
  };

  // CRUD handlers - KELAS
  const handleAddKelas = () => {
    if (!newKelasNama.trim() || !newKelasTingkat.trim()) {
      onShowToast('Isi nama kelas dan tingkat', 'error');
      return;
    }
    const newK = { id: 'k_' + Date.now(), nama: newKelasNama.trim(), tingkat: newKelasTingkat };
    onUpdateKelas([...kelas, newK]);
    setNewKelasNama('');
    onShowToast('Kelas baru berhasil ditambahkan', 'success');
  };

  const handleDeleteKelas = (id: string) => {
    const updated = kelas.filter(k => k.id !== id);
    onUpdateKelas(updated);
    onShowToast('Kelas berhasil dihapus', 'success');
  };

  // CRUD handlers - MAPEL
  const handleAddMapel = () => {
    if (!newMapelNama.trim() || !newMapelKode.trim()) {
      onShowToast('Isi nama dan kode mapel', 'error');
      return;
    }
    const newM = { id: 'm_' + Date.now(), nama: newMapelNama.trim(), kode: newMapelKode.trim().toUpperCase() };
    onUpdateMapel([...mapel, newM]);
    setNewMapelNama('');
    setNewMapelKode('');
    onShowToast('Mata Pelajaran berhasil ditambahkan', 'success');
  };

  const handleDeleteMapel = (id: string) => {
    const updated = mapel.filter(m => m.id !== id);
    onUpdateMapel(updated);
    onShowToast('Mata Pelajaran berhasil dihapus', 'success');
  };

  // CRUD handlers - HISSOH & JAM
  const handleAddHissoh = () => {
    if (!newHissohNo || !newHissohMulai || !newHissohSelesai || !newHissohMulaiIstiwa || !newHissohSelesaiIstiwa) {
      onShowToast('Lengkapi nomor, jam mulai, dan selesai untuk WIB & ISTIWA\'', 'error');
      return;
    }
    // Check if hissoh nomor exists
    if (hissoh.some(h => h.nomor === newHissohNo)) {
      onShowToast(`Nomor Hissoh ${newHissohNo} sudah ada`, 'error');
      return;
    }
    const newH: Hissoh = {
      id: 'h_' + Date.now(),
      nomor: newHissohNo,
      jam_mulai: newHissohMulai,
      jam_selesai: newHissohSelesai,
      jam_mulai_istiwa: newHissohMulaiIstiwa,
      jam_selesai_istiwa: newHissohSelesaiIstiwa,
    };
    onUpdateHissoh([...hissoh, newH].sort((a, b) => a.nomor - b.nomor));
    setNewHissohNo(newHissohNo + 1);
    onShowToast('Sesi Hissoh berhasil ditambahkan', 'success');
  };

  const handleDeleteHissoh = (id: string) => {
    const updated = hissoh.filter(h => h.id !== id);
    onUpdateHissoh(updated);
    onShowToast('Sesi Hissoh berhasil dihapus', 'success');
  };

  // CRUD handlers - JADWAL MATRIX
  const handleAddJadwal = () => {
    const hId = newJadwalHissohId || hissoh[0]?.id;
    const kId = newJadwalKelasId || kelas[0]?.id;
    const mId = newJadwalMapelId || mapel[0]?.id;

    if (!hId || !kId || !mId) {
      onShowToast('Silakan tambahkan data Hissoh, Kelas, dan Mapel terlebih dahulu', 'error');
      return;
    }

    // Check if duplicate exists for Day + Hissoh
    const duplicate = jadwal.find(j => j.hari === newJadwalHari && j.hissoh_id === hId && j.kelas_id === kId);
    if (duplicate) {
      onShowToast(`Jadwal di hari ${newJadwalHari} pada Hissoh ini untuk kelas tersebut sudah terisi`, 'error');
      return;
    }

    const newJ = {
      id: 'j_' + Date.now(),
      hari: newJadwalHari,
      hissoh_id: hId,
      kelas_id: kId,
      mapel_id: mId,
    };
    onUpdateJadwal([...jadwal, newJ]);
    onShowToast('Jadwal Pelajaran berhasil ditambahkan', 'success');
  };

  const handleDeleteJadwal = (id: string) => {
    const updated = jadwal.filter(j => j.id !== id);
    onUpdateJadwal(updated);
    onShowToast('Jadwal berhasil dihapus', 'success');
  };

  // CRUD handlers - TERMS (Semester & Tahun Ajaran)
  const handleToggleSemester = (id: string) => {
    const updated = semesters.map(s => ({ ...s, aktif: s.id === id }));
    onUpdateSemesters(updated);
    onShowToast('Semester aktif berhasil diubah', 'success');
  };

  const handleToggleTahunAjaran = (id: string) => {
    const updated = tahunAjarans.map(t => ({ ...t, aktif: t.id === id }));
    onUpdateTahunAjarans(updated);
    onShowToast('Tahun Ajaran aktif berhasil diubah', 'success');
  };

  const handleAddSemester = () => {
    if (!newSemesterNama.trim()) return;
    const newS: Semester = { id: 's_' + Date.now(), nama: newSemesterNama.trim(), aktif: false };
    onUpdateSemesters([...semesters, newS]);
    setNewSemesterNama('');
    onShowToast('Semester/Cawu berhasil ditambahkan', 'success');
  };

  const handleAddTahunAjaran = () => {
    if (!newTahunAjaranNama.trim()) return;
    const newT: TahunAjaran = { id: 't_' + Date.now(), nama: newTahunAjaranNama.trim(), aktif: false };
    onUpdateTahunAjarans([...tahunAjarans, newT]);
    setNewTahunAjaranNama('');
    onShowToast('Tahun Ajaran baru berhasil ditambahkan', 'success');
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {/* Left Menu Sidebar Selector */}
      <div className="md:col-span-1 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl shadow-xs space-y-1.5 h-fit">
        <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-3 mb-3">Kategori Setting</h3>

        {[
          { id: 'supabase', label: 'Status Supabase', icon: <Database className="w-4 h-4" /> },
          { id: 'jadwal', label: 'Jadwal Pelajaran', icon: <Calendar className="w-4 h-4" /> },
          { id: 'hissoh', label: 'Hissoh & Jam', icon: <Clock className="w-4 h-4" /> },
          { id: 'kelas', label: 'Kelas & Tingkat', icon: <GraduationCap className="w-4 h-4" /> },
          { id: 'mapel', label: 'Mata Pelajaran', icon: <BookOpen className="w-4 h-4" /> },
          { id: 'semester', label: 'Semester & Tahun', icon: <Settings className="w-4 h-4" /> },
        ].map(item => (
          <button
            key={item.id}
            onClick={() => setActiveSubTab(item.id as SubSetting)}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
              activeSubTab === item.id
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/10'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </div>

      {/* Right Content Panel */}
      <div className="md:col-span-3 space-y-4">
        {/* SUBTAB 1: SUPABASE CONFIGURATION */}
        {activeSubTab === 'supabase' && (
          <div className="space-y-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl shadow-xs space-y-5">
              <div className="space-y-1">
                <h3 className="text-base font-bold font-display text-slate-800 dark:text-white flex items-center gap-1.5">
                  <Database className="w-5 h-5 text-emerald-600" />
                  Integrasi Database Supabase
                </h3>
                <p className="text-xs text-slate-500">
                  Koneksi terintegrasi otomatis secara aman menggunakan kredensial dari file Environment Variables (.env).
                </p>
              </div>

              {/* Connection Status Banner (Green if connected, Red if not) */}
              <div className={`p-5 rounded-2xl border transition-all ${
                supabaseConfig.connected 
                  ? 'bg-emerald-500/5 dark:bg-emerald-500/10 border-emerald-500/20' 
                  : 'bg-rose-500/5 dark:bg-rose-500/10 border-rose-500/20'
              }`}>
                <div className="flex items-start gap-4">
                  <div className="mt-1 relative flex shrink-0">
                    <span className={`w-3.5 h-3.5 rounded-full ${supabaseConfig.connected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                  </div>
                  <div className="space-y-1">
                    <h4 className={`text-sm font-bold uppercase tracking-wider ${supabaseConfig.connected ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>
                      {supabaseConfig.connected ? 'Koneksi Aktif (Terhubung)' : 'Koneksi Terputus (Offline)'}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      {supabaseConfig.connected 
                        ? `Sistem berhasil terhubung ke database cloud Supabase Anda dengan latency ${supabaseConfig.latency || 0} ms.` 
                        : 'Sistem tidak dapat terhubung ke database cloud Supabase. Harap periksa nilai URL dan Anon Key di file .env Anda.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Supabase Status Indicators */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800 text-center">
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Status</p>
                  <div className="flex items-center justify-center gap-1.5 mt-1">
                    <span className={`w-2 h-2 rounded-full ${supabaseConfig.connected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                    <span className={`text-xs font-bold uppercase ${supabaseConfig.connected ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                      {supabaseConfig.connected ? 'Online' : 'Offline'}
                    </span>
                  </div>
                </div>

                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Latency</p>
                  <p className="text-sm font-black text-slate-800 dark:text-white mt-1">
                    {supabaseConfig.connected ? `${supabaseConfig.latency} ms` : '-'}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Jumlah Data</p>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-1.5">
                    {totalSantri} Santri / {totalAbsensi} Absensi
                  </p>
                </div>

                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Last Sync</p>
                  <p className="text-[11px] font-mono text-slate-500 dark:text-slate-300 mt-1.5">
                    {supabaseConfig.lastSync || '-'}
                  </p>
                </div>
              </div>

              {/* Configuration Info & Manual Sync Actions */}
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Konfigurasi .env</span>
                    {isEnvConfigured ? (
                      <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded font-bold">TERKONEKSI ENV</span>
                    ) : (
                      <span className="text-[10px] bg-rose-500/10 text-rose-600 dark:text-rose-400 px-2 py-0.5 rounded font-bold">BELUM DIATUR</span>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Supabase URL</span>
                      {isEnvConfigured ? (
                        <code className="text-[11px] font-mono text-slate-700 dark:text-slate-300 break-all bg-white dark:bg-slate-900 px-2 py-1 rounded border border-slate-100 dark:border-slate-800 block mt-0.5">
                          {envUrl}
                        </code>
                      ) : (
                        <span className="text-xs text-rose-500 italic font-semibold block mt-0.5">Tidak terdefinisi di file .env</span>
                      )}
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Supabase Anon Key</span>
                      {isEnvConfigured ? (
                        <code className="text-[11px] font-mono text-slate-700 dark:text-slate-300 break-all bg-white dark:bg-slate-900 px-2 py-1 rounded border border-slate-100 dark:border-slate-800 block mt-0.5">
                          {envKey.substring(0, 15)}...[TERLINDUNGI]
                        </code>
                      ) : (
                        <span className="text-xs text-rose-500 italic font-semibold block mt-0.5">Tidak terdefinisi di file .env</span>
                      )}
                    </div>
                  </div>

                  {!isEnvConfigured && (
                    <div className="mt-2 text-xs text-slate-500 bg-amber-50 dark:bg-amber-950/20 border border-amber-500/10 p-3 rounded-xl space-y-1.5">
                      <p className="font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-1">
                        <AlertTriangle className="w-4 h-4" /> Hubungkan via Environment Variable
                      </p>
                      <p className="leading-relaxed">
                        Definisikan variabel berikut pada file <code className="bg-slate-150 dark:bg-slate-800 px-1 rounded font-mono text-[11px]">.env</code> di root aplikasi Anda:
                      </p>
                      <pre className="p-2 bg-slate-900 text-slate-200 rounded text-[10px] font-mono leading-normal overflow-x-auto">
                        {`VITE_SUPABASE_URL="https://your-project.supabase.co"\nVITE_SUPABASE_ANON_KEY="your-anon-public-key"`}
                      </pre>
                    </div>
                  )}
                </div>

                <div className="flex gap-2.5 pt-1">
                  <button
                    onClick={handleTestSupabase}
                    disabled={isTestingConn}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl border border-slate-200/50 dark:border-slate-700 transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isTestingConn ? 'animate-spin' : ''}`} />
                    {isTestingConn ? 'Menghubungkan...' : 'Tes Koneksi Sekarang'}
                  </button>
                </div>
              </div>

              {/* Sync manual actions */}
              {supabaseConfig.url && supabaseConfig.anonKey && (
                <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-3">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Aksi Sinkronisasi Manual</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {/* Push data to supabase */}
                    <button
                      onClick={handlePushSupabase}
                      disabled={isSyncing}
                      className="p-3 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/20 dark:hover:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-500/10 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <ArrowRightLeft className="w-4 h-4 rotate-90" />
                      Upload ke Supabase (Push)
                    </button>

                    {/* Pull data from supabase */}
                    <button
                      onClick={handlePullSupabase}
                      disabled={isSyncing}
                      className="p-3 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/20 dark:hover:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-500/10 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Download dari Supabase (Pull)
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* INTEGRATION GUIDE SECTION */}
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
              <button
                onClick={() => setShowSqlGuide(!showSqlGuide)}
                className="w-full p-5 flex items-center justify-between text-left cursor-pointer outline-none hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl">
                    <Database className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 dark:text-white">Panduan Setup Database Supabase</h4>
                    <p className="text-[10px] text-slate-400">Ikuti 5 langkah mudah berikut agar koneksi lancar</p>
                  </div>
                </div>
                <div className="text-slate-400">
                  {showSqlGuide ? (
                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">Sembunyikan ↑</span>
                  ) : (
                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">Tampilkan ↓</span>
                  )}
                </div>
              </button>

              <AnimatePresence>
                {showSqlGuide && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="border-t border-slate-100 dark:border-slate-800"
                  >
                    <div className="p-5 space-y-4 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      <div className="space-y-3">
                        <div className="flex gap-2">
                          <span className="font-bold text-emerald-600 shrink-0">1.</span>
                          <p>
                            Buat akun gratis di <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-emerald-600 hover:underline font-bold">Supabase</a> dan buat sebuah project baru.
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <span className="font-bold text-emerald-600 shrink-0">2.</span>
                          <p>
                            Buka menu <strong>SQL Editor</strong> di menu sidebar kiri di dashboard project Supabase Anda.
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <span className="font-bold text-emerald-600 shrink-0">3.</span>
                          <div>
                            <p className="mb-2">
                              Klik tombol <strong>"New Query"</strong>, salin (copy) seluruh script SQL Schema di bawah ini, tempelkan (paste) di SQL Editor Supabase tersebut, lalu klik tombol <strong>"Run"</strong> di kanan bawah.
                            </p>
                            <button
                              onClick={handleCopySql}
                              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-[11px] transition-colors flex items-center gap-1 cursor-pointer shadow-xs"
                            >
                              {copiedSql ? (
                                <>
                                  <Check className="w-3.5 h-3.5" />
                                  Tersalin!
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5" />
                                  Salin SQL Schema
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <span className="font-bold text-emerald-600 shrink-0">4.</span>
                          <p>
                            Masuk ke menu <strong>Project Settings (ikon gir) → API</strong> di Supabase Anda. Salin <strong>Project URL</strong> dan <strong>anon (public) API Key</strong>.
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <span className="font-bold text-emerald-600 shrink-0">5.</span>
                          <p>
                            Tempelkan kredensial tersebut di kolom formulir di atas, klik <strong>Simpan Kredensial</strong>, lalu klik <strong>Tes Koneksi</strong>. Jika sukses, klik tombol <strong>Upload ke Supabase (Push)</strong> di atas untuk sinkronisasi data pertama kali!
                          </p>
                        </div>
                      </div>

                      {/* SQL PREVIEW WINDOW */}
                      <div className="mt-4 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Preview Skema SQL (SUPABASE_SCHEMA.sql)</span>
                          <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-500">PostgreSQL</span>
                        </div>
                        <div className="relative bg-slate-950 dark:bg-black/80 rounded-xl p-4 border border-slate-800/80 max-h-60 overflow-y-auto font-mono text-[10px] text-emerald-400 leading-normal select-all">
                          {SUPABASE_SCHEMA_SQL}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* PULL CONFIRMATION OVERLAY MODAL */}
            <AnimatePresence>
              {showPullConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="p-3 bg-rose-500/10 text-rose-600 rounded-2xl w-fit">
                        <AlertTriangle className="w-6 h-6 animate-pulse" />
                      </div>
                      <button
                        onClick={() => setShowPullConfirm(false)}
                        className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg bg-slate-50 dark:bg-slate-850 cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-1.5">
                      <h3 className="text-base font-bold font-display text-slate-800 dark:text-white">
                        Konfirmasi Unduh Database
                      </h3>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Perhatian! Tindakan <strong>Download dari Supabase (Pull)</strong> akan <strong>MENIMPA DAN MENGHAPUS</strong> semua data lokal Anda saat ini.
                      </p>
                      <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold">
                        Jika database cloud Supabase Anda masih kosong, tindakan ini akan mengosongkan semua data lokal Anda!
                      </p>
                    </div>

                    <div className="flex gap-2.5 pt-2">
                      <button
                        onClick={() => setShowPullConfirm(false)}
                        className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
                      >
                        Batal
                      </button>
                      <button
                        onClick={executePullSupabase}
                        className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white transition-colors cursor-pointer shadow-md shadow-rose-600/10"
                      >
                        Ya, Timpa Data Lokal
                      </button>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* SUBTAB 2: JADWAL MATRIX BUILDER */}
        {activeSubTab === 'jadwal' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl shadow-xs space-y-5">
            <div className="space-y-1">
              <h3 className="text-base font-bold font-display text-slate-800 dark:text-white flex items-center gap-1.5">
                <Calendar className="w-5 h-5 text-emerald-600" />
                Matriks Jadwal Mengajar Guru
              </h3>
              <p className="text-xs text-slate-500">
                Atur jadwal pelajaran berdasarkan Hari, Hissoh (sesi slot), Kelas, dan Mata Pelajaran.
              </p>
            </div>

            {/* Quick schedule creator form */}
            <div className="bg-slate-50 dark:bg-slate-800/20 border border-slate-100 dark:border-slate-800 p-4 rounded-xl space-y-3.5">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">Tambah Entri Jadwal Mengajar</h4>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* Hari */}
                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase">Hari</label>
                  <select
                    value={newJadwalHari}
                    onChange={e => setNewJadwalHari(e.target.value)}
                    className="w-full px-2.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold outline-none text-slate-800 dark:text-slate-100"
                  >
                    {['Sabtu', 'Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis'].map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                {/* Hissoh */}
                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase">Hissoh Slot</label>
                  <select
                    value={newJadwalHissohId}
                    onChange={e => setNewJadwalHissohId(e.target.value)}
                    className="w-full px-2.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold outline-none text-slate-800 dark:text-slate-100"
                  >
                    {hissoh.map(h => (
                      <option key={h.id} value={h.id}>Hissoh {h.nomor} ({h.jam_mulai} - {h.jam_selesai} WIB / {h.jam_mulai_istiwa || h.jam_mulai} - {h.jam_selesai_istiwa || h.jam_selesai} Istiwa)</option>
                    ))}
                  </select>
                </div>

                {/* Kelas */}
                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase">Kelas</label>
                  <select
                    value={newJadwalKelasId}
                    onChange={e => setNewJadwalKelasId(e.target.value)}
                    className="w-full px-2.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold outline-none text-slate-800 dark:text-slate-100"
                  >
                    {kelas.map(k => (
                      <option key={k.id} value={k.id}>{k.nama}</option>
                    ))}
                  </select>
                </div>

                {/* Mata Pelajaran */}
                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase">Mata Pelajaran</label>
                  <select
                    value={newJadwalMapelId}
                    onChange={e => setNewJadwalMapelId(e.target.value)}
                    className="w-full px-2.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold outline-none text-slate-800 dark:text-slate-100"
                  >
                    {mapel.map(m => (
                      <option key={m.id} value={m.id}>{m.nama}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                onClick={handleAddJadwal}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Tambahkan ke Matrix Jadwal
              </button>
            </div>

            {/* List entries of Jadwal */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Semua Matrix Jadwal Aktif ({jadwal.length})</h4>
              
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {jadwal.length === 0 ? (
                  <p className="text-xs text-slate-400 italic text-center py-6">Tidak ada jadwal terdaftar. Tambahkan jadwal di atas.</p>
                ) : (
                  [...jadwal]
                    .sort((a, b) => {
                      const hariOrder = ['Sabtu', 'Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];
                      const dayCompare = hariOrder.indexOf(a.hari) - hariOrder.indexOf(b.hari);
                      if (dayCompare !== 0) return dayCompare;
                      
                      const hissohA = hissoh.find(h => h.id === a.hissoh_id)?.nomor || 0;
                      const hissohB = hissoh.find(h => h.id === b.hissoh_id)?.nomor || 0;
                      return hissohA - hissohB;
                    })
                    .map(j => {
                      const hItem = hissoh.find(h => h.id === j.hissoh_id);
                      const kItem = kelas.find(k => k.id === j.kelas_id);
                      const mItem = mapel.find(m => m.id === j.mapel_id);

                      return (
                        <div
                          key={j.id}
                          className="bg-slate-50 dark:bg-slate-850 p-3 rounded-xl border border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-md mr-2">
                              {j.hari}
                            </span>
                            <span className="font-semibold text-slate-500 mr-2">
                              Hissoh {hItem ? String(hItem.nomor).padStart(2, '0') : '-'}
                            </span>
                            <strong className="text-slate-800 dark:text-white font-display">
                              {mItem?.nama}
                            </strong>
                            <span className="text-slate-400 mx-1.5">•</span>
                            <span className="text-slate-600 dark:text-slate-300">
                              Kelas: {kItem?.nama}
                            </span>
                          </div>

                          <button
                            onClick={() => handleDeleteJadwal(j.id)}
                            className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })
                )}
              </div>
            </div>
          </div>
        )}

        {/* SUBTAB 3: HISSOH & JAM SLOTS */}
        {activeSubTab === 'hissoh' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl shadow-xs space-y-5">
            <div className="space-y-1">
              <h3 className="text-base font-bold font-display text-slate-800 dark:text-white flex items-center gap-1.5">
                <Clock className="w-5 h-5 text-emerald-600" />
                Pengaturan Hissoh & Jam Sesi
              </h3>
              <p className="text-xs text-slate-500">
                Tentukan slot jam pelajaran yang digunakan saat absensi per hari.
              </p>
            </div>

            {/* Add new Hissoh slot form */}
            <div className="bg-slate-50 dark:bg-slate-800/20 border border-slate-100 dark:border-slate-800 p-4 rounded-xl space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 items-end">
                <div className="col-span-2 sm:col-span-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Nomor Hissoh</label>
                  <input
                    type="number"
                    value={newHissohNo}
                    onChange={e => setNewHissohNo(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold outline-none text-slate-800 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Mulai (WIB)</label>
                  <input
                    type="text"
                    placeholder="07:00"
                    value={newHissohMulai}
                    onChange={e => setNewHissohMulai(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold outline-none text-slate-800 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Selesai (WIB)</label>
                  <input
                    type="text"
                    placeholder="07:45"
                    value={newHissohSelesai}
                    onChange={e => setNewHissohSelesai(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold outline-none text-slate-800 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase block mb-1">Mulai (ISTIWA')</label>
                  <input
                    type="text"
                    placeholder="06:30"
                    value={newHissohMulaiIstiwa}
                    onChange={e => setNewHissohMulaiIstiwa(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-850 border border-emerald-500/20 dark:border-emerald-500/10 rounded-lg text-xs font-semibold outline-none text-slate-800 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase block mb-1">Selesai (ISTIWA')</label>
                  <input
                    type="text"
                    placeholder="07:15"
                    value={newHissohSelesaiIstiwa}
                    onChange={e => setNewHissohSelesaiIstiwa(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-850 border border-emerald-500/20 dark:border-emerald-500/10 rounded-lg text-xs font-semibold outline-none text-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleAddHissoh}
                  className="py-2.5 px-5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer w-full sm:w-auto whitespace-nowrap shadow-xs"
                >
                  Tambah Sesi Hissoh
                </button>
              </div>
            </div>

            {/* List hissoh slots */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Daftar Sesi Hissoh Pelajaran</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[250px] overflow-y-auto pr-1">
                {hissoh.map(h => (
                  <div
                    key={h.id}
                    className="bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800/80 p-3.5 rounded-xl flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black bg-slate-200 dark:bg-slate-800 px-2.5 py-1.5 rounded-lg text-slate-700 dark:text-slate-300">
                        Hissoh {h.nomor}
                      </span>
                      <div>
                        <div className="text-xs font-bold text-slate-800 dark:text-white font-mono leading-none">
                          {h.jam_mulai} - {h.jam_selesai} WIB
                        </div>
                        <div className="text-[10px] text-slate-400 font-medium font-mono mt-0.5">
                          {h.jam_mulai_istiwa || h.jam_mulai} - {h.jam_selesai_istiwa || h.jam_selesai} ISTIWA'
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteHissoh(h.id)}
                      className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SUBTAB 4: KELAS & TINGKAT CRUD */}
        {activeSubTab === 'kelas' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl shadow-xs space-y-5">
            <div className="space-y-1">
              <h3 className="text-base font-bold font-display text-slate-800 dark:text-white flex items-center gap-1.5">
                <GraduationCap className="w-5 h-5 text-emerald-600" />
                Pengaturan Kelas & Tingkat
              </h3>
              <p className="text-xs text-slate-500">
                Tambahkan daftar kelas (misalnya: 2 MTs A - 2 MTs G) sebagai wadah santri.
              </p>
            </div>

            {/* Add new class form */}
            <div className="bg-slate-50 dark:bg-slate-800/20 border border-slate-100 dark:border-slate-800 p-4 rounded-xl flex flex-col sm:flex-row items-end gap-3">
              <div className="flex-1 w-full sm:w-auto">
                <label className="text-[9px] font-bold text-slate-400 uppercase">Nama Kelas</label>
                <input
                  type="text"
                  placeholder="Contoh: 2 MTs A"
                  value={newKelasNama}
                  onChange={e => setNewKelasNama(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold outline-none text-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="w-full sm:w-36">
                <label className="text-[9px] font-bold text-slate-400 uppercase">Tingkat</label>
                <select
                  value={newKelasTingkat}
                  onChange={e => setNewKelasTingkat(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold outline-none text-slate-800 dark:text-slate-100"
                >
                  <option value="MTs">MTs (Mts)</option>
                  <option value="MA">MA (Aliyah)</option>
                  <option value="MI">MI (Ibtidaiyah)</option>
                </select>
              </div>

              <button
                onClick={handleAddKelas}
                className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer w-full sm:w-auto"
              >
                Tambah Kelas
              </button>
            </div>

            {/* List of classes */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Daftar Kelas Terdaftar ({kelas.length})</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[250px] overflow-y-auto pr-1">
                {kelas.map(k => (
                  <div
                    key={k.id}
                    className="bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800/80 p-3 rounded-xl flex items-center justify-between"
                  >
                    <div>
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded mr-2 uppercase">
                        {k.tingkat}
                      </span>
                      <strong className="text-xs font-bold text-slate-800 dark:text-white font-display">
                        {k.nama}
                      </strong>
                    </div>

                    <button
                      onClick={() => handleDeleteKelas(k.id)}
                      className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SUBTAB 5: MATA PELAJARAN CRUD */}
        {activeSubTab === 'mapel' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl shadow-xs space-y-5">
            <div className="space-y-1">
              <h3 className="text-base font-bold font-display text-slate-800 dark:text-white flex items-center gap-1.5">
                <BookOpen className="w-5 h-5 text-emerald-600" />
                Daftar Mata Pelajaran
              </h3>
              <p className="text-xs text-slate-500">
                Kelola subjek materi ajaran (seperti Fiqih, Ushul Fiqih, Aqidah Akhlak, dll.)
              </p>
            </div>

            {/* Add new Mapel form */}
            <div className="bg-slate-50 dark:bg-slate-800/20 border border-slate-100 dark:border-slate-800 p-4 rounded-xl flex flex-col sm:flex-row items-end gap-3">
              <div className="flex-1 w-full sm:w-auto">
                <label className="text-[9px] font-bold text-slate-400 uppercase">Nama Mapel</label>
                <input
                  type="text"
                  placeholder="Contoh: Fiqih"
                  value={newMapelNama}
                  onChange={e => setNewMapelNama(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold outline-none text-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="w-full sm:w-32">
                <label className="text-[9px] font-bold text-slate-400 uppercase">Kode Singkat</label>
                <input
                  type="text"
                  placeholder="Contoh: FIQ"
                  value={newMapelKode}
                  onChange={e => setNewMapelKode(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold outline-none text-slate-800 dark:text-slate-100"
                />
              </div>

              <button
                onClick={handleAddMapel}
                className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer w-full sm:w-auto"
              >
                Tambah Mapel
              </button>
            </div>

            {/* List of Mapels */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Daftar Mapel Terdaftar ({mapel.length})</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[250px] overflow-y-auto pr-1">
                {mapel.map(m => (
                  <div
                    key={m.id}
                    className="bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800/80 p-3.5 rounded-xl flex items-center justify-between"
                  >
                    <div>
                      <span className="text-xs font-black bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded-md mr-3 font-mono text-slate-600 dark:text-slate-300">
                        {m.kode}
                      </span>
                      <strong className="text-xs font-bold text-slate-800 dark:text-white font-display">
                        {m.nama}
                      </strong>
                    </div>

                    <button
                      onClick={() => handleDeleteMapel(m.id)}
                      className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SUBTAB 6: SEMESTER & TAHUN AJARAN TERMS */}
        {activeSubTab === 'semester' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl shadow-xs space-y-6">
            {/* Semester / Cawu Section */}
            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-base font-bold font-display text-slate-800 dark:text-white">
                  Pengaturan Semester (CAWU)
                </h3>
                <p className="text-xs text-slate-500">
                  Tentukan semester aktif yang tertera pada laporan harian dan dashboard.
                </p>
              </div>

              {/* Add form */}
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Contoh: Semester Ganjil (CAWU 1)"
                    value={newSemesterNama}
                    onChange={e => setNewSemesterNama(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold outline-none text-slate-800 dark:text-slate-100"
                  />
                </div>
                <button
                  onClick={handleAddSemester}
                  className="py-2 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200/50 dark:border-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                >
                  Tambah Semester
                </button>
              </div>

              {/* Semester items list */}
              <div className="space-y-2">
                {semesters.map(s => (
                  <div
                    key={s.id}
                    className="p-3 bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800 rounded-xl flex items-center justify-between text-xs"
                  >
                    <span className={`font-bold ${s.aktif ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400'}`}>
                      {s.nama}
                    </span>

                    <button
                      onClick={() => handleToggleSemester(s.id)}
                      className="p-1 cursor-pointer"
                    >
                      {s.aktif ? (
                        <ToggleRight className="w-9 h-6 text-emerald-600" />
                      ) : (
                        <ToggleLeft className="w-9 h-6 text-slate-400" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Tahun Ajaran Section */}
            <div className="space-y-4 border-t border-slate-100 dark:border-slate-800 pt-5">
              <div className="space-y-1">
                <h3 className="text-base font-bold font-display text-slate-800 dark:text-white">
                  Pengaturan Tahun Ajaran
                </h3>
                <p className="text-xs text-slate-500">
                  Tentukan tahun ajaran aktif yang sedang berjalan sekarang.
                </p>
              </div>

              {/* Add form */}
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Contoh: 2026/2027"
                    value={newTahunAjaranNama}
                    onChange={e => setNewTahunAjaranNama(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold outline-none text-slate-800 dark:text-slate-100"
                  />
                </div>
                <button
                  onClick={handleAddTahunAjaran}
                  className="py-2 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200/50 dark:border-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                >
                  Tambah Tahun
                </button>
              </div>

              {/* Tahun Ajaran list */}
              <div className="space-y-2">
                {tahunAjarans.map(t => (
                  <div
                    key={t.id}
                    className="p-3 bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800 rounded-xl flex items-center justify-between text-xs"
                  >
                    <span className={`font-bold ${t.aktif ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400'}`}>
                      Tahun Ajaran {t.nama}
                    </span>

                    <button
                      onClick={() => handleToggleTahunAjaran(t.id)}
                      className="p-1 cursor-pointer"
                    >
                      {t.aktif ? (
                        <ToggleRight className="w-9 h-6 text-emerald-600" />
                      ) : (
                        <ToggleLeft className="w-9 h-6 text-slate-400" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
