'use client';

import React from 'react';

// Props matching Figma design tokens
interface HeroProps {
  title: string;
  subtitle: string;
  buttonText: string;
  bgHex: string;
}

interface FeaturesProps {
  items: Array<{ title: string; desc: string }>;
  bgColor: string;
}

interface FooterProps {
  copyText: string;
  links: Array<{ label: string; url: string }>;
}

// 1. Figma Hero component assembled with Tailwind
export function FigmaHero({ title, subtitle, buttonText, bgHex }: HeroProps) {
  return (
    <div 
      className="py-24 px-6 text-center flex flex-col items-center justify-center rounded-3xl"
      style={{ backgroundColor: bgHex }}
    >
      <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">{title}</h1>
      <p className="text-sm md:text-base text-slate-700 mt-4 max-w-xl">{subtitle}</p>
      <button className="mt-6 px-6 py-3 bg-slate-900 text-white font-bold rounded-xl text-xs hover:bg-slate-800 transition-colors shadow">
        {buttonText}
      </button>
    </div>
  );
}

// 2. Figma Features component assembled with Tailwind
export function FigmaFeatures({ items, bgColor }: FeaturesProps) {
  return (
    <div className="py-16 px-6 rounded-3xl grid grid-cols-1 md:grid-cols-3 gap-6" style={{ backgroundColor: bgColor }}>
      {items.map((item, idx) => (
        <div key={idx} className="p-6 bg-white border border-slate-100 rounded-2xl shadow-sm">
          <h3 className="text-sm font-black text-slate-900">{item.title}</h3>
          <p className="text-xs text-slate-500 mt-2 leading-relaxed">{item.desc}</p>
        </div>
      ))}
    </div>
  );
}

// 3. Figma Footer component assembled with Tailwind
export function FigmaFooter({ copyText, links }: FooterProps) {
  return (
    <div className="py-10 px-6 bg-slate-900 text-white rounded-3xl flex flex-col md:flex-row justify-between items-center gap-4">
      <span className="text-xs text-slate-400">{copyText}</span>
      <div className="flex gap-4 text-xs font-bold text-slate-300">
        {links.map((link, idx) => (
          <a key={idx} href={link.url} className="hover:text-primary-celeste transition-colors">
            {link.label}
          </a>
        ))}
      </div>
    </div>
  );
}

// Main TemplateBuilder representation showing our Figma assembled structure
export default function TemplateBuilder() {
  const sampleHero = {
    title: 'Digitaliza tu Academia con Celeste LMS',
    subtitle: 'La infraestructura Odoo-style con CNAME dedicados y sincronización POS local.',
    buttonText: 'Empezar Auditoría',
    bgHex: '#bce6ed'
  };

  const sampleFeatures = {
    bgColor: '#ffffff',
    items: [
      { title: 'Conexión CNAME', desc: 'Certificados TLS automáticos gestionados en Cloudflare.' },
      { title: 'POS offline-first', desc: 'Transacciones guardadas en IndexedDB durante caídas de red.' },
      { title: 'Cursos LMS', desc: 'Lecciones en video y progress tracking por estudiante.' }
    ]
  };

  const sampleFooter = {
    copyText: '© 2026 NRAM360 Corporativo. Todos los derechos reservados.',
    links: [
      { label: 'Términos', url: '#' },
      { label: 'Soporte', url: '#' }
    ]
  };

  return (
    <div className="w-full flex flex-col gap-8 p-6 bg-slate-50 rounded-3xl border border-slate-200">
      <div className="border-b border-slate-200 pb-4">
        <span className="text-[10px] text-primary-celeste font-black uppercase tracking-widest">Ensamblador React (TemplateBuilder.tsx)</span>
        <h4 className="text-sm font-extrabold text-slate-900 mt-1">Previsualización de Componentes Figma Assembled</h4>
      </div>

      <FigmaHero {...sampleHero} />
      <FigmaFeatures {...sampleFeatures} />
      <FigmaFooter {...sampleFooter} />
    </div>
  );
}
