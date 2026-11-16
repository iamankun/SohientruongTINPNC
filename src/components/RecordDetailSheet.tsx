import { useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import { Lock, Pencil, Trash2, X } from 'lucide-react';
import { MAINTENANCE_FIELD_LABELS } from '../data/maintenanceScript';
import { COLOR_STYLES, formatDateVn, PRIORITY_LABELS, STATUS_LABELS } from '../defaults';
import { deleteRecord, updateRecord, updateRecordStatus } from '../services/firestoreService';
import type { Category, FieldRecord, RecordPriority, RecordStatus } from '../types';
import { CategoryIcon } from './CategoryIcon';

interface RecordDetailSheetProps {
  user: User | null;
  record: FieldRecord | null;
  categories: Category[];
  onRequireAuth: () => void;
  onClose: () => void;
}

const EDITABLE_STATUSES: RecordStatus[] = ['moi', 'dang_xu_ly', 'hoan_thanh'];
const PRIORITIES: RecordPriority[] = ['thap', 'trung_binh', 'cao'];

export function RecordDetailSheet({
  user,
  record,
  categories,
  onRequireAuth,
  onClose,
}: RecordDetailSheetProps) {
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmLock, setConfirmLock] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [contactName, setContactName] = useState('');
  const [collectedDate, setCollectedDate] = useState('');
  const [status, setStatus] = useState<RecordStatus>('moi');
  const [priority, setPriority] = useState<RecordPriority>('trung_binh');
  const [notes, setNotes] = useState('');
  const [customData, setCustomData] = useState<Record<string, string | number>>({});

  useEffect(() => {
    if (record) {
      setTitle(record.title);
      setLocation(record.location);
      setContactName(record.contactName);
      setCollectedDate(record.collectedDate);
      setStatus(record.status);
      setPriority(record.priority);
      setNotes(record.notes);
      setCustomData(record.customData || {});
      setEditing(false);
      setConfirmDelete(false);
      setConfirmLock(false);
      setErrorMsg('');
    }
  }, [record]);

  if (!record) return null;

  const category = categories.find((c) => c.id === record.categoryId);
  const style = COLOR_STYLES[category?.colorKey || 'slate'];
  const isLocked = record.status === 'da_luu_tru';

  const handleSaveEdit = async () => {
    if (!user) {
      onRequireAuth();
      return;
    }
    if (!title.trim()) {
      setErrorMsg('Tiêu đề không được để trống.');
      return;
    }
    setBusy(true);
    setErrorMsg('');
    try {
      await updateRecord(record.id, {
        categoryId: record.categoryId,
        categoryName: category?.name || record.categoryName,
        title,
        location,
        contactName,
        status,
        priority,
        notes,
        customData,
        collectedDate,
      });
      setEditing(false);
    } catch {
      setErrorMsg('Không thể cập nhật bản ghi. Vui lòng thử lại.');
    } finally {
      setBusy(false);
    }
  };

  const handleQuickStatus = async (nextStatus: RecordStatus) => {
    if (isLocked) return;
    if (!user) {
      onRequireAuth();
      return;
    }
    setBusy(true);
    setErrorMsg('');
    try {
      await updateRecordStatus(record.id, nextStatus);
      setStatus(nextStatus);
      setConfirmLock(false);
    } catch {
      setErrorMsg('Không thể cập nhật trạng thái.');
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!user) {
      onRequireAuth();
      return;
    }
    setBusy(true);
    setErrorMsg('');
    try {
      await deleteRecord(record.id);
      onClose();
    } catch {
      setErrorMsg('Không thể xóa bản ghi.');
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sheet-record-title"
    >
      <div
        className="w-full sm:max-w-xl bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl border-t sm:border border-slate-200 dark:border-slate-800 max-h-[90vh] flex flex-col overflow-hidden"
      >
        <div className="sm:hidden pt-2.5 pb-1">
          <div className="w-10 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto" />
        </div>

        <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-9 h-9 rounded-xl shrink-0 flex items-center justify-center ${style.iconBg} ${style.iconText}`}
            >
              <CategoryIcon iconKey={category?.iconKey || 'layers'} className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {category?.name || record.categoryName} <span aria-hidden="true">·</span>{' '}
                <span className="tabular-nums">{formatDateVn(record.collectedDate)}</span>
              </p>
              <h2
                id="sheet-record-title"
                className="text-base font-display font-semibold text-slate-900 dark:text-slate-100 truncate"
              >
                {editing ? 'Chỉnh sửa thông tin' : record.title}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0"
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

          {isLocked && (
            <div className="bg-slate-100 dark:bg-slate-800/80 rounded-xl px-3.5 py-2.5 text-xs text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <Lock className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Bản ghi đã được chốt lưu trữ và không thể chỉnh sửa nội dung.</span>
            </div>
          )}

          {editing && !isLocked ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Tiêu đề
                </label>
                <input
                  type="text"
                  maxLength={160}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-base text-slate-900 dark:text-slate-100"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Địa điểm
                  </label>
                  <input
                    type="text"
                    maxLength={160}
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-base text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Người liên hệ
                  </label>
                  <input
                    type="text"
                    maxLength={100}
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-base text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Ngày thu thập
                  </label>
                  <input
                    type="date"
                    value={collectedDate}
                    onChange={(e) => setCollectedDate(e.target.value)}
                    className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-base text-slate-900 dark:text-slate-100 tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Ưu tiên
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as RecordPriority)}
                    className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-base text-slate-900 dark:text-slate-100"
                  >
                    {PRIORITIES.map((p) => (
                      <option key={p} value={p}>
                        {PRIORITY_LABELS[p]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {(category?.fields || []).map((f) => (
                <div key={f.key}>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    {f.label}
                  </label>
                  {f.type === 'select' ? (
                    <select
                      value={String(customData[f.key] ?? '')}
                      onChange={(e) =>
                        setCustomData((prev) => ({ ...prev, [f.key]: e.target.value }))
                      }
                      className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-base text-slate-900 dark:text-slate-100"
                    >
                      <option value="">-- Chọn --</option>
                      {(f.options || []).map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : 'text'}
                      value={String(customData[f.key] ?? '')}
                      onChange={(e) =>
                        setCustomData((prev) => ({
                          ...prev,
                          [f.key]:
                            f.type === 'number' && e.target.value !== ''
                              ? Number(e.target.value)
                              : e.target.value,
                        }))
                      }
                      className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-base text-slate-900 dark:text-slate-100"
                    />
                  )}
                </div>
              ))}

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Ghi chú
                </label>
                <textarea
                  rows={3}
                  maxLength={2000}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-base text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Trạng thái</p>
                  <p className="mt-0.5 font-medium text-slate-900 dark:text-slate-100">
                    {STATUS_LABELS[record.status]}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Ưu tiên</p>
                  <p className="mt-0.5 font-medium text-slate-900 dark:text-slate-100">
                    {PRIORITY_LABELS[record.priority]}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Địa điểm / Khách hàng</p>
                  <p className="mt-0.5 font-medium text-slate-900 dark:text-slate-100">
                    {record.location || '—'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Người liên hệ</p>
                  <p className="mt-0.5 font-medium text-slate-900 dark:text-slate-100">
                    {record.contactName || '—'}
                  </p>
                </div>
              </div>

              {Object.keys(record.customData || {}).length > 0 && (
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
                  <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Chi tiết theo hạng mục
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    {(() => {
                      const orderedKeys = Object.keys(MAINTENANCE_FIELD_LABELS);
                      const entries = Object.entries(record.customData).sort(([a], [b]) => {
                        const ia = orderedKeys.indexOf(a);
                        const ib = orderedKeys.indexOf(b);
                        if (ia !== -1 && ib !== -1) return ia - ib;
                        if (ia !== -1) return -1;
                        if (ib !== -1) return 1;
                        return a.localeCompare(b);
                      });
                      return entries.map(([k, v]) => {
                        const def = category?.fields.find((f) => f.key === k);
                        const label = MAINTENANCE_FIELD_LABELS[k] || def?.label || k;
                        return (
                          <div key={k}>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {label}
                            </p>
                            <p className="mt-0.5 font-medium text-slate-900 dark:text-slate-100 break-words">
                              {String(v)}
                            </p>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              )}

              {record.notes && (
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Ghi chú</p>
                  <p className="text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                    {record.notes}
                  </p>
                </div>
              )}

              {!isLocked && (
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    Chuyển nhanh trạng thái
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {EDITABLE_STATUSES.map((st) => (
                      <button
                        key={st}
                        type="button"
                        disabled={busy}
                        onClick={() => handleQuickStatus(st)}
                        className={`min-h-[44px] px-2 py-2 rounded-xl text-xs font-medium border transition-colors ${
                          record.status === st
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        {STATUS_LABELS[st]}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="px-5 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 pb-safe">
          {editing ? (
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                disabled={busy}
                onClick={() => setEditing(false)}
                className="flex-1 min-h-[44px] px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-200"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={handleSaveEdit}
                className="flex-1 min-h-[44px] px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
              >
                {busy ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </div>
          ) : confirmDelete ? (
            <div className="flex items-center justify-between gap-2.5">
              <span className="text-xs font-medium text-rose-700 dark:text-rose-400">
                Xác nhận xóa bản ghi này?
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setConfirmDelete(false)}
                  className="min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={handleDelete}
                  className="min-h-[44px] px-3.5 py-2 rounded-xl bg-rose-600 text-white text-xs font-medium"
                >
                  Xóa ngay
                </button>
              </div>
            </div>
          ) : confirmLock ? (
            <div className="flex items-center justify-between gap-2.5">
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Chốt lưu trữ sẽ khóa chỉnh sửa. Tiếp tục?
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setConfirmLock(false)}
                  className="min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => handleQuickStatus('da_luu_tru')}
                  className="min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-900 dark:bg-blue-600 text-white text-xs font-medium"
                >
                  Chốt lưu trữ
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="min-h-[44px] px-3.5 py-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 text-sm font-medium flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" aria-hidden="true" />
                <span>Xóa</span>
              </button>

              {!isLocked && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setConfirmLock(true)}
                    className="min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-sm font-medium flex items-center gap-1.5"
                  >
                    <Lock className="w-4 h-4" aria-hidden="true" />
                    <span>Chốt</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditing(true)}
                    className="min-h-[44px] px-4 py-2 rounded-xl bg-slate-900 dark:bg-blue-600 text-white text-sm font-medium flex items-center gap-1.5"
                  >
                    <Pencil className="w-4 h-4" aria-hidden="true" />
                    <span>Sửa</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
