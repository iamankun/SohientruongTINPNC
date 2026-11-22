import { useState } from 'react';
import { Smartphone } from 'lucide-react';
import { BrandLogo } from './BrandLogo';

const ANKUN_LOGO_URL =
  'https://www.ankun.asia/_next/image?url=%2Flogo-white.png&w=96&q=75';
const FPT_LOGO_URL =
  'https://fpt.vn/frontend_layout_2025_vibecode/assets/images/fpt-telecom-logo-footer.svg';

interface FooterProps {
  canInstall?: boolean;
  onOpenInstall?: () => void;
}

export function Footer({ canInstall = false, onOpenInstall }: FooterProps) {
  const [ankunImgError, setAnkunImgError] = useState(false);
  const [fptImgError, setFptImgError] = useState(false);

  return (
    <footer className="mt-10 bg-slate-900 text-slate-300 border-t border-slate-800 pt-6 pb-24 lg:pb-7">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-xs sm:text-sm">
        <div className="flex flex-wrap items-center gap-2.5">
          <BrandLogo size="xs" variant="dark" />
          <span className="text-slate-300">Sổ hiện trường TINPNC được lập trình bởi</span>
          <a
            href="https://ankun.asia"
            target="_blank"
            rel="noopener noreferrer"
            title="An Kun Studio"
            aria-label="An Kun Studio (ankun.asia)"
            className="group relative inline-flex items-center justify-center min-h-[44px] px-1.5 rounded-lg hover:bg-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 shrink-0"
          >
            {!ankunImgError ? (
              <span className="w-[88px] h-9 overflow-hidden flex items-center justify-center shrink-0">
                <img
                  src={ANKUN_LOGO_URL}
                  alt="An Kun Studio"
                  title="An Kun Studio"
                  width={88}
                  height={88}
                  referrerPolicy="no-referrer"
                  onError={() => setAnkunImgError(true)}
                  className="w-[88px] h-[88px] max-w-none shrink-0"
                />
              </span>
            ) : (
              <span className="font-display font-semibold text-white">An Kun Studio</span>
            )}
            <span
              role="tooltip"
              className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 rounded bg-slate-950 border border-slate-700 text-[11px] font-medium text-white whitespace-nowrap shadow-sm"
            >
              An Kun Studio
            </span>
          </a>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {canInstall && onOpenInstall && (
            <button
              type="button"
              onClick={onOpenInstall}
              className="min-h-[44px] px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-800 text-slate-100 text-xs font-medium inline-flex items-center gap-1.5 transition-colors btn-press whitespace-nowrap"
            >
              <Smartphone className="w-3.5 h-3.5 text-blue-400 shrink-0" aria-hidden="true" />
              <span>Thêm vào màn hình chính</span>
            </button>
          )}
          <span className="text-slate-300">Hỗ trợ cho kỹ thuật viên</span>
          {!fptImgError ? (
            <img
              src={FPT_LOGO_URL}
              alt="FPT Telecom"
              title="FPT Telecom"
              width={90}
              height={29}
              referrerPolicy="no-referrer"
              onError={() => setFptImgError(true)}
              className="w-[90px] h-[29px] aspect-[137/44] object-contain shrink-0"
            />
          ) : (
            <span className="font-display font-semibold text-white">FPT Telecom</span>
          )}
        </div>
      </div>
    </footer>
  );
}
