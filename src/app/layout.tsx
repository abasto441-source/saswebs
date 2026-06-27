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
        <nav className="h-12 bg-white text-slate-700 px-6 flex items-center justify-between border-b border-slate-200/80 text-xs font-bold z-50 relative shrink-0 shadow-xs">
          <div className="flex items-center gap-3">
            <span className="text-cyan-600 font-black tracking-widest text-[13px]">NRAM360</span>
            <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] uppercase">SaaS Engine</span>
          </div>
          <div className="flex items-center gap-5 overflow-x-auto py-1">
            <Link href="/" className="hover:text-cyan-600 text-slate-600 transition-colors">Plataforma</Link>
            <Link href="/admin" className="hover:text-indigo-600 text-indigo-600 transition-colors">★ Super Admin</Link>
            <Link href="/dashboard" className="hover:text-cyan-600 text-slate-600 transition-colors">Tenant Admin</Link>
            <Link href="/builder" className="hover:text-cyan-600 text-cyan-600 transition-colors">✎ Visual Builder</Link>
            <Link href="/pos" className="hover:text-cyan-600 text-slate-600 transition-colors">POS Caja</Link>
            <Link href="/inicio" className="hover:text-cyan-600 text-slate-600 transition-colors underline decoration-cyan-400">Ver Tienda</Link>
            <Link href="/login" className="hover:text-cyan-600 text-slate-600 transition-colors">Login/Registro</Link>
          </div>
          <div className="hidden lg:block text-slate-400 font-mono text-[10px]">
            Status: <span className="text-green-600 font-bold">Online</span>
          </div>
        </nav>

        {children}
      </body>
    </html>
  );
}