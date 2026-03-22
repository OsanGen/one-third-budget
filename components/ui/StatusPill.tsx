import React from 'react';

type StateTone = 'blue' | 'mint' | 'yellow' | 'pink' | 'muted';

type StatusPillProps = {
  label: string;
  tone?: StateTone;
  children?: React.ReactNode;
};

const toneMap: Record<StateTone, string> = {
  blue: 'var(--cog-blue)',
  mint: 'var(--cog-mint)',
  yellow: 'var(--cog-yellow)',
  pink: 'var(--cog-pink)',
  muted: '#475569',
};
const toneTextMap: Record<StateTone, string> = {
  blue: '#19306a',
  mint: '#1a5d51',
  yellow: '#5e4b13',
  pink: '#6d2941',
  muted: '#334155',
};

export default function StatusPill({ label, tone = 'blue', children }: StatusPillProps) {
  return (
    <span
      className="badge"
      style={{
        color: toneTextMap[tone],
        borderColor: toneMap[tone],
        background: `color-mix(in oklab, ${toneMap[tone]} 18%, white)`,
      }}
    >
      {children ? <>{children} · </> : null}
      {label}
    </span>
  );
}
