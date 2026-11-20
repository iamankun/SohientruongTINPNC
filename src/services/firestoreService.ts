import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import {
  buildCategoryDocId,
  DEFAULT_CATEGORY_TEMPLATES,
  slugifyVietnamese,
} from '../defaults';
import { db, handleFirestoreError, OperationType } from '../firebase';
import type { User } from 'firebase/auth';
import type {
  AdminUser,
  Category,
  CategoryColor,
  CategoryGroup,
  CategoryIcon,
  FieldDefinition,
  FieldRecord,
  RecordPriority,
  RecordStatus,
  UserProfile,
} from '../types';

export const ROOT_ADMIN_EMAIL = 'ankun.n.m@gmail.com';

function clampString(value: string | undefined | null, maxLength: number): string {
  if (!value) return '';
  return String(value).trim().slice(0, maxLength);
}

function sanitizeFields(fields: FieldDefinition[]): FieldDefinition[] {
  return fields.slice(0, 20).map((f) => ({
    key: clampString(f.key, 40) || `truong_${Math.random().toString(36).slice(2, 6)}`,
    label: clampString(f.label, 60) || 'Trường thông tin',
    type: f.type,
    required: Boolean(f.required),
    placeholder: clampString(f.placeholder, 100),
    ...(f.type === 'select' && Array.isArray(f.options)
      ? { options: f.options.map((o) => clampString(o, 60)).filter(Boolean).slice(0, 15) }
      : {}),
  }));
}

function sanitizeCustomData(data: Record<string, string | number>): Record<string, string | number> {
  const out: Record<string, string | number> = {};
  const entries = Object.entries(data).slice(0, 25);
  for (const [k, v] of entries) {
    const cleanKey = clampString(k, 40);
    if (!cleanKey) continue;
    if (typeof v === 'number' && Number.isFinite(v)) {
      out[cleanKey] = v;
    } else if (v !== undefined && v !== null) {
      const str = String(v).slice(0, 500);
      if (str.length > 0) {
        out[cleanKey] = str;
      }
    }
  }
  return out;
}

export function subscribeCategories(
  uid: string,
  onData: (categories: Category[]) => void,
  onError?: (err: Error) => void
) {
  const q = query(collection(db, 'categories'), where('ownerId', '==', uid));
  return onSnapshot(
    q,
    (snapshot) => {
      const list: Category[] = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<Category, 'id'>),
      }));
      onData(list);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, 'categories');
      } catch (wrapped) {
        if (onError && wrapped instanceof Error) {
          onError(wrapped);
        }
      }
    }
  );
}

export function subscribeRecords(
  uid: string,
  onData: (records: FieldRecord[]) => void,
  onError?: (err: Error) => void
) {
  const q = query(collection(db, 'records'), where('ownerId', '==', uid));
  return onSnapshot(
    q,
    (snapshot) => {
      const list: FieldRecord[] = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<FieldRecord, 'id'>),
      }));
      list.sort((a, b) => {
        const dateCompare = b.collectedDate.localeCompare(a.collectedDate);
        if (dateCompare !== 0) return dateCompare;
        const aSec = a.createdAt?.seconds ?? 0;
        const bSec = b.createdAt?.seconds ?? 0;
        return bSec - aSec;
      });
      onData(list);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, 'records');
      } catch (wrapped) {
        if (onError && wrapped instanceof Error) {
          onError(wrapped);
        }
      }
    }
  );
}

export function subscribeAllRecords(
  onData: (records: FieldRecord[]) => void,
  onError?: (err: Error) => void
) {
  return onSnapshot(
    collection(db, 'records'),
    (snapshot) => {
      const list: FieldRecord[] = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<FieldRecord, 'id'>),
      }));
      list.sort((a, b) => {
        const dateCompare = b.collectedDate.localeCompare(a.collectedDate);
        if (dateCompare !== 0) return dateCompare;
        const aSec = a.createdAt?.seconds ?? 0;
        const bSec = b.createdAt?.seconds ?? 0;
        return bSec - aSec;
      });
      onData(list);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, 'records');
      } catch (wrapped) {
        if (onError && wrapped instanceof Error) {
          onError(wrapped);
        }
      }
    }
  );
}

