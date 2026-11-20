import { useEffect, useRef, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import {
  ClipboardList,
  Home,
  LogIn,
  Moon,
  Plus,
  PlusCircle,
  Shield,
  Sun,
} from 'lucide-react';
import { AdminModal } from './components/AdminModal';
import { AuthModal } from './components/AuthModal';
import { BrandLogo } from './components/BrandLogo';
import { CollectView } from './components/CollectView';
import { DevelopingModal } from './components/DevelopingModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Footer } from './components/Footer';
import { OverviewView } from './components/OverviewView';
import { RecordDetailSheet } from './components/RecordDetailSheet';
import { RecordsView } from './components/RecordsView';
import { UserAvatar } from './components/UserAvatar';
import { createGuestCategories, sortCategories } from './defaults';
import { auth } from './firebase';
import {
  migrateLegacyTempCategories,
  ROOT_ADMIN_EMAIL,
  seedDefaultCategories,
  subscribeAdmins,
  subscribeAdminStatus,
  subscribeAllRecords,
  subscribeCategories,
  subscribeRecords,
  subscribeUsers,
  syncUserProfile,
} from './services/firestoreService';
import type { AdminUser, AppTab, Category, FieldRecord, UserProfile } from './types';

function AppContent() {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalReason, setAuthModalReason] = useState<'save' | 'account'>('account');

  const [isDesignatedAdmin, setIsDesignatedAdmin] = useState(false);
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [userDirectory, setUserDirectory] = useState<UserProfile[]>([]);

  const [categories, setCategories] = useState<Category[]>(() => createGuestCategories());
  const [records, setRecords] = useState<FieldRecord[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState('');

  const [activeTab, setActiveTab] = useState<AppTab>('overview');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(
    () => createGuestCategories()[0]?.id || ''
  );
  const [recordsCategoryFilter, setRecordsCategoryFilter] = useState<string>('all');
  const [selectedRecord, setSelectedRecord] = useState<FieldRecord | null>(null);
  const [developingCategory, setDevelopingCategory] = useState<Category | null>(null);

  const [darkMode, setDarkMode] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('sht_theme') === 'dark';
  });

  const seededRef = useRef<string | null>(null);
  const migratedRef = useRef<string | null>(null);
  const categoriesRef = useRef<Category[]>(categories);

  const isRootAdmin =
    Boolean(user?.emailVerified) &&
    user?.email?.toLowerCase() === ROOT_ADMIN_EMAIL;
  const isAdmin = isRootAdmin || (Boolean(user?.emailVerified) && isDesignatedAdmin);

  useEffect(() => {
    categoriesRef.current = categories;
  }, [categories]);

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
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setAuthReady(true);
      if (firebaseUser && firebaseUser.emailVerified) {
        syncUserProfile(firebaseUser).catch(() => {});
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!authReady || !user) {
      setIsDesignatedAdmin(false);
      return;
    }
    const unsubAdminDoc = subscribeAdminStatus(
      user.uid,
      (designated) => setIsDesignatedAdmin(designated),
      () => setIsDesignatedAdmin(false)
    );
    return () => unsubAdminDoc();
  }, [authReady, user?.uid]);

  useEffect(() => {
    if (!authReady) return;

    if (!user) {
      const guestList = createGuestCategories();
      const prevSlug = categoriesRef.current.find((c) => c.id === selectedCategoryId)?.slug;
      setCategories(guestList);
      setRecords([]);
      setAdmins([]);
      setUserDirectory([]);
      setSelectedRecord(null);
      setAdminModalOpen(false);
      setDataLoading(false);
      setDataError('');
      setSelectedCategoryId((prev) => {
        if (prev && guestList.some((c) => c.id === prev && c.group === 'core')) {
          return prev;
        }
        if (prevSlug) {
          const matched = guestList.find((c) => c.slug === prevSlug && c.group === 'core');
          if (matched) return matched.id;
        }
        return guestList.find((c) => c.group === 'core')?.id || guestList[0]?.id || '';
      });
      return;
    }

    setDataLoading(true);
    setDataError('');

    const uid = user.uid;

    const unsubCats = subscribeCategories(
      uid,
      async (list) => {
        if (list.length === 0 && seededRef.current !== uid) {
          seededRef.current = uid;
          try {
            await seedDefaultCategories(uid);
          } catch {
            setDataError('Không thể khởi tạo các hạng mục mặc định.');
            setDataLoading(false);
          }
          return;
        }
        if (migratedRef.current !== uid) {
          migratedRef.current = uid;
          const didMigrate = await migrateLegacyTempCategories(uid, list);
          if (didMigrate) return;
        }
        const sorted = sortCategories(list);
        const prevSlug = categoriesRef.current.find((c) => c.id === selectedCategoryId)?.slug;
        setCategories(sorted);
        setSelectedCategoryId((prev) => {
          if (prev && sorted.some((c) => c.id === prev && c.group === 'core')) {
            return prev;
          }
          if (prevSlug) {
            const matched = sorted.find((c) => c.slug === prevSlug && c.group === 'core');
            if (matched) return matched.id;
          }
          return sorted.find((c) => c.group === 'core')?.id || sorted[0]?.id || '';
        });
        setDataLoading(false);
      },
      () => {
        setDataError('Không thể tải danh sách hạng mục từ Firestore.');
        setDataLoading(false);
      }
    );

    const unsubRecs = isAdmin
      ? subscribeAllRecords(
          (list) => setRecords(list),
          () => setDataError('Không thể tải dữ liệu đã thu thập từ Firestore.')
        )
      : subscribeRecords(
          uid,
          (list) => setRecords(list),
          () => setDataError('Không thể tải dữ liệu đã thu thập từ Firestore.')
        );

    let unsubAdmins: (() => void) | undefined;
    let unsubUsers: (() => void) | undefined;
    if (isAdmin) {
      unsubAdmins = subscribeAdmins(setAdmins, () => {});
      unsubUsers = subscribeUsers(setUserDirectory, () => {});
    } else {
      setAdmins([]);
      setUserDirectory([]);
    }

    return () => {
      unsubCats();
      unsubRecs();
      unsubAdmins?.();
      unsubUsers?.();
    };
  }, [authReady, user?.uid, isAdmin]);

  useEffect(() => {
    if (selectedRecord) {
      const updated = records.find((r) => r.id === selectedRecord.id);
      if (updated) {
        setSelectedRecord(updated);
      }
    }
  }, [records, selectedRecord]);

  const openAuthModal = (reason: 'save' | 'account') => {
    setAuthModalReason(reason);
    setAuthModalOpen(true);
  };

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

  const navItems: Array<{ id: AppTab; label: string }> = [
    { id: 'overview', label: 'Tổng quan' },
    { id: 'collect', label: 'Thu thập' },
    { id: 'records', label: 'Danh sách' },
  ];

  const mobileTitleMap: Record<AppTab, string> = {
    overview: 'Sổ hiện trường TINPNC',
    collect: 'Thu thập thông tin',
    records: 'Danh sách ghi nhận',
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-12 lg:h-16 flex items-center justify-between gap-3 lg:gap-8">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className="min-w-0 flex items-center gap-2.5 text-base lg:text-lg font-display font-bold tracking-tight text-slate-900 dark:text-slate-100 whitespace-nowrap lg:shrink-0 text-left"
          >
            <BrandLogo size="sm" />
            <span className="lg:hidden truncate">{mobileTitleMap[activeTab]}</span>
            <span className="hidden lg:inline">Sổ hiện trường TINPNC</span>
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

          <div className="flex items-center gap-1.5 shrink-0">
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
              onClick={() => openAuthModal('account')}
              title={user ? user.displayName || user.email || 'Tài khoản' : 'Đăng nhập'}
              className={`lg:hidden min-h-[40px] rounded-xl text-xs font-medium flex items-center gap-2 whitespace-nowrap shrink-0 ${
                user
                  ? 'pl-1.5 pr-2.5 py-1 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900'
                  : 'px-3 bg-slate-900 dark:bg-blue-600 text-white'
              }`}
            >
              {user ? (
                <>
                  <UserAvatar user={user} size="sm" />
                  <span className="max-w-[132px] sm:max-w-[240px] truncate">
                    {user.displayName || user.email || 'Tài khoản'}
                  </span>
                </>
              ) : (
                <>
                  <LogIn className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Đăng nhập</span>
                </>
              )}
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

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 pt-4 sm:pt-6 space-y-5">
        <div className="hidden lg:flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          {user ? (
            <button
              type="button"
              onClick={() => openAuthModal('account')}
              className="inline-flex items-center gap-2 text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              <UserAvatar user={user} size="sm" />
              <span className="font-medium">
                {user.displayName || user.email}
              </span>
              {isAdmin && (
                <span className="text-blue-600 dark:text-blue-400 font-medium">
                  · Quản trị viên
                </span>
              )}
            </button>
          ) : (
            <p>
              Chế độ xem trước — Bạn có thể thao tác đầy đủ, nhưng cần đăng nhập Google để lưu dữ liệu
            </p>
          )}
          <div className="flex items-center gap-5 shrink-0">
            {isAdmin && (
              <button
                type="button"
                onClick={() => setAdminModalOpen(true)}
                className="inline-flex items-center gap-1.5 font-medium text-blue-600 dark:text-blue-400 hover:underline whitespace-nowrap"
              >
                <Shield className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Quản trị viên</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => openAuthModal('account')}
              className="inline-flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors whitespace-nowrap"
            >
              {user ? (
                <span>Tài khoản</span>
              ) : (
                <>
                  <LogIn className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Đăng nhập Google</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => setDarkMode((v) => !v)}
              className="inline-flex items-center gap-1.5 hover:text-slate-900 dark:hover:text-slate-100 transition-colors whitespace-nowrap"
            >
              {darkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
              <span>{darkMode ? 'Giao diện sáng' : 'Giao diện tối'}</span>
            </button>
          </div>
        </div>

        {dataError && (
          <div
            role="alert"
            className="bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 rounded-2xl px-4 py-3 text-sm"
          >
            {dataError}
          </div>
        )}

        {!authReady || dataLoading ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 flex flex-col items-center gap-3 text-center text-sm text-slate-500 dark:text-slate-400">
            <BrandLogo size="lg" />
            <span>Đang đồng bộ dữ liệu...</span>
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
                onDevelopingCategory={setDevelopingCategory}
              />
            )}

            {activeTab === 'collect' && (
              <CollectView
                user={user}
                categories={categories}
                selectedCategoryId={selectedCategoryId}
                onSelectCategory={setSelectedCategoryId}
                onDevelopingCategory={setDevelopingCategory}
                onRequireAuth={() => openAuthModal('save')}
                onSaved={() => {}}
              />
            )}

            {activeTab === 'records' && (
              <RecordsView
                user={user}
                isAdmin={isAdmin}
                users={userDirectory}
                categories={categories}
                records={records}
                activeCategoryFilter={recordsCategoryFilter}
                onChangeCategoryFilter={setRecordsCategoryFilter}
                onSelectRecord={setSelectedRecord}
                onCreateNew={(catId) => handleQuickCollect(catId)}
                onDevelopingCategory={setDevelopingCategory}
                onRequireAuth={() => openAuthModal('save')}
              />
            )}
          </>
        )}
      </main>

      <Footer />

      <DevelopingModal
        category={developingCategory}
        onClose={() => setDevelopingCategory(null)}
      />

      <AuthModal
        open={authModalOpen}
        user={user}
        isAdmin={isAdmin}
        reason={authModalReason}
        onClose={() => setAuthModalOpen(false)}
        onOpenAdmin={() => setAdminModalOpen(true)}
      />

      {user && isAdmin && (
        <AdminModal
          open={adminModalOpen}
          currentUser={user}
          admins={admins}
          users={userDirectory}
          onClose={() => setAdminModalOpen(false)}
        />
      )}

      <nav
        aria-label="Thanh điều hướng di động"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 pb-safe"
      >
        <div className="grid grid-cols-3 items-center h-14">
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
        </div>
      </nav>

      <RecordDetailSheet
        user={user}
        isAdmin={isAdmin}
        record={selectedRecord}
        categories={categories}
        onRequireAuth={() => openAuthModal('save')}
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
