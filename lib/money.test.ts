import { describe, expect, it } from 'vitest';
import {
  formatCurrency,
  getBucketTotal,
  getCap,
  getRemaining,
  getStatus,
  getTrimSuggestions,
  getUsagePercent,
  parseMoneyInput,
} from './money';
import type { BucketDraft } from './types';

describe('money parsing and display', () => {
  it('formats values as US dollars', () => {
    expect(formatCurrency(0)).toBe('$0.00');
    expect(formatCurrency(12.5)).toBe('$12.50');
    expect(formatCurrency(-7)).toBe('$0.00');
  });

  it('parses blank input as zero', () => {
    expect(parseMoneyInput('')).toBe(0);
    expect(parseMoneyInput('   ')).toBe(0);
  });

  it('parses money input with symbols and commas', () => {
    expect(parseMoneyInput('$1,250.75')).toBe(1250.75);
    expect(parseMoneyInput('2500')).toBe(2500);
    expect(parseMoneyInput('12.999')).toBe(13);
  });

  it('clips negative or invalid money input to zero', () => {
    expect(parseMoneyInput('-50')).toBe(0);
    expect(parseMoneyInput('abc')).toBe(0);
  });
});

describe('budget math helpers', () => {
  it('computes one third cap from monthly revenue', () => {
    expect(getCap(3000)).toBe(1000);
    expect(getCap(0)).toBe(0);
    expect(getCap(-1000)).toBe(0);
    expect(getCap(Number.NaN)).toBe(0);
  });

  it('adds bucket totals and treats blank amounts as zero', () => {
    const buckets: BucketDraft[] = [
      { id: 'a', label: 'Food', amountText: '25' },
      { id: 'b', label: 'Fun', amountText: '' },
      { id: 'c', label: 'Transport', amountText: '15.5' },
    ];

    expect(getBucketTotal(buckets)).toBe(40.5);
  });

  it('computes remaining budget without negative values', () => {
    expect(getRemaining(1000, 250)).toBe(750);
    expect(getRemaining(1000, 1500)).toBe(0);
    expect(getRemaining(Number.NaN, 20)).toBe(0);
  });

  it('returns usage percent with cap guardrails', () => {
    expect(getUsagePercent(1000, 400)).toBe(40);
    expect(getUsagePercent(1000, 849.99)).toBeCloseTo(85, 2);
    expect(getUsagePercent(1000, 850)).toBe(85);
    expect(getUsagePercent(0, 100)).toBe(0);
  });

  it('applies safe, close, and over status rules', () => {
    expect(getStatus(1000, 849.999999)).toBe('safe');
    expect(getStatus(1000, 840)).toBe('safe');
    expect(getStatus(1000, 850)).toBe('close');
    expect(getStatus(1000, 1000)).toBe('close');
    expect(getStatus(1000, 1000.001)).toBe('over');
  });

  it('returns trim suggestions only when over cap', () => {
    const buckets: BucketDraft[] = [
      { id: 'a', label: 'Food', amountText: '50' },
      { id: 'b', label: 'Fun', amountText: '30' },
      { id: 'c', label: 'Items', amountText: '' },
    ];

    expect(getTrimSuggestions(60, buckets)).toEqual([{ bucketId: 'a', bucketLabel: 'Food', reduceBy: 20 }]);
  });

  it('returns up to three largest buckets when trimming the biggest first', () => {
    const buckets: BucketDraft[] = [
      { id: 'a', label: 'DoorDash', amountText: '40' },
      { id: 'b', label: 'Fun Activities', amountText: '35' },
      { id: 'c', label: 'Gaming', amountText: '15' },
      { id: 'd', label: 'Clothes', amountText: '25' },
    ];

    expect(getTrimSuggestions(80, buckets)).toEqual([
      { bucketId: 'a', bucketLabel: 'DoorDash', reduceBy: 35 },
    ]);
  });

  it('returns no trim suggestions when already safe or close', () => {
    const buckets: BucketDraft[] = [
      { id: 'a', label: 'Food', amountText: '15' },
      { id: 'b', label: 'Fun', amountText: '' },
    ];

    expect(getTrimSuggestions(20, buckets)).toEqual([]);
  });
});
