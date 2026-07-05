/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Users, GraduationCap, BookOpen, Clock, Calendar, CheckSquare, ClipboardCheck, ArrowRight } from 'lucide-react';
import { Kelas, Santri, MataPelajaran, Hissoh, Jadwal, Absensi, Semester, TahunAjaran } from '../types';
import { motion } from 'motion/react';

interface DashboardProps {
  kelas: Kelas[];
  santri: Santri[];
  mapel: MataPelajaran[];
  hissoh: Hissoh[];
  jadwal: Jadwal[];
  absensi: Absensi[];
  semesters: Semester[];
  tahunAjarans: TahunAjaran[];
  onNavigate: (tab: 'dashboard' | 'jadwal' | 'presensi' | 'rekap' | 'santri' | 'setting') => void;
  onStartPresensi: (kelasId: string, mapelId: string, hissohId: string) => void;
}

export default function DashboardTab({
  kelas,
  santri,
  mapel,
  hissoh,
  jadwal,
  absensi,
  semesters,
  tahunAjarans,
  onNavigate,
  onStartPresensi,
}: DashboardProps) {
  // Active Semester and Tahun Ajaran
  const activeSemester = semesters.find(s => s.aktif)?.nama || 'Tidak Aktif';
  const activeTahunAjaran = tahunAjarans.find(t => t.aktif)?.nama || 'Tidak Aktif';

  // Get current day name in Indonesian
  const dayNamesIndo = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const currentDayIndex = new Date().getDay();
  const currentDayName = dayNamesIndo[currentDayIndex];

  // Current Date display
  const formattedDate = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Calculate stats
  const totalSantri = santri.length;
  const totalKelas = kelas.length;
  const totalMapel = mapel.length;

  // Active students only (exclude status 'Keluar')
  const activeSantriCount = santri.filter(s => s.status !== 'Keluar').length;

  // Today's schedule
  const todaySchedules = jadwal.filter(j => j.hari.toLowerCase() === currentDayName.toLowerCase());

  // Get last 4 attendance sessions (grouped by date, kelas, mapel, hissoh)
  const getRecentSessions = () => {
    const sessionsMap: { [key: string]: {
      tanggal: string;
      hari: string;
      kelas_id: string;
      mapel_id: string;
      hissoh_id: string;
      records: Absensi[];
    }} = {};

    absensi.forEach(record => {
      const key = `${record.tanggal}_${record.kelas_id}_${record.mapel_id}_${record.hissoh_id}`;
      if (!sessionsMap[key]) {
        sessionsMap[key] = {
          tanggal: record.tanggal,
          hari: record.hari,
          kelas_id: record.kelas_id,
          mapel_id: record.mapel_id,
          hissoh_id: record.hissoh_id,
          records: [],
        };
      }
      sessionsMap[key].records.push(record);
    });

    return Object.values(sessionsMap)
      .sort((a, b) => {
        // Sort descending by date, then by hissoh nomor desc
        const dateCompare = b.tanggal.localeCompare(a.tanggal);
        if (dateCompare !== 0) return dateCompare;
        const hissohA = hissoh.find(h => h.id === a.hissoh_id)?.nomor || 0;
        const hissohB = hissoh.find(h => h.id === b.hissoh_id)?.nomor || 0;
        return hissohB - hissohA;
      })
      .slice(0, 4);
  };

  const recentSessions = getRecentSessions();

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-emerald-600 to-teal-700 text-white p-6 md:p-8 shadow-xl">
        <div className="absolute top-0 right-0 -mr-12 -mt-12 w-48 h-48 rounded-full bg-white/10 blur-xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-32 h-32 rounded-full bg-white/5 blur-lg pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-xs font-semibold backdrop-blur-md">
              <Calendar className="w-3.5 h-3.5" />
              Tahun Ajaran {activeTahunAjaran}
            </span>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-display">
              Selamat Datang, Ustadz!
            </h1>
            <p className="text-emerald-100 text-sm md:text-base max-w-xl font-medium">
              Siap mengajar hari ini? Silakan cek Jadwal Hissoh Anda atau lakukan rekap presensi santri dengan praktis.
            </p>
          </div>

          <div className="flex flex-col items-start md:items-end bg-white/10 backdrop-blur-md border border-white/15 p-4 rounded-2xl md:text-right w-full md:w-auto md:min-w-[200px]">
            <span className="text-xs text-emerald-200 font-bold uppercase tracking-wider">{currentDayName}</span>
            <span className="text-sm sm:text-base md:text-lg font-bold font-display leading-tight mt-0.5">{formattedDate}</span>
            <span className="text-xs text-emerald-200 mt-1.5 px-2 py-0.5 bg-emerald-500/30 rounded-md font-semibold w-fit">
              {activeSemester}
            </span>
          </div>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Stat Card 1 */}
        <div className="bg-white/80 dark:bg-slate-900/80 border border-slate-100 dark:border-slate-800/80 backdrop-blur-md rounded-2xl p-5 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-3.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Santri Aktif</p>
            <h3 className="text-2xl font-bold tracking-tight font-display text-slate-800 dark:text-white mt-1">
              {activeSantriCount} <span className="text-xs font-normal text-slate-400">/ {totalSantri} siswa</span>
            </h3>
          </div>
        </div>

        {/* Stat Card 2 */}
        <div className="bg-white/80 dark:bg-slate-900/80 border border-slate-100 dark:border-slate-800/80 backdrop-blur-md rounded-2xl p-5 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-3.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Jumlah Kelas</p>
            <h3 className="text-2xl font-bold tracking-tight font-display text-slate-800 dark:text-white mt-1">
              {totalKelas} <span className="text-xs font-normal text-slate-400">ruang</span>
            </h3>
          </div>
        </div>

        {/* Stat Card 3 */}
        <div className="bg-white/80 dark:bg-slate-900/80 border border-slate-100 dark:border-slate-800/80 backdrop-blur-md rounded-2xl p-5 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-3.5 rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Mata Pelajaran</p>
            <h3 className="text-2xl font-bold tracking-tight font-display text-slate-800 dark:text-white mt-1">
              {totalMapel} <span className="text-xs font-normal text-slate-400">subjek</span>
            </h3>
          </div>
        </div>
      </div>

      {/* Main Content Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left Column: Today's Schedule Quickview */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <h2 className="text-lg font-bold font-display text-slate-800 dark:text-white">
                Jadwal Hari Ini ({currentDayName})
              </h2>
            </div>
            <button
              onClick={() => onNavigate('jadwal')}
              className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              Lihat Semua <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {todaySchedules.length === 0 ? (
              currentDayName.toLowerCase() === 'jumat' ? (
                <div className="bg-rose-500/5 dark:bg-rose-950/10 border border-dashed border-rose-200 dark:border-rose-900/30 rounded-2xl p-8 text-center text-rose-600 dark:text-rose-400">
                  <Calendar className="w-8 h-8 mx-auto text-rose-500/60 mb-2" />
                  <p className="text-sm font-bold">Hari Jum'at Libur Mingguan</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Hari Jum'at merupakan hari libur mingguan. Tidak ada kegiatan belajar mengajar hari ini.</p>
                </div>
              ) : (
                <div className="bg-slate-100/50 dark:bg-slate-900/40 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center text-slate-500">
                  <Calendar className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                  <p className="text-sm font-medium">Ustadz tidak memiliki jadwal mengajar hari ini.</p>
                  <p className="text-xs text-slate-400 mt-1">Silakan kelola jadwal mengajar di Halaman Setting.</p>
                </div>
              )
            ) : (
              todaySchedules
                .sort((a, b) => {
                  const numA = hissoh.find(h => h.id === a.hissoh_id)?.nomor || 0;
                  const numB = hissoh.find(h => h.id === b.hissoh_id)?.nomor || 0;
                  return numA - numB;
                })
                .map(j => {
                  const matchingHissoh = hissoh.find(h => h.id === j.hissoh_id);
                  const matchingKelas = kelas.find(k => k.id === j.kelas_id);
                  const matchingMapel = mapel.find(m => m.id === j.mapel_id);

                  // Check if this session already has attendance filled
                  const hasAbsen = absensi.some(
                    a =>
                      a.kelas_id === j.kelas_id &&
                      a.mapel_id === j.mapel_id &&
                      a.hissoh_id === j.hissoh_id &&
                      a.tanggal === new Date().toISOString().split('T')[0]
                  );

                  return (
                    <div
                      key={j.id}
                      className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-4 shadow-xs hover:border-emerald-300 dark:hover:border-emerald-800 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex flex-col items-center justify-center">
                          <span className="text-[10px] font-bold uppercase tracking-wider leading-none">Hissoh</span>
                          <span className="text-base font-black font-display leading-tight">
                            {matchingHissoh ? String(matchingHissoh.nomor).padStart(2, '0') : '00'}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-800 dark:text-white font-display">
                            {matchingMapel?.nama || 'Mapel Tidak Diketahui'}
                          </h4>
                          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-500 mt-0.5">
                            <span className="font-semibold text-slate-700 dark:text-slate-300">
                              Kelas: {matchingKelas?.nama || 'Kelas Tidak Diketahui'}
                            </span>
                            <span className="text-slate-300 dark:text-slate-700">•</span>
                            <span>
                              {matchingHissoh 
                                ? `${matchingHissoh.jam_mulai} - ${matchingHissoh.jam_selesai} WIB (${matchingHissoh.jam_mulai_istiwa || matchingHissoh.jam_mulai} - ${matchingHissoh.jam_selesai_istiwa || matchingHissoh.jam_selesai} Istiwa')` 
                                : '-'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div>
                        {hasAbsen ? (
                          <button
                            onClick={() => onStartPresensi(j.kelas_id, j.mapel_id, j.hissoh_id)}
                            className="w-full sm:w-auto px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl border border-slate-200/50 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <CheckSquare className="w-4 h-4 text-emerald-500" />
                            Edit Presensi
                          </button>
                        ) : (
                          <button
                            onClick={() => onStartPresensi(j.kelas_id, j.mapel_id, j.hissoh_id)}
                            className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <ClipboardCheck className="w-4 h-4" />
                            Presensi
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </div>

        {/* Right Column: Recent Attendance History */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <h2 className="text-lg font-bold font-display text-slate-800 dark:text-white">
                Riwayat Terakhir
              </h2>
            </div>
            <button
              onClick={() => onNavigate('rekap')}
              className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
            >
              Semua Rekap
            </button>
          </div>

          <div className="space-y-3">
            {recentSessions.length === 0 ? (
              <div className="bg-slate-100/50 dark:bg-slate-900/40 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center text-slate-500">
                <ClipboardCheck className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                <p className="text-sm font-medium">Belum ada riwayat presensi santri.</p>
                <p className="text-xs text-slate-400 mt-1">Lakukan presensi pada jadwal kelas hari ini.</p>
              </div>
            ) : (
              recentSessions.map(sess => {
                const sessKelas = kelas.find(k => k.id === sess.kelas_id);
                const sessMapel = mapel.find(m => m.id === sess.mapel_id);
                const sessHissoh = hissoh.find(h => h.id === sess.hissoh_id);

                // Calculate summary status counts
                const total = sess.records.length;
                const hadir = sess.records.filter(r => r.status === 'Hadir').length;
                const izin = sess.records.filter(r => r.status === 'Izin').length;
                const sakit = sess.records.filter(r => r.status === 'Sakit').length;
                const ghoib = sess.records.filter(r => r.status === 'Ghoib').length;

                // Format short date
                const rawDate = new Date(sess.tanggal);
                const formattedSessDate = rawDate.toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                });

                return (
                  <div
                    key={`${sess.tanggal}_${sess.kelas_id}_${sess.mapel_id}_${sess.hissoh_id}`}
                    className="bg-white/95 dark:bg-slate-900/95 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 shadow-xs"
                  >
                    <div className="flex items-center justify-between border-b border-slate-50 dark:border-slate-800 pb-2.5 mb-2.5">
                      <div>
                        <h5 className="font-bold text-slate-800 dark:text-white text-sm font-display leading-tight">
                          {sessMapel?.nama || 'Mapel'} - {sessKelas?.nama || 'Kelas'}
                        </h5>
                        <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                          {formattedSessDate} • Hissoh {sessHissoh ? String(sessHissoh.nomor).padStart(2, '0') : '-'}
                        </p>
                      </div>
                      <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 px-2 py-0.5 bg-emerald-500/10 rounded-md">
                        {total} Santri
                      </span>
                    </div>

                    {/* Breakdown pills */}
                    <div className="grid grid-cols-4 gap-1.5 text-center">
                      <div className="bg-emerald-500/10 dark:bg-emerald-500/5 p-1 rounded-lg">
                        <p className="text-[10px] text-slate-400 font-medium">Hadir</p>
                        <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{hadir}</p>
                      </div>
                      <div className="bg-blue-500/10 dark:bg-blue-500/5 p-1 rounded-lg">
                        <p className="text-[10px] text-slate-400 font-medium">Izin</p>
                        <p className="text-xs font-bold text-blue-600 dark:text-blue-400">{izin}</p>
                      </div>
                      <div className="bg-amber-500/10 dark:bg-amber-500/5 p-1 rounded-lg">
                        <p className="text-[10px] text-slate-400 font-medium">Sakit</p>
                        <p className="text-xs font-bold text-amber-600 dark:text-amber-500">{sakit}</p>
                      </div>
                      <div className="bg-rose-500/10 dark:bg-rose-500/5 p-1 rounded-lg">
                        <p className="text-[10px] text-slate-400 font-medium">Ghoib</p>
                        <p className="text-xs font-bold text-rose-600 dark:text-rose-400">{ghoib}</p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
