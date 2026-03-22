import React from 'react';

export default function HeaderStrip() {
  return (
    <header className="header-strip">
      <h1 className="header-strip__title">One Third Budget</h1>
      <p className="header-strip__line">
        Your optional spending buckets stay within one-third of monthly money in.
      </p>
      <p className="header-strip__reassure">
        Type your numbers. The math updates right away.
      </p>
    </header>
  );
}
