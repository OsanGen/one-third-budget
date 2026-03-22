import React from 'react';

import HelperText from '@/components/ui/HelperText';
import type { BucketDraft } from '@/lib/types';
import { getUsagePercent, parseMoneyInput } from '@/lib/money';

type BucketCardProps = {
  bucket: BucketDraft;
  cap: number;
  isHighlighted?: boolean;
  onLabelChange: (bucketId: string, nextLabel: string) => void;
  onAmountChange: (bucketId: string, nextAmount: string) => void;
  onAmountBlur: (bucketId: string, amountText: string) => void;
  onRemove: (bucketId: string) => void;
  setNameInputRef: (bucketId: string, node: HTMLInputElement | null) => void;
  setAmountInputRef: (bucketId: string, node: HTMLInputElement | null) => void;
};

export default function BucketCard({
  bucket,
  cap,
  isHighlighted = false,
  onLabelChange,
  onAmountChange,
  onAmountBlur,
  onRemove,
  setNameInputRef,
  setAmountInputRef,
}: BucketCardProps) {
  const amount = parseMoneyInput(bucket.amountText);
  const hasCap = Number.isFinite(cap) && cap > 0;
  const percentOfCap = getUsagePercent(cap, amount);
  const badgeText = bucket.label.trim().length > 0 ? bucket.label.trim().charAt(0).toUpperCase() : 'B';
const percentId = `bucket-${bucket.id}-percent`;

  return (
    <article className={`bucket-card ${isHighlighted ? 'bucket-card-highlighted' : ''}`}>
      <div className="bucket-card-head">
        <div className="bucket-card-badge" aria-hidden="true">
          {badgeText}
        </div>
        <div className="bucket-card-content">
          <label htmlFor={`bucket-name-${bucket.id}`} className="bucket-row-label">
            <span>Name this bucket</span>
            <input
              id={`bucket-name-${bucket.id}`}
              value={bucket.label}
              className="bucket-name-input"
              ref={(element) => setNameInputRef(bucket.id, element)}
              onChange={(event) => onLabelChange(bucket.id, event.target.value)}
            />
          </label>

          <label htmlFor={`bucket-amount-${bucket.id}`} className="money-field">
            <span className="bucket-row-label">Amount</span>
            <div className="money-input-wrapper money-input-wrapper--compact">
              <span className="money-input-prefix" aria-hidden="true">
                $
              </span>
              <input
                id={`bucket-amount-${bucket.id}`}
                value={bucket.amountText}
                inputMode="decimal"
                autoComplete="off"
                autoCorrect="off"
                className="money-input money-input--compact"
                placeholder="0"
                ref={(element) => setAmountInputRef(bucket.id, element)}
                onChange={(event) => onAmountChange(bucket.id, event.target.value)}
                onFocus={(event) => event.currentTarget.select()}
                onBlur={() => onAmountBlur(bucket.id, bucket.amountText)}
              />
            </div>
            {hasCap && amount > 0 ? (
              <HelperText id={percentId}>{`${Math.round(percentOfCap)}% of your bucket cap`}</HelperText>
            ) : null}
          </label>
        </div>
      </div>

      <div className="bucket-actions">
        <button
          type="button"
          onClick={() => onRemove(bucket.id)}
          className="bucket-remove-text"
          aria-label={`Remove ${bucket.label.trim().length > 0 ? bucket.label : 'this bucket'} card`}
        >
          Remove bucket
        </button>
      </div>
    </article>
  );
}
