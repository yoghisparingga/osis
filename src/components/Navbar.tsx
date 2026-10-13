import React from 'react';
import { Vote, BarChart3, Shield, Radio } from 'lucide-react';

interface NavbarProps {
  currentView: 'voter' | 'admin';
  onViewChange: (view: 'voter' | 'admin') => void;
  isVotingOpen: boolean;
  totalVotes: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onViewChange,
  isVotingOpen,
  totalVotes
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-2.5 whitespace-nowrap shrink-0">
          <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-sm shadow-xs">
            <Vote className="w-4 h-4" />
          </div>
          <div>
            <span className="text-base font-extrabold tracking-tight text-slate-900 block leading-tight">
              E-VOTING OSIS
            </span>
          </div>
        </div>

        {/* Zone 2: Navigation Links (Clean unboxed text links) */}
        <nav className="hidden sm:flex items-center gap-6 text-xs font-semibold text-slate-600">
          <button
            onClick={() => onViewChange('voter')}
            className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 ${
              currentView === 'voter' ? 'text-blue-600 font-bold' : ''
            }`}
          >
            Bilik Suara Siswa
          </button>
          <button
            onClick={() => onViewChange('admin')}
            className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
              currentView === 'admin' ? 'text-blue-600 font-bold' : ''
            }`}
          >
            Monitoring Real-Time
            <span className="font-mono text-[11px] bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded-md font-bold">
              {totalVotes}
            </span>
          </button>
        </nav>

        {/* Zone 3: Primary Action */}
        <div className="flex items-center gap-2 shrink-0">
          {currentView === 'voter' ? (
            <button
              onClick={() => onViewChange('admin')}
              className="py-1.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 shadow-xs"
            >
              <Shield className="w-3.5 h-3.5 text-blue-300" />
              <span>Dasbor Admin</span>
            </button>
          ) : (
            <button
              onClick={() => onViewChange('voter')}
              className="py-1.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 shadow-xs"
            >
              <Vote className="w-3.5 h-3.5 text-white" />
              <span>Bilik Suara</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
