import { Clock, X } from 'lucide-react';
import type { Category } from '../types';

interface DevelopingModalProps {
  category: Category | null;
  onClose: () => void;
}

export function DevelopingModal({ category, onClose }: DevelopingModalProps) {
  if (!category) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm animate-backdrop-enter"
      role="dialog"
      aria-modal="true"
      aria-labelledby="developing-modal-title"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl border-t sm:border border-slate-200 dark:border-slate-800 p-5 sm:p-6 space-y-5 pb-safe animate-sheet-enter"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sm:hidden">
          <div className="w-10 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto" />
        </div>

        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Thông báo hạng mục
              </p>
              <h2
                id="developing-modal-title"
                className="text-base sm:text-lg font-display font-semibold text-slate-900 dark:text-slate-100"
              >
                {category.name} — Đang phát triển
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng thông báo"
            className="group min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 btn-press shrink-0"
          >
            <X className="w-5 h-5 transition-transform duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:rotate-90" />
          </button>
        </div>

        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          Hạng mục <strong className="font-semibold text-slate-900 dark:text-slate-100">{category.name}</strong> hiện đang phát triển. Các trường thu thập thông tin cho mục này sẽ được bổ sung sau.
        </p>

        <button
          type="button"
          onClick={onClose}
          className="w-full min-h-[48px] px-5 py-3 rounded-xl bg-slate-900 dark:bg-blue-600 text-white text-sm font-semibold hover:bg-slate-800 dark:hover:bg-blue-500 btn-primary"
        >
          Đã hiểu
        </button>
      </div>
    </div>
  );
}
