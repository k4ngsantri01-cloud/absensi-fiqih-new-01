/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ChevronLeft, Info, CheckCircle2, UserCheck, AlertCircle } from 'lucide-react';
import { Kelas, Santri, MataPelajaran, Hissoh, Absensi } from '../types';
import { motion } from 'motion/react';

interface PresensiTabProps {
  activeSession: {
    kelasId: string;
    mapelId: string;
    hissohId: string;
    tanggal: string;
  } | null;
  kelas: Kelas[];
  santri: Santri[];
  mapel: MataPelajaran[];
  hissoh: Hissoh[];
  absensi: Absensi[];
  onSave: (records: Absensi[]) => void;
  onCancel: () => void;
}

export default function PresensiTab({
  activeSession,
  kelas,
  santri,
  mapel,
  hissoh,
  absensi,
  onSave,
  onCancel,
}: PresensiTabProps) {
  if (!activeSession) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-8 text-center max-w-lg mx-auto my-12">
        <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-3 animate-bounce" />
        <h3 className="text-lg font-bold font-display text-slate-800 dark:text-white">Tidak Ada Sesi Presensi Aktif</h3>
        <p className="text-xs text-slate-500 mt-2">
          Silakan buka halaman <strong>Jadwal Hari Ini</strong> dan klik tombol <strong>PRESENSI</strong> pada salah satu jadwal.
        </p>
      </div>
    );
  }

  const { kelasId, mapelId, hissohId, tanggal } = activeSession;

  const currentKelas = kelas.find(k => k.id === kelasId);
  const currentMapel = mapel.find(m => m.id === mapelId);
  const currentHissoh = hissoh.find(h => h.id === hissohId);

  // Day name of target date in Indonesian
  const dayNamesIndo = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const dayIndex = new Date(tanggal).getDay();
  const dayName = dayNamesIndo[dayIndex];

  // Get students in this class
  const classSantri = santri.filter(s => s.kelas_id === kelasId);

  // Status mapping for Indonesian / requested terms
  // Hadir (hijau), Izin (biru), Sakit (kuning), Ghoib (merah)
  const [sessionStates, setSessionStates] = useState<{ [santriId: string]: 'Hadir' | 'Izin' | 'Sakit' | 'Ghoib' }>({});

  // Flag to track whether we are in "Edit" mode vs "New" mode
  const [isEditMode, setIsEditMode] = useState<boolean>(false);

  // Load existing attendance if it exists for this (date, kelas, mapel, hissoh)
  useEffect(() => {
    const existing = absensi.filter(
      a => a.tanggal === tanggal && a.kelas_id === kelasId && a.mapel_id === mapelId && a.hissoh_id === hissohId
    );

    if (existing.length > 0) {
      setIsEditMode(true);
      const stateMap: { [santriId: string]: 'Hadir' | 'Izin' | 'Sakit' | 'Ghoib' } = {};
      existing.forEach(record => {
        stateMap[record.santri_id] = record.status;
      });
      // Fill in defaults for newly added students who might not have had an entry
      classSantri.forEach(s => {
        if (s.status !== 'Keluar' && !stateMap[s.id]) {
          stateMap[s.id] = 'Hadir';
        }
      });
      setSessionStates(stateMap);
    } else {
      setIsEditMode(false);
      // Default state: all active students marked as 'Hadir'
      const stateMap: { [santriId: string]: 'Hadir' | 'Izin' | 'Sakit' | 'Ghoib' } = {};
      classSantri.forEach(s => {
        if (s.status !== 'Keluar') {
          stateMap[s.id] = 'Hadir';
        }
      });
      setSessionStates(stateMap);
    }
  }, [activeSession, absensi, kelasId, mapelId, hissohId, tanggal, santri]);

  // Handle single student status change
  const handleStatusChange = (santriId: string, status: 'Hadir' | 'Izin' | 'Sakit' | 'Ghoib') => {
    setSessionStates(prev => ({
      ...prev,
      [santriId]: status,
    }));
  };

  // Checkbox for "Hadir Semua"
  const [allHadir, setAllHadir] = useState<boolean>(true);

  // Update check status based on actual list
  useEffect(() => {
    const activeSantri = classSantri.filter(s => s.status !== 'Keluar');
    if (activeSantri.length === 0) return;
    const isAllHadir = activeSantri.every(s => sessionStates[s.id] === 'Hadir');
    setAllHadir(isAllHadir);
  }, [sessionStates, classSantri]);

  const handleSetAllHadir = (checked: boolean) => {
    setAllHadir(checked);
    const targetStatus = checked ? 'Hadir' : 'Ghoib';
    const updated = { ...sessionStates };
    classSantri.forEach(s => {
      if (s.status !== 'Keluar') {
        updated[s.id] = targetStatus;
      }
    });
    setSessionStates(updated);
  };

  // Submit Handler
  const handleSave = () => {
    const recordsToSave: Absensi[] = classSantri
      .filter(s => s.status !== 'Keluar')
      .map(s => {
        const selectedStatus = sessionStates[s.id] || 'Hadir';
        const now = new Date();
        const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
        
        return {
          id: `${tanggal}_${kelasId}_${mapelId}_${hissohId}_${s.id}`,
          tanggal,
          hari: dayName,
          kelas_id: kelasId,
          mapel_id: mapelId,
          hissoh_id: hissohId,
          santri_id: s.id,
          status: selectedStatus,
          jam_absen: timeStr,
        };
      });

    onSave(recordsToSave);
  };

  // Helper colors for stats
  const statusConfig = {
    Hadir: { radioBg: 'peer-checked:bg-emerald-600 peer-checked:border-emerald-600', ring: 'focus:ring-emerald-500/20', text: 'text-emerald-700 dark:text-emerald-400 bg-emerald-500/10' },
    Izin: { radioBg: 'peer-checked:bg-blue-600 peer-checked:border-blue-600', ring: 'focus:ring-blue-500/20', text: 'text-blue-700 dark:text-blue-400 bg-blue-500/10' },
    Sakit: { radioBg: 'peer-checked:bg-amber-500 peer-checked:border-amber-500', ring: 'focus:ring-amber-500/20', text: 'text-amber-700 dark:text-amber-400 bg-amber-500/10' },
    Ghoib: { radioBg: 'peer-checked:bg-rose-600 peer-checked:border-rose-600', ring: 'focus:ring-rose-500/20', text: 'text-rose-700 dark:text-rose-400 bg-rose-500/10' },
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Navigation & Header */}
      <div className="flex flex-col gap-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={onCancel}
            className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                PRESENSI SELESAI & EDIT OTOMATIS
              </span>
              {isEditMode && (
                <span className="text-[10px] font-bold text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-md animate-pulse">
                  EDIT MODE
                </span>
              )}
            </div>
            <h2 className="text-xl font-bold font-display text-slate-800 dark:text-white">
              Sesi Absensi Kelas
            </h2>
          </div>
        </div>

        {/* Session Metadata Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50/50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Mata Pelajaran</p>
            <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-white font-display mt-0.5">{currentMapel?.nama || 'Mapel'}</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Kelas</p>
            <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-white font-display mt-0.5">{currentKelas?.nama || 'Kelas'}</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Waktu & Sesi</p>
            <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-white font-display mt-0.5">
              Hissoh {currentHissoh ? String(currentHissoh.nomor).padStart(2, '0') : '-'} ({currentHissoh?.jam_mulai} - {currentHissoh?.jam_selesai} WIB / {currentHissoh?.jam_mulai_istiwa || currentHissoh?.jam_mulai} - {currentHissoh?.jam_selesai_istiwa || currentHissoh?.jam_selesai} Istiwa')
            </p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Tanggal & Hari</p>
            <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-white font-display mt-0.5">
              {dayName}, {new Date(tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          </div>
        </div>
      </div>

      {/* Hadir Semua Control Bar */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl shadow-xs">
        <div className="flex items-center gap-3">
          <label className="relative flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={allHadir}
              onChange={(e) => handleSetAllHadir(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 dark:bg-slate-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            <span className="ml-3 text-xs font-bold text-slate-700 dark:text-slate-300">
              {allHadir ? 'Batalkan Hadir Semua' : 'Tandai Hadir Semua'}
            </span>
          </label>
        </div>

        <div className="text-right">
          <p className="text-[10px] text-slate-400 font-bold">JUMLAH SISWA</p>
          <p className="text-sm font-black text-slate-800 dark:text-white">
            {classSantri.filter(s => s.status !== 'Keluar').length} Siswa Aktif
            {classSantri.filter(s => s.status === 'Keluar').length > 0 && (
              <span className="text-xs font-medium text-slate-400 block">
                (+ {classSantri.filter(s => s.status === 'Keluar').length} Siswa Keluar)
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Student List Container */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs divide-y divide-slate-100 dark:divide-slate-850">
        {/* Header Legend */}
        <div className="hidden sm:flex items-center justify-between px-5 py-3 bg-slate-50/50 dark:bg-slate-800/20 text-xs font-bold text-slate-400 uppercase tracking-wider">
          <span>Daftar Siswa (No & Nama)</span>
          <span className="mr-8">Input Kehadiran</span>
        </div>

        {classSantri.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <UserCheck className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-medium">Belum ada data santri untuk kelas ini.</p>
            <p className="text-xs text-slate-400 mt-1">Silakan tambahkan data santri di Halaman Data Santri.</p>
          </div>
        ) : (
          classSantri
            .sort((a, b) => a.no - b.no)
            .map((s) => {
              const isKeluar = s.status === 'Keluar' || s.nama.toLowerCase().includes('*keluar');
              const selectedStatus = sessionStates[s.id] || 'Hadir';

              return (
                <div
                  key={s.id}
                  className={`flex items-center justify-between gap-3 px-3 py-2 sm:px-5 sm:py-3 transition-all ${
                    isKeluar
                      ? 'bg-slate-50/60 dark:bg-slate-900/40 opacity-50'
                      : 'hover:bg-slate-50/30 dark:hover:bg-slate-800/10'
                  }`}
                >
                  {/* Left info: No. Absen & Name */}
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-xs font-bold text-slate-500 shrink-0 min-w-[20px] text-right font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                      {String(s.no).padStart(2, '0')}
                    </span>
                    <div className="min-w-0">
                      <h4 className="font-bold text-xs sm:text-sm text-slate-850 dark:text-slate-200 truncate pr-1">
                        {s.nama}
                      </h4>
                    </div>
                  </div>

                  {/* Right: Status Selection Buttons */}
                  <div className="shrink-0">
                    {isKeluar ? (
                      <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg uppercase tracking-wider">
                        Keluar
                      </span>
                    ) : (
                      <div className="flex items-center gap-0.5 sm:gap-1 bg-slate-100/60 dark:bg-slate-800/60 p-0.5 sm:p-1 rounded-xl">
                        {(['Hadir', 'Izin', 'Sakit', 'Ghoib'] as const).map(st => {
                          const isChecked = selectedStatus === st;
                          const colors = {
                            Hadir: {
                              active: 'bg-emerald-600 text-white shadow-xs',
                              text: 'text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400',
                            },
                            Izin: {
                              active: 'bg-blue-600 text-white shadow-xs',
                              text: 'text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400',
                            },
                            Sakit: {
                              active: 'bg-amber-500 text-white shadow-xs',
                              text: 'text-slate-600 dark:text-slate-400 hover:text-amber-500 dark:hover:text-amber-400',
                            },
                            Ghoib: {
                              active: 'bg-rose-600 text-white shadow-xs',
                              text: 'text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400',
                            },
                          }[st];

                          const displayLabel = st === 'Ghoib' ? 'Alfa' : st;

                          return (
                            <button
                              key={st}
                              onClick={() => handleStatusChange(s.id, st)}
                              className={`px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-black transition-all cursor-pointer ${
                                isChecked 
                                  ? `${colors.active} font-black` 
                                  : `${colors.text} hover:bg-white dark:hover:bg-slate-700`
                              }`}
                            >
                              {/* On very small screen (<400px), show first letter: H, I, S, A. Otherwise full */}
                              <span className="inline min-[400px]:hidden">{st === 'Ghoib' ? 'A' : st[0]}</span>
                              <span className="hidden min-[400px]:inline">{displayLabel}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
        )}
      </div>

      {/* Save / Cancel buttons */}
      <div className="flex items-center justify-end gap-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl shadow-xs">
        <button
          onClick={onCancel}
          className="px-5 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          Batal & Bersihkan
        </button>

        <button
          onClick={handleSave}
          disabled={classSantri.filter(s => s.status !== 'Keluar').length === 0}
          className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white font-bold text-xs shadow-md shadow-emerald-600/10 transition-colors cursor-pointer disabled:cursor-not-allowed"
        >
          {isEditMode ? 'Simpan Perubahan' : 'Simpan Presensi'}
        </button>
      </div>
    </div>
  );
}
