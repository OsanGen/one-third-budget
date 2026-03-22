import type { BucketSnapshot, BudgetStatus } from '@/lib/types';

export const MONTH_LOG_STORAGE_KEY = 'one-third-budget:logs:v1';

export type SavedMonthLog = {
  id: string;
  savedAt: string;
  label: string;
  revenue: number;
  cap: number;
  bucketTotal: number;
  remaining: number;
  status: BudgetStatus;
  buckets: BucketSnapshot[];
};

type RawLog = {
  id?: unknown;
  savedAt?: unknown;
  label?: unknown;
  revenue?: unknown;
  cap?: unknown;
  bucketTotal?: unknown;
  remaining?: unknown;
  status?: unknown;
  buckets?: unknown;
};

type LogEnvelope = {
  version?: number;
  updatedAt?: unknown;
  logs?: unknown;
};

const isBudgetStatus = (value: unknown): value is BudgetStatus =>
  value === 'safe' || value === 'close' || value === 'over';

const toNumber = (value: unknown): number =>
  typeof value === 'number' && Number.isFinite(value) ? Math.max(0, value) : 0;

const toText = (value: unknown): string => (typeof value === 'string' ? value : '');

const toLogBuckets = (buckets: unknown): BucketSnapshot[] => {
  if (!Array.isArray(buckets)) {
    return [];
  }

  return buckets
    .map((bucket) => {
      if (!bucket || typeof bucket !== 'object') {
        return null;
      }

      const record = bucket as Record<string, unknown>;
      const id = toText(record.id);
      const label = toText(record.label);
      const amount = toNumber(record.amount);

      if (!id) {
        return null;
      }

      return {
        id,
        label,
        amount,
      };
    })
    .filter((bucket): bucket is BucketSnapshot => bucket !== null);
};

const toLog = (raw: RawLog | null): SavedMonthLog | null => {
  if (!raw) {
    return null;
  }

  const id = toText(raw.id);
  const status = isBudgetStatus(raw.status) ? raw.status : 'safe';

  if (!id) {
    return null;
  }

  return {
    id,
    savedAt: toText(raw.savedAt) || new Date().toISOString(),
    label: toText(raw.label),
    revenue: toNumber(raw.revenue),
    cap: toNumber(raw.cap),
    bucketTotal: toNumber(raw.bucketTotal),
    remaining: toNumber(raw.remaining),
    status,
    buckets: toLogBuckets(raw.buckets),
  };
};

const coercePayload = (raw: LogEnvelope | null): SavedMonthLog[] => {
  if (raw === null) {
    return [];
  }

  const logs = Array.isArray(raw.logs) ? raw.logs : [];

  return logs
    .map((log) => toLog(log as RawLog))
    .filter((log): log is SavedMonthLog => log !== null);
};

export const loadSavedMonths = (): SavedMonthLog[] => {
  if (typeof window === 'undefined') {
    return [];
  }

  const raw = window.localStorage.getItem(MONTH_LOG_STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as LogEnvelope;
    return coercePayload(parsed);
  } catch {
    window.localStorage.removeItem(MONTH_LOG_STORAGE_KEY);
    return [];
  }
};

export const saveSavedMonths = (logs: SavedMonthLog[]): void => {
  if (typeof window === 'undefined') {
    return;
  }

  const payload = {
    version: 1,
    updatedAt: new Date().toISOString(),
    logs,
  };

  window.localStorage.setItem(MONTH_LOG_STORAGE_KEY, JSON.stringify(payload));
};

export const clearSavedMonths = (): void => {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(MONTH_LOG_STORAGE_KEY);
};

export const makeSavedMonthLogLabel = (savedAt: string): string => {
  const value = new Date(savedAt);
  if (Number.isNaN(value.getTime())) {
    return 'Saved month';
  }

  return value.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export const createSavedMonthLog = (params: {
  label: string;
  id: string;
  monthlyRevenue: number;
  cap: number;
  total: number;
  remaining: number;
  status: BudgetStatus;
  buckets: BucketSnapshot[];
}): SavedMonthLog => ({
  id: params.id,
  savedAt: new Date().toISOString(),
  label: params.label,
  revenue: params.monthlyRevenue,
  cap: params.cap,
  bucketTotal: params.total,
  remaining: params.remaining,
  status: params.status,
  buckets: params.buckets,
});
