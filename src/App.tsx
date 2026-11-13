import { useEffect, useRef, useState } from 'react';
import {
  ClipboardList,
  Home,
  Moon,
  Plus,
  PlusCircle,
  SlidersHorizontal,
  Sun,
} from 'lucide-react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { DevelopingModal } from './components/DevelopingModal';
import { OverviewView } from './components/OverviewView';
import { CollectView } from './components/CollectView';
import { RecordsView } from './components/RecordsView';
import { RecordDetailSheet } from './components/RecordDetailSheet';
import { SchemaView } from './components/SchemaView';
import { sortCategories } from './defaults';
import {
  migrateLegacyTempCategories,
  seedDefaultCategories,
  subscribeCategories,
  subscribeRecords,
} from './services/firestoreService';
import type { AppTab, Category, FieldRecord } from './types';

const WORKSPACE_OWNER_ID = 'personal-workspace';

function AppContent() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [records, setRecords] = useState<FieldRecord[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState('');

  const [activeTab, setActiveTab] = useState<AppTab>('overview');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [recordsCategoryFilter, setRecordsCategoryFilter] = useState<string>('all');
  const [schemaCategoryId, setSchemaCategoryId] = useState<string>('');
  const [selectedRecord, setSelectedRecord] = useState<FieldRecord | null>(null);
  const [developingCategory, setDevelopingCategory] = useState<Category | null>(null);

  const [darkMode, setDarkMode] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('sht_theme') === 'dark';
  });

  const seededRef = useRef<string | null>(null);
  const migratedRef = useRef<boolean>(false);

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
      localStorage.setItem('sht_theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('sht_theme', 'light');
    }
  }, [darkMode]);

  useEffect(() => {
    setDataLoading(true);
    setDataError('');

    const unsubCats = subscribeCategories(
      WORKSPACE_OWNER_ID,
      async (list) => {
        if (list.length === 0 && seededRef.current !== WORKSPACE_OWNER_ID) {
          seededRef.current = WORKSPACE_OWNER_ID;
          try {
            await seedDefaultCategories(WORKSPACE_OWNER_ID);
          } catch {
            setDataError('Không thể khởi tạo các hạng mục mặc định.');
          }
          return;
        }
        if (!migratedRef.current) {
          migratedRef.current = true;
          const didMigrate = await migrateLegacyTempCategories(WORKSPACE_OWNER_ID, list);
          if (didMigrate) return;
        }
        const sorted = sortCategories(list);
        setCategories(sorted);
        setSelectedCategoryId((prev) =>
          prev && sorted.some((c) => c.id === prev && c.group === 'core')
            ? prev
            : sorted.find((c) => c.group === 'core')?.id || sorted[0]?.id || ''
        );
        setDataLoading(false);
      },
      () => {
        setDataError('Không thể tải danh sách hạng mục từ Firestore.');
        setDataLoading(false);
      }
    );

    const unsubRecs = subscribeRecords(
      WORKSPACE_OWNER_ID,
      (list) => {
        setRecords(list);
      },
      () => {
        setDataError('Không thể tải dữ liệu đã thu thập từ Firestore.');
      }
    );

    return () => {
      unsubCats();
      unsubRecs();
    };
  }, []);

  useEffect(() => {
    if (selectedRecord) {
      const updated = records.find((r) => r.id === selectedRecord.id);
      if (updated) {
        setSelectedRecord(updated);
      }
    }
  }, [records, selectedRecord]);

  const handleQuickCollect = (categoryId?: string) => {
    if (categoryId) {
      setSelectedCategoryId(categoryId);
    }
    setActiveTab('collect');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFilterCategory = (categoryId: string) => {
    setRecordsCategoryFilter(categoryId);
    setActiveTab('records');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEditCategoryFields = (categoryId: string) => {
    setSchemaCategoryId(categoryId);
    setActiveTab('schema');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navItems: Array<{ id: AppTab; label: string }> = [
    { id: 'overview', label: 'Tổng quan' },
    { id: 'collect', label: 'Thu thập' },
    { id: 'records', label: 'Danh sách' },
    { id: 'schema', label: 'Cấu trúc' },
  ];

  const mobileTitleMap: Record<AppTab, string> = {
    overview: 'Sổ Hiện Trường',
    collect: 'Thu thập thông tin',
    records: 'Danh sách ghi nhận',
    schema: 'Cấu trúc hạng mục',
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-20 lg:pb-12">
      <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-12 lg:h-16 flex items-center justify-between gap-8">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className="text-base lg:text-lg font-display font-bold tracking-tight text-slate-900 dark:text-slate-100 whitespace-nowrap shrink-0 text-left"
          >
            <span className="lg:hidden">{mobileTitleMap[activeTab]}</span>
            <span className="hidden lg:inline">Sổ Hiện Trường</span>
          </button>

          <nav
            className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-400"
            aria-label="Điều hướng chính"
          >
            {navItems.map((item) => {
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`py-1 whitespace-nowrap shrink-0 transition-colors border-b-2 ${
                    active
                      ? 'text-slate-900 dark:text-slate-100 border-blue-600'
                      : 'border-transparent hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setDarkMode((v) => !v)}
              aria-label={darkMode ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
              className="lg:hidden min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-slate-600 dark:text-slate-300"
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            <button
              type="button"
              onClick={() => handleQuickCollect(selectedCategoryId || categories[0]?.id)}
              className="hidden lg:inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium whitespace-nowrap shrink-0 transition-colors"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              <span>Ghi nhận mới</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-4 sm:pt-6 space-y-5">
        <div className="hidden lg:flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <p>Không gian thu thập dữ liệu hiện trường</p>
          <button
            type="button"
            onClick={() => setDarkMode((v) => !v)}
            className="inline-flex items-center gap-1.5 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
          >
            {darkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            <span>{darkMode ? 'Giao diện sáng' : 'Giao diện tối'}</span>
          </button>
        </div>

        {dataError && (
          <div
            role="alert"
            className="bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 rounded-2xl px-4 py-3 text-sm"
          >
            {dataError}
          </div>
        )}

        {dataLoading ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center text-sm text-slate-500 dark:text-slate-400">
            Đang đồng bộ dữ liệu...
          </div>
        ) : (
          <>
            {activeTab === 'overview' && (
              <OverviewView
                categories={categories}
                records={records}
                onQuickCollect={(catId) => handleQuickCollect(catId)}
                onFilterCategory={handleFilterCategory}
                onSelectRecord={setSelectedRecord}
                onOpenSchema={() => setActiveTab('schema')}
                onDevelopingCategory={setDevelopingCategory}
              />
            )}

            {activeTab === 'collect' && (
              <CollectView
                uid={WORKSPACE_OWNER_ID}
                categories={categories}
                selectedCategoryId={selectedCategoryId}
                onSelectCategory={setSelectedCategoryId}
                onEditCategoryFields={handleEditCategoryFields}
                onDevelopingCategory={setDevelopingCategory}
                onSaved={() => {}}
              />
            )}

            {activeTab === 'records' && (
              <RecordsView
                categories={categories}
                records={records}
                activeCategoryFilter={recordsCategoryFilter}
                onChangeCategoryFilter={setRecordsCategoryFilter}
                onSelectRecord={setSelectedRecord}
                onCreateNew={(catId) => handleQuickCollect(catId)}
                onDevelopingCategory={setDevelopingCategory}
              />
            )}

            {activeTab === 'schema' && (
              <SchemaView
                uid={WORKSPACE_OWNER_ID}
                categories={categories}
                initialCategoryId={schemaCategoryId}
                onDevelopingCategory={setDevelopingCategory}
              />
            )}
          </>
        )}
      </main>

      <DevelopingModal
        category={developingCategory}
        onClose={() => setDevelopingCategory(null)}
      />

      <nav
        aria-label="Thanh điều hướng di động"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 pb-safe"
      >
        <div className="grid grid-cols-4 items-center h-14">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`min-h-[44px] flex flex-col items-center justify-center ${
              activeTab === 'overview'
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <Home className="w-5 h-5" aria-hidden="true" />
            <span className="text-[11px] font-medium tracking-tight mt-0.5 whitespace-nowrap">
              Tổng quan
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('collect')}
            className={`min-h-[44px] flex flex-col items-center justify-center ${
              activeTab === 'collect'
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <PlusCircle className="w-5 h-5" aria-hidden="true" />
            <span className="text-[11px] font-medium tracking-tight mt-0.5 whitespace-nowrap">
              Thu thập
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('records')}
            className={`min-h-[44px] flex flex-col items-center justify-center ${
              activeTab === 'records'
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <ClipboardList className="w-5 h-5" aria-hidden="true" />
            <span className="text-[11px] font-medium tracking-tight mt-0.5 whitespace-nowrap">
              Danh sách
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('schema')}
            className={`min-h-[44px] flex flex-col items-center justify-center ${
              activeTab === 'schema'
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <SlidersHorizontal className="w-5 h-5" aria-hidden="true" />
            <span className="text-[11px] font-medium tracking-tight mt-0.5 whitespace-nowrap">
              Cấu trúc
            </span>
          </button>
        </div>
      </nav>

      <RecordDetailSheet
        record={selectedRecord}
        categories={categories}
        onClose={() => setSelectedRecord(null)}
      />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}