export async function syncUserProfile(user: User): Promise<void> {
  const path = `users/${user.uid}`;
  try {
    await setDoc(
      doc(db, 'users', user.uid),
      {
        uid: user.uid,
        email: clampString(user.email, 160),
        displayName: clampString(user.displayName, 120),
        photoURL: clampString(user.photoURL, 500),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export function subscribeAdminStatus(
  uid: string,
  onData: (isDesignated: boolean) => void,
  onError?: (err: Error) => void
) {
  const path = `admins/${uid}`;
  return onSnapshot(
    doc(db, 'admins', uid),
    (snapshot) => {
      onData(snapshot.exists());
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.GET, path);
      } catch (wrapped) {
        if (onError && wrapped instanceof Error) {
          onError(wrapped);
        }
      }
    }
  );
}

export function subscribeAdmins(
  onData: (admins: AdminUser[]) => void,
  onError?: (err: Error) => void
) {
  return onSnapshot(
    collection(db, 'admins'),
    (snapshot) => {
      const list: AdminUser[] = snapshot.docs.map((d) => ({
        ...(d.data() as AdminUser),
        uid: d.id,
      }));
      onData(list);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, 'admins');
      } catch (wrapped) {
        if (onError && wrapped instanceof Error) {
          onError(wrapped);
        }
      }
    }
  );
}

export function subscribeUsers(
  onData: (users: UserProfile[]) => void,
  onError?: (err: Error) => void
) {
  return onSnapshot(
    collection(db, 'users'),
    (snapshot) => {
      const list: UserProfile[] = snapshot.docs.map((d) => ({
        ...(d.data() as UserProfile),
        uid: d.id,
      }));
      list.sort((a, b) => (a.displayName || a.email).localeCompare(b.displayName || b.email, 'vi'));
      onData(list);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, 'users');
      } catch (wrapped) {
        if (onError && wrapped instanceof Error) {
          onError(wrapped);
        }
      }
    }
  );
}

