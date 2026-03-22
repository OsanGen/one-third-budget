import type { BucketDraft } from '@/lib/types';
import { formatCurrency, getUsagePercent, parseMoneyInput } from '@/lib/money';

type SummaryTone = 'neutral' | 'safe' | 'close' | 'over';

type LegendBucket = BucketDraft & {
  amount: number;
  percentOfCap: number;
};

type Segment = {
  id: string;
  label: string;
  percent: number;
  color: string;
  path: string;
  isHighlighted: boolean;
};

type SummaryDonutProps = {
  tone: SummaryTone;
  hasRevenue: boolean;
  hasBuckets: boolean;
  buckets: BucketDraft[];
  bucketCap: number;
  remaining: number;
  usagePercent: number;
  overage: number;
  highlightedBucketId: string | null;
  onLegendSelect: (bucketId: string) => void;
};

const palette = [
  'var(--cog-blue)',
  'var(--cog-mint)',
  'var(--cog-yellow)',
  'var(--cog-pink)',
] as const;

const toneToneVar = {
  neutral: '--cog-blue',
  safe: '--cog-mint',
  close: '--cog-yellow',
  over: '--cog-pink',
} as const;

const donutRadius = 54;
const donutStroke = 10;
const donutCenter = 64;

const donutCircumference = 2 * Math.PI * donutRadius;

const polarToCartesian = (angle: number) => {
  const radians = (angle - 90) * (Math.PI / 180);

  return {
    x: donutCenter + donutRadius * Math.cos(radians),
    y: donutCenter + donutRadius * Math.sin(radians),
  };
};

const describeSegment = (startAngle: number, endAngle: number) => {
  const start = polarToCartesian(startAngle);
  const end = polarToCartesian(endAngle);
  const largeArc = endAngle - startAngle <= 180 ? '0' : '1';

  return `M ${start.x} ${start.y} A ${donutRadius} ${donutRadius} 0 ${largeArc} 1 ${end.x} ${end.y}`;
};

export default function SummaryDonut({
  tone,
  hasRevenue,
  hasBuckets,
  buckets,
  bucketCap,
  remaining,
  usagePercent,
  overage,
  highlightedBucketId,
  onLegendSelect,
}: SummaryDonutProps) {
  const hasCap = Number.isFinite(bucketCap) && bucketCap > 0;
  const preparedBuckets: LegendBucket[] = buckets.map((bucket) => {
    const amount = parseMoneyInput(bucket.amountText);

    return {
      ...bucket,
      amount,
      percentOfCap: hasCap ? getUsagePercent(bucketCap, amount) : 0,
    };
  });

  const total = preparedBuckets.reduce((sum, bucket) => sum + bucket.amount, 0);
  const usedTotalForSegments = hasCap ? Math.max(total, 0.01) : 0;

  let cursor = -90;
  const segments: Segment[] = preparedBuckets
    .filter((bucket) => hasCap && bucket.amount > 0)
    .map((bucket, index) => {
      const percentOfUsed = bucket.amount / usedTotalForSegments;
      const arcLength = percentOfUsed * 360;
      const segment = {
        id: bucket.id,
        label: bucket.label.trim().length > 0 ? bucket.label.trim() : `Bucket ${index + 1}`,
        percent: percentOfUsed * 100,
        color: palette[index % palette.length],
        path: describeSegment(cursor, cursor + arcLength),
        isHighlighted: highlightedBucketId === bucket.id,
      };

      cursor += arcLength;

      return segment;
    });

  const centerText = hasBuckets
    ? usagePercent > 100
      ? `${formatCurrency(overage)} over`
      : `${formatCurrency(hasRevenue ? remaining : 0)} left`
    : 'No buckets yet';

  const ringLabel = hasBuckets
    ? hasCap
      ? `Usage ${Math.min(Math.round(usagePercent), 100)}%`
      : 'Add your money in first'
    : 'Add a bucket to see this';

  return (
    <section className="summary-donut" aria-label="Budget usage ring and bucket detail">
      <div className="summary-donut-shell" aria-hidden="true">
        <svg viewBox="0 0 128 128" role="img" className="summary-donut-chart">
          <circle
            cx={donutCenter}
            cy={donutCenter}
            r={donutRadius}
            stroke="var(--fog)"
            strokeWidth={donutStroke}
            fill="none"
            className="summary-donut-track"
          />
          {segments.map((segment) => (
            <path
              key={segment.id}
              d={segment.path}
              stroke={segment.color}
              strokeWidth={segment.isHighlighted ? 12 : donutStroke}
              strokeLinecap="round"
              fill="none"
              className={`summary-donut-segment ${segment.isHighlighted ? 'summary-donut-segment-active' : ''}`}
            />
          ))}
          <circle
            cx={donutCenter}
            cy={donutCenter}
            r={donutRadius}
            stroke={`var(${toneToneVar[tone]})`}
            strokeWidth={donutStroke}
            fill="none"
            strokeDasharray={`${((Math.max(usagePercent, 0) / 100) * donutCircumference).toFixed(2)} ${donutCircumference.toFixed(2)}`}
            strokeDashoffset={donutCircumference - (Math.min(usagePercent, 100) / 100) * donutCircumference}
            className="summary-donut-usage"
            transform={`rotate(-90 ${donutCenter} ${donutCenter})`}
          />
        </svg>
        <div className="summary-donut-center">
          <p className="summary-donut-center-line1">{centerText}</p>
          <p className="summary-donut-center-line2">{ringLabel}</p>
        </div>
      </div>

      <div className="summary-donut-legend" role="list" aria-label="Bucket usage legend">
        {preparedBuckets.length === 0 ? (
          <p className="summary-donut-empty-help helper-note">No buckets to show yet.</p>
        ) : (
          preparedBuckets.map((bucket, index) => {
            const label = bucket.label.trim().length > 0 ? bucket.label.trim() : `Bucket ${index + 1}`;
            const amount = formatCurrency(bucket.amount);
            const percentText = hasCap
              ? `${Math.round(bucket.percentOfCap)}%`
              : 'n/a';
            const isHighlighted = highlightedBucketId === bucket.id;

            return (
              <button
                key={bucket.id}
                type="button"
                role="listitem"
                className={`summary-legend-row ${isHighlighted ? 'summary-legend-row-active' : ''}`}
                aria-label={`${label} has ${amount}. ${percentText} of your cap.`}
                onClick={() => onLegendSelect(bucket.id)}
                onFocus={() => onLegendSelect(bucket.id)}
              >
                <span className="summary-legend-dot" style={{ background: palette[index % palette.length] }} />
                <span className="summary-legend-name">{label}</span>
                <span className="summary-legend-amount">{amount}</span>
                <span className="summary-legend-percent">{percentText}</span>
              </button>
            );
          })
        )}
      </div>

      {hasBuckets ? null : (
        <p className="summary-donut-empty-help helper-note">
          Add a bucket amount to see this ring fill.
        </p>
      )}
      {hasBuckets && !hasRevenue ? (
        <p className="summary-donut-empty-help helper-note">
          Add your money in first so this ring matches your cap.
        </p>
      ) : null}
      {hasRevenue && bucketCap > 0 ? (
        <p className="summary-donut-meta">{`Used ${formatCurrency(total)} of ${formatCurrency(bucketCap)}`}</p>
      ) : null}
    </section>
  );
}
