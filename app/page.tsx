'use client';

import { useEffect, useMemo, useRef, useReducer, useState } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import EmptyStateCard from '@/components/ui/EmptyStateCard';
import HelperText from '@/components/ui/HelperText';
import HeaderStrip from '@/components/HeaderStrip';
import SectionHeader from '@/components/ui/SectionHeader';
import BucketCard from '@/components/buckets/BucketCard';
import SummaryDonut from '@/components/SummaryDonut';
import StatusPill from '@/components/ui/StatusPill';
import NextMoveCoach, { type NextMoveStateKey, type TargetSection } from '@/components/NextMoveCoach';
import type { BucketDraft } from '@/lib/types';
import type { SavedMonthLog } from '@/lib/monthLogs';
import {
  clearDraft,
  hasMeaningfulDraft,
  loadDraft,
  saveDraft,
} from '@/lib/storage';
import {
  createSavedMonthLog,
  clearSavedMonths,
  loadSavedMonths,
  makeSavedMonthLogLabel,
  saveSavedMonths,
} from '@/lib/monthLogs';
import {
  formatCurrency,
  getBucketTotal,
  getCap,
  getRemaining,
  getTrimSuggestions,
  getStatus,
  getUsagePercent,
  parseMoneyInput,
  roundMoney,
} from '@/lib/money';

const MONEY_INPUT_DECIMAL = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const QUICK_ADD_BUCKETS = [
  'DoorDash',
  'Gaming',
  'Subscriptions',
  'Fun Activities',
  'Going Out',
  'Clothes',
  'Coffee',
  'Transport',
  'Gifts',
];
const MAX_VISIBLE_BUCKETS = 5;

type BucketState = {
  buckets: BucketDraft[];
};

type BucketAction =
  | { type: 'bucket/add'; bucket: BucketDraft }
  | { type: 'bucket/replace'; buckets: BucketDraft[] }
  | { type: 'bucket/remove'; bucketId: string }
  | { type: 'bucket/update-label'; bucketId: string; label: string }
  | { type: 'bucket/update-amount'; bucketId: string; amountText: string };

const makeBucketId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `bucket-${Math.random().toString(36).slice(2, 10)}-${Date.now()}`;

const bucketReducer = (state: BucketState, action: BucketAction): BucketState => {
  switch (action.type) {
    case 'bucket/add': {
      return {
        ...state,
        buckets: [...state.buckets, action.bucket],
      };
    }
    case 'bucket/replace': {
      return {
        ...state,
        buckets: action.buckets,
      };
    }
    case 'bucket/update-label':
      return {
        ...state,
        buckets: state.buckets.map((bucket) =>
          bucket.id === action.bucketId ? { ...bucket, label: action.label } : bucket,
        ),
      };
    case 'bucket/update-amount':
      return {
        ...state,
        buckets: state.buckets.map((bucket) =>
          bucket.id === action.bucketId ? { ...bucket, amountText: action.amountText } : bucket,
        ),
      };
    case 'bucket/remove':
      return {
        ...state,
        buckets: state.buckets.filter((bucket) => bucket.id !== action.bucketId),
      };
    default: {
      return state;
    }
  }
};

const initialBucketState: BucketState = {
  buckets: [],
};