export async function designateAdmin(
  target: { uid: string; email?: string; displayName?: string },
  addedByUid: string
): Promise<void> {
  const cleanUid = clampString(target.uid, 128);
  if (!/^[a-zA-Z0-9_-]+$/.test(cleanUid)) {
    throw new Error('Mã UID không hợp lệ (chỉ gồm chữ, số, _ và -).');
  }
  const path = `admins/${cleanUid}`;
  try {
    await setDoc(doc(db, 'admins', cleanUid), {
      uid: cleanUid,
      email: clampString(target.email, 160),
      displayName: clampString(target.displayName, 120),
      addedByUid: clampString(addedByUid, 128),
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function revokeAdmin(targetUid: string): Promise<void> {
  const cleanUid = clampString(targetUid, 128);
  const path = `admins/${cleanUid}`;
  try {
    await deleteDoc(doc(db, 'admins', cleanUid));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function seedDefaultCategories(uid: string): Promise<void> {
  const batch = writeBatch(db);
  for (const tpl of DEFAULT_CATEGORY_TEMPLATES) {
    const docId = buildCategoryDocId(uid, tpl.slug);
    const ref = doc(db, 'categories', docId);
    batch.set(ref, {
      ownerId: uid,
      name: tpl.name,
      slug: tpl.slug,
      description: tpl.description,
      group: tpl.group,
      colorKey: tpl.colorKey,
      iconKey: tpl.iconKey,
      order: tpl.order,
      fields: sanitizeFields(tpl.fields),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
  try {
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'categories');
  }
}

const LEGACY_TEMP_SLUGS = ['khao-sat', 'nghiem-thu', 'su-co', 'mo-rong'];

export async function migrateLegacyTempCategories(
  uid: string,
  currentCategories: Category[]
): Promise<boolean> {
  const legacyDocs = currentCategories.filter((c) => LEGACY_TEMP_SLUGS.includes(c.slug));
  if (legacyDocs.length === 0) return false;

  const batch = writeBatch(db);
  for (const legacy of legacyDocs) {
    batch.delete(doc(db, 'categories', legacy.id));
  }

  const newTemplates = DEFAULT_CATEGORY_TEMPLATES.filter((t) => t.group === 'temporary');
  for (const tpl of newTemplates) {
    const docId = buildCategoryDocId(uid, tpl.slug);
    if (!currentCategories.some((c) => c.id === docId)) {
      batch.set(doc(db, 'categories', docId), {
        ownerId: uid,
        name: tpl.name,
        slug: tpl.slug,
        description: tpl.description,
        group: tpl.group,
        colorKey: tpl.colorKey,
        iconKey: tpl.iconKey,
        order: tpl.order,
        fields: sanitizeFields(tpl.fields),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  }

  try {
    await batch.commit();
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'categories');
  }
}

export async function createCategory(
  uid: string,
  input: {
    name: string;
    description: string;
    group: CategoryGroup;
    colorKey: CategoryColor;
    iconKey: CategoryIcon;
    order: number;
    fields: FieldDefinition[];
  }
): Promise<string> {
  const name = clampString(input.name, 80) || 'Hạng mục mới';
  const baseSlug = slugifyVietnamese(name);
  const rand = Math.random().toString(36).slice(2, 6);
  const slug = `${baseSlug.slice(0, 34)}-${rand}`;
  const id = buildCategoryDocId(uid, slug);

  try {
    await setDoc(doc(db, 'categories', id), {
      ownerId: uid,
      name,
      slug,
      description: clampString(input.description, 200),
      group: input.group,
      colorKey: input.colorKey,
      iconKey: input.iconKey,
      order: Math.min(100, Math.max(0, Math.round(input.order))),
      fields: sanitizeFields(input.fields),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `categories/${id}`);
  }
}

export async function updateCategory(
  categoryId: string,
  updates: {
    name: string;
    description: string;
    group: CategoryGroup;
    colorKey: CategoryColor;
    iconKey: CategoryIcon;
    order: number;
    fields: FieldDefinition[];
  }
): Promise<void> {
  const path = `categories/${categoryId}`;
  try {
    await updateDoc(doc(db, 'categories', categoryId), {
      name: clampString(updates.name, 80) || 'Hạng mục',
      description: clampString(updates.description, 200),
      group: updates.group,
      colorKey: updates.colorKey,
      iconKey: updates.iconKey,
      order: Math.min(100, Math.max(0, Math.round(updates.order))),
      fields: sanitizeFields(updates.fields),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteCategory(categoryId: string): Promise<void> {
  const path = `categories/${categoryId}`;
  try {
    await deleteDoc(doc(db, 'categories', categoryId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function createRecord(
  uid: string,
  input: {
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
  }
): Promise<string> {
  const rand = Math.random().toString(36).slice(2, 8);
  const id = `rec_${Date.now().toString(36)}_${rand}`;
  const path = `records/${id}`;

  try {
    await setDoc(doc(db, 'records', id), {
      ownerId: uid,
      categoryId: clampString(input.categoryId, 128),
      categoryName: clampString(input.categoryName, 80) || 'Hạng mục',
      title: clampString(input.title, 160),
      location: clampString(input.location, 160),
      contactName: clampString(input.contactName, 100),
      status: input.status,
      priority: input.priority,
      notes: clampString(input.notes, 2000),
      customData: sanitizeCustomData(input.customData),
      collectedDate: /^\d{4}-\d{2}-\d{2}$/.test(input.collectedDate)
        ? input.collectedDate
        : new Date().toISOString().slice(0, 10),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateRecord(
  recordId: string,
  updates: {
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
  }
): Promise<void> {
  const path = `records/${recordId}`;
  try {
    await updateDoc(doc(db, 'records', recordId), {
      categoryId: clampString(updates.categoryId, 128),
      categoryName: clampString(updates.categoryName, 80) || 'Hạng mục',
      title: clampString(updates.title, 160),
      location: clampString(updates.location, 160),
      contactName: clampString(updates.contactName, 100),
      status: updates.status,
      priority: updates.priority,
      notes: clampString(updates.notes, 2000),
      customData: sanitizeCustomData(updates.customData),
      collectedDate: /^\d{4}-\d{2}-\d{2}$/.test(updates.collectedDate)
        ? updates.collectedDate
        : new Date().toISOString().slice(0, 10),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function updateRecordStatus(
  recordId: string,
  status: RecordStatus
): Promise<void> {
  const path = `records/${recordId}`;
  try {
    await updateDoc(doc(db, 'records', recordId), {
      status,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteRecord(recordId: string): Promise<void> {
  const path = `records/${recordId}`;
  try {
    await deleteDoc(doc(db, 'records', recordId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
