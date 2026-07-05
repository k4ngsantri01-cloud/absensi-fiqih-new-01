/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import { Download, Printer, Search, Filter, AlertCircle, FileText } from 'lucide-react';
import { Kelas, Santri, MataPelajaran, Hissoh, Absensi, Semester, TahunAjaran } from '../types';

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

interface RekapRow {
  id: string;
  no: number;
  nama: string;
  kelas: string;
  hadir: number;
  izin: number;
  sakit: number;
  ghoib: number;
  totalPertemuan: number;
  persentase: number;
}

export default function RekapTab({
  kelas,
  santri,
  absensi,
  onShowToast,
}: RekapTabProps) {
  const [filterKelas, setFilterKelas] = useState<string>('all');
  const [filterBulan, setFilterBulan] = useState<string>('all');
  const [filterTahun, setFilterTahun] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const parseDate = (value: string) => {
    if (!value) return null;
    const [year, month, day] = value.split('-').map(Number);
    if (!year || !month || !day) return null;
    const date = new Date(Date.UTC(year, month - 1, day));
    return Number.isNaN(date.getTime()) ? null : date;
  };

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

  const availableYears = useMemo(() => {
    const years = Array.from(
      new Set(
        absensi
          .map(item => parseDate(item.tanggal))
          .filter((date): date is Date => Boolean(date))
          .map(date => date.getUTCFullYear().toString())
      )
    );
    return years.sort((a, b) => Number(b) - Number(a));
  }, [absensi, parseDate]);

  const rows = useMemo<RekapRow[]>(() => {
    const filteredStudents = santri.filter(student => {
      if (student.status === 'Keluar') return false;
      if (filterKelas !== 'all' && student.kelas_id !== filterKelas) return false;
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        return student.nama.toLowerCase().includes(query);
      }
      return true;
    });

    const visibleStudentIds = new Set(filteredStudents.map(student => student.id));
    const summaryMap = new Map<string, { hadir: number; izin: number; sakit: number; ghoib: number; totalPertemuan: number }>();

    absensi.forEach(item => {
      if (!visibleStudentIds.has(item.santri_id)) return;

      const date = parseDate(item.tanggal);
      if (!date) return;
      if (filterBulan !== 'all' && date.getUTCMonth() + 1 !== Number(filterBulan)) return;
      if (filterTahun !== 'all' && date.getUTCFullYear().toString() !== filterTahun) return;

      const current = summaryMap.get(item.santri_id) || { hadir: 0, izin: 0, sakit: 0, ghoib: 0, totalPertemuan: 0 };
      current.totalPertemuan += 1;
      if (item.status === 'Hadir') current.hadir += 1;
      else if (item.status === 'Izin') current.izin += 1;
      else if (item.status === 'Sakit') current.sakit += 1;
      else if (item.status === 'Ghoib') current.ghoib += 1;
      summaryMap.set(item.santri_id, current);
    });

    return filteredStudents
      .map(student => {
        const summary = summaryMap.get(student.id) || { hadir: 0, izin: 0, sakit: 0, ghoib: 0, totalPertemuan: 0 };
        const totalPertemuan = summary.totalPertemuan;
        const persentase = totalPertemuan > 0 ? Math.round((summary.hadir / totalPertemuan) * 100) : 0;

        return {
          id: student.id,
          no: student.no,
          nama: student.nama,
          kelas: kelas.find(item => item.id === student.kelas_id)?.nama || '-',
          hadir: summary.hadir,
          izin: summary.izin,
          sakit: summary.sakit,
          ghoib: summary.ghoib,
          totalPertemuan,
          persentase,
        };
      })
      .sort((a, b) => a.no - b.no);
  }, [absensi, filterBulan, filterKelas, filterTahun, kelas, santri, searchQuery, parseDate]);

  const overallStats = useMemo(() => {
    const totalSantri = rows.length;
    const totalHadir = rows.reduce((sum, item) => sum + item.hadir, 0);
    const totalIzin = rows.reduce((sum, item) => sum + item.izin, 0);
    const totalSakit = rows.reduce((sum, item) => sum + item.sakit, 0);
    const totalGhoib = rows.reduce((sum, item) => sum + item.ghoib, 0);
    const rataRataKehadiran = totalSantri > 0
      ? Math.round(rows.reduce((sum, item) => sum + item.persentase, 0) / totalSantri)
      : 0;

    return {
      totalSantri,
      totalHadir,
      totalIzin,
      totalSakit,
      totalGhoib,
      rataRataKehadiran,
    };
  }, [rows]);

  const topFive = useMemo(() => {
    return [...rows].sort((a, b) => b.persentase - a.persentase).slice(0, 5);
  }, [rows]);

  const bottomFive = useMemo(() => {
    return [...rows].sort((a, b) => a.persentase - b.persentase).slice(0, 5);
  }, [rows]);

  const getBadgeClass = (value: number) => {
    if (value >= 90) return 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20';
    if (value >= 75) return 'bg-amber-500/10 text-amber-700 border-amber-500/20';
    return 'bg-rose-500/10 text-rose-700 border-rose-500/20';
  };

  const handleExportCSV = () => {
    if (rows.length === 0) {
      onShowToast('Tidak ada data untuk diekspor', 'error');
      return;
    }

    try {
      const header = 'Nama,Kelas,Hadir,Izin,Sakit,Ghoib,Total,Persentase\r\n';
      const body = rows.map((row, index) => {
        const total = row.hadir + row.izin + row.sakit + row.ghoib;
        return `"${index + 1}","${row.nama}","${row.kelas}","${row.hadir}","${row.izin}","${row.sakit}","${row.ghoib}","${total}","${row.persentase}%"\r\n`;
      }).join('');

      const csvContent = header + body;
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `rekap_absensi_santri_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      onShowToast('File Excel berhasil didownload', 'success');
    } catch {
      onShowToast('Gagal mengekspor data', 'error');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="hidden print:block text-center space-y-2 pb-6 border-b border-slate-300">
        <h1 className="text-2xl font-bold font-display text-black uppercase">REKAP ABSENSI SANTRI</h1>
        <p className="text-sm font-medium text-slate-700">Laporan Kehadiran Santri Berdasarkan Data Absensi</p>
        <p className="text-xs text-slate-500">Dicetak pada: {new Date().toLocaleString('id-ID')}</p>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl shadow-xs print:hidden">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-bold font-display text-slate-800 dark:text-white flex items-center gap-2">
              <Filter className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              Rekap Absensi Santri
            </h2>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExportCSV}
                className="px-3.5 py-2 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 font-bold text-xs rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                Excel
              </button>
              <button
                onClick={handlePrint}
                className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                Cetak / PDF
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Kelas</label>
              <select
                value={filterKelas}
                onChange={e => setFilterKelas(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none focus:border-emerald-500"
              >
                <option value="all">Semua Kelas</option>
                {kelas.map(item => (
                  <option key={item.id} value={item.id}>{item.nama}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Bulan</label>
              <select
                value={filterBulan}
                onChange={e => setFilterBulan(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none focus:border-emerald-500"
              >
                <option value="all">Semua Bulan</option>
                {months.map(item => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Tahun</label>
              <select
                value={filterTahun}
                onChange={e => setFilterTahun(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none focus:border-emerald-500"
              >
                <option value="all">Semua Tahun</option>
                {availableYears.map(item => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </div>

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

      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl text-center">
          <p className="text-[10px] text-slate-400 font-bold uppercase">Total Santri</p>
          <p className="text-2xl font-black font-display text-slate-800 dark:text-white mt-1">{overallStats.totalSantri}</p>
        </div>
        <div className="bg-emerald-500/10 dark:bg-emerald-500/5 p-4 rounded-2xl text-center border border-emerald-500/10">
          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase">Total Hadir</p>
          <p className="text-2xl font-black font-display text-emerald-600 dark:text-emerald-400 mt-1">{overallStats.totalHadir}</p>
        </div>
        <div className="bg-blue-500/10 dark:bg-blue-500/5 p-4 rounded-2xl text-center border border-blue-500/10">
          <p className="text-[10px] text-blue-600 dark:text-blue-400 font-bold uppercase">Total Izin</p>
          <p className="text-2xl font-black font-display text-blue-600 dark:text-blue-400 mt-1">{overallStats.totalIzin}</p>
        </div>
        <div className="bg-amber-500/10 dark:bg-amber-500/5 p-4 rounded-2xl text-center border border-amber-500/10">
          <p className="text-[10px] text-amber-600 dark:text-amber-500 font-bold uppercase">Total Sakit</p>
          <p className="text-2xl font-black font-display text-amber-600 dark:text-amber-500 mt-1">{overallStats.totalSakit}</p>
        </div>
        <div className="bg-rose-500/10 dark:bg-rose-500/5 p-4 rounded-2xl text-center border border-rose-500/10">
          <p className="text-[10px] text-rose-600 dark:text-rose-400 font-bold uppercase">Total Ghoib</p>
          <p className="text-2xl font-black font-display text-rose-600 dark:text-rose-400 mt-1">{overallStats.totalGhoib}</p>
        </div>
        <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl text-center">
          <p className="text-[10px] text-slate-400 font-bold uppercase">Rata-rata Kehadiran</p>
          <p className="text-2xl font-black font-display text-slate-800 dark:text-white mt-1">{overallStats.rataRataKehadiran}%</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-bold font-display text-slate-800 dark:text-white">5 Santri Kehadiran Terbaik</h3>
          </div>
          <div className="space-y-2">
            {topFive.length === 0 ? (
              <p className="text-xs text-slate-400">Belum ada data yang cocok.</p>
            ) : topFive.map((item, index) => (
              <div key={item.id} className="flex items-center justify-between rounded-xl bg-slate-50 dark:bg-slate-800/40 px-3 py-2">
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-white">{index + 1}. {item.nama}</p>
                  <p className="text-[11px] text-slate-400">{item.kelas}</p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border ${getBadgeClass(item.persentase)}`}>
                  {item.persentase}%
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-4 h-4 text-rose-600" />
            <h3 className="text-sm font-bold font-display text-slate-800 dark:text-white">5 Santri Kehadiran Terendah</h3>
          </div>
          <div className="space-y-2">
            {bottomFive.length === 0 ? (
              <p className="text-xs text-slate-400">Belum ada data yang cocok.</p>
            ) : bottomFive.map((item, index) => (
              <div key={item.id} className="flex items-center justify-between rounded-xl bg-slate-50 dark:bg-slate-800/40 px-3 py-2">
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-white">{index + 1}. {item.nama}</p>
                  <p className="text-[11px] text-slate-400">{item.kelas}</p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border ${getBadgeClass(item.persentase)}`}>
                  {item.persentase}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/20">
          <h3 className="text-sm font-bold font-display text-slate-800 dark:text-white">Tabel Rekap Absensi</h3>
          <p className="text-xs text-slate-400">Data diurutkan berdasarkan nomor absen.</p>
        </div>

        {rows.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <AlertCircle className="w-10 h-10 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-medium">Tidak ada data rekap yang cocok dengan filter saat ini.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left border-collapse text-sm">
              <thead className="bg-slate-50/80 dark:bg-slate-900/40 sticky top-0 z-10">
                <tr className="text-slate-400 uppercase text-[10px] font-bold">
                  <th className="py-3 px-4 text-center">No</th>
                  <th className="py-3 px-4">Nama Santri</th>
                  <th className="py-3 px-4">Kelas</th>
                  <th className="py-3 px-4 text-center">Hadir</th>
                  <th className="py-3 px-4 text-center">Izin</th>
                  <th className="py-3 px-4 text-center">Sakit</th>
                  <th className="py-3 px-4 text-center">Ghoib</th>
                  <th className="py-3 px-4 text-center">Total Pertemuan</th>
                  <th className="py-3 px-4 text-center">Persentase Kehadiran</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {rows.map((row, index) => {
                  const total = row.hadir + row.izin + row.sakit + row.ghoib;
                  return (
                    <tr key={row.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/10 transition-colors">
                      <td className="py-3 px-4 text-center font-semibold text-slate-400">{index + 1}</td>
                      <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-100">{row.nama}</td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{row.kelas}</td>
                      <td className="py-3 px-4 text-center text-emerald-600 font-bold">{row.hadir}</td>
                      <td className="py-3 px-4 text-center text-blue-600 font-bold">{row.izin}</td>
                      <td className="py-3 px-4 text-center text-amber-600 font-bold">{row.sakit}</td>
                      <td className="py-3 px-4 text-center text-rose-600 font-bold">{row.ghoib}</td>
                      <td className="py-3 px-4 text-center font-semibold text-slate-600 dark:text-slate-300">{total}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full text-[11px] font-black border ${getBadgeClass(row.persentase)}`}>
                          {row.persentase}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="hidden print:block bg-white rounded-xl p-4 border border-slate-300">
        <h2 className="text-lg font-bold uppercase mb-3">Ringkasan Statistik</h2>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div><span className="font-semibold">Total Santri:</span> {overallStats.totalSantri}</div>
          <div><span className="font-semibold">Total Hadir:</span> {overallStats.totalHadir}</div>
          <div><span className="font-semibold">Total Izin:</span> {overallStats.totalIzin}</div>
          <div><span className="font-semibold">Total Sakit:</span> {overallStats.totalSakit}</div>
          <div><span className="font-semibold">Total Ghoib:</span> {overallStats.totalGhoib}</div>
          <div><span className="font-semibold">Rata-rata Kehadiran:</span> {overallStats.rataRataKehadiran}%</div>
        </div>
      </div>

      <div className="hidden print:block bg-white rounded-xl p-4 border border-slate-300">
        <h2 className="text-lg font-bold uppercase mb-3">Tabel Rekap Lengkap</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-700">
                <th className="py-2 px-2 border border-slate-300">No</th>
                <th className="py-2 px-2 border border-slate-300">Nama</th>
                <th className="py-2 px-2 border border-slate-300">Kelas</th>
                <th className="py-2 px-2 border border-slate-300">Hadir</th>
                <th className="py-2 px-2 border border-slate-300">Izin</th>
                <th className="py-2 px-2 border border-slate-300">Sakit</th>
                <th className="py-2 px-2 border border-slate-300">Ghoib</th>
                <th className="py-2 px-2 border border-slate-300">Total</th>
                <th className="py-2 px-2 border border-slate-300">Persentase</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => {
                const total = row.hadir + row.izin + row.sakit + row.ghoib;
                return (
                  <tr key={row.id}>
                    <td className="py-2 px-2 border border-slate-300 text-center">{index + 1}</td>
                    <td className="py-2 px-2 border border-slate-300">{row.nama}</td>
                    <td className="py-2 px-2 border border-slate-300">{row.kelas}</td>
                    <td className="py-2 px-2 border border-slate-300 text-center">{row.hadir}</td>
                    <td className="py-2 px-2 border border-slate-300 text-center">{row.izin}</td>
                    <td className="py-2 px-2 border border-slate-300 text-center">{row.sakit}</td>
                    <td className="py-2 px-2 border border-slate-300 text-center">{row.ghoib}</td>
                    <td className="py-2 px-2 border border-slate-300 text-center">{total}</td>
                    <td className="py-2 px-2 border border-slate-300 text-center">{row.persentase}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