export default function Page() {
  const [monthlyRevenueText, setMonthlyRevenueText] = useState('');
  const [bucketState, dispatchBucket] = useReducer(bucketReducer, initialBucketState);
  const [savedMonths, setSavedMonths] = useState<SavedMonthLog[]>([]);
  const [saveStatusMessage, setSaveStatusMessage] = useState('');
  const [pendingBucketFocus, setPendingBucketFocus] = useState<{
    bucketId: string;
    focus: 'name' | 'amount';
  } | null>(null);
  const [isDraftHydrated, setIsDraftHydrated] = useState(false);
  const [showAllBuckets, setShowAllBuckets] = useState(false);
  const [coachSaved, setCoachSaved] = useState(false);
  const [highlightedBucketId, setHighlightedBucketId] = useState<string | null>(null);
  const [highlightedSection, setHighlightedSection] = useState<TargetSection | null>(null);
  const highlightTimeoutRef = useRef<number | null>(null);
  const saveAnnouncementTimeoutRef = useRef<number | null>(null);
  const nameInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const amountInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const monthlyRevenue = useMemo(() => parseMoneyInput(monthlyRevenueText), [monthlyRevenueText]);
  const bucketCap = useMemo(() => getCap(monthlyRevenue), [monthlyRevenue]);
  const bucketTotal = useMemo(() => getBucketTotal(bucketState.buckets), [bucketState.buckets]);
  const usagePercent = getUsagePercent(bucketCap, bucketTotal);
  const bucketStatus = getStatus(bucketCap, bucketTotal);
  const hasRevenue = bucketCap > 0;
  const remainingBudget = getRemaining(bucketCap, bucketTotal);
  const isAtCap = hasRevenue && bucketTotal === bucketCap;
  const isOverCap = bucketStatus === 'over';
  const overage = isOverCap ? roundMoney(bucketTotal - bucketCap) : 0;
  const statusTone = isOverCap ? 'pink' : bucketStatus === 'close' ? 'yellow' : 'mint';
  const shellTone = hasRevenue ? statusTone : 'blue';
  const statusLabel = isOverCap ? 'Over cap' : bucketStatus === 'close' ? 'Close to cap' : 'Safe';
  const summaryHeadline = isOverCap
    ? 'Over the cap by'
    : isAtCap
      ? '0 left'
      : 'Still safe to spend';
  const summaryAmount = isOverCap
    ? formatCurrency(overage)
    : isAtCap
      ? formatCurrency(0)
      : formatCurrency(remainingBudget);

  const summaryHelpText = isOverCap
    ? 'You are over your cap. Lower one bucket or remove one to get back under.'
        : isAtCap
      ? 'You are exactly at your cap. Any extra amount should go to another month or another budget.'
        : hasRevenue
        ? 'You still have room. Add up to this amount across your buckets.'
        : 'Add your money in first so we can show your cap and progress.';
  const trimSuggestions = useMemo(
    () => getTrimSuggestions(bucketCap, bucketState.buckets),
    [bucketCap, bucketState.buckets],
  );
  const trimSuggestionText = trimSuggestions.length
    ? `Fastest way back under: ${trimSuggestions.map((suggestion) => suggestion.bucketLabel || 'this bucket').join(', ')}`
    : '';
  const usedText = hasRevenue
    ? `${formatCurrency(bucketTotal)} of ${formatCurrency(bucketCap)} (${Math.round(usagePercent)}%)`
    : `${formatCurrency(bucketTotal)} of ${formatCurrency(bucketCap)}`;
  const usagePercentText = `${Math.round(usagePercent)}%`;
  const progressPercent = hasRevenue ? Math.max(0, Math.min(100, Math.round(usagePercent))) : 0;
  const usedLineText = `${formatCurrency(bucketTotal)} of ${formatCurrency(bucketCap)} used`;
  const summaryAnnouncement = !hasRevenue
    ? 'Add your money in first so we can set your cap.'
    : isOverCap
      ? `You are over cap by ${formatCurrency(overage)}.`
        : isAtCap
        ? 'You are at your cap.'
        : bucketState.buckets.some((bucket) => bucket.amountText.trim().length > 0)
          ? 'You are below your cap.'
          : 'Add a bucket amount to see your spending now.';
  const hasAnyBucketAmount = bucketTotal > 0;
  const hasAnyBuckets = bucketState.buckets.length > 0;
  const canSaveMonth = hasRevenue || hasAnyBuckets;
  const donutTone = hasRevenue && hasAnyBuckets ? (isOverCap ? 'over' : bucketStatus === 'close' ? 'close' : 'safe') : 'neutral';

  const clearSaveFlag = () => {
    if (coachSaved) {
      setCoachSaved(false);
    }
  };

  const clearBucketHighlight = () => {
    if (highlightedBucketId !== null) {
      setHighlightedBucketId(null);
    }
  };

  const nextMoveModel = (() => {
    if (coachSaved) {
      return {
        key: 'snapshot-saved' as NextMoveStateKey,
        title: 'Month saved',
        body: 'You can review this setup in saved months or start over with new numbers.',
        actionLabel: 'Start new month',
        target: 'money-in' as TargetSection,
      };
    }

    if (!hasRevenue) {
      return {
        key: 'no-revenue' as NextMoveStateKey,
        title: 'Add your money in',
        body: 'Start with your monthly amount.',
        actionLabel: 'Add money in',
        target: 'money-in' as TargetSection,
      };
    }

    if (!hasAnyBucketAmount) {
      return {
        key: 'revenue-no-amount' as NextMoveStateKey,
        title: 'Add one bucket amount',
        body: 'Start with one bucket and type a number.',
        actionLabel: 'Add a bucket',
        target: 'buckets' as TargetSection,
      };
    }

    if (isOverCap) {
      return {
        key: 'over-cap' as NextMoveStateKey,
        title: 'You are over your cap',
        body: 'Lower one or more bucket amounts to get back under.',
        actionLabel: 'Trim buckets now',
        target: 'buckets' as TargetSection,
      };
    }

    if (bucketStatus === 'close') {
      return {
        key: 'close-to-cap' as NextMoveStateKey,
        title: 'You are close to your cap',
        body: 'You are close. Save this setup when you are ready.',
        actionLabel: 'Save this month',
        target: 'saved-months' as TargetSection,
      };
    }

    return {
      key: 'under-cap' as NextMoveStateKey,
      title: 'You are in a safe spot',
      body: 'You have room to add more. Save this setup when you are done.',
      actionLabel: 'Save this month',
      target: 'saved-months' as TargetSection,
    };
  })();

  const progressStep = nextMoveModel.target === 'money-in' ? 0 : nextMoveModel.target === 'buckets' ? 1 : 2;

  const clearHighlight = () => {
    if (highlightTimeoutRef.current !== null) {
      window.clearTimeout(highlightTimeoutRef.current);
      highlightTimeoutRef.current = null;
    }
  };

  const highlightSection = (sectionId: TargetSection) => {
    clearHighlight();
    setHighlightedSection(sectionId);

    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    highlightTimeoutRef.current = window.setTimeout(() => {
      setHighlightedSection((current) => (current === sectionId ? null : current));
      highlightTimeoutRef.current = null;
    }, 1700);
  };

  const handleCoachAction = (target: TargetSection) => {
    if (nextMoveModel.key === 'snapshot-saved') {
      setCoachSaved(false);
    }

    highlightSection(target);
  };

  const handleLegendSelect = (bucketId: string) => {
    setHighlightedBucketId(bucketId);
    const targetInput = amountInputRefs.current[bucketId];

    if (targetInput) {
      targetInput.focus();
      targetInput.select();
    }
  };

  const hasManyBuckets = bucketState.buckets.length > MAX_VISIBLE_BUCKETS;
  const visibleBuckets = showAllBuckets || !hasManyBuckets ? bucketState.buckets : bucketState.buckets.slice(0, MAX_VISIBLE_BUCKETS);

  const moneyInputValue = monthlyRevenueText;
  const hasMoney = bucketCap > 0;

  const sanitizeAmountText = (value: string) => {
    const filtered = value.replace(/[^0-9.]/g, '');
    const [integerPart, ...decimals] = filtered.split('.');

    if (decimals.length <= 1) {
      return filtered;
    }

    return `${integerPart}.${decimals.join('')}`;
  };

  const getUniqueLabel = (label: string) => {
    const target = label.trim();
    if (target.length === 0) {
      return '';
    }

    const existingLabels = new Set(
      bucketState.buckets.map((bucket) => bucket.label.trim().toLowerCase()),
    );

    if (!existingLabels.has(target.toLowerCase())) {
      return target;
    }

    let index = 2;
    let nextLabel = `${target} (${index})`;

    while (existingLabels.has(nextLabel.toLowerCase())) {
      index += 1;
      nextLabel = `${target} (${index})`;
    }

    return nextLabel;
  };

  const createBucket = (label: string): BucketDraft => ({
    id: makeBucketId(),
    label,
    amountText: '',
  });

  const handleAddBucket = (options?: { label?: string; focus: 'name' | 'amount' }) => {
    clearBucketHighlight();
    clearSaveFlag();
    const nextLabel = options?.label ? getUniqueLabel(options.label) : '';
    const newBucket = createBucket(nextLabel);
    dispatchBucket({
      type: 'bucket/add',
      bucket: newBucket,
    });
    setShowAllBuckets((current) =>
      bucketState.buckets.length >= MAX_VISIBLE_BUCKETS ? true : current,
    );
    setPendingBucketFocus({ bucketId: newBucket.id, focus: options?.focus ?? 'name' });
  };

  const handleRevenueChange = (value: string) => {
    clearBucketHighlight();
    clearSaveFlag();
    const cleaned = value.replace(/[^0-9.]/g, '');
    setMonthlyRevenueText(cleaned);
  };

  const handleQuickAddBucket = (label: string) => {
    clearSaveFlag();
    handleAddBucket({ label, focus: 'amount' });
  };

  const formatMoneyOnBlur = () => {
    clearBucketHighlight();
    clearSaveFlag();
    if (monthlyRevenueText.trim() === '') {
      setMonthlyRevenueText('');
      return;
    }

    setMonthlyRevenueText(MONEY_INPUT_DECIMAL.format(parseMoneyInput(monthlyRevenueText)));
  };

  const updateBucketAmount = (bucketId: string, nextAmountText: string) => {
    clearBucketHighlight();
    clearSaveFlag();
    const cleaned = sanitizeAmountText(nextAmountText);
    dispatchBucket({ type: 'bucket/update-amount', bucketId, amountText: cleaned });
  };

  const updateBucketLabel = (bucketId: string, nextLabel: string) => {
    clearBucketHighlight();
    clearSaveFlag();
    dispatchBucket({ type: 'bucket/update-label', bucketId, label: nextLabel });
  };

  const handleRemoveBucket = (bucketId: string) => {
    clearBucketHighlight();
    clearSaveFlag();
    const target = bucketState.buckets.find((bucket) => bucket.id === bucketId);
    if (!target) {
      return;
    }

    const hasMeaningfulContent = target.label.trim().length > 0 || parseMoneyInput(target.amountText) > 0;
    const shouldConfirm = hasMeaningfulContent;

    if (shouldConfirm) {
      const safeLabel = target.label.trim().length > 0 ? target.label.trim() : 'this bucket';
      const confirmMessage = `Remove ${safeLabel}? You can add it again later.`;
      const ok = window.confirm(confirmMessage);

      if (!ok) {
        return;
      }
    }

    dispatchBucket({ type: 'bucket/remove', bucketId });
  };

  const handleAmountBlur = (bucketId: string, amountText: string) => {
    clearBucketHighlight();
    clearSaveFlag();
    if (amountText.trim() === '') {
      return;
    }

    dispatchBucket({
      type: 'bucket/update-amount',
      bucketId,
      amountText: MONEY_INPUT_DECIMAL.format(parseMoneyInput(amountText)),
    });
  };

  const handleSaveMonth = () => {
    clearSaveFlag();

    if (!canSaveMonth) {
      return;
    }

    const snapshotBuckets = bucketState.buckets.map((bucket) => ({
      id: bucket.id,
      label: bucket.label.trim(),
      amount: parseMoneyInput(bucket.amountText),
    }));

    const newMonthLog = createSavedMonthLog({
      label: '',
      id: makeBucketId(),
      monthlyRevenue,
      cap: bucketCap,
      total: bucketTotal,
      remaining: remainingBudget,
      status: bucketStatus,
      buckets: snapshotBuckets,
    });

    const nextSavedMonths = [newMonthLog, ...savedMonths];
    setSavedMonths(nextSavedMonths);
    saveSavedMonths(nextSavedMonths);
    setCoachSaved(true);
    setSaveStatusMessage('Month saved.');
  };

  const handleExportSavedMonths = () => {
    if (savedMonths.length === 0) {
      return;
    }

    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      logs: savedMonths,
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const downloadUrl = URL.createObjectURL(blob);
    const fileName = `one-third-budget-saved-months-${new Date().toISOString().slice(0, 10)}.json`;
    const anchor = document.createElement('a');

    anchor.href = downloadUrl;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(downloadUrl);
  };

  const handleClearSavedMonths = () => {
    const confirmText = 'Clear all saved months? This cannot be undone.';
    const shouldClear = window.confirm(confirmText);

    if (!shouldClear) {
      return;
    }

    clearSavedMonths();
    setSavedMonths([]);
    setSaveStatusMessage('Saved months are cleared.');
  };

  useEffect(() => {
    const savedDraft = loadDraft();

    if (savedDraft) {
      setMonthlyRevenueText(savedDraft.monthlyRevenueText);
      dispatchBucket({ type: 'bucket/replace', buckets: savedDraft.buckets });
    }

    setIsDraftHydrated(true);
  }, []);

  useEffect(() => {
    const restoredLogs = loadSavedMonths();
    setSavedMonths(restoredLogs);
  }, []);

  useEffect(() => {
    if (!isDraftHydrated) {
      return;
    }

    if (hasMeaningfulDraft(monthlyRevenueText, bucketState.buckets)) {
      saveDraft({
        monthlyRevenueText,
        buckets: bucketState.buckets,
      });
      return;
    }

    clearDraft();
  }, [bucketState.buckets, isDraftHydrated, monthlyRevenueText]);

  useEffect(() => {
    if (pendingBucketFocus === null) {
      return;
    }

    const nextRef =
      pendingBucketFocus.focus === 'name'
        ? nameInputRefs.current[pendingBucketFocus.bucketId]
        : amountInputRefs.current[pendingBucketFocus.bucketId];

    if (nextRef) {
      window.requestAnimationFrame(() => {
        nextRef.focus();
        if (pendingBucketFocus.focus === 'amount') {
          nextRef.select();
        }
      });
    }

    setPendingBucketFocus(null);
  }, [pendingBucketFocus, bucketState.buckets.length]);

  useEffect(() => {
    if (!hasManyBuckets && showAllBuckets) {
      setShowAllBuckets(false);
    }
  }, [hasManyBuckets, showAllBuckets]);

  useEffect(() => {
    if (!saveStatusMessage) {
      return;
    }

    if (saveAnnouncementTimeoutRef.current !== null) {
      window.clearTimeout(saveAnnouncementTimeoutRef.current);
    }

    saveAnnouncementTimeoutRef.current = window.setTimeout(() => {
      setSaveStatusMessage('');
      saveAnnouncementTimeoutRef.current = null;
    }, 3500);

    return () => {
      if (saveAnnouncementTimeoutRef.current !== null) {
        window.clearTimeout(saveAnnouncementTimeoutRef.current);
      }
    };
  }, [saveStatusMessage]);

  useEffect(() => {
    return () => {
      if (highlightTimeoutRef.current !== null) {
        window.clearTimeout(highlightTimeoutRef.current);
      }
      if (saveAnnouncementTimeoutRef.current !== null) {
        window.clearTimeout(saveAnnouncementTimeoutRef.current);
      }
    };
  }, []);

  return (
    <main className="app-shell" aria-label="One Third Budget coach" data-state={shellTone}>
      <Card id="header">
        <HeaderStrip />
      </Card>

      <Card id="next-move">
        <SectionHeader title="Your next move" subtitle="One clear next step" />
        <NextMoveCoach
          model={nextMoveModel}
          onAction={handleCoachAction}
          stepState={{
            moneyDone: hasRevenue,
            bucketsDone: hasAnyBucketAmount,
            savedDone: coachSaved,
            nextStep: progressStep,
          }}
        />
      </Card>

      <section className="money-cap-row">
        <Card id="money-in" className={highlightedSection === 'money-in' ? 'section-highlight' : ''}>
          <SectionHeader title="Money in" />
          <label className="money-field" htmlFor="monthly-revenue">
            <span className="bucket-row-label">Money in</span>
            <div className="money-input-wrapper">
              <span className="money-input-prefix" aria-hidden="true">
                $
              </span>
              <input
                id="monthly-revenue"
                value={moneyInputValue}
                inputMode="decimal"
                autoComplete="off"
                autoCorrect="off"
                className="money-input"
                placeholder="3000"
                onChange={(event) => handleRevenueChange(event.target.value)}
                onFocus={(event) => {
                  event.currentTarget.select();
                  const editable =
                    monthlyRevenueText.trim().length === 0 ? '' : parseMoneyInput(monthlyRevenueText).toString();
                  setMonthlyRevenueText(editable);
                }}
                onBlur={formatMoneyOnBlur}
              />
            </div>
            <HelperText>Type your total money for one month.</HelperText>
          </label>
        </Card>

        <Card id="bucket-cap">
          <SectionHeader title="Your bucket cap" subtitle="One third of your monthly money in." />
          <p className="bucket-cap-value">{formatCurrency(bucketCap)}</p>
          <HelperText>This is the total you can spread across your buckets.</HelperText>
        </Card>
      </section>

      <Card id="buckets" className={highlightedSection === 'buckets' ? 'section-highlight' : ''}>
        <SectionHeader
          title="Buckets"
          subtitle="Each bucket is a place your extra money can go."
        />
        <div className="bucket-quick-chips" role="group" aria-label="Quick add a bucket">
          {(bucketState.buckets.length === 0 ? QUICK_ADD_BUCKETS.slice(0, 2) : QUICK_ADD_BUCKETS).map((label) => (
            <button
              key={label}
              type="button"
              className="bucket-chip"
              onClick={() => handleQuickAddBucket(label)}
            >
              {label}
            </button>
          ))}
        </div>
        {bucketState.buckets.length === 0 ? (
          <section className="bucket-empty-state" aria-label="No buckets yet">
            <h3 className="bucket-empty-title">No buckets yet</h3>
            <HelperText>Start with one place your money tends to go.</HelperText>
            <div className="bucket-empty-actions">
              <Button variant="primary" onClick={() => handleAddBucket({ focus: 'name' })}>
                Add bucket
              </Button>
            </div>
          </section>
        ) : (
          <>
            <HelperText>Use a quick bucket or open a blank row.</HelperText>
            <div className="bucket-list" aria-label="Buckets details">
              {visibleBuckets.map((bucket) => (
                <BucketCard
                  key={bucket.id}
                  bucket={bucket}
                  cap={bucketCap}
                  isHighlighted={bucket.id === highlightedBucketId}
                  onLabelChange={updateBucketLabel}
                  onAmountChange={updateBucketAmount}
                  onAmountBlur={handleAmountBlur}
                  onRemove={handleRemoveBucket}
                  setNameInputRef={(bucketId, node) => {
                    if (node) {
                      nameInputRefs.current[bucketId] = node;
                      return;
                    }

                    delete nameInputRefs.current[bucketId];
                  }}
                  setAmountInputRef={(bucketId, node) => {
                    if (node) {
                      amountInputRefs.current[bucketId] = node;
                      return;
                    }

                    delete amountInputRefs.current[bucketId];
                  }}
                />
              ))}
            </div>
            <div className="bucket-footer">
              {hasManyBuckets ? (
                <Button variant="subtle" onClick={() => setShowAllBuckets((current) => !current)}>
                  {showAllBuckets ? 'Show fewer buckets' : `Show all ${bucketState.buckets.length} buckets`}
                </Button>
              ) : null}
              <Button variant="subtle" onClick={() => handleAddBucket({ focus: 'name' })}>
                Add bucket
              </Button>
              <HelperText>Buckets total: {formatCurrency(bucketTotal)}</HelperText>
              {hasMoney ? <HelperText>Your cap is set for this month.</HelperText> : null}
            </div>
          </>
        )}
      </Card>

      <Card id="summary">
        <SectionHeader title="Summary" subtitle="Here is what is happening" />
        <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
          {summaryAnnouncement}
        </div>
        <div className="summary-grid">
          <div className="summary-text-column">
            <div className="mt-1">
              <StatusPill label={statusLabel} tone={statusTone} />
            </div>
            <div className="mt-3">
              <p className="text-xl font-semibold text-[var(--ink)]">{summaryHeadline}</p>
              <p className="bucket-cap-value mt-1 mb-1">{summaryAmount}</p>
              <HelperText>{summaryHelpText}</HelperText>
              {isOverCap && trimSuggestionText ? (
                <HelperText>{trimSuggestionText}</HelperText>
              ) : null}
            </div>
          </div>
          <SummaryDonut
            tone={donutTone}
            hasRevenue={hasRevenue}
            hasBuckets={hasAnyBuckets}
            buckets={bucketState.buckets}
            bucketCap={bucketCap}
            remaining={remainingBudget}
            usagePercent={usagePercent}
            overage={overage}
            highlightedBucketId={highlightedBucketId}
            onLegendSelect={handleLegendSelect}
          />
        </div>
        <div className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Total in buckets</span>
            <strong>{formatCurrency(bucketTotal)}</strong>
          </div>
          <div className="flex justify-between">
            <span>Bucket cap</span>
            <strong>{formatCurrency(bucketCap)}</strong>
          </div>
          <div className="flex justify-between">
            <span>Used so far</span>
            <strong>{usedText}</strong>
          </div>
          <div className="summary-progress-label">{usedLineText}</div>
          <div className="summary-progress-track" aria-label="Budget usage progress">
            <div
              className={`summary-progress-fill summary-progress-fill-${bucketStatus}`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="summary-progress-meta">
            <span>{usagePercentText} used</span>
            {isOverCap ? <span>{formatCurrency(overage)} over</span> : null}
          </div>
          {isOverCap ? <HelperText>Usage is over by {formatCurrency(overage)}.</HelperText> : null}
        </div>
      </Card>

      <Card id="saved-months" className={highlightedSection === 'saved-months' ? 'section-highlight' : ''}>
        <SectionHeader title="Saved months" subtitle="Review what you saved" />
        {saveStatusMessage ? (
          <p className="state-confirmation" role="status" aria-live="polite">
            {saveStatusMessage}
          </p>
        ) : null}
        <div className="saved-months-toolbar">
          <Button variant="primary" onClick={handleSaveMonth} disabled={!canSaveMonth}>
            Save this month
          </Button>
          <Button variant="subtle" onClick={handleExportSavedMonths} disabled={savedMonths.length === 0}>
            Export JSON
          </Button>
          <Button
            variant="subtle"
            onClick={handleClearSavedMonths}
            disabled={savedMonths.length === 0}
          >
            Clear saved months
          </Button>
          <HelperText>Save each setup so you can review it later.</HelperText>
        </div>

        {savedMonths.length === 0 ? (
          <EmptyStateCard
            title="No saved months yet"
            description="Save your first month when this setup is ready."
          />
        ) : (
          <section className="saved-months-list" aria-label="Saved month history">
            {savedMonths.map((month) => {
              const label = month.label.trim().length > 0 ? month.label : makeSavedMonthLogLabel(month.savedAt);
              const remainingOrOver =
                month.status === 'over'
                  ? `Over by ${formatCurrency(roundMoney(month.bucketTotal - month.cap))}`
                  : `Remaining ${formatCurrency(month.remaining)}`;
              const statusTone = month.status === 'over' ? 'pink' : month.status === 'close' ? 'yellow' : 'mint';
              const statusLabel = month.status === 'over' ? 'Over cap' : month.status === 'close' ? 'Close to cap' : 'Safe';

              return (
                <article key={month.id} className="saved-months-card">
                  <header className="saved-months-card-head">
                    <p className="saved-months-title">{label}</p>
                    <StatusPill tone={statusTone} label={statusLabel} />
                  </header>
                  <div className="saved-months-card-grid">
                    <div className="saved-months-row">
                      <span>Money in</span>
                      <strong>{formatCurrency(month.revenue)}</strong>
                    </div>
                    <div className="saved-months-row">
                      <span>Bucket cap</span>
                      <strong>{formatCurrency(month.cap)}</strong>
                    </div>
                    <div className="saved-months-row">
                      <span>Total in buckets</span>
                      <strong>{formatCurrency(month.bucketTotal)}</strong>
                    </div>
                    <div className="saved-months-row">
                      <span>{month.status === 'over' ? 'Over' : 'Remaining'}</span>
                      <strong>
                        {month.status === 'over'
                          ? formatCurrency(roundMoney(month.bucketTotal - month.cap))
                          : formatCurrency(month.remaining)}
                      </strong>
                    </div>
                    <div className="saved-months-row">
                      <span>Buckets</span>
                      <strong>{month.buckets.length}</strong>
                    </div>
                  </div>
                  <HelperText>{remainingOrOver}</HelperText>
                </article>
              );
            })}
          </section>
        )}
      </Card>
    </main>
  );
}
