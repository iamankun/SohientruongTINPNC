import { useState } from 'react';
import { signInWithPopup, signOut, type User } from 'firebase/auth';
import { LogIn, LogOut, ShieldCheck, X } from 'lucide-react';
import { auth, googleProvider } from '../firebase';
import { UserAvatar } from './UserAvatar';

interface AuthModalProps {
  open: boolean;
  user: User | null;
  reason?: 'save' | 'account';
  onClose: () => void;
  onSuccess?: () => void;
}

function getAuthErrorMessage(err: unknown): string {
  if (typeof err === 'object' && err !== null && 'code' in err) {
    const code = String((err as { code?: string }).code);
    if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
      return 'Bạn đã đóng cửa sổ đăng nhập Google trước khi hoàn tất.';
    }
    if (code === 'auth/popup-blocked') {
      return 'Trình duyệt đang chặn cửa sổ đăng nhập. Vui lòng cho phép popup và thử lại.';
    }
    if (code === 'auth/network-request-failed') {
      return 'Lỗi kết nối mạng. Vui lòng kiểm tra internet và thử lại.';
    }
  }
  return 'Không thể đăng nhập Google lúc này. Vui lòng thử lại.';
}

export function AuthModal({
  open,
  user,
  reason = 'account',
  onClose,
  onSuccess,
}: AuthModalProps) {
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!open) return null;

  const handleGoogleSignIn = async () => {
    setBusy(true);
    setErrorMsg('');
    try {
      await signInWithPopup(auth, googleProvider);
      onSuccess?.();
      onClose();
    } catch (err) {
      setErrorMsg(getAuthErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const handleSignOut = async () => {
    setBusy(true);
    setErrorMsg('');
    try {
      await signOut(auth);
      onClose();
    } catch {
      setErrorMsg('Không thể đăng xuất lúc này. Vui lòng thử lại.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div className="w-full sm:max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl border-t sm:border border-slate-200 dark:border-slate-800 overflow-hidden pb-safe">
        <div className="sm:hidden pt-2.5 pb-1">
          <div className="w-10 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto" />
        </div>

        <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
          <h2
            id="auth-modal-title"
            className="text-base font-display font-semibold text-slate-900 dark:text-slate-100"
          >
            {user
              ? 'Tài khoản của bạn'
              : reason === 'save'
                ? 'Đăng nhập để lưu dữ liệu'
                : 'Đăng nhập Google'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {errorMsg && (
            <div
              role="alert"
              className="bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 rounded-xl px-3.5 py-2.5 text-sm"
            >
              {errorMsg}
            </div>
          )}

          {user ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <UserAvatar user={user} size="lg" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                    {user.displayName || 'Người dùng Google'}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {user.email}
                  </p>
                </div>
              </div>

              <button
                type="button"
                disabled={busy}
                onClick={handleSignOut}
                className="w-full min-h-[48px] px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-sm font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
              >
                <LogOut className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>{busy ? 'Đang đăng xuất...' : 'Đăng xuất'}</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <ShieldCheck
                  className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5"
                  aria-hidden="true"
                />
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  {reason === 'save'
                    ? 'Bạn vẫn có thể thao tác đầy đủ các tính năng và sao chép nội dung báo cáo. Để lưu phiếu lên hệ thống, vui lòng đăng nhập Google (dữ liệu đang nhập sẽ được giữ nguyên).'
                    : 'Đăng nhập bằng tài khoản Google để lưu trữ và quản lý danh sách phiếu hiện trường của riêng bạn.'}
                </p>
              </div>

              <button
                type="button"
                disabled={busy}
                onClick={handleGoogleSignIn}
                className="w-full min-h-[48px] px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold flex items-center justify-center gap-2.5 active:scale-[0.99] transition-all"
              >
                <LogIn className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>{busy ? 'Đang mở đăng nhập...' : 'Đăng nhập bằng Google'}</span>
              </button>

              <button
                type="button"
                disabled={busy}
                onClick={onClose}
                className="w-full min-h-[44px] px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Tiếp tục dùng không cần lưu
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
