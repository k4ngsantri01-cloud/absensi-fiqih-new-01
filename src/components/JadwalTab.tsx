/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Clock, Calendar, CheckCircle2, AlertTriangle, Play, CheckSquare } from 'lucide-react';
import { Kelas, Santri, MataPelajaran, Hissoh, Jadwal, Absensi } from '../types';
import { motion } from 'motion/react';

interface JadwalTabProps {
  kelas: Kelas[];
  mapel: MataPelajaran[];
  hissoh: Hissoh[];
  jadwal: Jadwal[];
  absensi: Absensi[];
  onStartPresensi: (kelasId: string, mapelId: string, hissohId: string, customDate?: string) => void;
}

export default function JadwalTab({
  kelas,
  mapel,
  hissoh,
  jadwal,
  absensi,
  onStartPresensi,
}: JadwalTabProps) {
  const dayNamesIndo = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

  const getTodayDateString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getDayNameFromDate = (dateStr: string) => {
    if (!dateStr) return 'Senin';
    const [year, month, day] = dateStr.split('-').map(Number);
    const localDate = new Date(year, month - 1, day);
    return dayNamesIndo[localDate.getDay()];
  };

  const [customDate, setCustomDate] = useState<string>(getTodayDateString);
  const [selectedHari, setSelectedHari] = useState<string>(() => getDayNameFromDate(getTodayDateString()));

  // State to hold current time to update countdowns
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Filter hissoh list sorted by number
  const sortedHissoh = [...hissoh].sort((a, b) => a.nomor - b.nomor);

  // Helper to parse time string "HH:MM" into a Date object on the current day
  const parseTimeToDate = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const date = new Date(currentTime);
    date.setHours(hours, minutes, 0, 0);
    return date;
  };

  // Helper to check the status of a Hissoh session relative to the current real time
  const getHissohStatus = (h: Hissoh) => {
    const dayOfSelectedDate = new Date(customDate).getDay();
    const selectedDayName = dayNamesIndo[dayOfSelectedDate];
    const isToday = selectedDayName.toLowerCase() === selectedHari.toLowerCase() && 
                    new Date().toISOString().split('T')[0] === customDate;

    if (!isToday) {
      return { state: 'inactive', message: 'Sesi hari lain' };
    }

    const start = parseTimeToDate(h.jam_mulai);
    const end = parseTimeToDate(h.jam_selesai);

    if (currentTime < start) {
      const diffMs = start.getTime() - currentTime.getTime();
      
      // If it's less than 2 hours before, show countdown, otherwise "Belum dimulai"
      if (diffMs < 2 * 60 * 60 * 1000) {
        const hours = Math.floor(diffMs / (3600 * 1000));
        const mins = Math.floor((diffMs % (3600 * 1000)) / (60 * 1000));
        const secs = Math.floor((diffMs % (60 * 1000)) / 1000);
        const countdownStr = `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
        return { state: 'upcoming', countdown: countdownStr, message: `Presensi dibuka dalam ${countdownStr}` };
      }
      return { state: 'upcoming_soon', message: `Presensi dibuka pkl ${h.jam_mulai}` };
    } else if (currentTime >= start && currentTime <= end) {
      return { state: 'active', message: 'Presensi sedang berlangsung' };
    } else {
      return { state: 'completed', message: 'Presensi telah ditutup' };
    }
  };

  const formatIndoDate = (dateStr: string) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-').map(Number);
    const d = new Date(year, month - 1, day);
    return d.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const isSelectedDateToday = () => {
    return customDate === getTodayDateString();
  };

  return (
    <div className="space-y-6">
      {/* Calendar Header Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="h-12 w-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider font-mono">Hari Presensi</span>
              {isSelectedDateToday() ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Hari Ini
                </span>
              ) : (
                <button
                  onClick={() => {
                    const todayStr = getTodayDateString();
                    setCustomDate(todayStr);
                    setSelectedHari(getDayNameFromDate(todayStr));
                  }}
                  className="text-[10px] font-bold text-teal-600 dark:text-teal-400 bg-teal-500/10 hover:bg-teal-500/20 px-2 py-0.5 rounded-full cursor-pointer transition-all border border-teal-500/10"
                >
                  Kembali ke Hari Ini
                </button>
              )}
            </div>
            <h3 className="text-base sm:text-lg font-black text-slate-800 dark:text-white mt-0.5 leading-tight">
              {formatIndoDate(customDate)}
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2 md:self-center">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap">Pilih Tanggal:</span>
          <input
            type="date"
            value={customDate}
            onChange={(e) => {
              const val = e.target.value;
              setCustomDate(val);
              if (val) {
                const [year, month, day] = val.split('-').map(Number);
                const localDate = new Date(year, month - 1, day);
                const dayIndex = localDate.getDay();
                setSelectedHari(dayNamesIndo[dayIndex]);
              }
            }}
            className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 outline-none focus:border-emerald-500 shadow-xs cursor-pointer"
          />
        </div>
      </div>

      {/* Friday holiday alert or No schedule today alert */}
      {selectedHari.toLowerCase() === 'jumat' ? (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-6 text-center">
          <p className="text-sm font-bold text-rose-600 dark:text-rose-400 flex items-center justify-center gap-2 mb-1">
            <Calendar className="w-5 h-5" />
            Hari Jum'at Libur Mingguan
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Hari Jum'at merupakan hari libur mingguan. Tidak ada kegiatan belajar mengajar hari ini.
          </p>
        </div>
      ) : (
        jadwal.filter(j => j.hari.toLowerCase() === selectedHari.toLowerCase()).length === 0 && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 text-center">
            <p className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center justify-center gap-1.5">
              <AlertTriangle className="w-4 h-4" />
              Tidak ada jadwal mengajar terdaftar untuk hari {selectedHari} ({formatIndoDate(customDate)}).
            </p>
          </div>
        )
      )}

      {/* Grid of Hissoh Slots */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedHissoh.map(h => {
          // Find if there is a schedule for this Hari and Hissoh
          const matchingJadwal = jadwal.find(
            j => j.hari.toLowerCase() === selectedHari.toLowerCase() && j.hissoh_id === h.id
          );

          const matchingKelas = matchingJadwal ? kelas.find(k => k.id === matchingJadwal.kelas_id) : null;
          const matchingMapel = matchingJadwal ? mapel.find(m => m.id === matchingJadwal.mapel_id) : null;

          // Check if attendance already exists for this slot on target date
          const hasAbsen = matchingJadwal && absensi.some(
            a =>
              a.kelas_id === matchingJadwal.kelas_id &&
              a.mapel_id === matchingJadwal.mapel_id &&
              a.hissoh_id === matchingJadwal.hissoh_id &&
              a.tanggal === customDate
          );

          const status = getHissohStatus(h);

          return (
            <div
              key={h.id}
              className={`bg-white dark:bg-slate-900 border rounded-2xl p-5 shadow-xs relative overflow-hidden transition-all flex flex-col justify-between min-h-[220px] ${
                matchingJadwal
                  ? hasAbsen
                    ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/10 dark:bg-emerald-950/5'
                    : status.state === 'active'
                    ? 'border-sky-300 dark:border-sky-800 bg-sky-50/5 dark:bg-sky-950/5 ring-1 ring-sky-300 dark:ring-sky-800'
                    : 'border-slate-100 dark:border-slate-800'
                  : 'border-slate-100 dark:border-slate-800 border-dashed bg-slate-50/30 dark:bg-slate-900/10'
              }`}
            >
              {/* Top Row: Hissoh info and times */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg uppercase tracking-wider font-display">
                    HISSOH {String(h.nomor).padStart(2, '0')}
                  </span>
                  
                  <div className="text-right">
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {h.jam_mulai} - {h.jam_selesai} WIB
                    </p>
                    <p className="text-[10px] text-slate-400 font-medium">
                      {h.jam_mulai_istiwa || h.jam_mulai} - {h.jam_selesai_istiwa || h.jam_selesai} ISTIWA'
                    </p>
                  </div>
                </div>

                {/* Schedule content */}
                {matchingJadwal ? (
                  <div className="space-y-2 mb-4">
                    <h3 className="text-base sm:text-lg font-black font-display tracking-tight text-slate-800 dark:text-white leading-tight uppercase">
                      {matchingMapel?.nama || 'Mapel'}
                    </h3>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Kelas:</span>
                      <span className="text-xs font-black text-slate-800 dark:text-slate-200 px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-md">
                        {matchingKelas?.nama || 'Kelas'}
                      </span>
                    </div>

                    {/* Status badge and text */}
                    {status.state === 'upcoming' && (
                      <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 text-[11px] font-semibold bg-amber-500/10 px-2 py-1 rounded-lg w-fit">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{status.message}</span>
                      </div>
                    )}
                    {status.state === 'upcoming_soon' && (
                      <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 text-[11px] font-semibold bg-amber-500/10 px-2 py-1 rounded-lg w-fit">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{status.message}</span>
                      </div>
                    )}
                    {status.state === 'active' && (
                      <div className="flex items-center gap-1.5 text-sky-600 dark:text-sky-400 text-[11px] font-semibold bg-sky-500/10 px-2 py-1 rounded-lg w-fit animate-pulse">
                        <Play className="w-3 h-3 fill-current" />
                        <span>{status.message}</span>
                      </div>
                    )}
                    {status.state === 'completed' && (
                      <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-semibold bg-slate-500/10 px-2 py-1 rounded-lg w-fit">
                        <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
                        <span>{status.message}</span>
                      </div>
                    )}
                    {status.state === 'inactive' && (
                      <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-semibold bg-slate-500/10 px-2 py-1 rounded-lg w-fit">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        <span>Sesi Tanggal: {customDate}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col justify-center h-24 text-center border border-dashed border-slate-200/50 dark:border-slate-800 rounded-xl px-2 py-4 mb-4">
                    <AlertTriangle className="w-5 h-5 text-slate-400 mx-auto mb-1" />
                    <p className="text-xs font-black text-slate-400 uppercase tracking-wider">
                      ANDA TIDAK ADA JADWAL
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      PADA HISSOH INI
                    </p>
                  </div>
                )}
              </div>

              {/* Bottom Action Button */}
              {matchingJadwal && (
                <div className="pt-2">
                  {hasAbsen ? (
                    <button
                      onClick={() => onStartPresensi(matchingJadwal.kelas_id, matchingJadwal.mapel_id, matchingJadwal.hissoh_id, customDate)}
                      className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer ripple-effect"
                    >
                      <CheckSquare className="w-4 h-4 text-emerald-500" />
                      Edit Presensi (Tersimpan)
                    </button>
                  ) : (
                    <button
                      onClick={() => onStartPresensi(matchingJadwal.kelas_id, matchingJadwal.mapel_id, matchingJadwal.hissoh_id, customDate)}
                      className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ripple-effect ${
                        status.state === 'active'
                          ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/10 hover:bg-emerald-500'
                          : 'bg-slate-800 text-white hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600'
                      }`}
                    >
                      <Play className="w-3 h-3 fill-current" />
                      PRESENSI
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
