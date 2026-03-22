import React from 'react';

type HelperTextProps = {
  children: React.ReactNode;
  id?: string;
  tone?: 'default' | 'muted';
};

export default function HelperText({ children, tone = 'default', id }: HelperTextProps) {
  return (
    <p
      className="helper-note"
      style={{
        color: tone === 'muted' ? '#64748b' : '#42506a',
      }}
      id={id}
    >
      {children}
    </p>
  );
}
