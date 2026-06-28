'use client';

import React, { useState, useEffect } from 'react';
import { useBuilderStore, type Block } from '@/store/builderStore';
import { dbAdapter, type Product, type Course } from '@/lib/supabase';
import { 
  BookOpen, ShoppingBag, Terminal, CheckCircle, 
  HelpCircle, Star, Mail, ArrowRight, User, Calendar, Plus, Trash2, ArrowUp, ArrowDown 
} from 'lucide-react';

interface PageRendererProps {
  isEditor?: boolean;
}

export default function PageRenderer({ isEditor = false }: PageRendererProps) {
  const { 
    structure, 
    selectedBlockId, 
    setSelectedBlockId, 
    updateBlockContent, 
    reorderBlocks, 
    removeBlock,
    addBlock 
  } = useBuilderStore();

  const triggerWorkflowSimulation = (triggerEvent: string, details: string) => {
    const activeTenant = dbAdapter.getActiveTenant();
    const wfs = dbAdapter.getWorkflows().filter(w => w.tenantId === activeTenant.id && w.trigger === triggerEvent && w.active);
    wfs.forEach(wf => {
      dbAdapter.addAuditLog(
        activeTenant.id, 
        'system@SaaS.com', 
        `Workflow: ${wf.name}`, 
        `Gatillado con éxito: Ejecutó acciones: ${wf.actions.join(', ')}. Detalle: ${details}`
      );
    });
  };


  const [products, setProducts] = useState<Product[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [activeTab, setActiveTab] = useState<number>(0);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [draggedBlockIndex, setDraggedBlockIndex] = useState<number | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [contactSuccess, setContactSuccess] = useState(false);
  const [newsletterSuccess, setNewsletterSuccess] = useState(false);

  useEffect(() => {
    setIsClient(true);
    setProducts(dbAdapter.getProducts());
    setCourses(dbAdapter.getCourses());
  }, []);

  if (!isClient) return null;

  // Spacing class resolver
  const getPaddingClass = (padding?: string) => {
    switch (padding) {
      case 'py-10': return 'py-10';
      case 'py-20': return 'py-20';
      case 'py-32': return 'py-32';
      default: return 'py-16';
    }
  };

  // Border radius class resolver
  const getRadiusClass = (radius?: string) => {
    switch (radius) {
      case 'none': return 'rounded-none';
      case 'md': return 'rounded-md';
      case 'lg': return 'rounded-lg';
      case 'xl': return 'rounded-2xl';
      case 'full': return 'rounded-full';
      default: return '';
    }
  };

  // Text alignment class resolver
  const getAlignClass = (align?: string) => {
    switch (align) {
      case 'center': return 'text-center items-center justify-center';
      case 'right': return 'text-right items-end justify-end';
      default: return 'text-left items-start justify-start';
    }
  };

  // Animation class resolver
  const getAnimClass = (anim?: string) => {
    switch (anim) {
      case 'fade-in': return 'animate-fade-in';
      case 'slide-up': return 'animate-slide-up';
      case 'bounce': return 'animate-bounce-slow';
      default: return '';
    }
  };

  // Responsive class resolver
  const getResponsiveClass = (resp?: Block['responsive']) => {
    if (!resp) return '';
    const classes = [];
    if (resp.hideOnMobile) classes.push('max-md:hidden');
    if (resp.hideOnTablet) classes.push('md:max-lg:hidden');
    return classes.join(' ');
  };

  // Drag and drop handlers for reordering existing blocks
  const handleDragStart = (e: React.DragEvent, index: number) => {
    if (!isEditor) return;
    setDraggedBlockIndex(index);
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (!isEditor) return;
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    if (!isEditor) return;
    e.preventDefault();
    const sourceIdxStr = e.dataTransfer.getData('text/plain');
    if (sourceIdxStr === '') return; // Came from sidebar
    const sourceIndex = parseInt(sourceIdxStr, 10);
    if (sourceIndex !== targetIndex) {
      reorderBlocks(sourceIndex, targetIndex);
    }
    setDraggedBlockIndex(null);
  };

  // Drop zone for new blocks from sidebar
  const handleSidebarDrop = (e: React.DragEvent, targetIndex: number) => {
    if (!isEditor) return;
    e.preventDefault();
    const blockType = e.dataTransfer.getData('builder/block-type') as Block['type'];
    if (blockType) {
      addBlock(blockType, targetIndex);
    }
  };

  // Course enrollment action
  const handleEnroll = (courseId: string) => {
    dbAdapter.enrollInCourse(courseId);
    alert('¡Inscripción exitosa! Redirigiendo a tu aula virtual...');
    window.location.href = `/cursos`;
  };

  return (
    <div className="w-full min-h-screen bg-background text-foreground transition-colors duration-300">
      
      {/* Empty Canvas Indicator */}
      {structure.blocks.length === 0 && (
        <div 
          onDragOver={handleDragOver}
          onDrop={(e) => handleSidebarDrop(e, 0)}
          className="flex flex-col items-center justify-center border-4 border-dashed border-celeste-claro/50 rounded-2xl p-20 m-10 text-center bg-celeste-claro/5"
        >
          <Plus className="w-12 h-12 text-primary-celeste mb-4 animate-bounce" />
          <h3 className="text-xl font-bold text-borla-negro">El lienzo está vacío</h3>
          <p className="text-texto-n mt-2 max-w-sm">Arrastra bloques desde la barra lateral izquierda y suéltalos aquí para diseñar tu página.</p>
        </div>
      )}

      {structure.blocks.map((block, idx) => {
        // Visibility filter in production storefront
        if (block.isVisible === false && !isEditor) return null;

        const paddingClass = getPaddingClass(block.styles.padding);
        const radiusClass = getRadiusClass(block.styles.borderRadius);
        const alignClass = getAlignClass(block.styles.textAlign);
        const animClass = getAnimClass(block.styles.animation);
        const responsiveClass = getResponsiveClass(block.responsive);
        
        // Inline text update helper
        const handleTextChange = (field: string, val: string) => {
          updateBlockContent(block.id, { [field]: val });
        };

        const isSelected = selectedBlockId === block.id;
        const isHidden = block.isVisible === false;

        return (
          <div key={block.id} className="relative group/block">
            
            {/* Drop Zone above block (when editing) */}
            {isEditor && (
              <div 
                onDragOver={handleDragOver}
                onDrop={(e) => {
                  const sourceIndexStr = e.dataTransfer.getData('text/plain');
                  if (sourceIndexStr !== '') {
                    handleDrop(e, idx);
                  } else {
                    handleSidebarDrop(e, idx);
                  }
                }}
                className="h-3 hover:h-8 hover:bg-primary-celeste/20 border-t border-dashed border-primary-celeste/30 transition-all duration-200 cursor-pointer flex items-center justify-center"
              >
                <span className="hidden group-hover/block:inline text-xs text-primary-celeste font-semibold">Soltar Bloque Aquí</span>
              </div>
            )}

            {/* Block Wrapper */}
            <div
              onClick={(e) => {
                if (isEditor) {
                  e.stopPropagation();
                  setSelectedBlockId(block.id);
                }
              }}
              className={`w-full transition-all duration-300 ${isEditor ? 'hover:ring-2 hover:ring-primary-celeste/50' : ''} ${
                isSelected ? 'ring-2 ring-primary-celeste ring-offset-2' : ''
              } ${block.isGlobal && isEditor ? 'border-2 border-yellow-400 bg-yellow-50/5' : ''} ${
                isHidden && isEditor ? 'opacity-40 border-2 border-dashed border-red-300' : ''
              } ${responsiveClass}`}
            >
              
              {/* Contextual Action Overlay for Editor */}
              {isEditor && isSelected && (
                <div className={`absolute -top-10 left-4 z-50 flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full shadow-lg ${
                  block.isGlobal ? 'bg-yellow-500 text-slate-950 font-black' : 'bg-borla-negro text-white'
                }`}>
                  <span className="font-bold uppercase tracking-wider text-[10px]">{block.isGlobal ? '🗲 Global Block' : block.type}</span>
                  <span className="text-[10px] opacity-60">v{block.version}</span>
                  {isHidden && <span className="px-1.5 py-0.5 bg-red-600 text-white rounded text-[9px] font-bold">Oculto</span>}
                  <div 
                    draggable
                    onDragStart={(e) => handleDragStart(e, idx)}
                    className="cursor-move hover:underline px-1 font-semibold"
                    title="Arrastrar para reordenar"
                  >
                    ☰ Mover
                  </div>
                  <button 
                    onClick={() => removeBlock(block.id)}
                    className="text-red-400 hover:text-red-600 ml-1.5"
                    title="Eliminar bloque"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Render Block Content */}
              <div 
                className={`${paddingClass} ${radiusClass} ${animClass} px-6 md:px-12 flex flex-col`}
                style={{ 
                  backgroundColor: block.styles.bgColor || 'transparent',
                  textAlign: block.styles.textAlign || 'left'
                }}
              >
                
                {/* 1. HEADER BLOCK */}
                {block.type === 'header' && (() => {
                  const activeTenant = dbAdapter.getActiveTenant();
                  const dbPages = dbAdapter.getPages().filter(
                    p => p.tenantId === activeTenant?.id && !p.isDeleted && p.status === 'published'
                  );
                  const linksToRender = dbPages.length > 0 
                    ? dbPages.map(p => ({ label: p.title, url: p.slug === 'inicio' ? '/' : `/${p.slug}` }))
                    : (block.content.links || []);
                  return (
                    <header className="w-full flex items-center justify-between border-b border-celeste-claro/30 pb-4">
                      <div 
                        contentEditable={isEditor}
                        suppressContentEditableWarning
                        onBlur={(e) => handleTextChange('logo', e.target.innerText)}
                        className="text-2xl font-bold text-primary-celeste cursor-text inline-edit-ring"
                      >
                        {block.content.logo}
                      </div>
                      <nav className="hidden md:flex items-center gap-6">
                        {linksToRender.map((link: any, lidx: number) => (
                          <a 
                            key={lidx} 
                            href={link.url}
                            className="text-texto-n hover:text-primary-celeste font-medium transition-colors"
                          >
                            {link.label}
                          </a>
                        ))}
                      </nav>
                    </header>
                  );
                })()}

                {/* 2. FOOTER BLOCK */}
                {block.type === 'footer' && (() => {
                  const activeTenant = dbAdapter.getActiveTenant();
                  const dbPages = dbAdapter.getPages().filter(
                    p => p.tenantId === activeTenant?.id && !p.isDeleted && p.status === 'published'
                  );
                  const linksToRender = dbPages.length > 0 
                    ? dbPages.map(p => ({ label: p.title, url: p.slug === 'inicio' ? '/' : `/${p.slug}` }))
                    : (block.content.links || []);
                  return (
                    <footer className="w-full text-center border-t border-celeste-claro/20 pt-8 flex flex-col items-center gap-4">
                      <div className="flex items-center gap-6 mb-2">
                        {linksToRender.map((link: any, lidx: number) => (
                          <a key={lidx} href={link.url} className="text-gray-400 hover:text-primary-celeste transition-colors text-sm">
                            {link.label}
                          </a>
                        ))}
                      </div>
                      <p 
                        contentEditable={isEditor}
                        suppressContentEditableWarning
                        onBlur={(e) => handleTextChange('copyText', e.target.innerText)}
                        className="text-xs text-gray-500 cursor-text inline-edit-ring"
                      >
                        {block.content.copyText}
                      </p>
                    </footer>
                  );
                })()}

                {/* 3. COLUMNS LAYOUT BLOCK */}
                {block.type === 'columns_layout' && (
                  <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="flex flex-col gap-2 p-6 rounded-xl border border-celeste-claro/20 bg-white/50 dark:bg-black/20 backdrop-blur-sm">
                      <h4 
                        contentEditable={isEditor}
                        suppressContentEditableWarning
                        onBlur={(e) => handleTextChange('col1_title', e.target.innerText)}
                        className="text-lg font-bold text-borla-negro inline-edit-ring cursor-text"
                      >
                        {block.content.col1_title}
                      </h4>
                      <p 
                        contentEditable={isEditor}
                        suppressContentEditableWarning
                        onBlur={(e) => handleTextChange('col1_text', e.target.innerText)}
                        className="text-sm text-texto-n inline-edit-ring cursor-text"
                      >
                        {block.content.col1_text}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 p-6 rounded-xl border border-celeste-claro/20 bg-white/50 dark:bg-black/20 backdrop-blur-sm">
                      <h4 
                        contentEditable={isEditor}
                        suppressContentEditableWarning
                        onBlur={(e) => handleTextChange('col2_title', e.target.innerText)}
                        className="text-lg font-bold text-borla-negro inline-edit-ring cursor-text"
                      >
                        {block.content.col2_title}
                      </h4>
                      <p 
                        contentEditable={isEditor}
                        suppressContentEditableWarning
                        onBlur={(e) => handleTextChange('col2_text', e.target.innerText)}
                        className="text-sm text-texto-n inline-edit-ring cursor-text"
                      >
                        {block.content.col2_text}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 p-6 rounded-xl border border-celeste-claro/20 bg-white/50 dark:bg-black/20 backdrop-blur-sm">
                      <h4 
                        contentEditable={isEditor}
                        suppressContentEditableWarning
                        onBlur={(e) => handleTextChange('col3_title', e.target.innerText)}
                        className="text-lg font-bold text-borla-negro inline-edit-ring cursor-text"
                      >
                        {block.content.col3_title}
                      </h4>
                      <p 
                        contentEditable={isEditor}
                        suppressContentEditableWarning
                        onBlur={(e) => handleTextChange('col3_text', e.target.innerText)}
                        className="text-sm text-texto-n inline-edit-ring cursor-text"
                      >
                        {block.content.col3_text}
                      </p>
                    </div>
                  </div>
                )}

                {/* 4. DIVIDER BLOCK */}
                {block.type === 'divider' && (
                  <div className="w-full flex justify-center py-2">
                    <hr 
                      className={`${block.content.lineWidth || 'w-full'} border-t`}
                      style={{ borderColor: block.content.lineColor || '#e5e7eb' }}
                    />
                  </div>
                )}

                {/* 5. HERO (IMAGE/VIDEO) BLOCK */}
                {block.type === 'hero' && (
                  <div className={`w-full flex flex-col md:flex-row items-center gap-12 ${alignClass}`}>
                    <div className="flex-1 flex flex-col gap-6">
                      <h1 
                        contentEditable={isEditor}
                        suppressContentEditableWarning
                        onBlur={(e) => handleTextChange('title', e.target.innerText)}
                        onDoubleClick={(e) => {
                          if (isEditor) {
                            e.currentTarget.focus();
                            const range = document.createRange();
                            range.selectNodeContents(e.currentTarget);
                            const sel = window.getSelection();
                            if (sel) {
                              sel.removeAllRanges();
                              sel.addRange(range);
                            }
                          }
                        }}
                        className="text-4xl md:text-5xl font-black text-borla-negro leading-tight inline-edit-ring cursor-text"
                        title={isEditor ? "Doble clic para editar" : undefined}
                      >
                        {block.content.title}
                      </h1>
                      <p 
                        contentEditable={isEditor}
                        suppressContentEditableWarning
                        onBlur={(e) => handleTextChange('subtitle', e.target.innerText)}
                        onDoubleClick={(e) => {
                          if (isEditor) {
                            e.currentTarget.focus();
                            const range = document.createRange();
                            range.selectNodeContents(e.currentTarget);
                            const sel = window.getSelection();
                            if (sel) {
                              sel.removeAllRanges();
                              sel.addRange(range);
                            }
                          }
                        }}
                        className="text-lg text-texto-n/90 max-w-xl inline-edit-ring cursor-text"
                        title={isEditor ? "Doble clic para editar" : undefined}
                      >
                        {block.content.subtitle}
                      </p>
                      <div className="flex gap-4 mt-2">
                        <a 
                          href={block.content.buttonLink || '#'}
                          className="px-8 py-3.5 bg-borla-negro text-white rounded-full font-bold shadow-lg hover:scale-105 transition-transform flex items-center gap-2"
                        >
                          {block.content.buttonText || 'Explorar'} <ArrowRight className="w-4 h-4 text-primary-celeste" />
                        </a>
                      </div>
                    </div>
                    <div className="flex-1 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl border-4 border-celeste-claro/30 bg-black/10">
                      {block.content.videoUrl ? (
                        <video 
                          src={block.content.videoUrl} 
                          controls 
                          muted 
                          autoPlay 
                          loop 
                          className="w-full aspect-video object-cover"
                        />
                      ) : (
                        <img 
                          src={block.content.imageUrl || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80'} 
                          alt="Hero Banner" 
                          className="w-full object-cover"
                        />
                      )}
                    </div>
                  </div>
                )}

                {/* 6. RICH TEXT BLOCK */}
                {block.type === 'rich_text' && (
                  <div className="max-w-3xl mx-auto flex flex-col gap-4">
                    <h2 
                      contentEditable={isEditor}
                      suppressContentEditableWarning
                      onBlur={(e) => handleTextChange('title', e.target.innerText)}
                      className="text-3xl font-extrabold text-borla-negro cursor-text inline-edit-ring"
                    >
                      {block.content.title}
                    </h2>
                    <p 
                      contentEditable={isEditor}
                      suppressContentEditableWarning
                      onBlur={(e) => handleTextChange('bodyText', e.target.innerText)}
                      className="text-texto-n leading-relaxed cursor-text inline-edit-ring whitespace-pre-wrap"
                    >
                      {block.content.bodyText}
                    </p>
                  </div>
                )}

                {/* 7. GALLERY BLOCK */}
                {block.type === 'gallery' && (
                  <div className="w-full">
                    <h2 
                      contentEditable={isEditor}
                      suppressContentEditableWarning
                      onBlur={(e) => handleTextChange('title', e.target.innerText)}
                      className="text-2xl font-bold mb-8 text-borla-negro cursor-text inline-edit-ring"
                    >
                      {block.content.title}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {(block.content.images || []).map((img: any, idx: number) => (
                        <div key={idx} className="group/item rounded-xl overflow-hidden shadow-lg border border-celeste-claro/20 bg-white dark:bg-black/30">
                          <img src={img.url} alt={img.title} className="w-full h-48 object-cover group-hover/item:scale-105 transition-transform duration-300" />
                          <div className="p-4 text-center font-semibold text-sm text-texto-n">{img.title}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 8. FAQ ACCORDION BLOCK */}
                {block.type === 'accordion_faq' && (
                  <div className="max-w-2xl mx-auto w-full">
                    <h2 
                      contentEditable={isEditor}
                      suppressContentEditableWarning
                      onBlur={(e) => handleTextChange('title', e.target.innerText)}
                      className="text-2xl font-bold mb-8 text-borla-negro cursor-text inline-edit-ring"
                    >
                      {block.content.title}
                    </h2>
                    <div className="flex flex-col gap-4">
                      {(block.content.faqs || []).map((faq: any, idx: number) => (
                        <div key={idx} className="border border-celeste-claro/30 rounded-xl overflow-hidden bg-white/50 dark:bg-black/10">
                          <button 
                            onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                            className="w-full flex items-center justify-between p-5 font-bold text-left hover:bg-celeste-claro/10 transition-colors"
                          >
                            <span>{faq.q}</span>
                            <HelpCircle className="w-5 h-5 text-primary-celeste" />
                          </button>
                          {activeFaq === idx && (
                            <div className="p-5 border-t border-celeste-claro/10 bg-celeste-claro/5 text-sm leading-relaxed text-texto-n">
                              {faq.a}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 9. TABS SECTION BLOCK */}
                {block.type === 'tabs_section' && (
                  <div className="w-full max-w-4xl mx-auto">
                    <div className="flex border-b border-celeste-claro/30 gap-4 mb-6">
                      {(block.content.tabs || []).map((tab: any, idx: number) => (
                        <button 
                          key={idx}
                          onClick={() => setActiveTab(idx)}
                          className={`pb-3 font-bold text-sm transition-colors border-b-2 ${
                            activeTab === idx 
                              ? 'border-primary-celeste text-primary-celeste' 
                              : 'border-transparent text-gray-500 hover:text-borla-negro'
                          }`}
                        >
                          {tab.title}
                        </button>
                      ))}
                    </div>
                    <div className="p-6 rounded-xl bg-white dark:bg-black/20 shadow-md border border-celeste-claro/20 text-texto-n text-left min-h-[100px]">
                      {block.content.tabs?.[activeTab]?.content}
                    </div>
                  </div>
                )}

                {/* 10. COUNTER STATS BLOCK */}
                {block.type === 'counter_stats' && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full text-center">
                    {(block.content.stats || []).map((stat: any, idx: number) => (
                      <div key={idx} className="flex flex-col gap-1.5 p-6">
                        <span className="text-4xl font-extrabold text-primary-celeste">{stat.number}</span>
                        <span className="text-sm font-semibold text-gray-400 tracking-wider uppercase">{stat.label}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* 11. DYNAMIC PRODUCT GRID BLOCK */}
                {block.type === 'dynamic_product_grid' && (
                  <div className="w-full">
                    <div className="text-center mb-10">
                      <h2 
                        contentEditable={isEditor}
                        suppressContentEditableWarning
                        onBlur={(e) => handleTextChange('title', e.target.innerText)}
                        className="text-3xl font-black text-borla-negro cursor-text inline-edit-ring"
                      >
                        {block.content.title}
                      </h2>
                      <p 
                        contentEditable={isEditor}
                        suppressContentEditableWarning
                        onBlur={(e) => handleTextChange('subtitle', e.target.innerText)}
                        className="text-texto-n mt-2 cursor-text inline-edit-ring"
                      >
                        {block.content.subtitle}
                      </p>
                    </div>
                    
                    {/* Live Query simulation */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      {products
                        .filter(p => !block.dynamicSource?.collectionId || block.dynamicSource.collectionId === 'all' || p.category === block.dynamicSource.collectionId)
                        .slice(0, block.dynamicSource?.limit || 3)
                        .map((prod) => (
                          <div key={prod.id} className="flex flex-col rounded-2xl overflow-hidden border border-celeste-claro/30 bg-white dark:bg-black/20 shadow-lg group">
                            <div className="relative aspect-square overflow-hidden bg-gray-100">
                              <img src={prod.imageUrl} alt={prod.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                              <span className="absolute top-3 right-3 px-3 py-1 bg-primary-celeste text-white font-bold text-xs rounded-full">
                                {prod.category}
                              </span>
                            </div>
                            <div className="p-6 flex flex-col flex-grow">
                              <h3 className="font-bold text-lg text-borla-negro">{prod.name}</h3>
                              <span className="text-xs text-gray-400 mt-1">Barcode: {prod.barcode}</span>
                              <div className="flex items-center justify-between mt-auto pt-6">
                                <span className="text-xl font-black text-borla-negro">${prod.price.toFixed(2)}</span>
                                <a 
                                  href="/pos" 
                                  className="px-4 py-2 bg-borla-negro text-white rounded-lg text-xs font-bold hover:bg-primary-celeste hover:text-white transition-colors"
                                >
                                  Comprar POS
                                </a>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* 12. CATEGORY CAROUSEL BLOCK */}
                {block.type === 'category_carousel' && (
                  <div className="w-full text-center">
                    <h2 className="text-2xl font-bold mb-8 text-borla-negro">{block.content.title}</h2>
                    <div className="flex items-center gap-6 overflow-x-auto pb-4 scrollbar-thin">
                      {Array.from(new Set(products.map(p => p.category))).map((cat, idx) => (
                        <div 
                          key={idx} 
                          className="flex-shrink-0 px-8 py-5 border border-celeste-claro/40 rounded-xl bg-celeste-claro/10 hover:bg-celeste-claro/20 cursor-pointer font-bold text-texto-n transition-colors"
                        >
                          <ShoppingBag className="w-6 h-6 text-primary-celeste mx-auto mb-2" />
                          <span>{cat}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 13. LMS COURSE LIST BLOCK */}
                {block.type === 'lms_course_list' && (
                  <div className="w-full">
                    <div className="text-center mb-10">
                      <h2 
                        contentEditable={isEditor}
                        suppressContentEditableWarning
                        onBlur={(e) => handleTextChange('title', e.target.innerText)}
                        className="text-3xl font-black text-borla-negro cursor-text inline-edit-ring"
                      >
                        {block.content.title}
                      </h2>
                      <p 
                        contentEditable={isEditor}
                        suppressContentEditableWarning
                        onBlur={(e) => handleTextChange('subtitle', e.target.innerText)}
                        className="text-texto-n mt-2 cursor-text inline-edit-ring"
                      >
                        {block.content.subtitle}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                      {courses.slice(0, block.dynamicSource?.limit || 2).map((course) => (
                        <div key={course.id} className="flex flex-col md:flex-row rounded-2xl overflow-hidden border border-celeste-claro/30 bg-white dark:bg-black/20 shadow-lg">
                          <img src={course.thumbnail} alt={course.title} className="w-full md:w-44 object-cover aspect-video md:aspect-auto" />
                          <div className="p-6 flex flex-col justify-between flex-grow">
                            <div>
                               <h3 className="font-extrabold text-lg text-borla-negro leading-snug">{course.title}</h3>
                               <p className="text-xs text-texto-n mt-2">{course.description}</p>
                               <div className="flex items-center gap-4 text-xs text-gray-500 mt-4">
                                 <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5 text-primary-celeste" /> {course.lessonsCount} lecciones</span>
                                 <span className="flex items-center gap-1"><User className="w-3.5 h-3.5 text-primary-celeste" /> {course.instructorName}</span>
                               </div>
                            </div>
                            <div className="flex items-center justify-between mt-6 pt-4 border-t border-celeste-claro/10">
                               <span className="text-xl font-black text-borla-negro">${course.price.toFixed(2)}</span>
                               <button 
                                 onClick={() => handleEnroll(course.id)}
                                 className="px-5 py-2 bg-primary-celeste text-white font-bold rounded-lg text-xs shadow-md hover:scale-105 transition-transform"
                               >
                                 Matricularse
                               </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 13b. RESERVATIONS CALENDAR BLOCK */}
                {block.type === 'reservations_calendar' && (
                  <div className="max-w-xl mx-auto w-full p-6 bg-white dark:bg-black/20 rounded-3xl border border-celeste-claro/30 shadow-lg text-slate-800">
                    <div className="text-center mb-6">
                      <h2 
                        contentEditable={isEditor}
                        suppressContentEditableWarning
                        onBlur={(e) => handleTextChange('title', e.target.innerText)}
                        className="text-2xl font-black text-slate-900 dark:text-white cursor-text inline-edit-ring"
                      >
                        {block.content.title || 'Reserva tu Cita Online'}
                      </h2>
                      <p 
                        contentEditable={isEditor}
                        suppressContentEditableWarning
                        onBlur={(e) => handleTextChange('subtitle', e.target.innerText)}
                        className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 cursor-text inline-edit-ring"
                      >
                        {block.content.subtitle || 'Elige un horario disponible para agendar tu cita.'}
                      </p>
                    </div>

                    <div className="flex flex-col gap-4 text-xs font-semibold">
                      <div className="grid grid-cols-3 gap-2">
                        {['09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM', '03:00 PM', '04:00 PM'].map((slot, i) => (
                          <button
                            key={i}
                            type="button"
                            className="py-2.5 text-center bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-primary-celeste hover:bg-celeste-claro/10 transition-all font-bold text-slate-800 dark:text-slate-200"
                            onClick={() => alert(`Horario seleccionado: ${slot}`)}
                          >
                            {slot}
                          </button>
                        ))}
                      </div>

                      <div className="flex flex-col gap-3 mt-4 border-t border-slate-100 dark:border-slate-800/80 pt-4">
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] text-slate-400">Nombre Completo</label>
                          <input 
                            type="text" 
                            id="res-name-input"
                            placeholder="Ej. Juan Pérez" 
                            className="px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-transparent text-xs text-slate-900 dark:text-white"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] text-slate-400">Correo Electrónico</label>
                          <input 
                            type="email" 
                            id="res-email-input"
                            placeholder="juan@gmail.com" 
                            className="px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-transparent text-xs text-slate-900 dark:text-white"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            const nameEl = document.getElementById('res-name-input') as HTMLInputElement;
                            const emailEl = document.getElementById('res-email-input') as HTMLInputElement;
                            const name = nameEl?.value || 'Anónimo';
                            const email = emailEl?.value || 'anonimo@gmail.com';
                            
                            const activeTenant = dbAdapter.getActiveTenant();
                            const resList = dbAdapter.getReservations();
                            const newRes = {
                              id: 'res-' + Date.now(),
                              tenantId: activeTenant.id,
                              customerName: name,
                              email: email,
                              dateTime: '2026-06-16 10:00 AM',
                              serviceName: 'Consulta General Reservada'
                            };
                            resList.push(newRes);
                            dbAdapter.saveReservations(resList);
                            triggerWorkflowSimulation('reservation_created', `Cita de servicio agendada para ${name} (${email}).`);
                            alert(`¡Cita reservada con éxito para ${name}! Podrás verla en tu Panel de Inquilino.`);
                            if (nameEl) nameEl.value = '';
                            if (emailEl) emailEl.value = '';
                          }}
                          className="w-full py-3 bg-slate-950 dark:bg-white dark:text-slate-950 text-white font-extrabold rounded-xl hover:bg-primary-celeste dark:hover:bg-primary-celeste transition-colors shadow"
                        >
                          Confirmar Reserva
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* 13c. CMS COLLECTION GRID BLOCK */}
                {block.type === 'cms_collection_grid' && (
                  <div className="w-full">
                    <div className="text-center mb-10">
                      <h2 
                        contentEditable={isEditor}
                        suppressContentEditableWarning
                        onBlur={(e) => handleTextChange('title', e.target.innerText)}
                        className="text-3xl font-black text-slate-900 dark:text-white cursor-text inline-edit-ring"
                      >
                        {block.content.title || 'Colección CMS Dinámica'}
                      </h2>
                      <p 
                        contentEditable={isEditor}
                        suppressContentEditableWarning
                        onBlur={(e) => handleTextChange('subtitle', e.target.innerText)}
                        className="text-texto-n mt-2 cursor-text inline-edit-ring font-bold"
                      >
                        {block.content.subtitle || 'Registros del CMS en tiempo real.'}
                      </p>
                    </div>

                    {/* Render CMS items list */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                      {dbAdapter.getCmsItems()
                        .filter(item => item.collectionId === block.dynamicSource?.collectionId)
                        .slice(0, block.dynamicSource?.limit || 4)
                        .map((item) => {
                          const col = dbAdapter.getCollections().find(c => c.id === item.collectionId);
                          const getFieldName = (f: any): string => typeof f === 'string' ? f : (f?.name || 'campo');
                          const titleField = getFieldName(col?.fields[0]) || 'titulo';
                          const subtitleField = getFieldName(col?.fields[1]) || 'autor';
                          const contentField = getFieldName(col?.fields[2]) || 'contenido';
                          const dateField = getFieldName(col?.fields[3]) || 'fecha';

                          return (
                            <div key={item.id} className="p-6 rounded-2xl border border-celeste-claro/30 bg-white dark:bg-slate-900/60 shadow-md flex flex-col justify-between">
                              <div>
                                <span className="text-[10px] font-black uppercase text-primary-celeste tracking-wider">
                                  {item.data[subtitleField] || 'CMS Record'}
                                </span>
                                <h4 className="font-extrabold text-slate-800 dark:text-white mt-1 leading-snug">
                                  {item.data[titleField] || 'Sin Título'}
                                </h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2.5 leading-relaxed line-clamp-3">
                                  {item.data[contentField] || 'Sin contenido.'}
                                </p>
                              </div>
                              <div className="border-t border-slate-100 dark:border-slate-800/80 pt-3 mt-4 flex items-center justify-between text-[10px] text-gray-400 font-bold font-mono">
                                <span>ID: {item.id}</span>
                                <span>{item.data[dateField] || new Date(item.createdAt).toLocaleDateString()}</span>
                              </div>
                            </div>
                          );
                        })}
                      {dbAdapter.getCmsItems().filter(item => item.collectionId === block.dynamicSource?.collectionId).length === 0 && (
                        <div className="col-span-2 text-center py-10 text-slate-400 border border-dashed border-slate-200 rounded-2xl text-xs font-bold bg-slate-50/50">
                          No hay registros cargados en esta colección CMS todavía.
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 14. UPCOMING EVENTS BLOCK */}
                {block.type === 'upcoming_events' && (

                  <div className="max-w-3xl mx-auto w-full">
                    <h2 className="text-2xl font-bold mb-8 text-borla-negro text-center">{block.content.title}</h2>
                    <div className="flex flex-col gap-4">
                      {[
                        { title: 'Clase en Vivo: RLS y Seguridad en PostgreSQL', date: 'Junio 12, 2026 - 19:00', instructor: 'Rubén Castillo' },
                        { title: 'Workshop POS: Integración Local de Recibos Térmicos', date: 'Junio 18, 2026 - 15:00', instructor: 'Sarah Connor' }
                      ].map((evt, idx) => (
                        <div key={idx} className="flex gap-4 items-center p-5 border border-celeste-claro/30 rounded-xl bg-white dark:bg-black/10">
                          <div className="p-3 bg-celeste-claro/20 rounded-lg text-primary-celeste">
                            <Calendar className="w-6 h-6" />
                          </div>
                          <div>
                            <h4 className="font-bold text-borla-negro">{evt.title}</h4>
                            <div className="flex gap-4 text-xs text-gray-500 mt-1">
                              <span>📅 {evt.date}</span>
                              <span>👨‍🏫 {evt.instructor}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 15. TESTIMONIALS CRM BLOCK */}
                {block.type === 'testimonials_crm' && (
                  <div className="w-full text-center max-w-3xl mx-auto">
                    <h2 className="text-2xl font-bold mb-8 text-borla-negro">{block.content.title}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {[
                        { name: 'Daniela Flores', role: 'Gerente General', text: 'El POS offline nos salvó durante un corte de internet de 3 horas. ¡Sincronizó todo al instante!', stars: 5 },
                        { name: 'Carlos Roca', role: 'Director de Academia', text: 'El módulo LMS integrado con Stripe nos permitió duplicar las ventas de cursos en un mes.', stars: 5 },
                        { name: 'Mateo Banzer', role: 'Editor de Contenido', text: 'El constructor visual es rapidísimo. Ahorramos horas de maquetación HTML.', stars: 4 }
                      ].map((t, idx) => (
                        <div key={idx} className="p-6 border border-celeste-claro/20 rounded-2xl bg-white dark:bg-black/20 shadow-md text-left flex flex-col justify-between">
                          <p className="text-sm text-texto-n italic leading-relaxed">"{t.text}"</p>
                          <div className="mt-6">
                            <div className="flex gap-0.5 text-yellow-400 mb-2">
                              {Array.from({ length: t.stars }).map((_, s) => (
                                <Star key={s} className="w-3.5 h-3.5 fill-current" />
                              ))}
                            </div>
                            <h4 className="font-extrabold text-sm text-borla-negro">{t.name}</h4>
                            <span className="text-xs text-gray-400">{t.role}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 16. CONTACT FORM BLOCK */}
                {block.type === 'contact_form' && (
                  <div className="max-w-md mx-auto w-full p-8 border border-celeste-claro/30 rounded-2xl bg-white dark:bg-black/20 shadow-xl">
                    <h2 
                      contentEditable={isEditor}
                      suppressContentEditableWarning
                      onBlur={(e) => handleTextChange('title', e.target.innerText)}
                      className="text-2xl font-bold text-borla-negro cursor-text inline-edit-ring"
                    >
                      {block.content.title}
                    </h2>
                    <p 
                      contentEditable={isEditor}
                      suppressContentEditableWarning
                      onBlur={(e) => handleTextChange('subtitle', e.target.innerText)}
                      className="text-sm text-texto-n mt-2 mb-6 cursor-text inline-edit-ring"
                    >
                      {block.content.subtitle}
                    </p>

                    {contactSuccess ? (
                      <div className="p-4 bg-green-50 dark:bg-green-900/10 border border-green-200 text-green-700 dark:text-green-400 rounded-xl text-center font-bold text-sm">
                        ¡Mensaje enviado con éxito! Nos contactaremos pronto.
                      </div>
                    ) : (
                      <form onSubmit={(e) => { 
                        e.preventDefault(); 
                        setContactSuccess(true); 
                        triggerWorkflowSimulation('contact_form_submit', 'Formulario de contacto completado por visitante.');
                      }} className="flex flex-col gap-4">

                        <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Nombre Completo</label>
                          <input required type="text" className="w-full px-4 py-2 border border-celeste-claro rounded-xl bg-transparent focus:ring-1 focus:ring-primary-celeste" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Correo Electrónico</label>
                          <input required type="email" className="w-full px-4 py-2 border border-celeste-claro rounded-xl bg-transparent focus:ring-1 focus:ring-primary-celeste" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Mensaje</label>
                          <textarea required rows={4} className="w-full px-4 py-2 border border-celeste-claro rounded-xl bg-transparent focus:ring-1 focus:ring-primary-celeste" />
                        </div>
                        <button type="submit" className="w-full py-3 bg-borla-negro text-white font-bold rounded-xl mt-2 hover:bg-primary-celeste transition-colors flex items-center justify-center gap-2">
                          {block.content.buttonText || 'Enviar'} <Mail className="w-4 h-4" />
                        </button>
                      </form>
                    )}
                  </div>
                )}

                {/* 17. NEWSLETTER SUBSCRIPTION BLOCK */}
                {block.type === 'newsletter_sub' && (
                  <div className="max-w-xl mx-auto w-full text-center">
                    <h2 
                      contentEditable={isEditor}
                      suppressContentEditableWarning
                      onBlur={(e) => handleTextChange('title', e.target.innerText)}
                      className="text-3xl font-black text-borla-negro cursor-text inline-edit-ring"
                    >
                      {block.content.title}
                    </h2>
                    <p 
                      contentEditable={isEditor}
                      suppressContentEditableWarning
                      onBlur={(e) => handleTextChange('subtitle', e.target.innerText)}
                      className="text-texto-n mt-2 mb-8 cursor-text inline-edit-ring"
                    >
                      {block.content.subtitle}
                    </p>

                    {newsletterSuccess ? (
                      <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl font-bold text-sm">
                        ¡Gracias por suscribirte a nuestro boletín informativo!
                      </div>
                    ) : (
                      <form onSubmit={(e) => { 
                        e.preventDefault(); 
                        setNewsletterSuccess(true); 
                        triggerWorkflowSimulation('contact_form_submit', 'Newsletter suscripción completada por visitante.');
                      }} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">

                        <input required type="email" placeholder="tucorreo@empresa.com" className="flex-grow px-5 py-3 border border-white bg-white/50 backdrop-blur rounded-full focus:ring-1 focus:ring-primary-celeste" />
                        <button type="submit" className="px-8 py-3 bg-borla-negro text-white font-bold rounded-full hover:scale-105 transition-transform">
                          {block.content.buttonText || 'Suscribir'}
                        </button>
                      </form>
                    )}
                  </div>
                )}

                {/* 18. CALL TO ACTION (CTA) BANNER BLOCK */}
                {block.type === 'cta_banner' && (
                  <div className="w-full text-center flex flex-col items-center gap-4 text-white">
                    <h2 
                      contentEditable={isEditor}
                      suppressContentEditableWarning
                      onBlur={(e) => handleTextChange('title', e.target.innerText)}
                      className="text-3xl font-black cursor-text inline-edit-ring"
                    >
                      {block.content.title}
                    </h2>
                    <p 
                      contentEditable={isEditor}
                      suppressContentEditableWarning
                      onBlur={(e) => handleTextChange('subtitle', e.target.innerText)}
                      className="text-gray-300 max-w-lg cursor-text inline-edit-ring"
                    >
                      {block.content.subtitle}
                    </p>
                    <a 
                      href={block.content.buttonLink || '#'}
                      className="mt-4 px-8 py-3.5 bg-primary-celeste text-white font-bold rounded-full shadow-lg hover:scale-105 transition-transform"
                    >
                      {block.content.buttonText || 'Empezar'}
                    </a>
                  </div>
                )}

                {/* 19. PRICING TABLE BLOCK */}
                {block.type === 'pricing_table' && (
                  <div className="w-full">
                    <div className="text-center mb-12">
                      <h2 
                        contentEditable={isEditor}
                        suppressContentEditableWarning
                        onBlur={(e) => handleTextChange('title', e.target.innerText)}
                        className="text-3xl font-black text-borla-negro cursor-text inline-edit-ring"
                      >
                        {block.content.title}
                      </h2>
                      <p 
                        contentEditable={isEditor}
                        suppressContentEditableWarning
                        onBlur={(e) => handleTextChange('subtitle', e.target.innerText)}
                        className="text-texto-n mt-2 cursor-text inline-edit-ring"
                      >
                        {block.content.subtitle}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                      {/* Starter Card */}
                      <div className="flex flex-col border border-celeste-claro/30 rounded-2xl p-8 bg-white dark:bg-black/20 shadow-lg">
                        <span className="font-extrabold text-sm uppercase tracking-widest text-gray-400">Starter</span>
                        <span className="text-4xl font-black text-borla-negro mt-4">$19<span className="text-sm font-medium text-gray-500">/mes</span></span>
                        <p className="text-xs text-gray-400 mt-2">Para tiendas físicas pequeñas.</p>
                        <hr className="border-t border-celeste-claro/20 my-6" />
                        <ul className="flex flex-col gap-3 text-sm text-texto-n mb-8 text-left">
                          <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-primary-celeste" /> 1 Terminal POS Local</li>
                          <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-primary-celeste" /> Soporte Offline-First</li>
                          <li className="flex items-center gap-2 text-gray-400"><CheckCircle className="w-4 h-4 opacity-40" /> Aula LMS Virtual (No)</li>
                        </ul>
                        <a href="/login" className="w-full py-3 border border-borla-negro text-borla-negro text-center font-bold rounded-xl mt-auto hover:bg-borla-negro hover:text-white transition-all">Seleccionar Plan</a>
                      </div>

                      {/* Pro Card */}
                      <div className="flex flex-col border-2 border-primary-celeste rounded-2xl p-8 bg-white dark:bg-black/20 shadow-2xl relative">
                        <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary-celeste text-white font-extrabold text-xs rounded-full uppercase tracking-wider shadow">Recomendado</span>
                        <span className="font-extrabold text-sm uppercase tracking-widest text-primary-celeste mt-2">Pro</span>
                        <span className="text-4xl font-black text-borla-negro mt-4">$49<span className="text-sm font-medium text-gray-500">/mes</span></span>
                        <p className="text-xs text-gray-400 mt-2">Para academias y comercio combinado.</p>
                        <hr className="border-t border-celeste-claro/20 my-6" />
                        <ul className="flex flex-col gap-3 text-sm text-texto-n mb-8 text-left">
                          <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-primary-celeste" /> 3 Terminales POS Sincronizados</li>
                          <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-primary-celeste" /> Aula LMS y Cursos Ilimitados</li>
                          <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-primary-celeste" /> Dominio Personalizado CNAME</li>
                        </ul>
                        <a href="/login" className="w-full py-3 bg-primary-celeste text-white text-center font-bold rounded-xl mt-auto shadow-md hover:scale-105 transition-transform">Seleccionar Plan</a>
                      </div>

                      {/* Enterprise Card */}
                      <div className="flex flex-col border border-celeste-claro/30 rounded-2xl p-8 bg-white dark:bg-black/20 shadow-lg">
                        <span className="font-extrabold text-sm uppercase tracking-widest text-gray-400">Enterprise</span>
                        <span className="text-4xl font-black text-borla-negro mt-4">$99<span className="text-sm font-medium text-gray-500">/mes</span></span>
                        <p className="text-xs text-gray-400 mt-2">Para corporaciones y franquicias.</p>
                        <hr className="border-t border-celeste-claro/20 my-6" />
                        <ul className="flex flex-col gap-3 text-sm text-texto-n mb-8 text-left">
                          <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-primary-celeste" /> Terminales POS Ilimitados</li>
                          <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-primary-celeste" /> Base de Datos Postgres Dedicada</li>
                          <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-primary-celeste" /> Soporte SLA 24/7 Telefónico</li>
                        </ul>
                        <a href="/login" className="w-full py-3 border border-borla-negro text-borla-negro text-center font-bold rounded-xl mt-auto hover:bg-borla-negro hover:text-white transition-all">Seleccionar Plan</a>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </div>

            {/* Drop Zone below block (when editing) */}
            {isEditor && (
              <div 
                onDragOver={handleDragOver}
                onDrop={(e) => {
                  const sourceIndexStr = e.dataTransfer.getData('text/plain');
                  if (sourceIndexStr !== '') {
                    handleDrop(e, idx + 1);
                  } else {
                    handleSidebarDrop(e, idx + 1);
                  }
                }}
                className="h-3 hover:h-8 hover:bg-primary-celeste/20 border-b border-dashed border-primary-celeste/30 transition-all duration-200 cursor-pointer flex items-center justify-center"
              >
                <span className="hidden group-hover/block:inline text-xs text-primary-celeste font-semibold">Soltar Bloque Aquí</span>
              </div>
            )}

          </div>
        );
      })}

    </div>
  );
}