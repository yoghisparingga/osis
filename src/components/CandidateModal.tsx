import React from 'react';
import type { Candidate } from '../types/voting.ts';
import { CandidateImage } from './CandidateImage.tsx';
import { X, CheckCircle2, Award, Target, BookOpen, Vote } from 'lucide-react';

interface CandidateModalProps {
  candidate: Candidate | null;
  onClose: () => void;
  onSelectCandidate: (candidateId: string) => void;
  isVotingOpen: boolean;
}

export const CandidateModal: React.FC<CandidateModalProps> = ({
  candidate,
  onClose,
  onSelectCandidate,
  isVotingOpen
}) => {
  if (!candidate) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/75 backdrop-blur-xs transition-opacity">
      <div 
        className="w-full sm:max-w-xl max-h-[92vh] bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Visual Image Header */}
        <div className="relative w-full h-40 sm:h-48 shrink-0">
          <CandidateImage candidate={candidate} className="h-full" showBadges={false} />
          
          {/* Close button floating */}
          <button 
            onClick={onClose}
            className="absolute top-3.5 right-3.5 z-20 w-9 h-9 rounded-full bg-slate-950/60 hover:bg-slate-950/80 text-white flex items-center justify-center backdrop-blur-md transition-colors"
            aria-label="Tutup"
          >
            <X className="w-5 h-5 text-white" />
          </button>

          {/* Overlay titles at the bottom of the image */}
          <div className="absolute bottom-3 left-4 right-4 z-10 text-white">
            <span className="text-[10px] uppercase font-bold tracking-wider bg-white/20 backdrop-blur-md px-2 py-0.5 rounded-md inline-block mb-1">
              Pasangan Calon 0{candidate.number}
            </span>
            <h2 className="text-lg sm:text-xl font-extrabold leading-tight drop-shadow-md font-display">
              {candidate.chairmanName} & {candidate.viceChairmanName}
            </h2>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-slate-800 text-sm">
          {/* Kelas & Slogan */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
            <div className="text-xs text-slate-500 mb-1 flex items-center gap-2">
              <span>Ketua: <strong>{candidate.chairmanClass}</strong></span>
              <span>·</span>
              <span>Wakil: <strong>{candidate.viceChairmanClass}</strong></span>
            </div>
            <p className="text-xs italic text-slate-700 font-medium leading-relaxed">
              "{candidate.slogan}"
            </p>
          </div>

          {/* Visi */}
          <div>
            <div className="flex items-center gap-2 text-slate-900 font-bold mb-1.5 font-display">
              <Target className="w-4 h-4 text-blue-600" />
              <span>Visi Paslon</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed bg-white p-3.5 rounded-2xl border border-slate-100 shadow-xs">
              {candidate.vision}
            </p>
          </div>

          {/* Misi */}
          <div>
            <div className="flex items-center gap-2 text-slate-900 font-bold mb-2 font-display">
              <BookOpen className="w-4 h-4 text-blue-600" />
              <span>Misi Unggulan</span>
            </div>
            <ul className="space-y-2">
              {candidate.missions.map((m, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-600">
                  <span 
                    className="w-5 h-5 rounded-full text-white font-bold font-mono text-[10px] shrink-0 flex items-center justify-center mt-0.5 shadow-xs"
                    style={{ backgroundColor: candidate.color }}
                  >
                    {idx + 1}
                  </span>
                  <span className="leading-snug">{m}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Program Kerja Unggulan */}
          <div>
            <div className="flex items-center gap-2 text-slate-900 font-bold mb-2 font-display">
              <Award className="w-4 h-4 text-amber-600" />
              <span>Program Kerja Utama</span>
            </div>
            <div className="grid gap-2">
              {candidate.workPrograms.map((prog, idx) => (
                <div key={idx} className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="text-xs text-slate-700 font-semibold leading-tight">{prog}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom CTA for Mobile */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center gap-3">
          <button
            onClick={onClose}
            className="flex-1 h-12 rounded-2xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-100 transition-colors"
          >
            Tutup
          </button>
          {isVotingOpen && (
            <button
              onClick={() => {
                onClose();
                onSelectCandidate(candidate.id);
              }}
              style={{ backgroundColor: candidate.color }}
              className="flex-1 h-12 rounded-2xl text-white font-extrabold text-xs shadow-md hover:opacity-95 active:scale-[0.98] transition-transform text-center flex items-center justify-center gap-1.5"
            >
              <Vote className="w-4 h-4" />
              Pilih Paslon 0{candidate.number}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
