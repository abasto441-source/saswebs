import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Link from 'next/link';

const inter = Inter({ subsets: ['latin'], weight: ['300', '400', '500', '700', '900'] });

export const metadata: Metadata = {
  title: 'NRAM360 SaaS Web - Odoo & POS Platform',
  description: 'Plataforma multi-inquilino de constructor visual, academia LMS y POS offline-first.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={`${inter.className} min-h-screen bg-gray-50 text-foreground`}>
        {children}
      </body>
    </html>
  );
}