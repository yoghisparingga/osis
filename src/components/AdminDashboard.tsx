import React, { useState, useEffect } from 'react';
import type { Candidate, ElectionSettings, ElectionStats, VoteRecord } from '../types/voting.ts';
import { exportToPDF, exportToExcel, exportToCSV } from '../utils/exportReports.ts';
import { CandidateImage } from './CandidateImage.tsx';
import { 
  BarChart3, 
  PieChart, 
  Users, 
  FileSpreadsheet, 
  FileText, 
  Download, 
  Lock, 
  Unlock, 
  RefreshCw, 
  Search, 
  CheckCircle, 
  Settings, 
  Trash2, 
  Edit3, 
  AlertTriangle,
  Radio,
  Eye,
  LogOut,
  ChevronDown,
  ShieldCheck,
  Image as ImageIcon
} from 'lucide-react';

interface AdminDashboardProps {
  stats: ElectionStats;
  candidates: Candidate[];
  settings: ElectionSettings;
  adminPin: string;
  onUpdateCandidate: (candidate: Candidate) => Promise<boolean>;
  onToggleVotingStatus: () => Promise<boolean>;
  onResetVotes: (confirmText: string) => Promise<boolean>;
  onUpdateSettings: (newSettings: Partial<ElectionSettings>) => Promise<boolean>;
  onShowToast?: (type: 'success' | 'warning' | 'error' | 'info', title: string, message: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  stats,
  candidates,
  settings,
  adminPin,
  onUpdateCandidate,
  onToggleVotingStatus,
  onResetVotes,
  onUpdateSettings,
  onShowToast
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('evoting_admin_auth') === 'true';
  });
  const [inputPin, setInputPin] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);

  // Tab navigation in admin
  const [activeTab, setActiveTab] = useState<'rekap' | 'log' | 'kandidat' | 'pengaturan'>('rekap');

  // Logs state
  const [voterLogs, setVoterLogs] = useState<(VoteRecord & { candidateName?: string })[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Editing candidate
  const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null);
  const [isSavingCandidate, setIsSavingCandidate] = useState(false);

  // Reset dialog
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [resetConfirmInput, setResetConfirmInput] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  // Settings form
  const [settingsForm, setSettingsForm] = useState({
    schoolName: settings.schoolName,
    title: settings.title,
    academicYear: settings.academicYear,
    totalEligibleVoters: settings.totalEligibleVoters,
    adminPin: settings.adminPin
  });
  const [settingsSuccess, setSettingsSuccess] = useState(false);

  // Fetch full voter logs
  const fetchLogs = async () => {
    setIsLoadingLogs(true);
    try {
      const res = await fetch('/api/admin/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: adminPin })
      });
      const data = await res.json();
      if (data.success && data.votes) {
        setVoterLogs(data.votes);
      }
    } catch (err) {
      console.error('Failed to load voter logs:', err);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchLogs();
    }
  }, [isAuthenticated, stats.totalVotes]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputPin === adminPin) {
      setIsAuthenticated(true);
      sessionStorage.setItem('evoting_admin_auth', 'true');
      setPinError(null);
      onShowToast?.('success', 'Autentikasi Berhasil', 'Selamat datang di Dasbor Pengawas Pemilihan OSIS.');
    } else {
      setPinError('PIN Admin salah. Silakan coba kembali.');
      onShowToast?.('error', 'PIN Salah', 'PIN yang dimasukkan tidak sesuai.');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('evoting_admin_auth');
    setInputPin('');
    onShowToast?.('info', 'Sesi Berakhir', 'Anda telah keluar dari mode admin.');
  };

  const handleSaveCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCandidate) return;
    setIsSavingCandidate(true);
    const ok = await onUpdateCandidate(editingCandidate);
    setIsSavingCandidate(false);
    if (ok) {
      onShowToast?.('success', 'Data Paslon Disimpan', `Profil Paslon 0${editingCandidate.number} berhasil diperbarui.`);
      setEditingCandidate(null);
    } else {
      onShowToast?.('error', 'Gagal Menyimpan', 'Terjadi kesalahan saat memperbarui data paslon.');
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await onUpdateSettings(settingsForm);
    if (ok) {
      setSettingsSuccess(true);
      onShowToast?.('success', 'Pengaturan Disimpan', 'Konfigurasi pemilihan OSIS berhasil diperbarui.');
      setTimeout(() => setSettingsSuccess(false), 3000);
    }
  };

  const handleToggleStatusWithToast = async () => {
    const ok = await onToggleVotingStatus();
    if (ok) {
      const nextStatus = !settings.isVotingOpen;
      onShowToast?.(
        nextStatus ? 'success' : 'warning',
        nextStatus ? 'TPS Dibuka' : 'TPS Ditutup',
        nextStatus ? 'Bilik suara kini aktif dan siswa dapat memilih.' : 'Bilik suara sedang ditutup sementara.'
      );
    }
  };

  const handleExecuteReset = async () => {
    if (resetConfirmInput !== 'RESET_SEMUA_SUARA') return;
    setIsResetting(true);
    const ok = await onResetVotes(resetConfirmInput);
    setIsResetting(false);
    if (ok) {
      setShowResetDialog(false);
      setResetConfirmInput('');
      setVoterLogs([]);
      onShowToast?.('info', 'Reset Suara Berhasil', 'Seluruh data suara telah dikosongkan untuk gladi bersih.');
    }
  };

  // If not authenticated, show PIN prompt
  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto px-4 py-12">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-8 text-center space-y-5">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
            <Lock className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 font-display">Akses Dasbor Admin</h2>
            <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
              Masukkan PIN Admin untuk memantau rekapitulasi suara real-time dan mengunduh laporan resmi
            </p>
          </div>

          {pinError && (
            <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-2xl border border-rose-200">
              {pinError}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input
                type="password"
                inputMode="numeric"
                maxLength={6}
                value={inputPin}
                onChange={e => setInputPin(e.target.value)}
                placeholder="PIN Admin (Default: 2026)"
                className="w-full text-center text-lg tracking-widest font-mono py-3.5 px-4 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all text-slate-900"
                autoFocus
              />
              <p className="text-[11px] text-slate-400 mt-1">
                PIN default adalah <strong>2026</strong>
              </p>
            </div>

            <button
              type="submit"
              className="w-full h-12 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md active:scale-[0.98] transition-all"
            >
              Masuk ke Dasbor Pengawas
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Filter voter logs
  const filteredLogs = voterLogs.filter(log => {
    const q = searchQuery.toLowerCase();
    return (
      log.voterName.toLowerCase().includes(q) ||
      log.voterPhone.includes(q) ||
      log.receiptCode.toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-3 space-y-5">
      {/* Top Admin Header */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Real-Time Stream
            </span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs text-slate-500">{settings.schoolName}</span>
          </div>
          <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 mt-1 font-display">
            Dasbor Pengawas Pemilihan OSIS
          </h1>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Quick TPS status toggle */}
          <button
            onClick={handleToggleStatusWithToast}
            className={`flex-1 sm:flex-none h-10 px-3.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${
              settings.isVotingOpen 
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
            }`}
          >
            {settings.isVotingOpen ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
            {settings.isVotingOpen ? 'TPS: Terbuka' : 'TPS: Ditutup'}
          </button>

          <button
            onClick={fetchLogs}
            className="w-10 h-10 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 flex items-center justify-center transition-colors"
            title="Refresh Data Log"
          >
            <RefreshCw className={`w-4 h-4 ${isLoadingLogs ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleLogout}
            className="w-10 h-10 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 flex items-center justify-center transition-colors"
            title="Keluar Admin"
          >
            <LogOut className="w-4 h-4 text-slate-500" />
          </button>
        </div>
      </div>

      {/* Quick Export Strip (Mobile responsive cards) */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 p-4 sm:p-5 rounded-3xl text-white shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-3 border border-white/10">
        <div>
          <h3 className="text-sm font-bold flex items-center gap-2 font-display">
            <Download className="w-4 h-4 text-blue-300" />
            Ekspor Laporan Resmi Pemilihan
          </h3>
          <p className="text-xs text-slate-300 mt-0.5">
            Unduh rekapitulasi suara, grafik persentase, dan log pemilih langsung ke HP
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* PDF Button */}
          <button
            onClick={() => {
              exportToPDF(stats, candidates, settings, voterLogs);
              onShowToast?.('success', 'Ekspor PDF Dimulai', 'Dokumen Berita Acara sedang diunduh.');
            }}
            className="flex-1 sm:flex-none h-10 px-3.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-[0.98]"
          >
            <FileText className="w-3.5 h-3.5" />
            PDF (Berita Acara)
          </button>

          {/* Excel Button */}
          <button
            onClick={() => {
              exportToExcel(stats, candidates, settings, voterLogs);
              onShowToast?.('success', 'Ekspor Excel Dimulai', 'File spreadsheet (.xlsx) sedang diunduh.');
            }}
            className="flex-1 sm:flex-none h-10 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-[0.98]"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Excel (.xlsx)
          </button>

          {/* CSV Button */}
          <button
            onClick={() => {
              exportToCSV(voterLogs);
              onShowToast?.('info', 'Ekspor CSV Selesai', 'Data teks CSV telah diunduh.');
            }}
            className="flex-1 sm:flex-none h-10 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            CSV Mentah
          </button>
        </div>
      </div>

      {/* Admin Tabs */}
      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl text-xs font-semibold overflow-x-auto">
        <button
          onClick={() => setActiveTab('rekap')}
          className={`py-2 px-3.5 rounded-xl whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            activeTab === 'rekap' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          Perolehan Suara
        </button>
        <button
          onClick={() => setActiveTab('log')}
          className={`py-2 px-3.5 rounded-xl whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            activeTab === 'log' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          Daftar Pemilih ({stats.totalVotes})
        </button>
        <button
          onClick={() => setActiveTab('kandidat')}
          className={`py-2 px-3.5 rounded-xl whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            activeTab === 'kandidat' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Edit3 className="w-4 h-4" />
          Kelola Paslon & Foto
        </button>
        <button
          onClick={() => setActiveTab('pengaturan')}
          className={`py-2 px-3.5 rounded-xl whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            activeTab === 'pengaturan' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Settings className="w-4 h-4" />
          Pengaturan & Reset
        </button>
      </div>

      {/* TAB 1: REKAPITULASI REAL-TIME */}
      {activeTab === 'rekap' && (
        <div className="space-y-4">
          {/* KPI Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Total Suara */}
            <div className="bg-white p-4 rounded-3xl border border-slate-200/90 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Suara</span>
              <div className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900 mt-1">
                {stats.totalVotes}
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5 font-medium">dari {stats.totalEligibleVoters} DPT</p>
            </div>

            {/* Partisipasi */}
            <div className="bg-white p-4 rounded-3xl border border-slate-200/90 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Partisipasi</span>
              <div className="text-2xl sm:text-3xl font-extrabold font-mono text-blue-600 mt-1">
                {stats.participationRate}%
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
                <div 
                  className="bg-blue-600 h-1.5 rounded-full transition-all duration-500" 
                  style={{ width: `${Math.min(stats.participationRate, 100)}%` }}
                ></div>
              </div>
            </div>

            {/* Paslon Teratas */}
            <div className="bg-white p-4 rounded-3xl border border-slate-200/90 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Paslon Terdepan</span>
              <div className="text-lg font-extrabold text-slate-900 truncate mt-1 font-display">
                {stats.leadingCandidate ? `Paslon 0${stats.leadingCandidate.candidateNumber}` : '—'}
              </div>
              <p className="text-[10px] text-slate-500 truncate mt-0.5">
                {stats.leadingCandidate ? `${stats.leadingCandidate.votes} suara (${stats.leadingCandidate.percentage}%)` : 'Belum ada suara'}
              </p>
            </div>

            {/* Status TPS */}
            <div className="bg-white p-4 rounded-3xl border border-slate-200/90 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Status TPS</span>
              <div className="text-lg font-extrabold mt-1 flex items-center gap-1.5 font-display">
                <span className={`w-2.5 h-2.5 rounded-full ${settings.isVotingOpen ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></span>
                <span className={settings.isVotingOpen ? 'text-emerald-700' : 'text-rose-700'}>
                  {settings.isVotingOpen ? 'BUKA' : 'TUTUP'}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">Daring Rumah</p>
            </div>
          </div>

          {/* Live Progress Bars Per Paslon with Card Section Images */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 font-display">Perolehan Suara Paslon</h3>
                <p className="text-xs text-slate-500">Pembaruan real-time otomatis saat siswa mengirim suara</p>
              </div>
              <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                {stats.totalVotes} Suara Masuk
              </span>
            </div>

            <div className="space-y-4 pt-1">
              {stats.summaries.map(summary => {
                const cand = candidates.find(c => c.id === summary.candidateId);
                return (
                  <div key={summary.candidateId} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2.5">
                        <span 
                          className="w-7 h-7 rounded-lg text-white font-extrabold font-mono text-xs flex items-center justify-center shrink-0 shadow-xs"
                          style={{ backgroundColor: summary.color }}
                        >
                          0{summary.candidateNumber}
                        </span>
                        <span className="font-bold text-slate-900 truncate max-w-[180px] sm:max-w-none font-display">
                          {summary.chairmanName} & {summary.viceChairmanName}
                        </span>
                      </div>
                      <div className="text-right font-mono font-bold">
                        <span className="text-slate-900 text-sm">{summary.votes} suara</span>
                        <span className="text-slate-400 ml-1.5 font-normal">({summary.percentage.toFixed(1)}%)</span>
                      </div>
                    </div>

                    {/* Progress track */}
                    <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500 flex items-center justify-end pr-1.5"
                        style={{ 
                          width: `${Math.max(summary.percentage, summary.votes > 0 ? 4 : 0)}%`,
                          backgroundColor: summary.color
                        }}
                      >
                        {summary.percentage >= 15 && (
                          <span className="text-[10px] font-mono font-bold text-white leading-none">
                            {summary.percentage.toFixed(1)}%
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Cards Breakdown with Mini Visuals */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {stats.summaries.map(s => {
              const cand = candidates.find(c => c.id === s.candidateId);
              return (
                <div key={s.candidateId} className="bg-white p-4 rounded-3xl border border-slate-200/90 shadow-xs space-y-3">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-extrabold font-mono text-sm shrink-0 shadow-xs"
                      style={{ backgroundColor: s.color }}
                    >
                      0{s.candidateNumber}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-900 truncate font-display">{s.chairmanName}</p>
                      <p className="text-[11px] text-slate-500 truncate">& {s.viceChairmanName}</p>
                    </div>
                  </div>

                  <div className="pt-1 flex items-baseline justify-between border-t border-slate-100">
                    <span className="text-xs text-slate-500">Perolehan</span>
                    <span className="font-mono font-bold text-sm text-slate-900">
                      {s.votes} <span className="text-xs text-slate-400 font-normal">({s.percentage.toFixed(1)}%)</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: AUDIT LOG PEMILIH */}
      {activeTab === 'log' && (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
          {/* Search Header */}
          <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 font-display">Daftar Audit Log Pemilih</h3>
              <p className="text-xs text-slate-500">Tercatat {voterLogs.length} siswa telah menggunakan hak suara secara sah</p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Cari nama / WA / resi..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">No</th>
                  <th className="py-3 px-4">Waktu</th>
                  <th className="py-3 px-4">Nama Siswa</th>
                  <th className="py-3 px-4">Nomor WhatsApp</th>
                  <th className="py-3 px-4">Pilihan Paslon</th>
                  <th className="py-3 px-4">Kode Resi</th>
                  <th className="py-3 px-4">IP / Perangkat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-slate-400">
                      {searchQuery ? 'Tidak ada data pemilih yang sesuai pencarian.' : 'Belum ada suara pemilih yang masuk.'}
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log, idx) => (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono text-slate-400">{idx + 1}</td>
                      <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px] text-slate-600">
                        {new Date(log.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900 whitespace-nowrap">
                        {log.voterName}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600 whitespace-nowrap">
                        {log.voterPhone}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                          Paslon 0{log.candidateNumber}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-800 font-semibold whitespace-nowrap">
                        {log.receiptCode}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                        {log.ipAddress || '127.0.0.1'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: KELOLA PASLON & FOTO */}
      {activeTab === 'kandidat' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 font-display">Kelola Pasangan Calon & Foto</h3>
              <p className="text-xs text-slate-500">Edit profil, visi, misi, dan sematkan tautan foto kandidat</p>
            </div>
          </div>

          <div className="grid gap-3">
            {candidates.map(candidate => (
              <div 
                key={candidate.id}
                className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3.5">
                  <div 
                    className="w-14 h-14 rounded-2xl text-white font-extrabold font-mono text-lg flex items-center justify-center shrink-0 shadow-sm"
                    style={{ backgroundColor: candidate.color }}
                  >
                    0{candidate.number}
                  </div>
                  <div>
                    <h4 className="text-sm sm:text-base font-extrabold text-slate-900 font-display">
                      {candidate.chairmanName} & {candidate.viceChairmanName}
                    </h4>
                    <p className="text-xs text-slate-500">
                      Kelas: {candidate.chairmanClass} · {candidate.viceChairmanClass}
                    </p>
                    <p className="text-xs text-slate-600 italic mt-0.5 line-clamp-1">
                      "{candidate.slogan}"
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setEditingCandidate({ ...candidate })}
                  className="py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 self-end sm:self-center transition-colors shadow-xs"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Edit Profil & Foto
                </button>
              </div>
            ))}
          </div>

          {/* Edit Candidate Modal */}
          {editingCandidate && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs">
              <div className="w-full max-w-lg bg-white rounded-3xl p-5 sm:p-6 shadow-2xl max-h-[90vh] overflow-y-auto space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="text-base font-extrabold text-slate-900 font-display">
                    Edit Paslon 0{editingCandidate.number}
                  </h3>
                  <button
                    onClick={() => setEditingCandidate(null)}
                    className="text-slate-400 hover:text-slate-600 text-xs font-bold"
                  >
                    Tutup
                  </button>
                </div>

                <form onSubmit={handleSaveCandidate} className="space-y-3.5 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Nama Calon Ketua</label>
                    <input
                      type="text"
                      value={editingCandidate.chairmanName}
                      onChange={e => setEditingCandidate({ ...editingCandidate, chairmanName: e.target.value })}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Nama Calon Wakil Ketua</label>
                    <input
                      type="text"
                      value={editingCandidate.viceChairmanName}
                      onChange={e => setEditingCandidate({ ...editingCandidate, viceChairmanName: e.target.value })}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Kelas Ketua</label>
                      <input
                        type="text"
                        value={editingCandidate.chairmanClass}
                        onChange={e => setEditingCandidate({ ...editingCandidate, chairmanClass: e.target.value })}
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Kelas Wakil</label>
                      <input
                        type="text"
                        value={editingCandidate.viceChairmanClass}
                        onChange={e => setEditingCandidate({ ...editingCandidate, viceChairmanClass: e.target.value })}
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl"
                      />
                    </div>
                  </div>

                  {/* URL Foto Kustom */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
                      URL Foto Kandidat (Opsional)
                    </label>
                    <input
                      type="url"
                      value={editingCandidate.avatarUrl || ''}
                      onChange={e => setEditingCandidate({ ...editingCandidate, avatarUrl: e.target.value })}
                      placeholder="https://contoh.com/foto-paslon.jpg"
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      Kosongkan untuk tetap memakai ilustrasi vektor seragam sekolah resmi.
                    </p>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Slogan Paslon</label>
                    <input
                      type="text"
                      value={editingCandidate.slogan}
                      onChange={e => setEditingCandidate({ ...editingCandidate, slogan: e.target.value })}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Visi Paslon</label>
                    <textarea
                      rows={3}
                      value={editingCandidate.vision}
                      onChange={e => setEditingCandidate({ ...editingCandidate, vision: e.target.value })}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Warna Identitas (Hex Code)</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={editingCandidate.color}
                        onChange={e => setEditingCandidate({ ...editingCandidate, color: e.target.value })}
                        className="w-10 h-10 rounded-xl cursor-pointer border-0"
                      />
                      <input
                        type="text"
                        value={editingCandidate.color}
                        onChange={e => setEditingCandidate({ ...editingCandidate, color: e.target.value })}
                        className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs w-28"
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingCandidate(null)}
                      className="py-2.5 px-4 rounded-xl border border-slate-200 text-slate-600 font-bold"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={isSavingCandidate}
                      className="py-2.5 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold shadow-sm"
                    >
                      {isSavingCandidate ? 'Menyimpan...' : 'Simpan Profil'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: PENGATURAN & RESET GLADI BERSIH */}
      {activeTab === 'pengaturan' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 font-display">Pengaturan Pemilihan OSIS</h3>

            {settingsSuccess && (
              <div className="p-3 bg-emerald-50 text-emerald-700 text-xs rounded-2xl border border-emerald-200 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Pengaturan berhasil diperbarui!
              </div>
            )}

            <form onSubmit={handleSaveSettings} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Sekolah</label>
                <input
                  type="text"
                  value={settingsForm.schoolName}
                  onChange={e => setSettingsForm({ ...settingsForm, schoolName: e.target.value })}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Judul Pemilihan</label>
                <input
                  type="text"
                  value={settingsForm.title}
                  onChange={e => setSettingsForm({ ...settingsForm, title: e.target.value })}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tahun Ajaran</label>
                  <input
                    type="text"
                    value={settingsForm.academicYear}
                    onChange={e => setSettingsForm({ ...settingsForm, academicYear: e.target.value })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Total DPT Siswa Pemilih</label>
                  <input
                    type="number"
                    value={settingsForm.totalEligibleVoters}
                    onChange={e => setSettingsForm({ ...settingsForm, totalEligibleVoters: Number(e.target.value) })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">PIN Admin Baru</label>
                <input
                  type="text"
                  value={settingsForm.adminPin}
                  onChange={e => setSettingsForm({ ...settingsForm, adminPin: e.target.value })}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="py-3 px-5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl text-xs transition-colors"
                >
                  Simpan Pengaturan
                </button>
              </div>
            </form>
          </div>

          {/* Danger Zone: Reset Gladi Bersih */}
          <div className="bg-rose-50/60 p-5 rounded-3xl border border-rose-200 space-y-3">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-rose-900 font-display">Gladi Bersih / Reset Suara</h4>
                <p className="text-xs text-rose-800 mt-0.5">
                  Gunakan fitur ini setelah simulasi pemilihan selesai agar data suara kembali 0 sebelum hari H pemilihan resmi dibuka.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowResetDialog(true)}
              className="py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Reset Semua Suara Masuk
            </button>
          </div>

          {/* Reset Confirmation Dialog */}
          {showResetDialog && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs">
              <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl space-y-4">
                <div className="text-center">
                  <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-2.5">
                    <AlertTriangle className="w-7 h-7" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 font-display">Konfirmasi Reset Suara</h3>
                  <p className="text-xs text-slate-600 mt-1">
                    Tindakan ini akan menghapus seluruh {stats.totalVotes} suara pemilih yang telah masuk.
                  </p>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs">
                  <p className="text-slate-600 mb-1.5">
                    Ketik teks <strong>RESET_SEMUA_SUARA</strong> di bawah untuk melanjutkan:
                  </p>
                  <input
                    type="text"
                    value={resetConfirmInput}
                    onChange={e => setResetConfirmInput(e.target.value)}
                    placeholder="RESET_SEMUA_SUARA"
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-mono text-center text-xs uppercase"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={() => {
                      setShowResetDialog(false);
                      setResetConfirmInput('');
                    }}
                    className="h-11 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleExecuteReset}
                    disabled={resetConfirmInput !== 'RESET_SEMUA_SUARA' || isResetting}
                    className="h-11 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold"
                  >
                    {isResetting ? 'Mereset...' : 'Ya, Hapus Suara'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
