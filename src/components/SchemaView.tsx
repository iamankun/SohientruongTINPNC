import { useEffect, useState } from 'react';
import { Check, Plus, Trash2 } from 'lucide-react';
import { COLOR_STYLES, sanitizeFieldKey } from '../defaults';
import {
  createCategory,
  deleteCategory,
  updateCategory,
} from '../services/firestoreService';
import type {
  Category,
  CategoryColor,
  CategoryGroup,
  CategoryIcon as CategoryIconKey,
  FieldDefinition,
  FieldType,
} from '../types';
import { CategoryIcon } from './CategoryIcon';

interface SchemaViewProps {
  uid: string;
  categories: Category[];
  initialCategoryId?: string;
  onDevelopingCategory: (category: Category) => void;
}

const COLOR_OPTIONS: Array<{ value: CategoryColor; label: string }> = [
  { value: 'blue', label: 'Xanh dương' },
  { value: 'amber', label: 'Vàng hổ phách' },
  { value: 'emerald', label: 'Xanh ngọc' },
  { value: 'violet', label: 'Tím' },
  { value: 'rose', label: 'Đỏ hồng' },
  { value: 'slate', label: 'Xám trung tính' },
];

const ICON_OPTIONS: Array<{ value: CategoryIconKey; label: string }> = [
  { value: 'rocket', label: 'Triển khai' },
  { value: 'wrench', label: 'Bảo trì' },
  { value: 'clipboard', label: 'Khảo sát' },
  { value: 'check', label: 'Nghiệm thu' },
  { value: 'alert', label: 'Sự cố' },
  { value: 'layers', label: 'Mở rộng' },
];

const FIELD_TYPE_OPTIONS: Array<{ value: FieldType; label: string }> = [
  { value: 'text', label: 'Văn bản ngắn' },
  { value: 'textarea', label: 'Đoạn văn dài' },
  { value: 'number', label: 'Số' },
  { value: 'date', label: 'Ngày tháng' },
  { value: 'select', label: 'Danh sách chọn' },
];

