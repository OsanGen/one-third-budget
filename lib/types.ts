export type BucketDraft = {
  id: string;
  label: string;
  amountText: string;
};

export type BudgetDraftState = {
  monthlyRevenueText: string;
  fixedEssentialsText: string;
  flexibleEssentialsText: string;
  buckets: BucketDraft[];
};

export type BucketSnapshot = {
  id: string;
  label: string;
  amount: number;
};

export type BudgetSnapshot = {
  monthlyRevenue: number;
  fixedEssentials: number;
  flexibleEssentials: number;
  buckets: BucketSnapshot[];
  updatedAt: string;
};

export type BudgetStatus = 'safe' | 'close' | 'over';

export type TrimSuggestion = {
  bucketId: string;
  bucketLabel: string;
  reduceBy: number;
};

export type CoreState = {
  draft: BudgetDraftState;
  snapshot: BudgetSnapshot;
  cap: number;
  totalBuckets: number;
  remaining: number;
  usagePercent: number;
  status: BudgetStatus;
};
