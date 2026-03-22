import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  DRAFT_STORAGE_KEY,
  clearDraft,
  loadDraft,
  saveDraft,
} from './storage';
import type { BucketDraft } from './types';

type MockStorage = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
  clear: () => void;
  length: number;
};

const createStorage = (): MockStorage => {
  const store = new Map<string, string>();

  return {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => store.set(key, value),
    removeItem: (key) => store.delete(key),
    clear: () => store.clear(),
    get length() {
      return store.size;
    },
  };
};

describe('storage draft persistence', () => {
  const storage = createStorage();

  beforeEach(() => {
    storage.clear();
    (globalThis as typeof globalThis & { window: { localStorage: MockStorage } }).window = {
      localStorage: storage,
    };
  });

  afterEach(() => {
    delete (globalThis as typeof globalThis & { window?: { localStorage: MockStorage } }).window;
  });

  it('saves and restores draft shape', () => {
    const buckets: BucketDraft[] = [{ id: 'bucket-1', label: 'Fun', amountText: '100' }];

    saveDraft({
      monthlyRevenueText: '2200',
      buckets,
    });

    const draft = loadDraft();

    expect(draft).not.toBeNull();
    expect(draft?.monthlyRevenueText).toBe('2200');
    expect(draft?.buckets).toEqual(buckets);
    expect(draft?.version).toBe(1);
    expect(draft?.updatedAt).toEqual(expect.any(String));
    expect(storage.getItem(DRAFT_STORAGE_KEY)).toContain('"version":1');
  });

  it('returns null and clears draft on malformed storage payload', () => {
    storage.setItem(DRAFT_STORAGE_KEY, '{bad');

    const draft = loadDraft();

    expect(draft).toBeNull();
    expect(storage.getItem(DRAFT_STORAGE_KEY)).toBeNull();
  });

  it('removes stale data when draft is cleared', () => {
    saveDraft({ monthlyRevenueText: '100', buckets: [] });
    expect(storage.getItem(DRAFT_STORAGE_KEY)).not.toBeNull();

    clearDraft();

    expect(storage.getItem(DRAFT_STORAGE_KEY)).toBeNull();
  });
});
