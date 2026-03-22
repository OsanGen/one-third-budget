import type { BucketDraft } from '@/lib/types';

export const DRAFT_STORAGE_KEY = 'one-third-budget:draft:v1';

export type DraftV1 = {
  version: 1;
  updatedAt: string;
  monthlyRevenueText: string;
  buckets: BucketDraft[];
};

type RawDraftPayload = {
  version?: number;
  updatedAt?: unknown;
  monthlyRevenueText?: unknown;
  buckets?: unknown;
};

const toDraftBuckets = (value: unknown): BucketDraft[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((bucket) => {
      if (!bucket || typeof bucket !== 'object') {
        return null;
      }

      const record = bucket as Record<string, unknown>;
      const id = typeof record.id === 'string' ? record.id : '';
      const label = typeof record.label === 'string' ? record.label : '';
      const amountText = typeof record.amountText === 'string' ? record.amountText : '';

      if (id.trim().length === 0) {
        return null;
      }

      return {
        id,
        label,
        amountText,
      };
    })
    .filter((bucket): bucket is BucketDraft => bucket !== null);
};

const coerceDraftPayload = (raw: RawDraftPayload | null): DraftV1 | null => {
  if (raw === null) {
    return null;
  }

  const version = raw.version === 1 ? 1 : 1;
  const updatedAt = typeof raw.updatedAt === 'string' ? raw.updatedAt : new Date().toISOString();
  const monthlyRevenueText = typeof raw.monthlyRevenueText === 'string' ? raw.monthlyRevenueText : '';
  const buckets = toDraftBuckets(raw.buckets);

  return {
    version,
    updatedAt,
    monthlyRevenueText,
    buckets,
  };
};

export const hasMeaningfulDraft = (monthlyRevenueText: string, buckets: BucketDraft[]): boolean =>
  monthlyRevenueText.trim().length > 0 || buckets.length > 0;

export const loadDraft = (): DraftV1 | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  const raw = window.localStorage.getItem(DRAFT_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as RawDraftPayload;
    return coerceDraftPayload(parsed);
  } catch {
    window.localStorage.removeItem(DRAFT_STORAGE_KEY);
    return null;
  }
};

export const saveDraft = (draft: {
  monthlyRevenueText: string;
  buckets: BucketDraft[];
}): void => {
  if (typeof window === 'undefined') {
    return;
  }

  const payload: DraftV1 = {
    version: 1,
    updatedAt: new Date().toISOString(),
    monthlyRevenueText: draft.monthlyRevenueText,
    buckets: draft.buckets,
  };

  window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(payload));
};

export const clearDraft = (): void => {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(DRAFT_STORAGE_KEY);
};
