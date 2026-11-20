import type {
  Category,
  CategoryColor,
  CategoryIcon,
  FieldDefinition,
  RecordPriority,
  RecordStatus,
} from './types';

export interface SeedCategoryTemplate {
  idSuffix: string;
  name: string;
  slug: string;
  description: string;
  group: 'core' | 'temporary';
  colorKey: CategoryColor;
  iconKey: CategoryIcon;
  order: number;
  fields: FieldDefinition[];
}

export const DEFAULT_CATEGORY_TEMPLATES: SeedCategoryTemplate[] = [
  {
    idSuffix: 'trien-khai',
    name: 'Triển Khai',
    slug: 'trien-khai',
    description: 'Thu thập thông tin lắp đặt mới, cấu hình hệ thống và tiến độ bàn giao tại điểm.',
    group: 'core',
    colorKey: 'blue',
    iconKey: 'rocket',
    order: 1,
    fields: [
      {
        key: 'ma_du_an',
        label: 'Mã dự án / Hợp đồng',
        type: 'text',
        required: false,
        placeholder: 'Ví dụ: TK-2026-014',
      },
      {
        key: 'hang_muc_lap_dat',
        label: 'Hạng mục lắp đặt',
        type: 'text',
        required: false,
        placeholder: 'Thiết bị, phần mềm, đường truyền...',
      },
      {
        key: 'tinh_trang_ha_tang',
        label: 'Tình trạng hạ tầng',
        type: 'select',
        required: false,
        options: ['Đạt chuẩn', 'Cần bổ sung', 'Chờ mặt bằng'],
      },
      {
        key: 'ngay_du_kien',
        label: 'Ngày dự kiến hoàn tất',
        type: 'date',
        required: false,
      },
    ],
  },
  {
    idSuffix: 'bao-tri',
    name: 'Bảo Trì',
    slug: 'bao-tri',
    description: 'Ghi nhận kiểm tra định kỳ, bảo dưỡng thiết bị, vật tư thay thế và tình trạng vận hành.',
    group: 'core',
    colorKey: 'amber',
    iconKey: 'wrench',
    order: 2,
    fields: [
      {
        key: 'ma_thiet_bi',
        label: 'Mã thiết bị / Serial',
        type: 'text',
        required: false,
        placeholder: 'Nhập mã hoặc số serial',
      },
      {
        key: 'chu_ky_bao_tri',
        label: 'Loại bảo trì',
        type: 'select',
        required: false,
        options: ['Định kỳ tháng', 'Định kỳ quý', 'Đột xuất'],
      },
      {
        key: 'linh_kien_thay',
        label: 'Vật tư / Linh kiện sử dụng',
        type: 'text',
        required: false,
        placeholder: 'Liệt kê nếu có thay thế',
      },
      {
        key: 'ket_qua_kiem_tra',
        label: 'Đánh giá sau kiểm tra',
        type: 'select',
        required: false,
        options: ['Hoạt động tốt', 'Cần theo dõi', 'Đề xuất thay mới'],
      },
    ],
  },
  {
    idSuffix: 'hang-muc-3',
    name: 'Bản đồ vị trí',
    slug: 'hang-muc-3',
    description: 'Hiển thị bản đồ tại vị trí đang đứng, lấy nhanh tọa độ GPS hiện tại và lưu điểm hiện trường.',
    group: 'core',
    colorKey: 'emerald',
    iconKey: 'clipboard',
    order: 3,
    fields: [],
  },
  {
    idSuffix: 'hang-muc-4',
    name: 'Hạng mục 4',
    slug: 'hang-muc-4',
    description: 'Đang phát triển',
    group: 'temporary',
    colorKey: 'slate',
    iconKey: 'layers',
    order: 4,
    fields: [],
  },
  {
    idSuffix: 'hang-muc-5',
    name: 'Hạng mục 5',
    slug: 'hang-muc-5',
    description: 'Đang phát triển',
    group: 'temporary',
    colorKey: 'slate',
    iconKey: 'layers',
    order: 5,
    fields: [],
  },
  {
    idSuffix: 'hang-muc-6',
    name: 'Hạng mục 6',
    slug: 'hang-muc-6',
    description: 'Đang phát triển',
    group: 'temporary',
    colorKey: 'slate',
    iconKey: 'layers',
    order: 6,
    fields: [],
  },
];

