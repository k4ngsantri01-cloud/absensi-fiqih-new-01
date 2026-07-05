/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Calendar, Download, Printer, Search, Trash2, Filter, AlertCircle, FileText, Check, ChevronDown } from 'lucide-react';
import { Kelas, Santri, MataPelajaran, Hissoh, Absensi, Semester, TahunAjaran } from '../types';
import { motion } from 'motion/react';

interface RekapTabProps {
  kelas: Kelas[];
  santri: Santri[];
  mapel: MataPelajaran[];
  hissoh: Hissoh[];
  absensi: Absensi[];
  semesters: Semester[];
  tahunAjarans: TahunAjaran[];
  onDeleteSession: (tanggal: string, kelasId: string, mapelId: string, hissohId: string) => void;
  onShowToast: (text: string, type: 'success' | 'error' | 'info') => void;
}

export default function RekapTab({
  kelas,
  santri,
  mapel,
  hissoh,
  absensi,
  semesters,
  tahunAjarans,
  onDeleteSession,
  onShowToast,
}: RekapTabProps) {
  // Filters state
  const [filterKelas, setFilterKelas] = useState<string>('all');
  const [filterMapel, setFilterMapel] = useState<string>('all');
  const [filterHari, setFilterHari] = useState<string>('all');
  const [filterTanggal, setFilterTanggal] = useState<string>('');
  const [filterBulan, setFilterBulan] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Confirmation state for deleting a whole session
  const [sessionToDelete, setSessionToDelete] = useState<{
    tanggal: string;
    kelasId: string;
    mapelId: string;
    hissohId: string;
  } | null>(null);

  // Months name array
  const months = [
    { value: '1', label: 'Januari' },
    { value: '2', label: 'Februari' },
    { value: '3', label: 'Maret' },
    { value: '4', label: 'April' },
    { value: '5', label: 'Mei' },
    { value: '6', label: 'Juni' },
    { value: '7', label: 'Juli' },
    { value: '8', label: 'Agustus' },
    { value: '9', label: 'September' },
    { value: '10', label: 'Oktober' },
    { value: '11', label: 'November' },
    { value: '12', label: 'Desember' },
  ];

  // Group absensi by session (unique combination of tanggal, kelas, mapel, hissoh)
  const groupedSessions = useMemo(() => {
    const map: { [key: string]: {
      id: string;
      tanggal: string;
      hari: string;
      kelas_id: string;
      mapel_id: string;
      hissoh_id: string;
      records: Absensi[];
    }} = {};

    absensi.forEach(item => {
      const key = `${item.tanggal}_${item.kelas_id}_${item.mapel_id}_${item.hissoh_id}`;
      if (!map[key]) {
        map[key] = {
          id: key,
          tanggal: item.tanggal,
          hari: item.hari,
          kelas_id: item.kelas_id,
          mapel_id: item.mapel_id,
          hissoh_id: item.hissoh_id,
          records: [],
        };
      }
      map[key].records.push(item);
    });

    return Object.values(map).sort((a, b) => b.tanggal.localeCompare(a.tanggal));
  }, [absensi]);

  // Filtered Sessions based on selections
  const filteredSessions = useMemo(() => {
    return groupedSessions.filter(sess => {
      // 1. Kelas Filter
      if (filterKelas !== 'all' && sess.kelas_id !== filterKelas) return false;

      // 2. Mapel Filter
      if (filterMapel !== 'all' && sess.mapel_id !== filterMapel) return false;

      // 3. Hari Filter
      if (filterHari !== 'all' && sess.hari.toLowerCase() !== filterHari.toLowerCase()) return false;

      // 4. Tanggal Filter
      if (filterTanggal && sess.tanggal !== filterTanggal) return false;

      // 5. Bulan Filter
      if (filterBulan !== 'all') {
        const sessMonth = new Date(sess.tanggal).getMonth() + 1; // 1-indexed
        if (sessMonth.toString() !== filterBulan) return false;
      }

      // 6. Search Query (Siswa name inside session)
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        // Check if any student name matches query
        const hasMatchingStudent = sess.records.some(r => {
          const sName = santri.find(s => s.id === r.santri_id)?.nama || '';
          return sName.toLowerCase().includes(query);
        });
        if (!hasMatchingStudent) return false;
      }

      return true;
    });
  }, [groupedSessions, filterKelas, filterMapel, filterHari, filterTanggal, filterBulan, searchQuery, santri]);

  // Overall Statistics for current filtered view
  const overallStats = useMemo(() => {
    let total = 0;
    let hadir = 0;
    let izin = 0;
    let sakit = 0;
    let ghoib = 0;

    filteredSessions.forEach(sess => {
      sess.records.forEach(r => {
        total++;
        if (r.status === 'Hadir') hadir++;
        else if (r.status === 'Izin') izin++;
        else if (r.status === 'Sakit') sakit++;
        else if (r.status === 'Ghoib') ghoib++;
      });
    });

    const percent = (val: number) => (total > 0 ? Math.round((val / total) * 100) : 0);

    return {
      total,
      hadir,
      izin,
      sakit,
      ghoib,
      hadirPercent: percent(hadir),
      izinPercent: percent(izin),
      sakitPercent: percent(sakit),
      ghoibPercent: percent(ghoib),
    };
  }, [filteredSessions]);

  // Handle Export to EXCEL (CSV)
  const handleExportCSV = () => {
    if (filteredSessions.length === 0) {
      onShowToast('Tidak ada data untuk diekspor', 'error');
      return;
    }

    try {
      // Build CSV header
      let csvContent = 'No,Tanggal,Hari,Kelas,Mata Pelajaran,Hissoh,Nama Santri,No Absen,Status Absensi,Waktu Input\r\n';
      
      let counter = 1;
      filteredSessions.forEach(sess => {
        const sKelas = kelas.find(k => k.id === sess.kelas_id)?.nama || '';
        const sMapel = mapel.find(m => m.id === sess.mapel_id)?.nama || '';
        const sHissoh = hissoh.find(h => h.id === sess.hissoh_id)?.nomor || '';

        sess.records.forEach(r => {
          const sStudent = santri.find(s => s.id === r.santri_id);
          const sName = sStudent?.nama || '';
          const sNoAbsen = sStudent?.no || '';
          const status = r.status === 'Ghoib' ? 'Alfa' : r.status;
          
          csvContent += `"${counter}","${sess.tanggal}","${sess.hari}","${sKelas}","${sMapel}","Hissoh ${sHissoh}","${sName}","${sNoAbsen}","${status}","${r.jam_absen}"\r\n`;
          counter++;
        });
      });

      // Download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `rekap_absensi_fiqih_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      onShowToast('File Excel/CSV berhasil didownload', 'success');
    } catch (e) {
      onShowToast('Gagal mengekspor data', 'error');
    }
  };

  // Print Report Handler
  const handlePrint = () => {
    window.print();
  };

  const handleConfirmDelete = () => {
    if (sessionToDelete) {
      onDeleteSession(
        sessionToDelete.tanggal,
        sessionToDelete.kelasId,
        sessionToDelete.mapelId,
        sessionToDelete.hissohId
      );
      onShowToast('Sesi absensi berhasil dihapus', 'success');
      setSessionToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Print View Header (Only displays during print) */}
      <div className="hidden print:block text-center space-y-2 pb-6 border-b border-slate-300">
        <h1 className="text-2xl font-bold font-display text-black uppercase">REKAP ABSENSI SANTRI FIQIH NEW OE</h1>
        <p className="text-sm font-medium text-slate-700">Laporan Kehadiran Berbasis Sesi Jadwal Harian</p>
        <p className="text-xs text-slate-500">Dicetak pada: {new Date().toLocaleString('id-ID')}</p>
      </div>

      {/* Control Filter Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl shadow-xs print:hidden">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold font-display text-slate-800 dark:text-white flex items-center gap-2">
              <Filter className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              Filter Rekap Presensi
            </h2>

            <div className="flex items-center gap-2">
              {/* Excel Download button */}
              <button
                onClick={handleExportCSV}
                className="px-3.5 py-2 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 font-bold text-xs rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                Excel
              </button>

              {/* PDF/Print button */}
              <button
                onClick={handlePrint}
                className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                Cetak / PDF
              </button>
            </div>
          </div>

          {/* Form filters */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {/* Filter Kelas */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Kelas</label>
              <select
                value={filterKelas}
                onChange={e => setFilterKelas(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none focus:border-emerald-500"
              >
                <option value="all">Semua Kelas</option>
                {kelas.map(k => (
                  <option key={k.id} value={k.id}>{k.nama}</option>
                ))}
              </select>
            </div>

            {/* Filter Mapel */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Mata Pelajaran</label>
              <select
                value={filterMapel}
                onChange={e => setFilterMapel(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none focus:border-emerald-500"
              >
                <option value="all">Semua Mapel</option>
                {mapel.map(m => (
                  <option key={m.id} value={m.id}>{m.nama}</option>
                ))}
              </select>
            </div>

            {/* Filter Hari */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Hari</label>
              <select
                value={filterHari}
                onChange={e => setFilterHari(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none focus:border-emerald-500"
              >
                <option value="all">Semua Hari</option>
                {['Sabtu', 'Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'].map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            {/* Filter Tanggal */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Tanggal</label>
              <input
                type="date"
                value={filterTanggal}
                onChange={e => setFilterTanggal(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none focus:border-emerald-500"
              />
            </div>

            {/* Filter Bulan */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Bulan</label>
              <select
                value={filterBulan}
                onChange={e => setFilterBulan(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none focus:border-emerald-500"
              >
                <option value="all">Semua Bulan</option>
                {months.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>

            {/* Fast Student Search */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Nama Santri</label>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Cari nama..."
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none focus:border-emerald-500"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Overview Statistics Panel */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl shadow-xs">
        <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4">Statistik Hasil Filter Kehadiran</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 p-4 rounded-xl text-center">
            <p className="text-[10px] text-slate-400 font-bold uppercase">Total Input</p>
            <p className="text-2xl font-black font-display text-slate-800 dark:text-white mt-1">{overallStats.total}</p>
            <p className="text-[9px] text-slate-400 mt-0.5">absensi santri</p>
          </div>
          <div className="bg-emerald-500/10 dark:bg-emerald-500/5 p-4 rounded-xl text-center border border-emerald-500/10">
            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase">Hadir</p>
            <p className="text-2xl font-black font-display text-emerald-600 dark:text-emerald-400 mt-1">{overallStats.hadir}</p>
            <p className="text-xs font-bold text-emerald-600/70">{overallStats.hadirPercent}%</p>
          </div>
          <div className="bg-blue-500/10 dark:bg-blue-500/5 p-4 rounded-xl text-center border border-blue-500/10">
            <p className="text-[10px] text-blue-600 dark:text-blue-400 font-bold uppercase">Izin</p>
            <p className="text-2xl font-black font-display text-blue-600 dark:text-blue-400 mt-1">{overallStats.izin}</p>
            <p className="text-xs font-bold text-blue-600/70">{overallStats.izinPercent}%</p>
          </div>
          <div className="bg-amber-500/10 dark:bg-amber-500/5 p-4 rounded-xl text-center border border-amber-500/10">
            <p className="text-[10px] text-amber-600 dark:text-amber-500 font-bold uppercase">Sakit</p>
            <p className="text-2xl font-black font-display text-amber-600 dark:text-amber-500 mt-1">{overallStats.sakit}</p>
            <p className="text-xs font-bold text-amber-600/70">{overallStats.sakitPercent}%</p>
          </div>
          <div className="bg-rose-500/10 dark:bg-rose-500/5 p-4 rounded-xl text-center border border-rose-500/10 col-span-2 md:col-span-1">
            <p className="text-[10px] text-rose-600 dark:text-rose-400 font-bold uppercase">Alfa (Ghoib)</p>
            <p className="text-2xl font-black font-display text-rose-600 dark:text-rose-400 mt-1">{overallStats.ghoib}</p>
            <p className="text-xs font-bold text-rose-600/70">{overallStats.ghoibPercent}%</p>
          </div>
        </div>
      </div>

      {/* Reports Sessions List (Groups as cards and table) */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold font-display text-slate-800 dark:text-white flex items-center gap-1.5">
          <FileText className="w-4 h-4 text-emerald-600" />
          Daftar Rekap Sesi Absensi ({filteredSessions.length} Sesi Terbuka)
        </h3>

        {filteredSessions.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-12 text-center text-slate-500">
            <AlertCircle className="w-10 h-10 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-medium">Tidak ada rekap absensi yang cocok dengan filter.</p>
            <p className="text-xs text-slate-400 mt-1">Lakukan input absensi terlebih dahulu pada halaman Jadwal Hari Ini.</p>
          </div>
        ) : (
          filteredSessions.map(sess => {
            const sKelas = kelas.find(k => k.id === sess.kelas_id);
            const sMapel = mapel.find(m => m.id === sess.mapel_id);
            const sHissoh = hissoh.find(h => h.id === sess.hissoh_id);

            // Session states calculation
            const hCount = sess.records.filter(r => r.status === 'Hadir').length;
            const iCount = sess.records.filter(r => r.status === 'Izin').length;
            const sCount = sess.records.filter(r => r.status === 'Sakit').length;
            const gCount = sess.records.filter(r => r.status === 'Ghoib').length;

            return (
              <div
                key={sess.id}
                className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs hover:border-slate-200 dark:hover:border-slate-700 transition-all"
              >
                {/* Session Header banner */}
                <div className="bg-slate-50/70 dark:bg-slate-800/20 px-5 py-4 border-b border-slate-100 dark:border-slate-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold rounded-md uppercase">
                      Hissoh {sHissoh ? String(sHissoh.nomor).padStart(2, '0') : '-'}
                    </span>
                    <h4 className="text-base font-black font-display text-slate-800 dark:text-white uppercase leading-tight">
                      {sMapel?.nama || 'Mapel'} — {sKelas?.nama || 'Kelas'}
                    </h4>
                    <p className="text-xs text-slate-400 font-medium">
                      {sess.hari}, {new Date(sess.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} • {sHissoh ? `${sHissoh.jam_mulai} - ${sHissoh.jam_selesai} WIB (${sHissoh.jam_mulai_istiwa || sHissoh.jam_mulai} - ${sHissoh.jam_selesai_istiwa || sHissoh.jam_selesai} Istiwa')` : '-'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Compact breakdown summary */}
                    <div className="flex items-center gap-1 text-[10px] font-bold">
                      <span className="px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 rounded">H: {hCount}</span>
                      <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 rounded">I: {iCount}</span>
                      <span className="px-1.5 py-0.5 bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-500 rounded">S: {sCount}</span>
                      <span className="px-1.5 py-0.5 bg-rose-100 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 rounded">A: {gCount}</span>
                    </div>

                    {/* Delete session button (confirm layout) */}
                    <button
                      onClick={() => setSessionToDelete(sess)}
                      className="p-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-900/30 text-rose-600 rounded-xl transition-colors cursor-pointer print:hidden"
                      title="Hapus Sesi Absensi"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Session Records (Detailed table) */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50/30 dark:bg-slate-900/40 border-b border-slate-50 dark:border-slate-800 text-slate-400 font-bold">
                        <th className="py-2.5 px-4 w-12 text-center">No</th>
                        <th className="py-2.5 px-4">Nama Santri</th>
                        <th className="py-2.5 px-4 w-24 text-center">No. Absen</th>
                        <th className="py-2.5 px-4 w-28 text-center">Jenis Kelamin</th>
                        <th className="py-2.5 px-4 w-32 text-center">Status Kehadiran</th>
                        <th className="py-2.5 px-4 w-24 text-center">Waktu Log</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800/40">
                      {sess.records
                        .filter(r => {
                          if (searchQuery.trim() === '') return true;
                          const sName = santri.find(s => s.id === r.santri_id)?.nama || '';
                          return sName.toLowerCase().includes(searchQuery.toLowerCase());
                        })
                        .sort((a, b) => {
                          const sA = santri.find(s => s.id === a.santri_id);
                          const sB = santri.find(s => s.id === b.santri_id);
                          return (sA?.no || 0) - (sB?.no || 0);
                        })
                        .map((r, rIdx) => {
                          const sItem = santri.find(s => s.id === r.santri_id);
                          
                          const statusClass = {
                            Hadir: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20',
                            Izin: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20',
                            Sakit: 'bg-amber-500/10 text-amber-700 dark:text-amber-500 border border-amber-500/20',
                            Ghoib: 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20',
                          }[r.status];

                          return (
                            <tr key={r.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/10 transition-colors">
                              <td className="py-2.5 px-4 text-center font-medium text-slate-400">{rIdx + 1}</td>
                              <td className="py-2.5 px-4 font-bold text-slate-800 dark:text-slate-100">{sItem?.nama || 'Siswa'}</td>
                              <td className="py-2.5 px-4 text-center font-mono font-bold text-slate-600 dark:text-slate-350">
                                {sItem ? String(sItem.no).padStart(2, '0') : '-'}
                              </td>
                              <td className="py-2.5 px-4 text-center">
                                <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${sItem?.jk === 'L' ? 'bg-blue-500/15 text-blue-600' : 'bg-pink-500/15 text-pink-600'}`}>
                                  {sItem?.jk === 'L' ? 'Laki-laki' : 'Perempuan'}
                                </span>
                              </td>
                              <td className="py-2.5 px-4 text-center">
                                <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${statusClass}`}>
                                  {r.status === 'Ghoib' ? 'Alfa' : r.status}
                                </span>
                              </td>
                              <td className="py-2.5 px-4 text-center font-mono text-slate-400 text-[10px]">{r.jam_absen}</td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Delete Confirmation Popup Modal */}
      {sessionToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl"
          >
            <div className="p-3 bg-rose-500/10 text-rose-600 rounded-2xl w-fit mb-4">
              <Trash2 className="w-6 h-6" />
            </div>

            <h3 className="text-base font-bold font-display text-slate-800 dark:text-white">
              Hapus Sesi Absensi?
            </h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Tindakan ini akan menghapus seluruh data kehadiran santri pada sesi{' '}
              <strong>{mapel.find(m => m.id === sessionToDelete.mapelId)?.nama}</strong> -{' '}
              <strong>{kelas.find(k => k.id === sessionToDelete.kelasId)?.nama}</strong> tanggal{' '}
              {sessionToDelete.tanggal}. Laporan rekapitulasi akan langsung diperbarui.
            </p>

            <div className="flex gap-2.5 mt-6">
              <button
                onClick={() => setSessionToDelete(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white transition-colors cursor-pointer shadow-md shadow-rose-600/10"
              >
                Hapus Permanen
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
