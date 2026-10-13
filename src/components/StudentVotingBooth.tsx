import React, { useState, useRef, useEffect } from 'react';
import type { Candidate, ElectionSettings, VoterPassData } from '../types/voting.ts';
import { CandidateModal } from './CandidateModal.tsx';
import { CandidateImage } from './CandidateImage.tsx';
import { downloadVoterCardPDF } from '../utils/exportReports.ts';
import { 
  User, 
  Phone, 
  CheckCircle, 
  CheckCircle2,
  AlertCircle, 
  Lock, 
  Clock, 
  FileText, 
  ChevronRight,
  ShieldAlert,
  Sparkles,
  Info,
  Vote,
  Download,
  Share2,
  Copy,
  Check,
  Loader2,
  ArrowRight,
  ArrowLeft,
  XCircle,
  HelpCircle,
  BadgeCheck
} from 'lucide-react';
import { formatRemainingTime, getOrCreateDeviceFingerprint } from '../utils/deviceFingerprint.ts';

interface StudentVotingBoothProps {
  candidates: Candidate[];
  settings: ElectionSettings;
  deviceLocked: boolean;
  lockRemainingMs: number;
  voterPass: VoterPassData | null;
  onVoteSubmit: (candidateId: string, voterName: string, voterPhone: string) => Promise<{ success: boolean; message: string; pass?: VoterPassData }>;
  onShowToast?: (type: 'success' | 'warning' | 'error' | 'info', title: string, message: string, actionLabel?: string, onAction?: () => void) => void;
}

