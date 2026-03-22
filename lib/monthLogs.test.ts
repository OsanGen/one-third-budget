import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { BudgetStatus } from './types';
import {
  MONTH_LOG_STORAGE_KEY,
  clearSavedMonths,
  createSavedMonthLog,
  loadSavedMonths,
  saveSavedMonths,
} from './monthLogs';

type MockStorage = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
  clear: () => void;
};

type WindowWithStorage = {
  localStorage: MockStorage;
};

const createStorage = (): MockStorage => {
  const store = new Map<string, string>();

  return {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => store.set(key, value),
    removeItem: (key) => store.delete(key),
    clear: () => store.clear(),
  };
};

describe('month logs persistence', () => {
  const storage = createStorage();

  beforeEach(() => {
    storage.clear();
    (globalThis as typeof globalThis & { window: WindowWithStorage }).window = {
      localStorage: storage,
    };
  });

  afterEach(() => {
    delete (globalThis as typeof globalThis & { window?: WindowWithStorage }).window;
  });

  it('saves and restores saved months logs', () => {
    const status: BudgetStatus = 'close';
    const savedMonth = createSavedMonthLog({
      label: 'Jan',
      id: 'm1',
      monthlyRevenue: 3000,
      cap: 1000,
      total: 800,
      remaining: 200,
      status,
      buckets: [{ id: 'a', label: 'Food', amount: 600 }],
    });

    saveSavedMonths([savedMonth]);
    const logs = loadSavedMonths();

    expect(logs).toHaveLength(1);
    expect(logs[0]).toMatchObject({
      id: 'm1',
      label: 'Jan',
      status,
      revenue: 3000,
      cap: 1000,
      bucketTotal: 800,
      remaining: 200,
      buckets: [{ id: 'a', label: 'Food', amount: 600 }],
    });
    expect(storage.getItem(MONTH_LOG_STORAGE_KEY)).toContain('"version":1');
  });

  it('clears all saved months', () => {
    const one = createSavedMonthLog({
      label: 'Feb',
      id: 'm2',
      monthlyRevenue: 2000,
      cap: 666.67,
      total: 333.33,
      remaining: 333.34,
      status: 'safe',
      buckets: [],
    });

    saveSavedMonths([one]);
    clearSavedMonths();

    expect(loadSavedMonths()).toEqual([]);
    expect(storage.getItem(MONTH_LOG_STORAGE_KEY)).toBeNull();
  });
});
