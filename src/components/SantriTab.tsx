/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Plus, Edit3, Trash2, Search, FileDown, FileUp, Filter, AlertTriangle, Check, X, Users } from 'lucide-react';
import { Kelas, Santri } from '../types';
import { motion } from 'motion/react';

interface SantriTabProps {
  kelas: Kelas[];
  santri: Santri[];
  onAddSantri: (item: Omit<Santri, 'id'>) => void;
  onUpdateSantri: (item: Santri) => void;
  onDeleteSantri: (id: string) => void;
  onBulkAddSantri: (items: Omit<Santri, 'id'>[]) => void;
  onShowToast: (text: string, type: 'success' | 'error' | 'info') => void;
}

export default function SantriTab({
  kelas,
  santri,
  onAddSantri,
  onUpdateSantri,
  onDeleteSantri,
  onBulkAddSantri,
  onShowToast,
}: SantriTabProps) {
  // Filters & search state
  const [filterKelas, setFilterKelas] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Editing / adding modal forms states
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [isImportOpen, setIsImportOpen] = useState<boolean>(false);
  const [editingSantri, setEditingSantri] = useState<Santri | null>(null);

  // Form Fields
  const [formNIS, setFormNIS] = useState<string>('');
  const [formNama, setFormNama] = useState<string>('');
  const [formJK, setFormJK] = useState<'L' | 'P'>('L');
  const [formKelasId, setFormKelasId] = useState<string>('');
  const [formStatus, setFormStatus] = useState<'Aktif' | 'Keluar'>('Aktif');

  // Excel Bulk Import state
  const [importText, setImportText] = useState<string>('');
  const [importDelimiter, setImportDelimiter] = useState<'tab' | 'comma' | 'semicolon'>('tab');

  // Deletion confirmation
  const [santriToDelete, setSantriToDelete] = useState<Santri | null>(null);

  // Filtered Students list
  const filteredSantri = useMemo(() => {
    return santri.filter(s => {
      // 1. Kelas Filter
      if (filterKelas !== 'all' && s.kelas_id !== filterKelas) return false;

      // 2. Status Filter
      if (filterStatus !== 'all' && s.status !== filterStatus) return false;

      // 3. Search Query (NIS or Name)
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        const matchesName = s.nama.toLowerCase().includes(query);
        const matchesNIS = s.no.toString().includes(query);
        if (!matchesName && !matchesNIS) return false;
      }

      return true;
    });
  }, [santri, filterKelas, filterStatus, searchQuery]);

  // Open form for adding new student
  const handleOpenAdd = () => {
    setEditingSantri(null);
    setFormNIS('');
    setFormNama('');
    setFormJK('L');
    setFormKelasId(kelas[0]?.id || '');
    setFormStatus('Aktif');
    setIsFormOpen(true);
  };

  // Open form for editing existing student
  const handleOpenEdit = (s: Santri) => {
    setEditingSantri(s);
    setFormNIS(s.no.toString());
    setFormNama(s.nama);
    setFormJK(s.jk);
    setFormKelasId(s.kelas_id);
    setFormStatus(s.status);
    setIsFormOpen(true);
  };

  // Save student (Insert or Update)
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formNama.trim() || !formNIS.trim() || !formKelasId) {
      onShowToast('Mohon lengkapi No. Absen, Nama, dan Kelas', 'error');
      return;
    }

    const nisNumber = parseInt(formNIS.trim(), 10);
    if (isNaN(nisNumber)) {
      onShowToast('No. Absen harus berupa angka saja', 'error');
      return;
    }

    const itemData = {
      no: nisNumber,
      nama: formNama.trim(),
      jk: formJK,
      kelas_id: formKelasId,
      status: formStatus,
    };

    if (editingSantri) {
      onUpdateSantri({
        ...itemData,
        id: editingSantri.id,
      });
      onShowToast(`Siswa "${formNama}" berhasil diubah`, 'success');
    } else {
      onAddSantri(itemData);
      onShowToast(`Siswa "${formNama}" berhasil ditambahkan`, 'success');
    }

    setIsFormOpen(false);
  };

  // Delete student confirmed
  const handleConfirmDelete = () => {
    if (santriToDelete) {
      onDeleteSantri(santriToDelete.id);
      onShowToast(`Siswa "${santriToDelete.nama}" berhasil dihapus`, 'success');
      setSantriToDelete(null);
    }
  };

  // Export Santri List to CSV Excel
  const handleExportCSV = () => {
    try {
      let csvContent = 'No,No Absen,Nama,Jenis Kelamin,Kelas,Status\r\n';
      filteredSantri
        .sort((a, b) => a.no - b.no)
        .forEach((s, idx) => {
          const kName = kelas.find(k => k.id === s.kelas_id)?.nama || 'Tidak Diketahui';
          csvContent += `"${idx + 1}","${s.no}","${s.nama}","${s.jk}","${kName}","${s.status}"\r\n`;
        });

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `data_santri_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      onShowToast('Data siswa berhasil diekspor ke Excel', 'success');
    } catch (e) {
      onShowToast('Gagal mengekspor data', 'error');
    }
  };

  // File parsing for manual copy-paste Excel import
  // Format: "no., nama, kelas" or spreadsheet rows copy-paste
  const handleBulkImport = () => {
    if (!importText.trim()) {
      onShowToast('Kolom input copy-paste masih kosong', 'error');
      return;
    }

    try {
      const lines = importText.split('\n');
      const importedList: Omit<Santri, 'id'>[] = [];
      let skippedLinesCount = 0;

      lines.forEach(line => {
        if (!line.trim()) return;

        let parts: string[] = [];
        if (importDelimiter === 'tab') {
          parts = line.split('\t');
        } else if (importDelimiter === 'comma') {
          parts = line.split(',');
        } else {
          parts = line.split(';');
        }

        // We expect columns: [No. Absen, Nama, Nama Kelas, Gender (optional)]
        // e.g. "1\tAhmad Subarjo\t2 MTs A\tL"
        if (parts.length >= 2) {
          const rawNIS = parts[0].trim().replace(/"/g, '');
          const rawNama = parts[1].trim().replace(/"/g, '');
          const rawKelas = parts[2]?.trim().replace(/"/g, '') || '';
          const rawJK = parts[3]?.trim().toUpperCase().replace(/"/g, '') || 'L';

          const nisNum = parseInt(rawNIS, 10);
          
          // Match class ID based on name (case insensitive)
          let matchKelas = kelas.find(k => k.nama.toLowerCase() === rawKelas.toLowerCase());
          
          // Fallback, if class name doesn't match exactly, find partially, or use the first class
          if (!matchKelas && rawKelas) {
            matchKelas = kelas.find(k => k.nama.toLowerCase().includes(rawKelas.toLowerCase()));
          }
          const targetKelasId = matchKelas?.id || kelas[0]?.id || '';

          if (!isNaN(nisNum) && rawNama) {
            importedList.push({
              no: nisNum,
              nama: rawNama,
              jk: rawJK === 'P' || rawJK === 'PEREMPUAN' || rawJK === 'W' ? 'P' : 'L',
              kelas_id: targetKelasId,
              status: rawNama.toLowerCase().includes('*keluar') ? 'Keluar' : 'Aktif',
            });
          } else {
            skippedLinesCount++;
          }
        } else {
          skippedLinesCount++;
        }
      });

      if (importedList.length > 0) {
        onBulkAddSantri(importedList);
        onShowToast(`Sukses mengimpor ${importedList.length} siswa baru!`, 'success');
        if (skippedLinesCount > 0) {
          onShowToast(`Dilewati ${skippedLinesCount} baris data karena format tidak sesuai`, 'info');
        }
        setImportText('');
        setIsImportOpen(false);
      } else {
        onShowToast('Format data salah atau tidak ada data valid yang ditemukan', 'error');
      }
    } catch (e) {
      onShowToast('Gagal memproses data import. Periksa format kolom.', 'error');
    }
  };

  // CSV File upload selector reader
  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        // Automatically determine delimiter
        if (text.includes('\t')) setImportDelimiter('tab');
        else if (text.includes(';')) setImportDelimiter('semicolon');
        else setImportDelimiter('comma');

        setImportText(text);
        onShowToast('File CSV berhasil di-load. Silakan klik tombol "Proses Import" di bawah.', 'info');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {/* Header action bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl shadow-xs">
        <div className="space-y-1">
          <h2 className="text-xl font-bold font-display text-slate-800 dark:text-white flex items-center gap-2">
            <Users className="w-5.5 h-5.5 text-emerald-600 dark:text-emerald-400" />
            Pengelolaan Data Santri
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Tambah, edit, hapus, dan import data santri langsung dari Excel / spreadsheet.
          </p>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Add single button */}
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-600/10"
          >
            <Plus className="w-4 h-4" />
            Tambah Siswa
          </button>

          {/* Import Excel button */}
          <button
            onClick={() => setIsImportOpen(true)}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl border border-slate-200/50 dark:border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <FileUp className="w-4 h-4" />
            Import Excel
          </button>

          {/* Export button */}
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl border border-slate-200/50 dark:border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <FileDown className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Filters fast search row */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl shadow-xs flex flex-col md:flex-row gap-3.5 items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3 items-center w-full md:w-auto">
          {/* Search bar */}
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Cari No. Absen atau Nama..."
              className="w-full pl-8 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none focus:border-emerald-500"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
          </div>

          {/* Class Filter */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <label className="text-xs font-bold text-slate-400">Kelas:</label>
            <select
              value={filterKelas}
              onChange={e => setFilterKelas(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none focus:border-emerald-500 flex-1 sm:flex-initial"
            >
              <option value="all">Semua Kelas</option>
              {kelas.map(k => (
                <option key={k.id} value={k.id}>{k.nama}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <label className="text-xs font-bold text-slate-400">Status:</label>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none focus:border-emerald-500 flex-1 sm:flex-initial"
            >
              <option value="all">Semua Status</option>
              <option value="Aktif">Aktif</option>
              <option value="Keluar">Keluar</option>
            </select>
          </div>
        </div>

        <div className="text-xs font-medium text-slate-400">
          Menampilkan <strong className="text-slate-700 dark:text-slate-200">{filteredSantri.length}</strong> dari {santri.length} santri
        </div>
      </div>

      {/* Minimalist, Space-Efficient List of Students */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl overflow-hidden shadow-xs">
        {filteredSantri.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-12 text-center text-slate-500">
            <AlertTriangle className="w-10 h-10 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-medium">Tidak ada data santri ditemukan.</p>
            <p className="text-xs text-slate-400 mt-1">Coba sesuaikan kata kunci pencarian atau filter kelas Anda.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800/80 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-2.5 px-4 w-20 text-center">No. Absen</th>
                  <th className="py-2.5 px-4">Nama Lengkap</th>
                  <th className="py-2.5 px-4 w-20 text-center">L/P</th>
                  <th className="py-2.5 px-4 w-32">Kelas</th>
                  <th className="py-2.5 px-4 w-24 text-center">Status</th>
                  <th className="py-2.5 px-4 w-24 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
                {filteredSantri
                  .sort((a, b) => a.no - b.no)
                  .map((s) => {
                    const isKeluar = s.status === 'Keluar' || s.nama.toLowerCase().includes('*keluar');
                    const studentKelas = kelas.find(k => k.id === s.kelas_id);

                    return (
                      <tr 
                        key={s.id} 
                        className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/15 transition-colors ${
                          isKeluar ? 'bg-slate-50/40 dark:bg-slate-900/20 opacity-60' : ''
                        }`}
                      >
                        {/* Attendance Number */}
                        <td className="py-2 px-4 text-center font-mono font-bold text-slate-600 dark:text-slate-350">
                          <span className="inline-block px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-md text-xs">
                            {String(s.no).padStart(2, '0')}
                          </span>
                        </td>

                        {/* Name */}
                        <td className="py-2 px-4 font-semibold text-slate-800 dark:text-slate-100">
                          <div className="truncate max-w-[180px] sm:max-w-xs md:max-w-md" title={s.nama}>
                            {s.nama}
                          </div>
                        </td>

                        {/* Gender Badge */}
                        <td className="py-2 px-4 text-center">
                          <span className={`inline-block text-[9px] font-black px-2 py-0.5 rounded-md ${
                            s.jk === 'L' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' : 'bg-pink-500/10 text-pink-600 dark:text-pink-400'
                          }`}>
                            {s.jk === 'L' ? 'L' : 'P'}
                          </span>
                        </td>

                        {/* Class */}
                        <td className="py-2 px-4 text-slate-600 dark:text-slate-300 font-medium">
                          {studentKelas?.nama || 'Tanpa Kelas'}
                        </td>

                        {/* Status */}
                        <td className="py-2 px-4 text-center">
                          <span className={`inline-block text-[9px] font-black px-2 py-0.5 rounded-md ${
                            isKeluar ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          }`}>
                            {isKeluar ? 'KELUAR' : 'AKTIF'}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-2 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleOpenEdit(s)}
                              className="p-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg transition-colors cursor-pointer border border-slate-100 dark:border-slate-800/80"
                              title="Edit Data Santri"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => setSantriToDelete(s)}
                              className="p-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-900/30 text-rose-600 rounded-lg transition-colors cursor-pointer border border-rose-100 dark:border-rose-950/20"
                              title="Hapus Data Santri"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CRUD Add/Edit Pop-up Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold font-display text-slate-800 dark:text-white">
                {editingSantri ? 'Edit Data Santri' : 'Tambah Santri Baru'}
              </h3>
              <button
                onClick={() => setIsFormOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg bg-slate-50 dark:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3.5">
              {/* No. Absen input */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">No. Absen (Nomor Absen)</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: 1"
                  value={formNIS}
                  onChange={e => setFormNIS(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none focus:border-emerald-500"
                />
              </div>

              {/* Nama input */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Nama Lengkap Santri</label>
                <input
                  type="text"
                  required
                  placeholder="Masukkan nama siswa..."
                  value={formNama}
                  onChange={e => setFormNama(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none focus:border-emerald-500"
                />
                <span className="text-[9px] text-slate-400 mt-1 block">
                  Catatan: ketik <strong>*keluar</strong> pada akhir nama untuk memblokir presensi otomatis.
                </span>
              </div>

              {/* Gender and Class selection */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Jenis Kelamin</label>
                  <select
                    value={formJK}
                    onChange={e => setFormJK(e.target.value as 'L' | 'P')}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none focus:border-emerald-500"
                  >
                    <option value="L">Laki-laki (L)</option>
                    <option value="P">Perempuan (P)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Kelas</label>
                  <select
                    value={formKelasId}
                    onChange={e => setFormKelasId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none focus:border-emerald-500"
                  >
                    {kelas.map(k => (
                      <option key={k.id} value={k.id}>{k.nama}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Status selection */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Status Keaktifan</label>
                <select
                  value={formStatus}
                  onChange={e => setFormStatus(e.target.value as 'Aktif' | 'Keluar')}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none focus:border-emerald-500"
                >
                  <option value="Aktif">Aktif (Bisa Absen)</option>
                  <option value="Keluar">Keluar / Berhenti (Diblokir)</option>
                </select>
              </div>

              <div className="flex gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition-colors cursor-pointer shadow-md shadow-emerald-600/10"
                >
                  {editingSantri ? 'Simpan Perubahan' : 'Tambah Santri'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* EXCEL BULK IMPORT POP-UP MODAL */}
      {isImportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 max-w-xl w-full shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold font-display text-slate-800 dark:text-white flex items-center gap-1.5">
                <FileUp className="w-5 h-5 text-emerald-600" />
                Import Bulk Data Santri dari Excel
              </h3>
              <button
                onClick={() => setIsImportOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg bg-slate-50 dark:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="bg-emerald-500/10 p-3.5 rounded-xl border border-emerald-500/15 text-xs text-emerald-800 dark:text-emerald-300">
                <p className="font-bold mb-1">Format Kolom Spreadsheet:</p>
                <p>Kolom 1: <strong>No. Absen (Angka)</strong></p>
                <p>Kolom 2: <strong>Nama Santri</strong></p>
                <p>Kolom 3: <strong>Nama Kelas</strong> (Contoh: <code className="bg-black/10 px-1 rounded font-bold">2 MTs A</code>)</p>
                <p>Kolom 4: <strong>L / P</strong> (Jenis Kelamin, opsional, default Laki-laki)</p>
                <p className="mt-2 text-[11px] opacity-80">
                  * Ustadz dapat meng-copy langsung dari file Excel/Google Sheets dan melakukan paste di kotak teks di bawah, atau upload file CSV.
                </p>
              </div>

              {/* Delimiter selector */}
              <div className="flex items-center gap-3">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">Pemisah Kolom:</label>
                <div className="flex gap-2">
                  {[
                    { value: 'tab', label: 'Tab (Copy-Paste Excel)' },
                    { value: 'comma', label: 'Koma (,)' },
                    { value: 'semicolon', label: 'Titik Koma (;)' },
                  ].map(del => (
                    <button
                      key={del.value}
                      type="button"
                      onClick={() => setImportDelimiter(del.value as any)}
                      className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border transition-all cursor-pointer ${
                        importDelimiter === del.value
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {del.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Upload file CSV */}
              <div className="border border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-3 bg-slate-50/50 dark:bg-slate-800/20 text-center">
                <label className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer block">
                  Atau klik untuk upload file CSV (.csv)
                  <input
                    type="file"
                    accept=".csv,.txt"
                    onChange={handleCSVUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Text area for copy paste */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Paste Baris Spreadsheet Anda di Sini:</label>
                <textarea
                  rows={6}
                  value={importText}
                  onChange={e => setImportText(e.target.value)}
                  placeholder="Format:&#10;1&#9;Ahmad Subarjo&#9;2 MTs A&#9;L&#10;2&#9;Ridho Firmansyah&#9;2 MTs B&#9;L&#10;3&#9;Siti Aminah *keluar&#9;2 MTs A&#9;P"
                  className="w-full p-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-700 dark:text-slate-200 outline-none focus:border-emerald-500 resize-none"
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsImportOpen(false)}
                  className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleBulkImport}
                  className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition-colors cursor-pointer shadow-md shadow-emerald-600/10"
                >
                  Proses Import Bulk
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Deletion Confirmation Modal */}
      {santriToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4"
          >
            <div className="p-3 bg-rose-500/10 text-rose-600 rounded-2xl w-fit">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold font-display text-slate-800 dark:text-white">
                Hapus Data Santri?
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Apakah Anda yakin ingin menghapus siswa <strong>{santriToDelete.nama}</strong> (No. Absen: {santriToDelete.no})?
                Tindakan ini akan menghapus siswa ini secara permanen dari daftar siswa kelas.
              </p>
            </div>

            <div className="flex gap-2.5">
              <button
                onClick={() => setSantriToDelete(null)}
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