export function SchemaView({
  uid,
  categories,
  initialCategoryId,
  onDevelopingCategory,
}: SchemaViewProps) {
  const coreCategories = categories.filter((c) => c.group === 'core');
  const [selectedId, setSelectedId] = useState<string>(
    initialCategoryId || coreCategories[0]?.id || categories[0]?.id || ''
  );

  useEffect(() => {
    if (
      initialCategoryId &&
      coreCategories.some((c) => c.id === initialCategoryId)
    ) {
      setSelectedId(initialCategoryId);
    } else if (!selectedId && (coreCategories[0] || categories[0])) {
      setSelectedId((coreCategories[0] || categories[0]).id);
    }
  }, [initialCategoryId, categories, coreCategories, selectedId]);

  const activeCategory =
    coreCategories.find((c) => c.id === selectedId) ||
    coreCategories[0] ||
    categories[0];

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [group, setGroup] = useState<CategoryGroup>('temporary');
  const [colorKey, setColorKey] = useState<CategoryColor>('slate');
  const [iconKey, setIconKey] = useState<CategoryIconKey>('layers');
  const [fields, setFields] = useState<FieldDefinition[]>([]);

  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [newFieldType, setNewFieldType] = useState<FieldType>('text');
  const [newFieldPlaceholder, setNewFieldPlaceholder] = useState('');
  const [newFieldOptions, setNewFieldOptions] = useState('');
  const [newFieldRequired, setNewFieldRequired] = useState(false);

  const [saving, setSaving] = useState(false);
  const [savedNotice, setSavedNotice] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [confirmDeleteCat, setConfirmDeleteCat] = useState(false);
  const [creatingNew, setCreatingNew] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  useEffect(() => {
    if (activeCategory) {
      setName(activeCategory.name);
      setDescription(activeCategory.description || '');
      setGroup(activeCategory.group);
      setColorKey(activeCategory.colorKey);
      setIconKey(activeCategory.iconKey);
      setFields(activeCategory.fields || []);
      setConfirmDeleteCat(false);
      setSavedNotice('');
      setErrorMsg('');
    }
  }, [activeCategory]);

  const handleAddField = () => {
    const cleanLabel = newFieldLabel.trim();
    if (!cleanLabel) {
      setErrorMsg('Vui lòng nhập tên trường dữ liệu trước khi thêm.');
      return;
    }
    if (fields.length >= 20) {
      setErrorMsg('Mỗi hạng mục hỗ trợ tối đa 20 trường thông tin.');
      return;
    }

    let key = sanitizeFieldKey(cleanLabel);
    if (fields.some((f) => f.key === key)) {
      key = `${key}_${Date.now().toString(36).slice(-3)}`;
    }

    const nextField: FieldDefinition = {
      key,
      label: cleanLabel,
      type: newFieldType,
      required: newFieldRequired,
      placeholder: newFieldPlaceholder.trim(),
      ...(newFieldType === 'select'
        ? {
            options: newFieldOptions
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean),
          }
        : {}),
    };

    setFields((prev) => [...prev, nextField]);
    setNewFieldLabel('');
    setNewFieldPlaceholder('');
    setNewFieldOptions('');
    setNewFieldRequired(false);
    setErrorMsg('');
  };

  const handleRemoveField = (key: string) => {
    setFields((prev) => prev.filter((f) => f.key !== key));
  };

  const handleSaveCategory = async () => {
    if (!activeCategory) return;
    if (!name.trim()) {
      setErrorMsg('Tên hạng mục không được để trống.');
      return;
    }
    setSaving(true);
    setErrorMsg('');
    setSavedNotice('');
    try {
      await updateCategory(activeCategory.id, {
        name: name.trim(),
        description: description.trim(),
        group,
        colorKey,
        iconKey,
        order: activeCategory.order,
        fields,
      });
      setSavedNotice('Đã cập nhật cấu trúc hạng mục.');
    } catch {
      setErrorMsg('Không thể lưu thay đổi. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateCategory = async () => {
    const clean = newCatName.trim();
    if (!clean) return;
    setSaving(true);
    setErrorMsg('');
    try {
      const id = await createCategory(uid, {
        name: clean,
        description: 'Hạng mục mở rộng mới.',
        group: 'temporary',
        colorKey: 'slate',
        iconKey: 'layers',
        order: categories.length + 1,
        fields: [],
      });
      setNewCatName('');
      setCreatingNew(false);
      setSelectedId(id);
    } catch {
      setErrorMsg('Không thể tạo hạng mục mới.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!activeCategory || categories.length <= 1) return;
    setSaving(true);
    try {
      const remaining = categories.filter((c) => c.id !== activeCategory.id);
      await deleteCategory(activeCategory.id);
      if (remaining[0]) {
        setSelectedId(remaining[0].id);
      }
      setConfirmDeleteCat(false);
    } catch {
      setErrorMsg('Không thể xóa hạng mục này.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
      <div className="lg:col-span-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-base font-display font-semibold text-slate-900 dark:text-slate-100">
            Các hạng mục ({categories.length})
          </h2>
          <button
            type="button"
            onClick={() => setCreatingNew((v) => !v)}
            className="min-h-[40px] px-3 py-1.5 rounded-xl bg-slate-900 dark:bg-blue-600 text-white text-xs font-medium flex items-center gap-1.5 whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Thêm mục</span>
          </button>
        </div>

        {creatingNew && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 space-y-2.5">
            <input
              type="text"
              maxLength={80}
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              placeholder="Tên hạng mục mới..."
              className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-base text-slate-900 dark:text-slate-100"
            />
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCreatingNew(false)}
                className="flex-1 min-h-[40px] rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={saving || !newCatName.trim()}
                onClick={handleCreateCategory}
                className="flex-1 min-h-[40px] rounded-xl bg-blue-600 text-white text-xs font-medium disabled:opacity-50"
              >
                Tạo mới
              </button>
            </div>
          </div>
        )}

        <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible no-scrollbar pb-1">
          {categories.map((cat) => {
            const isTemp = cat.group === 'temporary';
            const active = !isTemp && cat.id === activeCategory?.id;
            const style = COLOR_STYLES[cat.colorKey] || COLOR_STYLES.slate;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  if (isTemp) {
                    onDevelopingCategory(cat);
                  } else {
                    setSelectedId(cat.id);
                  }
                }}
                className={`min-h-[52px] px-3.5 py-2.5 rounded-2xl border text-left flex items-center gap-3 shrink-0 lg:w-full transition-colors ${
                  active
                    ? 'bg-white dark:bg-slate-900 border-blue-600 ring-1 ring-blue-600'
                    : isTemp
                      ? 'bg-slate-100/70 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 opacity-80'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center ${style.iconBg} ${style.iconText}`}
                >
                  <CategoryIcon iconKey={cat.iconKey} className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                    {cat.name}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate tabular-nums">
                    {isTemp ? (
                      'Đang phát triển'
                    ) : (
                      <>
                        Chính <span aria-hidden="true">·</span> {cat.fields.length} trường
                      </>
                    )}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {activeCategory && (
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 space-y-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-base sm:text-lg font-display font-semibold text-slate-900 dark:text-slate-100">
                Cấu hình: {activeCategory.name}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Đổi tên, phân nhóm hoặc thêm các trường thông tin cần thu thập trong mục này.
              </p>
            </div>
          </div>

          {savedNotice && (
            <div
              role="status"
              className="bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 rounded-xl px-3.5 py-2.5 text-sm font-medium flex items-center gap-2"
            >
              <Check className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>{savedNotice}</span>
            </div>
          )}

          {errorMsg && (
            <div
              role="alert"
              className="bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 rounded-xl px-3.5 py-2.5 text-sm"
            >
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Tên hạng mục
              </label>
              <input
                type="text"
                maxLength={80}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-base text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Phân nhóm
              </label>
              <select
                value={group}
                onChange={(e) => setGroup(e.target.value as CategoryGroup)}
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-base text-slate-900 dark:text-slate-100"
              >
                <option value="core">Hạng mục chính</option>
                <option value="temporary">Hạng mục tạm thời (mở rộng)</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Mô tả ngắn
              </label>
              <input
                type="text"
                maxLength={200}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Mục này dùng để thu thập thông tin gì?"
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-base text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Màu nhận diện
              </label>
              <select
                value={colorKey}
                onChange={(e) => setColorKey(e.target.value as CategoryColor)}
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-base text-slate-900 dark:text-slate-100"
              >
                {COLOR_OPTIONS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Biểu tượng
              </label>
              <select
                value={iconKey}
                onChange={(e) => setIconKey(e.target.value as CategoryIconKey)}
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-base text-slate-900 dark:text-slate-100"
              >
                {ICON_OPTIONS.map((i) => (
                  <option key={i.value} value={i.value}>
                    {i.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-5 border-t border-slate-100 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-display font-semibold text-slate-900 dark:text-slate-100">
                Các trường dữ liệu riêng ({fields.length}/20)
              </h4>
            </div>

            {fields.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Chưa có trường dữ liệu riêng nào. Thêm trường mới bên dưới.
              </p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                {fields.map((f) => (
                  <div
                    key={f.key}
                    className="px-3.5 py-2.5 flex items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-950/50"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                        {f.label}
                        {f.required ? ' *' : ''}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {FIELD_TYPE_OPTIONS.find((t) => t.value === f.type)?.label || f.type}
                        {f.options?.length ? ` · ${f.options.join(', ')}` : ''}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveField(f.key)}
                      aria-label={`Xóa trường ${f.label}`}
                      className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 space-y-3">
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Thêm trường mới vào mục “{name || activeCategory.name}”
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  maxLength={60}
                  value={newFieldLabel}
                  onChange={(e) => setNewFieldLabel(e.target.value)}
                  placeholder="Tên trường (vd: Số serial, Chi phí...)"
                  className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-base text-slate-900 dark:text-slate-100"
                />
                <select
                  value={newFieldType}
                  onChange={(e) => setNewFieldType(e.target.value as FieldType)}
                  className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-base text-slate-900 dark:text-slate-100"
                >
                  {FIELD_TYPE_OPTIONS.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
                {newFieldType === 'select' ? (
                  <input
                    type="text"
                    value={newFieldOptions}
                    onChange={(e) => setNewFieldOptions(e.target.value)}
                    placeholder="Các lựa chọn, cách nhau dấu phẩy (vd: Đạt, Chưa đạt)"
                    className="sm:col-span-2 w-full min-h-[44px] px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-base text-slate-900 dark:text-slate-100"
                  />
                ) : (
                  <input
                    type="text"
                    maxLength={100}
                    value={newFieldPlaceholder}
                    onChange={(e) => setNewFieldPlaceholder(e.target.value)}
                    placeholder="Gợi ý nhập (tùy chọn)"
                    className="sm:col-span-2 w-full min-h-[44px] px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-base text-slate-900 dark:text-slate-100"
                  />
                )}
              </div>
              <div className="flex items-center justify-between gap-3">
                <label className="inline-flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 min-h-[40px] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newFieldRequired}
                    onChange={(e) => setNewFieldRequired(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-blue-600"
                  />
                  <span>Bắt buộc nhập</span>
                </label>
                <button
                  type="button"
                  onClick={handleAddField}
                  className="min-h-[40px] px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-medium flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Thêm trường</span>
                </button>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {categories.length > 1 ? (
              confirmDeleteCat ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-rose-700 dark:text-rose-400">Xóa mục này?</span>
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteCat(false)}
                    className="min-h-[40px] px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs"
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={handleDeleteCategory}
                    className="min-h-[40px] px-3 rounded-xl bg-rose-600 text-white text-xs font-medium"
                  >
                    Xác nhận xóa
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDeleteCat(true)}
                  className="min-h-[44px] px-3.5 py-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-sm font-medium text-left"
                >
                  Xóa hạng mục
                </button>
              )
            ) : (
              <div />
            )}

            <button
              type="button"
              disabled={saving}
              onClick={handleSaveCategory}
              className="min-h-[48px] px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold"
            >
              {saving ? 'Đang lưu cấu trúc...' : 'Lưu cấu trúc hạng mục'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
