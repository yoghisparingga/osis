import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { Candidate, ElectionSettings, ElectionStats, VoterPassData } from './types/voting.ts';
import { Navbar } from './components/Navbar.tsx';
import { StudentVotingBooth } from './components/StudentVotingBooth.tsx';
import { AdminDashboard } from './components/AdminDashboard.tsx';
import { ToastContainer, type ToastItem, type ToastType } from './components/Toast.tsx';
import { getOrCreateDeviceFingerprint, getLocalVoterPass, saveLocalVoterPass, formatRemainingTime } from './utils/deviceFingerprint.ts';
import { Vote, BarChart3, Wifi, WifiOff } from 'lucide-react';

export default function App() {
  const [currentView, setCurrentView] = useState<'voter' | 'admin'>('voter');
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [settings, setSettings] = useState<ElectionSettings>({
    title: 'Pemilihan Ketua & Wakil Ketua OSIS Periode 2026/2027',
    schoolName: 'SMA / SMK NEGERI TELADAN',
    academicYear: '2026/2027',
    isVotingOpen: true,
    totalEligibleVoters: 750,
    adminPin: '2026',
    ipLockoutHours: 24
  });
  const [stats, setStats] = useState<ElectionStats>({
    totalVotes: 0,
    totalEligibleVoters: 750,
    participationRate: 0,
    leadingCandidate: null,
    summaries: [],
    isVotingOpen: true,
    lastUpdated: Date.now()
  });

  const [deviceFingerprint, setDeviceFingerprint] = useState<string>('');
  const [deviceLocked, setDeviceLocked] = useState(false);
  const [lockRemainingMs, setLockRemainingMs] = useState(0);
  const [voterPass, setVoterPass] = useState<VoterPassData | null>(null);
  const [isConnected, setIsConnected] = useState(true);

  // Toast system state
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((
    type: ToastType, 
    title: string, 
    message: string, 
    actionLabel?: string, 
    onAction?: () => void
  ) => {
    const id = 'toast-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5);
    setToasts(prev => [...prev.slice(-3), { id, type, title, message, actionLabel, onAction }]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const eventSourceRef = useRef<EventSource | null>(null);

  // Initialize device fingerprint and local storage pass
  useEffect(() => {
    const fp = getOrCreateDeviceFingerprint();
    setDeviceFingerprint(fp);

    const localPass = getLocalVoterPass();
    if (localPass) {
      setVoterPass(localPass.passData);
      setDeviceLocked(true);
      setLockRemainingMs(localPass.remainingMs);
      // Inform voter on load that device is protected
      showToast(
        'warning',
        'Proteksi 24 Jam Aktif',
        `Perangkat HP ini telah tercatat menggunakan hak suara. Sisa waktu kunci: ${formatRemainingTime(localPass.remainingMs)}`
      );
    }
  }, [showToast]);

  // Countdown timer for 24h lockout
  useEffect(() => {
    if (!deviceLocked || lockRemainingMs <= 0) return;

    const timer = setInterval(() => {
      setLockRemainingMs(prev => {
        if (prev <= 1000) {
          setDeviceLocked(false);
          return 0;
        }
        return prev - 1000;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [deviceLocked, lockRemainingMs]);

  // Initial state fetch
  const fetchInitialState = useCallback(async () => {
    try {
      const fp = getOrCreateDeviceFingerprint();
      const res = await fetch(`/api/state?deviceFingerprint=${encodeURIComponent(fp)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.candidates) setCandidates(data.candidates);
        if (data.settings) setSettings(data.settings);
        if (data.stats) setStats(data.stats);

        if (data.deviceLocked) {
          setDeviceLocked(true);
          setLockRemainingMs(data.lockRemainingMs);
          if (data.voterPass) setVoterPass(data.voterPass);
        }
      }
    } catch (err) {
      console.warn('Initial state fetch error:', err);
    }
  }, []);

  // Real-Time SSE Stream Setup with auto-reconnect
  useEffect(() => {
    fetchInitialState();

    let retryTimeout: any;

    const setupSSE = () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      const es = new EventSource('/api/stream');
      eventSourceRef.current = es;

      es.onopen = () => {
        setIsConnected(true);
      };

      es.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'INIT_STATE') {
            if (data.payload.candidates) setCandidates(data.payload.candidates);
            if (data.payload.settings) setSettings(data.payload.settings);
            if (data.payload.stats) setStats(data.payload.stats);
          } else if (data.type === 'VOTE_CAST') {
            if (data.payload.stats) setStats(data.payload.stats);
          } else if (data.type === 'SETTINGS_UPDATED') {
            if (data.payload.settings) setSettings(data.payload.settings);
            if (data.payload.stats) setStats(data.payload.stats);
          } else if (data.type === 'CANDIDATES_UPDATED') {
            if (data.payload.candidates) setCandidates(data.payload.candidates);
            if (data.payload.stats) setStats(data.payload.stats);
          } else if (data.type === 'VOTES_RESET') {
            if (data.payload.stats) setStats(data.payload.stats);
          }
        } catch (e) {
          console.error('Error parsing SSE message:', e);
        }
      };

      es.onerror = () => {
        setIsConnected(false);
        es.close();
        retryTimeout = setTimeout(setupSSE, 3000);
      };
    };

    setupSSE();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      clearTimeout(retryTimeout);
    };
  }, [fetchInitialState]);

  // Handler for student vote submission
  const handleVoteSubmit = async (candidateId: string, voterName: string, voterPhone: string) => {
    const fp = deviceFingerprint || getOrCreateDeviceFingerprint();
    const res = await fetch('/api/vote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        voterName,
        voterPhone,
        candidateId,
        deviceFingerprint: fp
      })
    });

    const data = await res.json();
    if (res.ok && data.success) {
      if (data.voterPass) {
        setVoterPass(data.voterPass);
        saveLocalVoterPass(data.voterPass);
      }
      setDeviceLocked(true);
      setLockRemainingMs(24 * 60 * 60 * 1000);
      if (data.stats) setStats(data.stats);

      return { success: true, message: data.message, pass: data.voterPass };
    } else {
      if (data.deviceLocked) {
        setDeviceLocked(true);
      }
      return { success: false, message: data.message || 'Gagal mengirim suara' };
    }
  };

  // Admin Actions
  const handleUpdateCandidate = async (candidate: Candidate): Promise<boolean> => {
    try {
      const res = await fetch('/api/admin/candidates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: settings.adminPin, candidate })
      });
      const data = await res.json();
      if (data.success) {
        if (data.candidates) setCandidates(data.candidates);
        if (data.stats) setStats(data.stats);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const handleToggleVotingStatus = async (): Promise<boolean> => {
    try {
      const res = await fetch('/api/admin/toggle-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: settings.adminPin })
      });
      const data = await res.json();
      if (data.success) {
        if (data.settings) setSettings(data.settings);
        if (data.stats) setStats(data.stats);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const handleResetVotes = async (confirmText: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/admin/reset-votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: settings.adminPin, confirmText })
      });
      const data = await res.json();
      if (data.success) {
        if (data.stats) setStats(data.stats);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const handleUpdateSettings = async (newSettings: Partial<ElectionSettings>): Promise<boolean> => {
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: settings.adminPin, newSettings })
      });
      const data = await res.json();
      if (data.success) {
        if (data.settings) setSettings(data.settings);
        if (data.stats) setStats(data.stats);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans pb-16 sm:pb-0">
      {/* Toast Notification Container (Prominent on small & large screens) */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Top Navbar */}
      <Navbar
        currentView={currentView}
        onViewChange={setCurrentView}
        isVotingOpen={settings.isVotingOpen}
        totalVotes={stats.totalVotes}
      />

      {/* Main Content Area */}
      <main className="flex-1 py-3 sm:py-6">
        {currentView === 'voter' ? (
          <StudentVotingBooth
            candidates={candidates}
            settings={settings}
            deviceLocked={deviceLocked}
            lockRemainingMs={lockRemainingMs}
            voterPass={voterPass}
            onVoteSubmit={handleVoteSubmit}
            onShowToast={showToast}
          />
        ) : (
          <AdminDashboard
            stats={stats}
            candidates={candidates}
            settings={settings}
            adminPin={settings.adminPin}
            onUpdateCandidate={handleUpdateCandidate}
            onToggleVotingStatus={handleToggleVotingStatus}
            onResetVotes={handleResetVotes}
            onUpdateSettings={handleUpdateSettings}
            onShowToast={showToast}
          />
        )}
      </main>

      {/* Mobile Bottom Navigation Bar (Fixed for quick thumb access on phone) */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200">
        <div className="grid grid-cols-2 items-center h-14">
          <button
            onClick={() => setCurrentView('voter')}
            className={`flex flex-col items-center justify-center h-full transition-colors ${
              currentView === 'voter' ? 'text-blue-600 font-bold' : 'text-slate-500'
            }`}
          >
            <Vote className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Bilik Suara</span>
          </button>

          <button
            onClick={() => setCurrentView('admin')}
            className={`flex flex-col items-center justify-center h-full transition-colors relative ${
              currentView === 'admin' ? 'text-blue-600 font-bold' : 'text-slate-500'
            }`}
          >
            <BarChart3 className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Monitoring Live</span>
            {stats.totalVotes > 0 && (
              <span className="absolute top-2 right-12 w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            )}
          </button>
        </div>
      </div>

      {/* Quiet Footer */}
      <footer className="border-t border-slate-200/80 bg-white py-4 px-4 text-center text-xs text-slate-500 hidden sm:block">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© {new Date().getFullYear()} {settings.schoolName} · Sistem E-Voting OSIS Daring</p>
          <div className="flex items-center gap-3 text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              {isConnected ? <Wifi className="w-3.5 h-3.5 text-emerald-500" /> : <WifiOff className="w-3.5 h-3.5 text-rose-500" />}
              {isConnected ? 'Realtime Connected' : 'Reconnecting...'}
            </span>
            <span>·</span>
            <span>Proteksi Kunci 24 Jam</span>
            <span>·</span>
            <span>Export PDF & XLSX</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
