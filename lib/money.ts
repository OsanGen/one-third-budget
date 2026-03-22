import { type BucketDraft, type BudgetStatus, type TrimSuggestion } from './types';

export const CURRENCY_FORMATTER = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const toCents = (value: number): number => Math.round(value * 100);
const fromCents = (value: number): number => value / 100;

export const roundMoney = (value: number): number => fromCents(toCents(value));

export const clampToNonNegative = (value: number): number => Math.max(0, value);

export const formatCurrency = (value: number): string => {
  if (!Number.isFinite(value)) {
    return '$0.00';
  }

  return CURRENCY_FORMATTER.format(roundMoney(clampToNonNegative(value)));
};

export const parseMoneyInput = (value: string): number => {
  const trimmed = value.trim();

  if (trimmed.length === 0) {
    return 0;
  }

  const normalized = trimmed.replace(/[$,\s]/g, '');
  const parsed = Number(normalized);

  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0;
  }

  return roundMoney(parsed);
};

export const getCap = (monthlyRevenue: number): number => {
  if (!Number.isFinite(monthlyRevenue)) {
    return 0;
  }

  return roundMoney(clampToNonNegative(monthlyRevenue / 3));
};

export const getBucketTotal = (buckets: ReadonlyArray<Pick<BucketDraft, 'amountText'>>): number => {
  const total = buckets.reduce((sum, bucket) => sum + parseMoneyInput(bucket.amountText), 0);
  return roundMoney(total);
};

export const getRemaining = (cap: number, total: number): number => {
  if (!Number.isFinite(cap) || !Number.isFinite(total)) {
    return 0;
  }

  return roundMoney(clampToNonNegative(cap - total));
};

export const getUsagePercent = (cap: number, total: number): number => {
  if (!Number.isFinite(cap) || cap <= 0) {
    return 0;
  }

  const raw = (total / cap) * 100;
  return clampToNonNegative(raw);
};

export const getStatus = (cap: number, total: number): BudgetStatus => {
  const usage = getUsagePercent(cap, total);

  if (usage > 100) {
    return 'over';
  }

  if (usage >= 85) {
    return 'close';
  }

  return 'safe';
};

export const getTrimSuggestions = (
  cap: number,
  buckets: ReadonlyArray<BucketDraft>,
): TrimSuggestion[] => {
  const total = getBucketTotal(buckets);
  const usage = getUsagePercent(cap, total);

  if (usage <= 100 || total <= cap) {
    return [];
  }

  const excess = roundMoney(total - cap);
  const positiveBuckets = buckets
    .map((bucket) => ({
      ...bucket,
      numericAmount: parseMoneyInput(bucket.amountText),
    }))
    .filter((bucket) => bucket.numericAmount > 0)
    .sort((a, b) => b.numericAmount - a.numericAmount)
    .slice(0, 3);

  if (positiveBuckets.length === 0) {
    return [];
  }

  let remaining = excess;
  const suggestions: TrimSuggestion[] = [];

  for (const bucket of positiveBuckets) {
    if (remaining <= 0) {
      break;
    }

    const reduceBy = roundMoney(Math.min(bucket.numericAmount, remaining));

    if (reduceBy <= 0) {
      continue;
    }

    suggestions.push({
      bucketId: bucket.id,
      bucketLabel: bucket.label,
      reduceBy,
    });
    remaining = roundMoney(remaining - reduceBy);
  }

  return suggestions;
};