export const STATUS_LABELS: Record<RecordStatus, string> = {
  moi: 'Mới ghi nhận',
  dang_xu_ly: 'Đang xử lý',
  hoan_thanh: 'Hoàn thành',
  da_luu_tru: 'Đã chốt lưu trữ',
};

export const PRIORITY_LABELS: Record<RecordPriority, string> = {
  thap: 'Thấp',
  trung_binh: 'Trung bình',
  cao: 'Cao',
};

export const COLOR_STYLES: Record<
  CategoryColor,
  {
    iconBg: string;
    iconText: string;
    accentText: string;
    ring: string;
    dot: string;
  }
> = {
  blue: {
    iconBg: 'bg-blue-50 dark:bg-blue-950/60',
    iconText: 'text-blue-700 dark:text-blue-300',
    accentText: 'text-blue-700 dark:text-blue-400',
    ring: 'focus-visible:ring-blue-500',
    dot: 'bg-blue-600',
  },
  amber: {
    iconBg: 'bg-amber-50 dark:bg-amber-950/60',
    iconText: 'text-amber-700 dark:text-amber-300',
    accentText: 'text-amber-700 dark:text-amber-400',
    ring: 'focus-visible:ring-amber-500',
    dot: 'bg-amber-600',
  },
  emerald: {
    iconBg: 'bg-emerald-50 dark:bg-emerald-950/60',
    iconText: 'text-emerald-700 dark:text-emerald-300',
    accentText: 'text-emerald-700 dark:text-emerald-400',
    ring: 'focus-visible:ring-emerald-500',
    dot: 'bg-emerald-600',
  },
  violet: {
    iconBg: 'bg-violet-50 dark:bg-violet-950/60',
    iconText: 'text-violet-700 dark:text-violet-300',
    accentText: 'text-violet-700 dark:text-violet-400',
    ring: 'focus-visible:ring-violet-500',
    dot: 'bg-violet-600',
  },
  rose: {
    iconBg: 'bg-rose-50 dark:bg-rose-950/60',
    iconText: 'text-rose-700 dark:text-rose-300',
    accentText: 'text-rose-700 dark:text-rose-400',
    ring: 'focus-visible:ring-rose-500',
    dot: 'bg-rose-600',
  },
  slate: {
    iconBg: 'bg-slate-100 dark:bg-slate-800',
    iconText: 'text-slate-700 dark:text-slate-300',
    accentText: 'text-slate-700 dark:text-slate-300',
    ring: 'focus-visible:ring-slate-500',
    dot: 'bg-slate-600',
  },
};

export function buildCategoryDocId(uid: string, slug: string): string {
  const safeUid = uid.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 48);
  const safeSlug = slug.replace(/[^a-z0-9-]/g, '').slice(0, 40);
  return `cat_${safeUid}_${safeSlug}`;
}

export function slugifyVietnamese(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'hang-muc';
}

export function sanitizeFieldKey(label: string): string {
  return (
    slugifyVietnamese(label).replace(/-/g, '_').slice(0, 36) ||
    `truong_${Date.now().toString(36)}`
  );
}

export function getTodayIsoDate(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function formatDateVn(isoDate: string): string {
  if (!isoDate || !/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return isoDate;
  const [y, m, d] = isoDate.split('-');
  return `${d}/${m}/${y}`;
}

export function sortCategories(list: Category[]): Category[] {
  return [...list].sort((a, b) => a.order - b.order || a.name.localeCompare(b.name, 'vi'));
}

export function createGuestCategories(): Category[] {
  return DEFAULT_CATEGORY_TEMPLATES.map((tpl) => ({
    id: buildCategoryDocId('guest', tpl.slug),
    ownerId: 'guest',
    name: tpl.name,
    slug: tpl.slug,
    description: tpl.description,
    group: tpl.group,
    colorKey: tpl.colorKey,
    iconKey: tpl.iconKey,
    order: tpl.order,
    fields: tpl.fields,
  }));
}

