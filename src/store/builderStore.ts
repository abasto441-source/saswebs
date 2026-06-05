import { create } from 'zustand';
import { dbAdapter } from '@/lib/supabase';

export interface Block {
  id: string;
  // Capa de Identidad
  type:
    | 'header'
    | 'footer'
    | 'columns_layout'
    | 'divider'
    | 'hero'
    | 'rich_text'
    | 'gallery'
    | 'accordion_faq'
    | 'tabs_section'
    | 'counter_stats'
    | 'dynamic_product_grid'
    | 'category_carousel'
    | 'lms_course_list'
    | 'upcoming_events'
    | 'testimonials_crm'
    | 'contact_form'
    | 'newsletter_sub'
    | 'cta_banner'
    | 'pricing_table'
    | 'reservations_calendar'
    | 'cms_collection_grid';
  version: string;

  
  isVisible?: boolean; // Visibility switcher
  isGlobal?: boolean; // Global blocks flag
  globalBlockId?: string; // Reference to synchronized global block

  // SEO layer metadata
  seo?: {
    metaTitle?: string;
    metaDesc?: string;
    imageAlt?: string;
  };

  // Responsive display controls
  responsive?: {
    hideOnMobile?: boolean;
    hideOnTablet?: boolean;
  };

  // Capa de Estilos (Settings)
  styles: {
    padding?: string; // e.g. "py-10", "py-20", "py-32"
    bgColor?: string; // Hex, e.g. "#ffffff", "#f3f4f6"
    textAlign?: 'left' | 'center' | 'right';
    borderRadius?: 'none' | 'md' | 'lg' | 'xl' | 'full';
    animation?: 'none' | 'fade-in' | 'slide-up' | 'bounce';
    customClasses?: string;
  };

  // Capa de Contenido (Static content)
  content: Record<string, any>;

  // Capa Dinámica (Dynamic Source)
  dynamicSource?: {
    api: 'medusa' | 'native_lms' | 'native_ecommerce' | 'crm';
    endpoint: string; // e.g. "/products", "/courses", "/events"
    collectionId?: string; // e.g. "ofertas", "all"
    limit?: number; // e.g. 4
  };
}

export interface PageStructure {
  blocks: Block[];
}

interface BuilderState {
  pageId: string | null;
  slug: string;
  title: string;
  isPublished: boolean;
  structure: PageStructure;
  selectedBlockId: string | null;
  
  // Actions
  initPage: (pageId: string, slug: string, title: string, isPublished: boolean, structure: PageStructure) => void;
  addBlock: (type: Block['type'], index?: number) => void;
  removeBlock: (id: string) => void;
  duplicateBlock: (id: string) => void;
  toggleBlockVisibility: (id: string) => void;
  convertToGlobal: (id: string, name: string) => void;
  updateGlobalBlock: (globalBlockId: string, content: Record<string, any>, styles: Partial<Block['styles']>) => void;
  updateBlockContent: (id: string, newContent: Record<string, any>) => void;
  updateBlockStyles: (id: string, newStyles: Partial<Block['styles']>) => void;
  updateBlockDynamicSource: (id: string, newSource: Partial<Block['dynamicSource']>) => void;
  updateBlockSeo: (id: string, seoData: Partial<Block['seo']>) => void;
  updateBlockResponsive: (id: string, responsiveData: Partial<Block['responsive']>) => void;
  reorderBlocks: (startIndex: number, endIndex: number) => void;
  setSelectedBlockId: (id: string | null) => void;
  resetBuilder: () => void;
}

