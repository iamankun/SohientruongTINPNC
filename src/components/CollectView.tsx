import { useEffect, useRef, useState, type FormEvent } from 'react';
import type { User } from 'firebase/auth';
import { Check, LogIn } from 'lucide-react';
import { COLOR_STYLES, getTodayIsoDate, PRIORITY_LABELS, STATUS_LABELS } from '../defaults';
import { createRecord } from '../services/firestoreService';
import type { Category, RecordPriority, RecordStatus } from '../types';
import { CategoryIcon } from './CategoryIcon';
import { LocationMapView } from './LocationMapView';
import { MaintenanceBotView } from './MaintenanceBotView';

interface CollectViewProps {
  user: User | null;
  categories: Category[];
  selectedCategoryId: string;
  onSelectCategory: (id: string) => void;
  onDevelopingCategory: (category: Category) => void;
  onRequireAuth: () => void;
  onSaved: () => void;
}

const ACTIVE_STATUSES: RecordStatus[] = ['moi', 'dang_xu_ly', 'hoan_thanh'];
const PRIORITIES: RecordPriority[] = ['thap', 'trung_binh', 'cao'];

export function CollectView({
  user,
  categories,
  selectedCategoryId,
  onSelectCategory,
  onDevelopingCategory,
  onRequireAuth,
  onSaved,
}: CollectViewProps) {
  const coreCategories = categories.filter((c) => c.group === 'core');
  const activeCategory =
    coreCategories.find((c) => c.id === selectedCategoryId) || coreCategories[0] || categories[0];

  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [contactName, setContactName] = useState('');
  const [collectedDate, setCollectedDate] = useState(getTodayIsoDate());
  const [status, setStatus] = useState<RecordStatus>('moi');
  const [priority, setPriority] = useState<RecordPriority>('trung_binh');
  const [notes, setNotes] = useState('');
  const [customData, setCustomData] = useState<Record<string, string | number>>({});

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successBanner, setSuccessBanner] = useState('');
  const prevCatSlugRef = useRef<string | undefined>(activeCategory?.slug);

  let catAnimClass = 'animate-view-enter';
  if (
    prevCatSlugRef.current &&
    activeCategory?.slug &&
    prevCatSlugRef.current !== activeCategory.slug
  ) {
    const prevIdx = coreCategories.findIndex((c) => c.slug === prevCatSlugRef.current);
    const nextIdx = coreCategories.findIndex((c) => c.slug === activeCategory.slug);
    catAnimClass = nextIdx >= prevIdx ? 'animate-page-next' : 'animate-page-prev';
  }

  useEffect(() => {
    setCustomData({});
    prevCatSlugRef.current = activeCategory?.slug;
  }, [activeCategory?.slug]);

  if (!activeCategory) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-center text-sm text-slate-500">
        Đang tải danh sách hạng mục...
      </div>
    );
  }

  const handleCustomFieldChange = (key: string, value: string, isNumber: boolean) => {
    setCustomData((prev) => {
      const next = { ...prev };
      if (value === '') {
        delete next[key];
      } else if (isNumber) {
        const parsed = Number(value);
        next[key] = Number.isFinite(parsed) ? parsed : value;
      } else {
        next[key] = value;
      }
      return next;
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessBanner('');

    const cleanTitle = title.trim();
    if (!cleanTitle) {
      setErrorMsg('Vui lòng nhập tiêu đề hoặc nội dung công việc.');
      return;
    }

    for (const field of activeCategory.fields) {
      if (field.required) {
        const val = customData[field.key];
        if (val === undefined || String(val).trim() === '') {
          setErrorMsg(`Vui lòng nhập trường bắt buộc: ${field.label}`);
          return;
        }
      }
    }

    if (!user) {
      onRequireAuth();
      return;
    }

    setSubmitting(true);
    try {
      await createRecord(user.uid, {
        categoryId: activeCategory.id,
        categoryName: activeCategory.name,
        title: cleanTitle,
        location,
        contactName,
        status,
        priority,
        notes,
        customData,
        collectedDate,
      });

      setTitle('');
      setLocation('');
      setContactName('');
      setNotes('');
      setCustomData({});
      setStatus('moi');
      setPriority('trung_binh');
      setSuccessBanner(`Đã lưu vào mục ${activeCategory.name}`);
      onSaved();
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? 'Không thể lưu bản ghi. Vui lòng kiểm tra kết nối và thử lại.'
          : 'Đã có lỗi xảy ra.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-base font-display font-semibold text-slate-900 dark:text-slate-100">
            Chọn hạng mục thu thập
          </h2>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {activeCategory.group === 'core' ? 'Hạng mục chính' : 'Hạng mục tạm thời'}
          </span>
        </div>

        <div
          className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1"
          role="tablist"
          aria-label="Hạng mục thu thập"
        >
          {categories.map((cat) => {
            const isTemp = cat.group === 'temporary';
            const isSelected = !isTemp && cat.id === activeCategory.id;
            const style = COLOR_STYLES[cat.colorKey] || COLOR_STYLES.slate;
            return (
              <button
                key={cat.id}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => {
                  if (isTemp) {
                    onDevelopingCategory(cat);
                  } else {
                    onSelectCategory(cat.id);
                  }
                }}
                className={`min-h-[44px] px-3.5 py-2 rounded-xl text-sm font-medium flex items-center gap-2 whitespace-nowrap shrink-0 border btn-press ${
                  isSelected
                    ? 'bg-slate-900 dark:bg-blue-600 text-white border-slate-900 dark:border-blue-600'
                    : isTemp
                      ? 'bg-slate-100/70 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800'
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <span
                  className={
                    isSelected ? 'text-white' : style.iconText
                  }
                >
                  <CategoryIcon iconKey={cat.iconKey} className="w-4 h-4" />
                </span>
                <span>{cat.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div
        key={activeCategory.slug}
        className={`space-y-5 ${catAnimClass}`}
      >
      {activeCategory.slug === 'bao-tri' ? (
        <MaintenanceBotView
          user={user}
          category={activeCategory}
          onRequireAuth={onRequireAuth}
          onSaved={onSaved}
        />
      ) : activeCategory.slug === 'hang-muc-3' ? (
        <LocationMapView
          user={user}
          category={activeCategory}
          onRequireAuth={onRequireAuth}
          onSaved={onSaved}
        />
      ) : (
        <>
          {!user && (
            <div className="bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 text-amber-900 dark:text-amber-200 rounded-2xl px-4 py-3 text-xs sm:text-sm flex items-center justify-between gap-3">
              <span>Bạn vẫn có thể nhập đầy đủ thông tin, nhưng cần đăng nhập Google để lưu.</span>
              <button
                type="button"
                onClick={onRequireAuth}
                className="min-h-[36px] px-3 py-1.5 rounded-xl bg-amber-900 dark:bg-amber-400 text-white dark:text-slate-950 text-xs font-semibold whitespace-nowrap shrink-0 btn-press"
              >
                Đăng nhập
              </button>
            </div>
          )}
          {successBanner && (
            <div
              role="status"
              className="animate-item-enter bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 rounded-2xl px-4 py-3 text-sm font-medium flex items-center gap-2.5"
            >
              <Check className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>{successBanner}</span>
            </div>
          )}

          {errorMsg && (
            <div
              role="alert"
              className="animate-item-enter bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 rounded-2xl px-4 py-3 text-sm font-medium"
            >
              {errorMsg}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 space-y-5"
          >
        <div>
          <label
            htmlFor="field-title"
            className="block text-sm font-medium text-slate-800 dark:text-slate-200 mb-1.5"
          >
            Tiêu đề / Nội dung chính <span className="text-rose-600">*</span>
          </label>
          <input
            id="field-title"
            type="text"
            required
            maxLength={160}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={`Nhập đầu việc cho mục ${activeCategory.name}...`}
            className="w-full min-h-[48px] px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-base text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="field-location"
              className="block text-sm font-medium text-slate-800 dark:text-slate-200 mb-1.5"
            >
              Địa điểm / Khách hàng
            </label>
            <input
              id="field-location"
              type="text"
              maxLength={160}
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Địa chỉ, chi nhánh, công trình..."
              className="w-full min-h-[48px] px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-base text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div>
            <label
              htmlFor="field-contact"
              className="block text-sm font-medium text-slate-800 dark:text-slate-200 mb-1.5"
            >
              Người liên hệ / Phụ trách
            </label>
            <input
              id="field-contact"
              type="text"
              maxLength={100}
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder="Tên người trao đổi hoặc thực hiện"
              className="w-full min-h-[48px] px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-base text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label
              htmlFor="field-date"
              className="block text-sm font-medium text-slate-800 dark:text-slate-200 mb-1.5"
            >
              Ngày thu thập
            </label>
            <input
              id="field-date"
              type="date"
              required
              value={collectedDate}
              onChange={(e) => setCollectedDate(e.target.value)}
              className="w-full min-h-[48px] px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-base text-slate-900 dark:text-slate-100 tabular-nums focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div className="sm:col-span-2">
            <span className="block text-sm font-medium text-slate-800 dark:text-slate-200 mb-1.5">
              Trạng thái
            </span>
            <div className="grid grid-cols-3 gap-2">
              {ACTIVE_STATUSES.map((st) => {
                const active = status === st;
                return (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatus(st)}
                    className={`min-h-[48px] px-2 py-2 rounded-xl text-xs sm:text-sm font-medium border btn-press whitespace-nowrap truncate ${
                      active
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {STATUS_LABELS[st]}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div>
          <span className="block text-sm font-medium text-slate-800 dark:text-slate-200 mb-1.5">
            Mức độ ưu tiên
          </span>
          <div className="grid grid-cols-3 gap-2">
            {PRIORITIES.map((p) => {
              const active = priority === p;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`min-h-[44px] px-3 py-2 rounded-xl text-sm font-medium border btn-press whitespace-nowrap ${
                    active
                      ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border-slate-900 dark:border-slate-100'
                      : 'bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {PRIORITY_LABELS[p]}
                </button>
              );
            })}
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
          <h3 className="text-sm font-display font-semibold text-slate-900 dark:text-slate-100">
            Thông tin chi tiết ({activeCategory.name})
          </h3>

          {activeCategory.fields.length === 0 ? (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Hạng mục này hiện chưa có trường thông tin bổ sung.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {activeCategory.fields.map((field) => {
                const fieldId = `custom-${field.key}`;
                const val = customData[field.key] ?? '';

                if (field.type === 'textarea') {
                  return (
                    <div key={field.key} className="sm:col-span-2">
                      <label
                        htmlFor={fieldId}
                        className="block text-sm font-medium text-slate-800 dark:text-slate-200 mb-1.5"
                      >
                        {field.label}
                        {field.required && <span className="text-rose-600 ml-1">*</span>}
                      </label>
                      <textarea
                        id={fieldId}
                        rows={3}
                        maxLength={500}
                        value={String(val)}
                        onChange={(e) =>
                          handleCustomFieldChange(field.key, e.target.value, false)
                        }
                        placeholder={field.placeholder || ''}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-base text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>
                  );
                }

                if (field.type === 'select') {
                  return (
                    <div key={field.key}>
                      <label
                        htmlFor={fieldId}
                        className="block text-sm font-medium text-slate-800 dark:text-slate-200 mb-1.5"
                      >
                        {field.label}
                        {field.required && <span className="text-rose-600 ml-1">*</span>}
                      </label>
                      <select
                        id={fieldId}
                        value={String(val)}
                        onChange={(e) =>
                          handleCustomFieldChange(field.key, e.target.value, false)
                        }
                        className="w-full min-h-[48px] px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-base text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
                      >
                        <option value="">-- Chọn giá trị --</option>
                        {(field.options || []).map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                }

                return (
                  <div key={field.key}>
                    <label
                      htmlFor={fieldId}
                      className="block text-sm font-medium text-slate-800 dark:text-slate-200 mb-1.5"
                    >
                      {field.label}
                      {field.required && <span className="text-rose-600 ml-1">*</span>}
                    </label>
                    <input
                      id={fieldId}
                      type={
                        field.type === 'number'
                          ? 'number'
                          : field.type === 'date'
                            ? 'date'
                            : 'text'
                      }
                      maxLength={500}
                      value={String(val)}
                      onChange={(e) =>
                        handleCustomFieldChange(
                          field.key,
                          e.target.value,
                          field.type === 'number'
                        )
                      }
                      placeholder={field.placeholder || ''}
                      className="w-full min-h-[48px] px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-base text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label
              htmlFor="field-notes"
              className="block text-sm font-medium text-slate-800 dark:text-slate-200"
            >
              Ghi chú bổ sung
            </label>
            <span className="text-xs text-slate-400 tabular-nums">
              {notes.length}/2000
            </span>
          </div>
          <textarea
            id="field-notes"
            rows={3}
            maxLength={2000}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Thêm nhận xét, vướng mắc hoặc việc cần làm tiếp theo..."
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-base text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full min-h-[48px] px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold btn-primary flex items-center justify-center gap-2"
        >
          {!user && <LogIn className="w-4 h-4 shrink-0" aria-hidden="true" />}
          <span>
            {!user
              ? `Đăng nhập để lưu vào mục ${activeCategory.name}`
              : submitting
                ? 'Đang lưu...'
                : `Lưu vào mục ${activeCategory.name}`}
          </span>
        </button>
      </form>
        </>
      )}
      </div>
    </div>
  );
}
