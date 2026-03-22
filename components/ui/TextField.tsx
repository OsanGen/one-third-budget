import React from 'react';

type TextFieldProps = {
  label: string;
  helper?: string;
  value: string;
  placeholder?: string;
  type?: 'text' | 'number' | 'email';
  onChange: React.ChangeEventHandler<HTMLInputElement>;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'>;

export default function TextField({
  label,
  helper,
  value,
  type = 'text',
  onChange,
  placeholder,
  id,
  ...rest
}: TextFieldProps) {
  const inputId = id ?? `${label.replace(/\s+/g, '-').toLowerCase()}-field`;

  return (
    <label className="grid gap-2" htmlFor={inputId}>
      <span className="font-semibold text-[1.02rem]">{label}</span>
      <input
        id={inputId}
        value={value}
        type={type}
        onChange={onChange}
        placeholder={placeholder}
        className="h-12 rounded-xl border border-[var(--border)] bg-white px-3 text-[1.05rem]"
        {...rest}
      />
      {helper ? <span className="helper-note">{helper}</span> : null}
    </label>
  );
}
