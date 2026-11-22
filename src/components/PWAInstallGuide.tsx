import { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Download,
  MoreVertical,
  PlusSquare,
  Share,
  Smartphone,
  X,
} from 'lucide-react';
import { BrandLogo } from './BrandLogo';

interface PWAInstallBannerProps {
  visible: boolean;
  isInstallable: boolean;
  isIOS: boolean;
  onInstallClick: () => void;
  onDismiss: () => void;
}

export function PWAInstallBanner({
  visible,
  isInstallable,
  isIOS,
  onInstallClick,
  onDismiss,
}: PWAInstallBannerProps) {
  if (!visible) return null;

  return (
    <div className="animate-item-enter bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-3.5 py-2.5 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <BrandLogo size="sm" />
        <div className="min-w-0">
          <p className="text-xs sm:text-sm font-display font-semibold text-slate-900 dark:text-slate-100 truncate">
            Thêm vào màn hình chính
          </p>
          <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 truncate">
            {isIOS
              ? 'Mở nhanh từ màn hình iPhone như ứng dụng riêng'
              : 'Cài đặt để mở nhanh trên điện thoại và dùng ổn định hơn'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <button
          type="button"
          onClick={onInstallClick}
          className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap btn-primary"
        >
          <Download className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>{isInstallable ? 'Cài đặt' : 'Hướng dẫn'}</span>
        </button>

        <button
          type="button"
          onClick={onDismiss}
          aria-label="Ẩn gợi ý cài đặt"
          className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 btn-press"
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

interface PWAInstallModalProps {
  open: boolean;
  defaultTab: 'ios' | 'android';
  isInstallable: boolean;
  isInAppBrowser: boolean;
  onInstallNative: () => Promise<boolean>;
  onClose: () => void;
}

export function PWAInstallModal({
  open,
  defaultTab,
  isInstallable,
  isInAppBrowser,
  onInstallNative,
  onClose,
}: PWAInstallModalProps) {
  const [activeOs, setActiveOs] = useState<'ios' | 'android'>(defaultTab);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    if (open) {
      setActiveOs(defaultTab);
      setInstalling(false);
    }
  }, [open, defaultTab]);

  if (!open) return null;

  const handleNativeInstall = async () => {
    setInstalling(true);
    try {
      const accepted = await onInstallNative();
      if (accepted) {
        onClose();
      }
    } finally {
      setInstalling(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm animate-backdrop-enter"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pwa-guide-title"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl border-t sm:border border-slate-200 dark:border-slate-800 overflow-hidden pb-safe animate-sheet-enter"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sm:hidden pt-2.5 pb-1">
          <div className="w-10 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto" />
        </div>

        <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <BrandLogo size="sm" />
            <div className="min-w-0">
              <h2
                id="pwa-guide-title"
                className="text-base font-display font-semibold text-slate-900 dark:text-slate-100 truncate"
              >
                Thêm vào màn hình chính
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                Dùng Sổ hiện trường TINPNC như ứng dụng trên điện thoại
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng hướng dẫn"
            className="group min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 btn-press shrink-0"
          >
            <X
              className="w-5 h-5 transition-transform duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:rotate-90"
              aria-hidden="true"
            />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
            <button
              type="button"
              onClick={() => setActiveOs('ios')}
              className={`min-h-[40px] px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap btn-press ${
                activeOs === 'ios'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              iPhone / iPad
            </button>
            <button
              type="button"
              onClick={() => setActiveOs('android')}
              className={`min-h-[40px] px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap btn-press ${
                activeOs === 'android'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              Android
            </button>
          </div>

          {isInAppBrowser && (
            <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 rounded-xl px-3.5 py-2.5 text-xs leading-relaxed">
              Bạn đang mở trang trong trình duyệt nội bộ của ứng dụng khác (Zalo/Facebook). Hãy chọn{' '}
              <strong>Mở bằng {activeOs === 'ios' ? 'Safari' : 'Chrome'}</strong> trước để thêm được
              lên màn hình chính.
            </div>
          )}

          {activeOs === 'ios' ? (
            <div key="ios-steps" className="space-y-3 animate-view-enter">
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <span className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <Share className="w-4 h-4" aria-hidden="true" />
                </span>
                <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  <p className="font-semibold text-slate-900 dark:text-slate-100">
                    Bước 1. Mở trình đơn Chia sẻ trên Safari
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Chạm biểu tượng Chia sẻ (hình ô vuông có mũi tên hướng lên) ở thanh dưới cùng của
                    trình duyệt Safari.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <span className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <PlusSquare className="w-4 h-4" aria-hidden="true" />
                </span>
                <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  <p className="font-semibold text-slate-900 dark:text-slate-100">
                    Bước 2. Chọn “Thêm vào MH chính”
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Cuộn xuống danh sách tùy chọn và nhấn vào{' '}
                    <strong className="text-slate-700 dark:text-slate-200">
                      Thêm vào MH chính
                    </strong>{' '}
                    (Add to Home Screen).
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <span className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                </span>
                <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  <p className="font-semibold text-slate-900 dark:text-slate-100">
                    Bước 3. Xác nhận “Thêm”
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Chạm <strong className="text-slate-700 dark:text-slate-200">Thêm</strong> (Add)
                    ở góc trên bên phải để đưa biểu tượng <strong>Sổ TINPNC</strong> ra màn hình
                    chính.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div key="android-steps" className="space-y-3 animate-view-enter">
              {isInstallable && (
                <button
                  type="button"
                  disabled={installing}
                  onClick={handleNativeInstall}
                  className="w-full min-h-[48px] px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold flex items-center justify-center gap-2 btn-primary"
                >
                  <Download className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>
                    {installing ? 'Đang mở hộp thoại cài đặt...' : 'Cài đặt ngay lên màn hình chính'}
                  </span>
                </button>
              )}

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <span className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <MoreVertical className="w-4 h-4" aria-hidden="true" />
                </span>
                <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  <p className="font-semibold text-slate-900 dark:text-slate-100">
                    Bước 1. Mở Menu trình duyệt Chrome
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Chạm vào nút ba chấm <strong>⋮</strong> ở góc trên bên phải trình duyệt Chrome
                    hoặc Samsung Internet.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <span className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <Smartphone className="w-4 h-4" aria-hidden="true" />
                </span>
                <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  <p className="font-semibold text-slate-900 dark:text-slate-100">
                    Bước 2. Chọn “Thêm vào màn hình chính”
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Chọn{' '}
                    <strong className="text-slate-700 dark:text-slate-200">Cài đặt ứng dụng</strong>{' '}
                    hoặc{' '}
                    <strong className="text-slate-700 dark:text-slate-200">
                      Thêm vào màn hình chính
                    </strong>
                    , sau đó xác nhận <strong>Cài đặt</strong>.
                  </p>
                </div>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={onClose}
            className="w-full min-h-[44px] px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 btn-press"
          >
            Đã hiểu
          </button>
        </div>
      </div>
    </div>
  );
}
