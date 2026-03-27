import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Sanskrit Student',
  description: 'Sanskrit sutra translation with word-by-word breakdowns',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
