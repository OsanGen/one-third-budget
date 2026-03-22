import React from 'react';

type ButtonProps = {
  children: React.ReactNode;
  variant?: 'primary' | 'subtle';
  type?: 'button' | 'submit' | 'reset';
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

export default function Button({ children, variant = 'subtle', className, type = 'button', ...rest }: ButtonProps) {
  const baseClass =
    'inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-2xl px-4 py-3 text-base font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-white';

  const variants = {
    primary:
      'bg-[var(--cog-accent)] text-white border border-[var(--cog-accent)] shadow-[0_8px_20px_rgba(18,28,44,0.08)]',
    subtle:
      'bg-white border border-[var(--border)] text-[var(--ink)] hover:bg-[color-mix(in oklab,var(--fog) 76%,white)]',
  } as const;

  return (
    <button
      type={type}
      className={`${baseClass} ${variants[variant]} ${className ?? ''}`}
      {...rest}
    >
      {children}
    </button>
  );
}
