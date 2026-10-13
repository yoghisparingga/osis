import React, { useState } from 'react';
import type { VoterPassData } from '../types/voting.ts';
import { CheckCircle, ShieldCheck, Share2, Copy, Check, Clock } from 'lucide-react';
import { formatRemainingTime } from '../utils/deviceFingerprint.ts';

interface VoterPassModalProps {
  pass: VoterPassData;
  lockRemainingMs: number;
  onClose?: () => void;
  schoolName: string;
}

export const VoterPassModal: React.FC<VoterPassModalProps> = ({
  pass,
  lockRemainingMs,
  onClose,
  schoolName
}) => {
  const [copied, setCopied] = useState(false);

  const formattedDate = new Date(pass.timestamp).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  const formattedTime = new Date(pass.timestamp).toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit'
  });

  const handleCopy = () => {
    navigator.clipboard.writeText(pass.receiptCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `*BUKTI PEMILIHAN KETUA OSIS DARING*\n` +
      `Sekolah: ${schoolName}\n` +
      `Nama Siswa: ${pass.voterName}\n` +
      `Kode Resi: *${pass.receiptCode}*\n` +
      `Waktu Coblos: ${formattedDate}, ${formattedTime} WIB\n` +
      `Status: SUARA SAH TERVERIFIKASI SISTEM 24 JAM`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200">
        {/* Certificate / Ticket Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-5 text-center relative">
          <div className="w-14 h-14 bg-white/20 backdrop-blur-xs rounded-full flex items-center justify-center mx-auto mb-2.5 border border-white/30">
            <CheckCircle className="w-8 h-8 text-white" />
          </div>
          <span className="text-[11px] uppercase tracking-widest text-emerald-100 font-semibold">Tanda Bukti Digital Resmi</span>
          <h2 className="text-xl font-extrabold mt-0.5">HAK SUARA TERVERIFIKASI</h2>
          <p className="text-xs text-emerald-100/90 mt-1">{schoolName}</p>
        </div>

        {/* Ticket Details */}
        <div className="p-5 space-y-4">
          {/* Receipt Code Box */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-center relative">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">KODE RESI PEMILIH</span>
            <div className="text-xl font-bold font-mono text-slate-900 tracking-wider mt-0.5">
              {pass.receiptCode}
            </div>
            <button 
              onClick={handleCopy}
              className="mt-2 text-xs text-emerald-700 hover:text-emerald-800 font-semibold inline-flex items-center gap-1.5 py-1 px-2.5 rounded-md hover:bg-emerald-50 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Tersalin ke Clipboard!' : 'Salin Kode Resi'}
            </button>
          </div>

          {/* Voter Info List */}
          <div className="space-y-2.5 text-xs text-slate-700">
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Nama Siswa</span>
              <span className="font-bold text-slate-900 text-right">{pass.voterName}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Nomor WhatsApp</span>
              <span className="font-mono text-slate-800 font-medium">{pass.voterPhone}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Waktu Pemilihan</span>
              <span className="text-slate-800 font-medium text-right">{formattedDate}, {formattedTime}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Pilihan Paslon</span>
              <span className="font-bold text-emerald-700 text-right">Paslon 0{pass.candidateNumber}</span>
            </div>
          </div>

          {/* 24-Hour Lock Info */}
          <div className="bg-amber-50 p-3 rounded-xl border border-amber-200/60 flex items-start gap-2.5">
            <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 leading-tight">
              <p className="font-bold">Proteksi Anti-Ganda Aktif</p>
              <p className="text-[11px] text-amber-800 mt-0.5">
                Perangkat HP dan nomor ini terkunci selama 24 jam.
                {lockRemainingMs > 0 && (
                  <span className="block font-mono font-bold mt-1 text-amber-950">
                    Sisa kunci: {formatRemainingTime(lockRemainingMs)}
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2 space-y-2">
            <button
              onClick={handleShareWhatsApp}
              className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-colors"
            >
              <Share2 className="w-4 h-4" />
              Bagikan Bukti ke WhatsApp
            </button>

            {onClose && (
              <button
                onClick={onClose}
                className="w-full py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 font-medium text-xs hover:bg-slate-50 transition-colors"
              >
                Tutup Tampilan Bukti
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
