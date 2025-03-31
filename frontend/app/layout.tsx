import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Bank App',
  description: 'A distributed banking system with Pix transactions.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ fontFamily: 'Arial, sans-serif' }}>{children}</body>
    </html>
  );
} 