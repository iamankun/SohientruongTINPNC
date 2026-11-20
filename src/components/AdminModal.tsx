import { useMemo, useState, type FormEvent } from 'react';
import type { User } from 'firebase/auth';
import { Shield, Trash2, UserPlus, X } from 'lucide-react';
import {
  designateAdmin,
  revokeAdmin,
  ROOT_ADMIN_EMAIL,
} from '../services/firestoreService';
import type { AdminUser, UserProfile } from '../types';

interface AdminModalProps {
  open: boolean;
  currentUser: User;
  admins: AdminUser[];
  users: UserProfile[];
  onClose: () => void;
}

export function AdminModal({
  open,
  currentUser,
  admins,
  users,
  onClose,
}: AdminModalProps) {
  const [search, setSearch] = useState('');
  const [manualUid, setManualUid] = useState('');
  const [manualEmail, setManualEmail] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const adminUidSet = useMemo(() => new Set(admins.map((a) => a.uid)), [admins]);

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.displayName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.uid.toLowerCase().includes(q)
    );
  }, [users, search]);

  if (!open) return null;

  const handleGrant = async (target: { uid: string; email?: string; displayName?: string }) => {
    setBusyId(target.uid);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await designateAdmin(target, currentUser.uid);
      setSuccessMsg(
        `Đã chỉ định quyền quản trị viên cho ${target.displayName || target.email || target.uid}.`
      );
    } catch (err) {
      setErrorMsg(
        err instanceof Error && err.message.includes('UID')
          ? err.message
          : 'Không thể chỉ định quản trị viên. Vui lòng thử lại.'
      );
    } finally {
      setBusyId(null);
    }
  };

  const handleRevoke = async (target: { uid: string; email?: string; displayName?: string }) => {
    setBusyId(target.uid);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await revokeAdmin(target.uid);
      setSuccessMsg(
        `Đã thu hồi quyền quản trị viên của ${target.displayName || target.email || target.uid}.`
      );
    } catch {
      setErrorMsg('Không thể thu hồi quyền quản trị viên lúc này.');
    } finally {
      setBusyId(null);
    }
  };

  const handleManualSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const uid = manualUid.trim();
    if (!uid) return;
    await handleGrant({ uid, email: manualEmail.trim() });
    setManualUid('');
    setManualEmail('');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-modal-title"
    >
      <div className="w-full sm:max-w-xl bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl border-t sm:border border-slate-200 dark:border-slate-800 max-h-[90vh] flex flex-col overflow-hidden pb-safe">
        <div className="sm:hidden pt-2.5 pb-1">
          <div className="w-10 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto" />
        </div>

        <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" aria-hidden="true" />
            <h2
              id="admin-modal-title"
              className="text-base font-display font-semibold text-slate-900 dark:text-slate-100 truncate"
            >
              Chỉ định tài khoản quản trị viên
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {errorMsg && (
            <div
              role="alert"
              className="bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 rounded-xl px-3.5 py-2.5 text-sm"
            >
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div
              role="status"
              className="bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 rounded-xl px-3.5 py-2.5 text-sm"
            >
              {successMsg}
            </div>
          )}

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Quản trị viên gốc (mặc định)
            </p>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {ROOT_ADMIN_EMAIL}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Quản trị viên có quyền xem toàn bộ phiếu thu thập của các kỹ thuật viên, mở khóa hoặc chỉnh sửa phiếu đã chốt và chỉ định quản trị viên mới.
            </p>
          </div>

          <div className="space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-display font-semibold text-slate-900 dark:text-slate-100">
                Danh sách quản trị viên ({admins.length + 1})
              </h3>
            </div>
            {admins.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Chưa có quản trị viên bổ sung nào. Chọn tài khoản bên dưới hoặc nhập mã UID để chỉ định.
              </p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                {admins.map((adm) => {
                  const isSelf = adm.uid === currentUser.uid;
                  const isRoot = adm.email.toLowerCase() === ROOT_ADMIN_EMAIL;
                  return (
                    <div
                      key={adm.uid}
                      className="px-3.5 py-2.5 flex items-center justify-between gap-3 bg-white dark:bg-slate-900"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                          {adm.displayName || adm.email || adm.uid}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate font-mono">
                          {adm.email ? `${adm.email} · ${adm.uid}` : adm.uid}
                        </p>
                      </div>
                      {!isSelf && !isRoot ? (
                        <button
                          type="button"
                          disabled={busyId === adm.uid}
                          onClick={() => handleRevoke(adm)}
                          className="min-h-[38px] px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-medium flex items-center gap-1.5 shrink-0 disabled:opacity-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Thu hồi</span>
                        </button>
                      ) : (
                        <span className="text-xs text-slate-500 dark:text-slate-400 shrink-0">
                          {isRoot ? 'Quản trị gốc' : 'Đang dùng'}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-display font-semibold text-slate-900 dark:text-slate-100">
              Chọn từ tài khoản đã đăng nhập ({users.length})
            </h3>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo tên, email hoặc UID..."
              className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-base text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
            />
            {filteredUsers.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Chưa có người dùng phù hợp. Tài khoản sẽ tự xuất hiện tại đây sau khi đăng nhập Google lần đầu.
              </p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden max-h-56 overflow-y-auto">
                {filteredUsers.map((u) => {
                  const isRoot = u.email.toLowerCase() === ROOT_ADMIN_EMAIL;
                  const alreadyAdmin = isRoot || adminUidSet.has(u.uid);
                  const isSelf = u.uid === currentUser.uid;
                  return (
                    <div
                      key={u.uid}
                      className="px-3.5 py-2.5 flex items-center justify-between gap-3 bg-white dark:bg-slate-900"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                          {u.displayName || u.email || u.uid}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          {u.email} <span aria-hidden="true">·</span>{' '}
                          <span className="font-mono">{u.uid}</span>
                        </p>
                      </div>
                      {alreadyAdmin ? (
                        isRoot || isSelf ? (
                          <span className="text-xs font-medium text-blue-600 dark:text-blue-400 shrink-0">
                            Quản trị viên
                          </span>
                        ) : (
                          <button
                            type="button"
                            disabled={busyId === u.uid}
                            onClick={() => handleRevoke(u)}
                            className="min-h-[38px] px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 shrink-0 disabled:opacity-50"
                          >
                            Bỏ quyền
                          </button>
                        )
                      ) : (
                        <button
                          type="button"
                          disabled={busyId === u.uid}
                          onClick={() => handleGrant(u)}
                          className="min-h-[38px] px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium flex items-center gap-1.5 shrink-0 disabled:opacity-50"
                        >
                          <UserPlus className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Chỉ định Admin</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <form
            onSubmit={handleManualSubmit}
            className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-800"
          >
            <h3 className="text-sm font-display font-semibold text-slate-900 dark:text-slate-100">
              Chỉ định nhanh bằng mã UID
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <input
                type="text"
                required
                value={manualUid}
                onChange={(e) => setManualUid(e.target.value)}
                placeholder="Dán mã UID của tài khoản..."
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-base font-mono text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
              />
              <input
                type="email"
                value={manualEmail}
                onChange={(e) => setManualEmail(e.target.value)}
                placeholder="Email ghi nhớ (không bắt buộc)"
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-base text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
              />
            </div>
            <button
              type="submit"
              disabled={!manualUid.trim() || busyId !== null}
              className="w-full min-h-[44px] px-4 py-2 rounded-xl bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-semibold"
            >
              Thêm quản trị viên theo UID
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
