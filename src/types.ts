import type { Timestamp } from 'firebase/firestore';

export type FieldType = 'text' | 'number' | 'select' | 'date' | 'textarea';

export interface FieldDefinition {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  placeholder?: string;
  options?: string[];
}

export type CategoryGroup = 'core' | 'temporary';
export type CategoryColor = 'blue' | 'amber' | 'emerald' | 'violet' | 'rose' | 'slate';
export type CategoryIcon = 'rocket' | 'wrench' | 'clipboard' | 'check' | 'alert' | 'layers';

export interface Category {
  id: string;
  ownerId: string;
  name: string;
  slug: string;
  description: string;
  group: CategoryGroup;
  colorKey: CategoryColor;
  iconKey: CategoryIcon;
  order: number;
  fields: FieldDefinition[];
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

export type RecordStatus = 'moi' | 'dang_xu_ly' | 'hoan_thanh' | 'da_luu_tru';
export type RecordPriority = 'thap' | 'trung_binh' | 'cao';

export interface FieldRecord {
  id: string;
  ownerId: string;
  categoryId: string;
  categoryName: string;
  title: string;
  location: string;
  contactName: string;
  status: RecordStatus;
  priority: RecordPriority;
  notes: string;
  customData: Record<string, string | number>;
  collectedDate: string;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

export type AppTab = 'overview' | 'collect' | 'records';
