'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Globe, Server, Cpu, Database, Check, ArrowRight, 
  Search, Shield, Activity, Terminal, Code, Sparkles 
} from 'lucide-react';
import { dbAdapter } from '@/lib/supabase';

export default function Home() {
  // Domain Search state
  const [domainQuery, setDomainQuery] = useState('');
  const [domainExt, setDomainExt] = useState('.nram360.com');
  const [searchResult, setSearchResult] = useState<{
    searched: boolean;
    available: boolean;
    price: string;
    msg: string;
  } | null>(null);

  // Hosting VPS slider state (1 = Básico, 2 = Dedicado, 3 = Enterprise)
  const [vpsTier, setVpsTier] = useState<number>(2);

  // Simulated lookup of domains
  const handleDomainSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!domainQuery) return;

    const queryClean = domainQuery.toLowerCase().trim().replace(/[^a-z0-9-]/g, '');
    const tenants = dbAdapter.getTenants();
    
    // Check if subdomain is already registered in the system
    const isTaken = tenants.some(t => t.subdomain === queryClean);

    if (isTaken) {
      setSearchResult({
        searched: true,
        available: false,
        price: '',
        msg: `El subdominio /${queryClean} ya está ocupado por otra empresa. Por favor intenta con otro nombre.`
      });
    } else {
      const price = domainExt === '.nram360.com' ? 'Gratis' : '$12.00 / año';
      setSearchResult({
        searched: true,
        available: true,
        price,
        msg: `¡Felicidades! "${queryClean}${domainExt}" está disponible para registro inmediato.`
      });
    }
  };

  // Hosting details based on tier
  const getHostingDetails = () => {
    switch (vpsTier) {
      case 1:
        return {
          name: 'Cloud VPS Básico',
          price: '$5.00/mes',
          cpu: '1 vCPU Intel Core',
          ram: '2 GB DDR4 RAM',
          ssd: '30 GB SSD NVMe',
          traffic: '1 TB Ancho de Banda',
          latency: '25ms promedio',
          bestFor: 'Starter Plan y tiendas pequeñas'
        };
      case 3:
        return {
          name: 'Cloud VPS Multi-Region Node',
          price: '$45.00/mes',
          cpu: '4 vCPU Dedicados Xeon',
          ram: '8 GB DDR4 RAM',
          ssd: '150 GB SSD NVMe RAID-10',
          traffic: 'Ilimitado + CDN Cloudflare',
          latency: '5ms promedio (Edge)',
          bestFor: 'Plataformas educativas masivas y ERPs multi-usuario'
        };
      case 2:
      default:
        return {
          name: 'Cloud VPS Dedicado Pro',
          price: '$15.00/mes',
          cpu: '2 vCPU Dedicados Xeon',
          ram: '4 GB DDR4 RAM',
          ssd: '80 GB SSD NVMe',
          traffic: '5 TB Ancho de Banda',
          latency: '12ms promedio',
          bestFor: 'Pro Plan, academias medianas y POS sincronizados'
        };
    }
  };

  const currentHosting = getHostingDetails();

  return (
    <div className="w-full min-h-[calc(100vh-3rem)] bg-gradient-to-br from-white via-[#f0f9ff] to-white text-slate-800 flex flex-col justify-between">
      
      {/* 1. HERO SECTION */}
      <header className="max-w-6xl mx-auto w-full px-6 py-16 text-center flex flex-col items-center gap-6">
        <div className="flex items-center gap-2 px-4 py-1.5 bg-celeste-claro/30 text-primary-celeste rounded-full text-xs font-black uppercase tracking-widest animate-pulse border border-celeste-claro/50">
          <Sparkles className="w-3.5 h-3.5" /> Portal de Infraestructura SaaS
        </div>
        <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight leading-none max-w-4xl">
          Dominios, Servidores Dedicados y Suscripciones SaaS Bajo Control
        </h1>
        <p className="text-base md:text-lg text-slate-600 max-w-2xl leading-relaxed">
          NRAM360 te provee de dominios con SSL administrado y VPS en la nube autogestionados para desplegar instantáneamente tu Academia LMS o POS de Ventas.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4 mt-4">
          <a 
            href="#suscripciones" 
            className="px-8 py-4 bg-slate-900 text-white rounded-full font-bold shadow-xl hover:bg-primary-celeste hover:text-slate-950 transition-all hover:scale-105 duration-300"
          >
            Ver Planes de Suscripción
          </a>
          <Link 
            href="/admin" 
            className="px-8 py-4 bg-white border border-slate-200 text-slate-900 rounded-full font-bold shadow hover:bg-slate-50 transition-all hover:scale-105 duration-300 flex items-center gap-2"
          >
            Consola Super Admin <ArrowRight className="w-4 h-4 text-primary-celeste" />
          </Link>
        </div>
      </header>

      {/* 2. DOMAIN SEARCH SECTION */}
      <section className="max-w-5xl mx-auto w-full px-6 py-10">
        <div className="bg-white/80 backdrop-blur border border-celeste-claro/50 rounded-3xl p-8 md:p-10 shadow-2xl relative overflow-hidden">
          <div className="absolute -top-12 -left-12 w-28 h-28 bg-primary-celeste/10 rounded-full blur-2xl"></div>
          
          <div className="mb-6">
            <h3 className="text-xl md:text-2xl font-black text-slate-900 flex items-center gap-2">
              <Globe className="w-6 h-6 text-primary-celeste animate-bounce" /> Registrar tu Dominio o Subdominio
            </h3>
            <p className="text-xs md:text-sm text-slate-500 mt-1">
              Verifica la disponibilidad de tu dirección comercial. El Super Admin autogestiona el ruteo DNS CNAME.
            </p>
          </div>

          <form onSubmit={handleDomainSearch} className="flex flex-col sm:flex-row gap-3">
            <div className="flex-grow flex border border-slate-200 rounded-2xl overflow-hidden focus-within:ring-2 focus-within:ring-primary-celeste transition-all bg-white">
              <span className="flex items-center pl-4 text-slate-400">
                <Search className="w-4 h-4" />
              </span>
              <input 
                required
                type="text" 
                placeholder="ej. miacademiaoventas" 
                value={domainQuery}
                onChange={(e) => setDomainQuery(e.target.value)}
                className="w-full px-3 py-3.5 bg-transparent border-0 text-slate-800 focus:ring-0 text-xs sm:text-sm outline-none font-bold"
              />
            </div>
            <select 
              value={domainExt}
              onChange={(e) => setDomainExt(e.target.value)}
              className="px-4 py-3.5 border border-slate-200 rounded-2xl bg-white focus:ring-2 focus:ring-primary-celeste text-xs font-bold text-slate-700 outline-none"
            >
              <option value=".nram360.com">.nram360.com (Subdominio)</option>
              <option value=".com">.com (Dominio Propio)</option>
              <option value=".net">.net (Dominio Propio)</option>
            </select>
            <button 
              type="submit" 
              className="px-8 py-3.5 bg-slate-900 text-white font-bold rounded-2xl hover:bg-primary-celeste hover:text-slate-950 transition-colors flex items-center justify-center gap-2 text-xs uppercase"
            >
              Buscar
            </button>
          </form>

          {/* Domain Search Results */}
          {searchResult && (
            <div className={`mt-6 p-5 rounded-2xl border text-xs leading-relaxed flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
              searchResult.available 
                ? 'bg-green-50 border-green-200 text-green-800' 
                : 'bg-red-50 border-red-200 text-red-800'
            }`}>
              <div>
                <span className="font-extrabold text-sm block">
                  {searchResult.available ? '¡Disponible para Registro!' : 'Dirección Ocupada'}
                </span>
                <span className="mt-1 block">{searchResult.msg}</span>
              </div>
              {searchResult.available && (
                <div className="flex items-center gap-3 shrink-0">
                  <span className="font-extrabold text-sm bg-white border border-green-200 px-3 py-1.5 rounded-xl">
                    {searchResult.price}
                  </span>
                  <Link 
                    href={`/login?register=true&subdomain=${domainQuery}&company=${domainQuery}&plan=Pro`}
                    className="px-4 py-2 bg-green-700 text-white font-extrabold rounded-xl hover:bg-green-800 transition-colors text-[10px] uppercase tracking-wide flex items-center gap-1.5 shadow"
                  >
                    Registrar Ahora <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* 3. INTERACTIVE VPS HOSTING SECTION */}
      <section className="max-w-5xl mx-auto w-full px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-center">
          
          {/* Slider Configurator Panel */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <div>
              <span className="text-[10px] uppercase tracking-widest text-primary-celeste font-black block">Infraestructura Dedicada</span>
              <h3 className="text-2xl font-black text-slate-900 mt-1">Hosting Servidores Cloud VPS</h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Asigna recursos de hosting dedicados a tus inquilinos de acuerdo a su tráfico. Configuración auto-escalable en Kubernetes gestionada por el Super Admin.
              </p>
            </div>

            {/* Slider control */}
            <div className="flex flex-col gap-3 p-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
              <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                <span>Seleccionar Recursos Cloud</span>
                <span className="text-primary-celeste font-black">{currentHosting.name}</span>
              </div>
              <input 
                type="range" 
                min="1" 
                max="3" 
                step="1"
                value={vpsTier}
                onChange={(e) => setVpsTier(parseInt(e.target.value))}
                className="w-full accent-primary-celeste cursor-pointer h-2 bg-slate-200 rounded-lg appearance-none"
              />
              <div className="flex justify-between text-[10px] font-bold text-slate-400 px-1">
                <span>Básico</span>
                <span>Pro Dedicado</span>
                <span>Enterprise</span>
              </div>
            </div>
          </div>

          {/* Hosting Specs Dashboard Panel */}
          <div className="lg:col-span-3 bg-slate-900 text-white rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden border border-slate-800">
            <div className="absolute top-4 right-4 flex items-center gap-1.5 text-[9px] bg-slate-800 text-primary-celeste px-2 py-0.5 rounded-full font-mono font-bold border border-slate-700">
              <Activity className="w-3 h-3 animate-pulse text-green-500" /> STATUS: ACTIVE
            </div>
            
            <div className="flex flex-col gap-5">
              <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-black">Plan Cloud Server</span>
                  <h4 className="text-lg font-extrabold text-white mt-0.5">{currentHosting.name}</h4>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase font-black block">Costo mensual</span>
                  <span className="text-xl font-black text-primary-celeste">{currentHosting.price}</span>
                </div>
              </div>

              {/* Hardware stats */}
              <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-800/40 border border-slate-800">
                  <Cpu className="w-4 h-4 text-slate-400" />
                  <div>
                    <span className="text-[9px] text-slate-500 block">Procesador</span>
                    <span className="text-white font-bold">{currentHosting.cpu}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-800/40 border border-slate-800">
                  <Database className="w-4 h-4 text-slate-400" />
                  <div>
                    <span className="text-[9px] text-slate-500 block">Memoria RAM</span>
                    <span className="text-white font-bold">{currentHosting.ram}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-800/40 border border-slate-800">
                  <Server className="w-4 h-4 text-slate-400" />
                  <div>
                    <span className="text-[9px] text-slate-500 block">Almacenamiento</span>
                    <span className="text-white font-bold">{currentHosting.ssd}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-800/40 border border-slate-800">
                  <Activity className="w-4 h-4 text-slate-400" />
                  <div>
                    <span className="text-[9px] text-slate-500 block">Ancho de Banda</span>
                    <span className="text-white font-bold">{currentHosting.traffic}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center border-t border-slate-800 pt-4 text-[10px]">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-ping"></span>
                  <span className="text-slate-400 font-semibold">Latencia Edge:</span>
                  <span className="text-white font-bold">{currentHosting.latency}</span>
                </div>
                <span className="text-primary-celeste font-bold italic">Ideal para: {currentHosting.bestFor}</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 4. PLAN COMPARISON SECTION */}
      <section id="suscripciones" className="max-w-5xl mx-auto w-full px-6 py-16">
        <div className="text-center mb-12">
          <span className="text-[10px] uppercase tracking-widest text-primary-celeste font-black block">Planes Flexibles</span>
          <h2 className="text-3xl font-black text-slate-900 mt-1">Planes de Suscripción SaaS</h2>
          <p className="text-xs md:text-sm text-slate-500 mt-2 max-w-xl mx-auto">
            Habilita módulos específicos (Academia LMS, POS de Ventas o Ecommerce) de acuerdo a tu modelo de negocio comercial.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Starter Plan */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-md flex flex-col justify-between hover:border-slate-300 transition-all">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest block">Pequeños Negocios</span>
              <h4 className="text-xl font-black text-slate-900 mt-0.5">Starter Plan</h4>
              <span className="text-2xl font-black text-slate-900 mt-3 block">$19.00 <span className="text-xs text-slate-400 font-bold">/ mes</span></span>
              
              <ul className="flex flex-col gap-3 mt-6 text-xs text-slate-600">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500 shrink-0" /> Constructor Visual (4 capas)
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500 shrink-0" /> Módulo POS de Ventas Offline
                </li>
                <li className="flex items-center gap-2 text-slate-300">
                  <Check className="w-4 h-4 text-slate-300 shrink-0" /> Aula LMS Cursos (No incluido)
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500 shrink-0" /> Subdominio .nram360.com gratis
                </li>
              </ul>
            </div>
            <Link 
              href="/login?register=true&plan=Starter"
              className="w-full py-3 text-center bg-slate-50 border border-slate-100 hover:bg-slate-100 text-slate-800 font-bold rounded-xl mt-8 text-xs transition-colors block"
            >
              Contratar Starter
            </Link>
          </div>

          {/* Pro Plan (Best Value) */}
          <div className="p-6 rounded-3xl bg-white border-2 border-primary-celeste shadow-xl flex flex-col justify-between relative overflow-hidden transform hover:-translate-y-1 transition-all">
            <div className="absolute top-0 right-0 bg-primary-celeste text-slate-950 font-black text-[9px] uppercase px-3 py-1.5 rounded-bl-xl shadow">
              Recomendado
            </div>
            <div>
              <span className="text-[10px] text-primary-celeste uppercase font-black tracking-widest block">Crecimiento rápido</span>
              <h4 className="text-xl font-black text-slate-900 mt-0.5">Pro Plan</h4>
              <span className="text-2xl font-black text-slate-900 mt-3 block">$49.00 <span className="text-xs text-slate-400 font-bold">/ mes</span></span>
              
              <ul className="flex flex-col gap-3 mt-6 text-xs text-slate-600">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500 shrink-0" /> Constructor Visual (4 capas)
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500 shrink-0" /> Módulo POS de Ventas Offline
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500 shrink-0" /> Aula LMS Cursos Virtuales
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500 shrink-0" /> Dominios personalizados CNAME
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500 shrink-0" /> Certificado SSL Certs Automáticos
                </li>
              </ul>
            </div>
            <Link 
              href="/login?register=true&plan=Pro"
              className="w-full py-3 text-center bg-slate-900 text-white hover:bg-primary-celeste hover:text-slate-950 font-bold rounded-xl mt-8 text-xs transition-colors block shadow-md"
            >
              Contratar Plan Pro
            </Link>
          </div>

          {/* Enterprise Plan */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-md flex flex-col justify-between hover:border-slate-300 transition-all">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest block">Corporativo / Académico</span>
              <h4 className="text-xl font-black text-slate-900 mt-0.5">Enterprise Plan</h4>
              <span className="text-2xl font-black text-slate-900 mt-3 block">$99.00 <span className="text-xs text-slate-400 font-bold">/ mes</span></span>
              
              <ul className="flex flex-col gap-3 mt-6 text-xs text-slate-600">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500 shrink-0" /> Todo lo incluido en el Plan Pro
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500 shrink-0" /> VPS Dedicado Multi-Región Xeon
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500 shrink-0" /> Copias de Respaldo Cada 24h
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500 shrink-0" /> Soporte Dedicado 24/7 (Super Admin)
                </li>
              </ul>
            </div>
            <Link 
              href="/login?register=true&plan=Enterprise"
              className="w-full py-3 text-center bg-slate-50 border border-slate-100 hover:bg-slate-100 text-slate-800 font-bold rounded-xl mt-8 text-xs transition-colors block"
            >
              Contratar Enterprise
            </Link>
          </div>

        </div>
      </section>

      {/* 5. FOOTER */}
      <footer className="text-center text-xs text-gray-400 mt-16 max-w-6xl mx-auto w-full border-t border-gray-200/55 p-6 flex flex-col md:flex-row justify-between items-center gap-4">
        <span>© 2026 NRAM360 SaaS. Todos los derechos reservados. Desarrollado con Next.js, Zustand y Tailwind CSS.</span>
        <div className="flex gap-4">
          <Link href="/admin" className="hover:underline">Super Admin</Link>
          <Link href="/dashboard" className="hover:underline">Dashboard</Link>
          <Link href="/builder" className="hover:underline">Constructor</Link>
          <Link href="/pos" className="hover:underline">POS Caja</Link>
        </div>
      </footer>

    </div>
  );
}