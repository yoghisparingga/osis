import React, { useEffect, useState } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X, Clock, ExternalLink } from 'lucide-react';

export type ToastType = 'success' | 'warning' | 'error' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message: string;
  duration?: number;
  actionLabel?: string;
  onAction?: () => void;
}

interface ToastProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  return (
    <div 
      className="fixed top-3 left-3 right-3 sm:left-auto sm:right-4 sm:top-4 z-50 flex flex-col gap-2 pointer-events-none max-w-sm sm:max-w-md mx-auto sm:mx-0"
      aria-live="polite"
    >
      {toasts.map(toast => (
        <ToastCard key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
};

const ToastCard: React.FC<{ toast: ToastItem; onDismiss: (id: string) => void }> = ({ toast, onDismiss }) => {
  const duration = toast.duration || 5000;
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    // Attempt subtle haptic vibration on mobile if supported
    if (toast.type === 'success' && typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate([30, 50, 30]);
      } catch {
        // Ignore vibration error on unsupported platforms
      }
    }

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remainingPct = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remainingPct);
      if (elapsed >= duration) {
        clearInterval(interval);
        onDismiss(toast.id);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [toast, duration, onDismiss]);

  const typeStyles = {
    success: {
      bg: 'bg-white',
      border: 'border-emerald-200/90',
      iconBg: 'bg-emerald-50 text-emerald-600',
      progressBar: 'bg-emerald-500',
      badge: 'text-emerald-700 bg-emerald-50',
      icon: CheckCircle2
    },
    warning: {
      bg: 'bg-white',
      border: 'border-amber-200/90',
      iconBg: 'bg-amber-50 text-amber-600',
      progressBar: 'bg-amber-500',
      badge: 'text-amber-700 bg-amber-50',
      icon: Clock
    },
    error: {
      bg: 'bg-white',
      border: 'border-rose-200/90',
      iconBg: 'bg-rose-50 text-rose-600',
      progressBar: 'bg-rose-500',
      badge: 'text-rose-700 bg-rose-50',
      icon: AlertCircle
    },
    info: {
      bg: 'bg-white',
      border: 'border-blue-200/90',
      iconBg: 'bg-blue-50 text-blue-600',
      progressBar: 'bg-blue-500',
      badge: 'text-blue-700 bg-blue-50',
      icon: Info
    }
  }[toast.type];

  const IconComponent = typeStyles.icon;

  return (
    <div
      className={`pointer-events-auto w-full ${typeStyles.bg} rounded-2xl border ${typeStyles.border} shadow-xl shadow-slate-900/10 overflow-hidden flex flex-col transition-all duration-200 animate-in slide-in-from-top-3`}
      role="alert"
    >
      <div className="p-3.5 sm:p-4 flex items-start gap-3">
        {/* Icon */}
        <div className={`w-9 h-9 rounded-xl ${typeStyles.iconBg} flex items-center justify-center shrink-0 mt-0.5`}>
          <IconComponent className="w-5 h-5" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 pr-1">
          <div className="flex items-center gap-2">
            <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">
              {toast.title}
            </h4>
          </div>
          <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
            {toast.message}
          </p>

          {/* Optional Action Button */}
          {toast.actionLabel && toast.onAction && (
            <button
              onClick={() => {
                toast.onAction?.();
                onDismiss(toast.id);
              }}
              className="mt-2 text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors"
            >
              <span>{toast.actionLabel}</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Close button with >= 40px touch area */}
        <button
          onClick={() => onDismiss(toast.id)}
          className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center shrink-0 -mr-1 -mt-1 transition-colors"
          aria-label="Tutup notifikasi"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Progress Bar line */}
      <div className="w-full bg-slate-100 h-1 overflow-hidden">
        <div
          className={`h-full ${typeStyles.progressBar} transition-all duration-75`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};
