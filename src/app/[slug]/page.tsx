'use client';

export const runtime = 'edge';

import React, { useState, useEffect, useRef } from 'react';
import PageRenderer from '@/components/PageRenderer';
import { dbAdapter, type Course, type Enrollment, type Tenant, type CustomerAccount } from '@/lib/supabase';
import { useBuilderStore } from '@/store/builderStore';
import { 
  BookOpen, CheckCircle, Play, ArrowRight, Award, 
  GraduationCap, Terminal, Database, Server, RefreshCw, 
  ShieldCheck, ChevronDown, ChevronUp, Cpu, ShoppingBag, 
  Calendar, User, FileText, CreditCard, History
} from 'lucide-react';

export default function StorefrontPage({ params }: { params: Promise<{ slug: string }> }) {
  const [slug, setSlug] = useState<string>('');
  const [activeCourseId, setActiveCourseId] = useState<string | null>(null);
  const [activeLessonIndex, setActiveLessonIndex] = useState(0);
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [isClient, setIsClient] = useState(false);
  
  // Custom Domain & Telemetry states
  const [activeTenant, setActiveTenant] = useState<Tenant | null>(null);
  const [isTelemetryOpen, setIsTelemetryOpen] = useState(false);
  const [cacheStatus, setCacheStatus] = useState<'HIT' | 'MISS' | 'PURGING'>('HIT');
  const [logs, setLogs] = useState<string[]>([]);
  const [diagnosticsMetric, setDiagnosticsMetric] = useState({
    rayId: '9f' + Math.random().toString(36).substr(2, 12),
    execTime: 14,
    edgeIp: '172.67.74.120',
    nodeLocation: 'SCL-01 (Santiago, Chile)'
  });

  // Visitor Account Portal States
  const [customer, setCustomer] = useState<CustomerAccount | null>(null);
  const [customerTab, setCustomerTab] = useState<'orders' | 'courses' | 'reservations'>('orders');
  const [selectedOrderReceipt, setSelectedOrderReceipt] = useState<any | null>(null);

  // CLI SDK Simulator States
  const [consoleTab, setConsoleTab] = useState<'logger' | 'cli'>('logger');
  const [cliCommand, setCliCommand] = useState('');
  const [cliHistory, setCliHistory] = useState<string[]>([
    'nram-cli version 1.0.0',
    'Type "help" for a list of available commands.'
  ]);
  const cliTerminalEndRef = useRef<HTMLDivElement>(null);
  
  const { initPage, structure } = useBuilderStore();

  // Resolve tenant and initialize page
  useEffect(() => {
    setIsClient(true);

    const resolveParams = async () => {
      try {
        const resolvedParams = await params;
        const targetSlug = resolvedParams?.slug;
        if (!targetSlug) return;

        setSlug(targetSlug);

        // Resolve tenant by subdomain/custom domain or fallback to active tenant
        const tenants = dbAdapter.getTenants();
        const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
        let resolved = tenants.find(t => t.customDomain === hostname || t.subdomain === hostname);
        if (!resolved) {
          resolved = dbAdapter.getActiveTenant();
        }
        setActiveTenant(resolved);

        // Set diagnostics parameters based on resolving location
        const loc = resolved.subdomain === 'tecnobo' 
          ? 'MIA-02 (Miami, USA)' 
          : 'SCL-01 (Santiago, Chile)';
        const ip = resolved.subdomain === 'tecnobo'
          ? '104.26.12.31'
          : '172.67.74.120';
        setDiagnosticsMetric({
          rayId: 'cf-' + Math.random().toString(36).substr(2, 14),
          execTime: resolved.subdomain === 'tecnobo' ? 22 : 14,
          edgeIp: ip,
          nodeLocation: loc
        });

        const customerAccounts = dbAdapter.getCustomerAccounts();
        const activeCust = customerAccounts.find(c => c.tenantId === resolved.id) || customerAccounts[0];
        setCustomer(activeCust || null);

        const page = dbAdapter.getTenantPage(resolved.id, targetSlug);
        if (page) {
          initPage(page.id, page.slug, page.title, page.isPublished, {
            blocks: JSON.parse(page.structureJson)
          });
        }
      } catch (err) {
        console.error('Error resolving params:', err);
      }
    };

    resolveParams();

    setCourses(dbAdapter.getCourses());
    setEnrollments(dbAdapter.getEnrollments());
  }, [params, initPage]);

  // Seed edge server query logs based on active blocks
  useEffect(() => {
    if (!structure.blocks || structure.blocks.length === 0) return;
    const initialLogs: string[] = [];
    const timestamp = () => `[${new Date().toLocaleTimeString()}]`;
    
    initialLogs.push(`${timestamp()} CF-Ray: Route matching resolved tenant ${activeTenant?.name || 'Celeste'}`);
    initialLogs.push(`${timestamp()} GET /api/tenant/config -> 200 OK (3ms)`);
    
    const hasProducts = structure.blocks.some(b => b.type === 'dynamic_product_grid');
    const hasCourses = structure.blocks.some(b => b.type === 'lms_course_list');
    const hasCalendar = structure.blocks.some(b => b.type === 'reservations_calendar');
    
    if (hasProducts) {
      initialLogs.push(`${timestamp()} GET /api/products?collection=Novedades -> 200 OK (Medusa API - 45ms)`);
    }
    if (hasCourses) {
      initialLogs.push(`${timestamp()} GET /api/courses -> 200 OK (SaaS LMS DB - 28ms)`);
    }
    if (hasCalendar) {
      initialLogs.push(`${timestamp()} GET /api/reservations?tenant=${activeTenant?.id} -> 200 OK (Postgres - 32ms)`);
    }
    
    setLogs(initialLogs);
  }, [structure.blocks, activeTenant]);

  useEffect(() => {
    if (courses.length > 0 && !activeCourseId) {
      setActiveCourseId(courses[0].id);
    }
  }, [courses]);

  if (!isClient || !slug) return null;

  const activeCourse = courses.find(c => c.id === activeCourseId);
  const activeEnrollment = enrollments.find(e => e.courseId === activeCourseId);

  // Mock list of lessons inside active course
  const lessons = activeCourse ? [
    { title: 'Lección 1: Introducción a Next.js', duration: '12 mins', video: 'https://assets.mixkit.co/videos/preview/mixkit-software-developer-working-on-his-computer-34323-large.mp4' },
    { title: 'Lección 2: Enrutamiento con App Router', duration: '18 mins', video: 'https://assets.mixkit.co/videos/preview/mixkit-web-development-team-working-in-office-40436-large.mp4' },
    { title: 'Lección 3: Server Actions y Mutations', duration: '22 mins', video: 'https://assets.mixkit.co/videos/preview/mixkit-coding-on-a-laptop-42171-large.mp4' },
    { title: 'Lección 4: Integración Supabase Postgres RLS', duration: '25 mins', video: 'https://assets.mixkit.co/videos/preview/mixkit-hand-of-a-developer-typing-on-a-keyboard-40437-large.mp4' }
  ].slice(0, activeCourse.lessonsCount) : [];

  useEffect(() => {
    if (cliTerminalEndRef.current) {
      cliTerminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [cliHistory]);

  const handleCliSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = cliCommand.trim();
    if (!cmd) return;

    const newHistory = [...cliHistory, `nram-cli $ ${cmd}`];
    
    if (cmd.toLowerCase() === 'help') {
      newHistory.push('Comandos disponibles:');
      newHistory.push('  nram module create [nombre]   Crea un módulo personalizado.');
      newHistory.push('  nram module publish           Compila y publica el módulo al Marketplace.');
      newHistory.push('  clear                         Limpia el historial de la terminal.');
    } else if (cmd.toLowerCase() === 'clear') {
      setCliHistory([]);
      setCliCommand('');
      return;
    } else if (cmd.toLowerCase().startsWith('nram module create ')) {
      const moduleName = cmd.substring(19).trim();
      newHistory.push(`✓ Created module block: ${moduleName || 'custom_module'}`);
      newHistory.push('Tip: Run "nram module publish" to push it to the Super Admin Marketplace.');
    } else if (cmd.toLowerCase() === 'nram module publish') {
      newHistory.push('⚙ Compiling bundle...');
      newHistory.push('✓ Bundle compiled. Pushed custom_module version 1.0.0 to SaaS Marketplace.');
    } else {
      newHistory.push(`Command not found: ${cmd}. Type "help" for a list of available commands.`);
    }

    setCliHistory(newHistory);
    setCliCommand('');
  };

  const handleCompleteLesson = () => {
    if (!activeCourse || !lessons[activeLessonIndex]) return;
    dbAdapter.updateLessonProgress(activeCourse.id, lessons[activeLessonIndex].title);
    setEnrollments(dbAdapter.getEnrollments());

    if (activeLessonIndex < lessons.length - 1) {
      setActiveLessonIndex(prev => prev + 1);
    } else {
      alert('¡Felicitaciones! Has completado todas las lecciones de este curso.');
    }
  };

  // Simulated log injectors
  const addSimulatedLog = (type: 'medusa' | 'klaviyo' | 'shopify') => {
    const timestamp = `[${new Date().toLocaleTimeString()}]`;
    let newLog = '';
    if (type === 'medusa') {
      newLog = `${timestamp} GET /api/products?collection=all -> 200 OK (Medusa Edge Storefront - 52ms)`;
    } else if (type === 'klaviyo') {
      newLog = `${timestamp} POST /api/webhooks/klaviyo -> 201 Created (Klaviyo CRM Lead Sync - 124ms)`;
    } else if (type === 'shopify') {
      newLog = `${timestamp} GET /api/shopify/checkout-session -> 200 OK (Shopify Cart API - 85ms)`;
    }
    setLogs(prev => [...prev, newLog]);
  };

  // Purge cache simulation
  const handlePurgeCache = () => {
    setCacheStatus('PURGING');
    const timestamp = `[${new Date().toLocaleTimeString()}]`;
    setLogs(prev => [...prev, `${timestamp} PURGE /${slug} -> 200 Purged Edge Route (Cloudflare Purge API - 110ms)`]);
    
    setTimeout(() => {
      setCacheStatus('MISS');
      setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] GET /${slug} -> 200 OK (REGENERATED ISR - 180ms)`]);
      setTimeout(() => {
        setCacheStatus('HIT');
      }, 1500);
    }, 1000);
  };

  const renderLMS = () => {
    return (
      <div className="w-full min-h-[calc(100vh-3rem)] bg-slate-50 flex flex-col md:flex-row text-slate-800">
        
        {/* Left pane: Active Enrollments & Course list */}
        <aside className="w-full md:w-80 bg-white border-r border-slate-200 p-6 flex flex-col gap-6 shrink-0">
          <div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Mi Cuenta Académica</span>
            <span className="text-xl font-black text-slate-900 mt-1 block flex items-center gap-2">
              <GraduationCap className="w-6 h-6 text-primary-celeste" /> Aula Virtual
            </span>
          </div>

          {/* Active Courses Selector */}
          <div className="flex flex-col gap-2.5">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Mis Cursos Matriculados</span>
            {enrollments.length === 0 ? (
              <div className="text-center py-6 border border-dashed border-slate-200 rounded-xl text-gray-400 text-xs">
                No estás matriculado en ningún curso aún. Visita la tienda o el catálogo para inscribirte.
              </div>
            ) : (
              enrollments.map((enr) => {
                const c = courses.find(item => item.id === enr.courseId);
                if (!c) return null;
                const isSelected = activeCourseId === c.id;
                return (
                  <button
                    key={enr.id}
                    onClick={() => {
                      setActiveCourseId(c.id);
                      setActiveLessonIndex(0);
                    }}
                    className={`w-full p-4 rounded-xl border text-left flex flex-col justify-between transition-all ${
                      isSelected 
                        ? 'border-primary-celeste bg-celeste-claro/10' 
                        : 'border-slate-100 bg-slate-50 hover:bg-slate-100/60'
                    }`}
                  >
                    <div>
                      <span className="font-extrabold text-xs text-slate-900 block truncate leading-tight">{c.title}</span>
                      <span className="text-[10px] text-slate-400 block mt-1">Instructor: {c.instructorName}</span>
                    </div>
                    
                    {/* Progress indicator */}
                    <div className="w-full flex items-center gap-2 mt-4">
                      <div className="flex-grow bg-slate-200 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-primary-celeste h-1.5 rounded-full" style={{ width: `${enr.progress}%` }}></div>
                      </div>
                      <span className="font-bold text-[10px] text-slate-700">{enr.progress}%</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Recommended catalog list */}
          <div className="border-t border-slate-100 pt-6 mt-auto">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-3">Catálogo Adicional</span>
            <div className="flex flex-col gap-2">
              {courses.filter(c => !enrollments.some(e => e.courseId === c.id)).map(c => (
                <div key={c.id} className="p-3 border border-slate-100 rounded-lg bg-slate-50 flex items-center justify-between text-xs">
                  <span className="font-bold truncate max-w-[120px]">{c.title}</span>
                  <button 
                    onClick={() => {
                      dbAdapter.enrollInCourse(c.id);
                      setEnrollments(dbAdapter.getEnrollments());
                      setActiveCourseId(c.id);
                      setActiveLessonIndex(0);
                    }}
                    className="px-2 py-1 bg-primary-celeste text-white font-bold rounded text-[10px]"
                  >
                    + Matricular
                  </button>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Right pane: Course Video Player and Lesson complete loops */}
        {activeCourse ? (
          <main className="flex-grow p-6 md:p-10 overflow-y-auto flex flex-col lg:flex-row gap-8 pb-32">
            
            {/* Player Workspace */}
            <div className="flex-grow flex flex-col gap-6 max-w-3xl">
              <div className="flex items-center gap-3">
                <span className="bg-celeste-claro/40 text-primary-celeste px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider">LMS Player</span>
                <span className="text-xs text-gray-400">Instructor: {activeCourse.instructorName}</span>
              </div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-none">{activeCourse.title}</h2>
              
              {/* Responsive Video frame */}
              <div className="w-full aspect-video rounded-2xl overflow-hidden shadow-2xl border border-slate-200 bg-slate-950 relative">
                {lessons[activeLessonIndex] ? (
                  <video 
                    src={lessons[activeLessonIndex].video}
                    controls
                    className="w-full h-full object-cover"
                    key={activeLessonIndex}
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-center text-slate-500 gap-2">
                    <Award className="w-12 h-12 text-primary-celeste" />
                    <span className="font-bold text-sm">¡Curso Completado!</span>
                    <p className="text-xs text-slate-400 max-w-xs leading-relaxed">Has completado todas las lecciones académicas configuradas para este curso.</p>
                  </div>
                )}
              </div>

              {/* Lesson Controls */}
              {lessons[activeLessonIndex] && (
                <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-md flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Tema de la Lección Actual</span>
                    <span className="font-extrabold text-sm text-slate-900 block mt-1">{lessons[activeLessonIndex].title}</span>
                  </div>
                  <button 
                    onClick={handleCompleteLesson}
                    className="px-6 py-3 bg-slate-950 hover:bg-slate-900 text-white font-bold rounded-xl text-xs shadow hover:scale-105 transition-transform flex items-center gap-2"
                  >
                    Completar y Siguiente <ArrowRight className="w-4 h-4 text-primary-celeste" />
                  </button>
                </div>
              )}
            </div>

            {/* Sidebar Syllabus List */}
            <div className="w-full lg:w-72 bg-white border border-slate-200 rounded-2xl p-6 shadow-md shrink-0 h-fit">
              <span className="font-bold text-sm text-slate-800 block mb-4">Plan de Aprendizaje ({lessons.length} Temas)</span>
              <div className="flex flex-col gap-2 text-xs">
                {lessons.map((ls, idx) => {
                  const isCompleted = activeEnrollment?.lessonsCompleted.includes(ls.title);
                  const isActive = activeLessonIndex === idx;
                  return (
                    <button
                      key={idx}
                      onClick={() => setActiveLessonIndex(idx)}
                      className={`w-full p-3 rounded-lg border text-left flex items-center justify-between transition-all ${
                        isActive 
                          ? 'border-primary-celeste bg-celeste-claro/10 font-bold' 
                          : 'border-transparent bg-slate-50/50 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate max-w-[180px]">
                        {isCompleted ? (
                          <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                        ) : (
                          <Play className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-primary-celeste' : 'text-gray-400'}`} />
                        )}
                        <span className="truncate">{ls.title}</span>
                      </div>
                      <span className="text-[10px] text-gray-400">{ls.duration}</span>
                    </button>
                  );
                })}
              </div>
            </div>

          </main>
        ) : (
          <div className="flex-grow flex flex-col items-center justify-center text-center p-20 text-gray-400 gap-3">
            <BookOpen className="w-12 h-12 text-primary-celeste opacity-30 animate-bounce" />
            <span className="font-bold text-sm">Aula de Clases Virtual</span>
            <p className="text-xs max-w-xs leading-relaxed">Selecciona o matricúlate en un curso virtual de tu cuenta académica para comenzar tu aprendizaje en línea.</p>
          </div>
        )}

      </div>
    );
  };

  const renderCustomerPortal = () => {
    return (
      <div className="w-full min-h-[calc(100vh-3rem)] bg-slate-900 text-slate-100 flex flex-col items-center p-6 md:p-12 relative overflow-hidden font-sans">
        
        {/* Decorative background blur shapes */}
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary-celeste/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/15 rounded-full blur-[100px] pointer-events-none" />

        <div className="w-full max-w-5xl z-10 flex flex-col gap-8">
          
          {/* Header Banner */}
          <div className="p-8 rounded-3xl bg-slate-950/40 border border-slate-800 backdrop-blur-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-2xl">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary-celeste to-blue-500 flex items-center justify-center text-white text-2xl font-black shadow-lg">
                {customer?.name?.charAt(0) || 'U'}
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Portal de Clientes SaaS</span>
                <h2 className="text-2xl font-black text-white mt-1">¡Hola, {customer?.name || 'Invitado'}!</h2>
                <p className="text-xs text-slate-400 mt-0.5">Administra tus compras, cursos y reservas de {activeTenant?.name || 'la plataforma'}.</p>
              </div>
            </div>
            <div className="flex flex-col gap-1 text-xs md:text-right font-mono text-slate-400">
              <span className="text-white font-bold">{customer?.email || 'anonimo@gmail.com'}</span>
              <span>Tenant ID: <span className="text-primary-celeste font-bold">{activeTenant?.id || 't-celeste'}</span></span>
            </div>
          </div>

          {/* Grid Layout for sidebar menu + content */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            
            {/* Sidebar Menu */}
            <aside className="md:col-span-1 flex flex-col gap-2 bg-slate-950/20 p-3 rounded-2xl border border-slate-800/80 backdrop-blur-md h-fit">
              <button
                onClick={() => setCustomerTab('orders')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-xs font-bold transition-all ${
                  customerTab === 'orders' 
                    ? 'bg-primary-celeste text-slate-950 font-black shadow-lg shadow-primary-celeste/20' 
                    : 'text-slate-400 hover:bg-slate-850 hover:text-white'
                }`}
              >
                <ShoppingBag className="w-4 h-4" /> Mis Pedidos
              </button>
              
              <button
                onClick={() => setCustomerTab('courses')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-xs font-bold transition-all ${
                  customerTab === 'courses' 
                    ? 'bg-primary-celeste text-slate-950 font-black shadow-lg shadow-primary-celeste/20' 
                    : 'text-slate-400 hover:bg-slate-850 hover:text-white'
                }`}
              >
                <BookOpen className="w-4 h-4" /> Mis Cursos (LMS)
              </button>
              
              <button
                onClick={() => setCustomerTab('reservations')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-xs font-bold transition-all ${
                  customerTab === 'reservations' 
                    ? 'bg-primary-celeste text-slate-950 font-black shadow-lg shadow-primary-celeste/20' 
                    : 'text-slate-400 hover:bg-slate-850 hover:text-white'
                }`}
              >
                <Calendar className="w-4 h-4" /> Mis Reservas
              </button>

              <div className="border-t border-slate-800/80 pt-4 mt-4 px-2">
                <span className="text-[10px] text-slate-500 font-extrabold uppercase block mb-2">Enlaces Directos</span>
                <a 
                  href="/inicio" 
                  className="text-[11px] font-bold text-primary-celeste hover:underline block py-1"
                >
                  Ir a la Tienda ↗
                </a>
                <a 
                  href="/cursos" 
                  className="text-[11px] font-bold text-primary-celeste hover:underline block py-1"
                >
                  Aula Virtual ↗
                </a>
              </div>
            </aside>

            {/* Content Display Card */}
            <main className="md:col-span-3 p-6 rounded-3xl bg-slate-950/40 border border-slate-800 backdrop-blur-xl shadow-2xl flex flex-col gap-6 min-h-[350px]">
              
              {/* TAB 1: ORDERS */}
              {customerTab === 'orders' && (
                <div className="flex flex-col gap-4">
                  <div>
                    <h3 className="text-base font-black text-white">Historial de Compras</h3>
                    <p className="text-xs text-slate-400">Listado de transacciones físicas y digitales procesadas en la terminal POS.</p>
                  </div>

                  {(!customer?.orders || customer.orders.length === 0) ? (
                    <div className="text-center py-12 border border-dashed border-slate-800 rounded-2xl text-slate-500 text-xs">
                      No tienes compras registradas en este inquilino.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-slate-800 text-slate-500 font-bold">
                            <th className="pb-3 px-2">Pedido ID</th>
                            <th className="pb-3 px-2">Fecha</th>
                            <th className="pb-3 px-2 text-right">Total</th>
                            <th className="pb-3 px-2 text-right">Estado</th>
                            <th className="pb-3 px-2 text-right">Acción</th>
                          </tr>
                        </thead>
                        <tbody>
                          {customer.orders.map((order) => (
                            <tr key={order.id} className="border-b border-slate-900/60 hover:bg-slate-900/20 transition-colors">
                              <td className="py-4 px-2 font-mono font-bold text-slate-300 uppercase">{order.id}</td>
                              <td className="py-4 px-2 text-slate-400">{order.date}</td>
                              <td className="py-4 px-2 text-right font-black text-white">${order.total.toFixed(2)}</td>
                              <td className="py-4 px-2 text-right">
                                <span className="px-2 py-0.5 rounded-full bg-green-950/50 border border-green-800/80 text-green-400 font-black text-[9px] uppercase tracking-wider">
                                  {order.status}
                                </span>
                              </td>
                              <td className="py-4 px-2 text-right">
                                <button
                                  onClick={() => setSelectedOrderReceipt({
                                    id: order.id,
                                    date: order.date,
                                    total: order.total,
                                    status: order.status,
                                    items: [
                                      { name: 'Lector de Código de Barras Láser USB', qty: 1, price: 120.00 }
                                    ]
                                  })}
                                  className="px-3 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-white font-bold rounded-lg text-[10px] transition-colors"
                                >
                                  Ver Recibo
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: COURSES */}
              {customerTab === 'courses' && (
                <div className="flex flex-col gap-6">
                  <div>
                    <h3 className="text-base font-black text-white">Mis Cursos y Certificados</h3>
                    <p className="text-xs text-slate-400">Progreso académico de los cursos virtuales matriculados.</p>
                  </div>

                  {(!customer?.courses || customer.courses.length === 0) ? (
                    <div className="text-center py-12 border border-dashed border-slate-800 rounded-2xl text-slate-500 text-xs">
                      No estás matriculado en ningún curso todavía.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {customer.courses.map((course) => {
                        const isCompleted = course.progress === 100;
                        return (
                          <div key={course.id} className="p-5 border border-slate-800 bg-slate-950/20 rounded-2xl flex flex-col justify-between gap-4 shadow-md hover:border-slate-700 transition-colors">
                            <div>
                              <span className="text-[9px] font-black text-primary-celeste uppercase tracking-wider block">ID: {course.id}</span>
                              <h4 className="font-extrabold text-sm text-white mt-1 leading-snug">{course.title}</h4>
                            </div>

                            <div className="flex flex-col gap-1 text-[11px] font-bold">
                              <div className="flex justify-between text-slate-400">
                                <span>Progreso</span>
                                <span className="text-white">{course.progress}%</span>
                              </div>
                              <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800/80">
                                <div 
                                  className="bg-gradient-to-r from-primary-celeste to-blue-500 h-full rounded-full" 
                                  style={{ width: `${course.progress}%` }}
                                />
                              </div>
                            </div>

                            <div className="flex justify-between items-center border-t border-slate-800/80 pt-3 mt-1">
                              {isCompleted ? (
                                <button
                                  onClick={() => {
                                    alert(`Graduado en ${course.title}! Generando diploma firmado...`);
                                    const certText = `-----------------------------------------------\nCERTIFICADO DE FINALIZACIÓN\n\nEste diploma certifica que\n${customer.name}\nha completado satisfactoriamente el curso:\n"${course.title}"\nFecha: ${new Date().toLocaleDateString()}\n-----------------------------------------------`;
                                    const blob = new Blob([certText], { type: 'text/plain;charset=utf-8' });
                                    const url = URL.createObjectURL(blob);
                                    const link = document.createElement('a');
                                    link.href = url;
                                    link.download = `certificado_${course.id}.txt`;
                                    document.body.appendChild(link);
                                    link.click();
                                    document.body.removeChild(link);
                                  }}
                                  className="w-full py-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 text-white font-extrabold rounded-xl text-[10px] text-center shadow flex items-center justify-center gap-1"
                                >
                                  <Award className="w-3.5 h-3.5" /> Descargar Certificado
                                </button>
                              ) : (
                                <>
                                  <span className="text-[10px] text-slate-500">Curso en progreso</span>
                                  <a
                                    href="/cursos"
                                    className="px-3.5 py-1.5 bg-primary-celeste text-slate-950 font-black rounded-lg text-[10px] shadow hover:scale-102 transition-transform flex items-center gap-1"
                                  >
                                    Continuar Lección <ArrowRight className="w-3 h-3 text-slate-950" />
                                  </a>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: RESERVATIONS */}
              {customerTab === 'reservations' && (
                <div className="flex flex-col gap-4">
                  <div>
                    <h3 className="text-base font-black text-white">Próximas Reservas y Citas</h3>
                    <p className="text-xs text-slate-400">Coordinación de tus citas agendadas con nuestros profesionales.</p>
                  </div>

                  {(!customer?.reservations || customer.reservations.length === 0) ? (
                    <div className="text-center py-12 border border-dashed border-slate-800 rounded-2xl text-slate-500 text-xs">
                      No tienes citas ni reservas coordinadas actualmente.
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {customer.reservations.map((res) => (
                        <div key={res.id} className="p-4 border border-slate-800/80 bg-slate-950/20 rounded-xl flex justify-between items-center gap-4 shadow-sm">
                          <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-primary-celeste/10 border border-primary-celeste/20 text-primary-celeste rounded-xl">
                              <Calendar className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="font-extrabold text-white text-xs block">{res.service}</span>
                              <span className="text-[10px] text-slate-500 block mt-0.5">ID Cita: {res.id.toUpperCase()}</span>
                            </div>
                          </div>
                          <div className="text-right flex flex-col gap-1 items-end">
                            <span className="font-mono text-white text-xs font-bold">{res.date}</span>
                            <span className="px-2 py-0.5 rounded bg-primary-celeste/20 text-primary-celeste text-[9px] font-black uppercase tracking-wider">
                              Confirmada
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

            </main>

          </div>

        </div>

        {/* ORDER RECEIPT MODAL DRAWER OVERLAY */}
        {selectedOrderReceipt && (
          <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-slate-950 border border-slate-800 max-w-sm w-full rounded-3xl p-6 shadow-2xl flex flex-col gap-6 text-xs text-slate-300 font-sans animate-scale-up relative">
              <div className="flex justify-between items-center border-b border-slate-850 pb-3">
                <div>
                  <span className="text-[9px] text-primary-celeste font-black uppercase block">Comprobante POS</span>
                  <h3 className="text-sm font-extrabold text-white mt-0.5 uppercase font-mono">Recibo: {selectedOrderReceipt.id}</h3>
                </div>
                <button 
                  onClick={() => setSelectedOrderReceipt(null)}
                  className="p-1.5 hover:bg-slate-900 border border-slate-850 hover:border-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="flex flex-col gap-2.5 font-mono text-[10px]">
                <div className="flex justify-between">
                  <span className="text-slate-500">Fecha de compra:</span>
                  <span className="text-slate-300 font-bold">{selectedOrderReceipt.date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Inquilino SaaS:</span>
                  <span className="text-slate-300 font-bold">{activeTenant?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Estado de pago:</span>
                  <span className="text-green-400 font-extrabold uppercase">{selectedOrderReceipt.status}</span>
                </div>
                <div className="flex justify-between border-t border-slate-900 pt-2.5 mt-1 text-slate-400 uppercase font-black text-[9px]">
                  <span>Item</span>
                  <span className="text-right">Total</span>
                </div>
                {selectedOrderReceipt.items.map((it: any, idx: number) => (
                  <div key={idx} className="flex justify-between">
                    <span className="max-w-[70%] truncate">{it.name} (x{it.qty})</span>
                    <span className="text-white font-extrabold">${it.price.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-slate-900 pt-4 flex flex-col gap-3">
                <div className="flex justify-between text-base font-black text-white">
                  <span>Monto Total:</span>
                  <span>${selectedOrderReceipt.total.toFixed(2)}</span>
                </div>
                <button
                  onClick={() => {
                    alert('Imprimiendo recibo térmico...');
                    const printStr = `=================================\n${activeTenant?.name.toUpperCase()}\nRECIBO DE CAJA\n=================================\nPedido: ${selectedOrderReceipt.id}\nFecha: ${selectedOrderReceipt.date}\nEstado: ${selectedOrderReceipt.status}\n\nItem: ${selectedOrderReceipt.items[0].name}\nCant: ${selectedOrderReceipt.items[0].qty} | $${selectedOrderReceipt.items[0].price.toFixed(2)}\n\nTOTAL: $${selectedOrderReceipt.total.toFixed(2)}\n=================================\n¡Gracias por su compra!`;
                    const blob = new Blob([printStr], { type: 'text/plain;charset=utf-8' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `ticket_${selectedOrderReceipt.id}.txt`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  className="w-full py-2.5 bg-white text-slate-950 font-black rounded-xl text-[10px] text-center hover:bg-slate-100 transition-colors shadow"
                >
                  🖨 Imprimir Ticket Térmico
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    );
  };

  return (
    <div className="w-full min-h-screen bg-white relative">
      
      {/* Dynamic layout switch */}
      {slug === 'cursos' ? renderLMS() : slug === 'mi-cuenta' ? renderCustomerPortal() : <PageRenderer isEditor={false} />}

      {/* CLOUDFLARE EDGE TELEMETRY & ROUTING FOOTER DRAWER */}
      <div 
        className={`fixed bottom-0 left-0 right-0 z-50 bg-slate-950 text-slate-200 border-t border-slate-800 shadow-[0_-8px_30px_rgba(0,0,0,0.5)] transition-all duration-300 ${
          isTelemetryOpen ? 'h-[360px]' : 'h-11'
        }`}
      >
        {/* Toggle Bar / Header */}
        <div 
          onClick={() => setIsTelemetryOpen(prev => !prev)}
          className="h-11 px-6 bg-slate-900 hover:bg-slate-850 flex items-center justify-between cursor-pointer select-none border-b border-slate-800"
        >
          <div className="flex items-center gap-3">
            <Cpu className="w-4 h-4 text-primary-celeste animate-pulse" />
            <span className="font-extrabold text-[10px] uppercase tracking-wider text-white">⚡ Cloudflare Edge Telemetry & Routing</span>
            
            {/* Collapsed Pills */}
            {!isTelemetryOpen && (
              <div className="hidden md:flex items-center gap-2 pl-4 text-[9px] font-mono text-slate-400">
                <span className="px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800">Node: {diagnosticsMetric.nodeLocation.split(' ')[0]}</span>
                <span className={`px-1.5 py-0.5 rounded border ${
                  cacheStatus === 'HIT' ? 'bg-green-950/40 border-green-800 text-green-400' : 'bg-yellow-950/40 border-yellow-800 text-yellow-400'
                }`}>
                  Cache: {cacheStatus}
                </span>
                <span className="px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800">TLS: 1.3</span>
                <span className="px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-primary-celeste">TTFB: {diagnosticsMetric.execTime}ms</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-400">{isTelemetryOpen ? 'Ocultar consola' : 'Mostrar consola'}</span>
            {isTelemetryOpen ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
          </div>
        </div>

        {/* Console / Expanded Dashboard View */}
        {isTelemetryOpen && (
          <div className="p-6 h-[calc(360px-2.75rem)] grid grid-cols-1 md:grid-cols-2 gap-6 overflow-hidden">
            
            {/* Column 1: Diagnostics Config */}
            <div className="flex flex-col justify-between text-xs h-full">
              <div className="flex flex-col gap-3">
                <h4 className="font-extrabold text-[10px] uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Server className="w-3.5 h-3.5 text-primary-celeste" /> Parámetros de Enrutamiento Edge
                </h4>
                
                <div className="grid grid-cols-2 gap-y-2 gap-x-4 font-mono text-[11px] bg-slate-900/40 border border-slate-900 rounded-xl p-3.5">
                  <span className="text-slate-500">Ray ID:</span>
                  <span className="text-slate-300 font-bold truncate">{diagnosticsMetric.rayId}</span>
                  
                  <span className="text-slate-500">Ubicación Edge:</span>
                  <span className="text-slate-300 font-bold">{diagnosticsMetric.nodeLocation}</span>
                  
                  <span className="text-slate-500">IP Anycast Edge:</span>
                  <span className="text-slate-300 font-bold">{diagnosticsMetric.edgeIp}</span>
                  
                  <span className="text-slate-500">Cache Status:</span>
                  <span className={`font-black ${
                    cacheStatus === 'HIT' ? 'text-green-400' : cacheStatus === 'PURGING' ? 'text-amber-400 animate-pulse' : 'text-yellow-400'
                  }`}>
                    {cacheStatus}
                  </span>
                  
                  <span className="text-slate-500">SSL Protocol:</span>
                  <span className="text-slate-300 font-bold flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-green-400" /> TLS 1.3 / Let's Encrypt
                  </span>

                  <span className="text-slate-500">Estrategia Render:</span>
                  <span className="text-slate-300 font-bold text-primary-celeste">Incremental Static (ISR)</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 mt-4">
                <button
                  onClick={handlePurgeCache}
                  disabled={cacheStatus === 'PURGING'}
                  className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white font-extrabold rounded-xl text-[10px] flex items-center gap-1.5 transition-all"
                >
                  <RefreshCw className={`w-3 h-3 ${cacheStatus === 'PURGING' ? 'animate-spin' : ''}`} /> Purgar Edge Cache (Cloudflare)
                </button>
              </div>
            </div>

            {/* Column 2: API Request Terminal Console / CLI SDK Simulator */}
            <div className="flex flex-col gap-2.5 h-full">
              <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                <div className="flex gap-4">
                  <button
                    onClick={() => setConsoleTab('logger')}
                    className={`pb-1 text-[10px] font-black uppercase tracking-wider transition-all border-b-2 ${
                      consoleTab === 'logger'
                        ? 'border-primary-celeste text-white font-black'
                        : 'border-transparent text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    ⚡ API Request Logger
                  </button>
                  <button
                    onClick={() => setConsoleTab('cli')}
                    className={`pb-1 text-[10px] font-black uppercase tracking-wider transition-all border-b-2 ${
                      consoleTab === 'cli'
                        ? 'border-primary-celeste text-white font-black'
                        : 'border-transparent text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    🖥️ CLI SDK Simulator
                  </button>
                </div>

                {/* Simulated API click injectors (only show for logger) */}
                {consoleTab === 'logger' && (
                  <div className="flex gap-1">
                    <button
                      onClick={() => addSimulatedLog('medusa')}
                      className="px-2 py-0.5 border border-slate-800 hover:bg-slate-900 rounded text-[9px] font-bold text-slate-400"
                    >
                      + Medusa API
                    </button>
                    <button
                      onClick={() => addSimulatedLog('shopify')}
                      className="px-2 py-0.5 border border-slate-800 hover:bg-slate-900 rounded text-[9px] font-bold text-slate-400"
                    >
                      + Shopify API
                    </button>
                    <button
                      onClick={() => addSimulatedLog('klaviyo')}
                      className="px-2 py-0.5 border border-slate-800 hover:bg-slate-900 rounded text-[9px] font-bold text-slate-400"
                    >
                      + Webhook CRM
                    </button>
                  </div>
                )}
              </div>

              {consoleTab === 'logger' ? (
                /* Terminal Screen for Logger */
                <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-3 flex flex-col gap-1.5 overflow-y-auto h-48 font-mono text-[9px] text-slate-300 scrollbar-thin">
                  {logs.length === 0 ? (
                    <span className="text-slate-600 italic">No hay logs en la sesión actual de ruteo edge...</span>
                  ) : (
                    logs.map((log, idx) => {
                      const isErr = log.includes('404') || log.includes('error');
                      const isSuccess = log.includes('200 OK') || log.includes('201 Created');
                      const isPurge = log.includes('PURGE');
                      let color = 'text-slate-400';
                      if (isErr) color = 'text-red-400 font-bold';
                      else if (isSuccess) color = 'text-green-400';
                      else if (isPurge) color = 'text-amber-400 font-bold';
                      return (
                        <div key={idx} className={`${color} leading-relaxed break-all`}>
                          {log}
                        </div>
                      );
                    })
                  )}
                </div>
              ) : (
                /* CLI SDK Simulator terminal */
                <div className="flex flex-col gap-2 h-full justify-between">
                  <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-3 flex flex-col gap-1.5 overflow-y-auto h-36 font-mono text-[9px] text-slate-300 scrollbar-thin">
                    {cliHistory.map((line, idx) => {
                      let color = 'text-slate-400';
                      if (line.startsWith('nram-cli $')) color = 'text-primary-celeste font-bold';
                      else if (line.startsWith('✓')) color = 'text-green-400 font-bold';
                      else if (line.startsWith('⚙')) color = 'text-yellow-400 animate-pulse';
                      return (
                        <div key={idx} className={`${color} leading-relaxed break-all`}>
                          {line}
                        </div>
                      );
                    })}
                    <div ref={cliTerminalEndRef} />
                  </div>
                  
                  {/* CLI input form */}
                  <form onSubmit={handleCliSubmit} className="flex gap-2">
                    <span className="text-[10px] font-mono text-primary-celeste font-bold self-center">nram-cli $</span>
                    <input 
                      type="text"
                      placeholder="nram module create [nombre]..."
                      value={cliCommand}
                      onChange={e => setCliCommand(e.target.value)}
                      className="flex-grow bg-slate-950 border border-slate-800/85 rounded-lg px-2.5 py-1 text-[10px] text-white font-mono focus:outline-none focus:ring-1 focus:ring-primary-celeste"
                    />
                    <button 
                      type="submit" 
                      className="px-3 py-1 bg-primary-celeste text-slate-950 font-bold rounded-lg text-[10px] hover:bg-celeste-claro transition-all"
                    >
                      Ejecutar
                    </button>
                  </form>
                </div>
              )}
            </div>

          </div>
        )}
      </div>

    </div>
  );
}