export const StudentVotingBooth: React.FC<StudentVotingBoothProps> = ({
  candidates,
  settings,
  deviceLocked,
  lockRemainingMs,
  voterPass,
  onVoteSubmit,
  onShowToast
}) => {
  // Timeline Step: 1 (Daftar), 2 (Pilih Paslon), 3 (Review & Download Kartu)
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(() => {
    if (deviceLocked && voterPass) return 3;
    return 1;
  });

  // Registration state
  const [voterName, setVoterName] = useState('');
  const [voterPhone, setVoterPhone] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  // Modal Alert 1: Registration Success or Rejection
  const [regSuccessModal, setRegSuccessModal] = useState(false);
  const [regRejectModal, setRegRejectModal] = useState<{ show: boolean; title: string; message: string } | null>(null);

  // Voting state
  const [activeModalCandidate, setActiveModalCandidate] = useState<Candidate | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [isConfirmingVote, setIsConfirmingVote] = useState(false);
  const [isSubmittingVote, setIsSubmittingVote] = useState(false);

  // Review & Pass state
  const [completedPass, setCompletedPass] = useState<VoterPassData | null>(voterPass);
  const [isCopiedReceipt, setIsCopiedReceipt] = useState(false);

  // Form reference for auto-focus
  const phoneInputRef = useRef<HTMLInputElement>(null);

  // If already locked from before, jump to Step 3
  useEffect(() => {
    if (deviceLocked && voterPass) {
      setCurrentStep(3);
      setCompletedPass(voterPass);
    }
  }, [deviceLocked, voterPass]);

  // STEP 1: Registration Submit
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings.isVotingOpen) {
      onShowToast?.('warning', 'TPS Ditutup', 'Pemungutan suara sedang ditutup oleh panitia OSIS.');
      return;
    }

    if (!voterName.trim() || voterName.trim().length < 3) {
      setRegRejectModal({
        show: true,
        title: 'Nama Siswa Tidak Valid',
        message: 'Nama lengkap siswa wajib diisi minimal 3 karakter sesuai dengan daftar absen resmi.'
      });
      return;
    }

    const cleanPhone = voterPhone.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 9) {
      setRegRejectModal({
        show: true,
        title: 'Nomor WhatsApp Tidak Lengkap',
        message: 'Masukkan nomor WhatsApp aktif yang valid (minimal 10 digit, contoh: 081234567890).'
      });
      return;
    }

    setIsRegistering(true);

    try {
      const fp = getOrCreateDeviceFingerprint();
      const res = await fetch('/api/check-voter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          voterName: voterName.trim(),
          voterPhone: voterPhone.trim(),
          deviceFingerprint: fp
        })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        // Registration success -> open success modal alert!
        setRegSuccessModal(true);
      } else {
        // Rejection -> show rejection modal so student can fix it!
        setRegRejectModal({
          show: true,
          title: 'Pendaftaran Ditolak: Data Sudah Terdaftar',
          message: data.message || 'Nomor WhatsApp atau nama telah terdaftar dalam sistem.'
        });
      }
    } catch {
      setRegRejectModal({
        show: true,
        title: 'Gangguan Jaringan',
        message: 'Tidak dapat terhubung ke server. Silakan periksa koneksi data HP Anda.'
      });
    } finally {
      setIsRegistering(false);
    }
  };

  // STEP 2: Candidate Clicked -> Open Confirmation Modal Alert
  const handleSelectCandidate = (candidate: Candidate) => {
    if (deviceLocked) {
      onShowToast?.('warning', 'Perangkat Terkunci 24 Jam', 'Perangkat HP ini telah digunakan memilih.');
      return;
    }
    setSelectedCandidate(candidate);
    setIsConfirmingVote(true);
  };

  // STEP 2: Confirm Vote with Spinner Button
  const handleConfirmVote = async () => {
    if (!selectedCandidate) return;
    setIsSubmittingVote(true);

    try {
      const res = await onVoteSubmit(selectedCandidate.id, voterName, voterPhone);
      if (res.success && res.pass) {
        setCompletedPass(res.pass);
        setIsConfirmingVote(false);
        // Move immediately to Step 3: Review & Thank You Page!
        setCurrentStep(3);
        onShowToast?.(
          'success',
          'Suara Berhasil Dicatat!',
          `Terima kasih! Pilihan Anda untuk Paslon 0${selectedCandidate.number} telah masuk ke penghitungan suara resmi.`
        );
      } else {
        setIsConfirmingVote(false);
        onShowToast?.('error', 'Gagal Mengirim Suara', res.message);
      }
    } catch (err: any) {
      setIsConfirmingVote(false);
      onShowToast?.('error', 'Gangguan Sistem', err.message || 'Gagal mengirim suara');
    } finally {
      setIsSubmittingVote(false);
    }
  };

  const handleCopyReceipt = () => {
    if (!completedPass) return;
    navigator.clipboard.writeText(completedPass.receiptCode);
    setIsCopiedReceipt(true);
    setTimeout(() => setIsCopiedReceipt(false), 2500);
  };

  const handleShareWhatsApp = () => {
    if (!completedPass) return;
    const dateFormatted = new Date(completedPass.timestamp).toLocaleString('id-ID');
    const text = encodeURIComponent(
      `*BUKTI PEMILIHAN KETUA OSIS DARING*\n` +
      `Sekolah: ${settings.schoolName}\n` +
      `Nama Siswa: ${completedPass.voterName}\n` +
      `Kode Resi: *${completedPass.receiptCode}*\n` +
      `Waktu Coblos: ${dateFormatted} WIB\n` +
      `Pilihan: Paslon 0${completedPass.candidateNumber}\n` +
      `Status: SUARA SAH TERVERIFIKASI`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-3 space-y-5">
      {/* Visual Header Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 text-white p-5 rounded-3xl shadow-lg relative overflow-hidden border border-white/10">
        <div className="relative z-10">
          <div className="flex items-center justify-between text-[11px] font-semibold text-blue-200 mb-1.5">
            <span className="tracking-wide uppercase truncate max-w-[240px]">{settings.schoolName}</span>
            <span className="flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-400/30 font-mono text-[10px] shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              {settings.isVotingOpen ? 'TPS BUKA' : 'TPS TUTUP'}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black leading-tight tracking-tight font-display">
            {settings.title}
          </h1>
          <p className="text-xs text-blue-200/80 mt-1 font-medium">
            Tahun Ajaran {settings.academicYear} · Sistem E-Voting Mandiri dari Rumah
          </p>
        </div>
      </div>

      {/* INTERACTIVE TIMELINE STEPPER (1. DAFTAR -> 2. PILIH PASLON -> 3. REVIEW & KARTU) */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-xs">
        <div className="flex items-center justify-between relative">
          {/* Connector Line */}
          <div className="absolute top-4 inset-x-8 h-0.5 bg-slate-200 -z-0" />
          <div 
            className="absolute top-4 left-8 h-0.5 bg-blue-600 transition-all duration-300 -z-0"
            style={{ width: currentStep === 1 ? '0%' : currentStep === 2 ? '50%' : '85%' }}
          />

          {/* Step 1 */}
          <div className="flex flex-col items-center relative z-10 text-center flex-1">
            <div 
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-colors shadow-xs ${
                currentStep > 1 
                  ? 'bg-emerald-600 text-white' 
                  : currentStep === 1 
                    ? 'bg-blue-600 text-white ring-4 ring-blue-100' 
                    : 'bg-slate-200 text-slate-500'
              }`}
            >
              {currentStep > 1 ? <Check className="w-4 h-4" /> : '1'}
            </div>
            <span className={`text-[11px] mt-1.5 font-bold ${currentStep === 1 ? 'text-blue-600' : 'text-slate-600'}`}>
              Daftar
            </span>
          </div>

          {/* Step 2 */}
          <div className="flex flex-col items-center relative z-10 text-center flex-1">
            <div 
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-colors shadow-xs ${
                currentStep > 2 
                  ? 'bg-emerald-600 text-white' 
                  : currentStep === 2 
                    ? 'bg-blue-600 text-white ring-4 ring-blue-100' 
                    : 'bg-slate-200 text-slate-500'
              }`}
            >
              {currentStep > 2 ? <Check className="w-4 h-4" /> : '2'}
            </div>
            <span className={`text-[11px] mt-1.5 font-bold ${currentStep === 2 ? 'text-blue-600' : 'text-slate-600'}`}>
              Pilih Paslon
            </span>
          </div>

          {/* Step 3 */}
          <div className="flex flex-col items-center relative z-10 text-center flex-1">
            <div 
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-colors shadow-xs ${
                currentStep === 3 
                  ? 'bg-emerald-600 text-white ring-4 ring-emerald-100' 
                  : 'bg-slate-200 text-slate-500'
              }`}
            >
              {currentStep === 3 ? <Check className="w-4 h-4" /> : '3'}
            </div>
            <span className={`text-[11px] mt-1.5 font-bold ${currentStep === 3 ? 'text-emerald-700' : 'text-slate-600'}`}>
              Review & Bukti
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================
          TIMELINE STEP 1: FORM PENDAFTARAN SISWA TERLEBIH DAHULU
          ======================================================== */}
      {currentStep === 1 && (
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-md space-y-5 animate-in fade-in duration-200">
          <div className="border-b border-slate-100 pb-3 flex items-start justify-between">
            <div>
              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded-md">
                Langkah 1 dari 3
              </span>
              <h2 className="text-lg font-extrabold text-slate-900 mt-1 font-display">
                Pendaftaran Pemilih Siswa
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Masukkan identitas Anda untuk mendapatkan hak akses ke bilik suara
              </p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold shrink-0">
              <User className="w-5 h-5" />
            </div>
          </div>

          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            {/* Nama Siswa Input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Nama Lengkap Siswa <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={voterName}
                  onChange={e => setVoterName(e.target.value)}
                  placeholder="Contoh: Muhammad Bintang Pratama"
                  className="w-full pl-10 pr-3.5 py-3 text-sm bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all text-slate-900"
                  required
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Gunakan nama lengkap sesuai absen sekolah.</p>
            </div>

            {/* Nomor WhatsApp Input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Nomor WhatsApp / HP Aktif <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  ref={phoneInputRef}
                  type="tel"
                  value={voterPhone}
                  onChange={e => setVoterPhone(e.target.value)}
                  placeholder="Contoh: 081234567890"
                  className="w-full pl-10 pr-3.5 py-3 text-sm bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all text-slate-900"
                  required
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Satu nomor hanya dapat didaftarkan satu kali.</p>
            </div>

            {/* Rules Banner */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-2.5 text-xs text-slate-600">
              <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                Sistem secara otomatis mendeteksi nomor ganda. Jika nomor HP sudah pernah digunakan, pendaftaran akan langsung ditolak dan Anda dapat memperbaikinya.
              </p>
            </div>

            <button
              type="submit"
              disabled={isRegistering || !settings.isVotingOpen}
              className="w-full h-12 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-extrabold text-sm shadow-md transition-all flex items-center justify-center gap-2"
            >
              {isRegistering ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Memverifikasi Identitas...</span>
                </>
              ) : (
                <>
                  <span>Daftar & Lanjut Pilih Paslon</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* MODAL ALERT: PENDAFTARAN BERHASIL (Menuju Step 2) */}
      {regSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl text-center space-y-4 animate-in zoom-in-95 duration-200 border border-slate-100">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border-2 border-emerald-100 shadow-sm">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                Terverifikasi Sah
              </span>
              <h3 className="text-lg font-black text-slate-900 mt-1.5 font-display">
                Pendaftaran Berhasil!
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Halo <strong>{voterName}</strong> ({voterPhone}), data Anda terverifikasi aktif. Silakan masuk ke bilik suara untuk menentukan pilihan paslon.
              </p>
            </div>

            <button
              onClick={() => {
                setRegSuccessModal(false);
                setCurrentStep(2);
              }}
              className="w-full h-12 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <span>Masuk ke Bilik Suara</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* MODAL ALERT: PENDAFTARAN DITOLAK (Nomor Duplikat / Kunci 24 Jam) */}
      {regRejectModal?.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl text-center space-y-4 animate-in zoom-in-95 duration-200 border border-rose-100">
            <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto border-2 border-rose-100 shadow-sm">
              <XCircle className="w-10 h-10" />
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full">
                Peringatan Sistem
              </span>
              <h3 className="text-base sm:text-lg font-black text-slate-900 mt-1.5 font-display">
                {regRejectModal.title}
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                {regRejectModal.message}
              </p>
            </div>

            <button
              onClick={() => {
                setRegRejectModal(null);
                setTimeout(() => {
                  phoneInputRef.current?.focus();
                  phoneInputRef.current?.select();
                }, 100);
              }}
              className="w-full h-12 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm shadow-md active:scale-[0.98] transition-all"
            >
              Perbaiki Nomor WhatsApp
            </button>
          </div>
        </div>
      )}

      {/* ========================================================
          TIMELINE STEP 2: BILIK SUARA (MEMILIH PASLON)
          ======================================================== */}
      {currentStep === 2 && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Verified Voter Strip */}
          <div className="bg-emerald-50/80 p-3.5 rounded-2xl border border-emerald-200/70 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <BadgeCheck className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <p className="font-bold text-emerald-950 leading-tight">
                  Pemilih Terverifikasi: {voterName}
                </p>
                <p className="text-[11px] text-emerald-700 font-mono">
                  WhatsApp: {voterPhone}
                </p>
              </div>
            </div>

            <button
              onClick={() => setCurrentStep(1)}
              className="text-[11px] font-bold text-slate-600 hover:text-slate-900 underline underline-offset-2 shrink-0"
            >
              Ubah Data
            </button>
          </div>

          <div className="flex items-center justify-between px-1">
            <div>
              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded-md">
                Langkah 2 dari 3
              </span>
              <h2 className="text-base font-bold text-slate-900 mt-1 font-display">
                Pilih Pasangan Calon (Kandidat)
              </h2>
              <p className="text-xs text-slate-500">Tentukan pilihan dengan mengklik tombol pada kartu paslon</p>
            </div>
            <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full">
              {candidates.length} Paslon
            </span>
          </div>

          {/* Candidate Cards Grid */}
          <div className="space-y-5">
            {candidates.map(candidate => (
              <div
                key={candidate.id}
                className="bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-md hover:shadow-lg transition-all duration-200 flex flex-col group"
              >
                {/* Image Section in Card */}
                <div className="w-full h-44 sm:h-52 relative">
                  <CandidateImage candidate={candidate} className="h-full" />
                </div>

                {/* Candidate Content */}
                <div className="p-5 space-y-4">
                  <div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                      <span>Calon Ketua & Calon Wakil Ketua OSIS</span>
                    </div>
                    <h3 className="text-base sm:text-lg font-extrabold text-slate-900 leading-tight font-display">
                      {candidate.chairmanName}
                    </h3>
                    <h4 className="text-sm sm:text-base font-bold text-slate-700 leading-tight mt-0.5 font-display">
                      & {candidate.viceChairmanName}
                    </h4>
                    <p className="text-xs text-slate-500 mt-1.5">
                      Kelas: <strong>{candidate.chairmanClass}</strong> · <strong>{candidate.viceChairmanClass}</strong>
                    </p>
                  </div>

                  {/* Slogan */}
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                    <p className="text-xs text-slate-600 italic leading-relaxed">
                      "{candidate.slogan}"
                    </p>
                  </div>

                  {/* Program Highlights */}
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                      Program Kerja Unggulan
                    </span>
                    <div className="grid gap-1.5">
                      {candidate.workPrograms.slice(0, 2).map((prog, pIdx) => (
                        <div key={pIdx} className="flex items-center gap-2 text-xs text-slate-700">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="truncate">{prog}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-2.5 pt-1">
                    <button
                      type="button"
                      onClick={() => setActiveModalCandidate(candidate)}
                      className="h-12 rounded-2xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 active:scale-[0.98] transition-all flex items-center justify-center gap-1"
                    >
                      Visi & Misi Lengkap
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSelectCandidate(candidate)}
                      style={{ backgroundColor: candidate.color }}
                      className="h-12 rounded-2xl text-white font-extrabold text-xs shadow-md hover:opacity-95 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
                    >
                      <Vote className="w-4 h-4" />
                      Pilih Paslon 0{candidate.number}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL ALERT: KONFIRMASI BENAR-BENAR YAKIN (Dengan Tombol Spinner) */}
      {isConfirmingVote && selectedCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200 border border-slate-100">
            <div className="text-center">
              <div 
                className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center text-white font-extrabold text-2xl mb-2.5 shadow-md font-mono"
                style={{ backgroundColor: selectedCandidate.color }}
              >
                0{selectedCandidate.number}
              </div>
              <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 font-display">
                Apakah Anda Benar-Benar Yakin?
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Pilihan Anda akan dikirim secara resmi dan tidak dapat diubah kembali
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Nama Pemilih:</span>
                <span className="font-bold text-slate-900">{voterName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Nomor WhatsApp:</span>
                <span className="font-mono text-slate-900 font-semibold">{voterPhone}</span>
              </div>
              <div className="flex justify-between items-center border-t border-slate-200 pt-2.5">
                <span className="text-slate-500">Paslon Pilihan:</span>
                <span className="font-extrabold text-slate-900 text-right">
                  Paslon 0{selectedCandidate.number} ({selectedCandidate.chairmanName.split(' ')[0]} & {selectedCandidate.viceChairmanName.split(' ')[0]})
                </span>
              </div>
            </div>

            <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200/80 flex items-start gap-2.5 text-xs text-amber-900">
              <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="leading-snug">
                Setelah tombol submit ditekan, peramban HP ini akan terkunci selama 24 jam untuk menjaga keabsahan pemilu.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={() => setIsConfirmingVote(false)}
                disabled={isSubmittingVote}
                className="h-12 rounded-2xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-100 transition-colors"
              >
                Batal / Tinjau Kembali
              </button>
              <button
                type="button"
                onClick={handleConfirmVote}
                disabled={isSubmittingVote}
                className="h-12 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 active:scale-[0.98]"
              >
                {isSubmittingVote ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Mengirim Suara Sah...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>Ya, Sangat Yakin!</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          TIMELINE STEP 3: HALAMAN REVIEW PILIHAN & KARTU BUKTI
          ======================================================== */}
      {currentStep === 3 && completedPass && (
        <div className="space-y-5 animate-in fade-in duration-300">
          {/* Thank You & Review Header Box */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl p-6 text-center space-y-4 overflow-hidden relative">
            <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto text-emerald-600 border border-emerald-100 shadow-sm">
              <CheckCircle className="w-9 h-9" />
            </div>

            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200/60 inline-flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Hak Suara Sah Telah Masuk
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-2 font-display">
                Terima Kasih Atas Partisipasi Anda!
              </h2>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Suara Anda atas nama <strong>{completedPass.voterName}</strong> telah berhasil dicatat resmi ke dalam rekapitulasi pemilihan OSIS daring.
              </p>
            </div>

            {/* REVIEW CARD DARI PILIHAN SISWA */}
            <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200/80 text-left space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Review Pilihan Paslon Anda:
                </span>
                <span className="font-mono font-extrabold text-sm text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                  Paslon 0{completedPass.candidateNumber}
                </span>
              </div>

              {/* Candidate Info chosen */}
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-blue-600 text-white font-extrabold font-mono text-base flex items-center justify-center shrink-0 shadow-sm">
                  0{completedPass.candidateNumber}
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-slate-900 font-display">
                    {completedPass.candidateChairman || `Paslon 0${completedPass.candidateNumber}`}
                  </h4>
                  <p className="text-xs text-slate-600 font-semibold">
                    & {completedPass.candidateVice || 'Wakil Ketua OSIS'}
                  </p>
                </div>
              </div>
            </div>

            {/* KARTU TANDA BUKTI MEMILIH (DIGITAL PASS) */}
            <div className="bg-gradient-to-br from-slate-900 to-blue-950 text-white p-5 rounded-2xl border border-slate-800 text-left space-y-3 relative overflow-hidden shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-blue-300 uppercase tracking-widest">
                    KARTU BUKTI PEMILIHAN DARING
                  </span>
                  <p className="text-xs font-bold text-white mt-0.5">{settings.schoolName}</p>
                </div>
                <div className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  VERIFIED
                </div>
              </div>

              <div className="p-3 bg-white/10 rounded-xl border border-white/15 text-center">
                <span className="text-[10px] text-blue-200 uppercase tracking-wider block">KODE RESI PEMILIH RESMI</span>
                <span className="text-xl font-black font-mono tracking-widest text-white mt-0.5 block">
                  {completedPass.receiptCode}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] text-blue-100 pt-1 border-t border-white/10">
                <div>
                  <span className="text-white/60 block text-[10px]">Nama Pemilih:</span>
                  <span className="font-bold truncate block">{completedPass.voterName}</span>
                </div>
                <div>
                  <span className="text-white/60 block text-[10px]">Nomor WhatsApp:</span>
                  <span className="font-mono font-bold block">{completedPass.voterPhone}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-white/60 block text-[10px]">Waktu Pencoblosan:</span>
                  <span className="font-medium block">
                    {new Date(completedPass.timestamp).toLocaleString('id-ID')} WIB
                  </span>
                </div>
              </div>
            </div>

            {/* Lock Status Note */}
            <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200/70 text-left flex items-start gap-2.5 text-xs text-amber-900">
              <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Perangkat HP Terkunci 24 Jam</p>
                <p className="text-[11px] text-amber-800 mt-0.5">
                  Hak suara Anda telah tersimpan permanen. {lockRemainingMs > 0 && `Sisa kunci: ${formatRemainingTime(lockRemainingMs)}`}
                </p>
              </div>
            </div>

            {/* ACTION BUTTONS: DOWNLOAD KARTU & BAGIKAN */}
            <div className="space-y-2.5 pt-2">
              {/* Download Kartu PDF */}
              <button
                onClick={() => {
                  downloadVoterCardPDF(completedPass, settings.schoolName);
                  onShowToast?.('success', 'Download Dimulai', 'Kartu bukti suara Anda sedang diunduh.');
                }}
                className="w-full h-12 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-extrabold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download Kartu Bukti Pemilih (PDF)
              </button>

              {/* Share WhatsApp */}
              <button
                onClick={handleShareWhatsApp}
                className="w-full h-12 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-extrabold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2"
              >
                <Share2 className="w-4 h-4" />
                Bagikan Bukti ke WhatsApp Wali Kelas
              </button>

              {/* Copy Receipt */}
              <button
                onClick={handleCopyReceipt}
                className="w-full h-11 rounded-2xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5"
              >
                {isCopiedReceipt ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                {isCopiedReceipt ? 'Kode Resi Berhasil Disalin!' : 'Salin Kode Resi Digital'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Candidate Detail Modal Drawer */}
      <CandidateModal
        candidate={activeModalCandidate}
        onClose={() => setActiveModalCandidate(null)}
        onSelectCandidate={candId => {
          const c = candidates.find(item => item.id === candId);
          if (c) handleSelectCandidate(c);
        }}
        isVotingOpen={settings.isVotingOpen}
      />
    </div>
  );
};
