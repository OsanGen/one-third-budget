import React from 'react';

type CardProps = React.HTMLAttributes<HTMLElement> & {
  children: React.ReactNode;
  className?: string;
};

export default function Card({ children, className, ...rest }: CardProps) {
  return (
    <section
      className={`section-panel ${className ?? ''}`}
      {...rest}
    >
      {children}
    </section>
  );
}
