import type { Metadata } from 'next';
import './globals.css';
import { ApolloWrapper } from './ApolloWrapper';

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
      <body>
        <ApolloWrapper>{children}</ApolloWrapper>
      </body>
    </html>
  );
}