// 16 Default templates mapped to the 4-layer structure
export const DEFAULT_BLOCK_TEMPLATES: Record<Block['type'], Partial<Block>> = {
  header: {
    version: '1.0.0',
    isVisible: true,
    styles: { padding: 'py-4', bgColor: '#ffffff', textAlign: 'left', borderRadius: 'none', animation: 'none' },
    content: {
      logo: '🎓 NRAM360',
      links: [
        { label: 'Inicio', url: '/' },
        { label: 'Cursos', url: '/cursos' },
        { label: 'Tienda', url: '/pos' },
        { label: 'Contacto', url: '#contacto' }
      ]
    }
  },
  footer: {
    version: '1.0.0',
    isVisible: true,
    styles: { padding: 'py-12', bgColor: '#1f2937', textAlign: 'center', borderRadius: 'none', animation: 'none' },
    content: {
      copyText: '© 2026 NRAM360 SaaS Ecosystem. Todos los derechos reservados.',
      links: [
        { label: 'Términos', url: '#' },
        { label: 'Privacidad', url: '#' },
        { label: 'Soporte', url: '#' }
      ]
    }
  },
  columns_layout: {
    version: '1.0.0',
    isVisible: true,
    styles: { padding: 'py-12', bgColor: '#ffffff', textAlign: 'left', borderRadius: 'md', animation: 'fade-in' },
    content: {
      col1_title: 'Soporte 24/7',
      col1_text: 'Nuestro equipo de ingenieros está listo para resolver tus incidentes en tiempo récord.',
      col2_title: 'Hosting CNAME',
      col2_text: 'Apunta tu propio dominio con certificados SSL administrados automáticamente.',
      col3_title: 'Pagos Locales',
      col3_text: 'Integración bancaria nativa QR y pasarelas de pago de última generación.'
    }
  },
  divider: {
    version: '1.0.0',
    isVisible: true,
    styles: { padding: 'py-6', bgColor: '#ffffff', textAlign: 'center', borderRadius: 'none', animation: 'none' },
    content: {
      lineColor: '#e5e7eb',
      lineWidth: 'w-full'
    }
  },
  hero: {
    version: '1.0.0',
    isVisible: true,
    styles: { padding: 'py-24', bgColor: '#6ac4d7', textAlign: 'center', borderRadius: 'xl', animation: 'slide-up' },
    content: {
      title: 'Construye el Futuro de tu Negocio',
      subtitle: 'La plataforma SaaS Odoo-Style que combina LMS educativo y POS de ventas.',
      buttonText: 'Empezar Ahora',
      buttonLink: '#cursos',
      imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80',
      videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-software-developer-working-on-his-computer-34323-large.mp4'
    }
  },
  rich_text: {
    version: '1.0.0',
    isVisible: true,
    styles: { padding: 'py-12', bgColor: '#ffffff', textAlign: 'left', borderRadius: 'none', animation: 'fade-in' },
    content: {
      title: 'Nuestra Filosofía de Trabajo',
      bodyText: 'Creamos sistemas web autogestionables y modulares. Cada parte del negocio se encuentra conectada: facturación, inventario, progreso académico de alumnos y reportes en tiempo real.'
    }
  },
  gallery: {
    version: '1.0.0',
    isVisible: true,
    styles: { padding: 'py-12', bgColor: '#f9fafb', textAlign: 'center', borderRadius: 'lg', animation: 'fade-in' },
    content: {
      title: 'Nuestras Instalaciones & Eventos',
      images: [
        { url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&auto=format&fit=crop&q=80', title: 'Conferencias Tech' },
        { url: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=400&auto=format&fit=crop&q=80', title: 'Aulas Modernas' },
        { url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400&auto=format&fit=crop&q=80', title: 'Equipo Creativo' }
      ]
    }
  },
  accordion_faq: {
    version: '1.0.0',
    isVisible: true,
    styles: { padding: 'py-12', bgColor: '#ffffff', textAlign: 'left', borderRadius: 'md', animation: 'fade-in' },
    content: {
      title: 'Preguntas Frecuentes',
      faqs: [
        { q: '¿Cómo funciona el modo POS offline?', a: 'Toda la venta se registra en la base de datos local IndexedDB y se sincroniza al recuperar la conexión.' },
        { q: '¿Puedo conectar mi propio dominio?', a: 'Sí, a través de la sección de CNAME y DNS del panel administrativo.' }
      ]
    }
  },
  tabs_section: {
    version: '1.0.0',
    isVisible: true,
    styles: { padding: 'py-12', bgColor: '#f3f4f6', textAlign: 'center', borderRadius: 'lg', animation: 'none' },
    content: {
      tabs: [
        { title: 'LMS Educativo', content: 'Crea cursos virtuales, gestiona inscripciones y sigue el progreso.' },
        { title: 'POS Ventas', content: 'Facturación en cajas con emulador de lector de tarjetas y códigos.' },
        { title: 'Multi-inquilino', content: 'Aislamiento lógico de base de datos para máxima seguridad.' }
      ]
    }
  },
  counter_stats: {
    version: '1.0.0',
    isVisible: true,
    styles: { padding: 'py-12', bgColor: '#111827', textAlign: 'center', borderRadius: 'xl', animation: 'bounce' },
    content: {
      stats: [
        { number: '10K+', label: 'Estudiantes Activos' },
        { number: '2.5M+', label: 'Transacciones POS' },
        { number: '99.9%', label: 'Uptime Cloudflare' }
      ]
    }
  },
  dynamic_product_grid: {
    version: '1.0.0',
    isVisible: true,
    styles: { padding: 'py-12', bgColor: '#ffffff', textAlign: 'center', borderRadius: 'lg', animation: 'fade-in' },
    content: {
      title: 'Nuestros Productos Destacados',
      subtitle: 'Compre hardware certificado compatible con nuestro software POS.'
    },
    dynamicSource: {
      api: 'native_ecommerce',
      endpoint: '/products',
      collectionId: 'Hardware',
      limit: 4
    }
  },
  category_carousel: {
    version: '1.0.0',
    isVisible: true,
    styles: { padding: 'py-12', bgColor: '#f9fafb', textAlign: 'center', borderRadius: 'none', animation: 'none' },
    content: {
      title: 'Explorar Categorías de Hardware'
    },
    dynamicSource: {
      api: 'native_ecommerce',
      endpoint: '/categories',
      collectionId: 'all',
      limit: 4
    }
  },
  lms_course_list: {
    version: '1.0.0',
    isVisible: true,
    styles: { padding: 'py-16', bgColor: '#ffffff', textAlign: 'center', borderRadius: 'lg', animation: 'slide-up' },
    content: {
      title: 'Cursos Destacados y Certificados',
      subtitle: 'Matricúlate hoy y aprende desarrollo web con instructores certificados.'
    },
    dynamicSource: {
      api: 'native_lms',
      endpoint: '/courses',
      collectionId: 'all',
      limit: 3
    }
  },
  upcoming_events: {
    version: '1.0.0',
    isVisible: true,
    styles: { padding: 'py-12', bgColor: '#f3f4f6', textAlign: 'left', borderRadius: 'md', animation: 'none' },
    content: {
      title: 'Próximos Webinars y Clases en Vivo'
    },
    dynamicSource: {
      api: 'native_lms',
      endpoint: '/events',
      collectionId: 'webinars',
      limit: 3
    }
  },
  testimonials_crm: {
    version: '1.0.0',
    isVisible: true,
    styles: { padding: 'py-12', bgColor: '#ffffff', textAlign: 'center', borderRadius: 'xl', animation: 'fade-in' },
    content: {
      title: 'Lo que dicen nuestros clientes'
    },
    dynamicSource: {
      api: 'crm',
      endpoint: '/testimonials',
      collectionId: 'reviews',
      limit: 3
    }
  },
  contact_form: {
    version: '1.0.0',
    isVisible: true,
    styles: { padding: 'py-12', bgColor: '#f9fafb', textAlign: 'left', borderRadius: 'lg', animation: 'fade-in' },
    content: {
      title: '¿Tienes alguna pregunta?',
      subtitle: 'Envíanos un mensaje y te responderemos en menos de 24 horas.',
      buttonText: 'Enviar Mensaje',
      destinationEmail: 'soporte@nram360.com'
    }
  },
  newsletter_sub: {
    version: '1.0.0',
    isVisible: true,
    styles: { padding: 'py-16', bgColor: '#bce6ed', textAlign: 'center', borderRadius: 'xl', animation: 'slide-up' },
    content: {
      title: 'Suscríbete a nuestro Boletín',
      subtitle: 'Entérate de las últimas actualizaciones, ofertas y nuevos cursos antes que nadie.',
      buttonText: 'Suscribirme'
    }
  },
  cta_banner: {
    version: '1.0.0',
    isVisible: true,
    styles: { padding: 'py-12', bgColor: '#000000', textAlign: 'center', borderRadius: 'lg', animation: 'bounce' },
    content: {
      title: '¿Listo para digitalizar tu negocio?',
      subtitle: 'Activa tu membresía SaaS en 2 minutos y accede a la tienda y LMS.',
      buttonText: 'Probar Gratis 14 Días',
      buttonLink: '/login'
    }
  },
  pricing_table: {
    version: '1.0.0',
    isVisible: true,
    styles: { padding: 'py-16', bgColor: '#ffffff', textAlign: 'center', borderRadius: 'xl', animation: 'slide-up' },
    content: {
      title: 'Planes de Suscripción Flexibles',
      subtitle: 'Elige el plan ideal para expandir tu negocio físico y academia virtual.'
    }
  },
  reservations_calendar: {
    version: '1.0.0',
    isVisible: true,
    styles: { padding: 'py-16', bgColor: '#ffffff', textAlign: 'center', borderRadius: 'xl', animation: 'fade-in' },
    content: {
      title: 'Reserva tu Cita Online',
      subtitle: 'Elige un horario disponible para agendar tu cita.'
    }
  },
  cms_collection_grid: {
    version: '1.0.0',
    isVisible: true,
    styles: { padding: 'py-16', bgColor: '#ffffff', textAlign: 'center', borderRadius: 'xl', animation: 'fade-in' },
    content: {
      title: 'Contenido Dinámico del CMS',
      subtitle: 'Explora nuestros registros estructurados actualizados al minuto.'
    },
    dynamicSource: {
      api: 'crm',
      endpoint: '/cms',
      collectionId: 'col-articles',
      limit: 4
    }
  }
};


const INITIAL_PAGE_STRUCTURE: PageStructure = {
  blocks: [
    {
      id: 'b-header',
      type: 'header',
      version: '1.0.0',
      isVisible: true,
      styles: { padding: 'py-4', bgColor: '#ffffff', textAlign: 'left', borderRadius: 'none', animation: 'none' },
      content: { ...DEFAULT_BLOCK_TEMPLATES.header.content }
    },
    {
      id: 'b-hero',
      type: 'hero',
      version: '1.0.0',
      isVisible: true,
      styles: { padding: 'py-20', bgColor: '#6ac4d7', textAlign: 'center', borderRadius: 'xl', animation: 'slide-up' },
      content: { ...DEFAULT_BLOCK_TEMPLATES.hero.content }
    },
    {
      id: 'b-lms',
      type: 'lms_course_list',
      version: '1.0.0',
      isVisible: true,
      styles: { padding: 'py-12', bgColor: '#ffffff', textAlign: 'center', borderRadius: 'lg', animation: 'fade-in' },
      content: { ...DEFAULT_BLOCK_TEMPLATES.lms_course_list.content },
      dynamicSource: { ...DEFAULT_BLOCK_TEMPLATES.lms_course_list.dynamicSource! }
    },
    {
      id: 'b-pos-prod',
      type: 'dynamic_product_grid',
      version: '1.0.0',
      isVisible: true,
      styles: { padding: 'py-12', bgColor: '#f9fafb', textAlign: 'center', borderRadius: 'lg', animation: 'fade-in' },
      content: { ...DEFAULT_BLOCK_TEMPLATES.dynamic_product_grid.content },
      dynamicSource: { ...DEFAULT_BLOCK_TEMPLATES.dynamic_product_grid.dynamicSource! }
    },
    {
      id: 'b-faq',
      type: 'accordion_faq',
      version: '1.0.0',
      isVisible: true,
      styles: { padding: 'py-12', bgColor: '#ffffff', textAlign: 'left', borderRadius: 'md', animation: 'none' },
      content: { ...DEFAULT_BLOCK_TEMPLATES.accordion_faq.content }
    },
    {
      id: 'b-newsletter',
      type: 'newsletter_sub',
      version: '1.0.0',
      isVisible: true,
      styles: { padding: 'py-12', bgColor: '#bce6ed', textAlign: 'center', borderRadius: 'xl', animation: 'slide-up' },
      content: { ...DEFAULT_BLOCK_TEMPLATES.newsletter_sub.content }
    },
    {
      id: 'b-footer',
      type: 'footer',
      version: '1.0.0',
      isVisible: true,
      styles: { padding: 'py-8', bgColor: '#1f2937', textAlign: 'center', borderRadius: 'none', animation: 'none' },
      content: { ...DEFAULT_BLOCK_TEMPLATES.footer.content }
    }
  ]
};

export const useBuilderStore = create<BuilderState>((set) => ({
  pageId: 'p-home',
  slug: 'inicio',
  title: 'Página de Inicio',
  isPublished: true,
  structure: INITIAL_PAGE_STRUCTURE,
  selectedBlockId: null,

  initPage: (pageId, slug, title, isPublished, structure) => {
    set({ pageId, slug, title, isPublished, structure, selectedBlockId: null });
  },

  addBlock: (type, index) => {
    set((state) => {
      const template = DEFAULT_BLOCK_TEMPLATES[type];
      const newBlock: Block = {
        id: `block-${Math.random().toString(36).substr(2, 9)}`,
        type,
        version: template.version || '1.0.0',
        isVisible: true,
        styles: { ...template.styles },
        content: JSON.parse(JSON.stringify(template.content || {})),
        dynamicSource: template.dynamicSource ? { ...template.dynamicSource } : undefined
      };

      const blocks = [...state.structure.blocks];
      if (typeof index === 'number') {
        blocks.splice(index, 0, newBlock);
      } else {
        blocks.push(newBlock);
      }

      return {
        structure: { blocks },
        selectedBlockId: newBlock.id
      };
    });
  },

  removeBlock: (id) => {
    set((state) => {
      const blocks = state.structure.blocks.filter((b) => b.id !== id);
      return {
        structure: { blocks },
        selectedBlockId: state.selectedBlockId === id ? null : state.selectedBlockId
      };
    });
  },

  duplicateBlock: (id) => {
    set((state) => {
      const blocks = [...state.structure.blocks];
      const idx = blocks.findIndex(b => b.id === id);
      if (idx === -1) return {};
      const source = blocks[idx];
      const clone: Block = {
        ...source,
        id: `block-${Math.random().toString(36).substr(2, 9)}`,
        isVisible: true,
        content: JSON.parse(JSON.stringify(source.content)),
        styles: { ...source.styles },
        dynamicSource: source.dynamicSource ? { ...source.dynamicSource } : undefined,
        seo: source.seo ? { ...source.seo } : undefined,
        responsive: source.responsive ? { ...source.responsive } : undefined
      };
      blocks.splice(idx + 1, 0, clone);
      return { structure: { blocks }, selectedBlockId: clone.id };
    });
  },

  toggleBlockVisibility: (id) => {
    set((state) => {
      const blocks = state.structure.blocks.map((b) => {
        if (b.id === id) {
          return { ...b, isVisible: b.isVisible === false ? true : false };
        }
        return b;
      });
      return { structure: { blocks } };
    });
  },

  convertToGlobal: (id, name) => {
    set((state) => {
      const globalId = `gb-${Date.now()}`;
      const blocks = state.structure.blocks.map((b) => {
        if (b.id === id) {
          return { ...b, isGlobal: true, globalBlockId: globalId };
        }
        return b;
      });

      const activeTenant = dbAdapter.getActiveTenant();
      const globalBlocks = dbAdapter.getGlobalBlocks(activeTenant.id);
      const target = blocks.find(b => b.id === id);
      if (target) {
        globalBlocks.push({
          id: globalId,
          tenantId: activeTenant.id,
          name,
          type: target.type,
          structureJson: JSON.stringify(target)
        });
        dbAdapter.saveGlobalBlocks(activeTenant.id, globalBlocks);
      }

      return { structure: { blocks } };
    });
  },

  updateGlobalBlock: (globalBlockId, content, styles) => {
    set((state) => {
      const blocks = state.structure.blocks.map((b) => {
        if (b.isGlobal && b.globalBlockId === globalBlockId) {
          return {
            ...b,
            content: { ...b.content, ...content },
            styles: { ...b.styles, ...styles }
          };
        }
        return b;
      });
      return { structure: { blocks } };
    });
  },

  updateBlockContent: (id, newContent) => {
    set((state) => {
      const targetBlock = state.structure.blocks.find(b => b.id === id);
      const isGlobal = targetBlock?.isGlobal;
      const globalBlockId = targetBlock?.globalBlockId;

      const blocks = state.structure.blocks.map((b) => {
        if (b.id === id) {
          return { ...b, content: { ...b.content, ...newContent } };
        }
        if (isGlobal && globalBlockId && b.isGlobal && b.globalBlockId === globalBlockId) {
          return { ...b, content: { ...b.content, ...newContent } };
        }
        return b;
      });

      if (isGlobal && globalBlockId) {
        const updatedBlock = blocks.find(b => b.id === id);
        if (updatedBlock) {
          const activeTenant = dbAdapter.getActiveTenant();
          const gbs = dbAdapter.getGlobalBlocks(activeTenant.id);
          const idx = gbs.findIndex(g => g.id === globalBlockId);
          if (idx >= 0) {
            gbs[idx].structureJson = JSON.stringify(updatedBlock);
            dbAdapter.saveGlobalBlocks(activeTenant.id, gbs);
          }
        }
      }

      return { structure: { blocks } };
    });
  },

  updateBlockStyles: (id, newStyles) => {
    set((state) => {
      const targetBlock = state.structure.blocks.find(b => b.id === id);
      const isGlobal = targetBlock?.isGlobal;
      const globalBlockId = targetBlock?.globalBlockId;

      const blocks = state.structure.blocks.map((b) => {
        if (b.id === id) {
          return { ...b, styles: { ...b.styles, ...newStyles } };
        }
        if (isGlobal && globalBlockId && b.isGlobal && b.globalBlockId === globalBlockId) {
          return { ...b, styles: { ...b.styles, ...newStyles } };
        }
        return b;
      });

      if (isGlobal && globalBlockId) {
        const updatedBlock = blocks.find(b => b.id === id);
        if (updatedBlock) {
          const activeTenant = dbAdapter.getActiveTenant();
          const gbs = dbAdapter.getGlobalBlocks(activeTenant.id);
          const idx = gbs.findIndex(g => g.id === globalBlockId);
          if (idx >= 0) {
            gbs[idx].structureJson = JSON.stringify(updatedBlock);
            dbAdapter.saveGlobalBlocks(activeTenant.id, gbs);
          }
        }
      }

      return { structure: { blocks } };
    });
  },

  updateBlockDynamicSource: (id, newSource) => {
    set((state) => {
      const blocks = state.structure.blocks.map((b) => {
        if (b.id === id) {
          return {
            ...b,
            dynamicSource: b.dynamicSource
              ? { ...b.dynamicSource, ...newSource }
              : (newSource as any)
          };
        }
        return b;
      });
      return { structure: { blocks } };
    });
  },

  updateBlockSeo: (id, seoData) => {
    set((state) => {
      const blocks = state.structure.blocks.map((b) => {
        if (b.id === id) {
          return {
            ...b,
            seo: b.seo ? { ...b.seo, ...seoData } : seoData
          };
        }
        return b;
      });
      return { structure: { blocks } };
    });
  },

  updateBlockResponsive: (id, responsiveData) => {
    set((state) => {
      const blocks = state.structure.blocks.map((b) => {
        if (b.id === id) {
          return {
            ...b,
            responsive: b.responsive ? { ...b.responsive, ...responsiveData } : responsiveData
          };
        }
        return b;
      });
      return { structure: { blocks } };
    });
  },

  reorderBlocks: (startIndex, endIndex) => {
    set((state) => {
      const blocks = [...state.structure.blocks];
      const [removed] = blocks.splice(startIndex, 1);
      blocks.splice(endIndex, 0, removed);
      return { structure: { blocks } };
    });
  },

  setSelectedBlockId: (id) => set({ selectedBlockId: id }),

  resetBuilder: () => {
    set({
      pageId: null,
      slug: '',
      title: '',
      isPublished: false,
      structure: { blocks: [] },
      selectedBlockId: null
    });
  }
}));