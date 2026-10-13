import React, { useState } from 'react';
import type { Candidate } from '../types/voting.ts';
import { Award, ShieldCheck, Sparkles, UserCheck } from 'lucide-react';

interface CandidateImageProps {
  candidate: Candidate;
  className?: string;
  showBadges?: boolean;
}

export const CandidateImage: React.FC<CandidateImageProps> = ({
  candidate,
  className = '',
  showBadges = true
}) => {
  const [imgError, setImgError] = useState(false);

  // Background gradient based on candidate color
  const colorGradients: Record<number, { bgFrom: string; bgTo: string; accent: string }> = {
    1: { bgFrom: '#064e3b', bgTo: '#059669', accent: '#34d399' },
    2: { bgFrom: '#78350f', bgTo: '#d97706', accent: '#fbbf24' },
    3: { bgFrom: '#312e81', bgTo: '#4f46e5', accent: '#a5b4fc' }
  };

  const gradient = colorGradients[candidate.number] || { bgFrom: '#1e293b', bgTo: candidate.color, accent: '#94a3b8' };

  return (
    <div className={`relative w-full overflow-hidden bg-slate-900 select-none ${className}`}>
      {/* If custom avatar image provided and not errored */}
      {candidate.avatarUrl && !imgError ? (
        <img
          src={candidate.avatarUrl}
          alt={`Pasangan Calon 0${candidate.number}`}
          referrerPolicy="no-referrer"
          onError={() => setImgError(true)}
          className="w-full h-full object-cover object-center"
        />
      ) : (
        /* High-Fidelity Themed SVG Portrait for Indonesian Student Council Candidates */
        <div 
          className="w-full h-full flex items-center justify-center relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${gradient.bgFrom} 0%, #0f172a 60%, ${gradient.bgTo} 100%)`
          }}
        >
          {/* Subtle Geometric Background Patterns */}
          <div className="absolute inset-0 opacity-15">
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id={`grid-cand-${candidate.number}`} width="28" height="28" patternUnits="userSpaceOnUse">
                  <path d="M 28 0 L 0 0 0 28" fill="none" stroke="white" strokeWidth="0.8" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill={`url(#grid-cand-${candidate.number})`} />
            </svg>
          </div>

          {/* Radial Ambient Glow */}
          <div 
            className="absolute w-44 h-44 rounded-full blur-2xl opacity-40 pointer-events-none"
            style={{ backgroundColor: gradient.accent }}
          />

          {/* Stylized Candidate Duo Vector Graphic */}
          <div className="relative z-10 flex items-center justify-center gap-3 sm:gap-6 py-4 px-6 w-full max-w-sm">
            {/* Chairman Figure */}
            <div className="flex flex-col items-center text-center">
              <div className="relative">
                {/* Silhouette / Avatar circle with blazer and collar */}
                <div 
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl shadow-xl flex items-center justify-center border-2 border-white/20 backdrop-blur-md relative overflow-hidden"
                  style={{ backgroundColor: `${candidate.color}33` }}
                >
                  <svg viewBox="0 0 80 80" className="w-full h-full fill-white/90">
                    {/* Head */}
                    <circle cx="40" cy="28" r="14" fill="#fde68a" />
                    {/* Hair */}
                    <path d="M26 26 C26 15, 54 15, 54 26 C50 18, 30 18, 26 26 Z" fill="#1e293b" />
                    {/* Neck */}
                    <rect x="36" y="40" width="8" height="6" fill="#fde68a" />
                    {/* Collar & Shirt */}
                    <path d="M28 46 L40 54 L52 46 L48 42 L40 46 L32 42 Z" fill="#ffffff" />
                    {/* Tie (Red/White or OSIS tie) */}
                    <polygon points="38,48 42,48 41,60 39,60" fill="#dc2626" />
                    {/* Blazer */}
                    <path d="M14 80 L22 46 L34 50 L40 70 L46 50 L58 46 L66 80 Z" fill={candidate.color} />
                    {/* Gold OSIS Pin Badge on lapel */}
                    <circle cx="26" cy="56" r="2.5" fill="#f59e0b" />
                  </svg>
                </div>
                {/* Micro Label */}
                <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 bg-slate-900/90 text-white text-[9px] px-1.5 py-0.2 rounded-md font-bold whitespace-nowrap border border-white/10">
                  Ketua
                </span>
              </div>
              <p className="text-white font-bold text-xs mt-2.5 truncate max-w-[100px] sm:max-w-[120px] drop-shadow-sm">
                {candidate.chairmanName.split(' ')[0]} {candidate.chairmanName.split(' ')[1] || ''}
              </p>
              <p className="text-white/70 text-[10px] font-medium">
                {candidate.chairmanClass}
              </p>
            </div>

            {/* Center OSIS Ampersand Connection */}
            <div className="flex flex-col items-center justify-center shrink-0">
              <div className="w-7 h-7 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white/90 text-xs font-bold font-mono">
                &
              </div>
            </div>

            {/* Vice Chairman Figure */}
            <div className="flex flex-col items-center text-center">
              <div className="relative">
                <div 
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl shadow-xl flex items-center justify-center border-2 border-white/20 backdrop-blur-md relative overflow-hidden"
                  style={{ backgroundColor: `${candidate.color}33` }}
                >
                  <svg viewBox="0 0 80 80" className="w-full h-full fill-white/90">
                    {/* Head */}
                    <circle cx="40" cy="28" r="14" fill="#fed7aa" />
                    {/* Hair */}
                    <path d="M24 28 C24 14, 56 14, 56 28 C50 16, 30 16, 24 28 Z" fill="#1e293b" />
                    {/* Neck */}
                    <rect x="36" y="40" width="8" height="6" fill="#fed7aa" />
                    {/* Collar & Blouse */}
                    <path d="M28 46 L40 52 L52 46 L48 42 L40 45 L32 42 Z" fill="#ffffff" />
                    {/* Tie */}
                    <polygon points="38,47 42,47 41,58 39,58" fill="#dc2626" />
                    {/* Blazer */}
                    <path d="M14 80 L22 46 L34 50 L40 70 L46 50 L58 46 L66 80 Z" fill={candidate.color} />
                    {/* Pin badge */}
                    <circle cx="26" cy="56" r="2.5" fill="#f59e0b" />
                  </svg>
                </div>
                {/* Micro Label */}
                <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 bg-slate-900/90 text-white text-[9px] px-1.5 py-0.2 rounded-md font-bold whitespace-nowrap border border-white/10">
                  Wakil
                </span>
              </div>
              <p className="text-white font-bold text-xs mt-2.5 truncate max-w-[100px] sm:max-w-[120px] drop-shadow-sm">
                {candidate.viceChairmanName.split(' ')[0]} {candidate.viceChairmanName.split(' ')[1] || ''}
              </p>
              <p className="text-white/70 text-[10px] font-medium">
                {candidate.viceChairmanClass}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Floating Badges */}
      {showBadges && (
        <>
          {/* Top-Left Big Number Badge */}
          <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-slate-950/80 backdrop-blur-md text-white py-1 px-2.5 rounded-xl border border-white/20 shadow-md">
            <span className="font-mono font-extrabold text-sm sm:text-base leading-none">
              0{candidate.number}
            </span>
            <span className="text-[10px] uppercase font-bold tracking-wider text-white/75">
              PASLON
            </span>
          </div>

          {/* Top-Right Official Candidate Seal */}
          <div className="absolute top-3 right-3 flex items-center gap-1 bg-white/15 backdrop-blur-md text-white text-[10px] font-semibold py-1 px-2.5 rounded-xl border border-white/20">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
            <span>Kandidat Sah</span>
          </div>

          {/* Bottom Gradient Fade for Content Separation */}
          <div className="absolute bottom-0 inset-x-0 h-10 bg-gradient-to-t from-slate-950/80 to-transparent pointer-events-none" />
        </>
      )}
    </div>
  );
};
