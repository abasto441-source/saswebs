'use client';

import React, { useState, useEffect } from 'react';
import { useBuilderStore, type Block } from '@/store/builderStore';
import PageRenderer from '@/components/PageRenderer';
import { dbAdapter, type Template, type Tenant, type Page } from '@/lib/supabase';
import { 
  Layout, Type, Database, RefreshCw, Smartphone, Tablet as TabletIcon, Monitor, 
  Save, Eye, ArrowLeft, ChevronDown, ChevronRight, HelpCircle, Layers, Plus, 
  Users, Trash2, Copy, EyeOff, Sparkles, Wand2, Settings, Globe, Shield, 
  Lock, AlertTriangle, ChevronLeft, Check, Terminal, Play, Image as ImageIcon,
  Activity
} from 'lucide-react';
import Link from 'next/link';

export default function BuilderPage() {
  const { 
    structure,
    pageId,
    slug,
    title,
    isPublished,
    selectedBlockId, 
    setSelectedBlockId, 
    updateBlockContent, 
    updateBlockStyles,
    updateBlockDynamicSource,
    updateBlockSeo,
    updateBlockResponsive,
    addBlock,
    removeBlock,
    duplicateBlock,
    toggleBlockVisibility,
    convertToGlobal,
    reorderBlocks,
    initPage
  } = useBuilderStore();

  const [activeTab, setActiveTab] = useState<'blocks' | 'structure' | 'pages' | 'ai_assistant' | 'git'>('blocks');
  const [viewport, setViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [activeCategories, setActiveCategories] = useState<Record<string, boolean>>({
    basicos: true,
    layout: true,
    formularios: true,
    ecommerce: true,
    lms: true,
    erp: true,
    marketing: true
  });

  // Git versioning states
  const [gitCommits, setGitCommits] = useState<any[]>([]);
  const [newCommitMessage, setNewCommitMessage] = useState('');
  const [selectedCommitForCompare, setSelectedCommitForCompare] = useState<any | null>(null);

  // Full-site AI prompt states
  const [fullSitePrompt, setFullSitePrompt] = useState('');
  const [fullSiteGenerating, setFullSiteGenerating] = useState(false);

  const [isSaved, setIsSaved] = useState(false);
  const [activeTenant, setActiveTenant] = useState<Tenant | null>(null);
  
  // Template Carousel States
  const [templates, setTemplates] = useState<Template[]>([]);
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [demoTemplateId, setDemoTemplateId] = useState<string | null>(null);
  const [moduleWarningModal, setModuleWarningModal] = useState<{
    show: boolean;
    missingModules: string[];
    targetTemplateId: string | null;
  }>({ show: false, missingModules: [], targetTemplateId: null });

  // Webflow Right Customizer Tab State
  const [activeInspectorTab, setActiveInspectorTab] = useState<'content' | 'design' | 'seo' | 'permissions'>('content');

  // Cloudflare Workers AI Simulator State
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiGeneratedText, setAiGeneratedText] = useState('');
  const [aiFieldTarget, setAiFieldTarget] = useState<'title' | 'subtitle' | 'bodyText' | 'imageUrl'>('title');

  // Save new extracted template states
  const [showExtractModal, setShowExtractModal] = useState(false);
  const [extractName, setExtractName] = useState('');
  const [extractCategory, setExtractCategory] = useState<'education' | 'ecommerce' | 'services' | 'corporate' | 'restaurant'>('corporate');
  const [extractPremium, setExtractPremium] = useState(false);

  // Onboarding wizard states
  const [onboardingStep, setOnboardingStep] = useState<number>(0);
  const [onboardingFocus, setOnboardingFocus] = useState<'all' | 'ecommerce' | 'education'>('all');

  const reloadGitCommits = (tenantId: string) => {
    setGitCommits(dbAdapter.getGitCommits(tenantId));
  };

  useEffect(() => {
    const tenant = dbAdapter.getActiveTenant();
    setActiveTenant(tenant);
    setTemplates(dbAdapter.getTemplates());
    reloadGitCommits(tenant.id);

    // Load active page from database
    const page = dbAdapter.getTenantPage(tenant.id, 'inicio');
    if (page && page.structureJson !== '[]') {
      initPage(page.id, page.slug, page.title, page.isPublished, {
        blocks: JSON.parse(page.structureJson)
      });
    } else {
      // Force loading onboarding wizard if no page exists
      setOnboardingStep(1);
    }
  }, []);

  const toggleCategory = (cat: string) => {
    setActiveCategories(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

  const handleDragStart = (e: React.DragEvent, type: Block['type']) => {
    e.dataTransfer.setData('builder/block-type', type);
  };

  const handleSave = () => {
    if (!activeTenant) return;
    dbAdapter.saveTenantPage(activeTenant.id, 'inicio', {
      structureJson: JSON.stringify(structure.blocks)
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3500);
  };

  // Instantiation flow (cloning blueprints)
  const handleLoadTemplate = (templateId: string, force = false) => {
    if (!activeTenant) return;
    const tpl = templates.find(t => t.id === templateId);
    if (!tpl) return;

    // Verify module dependencies (Odoo Switcher validation)
    const missing: string[] = [];
    tpl.requiredModules.forEach(mod => {
      if (!(activeTenant as any)[mod]) {
        missing.push(mod === 'isLmsEnabled' ? 'Academia LMS' : mod === 'isEcommerceEnabled' ? 'E-Commerce' : 'POS Caja');
      }
    });

    if (missing.length > 0 && !force) {
      setModuleWarningModal({
        show: true,
        missingModules: missing,
        targetTemplateId: templateId
      });
      return;
    }

    try {
      const page = dbAdapter.instantiateTemplate(templateId, activeTenant.id, 'inicio');
      initPage(page.id, page.slug, page.title, page.isPublished, {
        blocks: JSON.parse(page.structureJson)
      });
      setShowTemplatesModal(false);
      setOnboardingStep(0);
      setModuleWarningModal({ show: false, missingModules: [], targetTemplateId: null });
      alert(`Plantilla "${tpl.name}" cargada con éxito (ID de bloques clonados e independientes).`);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleForceActivateModules = () => {
    if (!activeTenant || !moduleWarningModal.targetTemplateId) return;
    const tpl = templates.find(t => t.id === moduleWarningModal.targetTemplateId);
    if (!tpl) return;

    // Enable missing modules on active tenant
    const updatedTenant = { ...activeTenant };
    tpl.requiredModules.forEach(mod => {
      (updatedTenant as any)[mod] = true;
    });

    setActiveTenant(updatedTenant);
    const all = dbAdapter.getTenants().map(t => t.id === activeTenant.id ? updatedTenant : t);
    dbAdapter.saveTenants(all);

    // Load template
    handleLoadTemplate(moduleWarningModal.targetTemplateId, true);
  };

  // Duplicate template as a new global master template
  const handleDuplicateTemplate = (tpl: Template) => {
    const newTpl: Template = {
      ...tpl,
      id: 'tpl-' + Date.now(),
      name: `${tpl.name} (Copia)`,
      isPremium: false
    };
    const list = [...templates, newTpl];
    setTemplates(list);
    dbAdapter.saveTemplates(list);
    alert('Plantilla duplicada y registrada en el Marketplace global.');
  };

  // Extract current canvas layout into a global master template
  const handleExtractTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!extractName || !activeTenant) return;

    const newTpl: Template = {
      id: 'tpl-' + Date.now(),
      name: `🎨 ${extractName}`,
      category: extractCategory,
      previewImage: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400',
      industry: 'Custom Template',
      isPremium: extractPremium,
      requiredModules: [],
      blocksIncluded: structure.blocks.map(b => b.type),
      version: '1.0.0',
      structureJson: JSON.stringify(structure.blocks)
    };

    const list = [...templates, newTpl];
    setTemplates(list);
    dbAdapter.saveTemplates(list);
    setShowExtractModal(false);
    setExtractName('');
    alert(`Estructura extraída y guardada como plantilla global: "${extractName}"`);
  };

  // Cloudflare Workers AI simulator
  const handleRunAiSimulator = () => {
    if (!aiPrompt || !selectedBlockId) return;
    setAiGenerating(true);
    setAiGeneratedText('');

    setTimeout(() => {
      // Simulate generating content
      let generated = '';
      if (aiFieldTarget === 'imageUrl') {
        const images = [
          'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800',
          'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800',
          'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800',
          'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800'
        ];
        generated = images[Math.floor(Math.random() * images.length)];
        updateBlockContent(selectedBlockId, { imageUrl: generated });
        setAiGenerating(false);
        return;
      }

      const responses = [
        'Aumenta tu eficiencia de caja con nuestro POS offline-first.',
        'La Academia LMS que conecta estudiantes y maestros a gran escala.',
        'Sincronización de base de datos local robusta con IndexedDB.',
        'Soluciones corporativas de tecnología celular y CNAME dedicados.'
      ];
      generated = responses[Math.floor(Math.random() * responses.length)] + ` (${aiPrompt})`;
      
      // Simulate typing text stream
      let currentIdx = 0;
      const interval = setInterval(() => {
        if (currentIdx <= generated.length) {
          setAiGeneratedText(generated.slice(0, currentIdx));
          updateBlockContent(selectedBlockId, { [aiFieldTarget]: generated.slice(0, currentIdx) });
          currentIdx += 2;
        } else {
          clearInterval(interval);
          setAiGenerating(false);
        }
      }, 40);

    }, 1500);
  };

  const handleGitCommit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommitMessage || !activeTenant) return;
    const newCommit: any = {
      id: 'commit-' + Date.now(),
      tenantId: activeTenant.id,
      message: newCommitMessage,
      timestamp: Date.now(),
      blocksJson: JSON.stringify(structure.blocks),
      author: 'admin@celeste.com'
    };
    const currentCommits = dbAdapter.getGitCommits(activeTenant.id);
    currentCommits.unshift(newCommit);
    dbAdapter.saveGitCommits(activeTenant.id, currentCommits);
    reloadGitCommits(activeTenant.id);
    setNewCommitMessage('');
    alert('¡Cambios guardados con éxito en la rama Git!');
  };

  const handleRestoreCommit = (commit: any) => {
    if (!activeTenant) return;
    if (confirm(`¿Estás seguro de que deseas restaurar la versión: "${commit.message}"? Se reemplazará el lienzo actual.`)) {
      initPage(pageId || 'p-restore', slug, title, isPublished, {
        blocks: JSON.parse(commit.blocksJson)
      });
      dbAdapter.saveTenantPage(activeTenant.id, 'inicio', {
        structureJson: commit.blocksJson
      });
      alert('¡Versión de página restaurada con éxito!');
    }
  };

  const handleRunFullSiteAi = () => {
    if (!fullSitePrompt || !activeTenant) return;
    setFullSiteGenerating(true);
    setTimeout(() => {
      const promptLower = fullSitePrompt.toLowerCase();
      let themeColor = '#bce6ed';
      let title = 'Servicios y Consultoría Celeste';
      let subtitle = 'Infraestructura robusta con dominios CNAME y automatización de procesos.';
      let secondaryBlockType: Block['type'] = 'cms_collection_grid';
      let secondaryTitle = 'Artículos de Prensa Recientes';

      if (promptLower.includes('dental') || promptLower.includes('dentista') || promptLower.includes('médica') || promptLower.includes('médico') || promptLower.includes('salud')) {
        themeColor = '#3b82f6';
        title = 'Clínica Odontológica DentalCare';
        subtitle = 'Cuidado bucal premium con tecnología de punta y reserva de turnos en línea.';
        secondaryBlockType = 'reservations_calendar';
        secondaryTitle = 'Agenda tu Cita Médica';
      } else if (promptLower.includes('restaurant') || promptLower.includes('restaurante') || promptLower.includes('comida') || promptLower.includes('chef') || promptLower.includes('gourmet')) {
        themeColor = '#f97316';
        title = 'Bistró Delicia Gourmet';
        subtitle = 'Platos de autor preparados con ingredientes frescos de granja locales.';
        secondaryBlockType = 'cta_banner';
        secondaryTitle = 'Reserva tu Mesa Online';
      } else if (promptLower.includes('tienda') || promptLower.includes('ropa') || promptLower.includes('moda') || promptLower.includes('ecommerce') || promptLower.includes('ventas')) {
        themeColor = '#ec4899';
        title = 'Boutique Fashion & Co';
        subtitle = 'Ropa y calzado exclusivo con sincronización de catálogo POS offline.';
        secondaryBlockType = 'dynamic_product_grid';
        secondaryTitle = 'Novedades de la Semana';
      } else if (promptLower.includes('curso') || promptLower.includes('academia') || promptLower.includes('lms') || promptLower.includes('clases')) {
        themeColor = '#06b6d4';
        title = 'Academia Virtual Celeste';
        subtitle = 'Plataforma educativa para aprender desarrollo web, base de datos y Cloud Computing.';
        secondaryBlockType = 'lms_course_list';
        secondaryTitle = 'Cursos Virtuales Disponibles';
      }

      const generatedBlocks: Block[] = [
        {
          id: 'b-ai-h',
          type: 'header',
          version: '1.0.0',
          isVisible: true,
          styles: { padding: 'py-4', bgColor: '#ffffff' },
          content: { logo: `🎓 ${title.split(' ')[0]}`, links: [{ label: 'Inicio', url: '/' }, { label: 'Servicios', url: '#servicios' }] }
        },
        {
          id: 'b-ai-he',
          type: 'hero',
          version: '1.0.0',
          isVisible: true,
          styles: { padding: 'py-20', bgColor: themeColor, textAlign: 'center', borderRadius: 'xl' },
          content: { title, subtitle, buttonText: 'Empezar Ahora', buttonLink: '#servicios', imageUrl: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=800' }
        },
        {
          id: 'b-ai-sec',
          type: secondaryBlockType,
          version: '1.0.0',
          isVisible: true,
          styles: { padding: 'py-12', bgColor: '#ffffff', textAlign: 'center' },
          content: { title: secondaryTitle, subtitle: 'Sincronizado dinámicamente con la base de datos' }
        },
        {
          id: 'b-ai-f',
          type: 'footer',
          version: '1.0.0',
          isVisible: true,
          styles: { padding: 'py-8', bgColor: '#111827' },
          content: { copyText: `© 2026 ${title}. Todos los derechos reservados.` }
        }
      ];

      initPage(pageId || 'p-ai', slug, title, isPublished, {
        blocks: generatedBlocks
      });

      dbAdapter.saveTenantPage(activeTenant.id, 'inicio', {
        structureJson: JSON.stringify(generatedBlocks)
      });

      updateBlockSeo('inicio', {
        metaTitle: `${title} | Sitio Web Generado por IA`,
        metaDesc: subtitle
      });

      dbAdapter.addAuditLog(activeTenant.id, 'ai_assistant@nram360.com', 'Generar Sitio Completo con IA', `Diseño completo autogenerado con prompt: "${fullSitePrompt}"`);
      setFullSiteGenerating(false);
      setFullSitePrompt('');
      alert('¡Sitio Web completo generado y cargado con éxito en el lienzo!');
    }, 2000);
  };

  const selectedBlock = structure.blocks.find(b => b.id === selectedBlockId);

  // Carousel navigation
  const nextTemplate = () => {
    setCarouselIndex(prev => (prev + 1) % templates.length);
  };
  const prevTemplate = () => {
    setCarouselIndex(prev => (prev - 1 + templates.length) % templates.length);
  };

  const currentTemplate = templates[carouselIndex];

  // Drag and drop sorting zones inside the canvas list
  const moveBlockUp = (idx: number) => {
    if (idx > 0) {
      reorderBlocks(idx, idx - 1);
    }
  };

  const moveBlockDown = (idx: number) => {
    if (idx < structure.blocks.length - 1) {
      reorderBlocks(idx, idx + 1);
    }
  };

  return (
    <div className="w-full h-screen flex flex-col bg-gray-100 dark:bg-[#0c0c0e] overflow-hidden select-none text-sm font-medium">
      
      {/* 1. VISUAL BUILDER HEADER */}
      <header className="h-16 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-[#121214] px-6 flex items-center justify-between z-10 shrink-0 text-slate-800">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-500 hover:text-black transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-base font-black flex items-center gap-2">
              Creador Visual Odoo-Style <span className="px-2 py-0.5 text-[9px] bg-celeste-claro/50 text-primary-celeste rounded font-extrabold uppercase tracking-wider">PREMIUM</span>
            </h1>
            <span className="text-xs text-gray-400 font-bold">Inquilino: {activeTenant?.name || 'Cargando...'}</span>
          </div>
        </div>

        {/* Viewport switcher */}
        <div className="flex items-center bg-gray-100 dark:bg-black/30 p-1 rounded-full border border-gray-200 dark:border-gray-800">
          <button 
            onClick={() => setViewport('desktop')}
            className={`p-2 rounded-full transition-all ${viewport === 'desktop' ? 'bg-white dark:bg-[#1d1d21] text-primary-celeste shadow' : 'text-gray-400 hover:text-black'}`}
            title="Vista de Escritorio"
          >
            <Monitor className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setViewport('tablet')}
            className={`p-2 rounded-full transition-all ${viewport === 'tablet' ? 'bg-white dark:bg-[#1d1d21] text-primary-celeste shadow' : 'text-gray-400 hover:text-black'}`}
            title="Vista de Tableta"
          >
            <TabletIcon className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setViewport('mobile')}
            className={`p-2 rounded-full transition-all ${viewport === 'mobile' ? 'bg-white dark:bg-[#1d1d21] text-primary-celeste shadow' : 'text-gray-400 hover:text-black'}`}
            title="Vista de Móvil"
          >
            <Smartphone className="w-4 h-4" />
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowTemplatesModal(true)}
            className="px-4 py-2 border border-gray-200 rounded-full font-bold hover:bg-slate-50 transition-colors text-xs"
          >
            📚 Biblioteca Plantillas
          </button>
          <button 
            onClick={() => setShowExtractModal(true)}
            className="px-4 py-2 border border-[#bce6ed] text-primary-celeste bg-celeste-claro/20 rounded-full font-bold hover:bg-celeste-claro/40 transition-colors text-xs"
            title="Extraer esta estructura de página como tema"
          >
            📥 Extraer Plantilla
          </button>
          <Link href="/inicio" target="_blank" className="px-4 py-2 border border-gray-200 rounded-full font-bold hover:bg-gray-50 transition-colors flex items-center gap-1.5 text-xs">
            <Eye className="w-4 h-4" /> Previsualizar
          </Link>
          <button 
            onClick={handleSave}
            className="px-6 py-2.5 bg-slate-900 text-white rounded-full font-bold shadow-lg hover:scale-105 transition-all flex items-center gap-2 relative text-xs"
          >
            <Save className="w-4 h-4 text-primary-celeste" /> 
            {isSaved ? '¡Guardado!' : 'Guardar Diseño'}
            {isSaved && (
              <span className="absolute -bottom-10 right-0 bg-green-600 text-white text-[10px] py-1.5 px-3 rounded-lg shadow-xl animate-fade-in font-bold z-50">
                Lienzo guardado en dbAdapter (Simulado)
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Main workspace splits */}
      <div className="flex-grow flex w-full overflow-hidden text-slate-800 dark:text-slate-200">
        
        {/* 2. LEFT SIDEBAR: Drawer of tabs */}
        <aside className="w-80 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-[#121214] flex flex-col overflow-hidden shrink-0">
          
          <div className="flex border-b border-gray-200 dark:border-gray-800 p-2 gap-1 bg-gray-50/50 dark:bg-black/10">
            {[
              { id: 'blocks', label: 'Bloques' },
              { id: 'structure', label: 'Estructura' },
              { id: 'pages', label: 'Páginas' },
              { id: 'ai_assistant', label: '🤖 Workers AI' },
              { id: 'git', label: '🌳 Git' }
            ].map(tab => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-grow py-2 text-center text-[10px] font-black uppercase rounded-lg transition-colors ${activeTab === tab.id ? 'bg-slate-900 text-white shadow-sm' : 'text-gray-500 hover:text-slate-950'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex-grow overflow-y-auto p-4 flex flex-col gap-4">
            
            {/* A. BLOCKS TAB WITH MINIATURES */}
            {activeTab === 'blocks' && (
              <div className="flex flex-col gap-4">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Arrastra maquetas al lienzo</span>
                
                {[
                  {
                    id: 'basicos',
                    title: 'Básicos & Estructura',
                    blocks: [
                      { type: 'header', label: 'Navbar Principal', desc: 'Barra de logo y menú links', preview: <div className="h-6 bg-slate-100 rounded border border-dashed border-slate-300 flex items-center justify-between px-2 text-[8px] font-bold text-slate-400"><span>logo</span><span className="flex gap-1">■ ■ ■</span></div> },
                      { type: 'footer', label: 'Pie de Página', desc: 'Links y copyright', preview: <div className="h-6 bg-slate-800 rounded border border-dashed border-slate-600 flex items-center justify-center text-[7px] text-slate-400">© Copyright 2026</div> },
                      { type: 'columns_layout', label: 'Contenedor Columnas', desc: 'Grilla triple de contenido', preview: <div className="grid grid-cols-3 gap-1"><div className="h-6 bg-slate-100 rounded"></div><div className="h-6 bg-slate-100 rounded"></div><div className="h-6 bg-slate-100 rounded"></div></div> },
                      { type: 'divider', label: 'Separador Visual', desc: 'Línea de espaciado', preview: <div className="flex items-center justify-center h-4"><div className="w-full border-t border-dashed border-slate-300"></div></div> }
                    ]
                  },
                  {
                    id: 'contenido',
                    title: 'Contenido Estático',
                    blocks: [
                      { type: 'hero', label: 'Banner Héroe', desc: 'Gran título con multimedia', preview: <div className="h-10 bg-celeste-claro/20 border border-primary-celeste/20 rounded flex flex-col justify-center p-1.5"><span className="text-[7px] font-black text-slate-600 block">Título Banner</span><span className="text-[5px] text-slate-400 mt-0.5">Slogan comercial...</span></div> },
                      { type: 'rich_text', label: 'Bloque Texto', desc: 'Cuerpo de texto editable', preview: <div className="h-8 bg-slate-50 border border-slate-100 rounded p-1 flex flex-col gap-1"><div className="w-2/3 h-1 bg-slate-300 rounded"></div><div className="w-full h-1 bg-slate-200 rounded"></div><div className="w-full h-1 bg-slate-200 rounded"></div></div> },
                      { type: 'gallery', label: 'Galería Fotos', desc: 'Grillas de fotos', preview: <div className="grid grid-cols-2 gap-1"><div className="h-6 bg-slate-100 rounded"></div><div className="h-6 bg-slate-100 rounded"></div></div> },
                      { type: 'accordion_faq', label: 'Acordeón FAQs', desc: 'Preguntas y respuestas colapsables', preview: <div className="flex flex-col gap-1"><div className="h-4 bg-slate-50 border border-slate-100 rounded flex justify-between items-center px-1 text-[6px]"><span>¿Pregunta 1?</span><span>▼</span></div></div> },
                      { type: 'tabs_section', label: 'Pestañas de Texto', desc: 'Paneles seleccionables', preview: <div className="flex flex-col gap-1"><div className="flex gap-1"><span className="px-1 bg-slate-200 rounded text-[5px]">Tab 1</span><span className="px-1 text-[5px]">Tab 2</span></div><div className="h-4 bg-slate-50 rounded"></div></div> },
                      { type: 'counter_stats', label: 'Estadísticas', desc: 'Indicadores KPI', preview: <div className="grid grid-cols-2 gap-1 text-center"><div className="bg-slate-100 rounded p-0.5"><span className="text-[8px] font-black block">10K</span><span className="text-[5px] text-slate-400 block">Alumnos</span></div><div className="bg-slate-100 rounded p-0.5"><span className="text-[8px] font-black block">2M</span><span className="text-[5px] text-slate-400 block">POS</span></div></div> }
                    ]
                  },
                  {
                    id: 'dinamico',
                    title: 'Capas Dinámicas (Live Feed)',
                    blocks: [
                      { type: 'dynamic_product_grid', label: 'Grilla Productos', desc: 'Productos del POS/Tienda', preview: <div className="grid grid-cols-3 gap-1"><div className="h-6 bg-slate-100 rounded flex items-end justify-center p-0.5"><span className="text-[4px] font-bold">$150.00</span></div><div className="h-6 bg-slate-100 rounded flex items-end justify-center p-0.5"><span className="text-[4px] font-bold">$320.00</span></div><div className="h-6 bg-slate-100 rounded flex items-end justify-center p-0.5"><span className="text-[4px] font-bold">$850.00</span></div></div>, isEnabled: activeTenant?.isEcommerceEnabled },
                      { type: 'lms_course_list', label: 'Lista de Cursos', desc: 'Lista de cursos con Matrícula', preview: <div className="h-10 bg-slate-50 border border-slate-100 rounded p-1 flex justify-between gap-1"><div className="w-1/2 bg-slate-200 rounded"></div><div className="w-1/2 flex flex-col justify-between"><span className="text-[5px] font-bold">Curso Next.js</span><span className="bg-primary-celeste text-white rounded p-0.5 text-[4px] text-center">Inscribirse</span></div></div>, isEnabled: activeTenant?.isLmsEnabled },
                      { type: 'reservations_calendar', label: 'Calendario Reservas', desc: 'Selector de turnos y citas', preview: <div className="h-10 bg-slate-50 border border-slate-100 rounded p-1 flex flex-col justify-between"><span className="text-[6px] font-bold text-slate-700">Reservar Turno</span><div className="grid grid-cols-3 gap-0.5"><span className="bg-slate-200 text-[4px] text-center p-0.5 rounded">09:00</span><span className="bg-slate-200 text-[4px] text-center p-0.5 rounded">10:00</span><span className="bg-slate-200 text-[4px] text-center p-0.5 rounded">11:00</span></div></div>, isEnabled: activeTenant?.isReservasEnabled },
                      { type: 'cms_collection_grid', label: 'Lista Colección CMS', desc: 'Grilla dinámica de registros CMS', preview: <div className="h-10 bg-slate-50 border border-slate-100 rounded p-1 flex flex-col justify-between"><span className="text-[5px] font-bold text-slate-700">CMS: Artículos</span><div className="grid grid-cols-2 gap-1"><span className="bg-slate-200 text-[4px] p-0.5 rounded truncate">eCommerce POS</span><span className="bg-slate-200 text-[4px] p-0.5 rounded truncate">Clases Edge</span></div></div>, isEnabled: true },
                      { type: 'upcoming_events', label: 'Webinars en Vivo', desc: 'Lista de eventos CRM/LMS', preview: <div className="flex flex-col gap-1"><div className="h-4 bg-slate-50 border border-slate-100 rounded flex items-center gap-1 px-1 text-[5px]"><span className="w-1 h-1 bg-red-500 rounded-full animate-ping"></span><span>Live Webinar</span></div></div>, isEnabled: true },

                      { type: 'testimonials_crm', label: 'Testimonios CRM', desc: 'Reseñas de clientes del CRM', preview: <div className="h-6 bg-slate-50 border border-slate-100 rounded flex items-center justify-center p-1 text-[5px] text-slate-500">"Excelente ERP" - Juan</div>, isEnabled: true }
                    ].filter(b => b.isEnabled)
                  },
                  {
                    id: 'conversion',
                    title: 'Formularios & Conversión',
                    blocks: [
                      { type: 'contact_form', label: 'Formulario Contacto', desc: 'Captación de leads directos', preview: <div className="h-8 bg-slate-50 border border-slate-100 rounded p-1 flex flex-col gap-1"><div className="w-full h-2 bg-white rounded border border-slate-200"></div><div className="w-full h-2 bg-slate-900 rounded text-center text-[4px] text-white font-bold flex items-center justify-center">Enviar</div></div> },
                      { type: 'newsletter_sub', label: 'Suscripción Boletín', desc: 'Boletín de novedades', preview: <div className="h-8 bg-celeste-claro/10 border border-[#bce6ed] rounded flex items-center gap-1 p-1"><div className="w-2/3 h-3 bg-white rounded"></div><div className="w-1/3 h-3 bg-slate-900 rounded"></div></div> },
                      { type: 'cta_banner', label: 'Llamada a la Acción', desc: 'Cajas con botones directos', preview: <div className="h-8 bg-slate-900 text-white rounded flex justify-between items-center px-2 text-[5px]"><span className="font-bold">¡Prueba Gratis!</span><span className="bg-primary-celeste text-slate-950 font-bold px-1 rounded">Regístrate</span></div> },
                      { type: 'pricing_table', label: 'Tabla de Precios', desc: 'Checkout de planes comerciales', preview: <div className="grid grid-cols-2 gap-1 text-center"><div className="bg-slate-50 border border-slate-100 rounded p-0.5"><span className="text-[4px] block font-bold">Starter</span><span className="text-[6px] font-black block">$19</span></div><div className="bg-slate-50 border border-slate-100 rounded p-0.5"><span className="text-[4px] block font-bold">Pro</span><span className="text-[6px] font-black block">$49</span></div></div> }
                    ]
                  }
                ].map(cat => (
                  <div key={cat.id} className="border border-gray-100 dark:border-gray-800/80 rounded-xl overflow-hidden bg-gray-50/40 dark:bg-black/10">
                    <button 
                      onClick={() => toggleCategory(cat.id)}
                      className="w-full flex items-center justify-between p-3.5 font-extrabold text-left border-b border-gray-100 dark:border-gray-800/50"
                    >
                      <span className="text-xs text-borla-negro">{cat.title}</span>
                      {activeCategories[cat.id] ? <ChevronDown className="w-4 h-4 text-primary-celeste" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                    </button>

                    {activeCategories[cat.id] && (
                      <div className="p-3 grid grid-cols-1 gap-3 bg-white dark:bg-transparent">
                        {cat.blocks.map(block => (
                          <div
                            key={block.type}
                            draggable
                            onDragStart={(e) => handleDragStart(e, block.type as Block['type'])}
                            className="p-3 border border-dashed border-gray-200 rounded-xl bg-slate-50/50 hover:border-primary-celeste hover:bg-celeste-claro/5 cursor-grab active:cursor-grabbing transition-all group"
                          >
                            <div className="flex items-start gap-2.5 mb-2.5">
                              <div className="p-1.5 bg-celeste-claro/20 rounded-lg text-primary-celeste group-hover:scale-110 transition-transform">
                                <Layout className="w-4 h-4" />
                              </div>
                              <div className="flex flex-col">
                                <span className="font-extrabold text-xs text-borla-negro">{block.label}</span>
                                <span className="text-[10px] text-gray-400 mt-0.5 leading-tight">{block.desc}</span>
                              </div>
                            </div>
                            
                            {/* Visual miniature mockup */}
                            <div className="p-2 border border-slate-100 rounded-lg bg-white/70 shadow-sm opacity-80 group-hover:opacity-100 transition-opacity">
                              {block.preview}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* B. STRUCTURE EXPLORER TREE VIEW */}
            {activeTab === 'structure' && (
              <div className="flex flex-col gap-4">
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Árbol de Estructura Visual</span>
                  <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">Duplica, oculta o reordena los bloques jerárquicos del lienzo.</p>
                </div>

                <div className="flex flex-col gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <div className="px-3 py-1.5 bg-slate-900 text-white text-[10px] font-black rounded-lg uppercase tracking-wide flex items-center gap-1.5 w-fit">
                    <Globe className="w-3.5 h-3.5 text-primary-celeste" /> /inicio (Página)
                  </div>

                  <div className="flex flex-col gap-1.5 pl-3 border-l border-slate-200 mt-2">
                    {structure.blocks.map((b, idx) => {
                      const isSel = selectedBlockId === b.id;
                      const isHidden = b.isVisible === false;
                      return (
                        <div 
                          key={b.id} 
                          onClick={() => setSelectedBlockId(b.id)}
                          className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer text-xs transition-all ${
                            isSel 
                              ? 'bg-primary-celeste text-slate-950 font-bold shadow-sm' 
                              : 'bg-white hover:bg-slate-100 border border-slate-100'
                          } ${isHidden ? 'opacity-50 line-through' : ''}`}
                        >
                          <span className="truncate max-w-[120px] font-extrabold uppercase text-[9px] flex items-center gap-1.5">
                            {b.isGlobal ? '🗲 ' : ''}{b.type}
                          </span>

                          <div className="flex items-center gap-1 shrink-0">
                            {/* Move actions */}
                            <button 
                              onClick={(e) => { e.stopPropagation(); moveBlockUp(idx); }}
                              disabled={idx === 0}
                              className="p-1 hover:bg-black/10 rounded disabled:opacity-30"
                              title="Subir bloque"
                            >
                              ▲
                            </button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); moveBlockDown(idx); }}
                              disabled={idx === structure.blocks.length - 1}
                              className="p-1 hover:bg-black/10 rounded disabled:opacity-30"
                              title="Bajar bloque"
                            >
                              ▼
                            </button>
                            
                            {/* Duplicate */}
                            <button 
                              onClick={(e) => { e.stopPropagation(); duplicateBlock(b.id); }}
                              className="p-1 hover:bg-black/10 rounded"
                              title="Duplicar bloque"
                            >
                              <Copy className="w-3 h-3" />
                            </button>

                            {/* Visibility */}
                            <button 
                              onClick={(e) => { e.stopPropagation(); toggleBlockVisibility(b.id); }}
                              className="p-1 hover:bg-black/10 rounded"
                              title="Ocultar/Mostrar en producción"
                            >
                              <EyeOff className="w-3 h-3" />
                            </button>

                            {/* Delete */}
                            <button 
                              onClick={(e) => { e.stopPropagation(); removeBlock(b.id); }}
                              className="p-1 hover:bg-black/10 rounded text-red-500 hover:text-red-700"
                              title="Eliminar bloque"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* C. PAGE DIRECTORY */}
            {activeTab === 'pages' && (
              <div className="flex flex-col gap-4">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Páginas de este sitio</span>
                <div className="flex flex-col gap-2">
                  <div className="px-4 py-2.5 bg-celeste-claro/10 border border-primary-celeste/20 text-primary-celeste rounded-xl text-xs font-bold flex justify-between items-center">
                    <span>/inicio (Página Principal)</span>
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                  </div>
                  <div className="px-4 py-2.5 bg-gray-50 text-gray-400 rounded-xl text-xs flex justify-between items-center">
                    <span>/cursos (Aula LMS)</span>
                    <span className="w-1.5 h-1.5 bg-gray-300 rounded-full"></span>
                  </div>
                  <div className="px-4 py-2.5 bg-gray-50 text-gray-400 rounded-xl text-xs flex justify-between items-center">
                    <span>/contacto (Contacto)</span>
                    <span className="w-1.5 h-1.5 bg-gray-300 rounded-full"></span>
                  </div>
                </div>

                <button 
                  onClick={() => setShowTemplatesModal(true)}
                  className="w-full mt-6 py-2.5 bg-slate-900 hover:bg-primary-celeste hover:text-slate-950 text-white font-extrabold text-xs rounded-xl shadow transition-colors flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-4 h-4" /> Cambiar Plantilla Base
                </button>
              </div>
            )}

            {/* D. CLOUDFLARE WORKERS AI ASSISTANT SIMULATOR */}
            {activeTab === 'ai_assistant' && (
              <div className="flex flex-col gap-4">
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Workers AI Content Generator</span>
                  <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">Genera contenidos de texto e imágenes mediante llamadas simulated a Cloudflare Workers AI.</p>
                </div>

                {selectedBlock ? (
                  <div className="flex flex-col gap-4 bg-slate-50 border border-slate-100 rounded-2xl p-4 text-xs font-semibold">
                    <span className="text-[10px] bg-slate-900 text-white px-2 py-0.5 rounded uppercase tracking-wide w-fit">
                      Lienzo Activo: {selectedBlock.type}
                    </span>

                    <div>
                      <label className="block text-[10px] text-slate-500 mb-1">Escribir Instrucción (Prompt)</label>
                      <textarea 
                        rows={4}
                        placeholder="Ej: Escribe un título comercial de comida gourmet con un tono elegante."
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        className="w-full p-3 border border-slate-200 rounded-xl bg-white focus:ring-1 focus:ring-primary-celeste outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-500 mb-1">Campo Destino en Bloque</label>
                      <select 
                        value={aiFieldTarget}
                        onChange={(e) => setAiFieldTarget(e.target.value as any)}
                        className="w-full p-2.5 border border-slate-200 rounded-xl bg-white"
                      >
                        <option value="title">Título del Bloque</option>
                        <option value="subtitle">Subtítulo / Slogan</option>
                        <option value="bodyText">Cuerpo de Texto</option>
                        <option value="imageUrl">Imagen URL de Fondo</option>
                      </select>
                    </div>

                    <button 
                      onClick={handleRunAiSimulator}
                      disabled={aiGenerating || !aiPrompt}
                      className="w-full py-3 bg-slate-900 hover:bg-primary-celeste hover:text-slate-950 text-white font-extrabold rounded-xl shadow transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      <Wand2 className="w-4 h-4 text-primary-celeste" /> 
                      {aiGenerating ? 'Generando en Edge...' : 'Generar con Workers AI'}
                    </button>

                    {aiGenerating && (
                      <div className="flex flex-col gap-2 p-3 bg-slate-900 text-slate-300 font-mono text-[10px] rounded-xl border border-slate-800">
                        <div className="flex items-center gap-1.5 text-primary-celeste">
                          <Activity className="w-3.5 h-3.5 animate-pulse text-green-500" /> running workers_ai llama-3.1-8b...
                        </div>
                        <span className="text-slate-500">streaming results...</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col gap-4 bg-slate-50 border border-slate-100 rounded-2xl p-4 text-xs font-semibold">
                    <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-primary-celeste" /> Generar Sitio Completo con IA
                    </span>
                    <p className="text-[10px] text-slate-400 leading-normal">
                      Diseña un lienzo entero desde cero usando un prompt descriptivo. La IA creará los bloques y configuraciones SEO.
                    </p>
                    
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-1">Prompt de Generación</label>
                      <textarea 
                        rows={4}
                        placeholder="Ej: Crea una clínica dental de color azul con logo DentalCare, testimonios y formulario de citas."
                        value={fullSitePrompt}
                        onChange={(e) => setFullSitePrompt(e.target.value)}
                        className="w-full p-3 border border-slate-200 rounded-xl bg-white focus:ring-1 focus:ring-primary-celeste outline-none"
                      />
                    </div>
                    
                    <button 
                      onClick={handleRunFullSiteAi}
                      disabled={fullSiteGenerating || !fullSitePrompt}
                      className="w-full py-3 bg-slate-900 hover:bg-primary-celeste hover:text-slate-950 text-white font-extrabold rounded-xl shadow transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      <Wand2 className="w-4 h-4 text-primary-celeste animate-pulse" /> 
                      {fullSiteGenerating ? 'Generando Sitio...' : 'Generar Sitio Completo'}
                    </button>

                    {fullSiteGenerating && (
                      <div className="flex flex-col gap-1.5 p-3 bg-slate-900 text-slate-300 font-mono text-[9px] rounded-xl border border-slate-800">
                        <span className="text-green-400">⚙ Analyzing prompt keywords...</span>
                        <span className="text-yellow-400">⚙ Structuring Odoo-style templates...</span>
                        <span className="text-primary-celeste animate-pulse">⚙ Injecting blocks and styles...</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* E. GIT VERSION CONTROL TAB */}
            {activeTab === 'git' && (
              <div className="flex flex-col gap-4">
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Control de Versiones (Git-style)</span>
                  <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">Crea puntos de restauración (commits) y reestablece el lienzo en cualquier momento.</p>
                </div>

                {/* Commit Form */}
                <form onSubmit={handleGitCommit} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col gap-3 text-xs font-semibold">
                  <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">Confirmar Cambios (Commit)</span>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1">Mensaje del Cambio</label>
                    <input 
                      required 
                      type="text" 
                      placeholder="Ej. Cambio de colores en Hero y textos" 
                      value={newCommitMessage}
                      onChange={e => setNewCommitMessage(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                  <button 
                    type="submit" 
                    className="w-full py-2.5 bg-slate-900 hover:bg-slate-950 text-white font-bold rounded-xl shadow transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5 text-primary-celeste" /> Commit a Rama Principal
                  </button>
                </form>

                {/* Commit History List */}
                <div className="flex flex-col gap-2.5">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">Historial de Commits</span>
                  {gitCommits.length === 0 ? (
                    <span className="text-xs text-slate-400 italic">No hay historial registrado.</span>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {gitCommits.map(commit => {
                        const isSelected = selectedCommitForCompare?.id === commit.id;
                        const blocks = JSON.parse(commit.blocksJson || '[]');
                        return (
                          <div 
                            key={commit.id} 
                            onClick={() => setSelectedCommitForCompare(commit)}
                            className={`p-3.5 border rounded-xl cursor-pointer text-left transition-all ${
                              isSelected 
                                ? 'border-primary-celeste bg-celeste-claro/10' 
                                : 'border-slate-100 bg-white hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex justify-between items-start gap-2">
                              <span className="font-extrabold text-xs text-slate-900 block truncate leading-tight">{commit.message}</span>
                              <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-mono font-bold shrink-0">{commit.id.substring(0, 11)}</span>
                            </div>
                            <div className="flex justify-between items-center text-[10px] text-slate-400 mt-3 font-semibold">
                              <span>Por: {commit.author}</span>
                              <span>{new Date(commit.timestamp).toLocaleTimeString()}</span>
                            </div>

                            {isSelected && (
                              <div className="mt-3 pt-3 border-t border-slate-200/60 flex flex-col gap-2 animate-fade-in text-[10px] font-semibold text-slate-700">
                                <span className="block text-slate-500">Resumen de Bloques: <strong className="text-slate-800">{blocks.length} bloques</strong></span>
                                <div className="flex flex-wrap gap-1">
                                  {blocks.map((b: any, i: number) => (
                                    <span key={i} className="px-1.5 py-0.5 bg-slate-100 rounded text-[9px] font-mono">{b.type}</span>
                                  ))}
                                </div>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); handleRestoreCommit(commit); }}
                                  className="w-full py-2 bg-primary-celeste text-slate-950 font-black rounded-lg text-center shadow-md hover:scale-102 transition-transform mt-1"
                                >
                                  Restaurar esta Versión
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>
        </aside>

        {/* 3. CENTER EDITOR WORKSPACE CANVAS */}
        <main className="flex-grow bg-slate-100 dark:bg-[#0c0c0e] overflow-y-auto p-8 flex justify-center">
          <div 
            className={`bg-white dark:bg-[#121214] shadow-2xl transition-all duration-300 relative border border-gray-200 dark:border-gray-800 ${
              viewport === 'desktop' ? 'w-full max-w-6xl' : viewport === 'tablet' ? 'w-[768px]' : 'w-[375px]'
            }`}
          >
            {/* Viewport Frame labels */}
            <div className="absolute top-2 right-4 text-[10px] font-mono text-gray-400 z-10 pointer-events-none uppercase">
              {viewport} view
            </div>

            <PageRenderer isEditor={true} />
          </div>
        </main>

        {/* 4. RIGHT SIDEBAR: Webflow-style properties inspector */}
        <aside className="w-80 border-l border-gray-200 dark:border-gray-800 bg-white dark:bg-[#121214] flex flex-col overflow-hidden shrink-0 text-slate-800 dark:text-slate-200">
          
          <div className="flex border-b border-gray-200 dark:border-gray-800 p-2 gap-1 bg-gray-50/50 dark:bg-black/10">
            {[
              { id: 'content', label: 'Contenido' },
              { id: 'design', label: 'Diseño' },
              { id: 'seo', label: 'SEO' },
              { id: 'permissions', label: 'Datos/Permisos' }
            ].map(tab => (
              <button 
                key={tab.id}
                onClick={() => setActiveInspectorTab(tab.id as any)}
                className={`flex-grow py-1.5 text-center text-[9px] font-black uppercase rounded transition-colors ${activeInspectorTab === tab.id ? 'bg-primary-celeste text-slate-950 font-bold shadow-sm' : 'text-gray-500 hover:text-slate-950'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex-grow overflow-y-auto p-4 flex flex-col gap-4">
            {selectedBlock ? (
              <div className="flex flex-col gap-5">
                
                {/* A. CONTENT TAB */}
                {activeInspectorTab === 'content' && (
                  <div className="flex flex-col gap-4 text-xs font-semibold">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-gray-400 uppercase font-black tracking-wider">Editar Contenidos Estáticos</span>
                      {selectedBlock.isGlobal && (
                        <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded text-[9px] font-black uppercase">Bloque Global</span>
                      )}
                    </div>

                    {/* Global Block Sync Button */}
                    {!selectedBlock.isGlobal && (
                      <button
                        onClick={() => {
                          const name = prompt('Ingresa un nombre descriptivo para este bloque global (ej. Header Principal):');
                          if (name) convertToGlobal(selectedBlock.id, name);
                        }}
                        className="w-full py-2 bg-yellow-50 hover:bg-yellow-100 border border-yellow-200 text-yellow-800 rounded-xl font-bold transition-all text-xs flex items-center justify-center gap-1.5"
                      >
                        🗲 Convertir a Bloque Global
                      </button>
                    )}

                    {selectedBlock.content.title !== undefined && (
                      <div>
                        <label className="block text-[10px] text-slate-500 dark:text-slate-400 mb-1">Título del Bloque</label>
                        <input 
                          type="text" 
                          value={selectedBlock.content.title || ''}
                          onChange={(e) => updateBlockContent(selectedBlock.id, { title: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-lg bg-transparent text-xs"
                        />
                      </div>
                    )}

                    {selectedBlock.content.subtitle !== undefined && (
                      <div>
                        <label className="block text-[10px] text-slate-500 dark:text-slate-400 mb-1">Subtítulo / Slogan</label>
                        <textarea 
                          rows={3}
                          value={selectedBlock.content.subtitle || ''}
                          onChange={(e) => updateBlockContent(selectedBlock.id, { subtitle: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-lg bg-transparent text-xs"
                        />
                      </div>
                    )}

                    {selectedBlock.content.bodyText !== undefined && (
                      <div>
                        <label className="block text-[10px] text-slate-500 dark:text-slate-400 mb-1">Cuerpo de Texto</label>
                        <textarea 
                          rows={6}
                          value={selectedBlock.content.bodyText || ''}
                          onChange={(e) => updateBlockContent(selectedBlock.id, { bodyText: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-lg bg-transparent text-xs"
                        />
                      </div>
                    )}

                    {selectedBlock.content.buttonText !== undefined && (
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] text-slate-500 dark:text-slate-400 mb-1">Botón Texto</label>
                          <input 
                            type="text" 
                            value={selectedBlock.content.buttonText || ''}
                            onChange={(e) => updateBlockContent(selectedBlock.id, { buttonText: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-lg bg-transparent text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-500 dark:text-slate-400 mb-1">Botón Enlace</label>
                          <input 
                            type="text" 
                            value={selectedBlock.content.buttonLink || ''}
                            onChange={(e) => updateBlockContent(selectedBlock.id, { buttonLink: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-lg bg-transparent text-xs"
                          />
                        </div>
                      </div>
                    )}

                    {selectedBlock.content.logo !== undefined && (
                      <div>
                        <label className="block text-[10px] text-slate-500 dark:text-slate-400 mb-1">Logo Header</label>
                        <input 
                          type="text" 
                          value={selectedBlock.content.logo || ''}
                          onChange={(e) => updateBlockContent(selectedBlock.id, { logo: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-lg bg-transparent text-xs"
                        />
                      </div>
                    )}

                    {selectedBlock.content.copyText !== undefined && (
                      <div>
                        <label className="block text-[10px] text-slate-500 dark:text-slate-400 mb-1">Copyright Footer</label>
                        <input 
                          type="text" 
                          value={selectedBlock.content.copyText || ''}
                          onChange={(e) => updateBlockContent(selectedBlock.id, { copyText: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-lg bg-transparent text-xs"
                        />
                      </div>
                    )}

                    {selectedBlock.content.imageUrl !== undefined && (
                      <div>
                        <label className="block text-[10px] text-slate-500 dark:text-slate-400 mb-1">Imagen URL</label>
                        <input 
                          type="text" 
                          value={selectedBlock.content.imageUrl || ''}
                          onChange={(e) => updateBlockContent(selectedBlock.id, { imageUrl: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-lg bg-transparent text-xs font-mono"
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* B. DESIGN TAB */}
                {activeInspectorTab === 'design' && (
                  <div className="flex flex-col gap-4 text-xs font-semibold">
                    <span className="text-[10px] text-gray-400 uppercase font-black tracking-wider">Espaciados y Apariencia</span>
                    
                    {/* Spacing (Padding) */}
                    <div>
                      <label className="block text-[10px] text-slate-500 dark:text-slate-400 mb-1">Espaciado Vertical (Padding)</label>
                      <select 
                        value={selectedBlock.styles.padding || 'py-16'}
                        onChange={(e) => updateBlockStyles(selectedBlock.id, { padding: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-lg bg-transparent text-xs"
                      >
                        <option value="py-10">py-10 (Bajo)</option>
                        <option value="py-20">py-20 (Medio)</option>
                        <option value="py-32">py-32 (Alto)</option>
                      </select>
                    </div>

                    {/* Colors */}
                    <div>
                      <label className="block text-[10px] text-slate-500 dark:text-slate-400 mb-1">Color Fondo (HEX)</label>
                      <div className="flex gap-2">
                        <input 
                          type="color" 
                          value={selectedBlock.styles.bgColor || '#ffffff'}
                          onChange={(e) => updateBlockStyles(selectedBlock.id, { bgColor: e.target.value })}
                          className="w-8 h-8 rounded cursor-pointer border border-slate-200 p-0"
                        />
                        <input 
                          type="text" 
                          value={selectedBlock.styles.bgColor || '#ffffff'}
                          onChange={(e) => updateBlockStyles(selectedBlock.id, { bgColor: e.target.value })}
                          className="flex-grow px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-lg bg-transparent text-xs font-mono"
                        />
                      </div>
                    </div>

                    {/* Typography alignments */}
                    <div>
                      <label className="block text-[10px] text-slate-500 dark:text-slate-400 mb-1">Alineación del Texto</label>
                      <div className="grid grid-cols-3 gap-1 bg-slate-50 p-1 rounded-lg">
                        {['left', 'center', 'right'].map(align => (
                          <button
                            key={align}
                            onClick={() => updateBlockStyles(selectedBlock.id, { textAlign: align as any })}
                            className={`py-1.5 text-[10px] font-bold rounded capitalize transition-all ${selectedBlock.styles.textAlign === align ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                          >
                            {align}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Borders */}
                    <div>
                      <label className="block text-[10px] text-slate-500 dark:text-slate-400 mb-1">Radio de Bordes</label>
                      <select 
                        value={selectedBlock.styles.borderRadius || 'none'}
                        onChange={(e) => updateBlockStyles(selectedBlock.id, { borderRadius: e.target.value as any })}
                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-lg bg-transparent text-xs"
                      >
                        <option value="none">Recto (Ninguno)</option>
                        <option value="md">Redondeado MD</option>
                        <option value="lg">Redondeado LG</option>
                        <option value="xl">Esquinas XL</option>
                        <option value="full">Cápsula (Full)</option>
                      </select>
                    </div>

                    {/* Animations */}
                    <div>
                      <label className="block text-[10px] text-slate-500 dark:text-slate-400 mb-1">Animación de Entrada</label>
                      <select 
                        value={selectedBlock.styles.animation || 'none'}
                        onChange={(e) => updateBlockStyles(selectedBlock.id, { animation: e.target.value as any })}
                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-lg bg-transparent text-xs"
                      >
                        <option value="none">Sin Animación</option>
                        <option value="fade-in">Desvanecimiento (Fade-in)</option>
                        <option value="slide-up">Desplazar Arriba (Slide-up)</option>
                        <option value="bounce">Rebote Lento (Bounce)</option>
                      </select>
                    </div>

                    {/* Responsive switches */}
                    <div className="flex flex-col gap-2 border-t border-slate-100 pt-4">
                      <span className="text-[10px] text-gray-400 uppercase font-black mb-1">Visibilidad en Dispositivos</span>
                      
                      <label className="flex items-center justify-between cursor-pointer">
                        <span className="text-xs text-slate-700">Ocultar en Móviles</span>
                        <input 
                          type="checkbox" 
                          checked={selectedBlock.responsive?.hideOnMobile || false}
                          onChange={(e) => updateBlockResponsive(selectedBlock.id, { hideOnMobile: e.target.checked })}
                          className="rounded text-primary-celeste focus:ring-0" 
                        />
                      </label>
                      
                      <label className="flex items-center justify-between cursor-pointer">
                        <span className="text-xs text-slate-700">Ocultar en Tabletas</span>
                        <input 
                          type="checkbox" 
                          checked={selectedBlock.responsive?.hideOnTablet || false}
                          onChange={(e) => updateBlockResponsive(selectedBlock.id, { hideOnTablet: e.target.checked })}
                          className="rounded text-primary-celeste focus:ring-0" 
                        />
                      </label>
                    </div>

                  </div>
                )}

                {/* C. SEO TAB */}
                {activeInspectorTab === 'seo' && (
                  <div className="flex flex-col gap-4 text-xs font-semibold">
                    <span className="text-[10px] text-gray-400 uppercase font-black tracking-wider">SEO y Accesibilidad del Bloque</span>
                    
                    <div>
                      <label className="block text-[10px] text-slate-500 dark:text-slate-400 mb-1">Meta Título local</label>
                      <input 
                        type="text" 
                        value={selectedBlock.seo?.metaTitle || ''}
                        onChange={(e) => updateBlockSeo(selectedBlock.id, { metaTitle: e.target.value })}
                        placeholder="Ej. Curso Online Next.js"
                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-lg bg-transparent text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-500 dark:text-slate-400 mb-1">Meta Descripción local</label>
                      <textarea 
                        rows={3}
                        value={selectedBlock.seo?.metaDesc || ''}
                        onChange={(e) => updateBlockSeo(selectedBlock.id, { metaDesc: e.target.value })}
                        placeholder="Ej. Inscríbete hoy en nuestro curso de bases de datos."
                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-lg bg-transparent text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-500 dark:text-slate-400 mb-1">Alt Text para Imágenes (Accesibilidad)</label>
                      <input 
                        type="text" 
                        value={selectedBlock.seo?.imageAlt || ''}
                        onChange={(e) => updateBlockSeo(selectedBlock.id, { imageAlt: e.target.value })}
                        placeholder="Ej. Banner con logo Celeste LMS"
                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-lg bg-transparent text-xs"
                      />
                    </div>
                  </div>
                )}

                {/* D. DYNAMIC DATA AND PERMISSIONS */}
                {activeInspectorTab === 'permissions' && (
                  <div className="flex flex-col gap-4 text-xs font-semibold">
                    
                    {/* Render Dynamic parameters if supported */}
                    {selectedBlock.dynamicSource ? (
                      <div className="flex flex-col gap-4">
                        <span className="text-[10px] text-gray-400 uppercase font-black tracking-wider">Mapeador de Capa Dinámica</span>
                        
                        <div>
                          <label className="block text-[10px] text-slate-500 dark:text-slate-400 mb-1">Origen de Datos (SaaS API)</label>
                          <select 
                            value={selectedBlock.dynamicSource.api}
                            onChange={(e) => updateBlockDynamicSource(selectedBlock.id, { api: e.target.value as any })}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-transparent text-xs font-bold text-primary-celeste"
                          >
                            <option value="native_ecommerce">Native E-Commerce (POS)</option>
                            <option value="native_lms">Native LMS Academy</option>
                            <option value="crm">CRM Testimonials / CMS</option>
                            <option value="medusa">Medusa External Catalog</option>
                          </select>
                        </div>

                        {selectedBlock.type === 'cms_collection_grid' && (
                          <div>
                            <label className="block text-[10px] text-slate-500 dark:text-slate-400 mb-1">Colección CMS de Destino</label>
                            <select 
                              value={selectedBlock.dynamicSource.collectionId || ''}
                              onChange={(e) => updateBlockDynamicSource(selectedBlock.id, { collectionId: e.target.value, endpoint: `/cms/${e.target.value}` })}
                              className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-transparent text-xs font-bold"
                            >
                              <option value="">Seleccione Colección...</option>
                              {dbAdapter.getCollections().filter(c => c.tenantId === activeTenant?.id).map(col => (
                                <option key={col.id} value={col.id}>{col.name}</option>
                              ))}
                            </select>
                            <span className="text-[9px] text-slate-400 mt-1 block">Mapea este bloque dinámico a los registros de tu CMS.</span>
                          </div>
                        )}

                        {selectedBlock.type === 'dynamic_product_grid' && (
                          <div>
                            <label className="block text-[10px] text-slate-500 dark:text-slate-400 mb-1">Colección / Categoría de Productos</label>
                            <select 
                              value={selectedBlock.dynamicSource.collectionId || 'all'}
                              onChange={(e) => updateBlockDynamicSource(selectedBlock.id, { collectionId: e.target.value })}
                              className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-transparent text-xs font-bold"
                            >
                              <option value="all">Todas las Colecciones</option>
                              <option value="Hardware">Hardware POS</option>
                              <option value="Terminales">Terminales POS</option>
                              <option value="Novedades">Colección Novedades (Moda)</option>
                            </select>
                            <span className="text-[9px] text-slate-400 mt-1 block">Filtra la cuadrícula de productos mostrada en tiempo real.</span>
                          </div>
                        )}


                        <div>
                          <label className="block text-[10px] text-slate-500 dark:text-slate-400 mb-1">API Endpoint</label>
                          <input 
                            type="text" 
                            value={selectedBlock.dynamicSource.endpoint}
                            onChange={(e) => updateBlockDynamicSource(selectedBlock.id, { endpoint: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-transparent text-xs font-mono"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-center text-slate-400 text-[10px]">
                        Este bloque es estático y no requiere mapeos dinámicos.
                      </div>
                    )}

                    {/* Permissions / Audience */}
                    <div className="border-t border-slate-100 pt-4 flex flex-col gap-3">
                      <span className="text-[10px] text-gray-400 uppercase font-black">Permisos de Visualización</span>
                      
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-600 text-[10px]">Público (Todos los usuarios)</span>
                      </div>
                      
                      <div className="flex items-center gap-2 opacity-50">
                        <Lock className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-600 text-[10px]">Solo Estudiantes Activos</span>
                      </div>
                    </div>

                  </div>
                )}

              </div>
            ) : (
              <div className="text-center py-24 px-4 text-gray-400 flex flex-col items-center gap-3">
                <HelpCircle className="w-10 h-10 text-primary-celeste opacity-40 animate-pulse" />
                <span className="font-bold text-xs text-borla-negro">Inspector Inactivo</span>
                <p className="text-xs max-w-[180px] leading-relaxed mx-auto">Selecciona cualquier bloque del lienzo para configurar su identidad, estilos, contenidos y capas de datos en tiempo real.</p>
              </div>
            )}
          </div>
        </aside>

      </div>

      {/* 5. VISUAL TEMPLATE CAROUSEL MODAL (CARROUSEL SELECTION) */}
      {showTemplatesModal && templates.length > 0 && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6 text-slate-800">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col relative animate-fade-in border border-slate-200">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary-celeste animate-pulse" /> Catálogo de Plantillas Globales (Odoo Blueprint)
                </h3>
                <p className="text-xs text-gray-500 mt-1">Busca, previsualiza e instancie la base maestra de tu sitio web.</p>
              </div>
              <button 
                onClick={() => setShowTemplatesModal(false)}
                className="p-1 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-slate-950 font-bold"
              >
                ✕
              </button>
            </div>

            {/* Carousel Container */}
            <div className="p-8 flex flex-col gap-6 items-center">
              {currentTemplate && (
                <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                  
                  {/* Left: preview image thumbnail */}
                  <div className="relative h-52 bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 shadow-md group">
                    <img 
                      src={currentTemplate.previewImage} 
                      alt={currentTemplate.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-3 left-3">
                      <span className={`px-2.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                        currentTemplate.category === 'education' ? 'bg-sky-500 text-white' : 'bg-green-500 text-white'
                      }`}>
                        {currentTemplate.category}
                      </span>
                    </div>
                    {currentTemplate.isPremium && (
                      <div className="absolute top-3 right-3 bg-yellow-500 text-slate-950 text-[8px] font-black uppercase px-2 py-0.5 rounded-full shadow">
                        ★ Premium
                      </div>
                    )}
                  </div>

                  {/* Right: info details */}
                  <div className="flex flex-col justify-between h-52 text-xs">
                    <div>
                      <span className="text-[10px] text-gray-400 uppercase font-black tracking-widest">{currentTemplate.industry}</span>
                      <h4 className="text-base font-black text-slate-900 mt-0.5">{currentTemplate.name}</h4>
                      <span className="text-[10px] text-slate-400 mt-1 block">Versión de tema: {currentTemplate.version}</span>
                      
                      <div className="mt-4 flex flex-col gap-1.5 font-bold">
                        <span className="text-[9px] text-slate-400 uppercase font-black tracking-wider block">Bloques incluidos:</span>
                        <div className="flex flex-wrap gap-1">
                          {currentTemplate.blocksIncluded.slice(0, 4).map((b, i) => (
                            <span key={i} className="px-2 py-0.5 bg-slate-50 border border-slate-200 rounded text-[9px] text-slate-500 font-semibold">{b}</span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2.5 mt-auto">
                      <button 
                        onClick={() => setDemoTemplateId(currentTemplate.id)}
                        className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl font-bold transition-all text-xs"
                      >
                        Ver Demo
                      </button>
                      <button 
                        onClick={() => handleLoadTemplate(currentTemplate.id)}
                        className="flex-grow px-4 py-2 bg-slate-900 hover:bg-primary-celeste hover:text-slate-950 text-white font-extrabold rounded-xl shadow-md transition-colors text-xs uppercase"
                      >
                        Usar Plantilla
                      </button>
                      <button 
                        onClick={() => handleDuplicateTemplate(currentTemplate)}
                        className="p-2 border border-slate-100 rounded-xl hover:bg-slate-50"
                        title="Duplicar en marketplace"
                      >
                        <Copy className="w-4 h-4 text-slate-500" />
                      </button>
                    </div>
                  </div>

                </div>
              )}

              {/* Slider indicators */}
              <div className="flex justify-between items-center w-full border-t border-slate-100 pt-6 mt-2">
                <button 
                  onClick={prevTemplate}
                  className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 font-bold text-xs flex items-center gap-1.5"
                >
                  <ChevronLeft className="w-4 h-4" /> Anterior
                </button>

                <div className="flex gap-1.5 items-center">
                  {templates.map((t, idx) => (
                    <span 
                      key={t.id} 
                      onClick={() => setCarouselIndex(idx)}
                      className={`w-2 h-2 rounded-full cursor-pointer transition-all ${carouselIndex === idx ? 'bg-primary-celeste w-4' : 'bg-slate-200'}`}
                    ></span>
                  ))}
                </div>

                <button 
                  onClick={nextTemplate}
                  className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 font-bold text-xs flex items-center gap-1.5"
                >
                  Siguiente <ChevronRight className="w-4 h-4" />
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* 6. DEMO PREVIEW MODAL FRAME */}
      {demoTemplateId && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 flex items-center justify-center p-10 text-slate-800">
          <div className="bg-white rounded-3xl w-full max-w-4xl h-[80vh] shadow-2xl flex flex-col relative border border-slate-200">
            
            {/* Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white rounded-t-3xl">
              <div>
                <span className="text-[10px] text-primary-celeste uppercase font-black block">VISTA PREVIA DE DEMO</span>
                <span className="font-extrabold text-sm block">Plantilla: {templates.find(t => t.id === demoTemplateId)?.name}</span>
              </div>
              <button 
                onClick={() => setDemoTemplateId(null)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-red-600 rounded-lg text-xs font-bold transition-all text-white"
              >
                Cerrar Demo
              </button>
            </div>

            {/* Scrollable layout view */}
            <div className="flex-grow overflow-y-auto p-8 bg-slate-50/50">
              {(() => {
                const tpl = templates.find(t => t.id === demoTemplateId);
                if (!tpl) return null;
                const blocks = JSON.parse(tpl.structureJson);
                return (
                  <div className="w-full flex flex-col border border-slate-200 rounded-2xl bg-white overflow-hidden shadow">
                    {blocks.map((b: any, i: number) => (
                      <div key={i} className="py-8 px-6 border-b border-slate-100 text-xs font-semibold">
                        <span className="text-[10px] text-primary-celeste uppercase font-bold block mb-2">{b.type}</span>
                        <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                          <span className="font-bold block text-slate-800">{b.content.title || b.content.logo || 'Bloque Estático'}</span>
                          <span className="text-slate-400 block mt-1">{b.content.subtitle || b.content.copyText}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>

          </div>
        </div>
      )}

      {/* 7. MODULE SWITCHER WARNING MODAL */}
      {moduleWarningModal.show && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6 text-slate-800">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-6 relative border border-slate-200 flex flex-col gap-4 text-xs font-semibold">
            <div className="p-3 bg-yellow-100 border border-yellow-200 text-yellow-800 rounded-2xl w-fit">
              <AlertTriangle className="w-6 h-6 animate-pulse" />
            </div>

            <div>
              <h4 className="text-base font-black text-slate-900">Módulos Inactivos en el Inquilino</h4>
              <p className="text-slate-500 mt-1.5 leading-relaxed">
                Esta plantilla contiene bloques dinámicos que requieren que habilites los siguientes módulos Odoo:
              </p>
              <ul className="list-disc pl-5 mt-2 flex flex-col gap-1 font-bold text-slate-800">
                {moduleWarningModal.missingModules.map((m, i) => (
                  <li key={i}>{m}</li>
                ))}
              </ul>
            </div>

            <div className="flex gap-2.5 mt-4">
              <button 
                onClick={() => setModuleWarningModal({ show: false, missingModules: [], targetTemplateId: null })}
                className="px-4 py-2.5 border border-slate-200 rounded-xl font-bold hover:bg-slate-50 transition-colors text-xs flex-grow"
              >
                Cancelar
              </button>
              <button 
                onClick={handleForceActivateModules}
                className="px-4 py-2.5 bg-slate-900 hover:bg-primary-celeste hover:text-slate-950 text-white font-extrabold rounded-xl shadow-md transition-colors text-xs flex-grow"
              >
                Activar e Instanciar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. EXTRACT CURRENT CANVAS AS MASTER TEMPLATE MODAL */}
      {showExtractModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6 text-slate-800">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-6 border border-slate-200 flex flex-col gap-4 text-xs font-semibold">
            <div>
              <h4 className="text-base font-black text-slate-900">Extraer Página como Plantilla Global</h4>
              <p className="text-slate-500 mt-1 leading-relaxed">Guarda la estructura actual del lienzo en la biblioteca global de temas.</p>
            </div>

            <form onSubmit={handleExtractTemplate} className="flex flex-col gap-4">
              <div>
                <label className="block text-[10px] text-slate-500 dark:text-slate-400 mb-1">Nombre de la Plantilla</label>
                <input 
                  required 
                  type="text" 
                  placeholder="Ej. Restaurante Premium Delicia"
                  value={extractName}
                  onChange={(e) => setExtractName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-slate-500 dark:text-slate-400 mb-1">Categoría</label>
                  <select 
                    value={extractCategory}
                    onChange={(e) => setExtractCategory(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                  >
                    <option value="corporate">Corporativo</option>
                    <option value="ecommerce">Ecommerce</option>
                    <option value="education">Educación</option>
                    <option value="restaurant">Restaurante</option>
                  </select>
                </div>
                <div className="flex items-center justify-between border border-slate-100 rounded-xl px-3 mt-4">
                  <span className="text-xs text-slate-700">Premium</span>
                  <input 
                    type="checkbox" 
                    checked={extractPremium}
                    onChange={(e) => setExtractPremium(e.target.checked)}
                    className="rounded text-primary-celeste focus:ring-0" 
                  />
                </div>
              </div>

              <div className="flex gap-2.5 mt-4">
                <button 
                  type="button" 
                  onClick={() => setShowExtractModal(false)}
                  className="w-1/2 py-2.5 border border-slate-200 rounded-xl font-bold hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="w-1/2 py-2.5 bg-slate-900 text-white font-extrabold rounded-xl hover:bg-primary-celeste hover:text-slate-950 transition-colors"
                >
                  Crear Master Tema
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 9. ONBOARDING CREAR NUEVO SITIO WEB WIZARD */}
      {onboardingStep > 0 && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-6 text-slate-800">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl p-8 border border-[#bce6ed]/30 flex flex-col gap-6 relative overflow-hidden">
            {/* Corner glow */}
            <div className="absolute -top-12 -right-12 w-28 h-28 bg-primary-celeste/20 rounded-full blur-2xl"></div>

            {/* Step indicator */}
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-1 rounded-full text-xs font-black ${onboardingStep === 1 ? 'bg-primary-celeste text-slate-950' : 'bg-slate-100 text-slate-400'}`}>1</span>
              <div className="w-12 h-1 bg-slate-200 rounded"></div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-black ${onboardingStep === 2 ? 'bg-primary-celeste text-slate-950' : 'bg-slate-100 text-slate-400'}`}>2</span>
            </div>

            {onboardingStep === 1 && (
              <div className="flex flex-col gap-6">
                <div>
                  <span className="text-[10px] text-primary-celeste uppercase font-black tracking-widest block font-bold">Paso 1 de 2: Configuración del Sitio</span>
                  <h3 className="text-2xl font-black text-slate-900 mt-1">Crear Nuevo Sitio Web</h3>
                  <p className="text-xs text-slate-500 mt-1">Comencemos a estructurar tu espacio en la red. Selecciona el enfoque vertical de tu negocio.</p>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  {[
                    { id: 'all', label: 'Ver Todo', desc: 'Mostrar catálogo completo de temas' },
                    { id: 'ecommerce', label: 'eCommerce / Ventas', desc: 'Tiendas de ropa, hardware y POS' },
                    { id: 'education', label: 'LMS / Academia', desc: 'Cursos virtuales y aulas' }
                  ].map((focus) => (
                    <button
                      key={focus.id}
                      type="button"
                      onClick={() => setOnboardingFocus(focus.id as any)}
                      className={`p-4 border rounded-2xl flex flex-col justify-between text-left transition-all h-32 ${
                        onboardingFocus === focus.id 
                          ? 'border-primary-celeste bg-celeste-claro/10 text-slate-900 font-bold shadow-md' 
                          : 'border-slate-100 bg-slate-50/50 hover:bg-slate-100/40 text-slate-600'
                      }`}
                    >
                      <span className="font-extrabold text-xs block">{focus.label}</span>
                      <span className="text-[10px] text-slate-400 block leading-snug mt-2">{focus.desc}</span>
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setOnboardingStep(2)}
                  className="mt-4 w-full py-3.5 bg-slate-900 hover:bg-primary-celeste hover:text-slate-950 text-white font-extrabold rounded-xl shadow-lg transition-colors flex items-center justify-center gap-1.5"
                >
                  Siguiente paso: Elegir Plantilla <ChevronRight className="w-4 h-4 text-primary-celeste" />
                </button>
              </div>
            )}

            {onboardingStep === 2 && (
              <div className="flex flex-col gap-6">
                <div>
                  <span className="text-[10px] text-primary-celeste uppercase font-black tracking-widest block font-bold">Paso 2 de 2: Elegir Plantilla</span>
                  <h3 className="text-2xl font-black text-slate-900 mt-1">Marketplace de Plantillas</h3>
                  <p className="text-xs text-slate-500 mt-1">Selecciona una plantilla para clonar su diseño y crear la página de inicio en Supabase.</p>
                </div>

                {/* Templates list based on focus filter */}
                <div className="grid grid-cols-2 gap-4 max-h-[300px] overflow-y-auto pr-2">
                  {templates
                    .filter(t => onboardingFocus === 'all' || t.category === onboardingFocus)
                    .map((tpl) => (
                      <div 
                        key={tpl.id}
                        onClick={() => handleLoadTemplate(tpl.id)}
                        className="p-4 border border-slate-100 hover:border-primary-celeste rounded-2xl bg-slate-50/30 hover:bg-celeste-claro/5 cursor-pointer flex gap-4 transition-all relative overflow-hidden group"
                      >
                        <img src={tpl.previewImage} alt={tpl.name} className="w-16 h-16 object-cover rounded-lg shrink-0 border" />
                        <div className="flex-grow flex flex-col justify-between">
                          <div>
                            <span className="font-extrabold text-xs text-slate-900 block group-hover:text-primary-celeste transition-colors">{tpl.name}</span>
                            <span className="text-[9px] text-slate-400 block mt-0.5">{tpl.industry}</span>
                          </div>
                          <span className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono font-bold w-fit mt-2">v{tpl.version}</span>
                        </div>
                        {tpl.isPremium && (
                          <span className="absolute top-2 right-2 bg-yellow-500 text-slate-950 text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full shadow">PRO</span>
                        )}
                      </div>
                    ))}
                </div>

                <div className="flex gap-3 mt-4 border-t border-slate-100 pt-4">
                  <button
                    type="button"
                    onClick={() => setOnboardingStep(1)}
                    className="w-1/3 py-3 border border-slate-200 hover:bg-slate-50 font-bold rounded-xl text-xs transition-colors"
                  >
                    Atrás
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleLoadTemplate('tpl-minimalist', true);
                    }}
                    className="w-2/3 py-3 bg-slate-900 hover:bg-primary-celeste hover:text-slate-950 text-white font-extrabold rounded-xl shadow-lg transition-colors flex items-center justify-center gap-1 text-xs"
                  >
                    Usar Moda Minimalista (Recomendado) <Check className="w-4 h-4 text-primary-celeste" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}