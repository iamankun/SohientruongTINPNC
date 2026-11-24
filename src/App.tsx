import { useEffect, useRef, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import {
  ClipboardList,
  Home,
  LogIn,
  Plus,
  PlusCircle,
  Shield,
  WifiOff,
} from 'lucide-react';
import { AdminModal } from './components/AdminModal';
import { AuthModal } from './components/AuthModal';
import { BookLoading } from './components/BookLoading';
import { BrandLogo } from './components/BrandLogo';
import { CollectView } from './components/CollectView';
import { DevelopingModal } from './components/DevelopingModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Footer } from './components/Footer';
import { OverviewView } from './components/OverviewView';
import { PWAInstallBanner, PWAInstallModal } from './components/PWAInstallGuide';
import { RecordDetailSheet } from './components/RecordDetailSheet';
import { RecordsView } from './components/RecordsView';
import { UserAvatar } from './components/UserAvatar';
import { createGuestCategories, sortCategories } from './defaults';
import { auth } from './firebase';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { usePWAInstall } from './hooks/usePWAInstall';
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

const TAB_ORDER: AppTab[] = ['overview', 'collect', 'records'];

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
  const [tabDirection, setTabDirection] = useState<'initial' | 'next' | 'prev'>('initial');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(
    () => createGuestCategories()[0]?.id || ''
  );
  const [recordsCategoryFilter, setRecordsCategoryFilter] = useState<string>('all');
  const [selectedRecord, setSelectedRecord] = useState<FieldRecord | null>(null);
  const [developingCategory, setDevelopingCategory] = useState<Category | null>(null);

  const isOnline = useOnlineStatus();
  const { isInstallable, isInstalled, isIOS, isAndroid, isInAppBrowser, install } =
    usePWAInstall();
  const [installModalOpen, setInstallModalOpen] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const raw = localStorage.getItem('sht_pwa_banner_dismissed_at');
    if (!raw) return false;
    const dismissedAt = Number(raw);
    return Number.isFinite(dismissedAt) && Date.now() - dismissedAt < 7 * 24 * 60 * 60 * 1000;
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
    document.documentElement.classList.add('dark');
    localStorage.setItem('sht_theme', 'dark');
  }, []);

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

  const switchTab = (nextTab: AppTab) => {
    if (nextTab === activeTab) return;
    const prevIdx = TAB_ORDER.indexOf(activeTab);
    const nextIdx = TAB_ORDER.indexOf(nextTab);
    setTabDirection(nextIdx >= prevIdx ? 'next' : 'prev');
    setActiveTab(nextTab);
  };

  const handleQuickCollect = (categoryId?: string) => {
    if (categoryId) {
      setSelectedCategoryId(categoryId);
    }
    switchTab('collect');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFilterCategory = (categoryId: string) => {
    setRecordsCategoryFilter(categoryId);
    switchTab('records');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDismissInstallBanner = () => {
    localStorage.setItem('sht_pwa_banner_dismissed_at', String(Date.now()));
    setBannerDismissed(true);
  };

  const handleBannerInstallClick = async () => {
    if (isInstallable) {
      const accepted = await install();
      if (accepted) return;
    }
    setInstallModalOpen(true);
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

  const activeTabIndex = TAB_ORDER.indexOf(activeTab);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-12 lg:h-16 flex items-center justify-between gap-3 lg:gap-8">
          <button
            type="button"
            onClick={() => switchTab('overview')}
            className="min-w-0 flex items-center gap-2.5 text-base lg:text-lg font-display font-bold tracking-tight text-slate-900 dark:text-slate-100 whitespace-nowrap lg:shrink-0 text-left btn-press"
          >
            <BrandLogo size="sm" />
            <span className="lg:hidden truncate">{mobileTitleMap[activeTab]}</span>
            <span className="hidden lg:inline">Sổ hiện trường TINPNC</span>
          </button>

          <nav
            className="hidden lg:grid grid-cols-3 relative w-[288px] text-sm font-medium text-slate-600 dark:text-slate-400"
            aria-label="Điều hướng chính"
          >
            {navItems.map((item) => {
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => switchTab(item.id)}
                  className={`py-2.5 text-center whitespace-nowrap shrink-0 btn-press ${
                    active
                      ? 'text-slate-900 dark:text-slate-100 font-semibold'
                      : 'hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
            <span
              aria-hidden="true"
              className={`pointer-events-none absolute bottom-0 left-0 w-1/3 h-0.5 flex justify-center transition-transform duration-[420ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${
                activeTabIndex === 0
                  ? 'translate-x-0'
                  : activeTabIndex === 1
                    ? 'translate-x-full'
                    : 'translate-x-[200%]'
              }`}
            >
              <span className="w-14 h-full bg-gradient-to-r from-blue-600 via-sky-400 to-blue-600 rounded-full shadow-[0_2px_14px_rgba(37,99,235,0.42)]" />
            </span>
          </nav>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => openAuthModal('account')}
              title={user ? user.displayName || user.email || 'Tài khoản' : 'Đăng nhập'}
              className={`lg:hidden min-h-[40px] rounded-xl text-xs font-medium flex items-center gap-2 whitespace-nowrap shrink-0 btn-press ${
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
              className="group hidden lg:inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium whitespace-nowrap shrink-0 btn-primary"
            >
              <Plus
                className="w-4 h-4 transition-transform duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:rotate-90"
                aria-hidden="true"
              />
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
          </div>
        </div>

        {!isOnline && (
          <div
            role="status"
            className="animate-item-enter bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 rounded-2xl px-4 py-2.5 text-xs sm:text-sm flex items-center gap-2.5"
          >
            <WifiOff className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>Đang ngoại tuyến — Dữ liệu bộ nhớ đệm đang được hiển thị.</span>
          </div>
        )}

        <PWAInstallBanner
          visible={!isInstalled && !bannerDismissed && (isInstallable || isIOS || isAndroid)}
          isInstallable={isInstallable}
          isIOS={isIOS}
          onInstallClick={handleBannerInstallClick}
          onDismiss={handleDismissInstallBanner}
        />

        {dataError && (
          <div
            role="alert"
            className="animate-item-enter bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 rounded-2xl px-4 py-3 text-sm"
          >
            {dataError}
          </div>
        )}

        {!authReady || dataLoading ? (
          <BookLoading />
        ) : (
          <div
            key={activeTab}
            className={
              tabDirection === 'next'
                ? 'animate-page-next'
                : tabDirection === 'prev'
                  ? 'animate-page-prev'
                  : 'animate-view-enter'
            }
          >
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
          </div>
        )}
      </main>

      <Footer
        canInstall={!isInstalled}
        onOpenInstall={() => setInstallModalOpen(true)}
      />

      <DevelopingModal
        category={developingCategory}
        onClose={() => setDevelopingCategory(null)}
      />

      <AuthModal
        open={authModalOpen}
        user={user}
        isAdmin={isAdmin}
        reason={authModalReason}
        canInstall={!isInstalled}
        onClose={() => setAuthModalOpen(false)}
        onOpenAdmin={() => setAdminModalOpen(true)}
        onOpenInstall={() => setInstallModalOpen(true)}
      />

      <PWAInstallModal
        open={installModalOpen}
        defaultTab={isIOS ? 'ios' : 'android'}
        isInstallable={isInstallable}
        isInAppBrowser={isInAppBrowser}
        onInstallNative={install}
        onClose={() => setInstallModalOpen(false)}
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
        <div className="grid grid-cols-3 items-stretch h-14">
          <button
            type="button"
            onClick={() => switchTab('overview')}
            className={`h-full min-h-[44px] flex flex-col items-center justify-center gap-0.5 btn-press ${
              activeTab === 'overview'
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <span
              className={`w-12 h-7 rounded-full flex items-center justify-center transition-colors duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                activeTab === 'overview'
                  ? 'bg-blue-50 dark:bg-blue-500/15'
                  : 'bg-transparent'
              }`}
            >
              <Home
                className={`w-[18px] h-[18px] transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                  activeTab === 'overview' ? 'scale-105' : ''
                }`}
                strokeWidth={activeTab === 'overview' ? 2.2 : 1.8}
                aria-hidden="true"
              />
            </span>
            <span className="text-[11px] font-medium tracking-tight leading-none whitespace-nowrap">
              Tổng quan
            </span>
          </button>

          <button
            type="button"
            onClick={() => switchTab('collect')}
            className={`h-full min-h-[44px] flex flex-col items-center justify-center gap-0.5 btn-press ${
              activeTab === 'collect'
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <span
              className={`w-12 h-7 rounded-full flex items-center justify-center transition-colors duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                activeTab === 'collect'
                  ? 'bg-blue-50 dark:bg-blue-500/15'
                  : 'bg-transparent'
              }`}
            >
              <PlusCircle
                className={`w-[18px] h-[18px] transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                  activeTab === 'collect' ? 'scale-105' : ''
                }`}
                strokeWidth={activeTab === 'collect' ? 2.2 : 1.8}
                aria-hidden="true"
              />
            </span>
            <span className="text-[11px] font-medium tracking-tight leading-none whitespace-nowrap">
              Thu thập
            </span>
          </button>

          <button
            type="button"
            onClick={() => switchTab('records')}
            className={`h-full min-h-[44px] flex flex-col items-center justify-center gap-0.5 btn-press ${
              activeTab === 'records'
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <span
              className={`w-12 h-7 rounded-full flex items-center justify-center transition-colors duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                activeTab === 'records'
                  ? 'bg-blue-50 dark:bg-blue-500/15'
                  : 'bg-transparent'
              }`}
            >
              <ClipboardList
                className={`w-[18px] h-[18px] transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                  activeTab === 'records' ? 'scale-105' : ''
                }`}
                strokeWidth={activeTab === 'records' ? 2.2 : 1.8}
                aria-hidden="true"
              />
            </span>
            <span className="text-[11px] font-medium tracking-tight leading-none whitespace-nowrap">
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
