import { ArrowRight, Plus } from 'lucide-react';
import { COLOR_STYLES, formatDateVn, getTodayIsoDate, PRIORITY_LABELS, STATUS_LABELS } from '../defaults';
import type { Category, FieldRecord } from '../types';
import { CategoryIcon } from './CategoryIcon';

interface OverviewViewProps {
  categories: Category[];
  records: FieldRecord[];
  onQuickCollect: (categoryId: string) => void;
  onFilterCategory: (categoryId: string) => void;
  onSelectRecord: (record: FieldRecord) => void;
  onDevelopingCategory: (category: Category) => void;
}

export function OverviewView({
  categories,
  records,
  onQuickCollect,
  onFilterCategory,
  onSelectRecord,
  onDevelopingCategory,
}: OverviewViewProps) {
  const today = getTodayIsoDate();
  const todayCount = records.filter((r) => r.collectedDate === today).length;
  const activeCount = records.filter(
    (r) => r.status === 'moi' || r.status === 'dang_xu_ly'
  ).length;
  const doneCount = records.filter(
    (r) => r.status === 'hoan_thanh' || r.status === 'da_luu_tru'
  ).length;

  const coreCategories = categories.filter((c) => c.group === 'core');
  const tempCategories = categories.filter((c) => c.group === 'temporary');

  const countByCategory = records.reduce<Record<string, number>>((acc, rec) => {
    acc[rec.categoryId] = (acc[rec.categoryId] || 0) + 1;
    return acc;
  }, {});

  const recentRecords = records.slice(0, 5);
  const categoryMap = new Map(categories.map((c) => [c.id, c]));

  return (
    <div className="space-y-7">
      <section aria-label="Thống kê nhanh" className="grid grid-cols-3 gap-3">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 sm:p-4">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Hôm nay</p>
          <p className="mt-1 text-2xl font-display font-bold tracking-tight text-slate-900 dark:text-slate-100 tabular-nums">
            {todayCount}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 sm:p-4">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Đang xử lý</p>
          <p className="mt-1 text-2xl font-display font-bold tracking-tight text-blue-700 dark:text-blue-400 tabular-nums">
            {activeCount}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 sm:p-4">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Hoàn thành</p>
          <p className="mt-1 text-2xl font-display font-bold tracking-tight text-emerald-700 dark:text-emerald-400 tabular-nums">
            {doneCount}
          </p>
        </div>
      </section>

      <section aria-labelledby="core-categories-heading" className="space-y-3">
        <div className="flex items-baseline justify-between gap-4">
          <h2
            id="core-categories-heading"
            className="text-base sm:text-lg font-display font-semibold text-slate-900 dark:text-slate-100"
          >
            Hạng mục chính
          </h2>
          <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
            {coreCategories.length} mục cốt lõi
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {coreCategories.map((cat) => {
            const style = COLOR_STYLES[cat.colorKey] || COLOR_STYLES.blue;
            const total = countByCategory[cat.id] || 0;
            return (
              <div
                key={cat.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col justify-between gap-4"
              >
                <div className="flex items-start gap-3.5">
                  <div
                    className={`w-11 h-11 rounded-xl shrink-0 flex items-center justify-center ${style.iconBg} ${style.iconText}`}
                  >
                    <CategoryIcon iconKey={cat.iconKey} className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-display font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {cat.name}
                    </h3>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                      {total} bản ghi <span aria-hidden="true">·</span>{' '}
                      {cat.slug === 'bao-tri' ? '12 bước BOT' : `${cat.fields.length} trường dữ liệu`}
                    </p>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                      {cat.slug === 'bao-tri'
                        ? 'Thu thập theo kịch bản tin nhắn BOT gồm 12 bước kiểm tra thiết bị, xử lý và tọa độ.'
                        : cat.description || 'Thu thập thông tin hiện trường cho hạng mục này.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => onQuickCollect(cat.id)}
                    className="flex-1 min-h-[44px] px-4 py-2 rounded-xl bg-slate-900 dark:bg-blue-600 text-white text-sm font-medium flex items-center justify-center gap-2 hover:bg-slate-800 dark:hover:bg-blue-500 active:scale-[0.99] transition-all whitespace-nowrap"
                  >
                    <Plus className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span>{cat.slug === 'bao-tri' ? 'Mở BOT Bảo Trì' : 'Ghi nhận mới'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onFilterCategory(cat.id)}
                    className="min-h-[44px] px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-medium hover:bg-slate-200/80 dark:hover:bg-slate-700 transition-colors whitespace-nowrap"
                  >
                    Xem danh sách
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section aria-labelledby="temp-categories-heading" className="space-y-3">
        <div>
          <h2
            id="temp-categories-heading"
            className="text-base sm:text-lg font-display font-semibold text-slate-900 dark:text-slate-100"
          >
            Hạng mục mở rộng
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            4 mục tạm thời đang trong giai đoạn phát triển
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {tempCategories.map((cat) => {
            const style = COLOR_STYLES[cat.colorKey] || COLOR_STYLES.slate;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => onDevelopingCategory(cat)}
                className="text-left bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 sm:p-4 hover:border-slate-300 dark:hover:border-slate-700 active:scale-[0.98] transition-all flex flex-col justify-between min-h-[116px]"
              >
                <div className="flex items-center justify-between gap-2 w-full">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center ${style.iconBg} ${style.iconText}`}
                  >
                    <CategoryIcon iconKey={cat.iconKey} className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <h3 className="text-sm sm:text-base font-display font-semibold text-slate-900 dark:text-slate-100 truncate">
                    {cat.name}
                  </h3>
                  <p className="mt-0.5 text-xs text-amber-700 dark:text-amber-400 truncate">
                    Đang phát triển
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section aria-labelledby="recent-records-heading" className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2
            id="recent-records-heading"
            className="text-base sm:text-lg font-display font-semibold text-slate-900 dark:text-slate-100"
          >
            Ghi nhận gần đây
          </h2>
          {records.length > 0 && (
            <button
              type="button"
              onClick={() => onFilterCategory('all')}
              className="min-h-[44px] px-2 text-xs font-medium text-blue-700 dark:text-blue-400 flex items-center gap-1 hover:underline whitespace-nowrap shrink-0"
            >
              <span>Tất cả ({records.length})</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          )}
        </div>

        {recentRecords.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-center space-y-2">
            <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
              Chưa có thông tin nào được thu thập
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Chọn Triển Khai, Bảo Trì hoặc một hạng mục ở trên để bắt đầu ghi nhận.
            </p>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
            {recentRecords.map((rec) => {
              const cat = categoryMap.get(rec.categoryId);
              const style = COLOR_STYLES[cat?.colorKey || 'slate'];
              return (
                <button
                  key={rec.id}
                  type="button"
                  onClick={() => onSelectRecord(rec)}
                  className="w-full text-left px-4 py-3.5 min-h-[64px] flex items-center gap-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
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
                      <span aria-hidden="true"> · </span>
                      {PRIORITY_LABELS[rec.priority]}
                    </p>
                  </div>
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300 shrink-0 whitespace-nowrap">
                    {STATUS_LABELS[rec.status]}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
