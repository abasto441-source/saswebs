'use client';

import React, { useState, useEffect } from 'react';
import { dbAdapter, type Tenant, type Template } from '@/lib/supabase';
import TemplateBuilder from '../builder/TemplateBuilder';
import { 
  Users, Layers, Grid, CreditCard, Settings, QrCode, 
  Check, Play, Power, AlertTriangle, TrendingUp, Plus, Trash2,
  Server, Cpu, Database, Activity, FileText, Globe, Star, Terminal, Copy, Save
} from 'lucide-react';


export default function AdminPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [activeTenant, setActiveTenant] = useState<Tenant | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'tenants' | 'snippets' | 'themes' | 'billing' | 'settings' | 'pipeline' | 'marketplace' | 'partners' | 'licenses' | 'consumption'>('dashboard');
  
  // Resellers, Licenses, Consumption States
  const [partners, setPartners] = useState<any[]>([]);
  const [licenses, setLicenses] = useState<any[]>([]);
  const [newPartnerName, setNewPartnerName] = useState('');
  const [newPartnerEmail, setNewPartnerEmail] = useState('');
  const [newPartnerTier, setNewPartnerTier] = useState<'Bronze' | 'Silver' | 'Gold'>('Bronze');
  const [newLicensePartner, setNewLicensePartner] = useState('');
  const [newLicenseTenant, setNewLicenseTenant] = useState('');
  const [newLicensePlan, setNewLicensePlan] = useState('Enterprise');

  const [marketplaceExtensions, setMarketplaceExtensions] = useState([
    { id: 'ext-mercadopago', name: 'MercadoPago Gateway', developer: 'MercadoPago Inc.', desc: 'Pasarela de pagos de alto rendimiento para Latinoamérica.', category: 'Pagos', globallyListed: true },
    { id: 'ext-sendgrid', name: 'SMS SendGrid', developer: 'Twilio SendGrid', desc: 'Envío de notificaciones transaccionales SMS de pedidos y despachos.', category: 'Comunicaciones', globallyListed: true },
    { id: 'ext-crisp', name: 'Chat de Soporte Crisp', developer: 'Crisp IM', desc: 'Canal de chat en vivo y soporte al cliente directo en la tienda.', category: 'Soporte', globallyListed: false },
    { id: 'ext-hubspot', name: 'HubSpot CRM Sync', developer: 'HubSpot', desc: 'Sincronización automática de leads y contactos con HubSpot CRM.', category: 'Marketing', globallyListed: false }
  ]);
  
  // Form states for creating a new tenant
  const [name, setName] = useState('');
  const [subdomain, setSubdomain] = useState('');
  const [plan, setPlan] = useState<'Starter' | 'Pro' | 'Enterprise'>('Pro');
  const [moduleLms, setModuleLms] = useState(true);
  const [moduleEcommerce, setModuleEcommerce] = useState(true);
  const [modulePos, setModulePos] = useState(true);

  // Snippets list state
  const [snippets, setSnippets] = useState([
    { id: 'snip-1', name: 'Botón Flotante WhatsApp', type: 'conversion', active: true },
    { id: 'snip-2', name: 'Pixel de Conversión Facebook', type: 'analytics', active: true },
    { id: 'snip-3', name: 'Chat de Soporte Crisp', type: 'customer', active: false }
  ]);

  // Global templates marketplace
  const [globalTemplates, setGlobalTemplates] = useState<Template[]>([]);

  // Snippet inputs
  const [snippetName, setSnippetName] = useState('');
  const [snippetType, setSnippetType] = useState('conversion');

  // Figma Pipeline Simulation states
  const [isSerializing, setIsSerializing] = useState(false);
  const [serializedJson, setSerializedJson] = useState('');
  const [sqlStatement, setSqlStatement] = useState('');
  const [pipelineSuccess, setPipelineSuccess] = useState(false);

  // New template upload form states
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateCategory, setNewTemplateCategory] = useState<'education' | 'ecommerce' | 'services' | 'corporate' | 'restaurant'>('ecommerce');
  const [newTemplateIndustry, setNewTemplateIndustry] = useState('');
  const [newTemplateVersion, setNewTemplateVersion] = useState('1.0.0');
  const [newTemplatePremium, setNewTemplatePremium] = useState(false);
  const [newTemplatePreview, setNewTemplatePreview] = useState('');
  const [newTemplateJson, setNewTemplateJson] = useState('');
  const [newTemplateModules, setNewTemplateModules] = useState<string[]>([]);

  // Master Platform settings states
  const [wildcardDomain, setWildcardDomain] = useState('*.nram360.com');
  const [stripeConnectClientId, setStripeConnectClientId] = useState('ca_H360StripeConnectClientMasterX9');
  const [smtpServer, setSmtpServer] = useState('smtp.sendgrid.net');
  const [smtpPort, setSmtpPort] = useState('587');
  const [smtpUser, setSmtpUser] = useState('apikey');
  const [smtpPassword, setSmtpPassword] = useState('SG.MasterNRAM360Key123456');
  const [smtpFromEmail, setSmtpFromEmail] = useState('info@nram360.com');

  useEffect(() => {
    setTenants(dbAdapter.getTenants());
    setActiveTenant(dbAdapter.getActiveTenant());
    setGlobalTemplates(dbAdapter.getTemplates());
    setPartners(dbAdapter.getPartners());
    setLicenses(dbAdapter.getResellerLicenses());

    if (typeof window !== 'undefined') {
      const savedWildcard = localStorage.getItem('nram360_wildcard_domain');
      const savedStripeConnect = localStorage.getItem('nram360_stripe_connect_client_id');
      const savedSmtpServer = localStorage.getItem('nram360_smtp_server');
      const savedSmtpPort = localStorage.getItem('nram360_smtp_port');
      const savedSmtpUser = localStorage.getItem('nram360_smtp_user');
      const savedSmtpPassword = localStorage.getItem('nram360_smtp_password');
      const savedSmtpFrom = localStorage.getItem('nram360_smtp_from_email');
      
      if (savedWildcard) setWildcardDomain(savedWildcard);
      if (savedStripeConnect) setStripeConnectClientId(savedStripeConnect);
      if (savedSmtpServer) setSmtpServer(savedSmtpServer);
      if (savedSmtpPort) setSmtpPort(savedSmtpPort);
      if (savedSmtpUser) setSmtpUser(savedSmtpUser);
      if (savedSmtpPassword) setSmtpPassword(savedSmtpPassword);
      if (savedSmtpFrom) setSmtpFromEmail(savedSmtpFrom);
    }
  }, []);

  const handleSaveMasterSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof window !== 'undefined') {
      localStorage.setItem('nram360_wildcard_domain', wildcardDomain);
      localStorage.setItem('nram360_stripe_connect_client_id', stripeConnectClientId);
      localStorage.setItem('nram360_smtp_server', smtpServer);
      localStorage.setItem('nram360_smtp_port', smtpPort);
      localStorage.setItem('nram360_smtp_user', smtpUser);
      localStorage.setItem('nram360_smtp_password', smtpPassword);
      localStorage.setItem('nram360_smtp_from_email', smtpFromEmail);
      alert('Configuraciones maestras de la plataforma guardadas correctamente en la base de datos global del SaaS.');
    }
  };

  const handleUploadTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const parsed = JSON.parse(newTemplateJson);
      if (!Array.isArray(parsed)) {
        throw new Error('La estructura JSON debe ser un arreglo conteniendo bloques (Block[]).');
      }

      const newTpl: Template = {
        id: 'tpl-' + Date.now(),
        name: newTemplateName,
        category: newTemplateCategory,
        previewImage: newTemplatePreview || 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=500',
        industry: newTemplateIndustry || 'General',
        isPremium: newTemplatePremium,
        requiredModules: newTemplateModules,
        blocksIncluded: parsed.map((b: any) => b.type || 'unknown'),
        version: newTemplateVersion || '1.0.0',
        structureJson: JSON.stringify(parsed)
      };

      const updatedList = [...globalTemplates, newTpl];
      setGlobalTemplates(updatedList);
      dbAdapter.saveTemplates(updatedList);

      // Reset form
      setNewTemplateName('');
      setNewTemplateIndustry('');
      setNewTemplateVersion('1.0.0');
      setNewTemplatePremium(false);
      setNewTemplatePreview('');
      setNewTemplateJson('');
      setNewTemplateModules([]);

      alert(`Plantilla "${newTemplateName}" subida exitosamente y agregada al Marketplace.`);
    } catch (err: any) {
      alert('Error al procesar el JSON: ' + err.message);
    }
  };

  const handleRunPipeline = () => {
    setIsSerializing(true);
    setPipelineSuccess(false);
    setTimeout(() => {
      // Figma assembled blocks
      const blocks = [
        {
          id: 'b-figma-h',
          type: 'hero',
          version: '1.0.0',
          isVisible: true,
          styles: { padding: 'py-24', bgColor: '#bce6ed', textAlign: 'center', borderRadius: 'xl' },
          content: {
            title: 'Digitaliza tu Academia con Celeste LMS',
            subtitle: 'La infraestructura Odoo-style con CNAME dedicados y sincronización POS local.',
            buttonText: 'Empezar Auditoría',
            buttonLink: '#'
          }
        },
        {
          id: 'b-figma-f',
          type: 'columns_layout',
          version: '1.0.0',
          isVisible: true,
          styles: { padding: 'py-12', bgColor: '#ffffff' },
          content: {
            col1_title: 'Conexión CNAME',
            col1_text: 'Certificados TLS automáticos gestionados en Cloudflare.',
            col2_title: 'POS offline-first',
            col2_text: 'Transacciones guardadas en IndexedDB durante caídas de red.',
            col3_title: 'Cursos LMS',
            col3_text: 'Lecciones en video y progress tracking por estudiante.'
          }
        },
        {
          id: 'b-figma-ft',
          type: 'footer',
          version: '1.0.0',
          isVisible: true,
          styles: { padding: 'py-8', bgColor: '#111827' },
          content: {
            copyText: '© 2026 NRAM360 Corporativo. Todos los derechos reservados.'
          }
        }
      ];

      const jsonStr = JSON.stringify(blocks, null, 2);
      setSerializedJson(jsonStr);

      const sql = `INSERT INTO templates (id, name, category, preview_image, structure_json) \nVALUES ('tpl-figma', '🎨 Plantilla Figma Assembled', 'corporate', 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400', '${JSON.stringify(blocks)}');`;
      setSqlStatement(sql);

      // Save to dbAdapter
      const newTpl: Template = {
        id: 'tpl-figma',
        name: '🎨 Plantilla Figma Assembled (Paso 4)',
        category: 'corporate',
        previewImage: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400',
        industry: 'Figma Assembler Output',
        isPremium: false,
        requiredModules: [],
        blocksIncluded: ['hero', 'columns_layout', 'footer'],
        version: '1.0.0',
        structureJson: JSON.stringify(blocks)
      };

      const list = dbAdapter.getTemplates();
      const existingIdx = list.findIndex(t => t.id === 'tpl-figma');
      if (existingIdx >= 0) {
        list[existingIdx] = newTpl;
      } else {
        list.push(newTpl);
      }
      dbAdapter.saveTemplates(list);
      setGlobalTemplates(dbAdapter.getTemplates());

      setIsSerializing(false);
      setPipelineSuccess(true);
    }, 2000);
  };

  const handleImpersonate = (tenantId: string) => {
    dbAdapter.setActiveTenantId(tenantId);
    const updated = dbAdapter.getActiveTenant();
    setActiveTenant(updated);
    alert(`Impersonando a: ${updated.name}. Toda la sesión del ERP y tiendas reflejarán este inquilino.`);
  };

  const handleToggleTenantStatus = (tenantId: string) => {
    const updatedTenants = tenants.map(t => {
      if (t.id === tenantId) {
        const status = t.status === 'active' ? 'suspended' : 'active';
        return { ...t, status };
      }
      return t;
    }) as Tenant[];
    setTenants(updatedTenants);
    dbAdapter.saveTenants(updatedTenants);
    if (activeTenant?.id === tenantId) {
      setActiveTenant(dbAdapter.getActiveTenant());
    }
  };

  const handleCreateTenant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !subdomain) return;
    const newTenant: Tenant = {
      id: 't-' + Math.random().toString(36).substr(2, 9),
      name,
      subdomain: subdomain.toLowerCase().trim(),
      plan,
      status: 'active',
      isLmsEnabled: moduleLms,
      isEcommerceEnabled: moduleEcommerce,
      isPosEnabled: modulePos,
      isQrPaymentEnabled: true,
      isReservasEnabled: false,
      themeDarkMode: false,
      expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    };
    const list = [...tenants, newTenant];
    setTenants(list);
    dbAdapter.saveTenants(list);
    setName('');
    setSubdomain('');
  };

  const handleCreatePartner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPartnerName || !newPartnerEmail) return;
    const newPartner = {
      id: 'partner-' + Math.random().toString(36).substr(2, 9),
      name: newPartnerName,
      email: newPartnerEmail,
      tier: newPartnerTier,
      commissionRate: newPartnerTier === 'Gold' ? 0.3 : newPartnerTier === 'Silver' ? 0.2 : 0.1,
      createdAt: new Date().toISOString().split('T')[0]
    };
    const updated = [...partners, newPartner];
    setPartners(updated);
    dbAdapter.savePartners(updated);
    setNewPartnerName('');
    setNewPartnerEmail('');
    alert(`Socio/Reseller "${newPartner.name}" registrado con éxito.`);
  };

  const handleAssignLicense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLicensePartner || !newLicenseTenant) return;
    const newLicense = {
      id: 'lic-' + Math.random().toString(36).substr(2, 9),
      partnerId: newLicensePartner,
      tenantId: newLicenseTenant,
      planTier: newLicensePlan,
      seats: 5,
      isOem: true,
      status: 'active',
      issuedAt: new Date().toISOString().split('T')[0]
    };
    const updated = [...licenses, newLicense];
    setLicenses(updated);
    dbAdapter.saveResellerLicenses(updated);
    
    // Update tenant plan accordingly
    const updatedTenants = tenants.map(t => {
      if (t.id === newLicenseTenant) {
        return { ...t, plan: newLicensePlan as any };
      }
      return t;
    });
    setTenants(updatedTenants);
    dbAdapter.saveTenants(updatedTenants);

    alert(`Licencia OEM / Reseller asignada correctamente al Inquilino.`);
  };

  const handleAddSnippet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!snippetName) return;
    const newSnip = {
      id: 'snip-' + Date.now(),
      name: snippetName,
      type: snippetType,
      active: true
    };
    setSnippets([...snippets, newSnip]);
    setSnippetName('');
  };

  const getNavBtnClass = (tabKey: string) => {
    return `w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-sm font-bold transition-all ${
      activeTab === tabKey 
        ? 'bg-primary-celeste/20 text-cyan-900 font-extrabold border-l-2 border-primary-celeste shadow-xs' 
        : 'text-slate-600 hover:bg-slate-100/50 hover:text-slate-900'
    }`;
  };

  return (
    <div className="w-full min-h-[calc(100vh-3rem)] bg-gray-50 flex flex-col md:flex-row text-slate-800">
      
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-white text-slate-700 p-6 flex flex-col gap-6 shrink-0 border-r border-slate-200/80 shadow-lg">
        <div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Consola Superior</span>
          <span className="text-xl font-black text-slate-900 mt-1 block">Super Admin</span>
        </div>

        <nav className="flex flex-col gap-1">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={getNavBtnClass('dashboard')}
          >
            <TrendingUp className="w-4 h-4" /> Panel General (Dashboard)
          </button>
          <button 
            onClick={() => setActiveTab('tenants')}
            className={getNavBtnClass('tenants')}
          >
            <Users className="w-4 h-4" /> Inquilinos (Tenants)
          </button>
          <button 
            onClick={() => setActiveTab('snippets')}
            className={getNavBtnClass('snippets')}
          >
            <Layers className="w-4 h-4" /> Biblioteca Bloques
          </button>
          <button 
            onClick={() => setActiveTab('themes')}
            className={getNavBtnClass('themes')}
          >
            <Grid className="w-4 h-4" /> Temas Globales
          </button>
          <button 
            onClick={() => setActiveTab('billing')}
            className={getNavBtnClass('billing')}
          >
            <CreditCard className="w-4 h-4" /> Facturación y QR
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={getNavBtnClass('settings')}
          >
            <Settings className="w-4 h-4" /> Ajustes Plataforma
          </button>
          <button 
            onClick={() => setActiveTab('pipeline')}
            className={getNavBtnClass('pipeline')}
          >
            <Terminal className="w-4 h-4" /> Pipeline Figma → SaaS
          </button>
          <button 
            onClick={() => setActiveTab('marketplace')}
            className={getNavBtnClass('marketplace')}
          >
            <Grid className="w-4 h-4" /> Marketplace de Apps
          </button>
          
          <button 
            onClick={() => setActiveTab('partners')}
            className={getNavBtnClass('partners')}
          >
            <Users className="w-4 h-4 text-cyan-600" /> Resellers / Canales
          </button>

          <button 
            onClick={() => setActiveTab('licenses')}
            className={getNavBtnClass('licenses')}
          >
            <FileText className="w-4 h-4 text-primary-celeste" /> Licencias OEM / SaaS
          </button>

          <button 
            onClick={() => setActiveTab('consumption')}
            className={getNavBtnClass('consumption')}
          >
            <Activity className="w-4 h-4 text-red-500" /> Consumo Edge & Telemetría
          </button>
        </nav>

        {activeTenant && (
          <div className="mt-auto p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <span className="text-slate-500 block font-semibold mb-1">Inquilino Impersonado:</span>
            <span className="text-slate-900 font-extrabold block truncate">{activeTenant.name}</span>
            <span className="text-primary-celeste font-mono block mt-1">/{activeTenant.subdomain}</span>
            <button 
              onClick={() => {
                dbAdapter.setActiveTenantId('t-celeste');
                setActiveTenant(dbAdapter.getActiveTenant());
                alert('Sesión de soporte finalizada. Volviendo al inquilino por defecto.');
              }}
              className="mt-2.5 w-full py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[10px] font-black uppercase transition-all"
            >
              Terminar Soporte
            </button>
          </div>
        )}
      </aside>

      {/* Main Content Area */}
      <main className="flex-grow p-6 md:p-10 overflow-y-auto">
        
        {/* Banner Alert for Impersonation Mode */}
        {activeTenant && (
          <div className="mb-8 p-4 bg-celeste-claro/30 border border-primary-celeste rounded-2xl flex items-center justify-between text-slate-800">
            <div className="text-xs">
              <span className="font-extrabold text-sm block">Modo Soporte Técnico Activo</span>
              <span>Actualmente visualizas la plataforma con las configuraciones y catálogos de <strong>{activeTenant.name}</strong>.</span>
            </div>
            <span className="bg-primary-celeste text-slate-950 text-[10px] font-black uppercase px-2.5 py-1 rounded-full shadow">Impersonando</span>
          </div>
        )}

        {/* 0. PANEL GENERAL (DASHBOARD) TAB */}
        {activeTab === 'dashboard' && (
          <div className="flex flex-col gap-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-2xl font-black text-slate-900">Panel de Control SaaS</h2>
                <p className="text-sm text-slate-500">Métricas generales de suscripciones, hosting y servidores en producción.</p>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-full text-green-700 text-xs font-bold animate-pulse">
                <span className="w-2.5 h-2.5 bg-green-500 rounded-full"></span>
                Servidores Operativos 100%
              </div>
            </div>

            {/* Quick Metrics & SVG Graph */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 p-6 rounded-2xl bg-white border border-slate-200 shadow-md">
                <div className="flex justify-between items-center mb-6">
                  <span className="font-bold text-slate-800 text-sm">Ingresos Mensuales Recurrentes (MRR SaaS)</span>
                  <div className="flex items-center gap-1.5 text-xs text-green-500 font-bold">
                    <TrendingUp className="w-4 h-4" /> +14.2% este mes
                  </div>
                </div>
                {/* SVG MRR Trend Line Chart */}
                <div className="w-full h-40 bg-slate-50/50 rounded-xl relative overflow-hidden">
                  <svg className="w-full h-full p-2" viewBox="0 0 500 100" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="chart-grad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6ac4d7" stopOpacity="0.4"/>
                        <stop offset="100%" stopColor="#6ac4d7" stopOpacity="0.0"/>
                      </linearGradient>
                    </defs>
                    <path 
                      d="M0,80 Q75,60 150,70 T300,40 T450,20 L500,10 L500,100 L0,100 Z" 
                      fill="url(#chart-grad)"
                    />
                    <path 
                      d="M0,80 Q75,60 150,70 T300,40 T450,20 L500,10" 
                      fill="none" 
                      stroke="#6ac4d7" 
                      strokeWidth="3.5" 
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute bottom-2 left-4 text-[10px] text-slate-400 font-bold">Ene</div>
                  <div className="absolute bottom-2 left-1/4 text-[10px] text-slate-400 font-bold">Mar</div>
                  <div className="absolute bottom-2 left-2/4 text-[10px] text-slate-400 font-bold">May</div>
                  <div className="absolute bottom-2 right-4 text-[10px] text-slate-400 font-bold">Jun</div>
                </div>
              </div>

              {/* Quick Stats Panel */}
              <div className="p-6 rounded-2xl bg-slate-900 text-white flex flex-col justify-between shadow-xl">
                <div>
                  <span className="text-xs uppercase tracking-widest text-slate-400 font-bold">Estadísticas Totales</span>
                  <span className="text-5xl font-black block mt-2 text-primary-celeste">{tenants.length}</span>
                  <span className="text-xs text-slate-400 mt-1 block">Inquilinos comerciales registrados</span>
                </div>
                <div className="border-t border-slate-800 pt-4 mt-6 flex justify-between text-xs text-slate-300">
                  <div>
                    <span className="block font-semibold">Starter Plan:</span>
                    <span className="font-bold text-white text-sm">{tenants.filter(t => t.plan === 'Starter').length}</span>
                  </div>
                  <div>
                    <span className="block font-semibold">Pro Plan:</span>
                    <span className="font-bold text-white text-sm">{tenants.filter(t => t.plan === 'Pro').length}</span>
                  </div>
                  <div>
                    <span className="block font-semibold">Enterprise:</span>
                    <span className="font-bold text-white text-sm">{tenants.filter(t => t.plan === 'Enterprise').length}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Server Infrastructure Telemetry */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-md flex items-center gap-4">
                <div className="p-3 bg-celeste-claro/20 text-primary-celeste rounded-xl">
                  <Server className="w-6 h-6 animate-pulse" />
                </div>
                <div className="flex-grow">
                  <span className="text-[10px] text-slate-400 uppercase font-black block">Instancias Web Node</span>
                  <span className="text-lg font-black text-slate-900">3 Activas</span>
                  <span className="text-[9px] text-green-600 block font-semibold mt-0.5">Autoscaling Habilitado</span>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-md flex items-center gap-4">
                <div className="p-3 bg-celeste-claro/20 text-primary-celeste rounded-xl">
                  <Cpu className="w-6 h-6" />
                </div>
                <div className="flex-grow">
                  <span className="text-[10px] text-slate-400 uppercase font-black block">Carga de Servidores</span>
                  <span className="text-lg font-black text-slate-900">CPU 14% | RAM 4.2GB</span>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 mt-1">
                    <div className="bg-primary-celeste h-1.5 rounded-full" style={{ width: '42%' }}></div>
                  </div>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-md flex items-center gap-4">
                <div className="p-3 bg-celeste-claro/20 text-primary-celeste rounded-xl">
                  <Globe className="w-6 h-6" />
                </div>
                <div className="flex-grow">
                  <span className="text-[10px] text-slate-400 uppercase font-black block">Dominios SSL CNAME</span>
                  <span className="text-lg font-black text-slate-900">Activo (Let's Encrypt)</span>
                  <span className="text-[9px] text-slate-400 block font-semibold mt-0.5">Cloudflare Edge SSL</span>
                </div>
              </div>
            </div>

            {/* Platform Activity Logs Terminal */}
            <div className="p-6 rounded-2xl bg-slate-950 text-slate-300 font-mono text-xs shadow-2xl border border-slate-800">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-red-500"></span>
                  <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
                  <span className="w-3 h-3 rounded-full bg-green-500"></span>
                  <span className="text-slate-500 font-bold ml-2">syslog_listener_daemon ~ nram360</span>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-slate-500">
                  <Activity className="w-3 h-3 animate-pulse text-primary-celeste" /> LIVE FEED
                </div>
              </div>

              <div className="flex flex-col gap-2.5 max-h-52 overflow-y-auto pr-2">
                {[
                  { time: '23:08:14', event: 'Sincronización POS offline procesada desde IndexedDB -> tecnobo [OK]', status: 'success', color: 'text-green-400' },
                  { time: '22:45:30', event: 'Comprobante de pago por QR aprobado para renovación: academia.celeste.com', status: 'success', color: 'text-green-400' },
                  { time: '21:12:05', event: 'Generando nuevo certificado TLS comodín para *.nram360.com', status: 'info', color: 'text-sky-400' },
                  { time: '19:30:11', event: 'Nuevo inquilino registrado con plan Pro: Ventas de Tecnología TecnoBo', status: 'info', color: 'text-sky-400' },
                  { time: '18:15:42', event: 'Publicación de bloque global en biblioteca: WhatsApp Float Button', status: 'warning', color: 'text-yellow-400' },
                  { time: '16:00:00', event: 'Autoscaler de Cloud VPS levantó instancia Nodo-B en región central [OK]', status: 'success', color: 'text-green-400' }
                ].map((log, idx) => (
                  <div key={idx} className="flex items-start gap-3 hover:bg-slate-900/50 p-1 rounded transition-colors">
                    <span className="text-slate-600">[{log.time}]</span>
                    <span className={log.color}>{log.event}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* 1. GESTION DE INQUILINOS TAB */}
        {activeTab === 'tenants' && (
          <div className="flex flex-col gap-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-2xl font-black text-slate-900">Gestión de Inquilinos</h2>
                <p className="text-sm text-slate-500">Registra, activa, suspende y da soporte impersonando a tus inquilinos registrados.</p>
              </div>
            </div>

            {/* Impersonator Table */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-md">
              <span className="font-bold text-slate-800 block mb-4">Directorio de Clientes / Impersonar</span>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 uppercase font-bold text-[10px]">
                      <th className="py-3 px-2">Empresa / Tenant</th>
                      <th className="py-3 px-2">Plan</th>
                      <th className="py-3 px-2">Dominio CNAME</th>
                      <th className="py-3 px-2">Estado</th>
                      <th className="py-3 px-2">Vencimiento</th>
                      <th className="py-3 px-2 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tenants.map(t => (
                      <tr key={t.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                        <td className="py-3.5 px-2">
                          <span className="font-bold block text-slate-900">{t.name}</span>
                          <span className="font-mono text-gray-400">/{t.subdomain}</span>
                        </td>
                        <td className="py-3.5 px-2 font-semibold">{t.plan}</td>
                        <td className="py-3.5 px-2 font-mono text-slate-500">{t.customDomain || 'No configurado'}</td>
                        <td className="py-3.5 px-2">
                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase ${t.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {t.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-2 text-slate-500 font-bold">{t.expirationDate}</td>
                        <td className="py-3.5 px-2 text-right flex items-center justify-end gap-2">
                          <button 
                            onClick={() => handleToggleTenantStatus(t.id)}
                            className={`p-1.5 rounded-lg border transition-colors ${t.status === 'active' ? 'border-red-200 text-red-600 hover:bg-red-50' : 'border-green-200 text-green-600 hover:bg-green-50'}`}
                            title={t.status === 'active' ? 'Suspender inquilino' : 'Activar inquilino'}
                          >
                            <Power className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => handleImpersonate(t.id)}
                            className="px-3 py-1.5 bg-slate-900 text-white font-bold rounded-lg hover:bg-primary-celeste hover:text-slate-950 transition-colors flex items-center gap-1"
                          >
                            <Play className="w-3 h-3 fill-current" /> Impersonar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Register New Tenant Form */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-md">
              <span className="font-bold text-slate-800 block mb-4">Registrar Nuevo Inquilino (SaaS)</span>
              <form onSubmit={handleCreateTenant} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Nombre Comercial</label>
                  <input 
                    required 
                    type="text" 
                    placeholder="Ej. Boutique de Ropa"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl bg-transparent focus:ring-1 focus:ring-primary-celeste" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Subdominio</label>
                  <input 
                    required 
                    type="text" 
                    placeholder="ej-tienda"
                    value={subdomain}
                    onChange={(e) => setSubdomain(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl bg-transparent focus:ring-1 focus:ring-primary-celeste font-mono" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Plan</label>
                  <select 
                    value={plan}
                    onChange={(e) => setPlan(e.target.value as any)}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl bg-transparent focus:ring-1 focus:ring-primary-celeste"
                  >
                    <option value="Starter">Starter Plan ($19/mes)</option>
                    <option value="Pro">Pro Plan ($49/mes)</option>
                    <option value="Enterprise">Enterprise ($99/mes)</option>
                  </select>
                </div>
                <div className="md:col-span-3 flex items-center justify-between border-t border-slate-100 pt-4">
                  <div className="flex gap-6 text-xs font-bold">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={moduleLms} onChange={(e) => setModuleLms(e.target.checked)} className="rounded text-primary-celeste focus:ring-0" /> LMS Academia
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={moduleEcommerce} onChange={(e) => setModuleEcommerce(e.target.checked)} className="rounded text-primary-celeste focus:ring-0" /> Ecommerce
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={modulePos} onChange={(e) => setModulePos(e.target.checked)} className="rounded text-primary-celeste focus:ring-0" /> POS Caja
                    </label>
                  </div>
                  <button type="submit" className="px-6 py-2.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-primary-celeste hover:text-slate-950 transition-colors flex items-center gap-2">
                    <Plus className="w-4 h-4" /> Crear Inquilino
                  </button>
                </div>
              </form>
            </div>

          </div>
        )}

        {/* 2. BIBLIOTECA DE BLOQUES (SNIPPETS) TAB */}
        {activeTab === 'snippets' && (
          <div className="flex flex-col gap-6">
            <div>
              <h2 className="text-2xl font-black text-slate-900">Biblioteca de Bloques (Snippets Globales)</h2>
              <p className="text-sm text-slate-500">Habilita widgets que estarán disponibles en la barra lateral para todos los inquilinos.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {snippets.map((snip) => (
                <div key={snip.id} className="p-5 border border-slate-200 rounded-2xl bg-white shadow flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <span className="px-2.5 py-0.5 bg-celeste-claro/30 text-primary-celeste rounded text-[10px] font-black uppercase tracking-wider">{snip.type}</span>
                      <span className={`w-2 h-2 rounded-full ${snip.active ? 'bg-green-500' : 'bg-red-400'}`}></span>
                    </div>
                    <h4 className="font-extrabold text-slate-900 leading-snug">{snip.name}</h4>
                  </div>
                  <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-100 text-xs">
                    <button 
                      onClick={() => {
                        setSnippets(snippets.map(s => s.id === snip.id ? { ...s, active: !s.active } : s));
                      }}
                      className={`px-3 py-1 rounded font-bold transition-all ${snip.active ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}
                    >
                      {snip.active ? 'Desactivar' : 'Activar'}
                    </button>
                    <button 
                      onClick={() => setSnippets(snippets.filter(s => s.id !== snip.id))}
                      className="text-slate-400 hover:text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add snippet form */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-md">
              <span className="font-bold text-slate-800 block mb-4">Registrar Nuevo Snippet Global</span>
              <form onSubmit={handleAddSnippet} className="flex flex-col sm:flex-row gap-4">
                <input 
                  required 
                  type="text" 
                  placeholder="Ej. Float Button Whatsapp Chat"
                  value={snippetName}
                  onChange={(e) => setSnippetName(e.target.value)}
                  className="flex-grow px-4 py-2 border border-slate-200 rounded-xl bg-transparent focus:ring-1 focus:ring-primary-celeste text-xs" 
                />
                <select 
                  value={snippetType}
                  onChange={(e) => setSnippetType(e.target.value)}
                  className="px-4 py-2 border border-slate-200 rounded-xl bg-transparent focus:ring-1 focus:ring-primary-celeste text-xs"
                >
                  <option value="conversion">Conversión/Marketing</option>
                  <option value="analytics">Métricas/Pixel</option>
                  <option value="customer">Servicio al Cliente</option>
                </select>
                <button type="submit" className="px-6 py-2.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-primary-celeste hover:text-slate-950 transition-colors">
                  Agregar Bloque
                </button>
              </form>
            </div>
          </div>
        )}

        {/* 3. TEMAS GLOBALES TAB (TEMPLATES MARKETPLACE) */}
        {activeTab === 'themes' && (
          <div className="flex flex-col gap-8 text-slate-800">
            <div>
              <h2 className="text-2xl font-black text-slate-900">Marketplace de Plantillas (Blueprints Globales)</h2>
              <p className="text-sm text-slate-500">Registra y monetiza los planos maestros JSON y publica bloques premium para todos los inquilinos.</p>
            </div>

            {/* Global templates registry list */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {globalTemplates.map((tpl) => (
                <div key={tpl.id} className="border border-slate-200 rounded-3xl overflow-hidden bg-white shadow-lg flex flex-col justify-between group">
                  <div className="relative h-44 bg-slate-100 overflow-hidden border-b border-slate-100">
                    <img src={tpl.previewImage} alt={tpl.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    <div className="absolute top-3 left-3 bg-slate-900/80 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded">
                      {tpl.category}
                    </div>
                    {tpl.isPremium && (
                      <div className="absolute top-3 right-3 bg-yellow-500 text-slate-950 text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full shadow flex items-center gap-1">
                        <Star className="w-3 h-3 fill-current" /> Premium
                      </div>
                    )}
                  </div>
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-sm">{tpl.name}</h4>
                        <span className="text-[10px] text-gray-400 font-bold block mt-0.5">Categoría: {tpl.industry}</span>
                      </div>
                      <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono font-bold">v{tpl.version}</span>
                    </div>

                    <div className="border-t border-slate-100 pt-3 mt-4 flex flex-col gap-2">
                      <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider block">Módulos requeridos:</span>
                      <div className="flex flex-wrap gap-1">
                        {tpl.requiredModules.map((mod, i) => (
                          <span key={i} className="px-2 py-0.5 bg-red-50 border border-red-100 text-red-700 rounded text-[9px] font-bold">
                            {mod === 'isLmsEnabled' ? 'Academia LMS' : mod === 'isEcommerceEnabled' ? 'E-Commerce' : 'POS'}
                          </span>
                        ))}
                        {tpl.requiredModules.length === 0 && (
                          <span className="text-[9px] text-slate-400 font-bold">Sin dependencias</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100 text-xs">
                      <button 
                        onClick={() => {
                          const updated = globalTemplates.map(t => t.id === tpl.id ? { ...t, isPremium: !t.isPremium } : t);
                          setGlobalTemplates(updated);
                          dbAdapter.saveTemplates(updated);
                        }}
                        className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                          tpl.isPremium 
                            ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' 
                            : 'bg-yellow-50 text-yellow-800 border border-yellow-200 hover:bg-yellow-100'
                        }`}
                      >
                        {tpl.isPremium ? 'Convertir a Gratis' : 'Marcar como Premium'}
                      </button>
                      <button 
                        onClick={() => {
                          const updated = globalTemplates.filter(t => t.id !== tpl.id);
                          setGlobalTemplates(updated);
                          dbAdapter.saveTemplates(updated);
                        }}
                        className="text-slate-400 hover:text-red-500 flex items-center gap-1 font-bold"
                      >
                        <Trash2 className="w-4 h-4" /> Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Global block templates publisher panel */}
            <div className="p-6 rounded-3xl bg-slate-900 text-white shadow-xl flex flex-col gap-4">
              <div>
                <span className="text-[10px] text-primary-celeste font-black uppercase tracking-widest block">Editor de Bloques Globales</span>
                <h3 className="text-lg font-black mt-1">Biblioteca de Componentes Premium (Herencia)</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Crea bloques globales maestros. Al guardarlos, estarán disponibles de forma inmediata en la barra lateral del constructor visual de todos los inquilinos.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { name: 'Hero Banner Premium Black', type: 'hero', version: '2.4.0', status: 'Publicado' },
                  { name: 'Pie de Página Corp Dark', type: 'footer', version: '1.2.0', status: 'Publicado' },
                  { name: 'WhatsApp Floating Chat Badge', type: 'contact_form', version: '1.0.5', status: 'En revisión' }
                ].map((item, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-slate-800 border border-slate-700 flex justify-between items-center text-xs">
                    <div>
                      <span className="font-extrabold text-white block">{item.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono block mt-1">Tipo: {item.type} | v{item.version}</span>
                    </div>
                    <span className="px-2 py-0.5 bg-green-500/20 text-green-400 rounded text-[9px] font-black uppercase">{item.status}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Upload Template Form */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-md flex flex-col gap-4">
              <div>
                <span className="text-[10px] text-primary-celeste font-black uppercase tracking-widest block">Subir Nueva Plantilla</span>
                <h3 className="text-lg font-black text-slate-900 mt-1">Registrar Plano Maestro JSON (Blueprint)</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Carga una plantilla personalizada en formato JSON. Se clonará automáticamente para los inquilinos cuando la seleccionen.
                </p>
              </div>

              <form onSubmit={handleUploadTemplate} className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-semibold">
                <div>
                  <label className="block text-[10px] text-gray-400 mb-1">Nombre de la Plantilla</label>
                  <input 
                    required 
                    type="text" 
                    placeholder="Ej. Moda Minimalista"
                    value={newTemplateName}
                    onChange={(e) => setNewTemplateName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-transparent"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-400 mb-1">Categoría Principal</label>
                  <select 
                    value={newTemplateCategory}
                    onChange={(e) => setNewTemplateCategory(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white"
                  >
                    <option value="ecommerce">Ecommerce</option>
                    <option value="education">Educación / LMS</option>
                    <option value="services">Servicios</option>
                    <option value="corporate">Corporativo</option>
                    <option value="restaurant">Restaurante</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-gray-400 mb-1">Industria / Enfoque</label>
                  <input 
                    required 
                    type="text" 
                    placeholder="Ej. Moda y Accesorios"
                    value={newTemplateIndustry}
                    onChange={(e) => setNewTemplateIndustry(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-transparent"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-400 mb-1">Versión</label>
                  <input 
                    required 
                    type="text" 
                    placeholder="1.0.0"
                    value={newTemplateVersion}
                    onChange={(e) => setNewTemplateVersion(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-transparent font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-400 mb-1">URL Miniatura (Preview)</label>
                  <input 
                    type="text" 
                    placeholder="https://..."
                    value={newTemplatePreview}
                    onChange={(e) => setNewTemplatePreview(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-transparent"
                  />
                </div>
                <div className="flex items-center gap-4 pt-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={newTemplatePremium} 
                      onChange={(e) => setNewTemplatePremium(e.target.checked)}
                      className="rounded text-primary-celeste focus:ring-0" 
                    />
                    <span>Es Premium (Pro)</span>
                  </label>
                </div>

                <div className="md:col-span-3">
                  <label className="block text-[10px] text-gray-400 mb-1">Módulos Requeridos (Dependencias)</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={newTemplateModules.includes('isEcommerceEnabled')}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewTemplateModules([...newTemplateModules, 'isEcommerceEnabled']);
                          } else {
                            setNewTemplateModules(newTemplateModules.filter(m => m !== 'isEcommerceEnabled'));
                          }
                        }}
                        className="rounded text-primary-celeste focus:ring-0" 
                      />
                      <span>Ecommerce</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={newTemplateModules.includes('isLmsEnabled')}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewTemplateModules([...newTemplateModules, 'isLmsEnabled']);
                          } else {
                            setNewTemplateModules(newTemplateModules.filter(m => m !== 'isLmsEnabled'));
                          }
                        }}
                        className="rounded text-primary-celeste focus:ring-0" 
                      />
                      <span>LMS Cursos</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={newTemplateModules.includes('isPosEnabled')}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewTemplateModules([...newTemplateModules, 'isPosEnabled']);
                          } else {
                            setNewTemplateModules(newTemplateModules.filter(m => m !== 'isPosEnabled'));
                          }
                        }}
                        className="rounded text-primary-celeste focus:ring-0" 
                      />
                      <span>POS Caja</span>
                    </label>
                  </div>
                </div>

                <div className="md:col-span-3">
                  <label className="block text-[10px] text-gray-400 mb-1">Estructura JSON (Block[])</label>
                  <textarea 
                    required 
                    rows={6}
                    placeholder='[{"type": "hero", "content": {"title": "Hola"}}, ...]'
                    value={newTemplateJson}
                    onChange={(e) => setNewTemplateJson(e.target.value)}
                    className="w-full p-3 border border-slate-200 rounded-xl bg-transparent font-mono text-[11px]"
                  />
                </div>

                <button 
                  type="submit" 
                  className="md:col-span-3 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-primary-celeste hover:text-slate-950 transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4 text-primary-celeste" /> Cargar Plantilla al Sistema
                </button>
              </form>
            </div>

            {/* Global Asset Library */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-md flex flex-col gap-4">
              <div>
                <span className="text-[10px] text-primary-celeste font-black uppercase tracking-widest block">Biblioteca Global de Recursos</span>
                <h3 className="text-lg font-black text-slate-900 mt-1">Imágenes y Activos para Plantillas</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Usa estas URLs de imágenes de prueba para diseñar y asociar activos dentro de tus estructuras JSON.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {[
                  { name: 'Moda Minimalista (Hero)', url: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800' },
                  { name: 'Academia Digital (Hero)', url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800' },
                  { name: 'Bistró Gourmet (Chef)', url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800' },
                  { name: 'Dispositivos POS (Hardware)', url: 'https://images.unsplash.com/photo-1556742044-3c52d6e88c62?w=800' },
                  { name: 'Estudiante Online (LMS)', url: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800' },
                  { name: 'Consultoría ERP (Oficina)', url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800' }
                ].map((asset, idx) => (
                  <div key={idx} className="p-3 border border-slate-100 rounded-2xl bg-slate-50/50 flex flex-col justify-between gap-3 text-center">
                    <img src={asset.url} alt={asset.name} className="w-full h-20 object-cover rounded-xl border border-slate-200" />
                    <div>
                      <span className="font-extrabold text-[10px] text-slate-900 block truncate">{asset.name}</span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(asset.url);
                          alert('URL copiada al portapapeles.');
                        }}
                        className="mt-2 py-1 px-3 bg-white border border-slate-200 rounded-lg text-[9px] font-bold hover:bg-slate-100 flex items-center justify-center gap-1 mx-auto"
                      >
                        <Copy className="w-3 h-3 text-primary-celeste" /> Copiar URL
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* 4. BILLING AND QR PAYMENTS TAB */}
        {activeTab === 'billing' && (
          <div className="flex flex-col gap-6">
            <div>
              <h2 className="text-2xl font-black text-slate-900">Módulo de Facturación y Cobros por QR</h2>
              <p className="text-sm text-slate-500">Manejo de suscripciones locales a través de códigos QR manuales.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Bank accounts logs for SaaS subscription */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-md flex flex-col gap-4">
                <span className="font-extrabold text-sm text-slate-800">Cuentas Bancarias de Suscripción QR</span>
                <p className="text-xs text-slate-500">Muestra los bancos autorizados a los inquilinos cuando ingresan a renovar su membresía.</p>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <div className="p-4 border border-slate-100 rounded-xl text-center font-bold text-xs bg-slate-50">BCP Bolivia</div>
                  <div className="p-4 border border-slate-100 rounded-xl text-center font-bold text-xs bg-slate-50">Banco Unión</div>
                  <div className="p-4 border border-slate-100 rounded-xl text-center font-bold text-xs bg-slate-50">Banco Nacional (BNB)</div>
                  <div className="p-4 border border-slate-100 rounded-xl text-center font-bold text-xs bg-slate-50">Tigo Money QR</div>
                </div>
              </div>

              {/* Upload verification simulation */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-md flex flex-col gap-3">
                <span className="font-extrabold text-sm text-slate-800">Simulación del Transmisor QR</span>
                <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 text-slate-400">
                  <QrCode className="w-12 h-12 text-primary-celeste mb-2 animate-bounce" />
                  <span className="font-bold text-xs text-slate-800">Cargar Comprobante QR</span>
                  <span className="text-[10px] text-slate-400 mt-1">Sube imagen del comprobante de transferencia bancaria</span>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* 5. SETTINGS TAB */}
        {activeTab === 'settings' && (
          <form onSubmit={handleSaveMasterSettings} className="p-6 rounded-3xl bg-white border border-slate-200 shadow-md flex flex-col gap-6 text-slate-800">
            <div>
              <span className="text-[10px] text-primary-celeste font-black uppercase tracking-widest block font-bold">Consola de Control de Servidor</span>
              <h2 className="text-xl font-black text-slate-900 mt-1">Configuraciones de la Plataforma SaaS (Master)</h2>
              <p className="text-xs text-slate-500 mt-1">Define los dominios base, configura las claves maestras globales de las APIs y los correos transaccionales del SaaS.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-semibold">
              {/* DNS parameters */}
              <div className="p-4 border border-slate-100 rounded-2xl bg-slate-50/50 flex flex-col gap-3">
                <span className="font-extrabold text-slate-900 flex items-center gap-1.5"><Globe className="w-4 h-4 text-primary-celeste" /> Configuración DNS & SSL Comodín</span>
                
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-slate-400">Wildcard Subdomain Base</label>
                  <input 
                    required 
                    type="text" 
                    value={wildcardDomain} 
                    onChange={(e) => setWildcardDomain(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 bg-white rounded-lg font-mono text-[10px]" 
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-slate-400">Let's Encrypt SSL Gateway</label>
                  <input 
                    readOnly 
                    type="text" 
                    value="Automatic (Managed by Cloudflare SaaS Wildcard API)" 
                    className="w-full px-3 py-2 border border-slate-100 bg-slate-100 rounded-lg text-slate-400 font-mono text-[10px]" 
                  />
                </div>
              </div>

              {/* Master Stripe Connect keys */}
              <div className="p-4 border border-slate-100 rounded-2xl bg-slate-50/50 flex flex-col gap-3">
                <span className="font-extrabold text-slate-900 flex items-center gap-1.5"><CreditCard className="w-4 h-4 text-primary-celeste" /> Claves Maestras Stripe Connect</span>
                
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-slate-400">Stripe Connect Global Client ID</label>
                  <input 
                    required 
                    type="text" 
                    value={stripeConnectClientId} 
                    onChange={(e) => setStripeConnectClientId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 bg-white rounded-lg font-mono text-[10px]" 
                  />
                </div>
                <span className="text-[10px] text-slate-400 leading-normal block">Permite a los inquilinos cobrar mediante Stripe Connect cobrando una comisión de plataforma (revendedor SaaS).</span>
              </div>

              {/* Global SMTP settings */}
              <div className="p-4 border border-slate-100 rounded-2xl bg-slate-50/50 flex flex-col gap-4 md:col-span-2">
                <span className="font-extrabold text-slate-900 flex items-center gap-1.5"><FileText className="w-4 h-4 text-primary-celeste" /> Configuración de Correos Transaccionales (SMTP Global)</span>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-slate-400">Servidor SMTP</label>
                    <input 
                      required 
                      type="text" 
                      placeholder="smtp.mailgun.org"
                      value={smtpServer} 
                      onChange={(e) => setSmtpServer(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 bg-white rounded-lg font-mono text-[10px]" 
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-slate-400">Puerto SMTP</label>
                    <input 
                      required 
                      type="text" 
                      placeholder="587"
                      value={smtpPort} 
                      onChange={(e) => setSmtpPort(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 bg-white rounded-lg font-mono text-[10px]" 
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-slate-400">Remitente Global (From Email)</label>
                    <input 
                      required 
                      type="email" 
                      placeholder="no-reply@nram360.com"
                      value={smtpFromEmail} 
                      onChange={(e) => setSmtpFromEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 bg-white rounded-lg font-mono text-[10px]" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-slate-400">Usuario SMTP / API Key</label>
                    <input 
                      required 
                      type="text" 
                      placeholder="postmaster@..."
                      value={smtpUser} 
                      onChange={(e) => setSmtpUser(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 bg-white rounded-lg font-mono text-[10px]" 
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-slate-400">Contraseña SMTP</label>
                    <input 
                      required 
                      type="password" 
                      placeholder="••••••••••••••••"
                      value={smtpPassword} 
                      onChange={(e) => setSmtpPassword(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 bg-white rounded-lg font-mono text-[10px]" 
                    />
                  </div>
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              className="py-3 px-6 bg-slate-900 text-white rounded-xl font-bold hover:bg-primary-celeste hover:text-slate-950 transition-colors w-fit flex items-center gap-2"
            >
              <Save className="w-4 h-4 text-primary-celeste" /> Guardar Configuraciones Maestras
            </button>
          </form>
        )}

        {/* 6. FIGMA TO SUPABASE PIPELINE TAB */}
        {activeTab === 'pipeline' && (
          <div className="flex flex-col gap-8 text-slate-800">
            <div>
              <h2 className="text-2xl font-black text-slate-900">Pipeline de Producción: Figma → Supabase</h2>
              <p className="text-sm text-slate-500">Demostración interactiva de serialización JSON y despliegue del Ensamblador.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Assembler representation */}
              <div className="flex flex-col gap-4">
                <span className="text-xs font-black text-slate-400 uppercase tracking-wider block">1. Componente Ensamblador (React Component)</span>
                <TemplateBuilder />
              </div>

              {/* Serializer control console */}
              <div className="flex flex-col gap-6 bg-white border border-slate-200 rounded-3xl p-6 shadow-md">
                <div>
                  <span className="text-[10px] text-primary-celeste font-black uppercase tracking-widest block">Herramienta de Serialización</span>
                  <h3 className="text-lg font-black text-slate-900 mt-1">Extractor Node.js a Supabase</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Extrae el árbol de componentes del Ensamblador (`TemplateBuilder.tsx`), lo convierte en el esquema JSON de 4 capas y lo inyecta directamente en Supabase.
                  </p>
                </div>

                <div className="flex flex-col gap-4 text-xs font-semibold">
                  <button 
                    onClick={handleRunPipeline}
                    disabled={isSerializing}
                    className="w-full py-3.5 bg-slate-900 hover:bg-primary-celeste hover:text-slate-950 text-white font-extrabold rounded-xl shadow-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Terminal className="w-4 h-4 text-primary-celeste" /> 
                    {isSerializing ? 'Ejecutando Serializador...' : 'Ejecutar Serialización y Cargar a Supabase'}
                  </button>

                  {isSerializing && (
                    <div className="p-4 bg-slate-950 text-slate-300 font-mono text-[10px] rounded-xl border border-slate-800 flex flex-col gap-1.5 animate-pulse">
                      <span className="text-green-400 font-bold">$ node serializeTemplate.js</span>
                      <span>[INFO] Leyendo archivo: src/app/builder/TemplateBuilder.tsx</span>
                      <span>[INFO] Parseando componentes: FigmaHero, FigmaFeatures, FigmaFooter...</span>
                      <span>[INFO] Extrayendo contenidos y estilos de Figma tokens...</span>
                    </div>
                  )}

                  {pipelineSuccess && (
                    <div className="flex flex-col gap-4 animate-fade-in">
                      {/* JSON output block */}
                      <div>
                        <label className="block text-[10px] text-gray-400 mb-1">JSON Serializado Extraído</label>
                        <pre className="p-4 bg-slate-950 text-sky-400 font-mono text-[9px] rounded-xl overflow-x-auto max-h-52 border border-slate-800">
                          {serializedJson}
                        </pre>
                      </div>

                      {/* SQL query block */}
                      <div>
                        <label className="block text-[10px] text-gray-400 mb-1">SQL Migration Injected</label>
                        <pre className="p-4 bg-slate-900 text-yellow-400 font-mono text-[9px] rounded-xl overflow-x-auto max-h-32 border border-slate-800 font-bold">
                          {sqlStatement}
                        </pre>
                      </div>

                      <div className="p-4 bg-green-50 border border-green-200 text-green-800 rounded-xl flex items-center gap-2">
                        <Check className="w-5 h-5 shrink-0 text-green-600" />
                        <div>
                          <span className="font-extrabold block">¡Template cargado en Supabase!</span>
                          <span>La plantilla "🎨 Plantilla Figma Assembled (Paso 4)" ya está disponible en el Carrusel del Constructor de Sitios.</span>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              </div>

            </div>
          </div>
        )}

        {activeTab === 'marketplace' && (
          <div className="flex flex-col gap-8 text-slate-800">
            <div>
              <h2 className="text-2xl font-black text-slate-900">Third-Party Extension & Themes Marketplace</h2>
              <p className="text-sm text-slate-500">Publica, lista o deslista integraciones desarrolladas por la comunidad y socios del SaaS.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {marketplaceExtensions.map((ext) => (
                <div key={ext.id} className="p-6 bg-white border border-slate-200 rounded-3xl shadow-lg flex flex-col justify-between gap-5 relative">
                  <div>
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="px-2.5 py-0.5 bg-celeste-claro/20 text-primary-celeste rounded text-[10px] font-black uppercase tracking-wider">{ext.category}</span>
                        <h4 className="font-extrabold text-slate-900 text-sm mt-2">{ext.name}</h4>
                        <span className="text-[10px] text-gray-400 font-bold block mt-0.5">Autor: {ext.developer}</span>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                        ext.globallyListed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {ext.globallyListed ? 'Listado Global' : 'Deslistado'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-4 leading-relaxed font-medium">{ext.desc}</p>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-2">
                    <span className="text-[10px] text-slate-400 font-mono">ID: {ext.id}</span>
                    <button
                      onClick={() => {
                        const updated = marketplaceExtensions.map(item => {
                          if (item.id === ext.id) {
                            const newStatus = !item.globallyListed;
                            alert(`SaaS Global App Store: "${item.name}" ha sido ${newStatus ? 'Habilitada' : 'Deshabilitada'} para todos los inquilinos.`);
                            return { ...item, globallyListed: newStatus };
                          }
                          return item;
                        });
                        setMarketplaceExtensions(updated);
                      }}
                      className={`px-4 py-2 font-black rounded-xl text-xs transition-colors shadow ${
                        ext.globallyListed 
                          ? 'bg-red-50 hover:bg-red-100 text-red-600 border border-red-200' 
                          : 'bg-slate-900 hover:bg-slate-950 text-white'
                      }`}
                    >
                      {ext.globallyListed ? 'Retirar del Catálogo' : 'Listar en Plataforma'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 8. PARTNERS & RESELLERS TAB */}
        {activeTab === 'partners' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-slate-800">
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-md h-fit">
              <span className="font-extrabold text-sm text-slate-800 block mb-4">Registrar Nuevo Socio (Reseller)</span>
              <form onSubmit={handleCreatePartner} className="flex flex-col gap-4 text-xs font-semibold">
                <div className="flex flex-col gap-1">
                  <label className="text-gray-500">Nombre del Canal / Reseller</label>
                  <input required type="text" placeholder="Ej. Soluciones IT España" value={newPartnerName} onChange={e => setNewPartnerName(e.target.value)} className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-gray-500">Correo Electrónico de Contacto</label>
                  <input required type="email" placeholder="contacto@canalit.com" value={newPartnerEmail} onChange={e => setNewPartnerEmail(e.target.value)} className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-gray-500">Nivel de Alianza (Tier)</label>
                  <select value={newPartnerTier} onChange={e => setNewPartnerTier(e.target.value as any)} className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                    <option value="Bronze">Bronze (10% Comisión)</option>
                    <option value="Silver">Silver (20% Comisión)</option>
                    <option value="Gold">Gold (30% Comisión)</option>
                  </select>
                </div>
                <button type="submit" className="w-full py-3 bg-slate-900 hover:bg-slate-950 text-white rounded-xl font-bold mt-2 shadow flex items-center justify-center gap-1.5">
                  <Plus className="w-4 h-4 text-primary-celeste" /> Registrar Reseller
                </button>
              </form>
            </div>

            <div className="lg:col-span-2 p-6 rounded-2xl bg-white border border-slate-200 shadow-md">
              <span className="font-extrabold text-sm text-slate-800 block mb-4">Canales de Venta / Resellers Activos</span>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 font-bold text-gray-400">
                      <th className="pb-3">Nombre</th>
                      <th className="pb-3">Contacto</th>
                      <th className="pb-3">Nivel</th>
                      <th className="pb-3 text-right">Comisión</th>
                    </tr>
                  </thead>
                  <tbody>
                    {partners.map((p) => (
                      <tr key={p.id} className="border-b border-slate-50">
                        <td className="py-3 font-bold text-slate-900">{p.name}</td>
                        <td className="py-3 text-slate-500 font-mono">{p.email}</td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            p.tier === 'Gold' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' : p.tier === 'Silver' ? 'bg-slate-100 text-slate-700' : 'bg-orange-100 text-orange-850'
                          }`}>
                            {p.tier}
                          </span>
                        </td>
                        <td className="py-3 text-right font-mono font-bold text-slate-700">
                          {(p.commissionRate * 100).toFixed(0)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 9. OEM RESELLER LICENSES TAB */}
        {activeTab === 'licenses' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-slate-800">
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-md h-fit">
              <span className="font-extrabold text-sm text-slate-800 block mb-4">Asignar Licencia OEM a Inquilino</span>
              <form onSubmit={handleAssignLicense} className="flex flex-col gap-4 text-xs font-semibold">
                <div className="flex flex-col gap-1">
                  <label className="text-gray-500">Socio / Reseller Emisor</label>
                  <select required value={newLicensePartner} onChange={e => setNewLicensePartner(e.target.value)} className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                    <option value="">-- Seleccionar --</option>
                    {partners.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.tier})</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-gray-500">Inquilino de Destino (Tenant)</label>
                  <select required value={newLicenseTenant} onChange={e => setNewLicenseTenant(e.target.value)} className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                    <option value="">-- Seleccionar --</option>
                    {tenants.map(t => (
                      <option key={t.id} value={t.id}>{t.name} (subdominio: {t.subdomain})</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-gray-500">Plan Otorgado</label>
                  <select value={newLicensePlan} onChange={e => setNewLicensePlan(e.target.value)} className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                    <option value="Starter">Starter</option>
                    <option value="Pro">Pro</option>
                    <option value="Enterprise">Enterprise</option>
                  </select>
                </div>
                <button type="submit" className="w-full py-3 bg-slate-900 hover:bg-slate-950 text-white rounded-xl font-bold mt-2 shadow flex items-center justify-center gap-1.5">
                  <Check className="w-4 h-4 text-primary-celeste" /> Asignar Licencia
                </button>
              </form>
            </div>

            <div className="lg:col-span-2 p-6 rounded-2xl bg-white border border-slate-200 shadow-md">
              <span className="font-extrabold text-sm text-slate-800 block mb-4">Licencias OEM / Resellers Emitidas</span>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 font-bold text-gray-400">
                      <th className="pb-3">Licencia ID</th>
                      <th className="pb-3">Canal</th>
                      <th className="pb-3">Inquilino</th>
                      <th className="pb-3">Plan</th>
                      <th className="pb-3 text-right">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {licenses.map((lic) => {
                      const matchedP = partners.find(p => p.id === lic.partnerId);
                      const matchedT = tenants.find(t => t.id === lic.tenantId);
                      return (
                        <tr key={lic.id} className="border-b border-slate-50">
                          <td className="py-3 font-mono font-bold text-slate-500 uppercase">{lic.id.substring(0,8)}</td>
                          <td className="py-3 font-bold text-slate-800">{matchedP ? matchedP.name : lic.partnerId}</td>
                          <td className="py-3 font-bold text-slate-600">{matchedT ? matchedT.name : lic.tenantId}</td>
                          <td className="py-3">
                            <span className="bg-celeste-claro/20 text-primary-celeste px-2 py-0.5 rounded text-[10px] font-black uppercase">
                              {lic.planTier}
                            </span>
                          </td>
                          <td className="py-3 text-right">
                            <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-[9px] font-black uppercase">
                              {lic.status.toUpperCase()}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 10. CONSUMPTION & TELEMETRY TAB */}
        {activeTab === 'consumption' && (
          <div className="space-y-8 text-slate-800">
            <div>
              <h2 className="text-2xl font-black text-slate-900">Consumo Edge & Telemetría en Tiempo Real</h2>
              <p className="text-sm text-slate-500">Métricas consolidadas de Cloudflare Workers, Storage y estado de backups.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Workers Telemetry Card */}
              <div className="p-6 bg-white border border-slate-200 rounded-3xl shadow-md flex flex-col justify-between gap-5">
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cloudflare Workers</span>
                    <Cpu className="w-5 h-5 text-primary-celeste" />
                  </div>
                  <h3 className="font-extrabold text-slate-900 text-sm">Peticiones HTTP Edge</h3>
                  <div className="font-mono text-3xl font-black mt-2 text-slate-900">2,849,102</div>
                  <p className="text-xs text-slate-400 mt-2">Tiempo promedio de ejecución CPU: <span className="font-bold text-slate-700">4.2ms</span></p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl text-[10px] font-semibold text-slate-500 flex flex-col gap-1 border border-slate-100">
                  <div className="flex justify-between"><span>Latencia Media:</span> <span className="font-bold text-slate-700">12ms</span></div>
                  <div className="flex justify-between"><span>Tasa de Acierto CDN:</span> <span className="font-bold text-slate-700">92.4%</span></div>
                </div>
              </div>

              {/* R2 Storage Card */}
              <div className="p-6 bg-white border border-slate-200 rounded-3xl shadow-md flex flex-col justify-between gap-5">
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">R2 Object Storage</span>
                    <Database className="w-5 h-5 text-green-500" />
                  </div>
                  <h3 className="font-extrabold text-slate-900 text-sm">Almacenamiento Total</h3>
                  <div className="font-mono text-3xl font-black mt-2 text-slate-900">14.8 GB</div>
                  <p className="text-xs text-slate-400 mt-2">Archivos/Imágenes subidas: <span className="font-bold text-slate-700">12,890 archivos</span></p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl text-[10px] font-semibold text-slate-500 flex flex-col gap-1 border border-slate-100">
                  <div className="flex justify-between"><span>Tráfico Saliente (Egress):</span> <span className="font-bold text-slate-700">0.00 GB (Gratis)</span></div>
                  <div className="flex justify-between"><span>Límite de Almacenamiento:</span> <span className="font-bold text-slate-700">100 GB</span></div>
                </div>
              </div>

              {/* Backups Telemetry Card */}
              <div className="p-6 bg-white border border-slate-200 rounded-3xl shadow-md flex flex-col justify-between gap-5">
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Backups Automatizados</span>
                    <Server className="w-5 h-5 text-red-500" />
                  </div>
                  <h3 className="font-extrabold text-slate-900 text-sm">Estado de Respaldo</h3>
                  <div className="font-mono text-3xl font-black mt-2 text-slate-950">✓ EXITOSO</div>
                  <p className="text-xs text-slate-400 mt-2">Último backup: <span className="font-bold text-slate-700">Hoy 04:00 AM UTC</span></p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl text-[10px] font-semibold text-slate-500 flex flex-col gap-1 border border-slate-100">
                  <div className="flex justify-between"><span>Tamaño del Snapshot:</span> <span className="font-bold text-slate-700">184.2 MB</span></div>
                  <div className="flex justify-between"><span>Destino de Backup:</span> <span className="font-bold text-slate-700">AWS S3 (US-East)</span></div>
                </div>
              </div>

            </div>
          </div>
        )}

      </main>

    </div>
  );
}