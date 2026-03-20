'use client';

import { ADMIN_TAB_COOKIE } from '@/lib/constants/storage';

export const ADMIN_DATA_FILENAME = 'admin-data.json';

export type AdminDataSections = import('@/lib/utils/dataMerge').AdminDataSections;

export function setTabCookie(tab: string) {
  try {
    document.cookie = `${ADMIN_TAB_COOKIE}=${tab};path=/;max-age=31536000`;
  } catch {
    // ignore
  }
}

export function downloadFile(filename: string, content: string) {
  const blob = new Blob([content], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function toCombinedJson(data: AdminDataSections): string {
  return JSON.stringify(data, null, 2);
}

export interface StoredPayload {
  data: AdminDataSections;
  bundledHash: string;
}

export function loadStoredPayload(): StoredPayload | null {
  // Admin data is no longer restored from localStorage.
  // Always start from the bundled server data.
  return null;
}

export function saveToStorage(data: AdminDataSections, bundledHash: string) {
  // no-op: admin data is not persisted between sessions anymore
  void data;
  void bundledHash;
}
