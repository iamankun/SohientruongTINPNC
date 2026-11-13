import { useMemo, useState } from 'react';
import { Download, Plus, Search } from 'lucide-react';
import { MAINTENANCE_FIELD_LABELS } from '../data/maintenanceScript';
import { COLOR_STYLES, formatDateVn, PRIORITY_LABELS, STATUS_LABELS } from '../defaults';
import type { Category, FieldRecord, RecordStatus } from '../types';
import { CategoryIcon } from './CategoryIcon';

interface RecordsViewProps {
  categories: Category[];
  records: FieldRecord[];
  activeCategoryFilter: string;
  onChangeCategoryFilter: (id: string) => void;
  onSelectRecord: (record: FieldRecord) => void;
  onCreateNew: (categoryId?: string) => void;
  onDevelopingCategory: (category: Category) => void;
}

const STATUS_FILTER_OPTIONS: Array<{ value: 'all' | RecordStatus; label: string }> = [
  { value: 'all', label: 'Tất cả' },
  { value: 'moi', label: 'Mới' },
  { value: 'dang_xu_ly', label: 'Đang xử lý' },
  { value: 'hoan_thanh', label: 'Hoàn thành' },
  { value: 'da_luu_tru', label: 'Đã chốt' },
];

export function RecordsView({
  categories,
  records,
  activeCategoryFilter,
  onChangeCategoryFilter,
  onSelectRecord,
  onCreateNew,
  onDevelopingCategory,
}: RecordsViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | RecordStatus>('all');

  const categoryMap = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories]
  );

  const filteredRecords = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return records.filter((rec) => {
      if (activeCategoryFilter !== 'all' && rec.categoryId !== activeCategoryFilter) {
        return false;
      }
      if (statusFilter !== 'all' && rec.status !== statusFilter) {
        return false;
      }
      if (!q) return true;
      const customText = Object.values(rec.customData || {})
        .map((v) => String(v))
        .join(' ')
        .toLowerCase();
      return (
        rec.title.toLowerCase().includes(q) ||
        rec.location.toLowerCase().includes(q) ||
        rec.contactName.toLowerCase().includes(q) ||
        rec.notes.toLowerCase().includes(q) ||
        rec.categoryName.toLowerCase().includes(q) ||
        customText.includes(q)
      );
    });
  }, [records, activeCategoryFilter, statusFilter, searchTerm]);

  const handleExportCsv = () => {
    const escapeCsv = (val: string) => {
      const s = val.replace(/"/g, '""');
      return `"${s}"`;
    };

    const headers = [
      'Ngày thu thập',
      'Hạng mục',
      'Tiêu đề',
      'Địa điểm',
      'Người liên hệ',
      'Trạng thái',
      'Ưu tiên',
      'Chi tiết mở rộng',
      'Ghi chú',
    ];

    const rows = filteredRecords.map((rec) => {
      const cat = categoryMap.get(rec.categoryId);
      const customSummary = Object.entries(rec.customData || {})
        .map(([k, v]) => {
          const def = cat?.fields.find((f) => f.key === k);
          return `${MAINTENANCE_FIELD_LABELS[k] || def?.label || k}: ${v}`;
        })
        .join(' | ');

      return [
        formatDateVn(rec.collectedDate),
        cat?.name || rec.categoryName,
        rec.title,
        rec.location,
        rec.contactName,
        STATUS_LABELS[rec.status],
        PRIORITY_LABELS[rec.priority],
        customSummary,
        rec.notes,
      ]
        .map((cell) => escapeCsv(String(cell || '')))
        .join(',');
    });

    const csvContent = '\uFEFF' + [headers.map(escapeCsv).join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `so-hien-truong-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative flex-1">
          <Search
            className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
            aria-hidden="true"
          />
          <input
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tiêu đề, địa điểm, người liên hệ..."
            aria-label="Tìm kiếm bản ghi"
            className="w-full min-h-[44px] pl-10 pr-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-base text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={filteredRecords.length === 0}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
          >
            <Download className="w-4 h-4" aria-hidden="true" />
            <span>Xuất CSV</span>
          </button>
          <button
            type="button"
            onClick={() =>
              onCreateNew(activeCategoryFilter !== 'all' ? activeCategoryFilter : undefined)
            }
            className="min-h-[44px] px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 flex items-center gap-1.5 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            <span>Thêm mới</span>
          </button>
        </div>
      </div>

      <div className="space-y-2.5">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          <button
            type="button"
            onClick={() => onChangeCategoryFilter('all')}
            className={`min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap shrink-0 border transition-colors ${
              activeCategoryFilter === 'all'
                ? 'bg-slate-900 dark:bg-blue-600 text-white border-slate-900 dark:border-blue-600'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800'
            }`}
          >
            Tất cả mục
          </button>
          {categories.map((cat) => {
            const isTemp = cat.group === 'temporary';
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  if (isTemp) {
                    onDevelopingCategory(cat);
                  } else {
                    onChangeCategoryFilter(cat.id);
                  }
                }}
                className={`min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap shrink-0 border transition-colors ${
                  !isTemp && activeCategoryFilter === cat.id
                    ? 'bg-slate-900 dark:bg-blue-600 text-white border-slate-900 dark:border-blue-600'
                    : isTemp
                      ? 'bg-slate-100/70 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800'
                }`}
              >
                {cat.name}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {STATUS_FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setStatusFilter(opt.value)}
              className={`min-h-[36px] px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
                statusFilter === opt.value
                  ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 tabular-nums">
        <span>Hiển thị {filteredRecords.length} bản ghi</span>
      </div>

      {filteredRecords.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center space-y-3">
          <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
            Không có bản ghi phù hợp
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Thử đổi bộ lọc hoặc bấm “Thêm mới” để thu thập thông tin đầu tiên.
          </p>
        </div>
      ) : (
        <>
          <div className="lg:hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
            {filteredRecords.map((rec) => {
              const cat = categoryMap.get(rec.categoryId);
              const style = COLOR_STYLES[cat?.colorKey || 'slate'];
              return (
                <button
                  key={rec.id}
                  type="button"
                  onClick={() => onSelectRecord(rec)}
                  className="w-full text-left px-4 py-3.5 min-h-[68px] flex items-center gap-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <div
                    className={`w-9 h-9 rounded-xl shrink-0 flex items-center justify-center ${style.iconBg} ${style.iconText}`}
                  >
                    <CategoryIcon iconKey={cat?.iconKey || 'layers'} className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                      {rec.title}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 truncate tabular-nums">
                      {cat?.name || rec.categoryName}
                      <span aria-hidden="true"> · </span>
                      {formatDateVn(rec.collectedDate)}
                      {rec.location ? (
                        <>
                          <span aria-hidden="true"> · </span>
                          {rec.location}
                        </>
                      ) : null}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-medium text-slate-800 dark:text-slate-200 whitespace-nowrap">
                      {STATUS_LABELS[rec.status]}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {PRIORITY_LABELS[rec.priority]}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="hidden lg:block bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-500 dark:text-slate-400">
                  <th className="py-3 px-4">Hạng mục</th>
                  <th className="py-3 px-4">Tiêu đề</th>
                  <th className="py-3 px-4">Địa điểm</th>
                  <th className="py-3 px-4">Ngày</th>
                  <th className="py-3 px-4">Ưu tiên</th>
                  <th className="py-3 px-4">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                {filteredRecords.map((rec) => {
                  const cat = categoryMap.get(rec.categoryId);
                  return (
                    <tr
                      key={rec.id}
                      onClick={() => onSelectRecord(rec)}
                      className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        {cat?.name || rec.categoryName}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-900 dark:text-slate-100 max-w-xs truncate">
                        {rec.title}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 max-w-[200px] truncate">
                        {rec.location || '—'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 font-mono text-xs tabular-nums whitespace-nowrap">
                        {formatDateVn(rec.collectedDate)}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {PRIORITY_LABELS[rec.priority]}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-800 dark:text-slate-200 whitespace-nowrap">
                        {STATUS_LABELS[rec.status]}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
