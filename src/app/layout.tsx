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
        
        {/* Top Shortcut Navigation Bar */}
        <nav className="h-12 bg-borla-negro text-white px-6 flex items-center justify-between border-b border-gray-800 text-xs font-bold z-50 relative shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-primary-celeste font-black tracking-widest text-[13px]">NRAM360</span>
            <span className="bg-white/15 px-2 py-0.5 rounded text-[10px] uppercase">SaaS Engine</span>
          </div>
          <div className="flex items-center gap-5 overflow-x-auto py-1">
            <Link href="/" className="hover:text-primary-celeste transition-colors">Plataforma</Link>
            <Link href="/admin" className="hover:text-primary-celeste transition-colors text-yellow-400">★ Super Admin</Link>
            <Link href="/dashboard" className="hover:text-primary-celeste transition-colors">Tenant Admin</Link>
            <Link href="/builder" className="hover:text-primary-celeste transition-colors text-primary-celeste">✎ Visual Builder</Link>
            <Link href="/pos" className="hover:text-primary-celeste transition-colors">POS Caja</Link>
            <Link href="/inicio" className="hover:text-primary-celeste transition-colors underline decoration-primary-celeste">Ver Tienda</Link>
            <Link href="/login" className="hover:text-primary-celeste transition-colors">Login/Registro</Link>
          </div>
          <div className="hidden lg:block text-gray-400 font-mono text-[10px]">
            Status: <span className="text-green-500 font-bold">Online</span>
          </div>
        </nav>

        {children}
      </body>
    </html>
  );
}