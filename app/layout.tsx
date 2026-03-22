import type { Metadata } from 'next';
import { Inter, Sora } from 'next/font/google';
import './globals.css';

const bodyFont = Inter({
  subsets: ['latin'],
  variable: '--font-body',
});

const headingFont = Sora({
  subsets: ['latin'],
  variable: '--font-heading',
  weight: ['400', '600', '700'],
});

export const metadata: Metadata = {
  title: 'One Third Budget',
  description: 'A calm budget coach built for easy first steps.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${bodyFont.variable} ${headingFont.variable}`}>
        {children}
      </body>
    </html>
  );
}
