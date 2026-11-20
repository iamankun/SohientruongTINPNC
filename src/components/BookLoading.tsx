interface BookLoadingProps {
  label?: string;
}

export function BookLoading({ label = 'Đang tải...' }: BookLoadingProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={label}
      className="animate-view-enter bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-6 py-10 flex flex-col items-center justify-center gap-4 text-center overflow-hidden"
    >
      <div className="relative flex items-center justify-center py-2">
        <span className="spectrum-halo-arc w-28 h-16" aria-hidden="true" />
        <span className="spectrum-halo-arc spectrum-halo-arc-2 w-36 h-20" aria-hidden="true" />
        <div className="book-loader-stage relative z-10" aria-hidden="true">
          <div className="book-loader-cover">
            <div className="book-loader-spread">
              <div className="book-loader-half book-loader-half-left">
                <div className="book-loader-lines" />
              </div>
              <div className="book-loader-half book-loader-half-right">
                <div className="book-loader-lines" />
              </div>
              <div className="book-loader-spine" />

              <div className="book-loader-page">
                <div className="book-loader-page-face">
                  <div className="book-loader-lines" />
                </div>
                <div className="book-loader-page-face book-loader-page-back">
                  <div className="book-loader-lines" />
                </div>
              </div>

              <div className="book-loader-page book-loader-page-delay-1">
                <div className="book-loader-page-face">
                  <div className="book-loader-lines" />
                </div>
                <div className="book-loader-page-face book-loader-page-back">
                  <div className="book-loader-lines" />
                </div>
              </div>

              <div className="book-loader-page book-loader-page-delay-2">
                <div className="book-loader-page-face">
                  <div className="book-loader-lines" />
                </div>
                <div className="book-loader-page-face book-loader-page-back">
                  <div className="book-loader-lines" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <span className="text-sm font-medium tracking-tight text-slate-600 dark:text-slate-300">
        {label}
      </span>
    </div>
  );
}
