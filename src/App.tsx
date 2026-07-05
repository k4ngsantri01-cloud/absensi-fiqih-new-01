/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Home,
  Calendar,
  ClipboardCheck,
  FileText,
  Users,
  Settings,
  Sun,
  Moon,
  Smartphone,
  RefreshCw,
  X,
  Menu,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from './lib/db';
import {
  Kelas,
  Santri,
  MataPelajaran,
  Hissoh,
  Jadwal,
  Absensi,
  Semester,
  TahunAjaran,
  SupabaseConfig,
  ActiveTab
} from './types';

// Importing Tab Components
import DashboardTab from './components/DashboardTab';
import JadwalTab from './components/JadwalTab';
import PresensiTab from './components/PresensiTab';
import RekapTab from './components/RekapTab';
import SantriTab from './components/SantriTab';
import SettingTab from './components/SettingTab';
import Toast, { ToastMessage } from './components/Toast';

export default function App() {
  // Theme state
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('theme') === 'dark' || 
           (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  // Load last saved page or default to 'dashboard'
  const [activeTab, setActiveTab] = useState<ActiveTab>(() => {
    return db.getLastSavedPage() as ActiveTab;
  });

  // Skeleton Loading State
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isPulling, setIsPulling] = useState<boolean>(false);

  // States mirroring database
  const [kelas, setKelas] = useState<Kelas[]>([]);
  const [santri, setSantri] = useState<Santri[]>([]);
  const [mapel, setMapel] = useState<MataPelajaran[]>([]);
  const [hissoh, setHissoh] = useState<Hissoh[]>([]);
  const [jadwal, setJadwal] = useState<Jadwal[]>([]);
  const [absensi, setAbsensi] = useState<Absensi[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [tahunAjarans, setTahunAjarans] = useState<TahunAjaran[]>([]);
  const [supabaseConfig, setSupabaseConfig] = useState<SupabaseConfig>(db.getSupabaseConfig());

  // Active presensi session state (null when not recording)
  const [activeSession, setActiveSession] = useState<{
    kelasId: string;
    mapelId: string;
    hissohId: string;
    tanggal: string;
  } | null>(null);

  // Toasts state
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // PWA install banner prompt state
  const [showPwaBanner, setShowPwaBanner] = useState<boolean>(() => {
    return localStorage.getItem('hide_pwa_banner') !== 'true';
  });
  const [showPwaModal, setShowPwaModal] = useState<boolean>(false);

  // Tablet Sidebar Expand state
  const [isSidebarExpanded, setIsSidebarExpanded] = useState<boolean>(true);

  // Load all data on mount
  useEffect(() => {
    const initializeApp = async () => {
      // Initialize cache from Supabase (or seed data if not configured)
      await db.initializeData();
      
      // Load data into React state
      loadAllData();
      
      // Auto check Supabase connection on startup if .env variables are set
      const currentConfig = db.getSupabaseConfig();
      if (currentConfig.url && currentConfig.anonKey) {
        const result = await db.testSupabase(currentConfig.url, currentConfig.anonKey);
        if (result.success) {
          const updatedConfig: SupabaseConfig = {
            ...currentConfig,
            connected: true,
            latency: result.latency,
            mode: 'online', // Auto-enable online mode when connected
          };
          db.saveSupabaseConfig(updatedConfig);
          setSupabaseConfig(updatedConfig);
          // Sync/pull data on startup from Supabase to stay updated
          await db.syncAllFromSupabase();
          loadAllData();
        } else {
          const updatedConfig: SupabaseConfig = {
            ...currentConfig,
            connected: false,
            latency: 0,
          };
          db.saveSupabaseConfig(updatedConfig);
          setSupabaseConfig(updatedConfig);
        }
      }
      
      // Simulate initial load to show skeleton loading (< 2 seconds)
      setTimeout(() => {
        setIsLoading(false);
      }, 1200);
    };

    initializeApp();
  }, []);

  // Update theme html class
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  // Persist Active Tab changes
  useEffect(() => {
    // If we are currently entering a presensi session, don't override the general activeTab,
    // but save it appropriately
    if (activeTab !== 'presensi') {
      db.saveLastPage(activeTab);
    }
  }, [activeTab]);

  const loadAllData = () => {
    setKelas(db.getKelas());
    setSantri(db.getSantri());
    setMapel(db.getMapel());
    setHissoh(db.getHissoh());
    setJadwal(db.getJadwal());
    setAbsensi(db.getAbsensi());
    setSemesters(db.getSemester());
    setTahunAjarans(db.getTahunAjaran());
    setSupabaseConfig(db.getSupabaseConfig());
  };

  // Toast dispatch helper
  const triggerToast = (text: string, type: 'success' | 'error' | 'info') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, text, type }]);
  };

  const handleDismissToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Perform full reload / simulated refresh
  const handleRefresh = () => {
    setIsPulling(true);
    triggerToast('Memperbarui data dan status...', 'info');
    
    // Auto sync from Supabase if configured & online
    if (supabaseConfig.url && supabaseConfig.anonKey && supabaseConfig.mode === 'online') {
      db.syncAllFromSupabase().then(res => {
        loadAllData();
        setIsPulling(false);
        if (res.success) {
          triggerToast('Sinkronisasi Supabase Sukses!', 'success');
        } else {
          triggerToast(res.message, 'error');
        }
      });
    } else {
      setTimeout(() => {
        loadAllData();
        setIsPulling(false);
        triggerToast('Halaman berhasil diperbarui', 'success');
      }, 800);
    }
  };

  // Database actions callbacks
  const handleUpdateKelas = (data: Kelas[]) => {
    db.saveKelas(data);
    setKelas(data);
  };

  const handleUpdateMapel = (data: MataPelajaran[]) => {
    db.saveMapel(data);
    setMapel(data);
  };

  const handleUpdateHissoh = (data: Hissoh[]) => {
    db.saveHissoh(data);
    setHissoh(data);
  };

  const handleUpdateJadwal = (data: Jadwal[]) => {
    db.saveJadwal(data);
    setJadwal(data);
  };

  const handleUpdateSemesters = (data: Semester[]) => {
    db.saveSemester(data);
    setSemesters(data);
  };

  const handleUpdateTahunAjarans = (data: TahunAjaran[]) => {
    db.saveTahunAjaran(data);
    setTahunAjarans(data);
  };

  const handleUpdateSupabaseConfig = (config: SupabaseConfig) => {
    db.saveSupabaseConfig(config);
    setSupabaseConfig(config);
  };

  // Bulk add student helper (for import excel)
  const handleBulkAddSantri = (items: Omit<Santri, 'id'>[]) => {
    const currentList = db.getSantri();
    const newItems = items.map((item, idx) => ({
      ...item,
      id: 's_bulk_' + Date.now() + '_' + idx,
    }));
    const combined = [...currentList, ...newItems];
    db.saveSantri(combined);
    setSantri(combined);
  };

  // Single student actions
  const handleAddSantri = (item: Omit<Santri, 'id'>) => {
    db.addSantri(item);
    setSantri(db.getSantri());
  };

  const handleUpdateSantri = (item: Santri) => {
    db.updateSantri(item);
    setSantri(db.getSantri());
  };

  const handleDeleteSantri = (id: string) => {
    db.deleteSantri(id);
    setSantri(db.getSantri());
  };

  // Attendance Save logic
  // "setelah melakukan absensi, kosongkan halaman absensi dan jika dibuka kedua kalinya berubah menjadi edit data. dan jika keluar dari halaman absensi halaman otomatis dibersihan."
  const handleSavePresensi = (records: Absensi[]) => {
    db.saveBatchAbsensi(records);
    const updatedAbsensi = db.getAbsensi();
    setAbsensi(updatedAbsensi);
    
    // Clear active session page & reset back to original tab
    setActiveSession(null);
    setActiveTab('jadwal');
    triggerToast('Data presensi berhasil disimpan', 'success');
  };

  const handleCancelPresensi = () => {
    setActiveSession(null);
    setActiveTab('jadwal');
    triggerToast('Halaman presensi dibersihkan', 'info');
  };

  const handleStartPresensi = (kelasId: string, mapelId: string, hissohId: string, customDate?: string) => {
    const getLocalString = () => {
      const d = new Date();
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    const targetDate = customDate || getLocalString();
    setActiveSession({
      kelasId,
      mapelId,
      hissohId,
      tanggal: targetDate,
    });
    setActiveTab('presensi');
  };

  const handleDeleteSession = (tanggal: string, kelasId: string, mapelId: string, hissohId: string) => {
    db.deleteAbsensiForSession(tanggal, kelasId, mapelId, hissohId);
    const updatedAbsensi = db.getAbsensi();
    setAbsensi(updatedAbsensi);
  };

  // Close PWA banner
  const handleHidePwaBanner = () => {
    localStorage.setItem('hide_pwa_banner', 'true');
    setShowPwaBanner(false);
  };

  // Navigation Items array
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <Home className="w-5 h-5" /> },
    { id: 'jadwal', label: 'Jadwal Hari Ini', icon: <Calendar className="w-5 h-5" /> },
    { id: 'rekap', label: 'Rekap Presensi', icon: <FileText className="w-5 h-5" /> },
    { id: 'santri', label: 'Data Santri', icon: <Users className="w-5 h-5" /> },
    { id: 'setting', label: 'Pengaturan', icon: <Settings className="w-5 h-5" /> },
  ] as const;

  return (
    <div className={`min-h-screen flex flex-col md:flex-row bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans transition-colors duration-200 ${darkMode ? 'dark' : ''}`}>
      
      {/* 1. SIDEBAR LEFT: Desktop & Tablet Collapse */}
      <aside className={`hidden md:flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200/60 dark:border-slate-800/80 transition-all duration-300 z-30 shrink-0 overflow-x-hidden ${
        isSidebarExpanded ? 'w-64' : 'w-20'
      }`}>
        {/* Sidebar Header Brand */}
        <div className={`h-16 flex items-center ${isSidebarExpanded ? 'justify-between px-4' : 'justify-center'} border-b border-slate-100 dark:border-slate-800 transition-all duration-300`}>
          {isSidebarExpanded ? (
            <>
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="h-9 w-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-black font-display text-sm tracking-tighter shrink-0 shadow-lg shadow-emerald-600/20">
                  FQ
                </div>
                <div className="leading-none whitespace-nowrap">
                  <span className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">ABSENSI</span>
                  <span className="text-sm font-black font-display tracking-tight text-slate-800 dark:text-white block mt-0.5">Fiqih New OE</span>
                </div>
              </div>
              <button
                onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
                className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
              >
                <Menu className="w-4 h-4" />
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
              className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-500 hover:text-emerald-650 dark:hover:text-emerald-400 transition-all cursor-pointer flex items-center justify-center shadow-xs hover:scale-105"
              title="Perbesar Menu Sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(item => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (activeSession) {
                    // Alert or clean up session
                    setActiveSession(null);
                  }
                  setActiveTab(item.id);
                }}
                className={`w-full flex items-center ${
                  isSidebarExpanded ? 'justify-start gap-3 px-3.5' : 'justify-center px-0'
                } py-3 rounded-2xl text-xs font-black transition-all relative cursor-pointer ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/10'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/50 dark:hover:bg-white/5'
                }`}
                title={!isSidebarExpanded ? item.label : undefined}
              >
                <div className="shrink-0 flex items-center justify-center">{item.icon}</div>
                {isSidebarExpanded && <span className="font-display tracking-tight whitespace-nowrap">{item.label}</span>}
                {isActive && isSidebarExpanded && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="absolute right-3 w-1.5 h-1.5 rounded-full bg-white"
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer Utilities */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
          {/* Theme switcher */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`w-full flex items-center ${
              isSidebarExpanded ? 'justify-start gap-3 px-3.5' : 'justify-center px-0'
            } py-3 rounded-2xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100/50 dark:hover:bg-white/5 transition-colors cursor-pointer`}
            title={!isSidebarExpanded ? (darkMode ? 'Mode Terang' : 'Mode Gelap') : undefined}
          >
            <div className="shrink-0 flex items-center justify-center">
              {darkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-500" />}
            </div>
            {isSidebarExpanded && <span className="whitespace-nowrap">{darkMode ? 'Mode Terang' : 'Mode Gelap'}</span>}
          </button>

          {/* Quick Refresh trigger */}
          <button
            onClick={handleRefresh}
            className={`w-full flex items-center ${
              isSidebarExpanded ? 'justify-start gap-3 px-3.5' : 'justify-center px-0'
            } py-3 rounded-2xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100/50 dark:hover:bg-white/5 transition-colors cursor-pointer`}
            title={!isSidebarExpanded ? 'Perbarui Halaman' : undefined}
          >
            <div className="shrink-0 flex items-center justify-center">
              <RefreshCw className={`w-5 h-5 text-slate-400 ${isPulling ? 'animate-spin' : ''}`} />
            </div>
            {isSidebarExpanded && <span className="whitespace-nowrap">Perbarui Halaman</span>}
          </button>
        </div>
      </aside>

      {/* 2. MAIN WORKSPACE CONTAINER */}
      <main className="flex-1 flex flex-col min-w-0 pb-24 md:pb-0 h-screen overflow-y-auto relative">
        {/* Desktop top brand header / Mobile navigation bar */}
        <header className="h-16 border-b border-slate-200/50 dark:border-slate-800/80 bg-white/75 dark:bg-slate-900/75 backdrop-blur-md flex items-center justify-between px-5 sticky top-0 z-20">
          
          {/* Logo brand for Mobile screens */}
          <div className="flex items-center gap-2.5 md:hidden">
            <div className="h-8 w-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-black font-display text-xs">
              FQ
            </div>
            <span className="font-bold font-display text-slate-800 dark:text-white leading-none">
              Fiqih Absensi
            </span>
          </div>

          <div className="hidden md:flex items-center gap-2 text-xs text-slate-400 font-medium">
            <span>Aplikasi Absensi Guru</span>
            <span>•</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded">PWA Standalone</span>
          </div>

          {/* Top Header Controls (Mobile Utilities) */}
          <div className="flex items-center gap-2">
            {/* PWA mobile install indicator helper */}
            {showPwaBanner && (
              <button
                onClick={() => setShowPwaModal(true)}
                className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 transition-colors flex items-center gap-1.5 text-xs font-bold border border-emerald-500/10 cursor-pointer"
              >
                <Smartphone className="w-4 h-4 animate-bounce" />
                <span className="hidden sm:inline">Install PWA</span>
              </button>
            )}

            {/* Mobile-only Theme selector */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 md:hidden rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Pull to refresh mobile simulation */}
            <button
              onClick={handleRefresh}
              className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isPulling ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </header>

        {/* 3. CORE ROUTE VIEWS IN MAIN INNER CONTAINER */}
        <div className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          
          {/* Pull to Refresh Animated Indicator */}
          <AnimatePresence>
            {isPulling && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 60, opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-500"
              >
                <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
                Sedang memuat ulang data...
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main loader / update flash skeleton */}
          {isLoading ? (
            <div className="space-y-6">
              <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded-3xl animate-pulse" />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="h-20 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
                <div className="h-20 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
                <div className="h-20 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
              </div>
              <div className="h-80 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.18 }}
              >
                {activeTab === 'dashboard' && (
                  <DashboardTab
                    kelas={kelas}
                    santri={santri}
                    mapel={mapel}
                    hissoh={hissoh}
                    jadwal={jadwal}
                    absensi={absensi}
                    semesters={semesters}
                    tahunAjarans={tahunAjarans}
                    onNavigate={(tab) => {
                      if (tab === 'presensi') return;
                      setActiveTab(tab);
                    }}
                    onStartPresensi={handleStartPresensi}
                  />
                )}

                {activeTab === 'jadwal' && (
                  <JadwalTab
                    kelas={kelas}
                    mapel={mapel}
                    hissoh={hissoh}
                    jadwal={jadwal}
                    absensi={absensi}
                    onStartPresensi={handleStartPresensi}
                  />
                )}

                {activeTab === 'presensi' && (
                  <PresensiTab
                    activeSession={activeSession}
                    kelas={kelas}
                    santri={santri}
                    mapel={mapel}
                    hissoh={hissoh}
                    absensi={absensi}
                    onSave={handleSavePresensi}
                    onCancel={handleCancelPresensi}
                  />
                )}

                {activeTab === 'rekap' && (
                  <RekapTab
                    kelas={kelas}
                    santri={santri}
                    mapel={mapel}
                    hissoh={hissoh}
                    absensi={absensi}
                    semesters={semesters}
                    tahunAjarans={tahunAjarans}
                    onDeleteSession={handleDeleteSession}
                    onShowToast={triggerToast}
                  />
                )}

                {activeTab === 'santri' && (
                  <SantriTab
                    kelas={kelas}
                    santri={santri}
                    onAddSantri={handleAddSantri}
                    onUpdateSantri={handleUpdateSantri}
                    onDeleteSantri={handleDeleteSantri}
                    onBulkAddSantri={handleBulkAddSantri}
                    onShowToast={triggerToast}
                  />
                )}

                {activeTab === 'setting' && (
                  <SettingTab
                    kelas={kelas}
                    mapel={mapel}
                    hissoh={hissoh}
                    jadwal={jadwal}
                    semesters={semesters}
                    tahunAjarans={tahunAjarans}
                    supabaseConfig={supabaseConfig}
                    onUpdateKelas={handleUpdateKelas}
                    onUpdateMapel={handleUpdateMapel}
                    onUpdateHissoh={handleUpdateHissoh}
                    onUpdateJadwal={handleUpdateJadwal}
                    onUpdateSemesters={handleUpdateSemesters}
                    onUpdateTahunAjarans={handleUpdateTahunAjarans}
                    onUpdateSupabaseConfig={handleUpdateSupabaseConfig}
                    onTestSupabase={db.testSupabase}
                    onPushSupabase={db.syncAllToSupabase}
                    onPullSupabase={db.syncAllFromSupabase}
                    onShowToast={triggerToast}
                    totalSantri={santri.length}
                    totalAbsensi={absensi.length}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </main>

      {/* 4. BOTTOM NAVIGATION BAR: Mobile view only */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white dark:bg-slate-900 border-t border-slate-200/60 dark:border-slate-800/80 h-16 flex items-center justify-around z-30 px-2 shadow-xl backdrop-blur-md">
        {navItems.map(item => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                if (activeSession) {
                  setActiveSession(null);
                }
                setActiveTab(item.id);
              }}
              className={`flex flex-col items-center justify-center flex-1 h-full cursor-pointer relative ${
                isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'
              }`}
            >
              <div className="relative">
                {item.icon}
                {isActive && (
                  <motion.div
                    layoutId="activeDot"
                    className="absolute -top-1.5 -right-1.5 w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400"
                  />
                )}
              </div>
              <span className="text-[10px] font-semibold font-sans mt-1.5 leading-none tracking-wide">
                {item.id === 'rekap' ? 'Rekap' : item.id === 'santri' ? 'Santri' : item.id === 'setting' ? 'Pengaturan' : item.label.split(' ')[0]}
              </span>
            </button>
          );
        })}
      </nav>

      {/* 5. GLOBAL FLOATING TOAST NOTIFIER */}
      <Toast toasts={toasts} onDismiss={handleDismissToast} />

      {/* 6. PWA INSTALL MODAL GUIDE */}
      <AnimatePresence>
        {showPwaModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-2xl w-fit">
                  <Smartphone className="w-6 h-6" />
                </div>
                <button
                  onClick={() => setShowPwaModal(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg bg-slate-50 dark:bg-slate-850 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-1">
                <h3 className="text-base font-bold font-display text-slate-800 dark:text-white flex items-center gap-1.5">
                  Install Aplikasi (PWA)
                  <Sparkles className="w-4 h-4 text-emerald-500 animate-pulse" />
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Aplikasi **Absensi Fiqih New OE** dapat diinstal langsung ke layar utama HP Android, iPhone, maupun Laptop Anda tanpa mendownload dari Play Store!
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl space-y-2 text-xs border border-slate-150 dark:border-slate-800">
                <p className="font-bold">📱 Cara install di HP:</p>
                <ol className="list-decimal list-inside space-y-1 text-slate-600 dark:text-slate-300">
                  <li>Klik tombol menu titik tiga (<strong>⋮</strong>) di pojok kanan atas browser (Chrome / Edge).</li>
                  <li>Pilih menu <strong>"Tambahkan ke Layar Utama"</strong> atau <strong>"Instal Aplikasi"</strong>.</li>
                  <li>Konfirmasi dan tunggu ikon aplikasi muncul di HP Anda.</li>
                </ol>
              </div>

              <div className="flex gap-2.5">
                <button
                  onClick={handleHidePwaBanner}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
                >
                  Jangan Tampilkan Lagi
                </button>
                <button
                  onClick={() => setShowPwaModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition-colors cursor-pointer shadow-md shadow-emerald-600/10"
                >
                  Mengerti
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
