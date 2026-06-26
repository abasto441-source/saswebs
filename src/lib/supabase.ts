// Simulated Supabase Database Adapter (Offline-first & Local Storage Backup)

export interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  customDomain?: string;
  plan: 'Starter' | 'Pro' | 'Enterprise';
  status: 'active' | 'suspended';
  isLmsEnabled: boolean;
  isEcommerceEnabled: boolean;
  isPosEnabled: boolean;
  isQrPaymentEnabled: boolean;
  isReservasEnabled: boolean;
  medusaShopId?: string;
  stripePublicKey?: string;
  stripeSecretKey?: string;
  useSaaSStripe?: boolean;
  easyPostApiKey?: string;
  metaPixelId?: string;
  klaviyoWebhookUrl?: string;
  qrCodeUrl?: string;
  favicon?: string;
  themeDarkMode: boolean;
  googleAnalyticsId?: string;
  expirationDate: string;
}

export interface Reservation {
  id: string;
  tenantId: string;
  customerName: string;
  email: string;
  dateTime: string;
  serviceName: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  lessonsCount: number;
  instructorName: string;
  price: number;
}

export interface Enrollment {
  id: string;
  courseId: string;
  progress: number;
  lessonsCompleted: string[];
}

export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  barcode: string;
  imageUrl: string;
  category: string;
}

export interface Template {
  id: string;
  name: string;
  category: 'education' | 'ecommerce' | 'services' | 'corporate' | 'restaurant';
  previewImage: string;
  industry: string;
  isPremium: boolean;
  requiredModules: string[];
  blocksIncluded: string[];
  version: string;
  structureJson: string;
}

export interface Page {
  id: string;
  tenantId: string;
  slug: string;
  title: string;
  isPublished: boolean;
  structureJson: string;
}

export interface GlobalBlock {
  id: string;
  tenantId: string;
  name: string;
  type: string;
  structureJson: string;
}

// Enterprise Mock Types
export interface CMSField {
  name: string;
  type: 'text' | 'number' | 'image' | 'date' | 'relation';
  relatedCollectionId?: string;
}

export interface CMSCollection {
  id: string;
  tenantId: string;
  name: string;
  slug: string;
  fields: CMSField[];
}

export interface CMSItem {
  id: string;
  collectionId: string;
  data: Record<string, string>;
  createdAt: number;
}

export interface AutomationWorkflow {
  id: string;
  tenantId: string;
  name: string;
  trigger: string;
  actions: string[];
  active: boolean;
}

export interface AuditLog {
  id: string;
  tenantId: string;
  userId: string;
  action: string;
  ip: string;
  createdAt: number;
  details: string;
}

export interface SaaSPlanLimit {
  tenantId: string;
  maxPages: number;
  maxPosTerminals: number;
  currentPagesCount: number;
  currentPosTerminalsCount: number;
  invoices: Array<{ id: string; amount: number; date: string; status: 'pagado' | 'pendiente' }>;
}

export interface Integration {
  id: string;
  tenantId: string;
  name: string;
  provider: 'stripe' | 'paypal' | 'mercado_pago' | 'resend' | 'brevo' | 'whatsapp' | 'sap' | 'odoo';
  connected: boolean;
  config: Record<string, string>;
}

export interface CustomerAccount {
  id: string;
  email: string;
  name: string;
  tenantId: string;
  orders: Array<{ id: string; date: string; total: number; status: string }>;
  courses: Array<{ id: string; title: string; progress: number }>;
  reservations: Array<{ id: string; date: string; service: string }>;
}

export interface ApiKey {
  id: string;
  tenantId: string;
  name: string;
  publicKey: string;
  secretKey: string;
  webhooks: Array<{ id: string; url: string; trigger: string }>;
}

export interface GitCommit {
  id: string;
  tenantId: string;
  message: string;
  timestamp: number;
  blocksJson: string;
  author: string;
}

export interface BranchLocation {
  id: string;
  tenantId: string;
  name: string;
  address: string;
  mrr: number;
  isActive: boolean;
}

export interface BranchInventory {
  id: string;
  branchId: string;
  productId: string;
  stock: number;
}

export interface TelemetryMetric {
  id: string;
  tenantId: string;
  timestamp: number;
  latencyMs: number;
  uptimePct: number;
  jsErrorsCount: number;
  recentErrors: string[];
}

// Initial mock data definitions
const INITIAL_TENANTS: Tenant[] = [
  {
    id: 't-main',
    name: 'SASWEBS Principal',
    subdomain: 'saswebs',
    customDomain: 'saswebs.nram360.com',
    plan: 'Enterprise',
    status: 'active',
    isLmsEnabled: true,
    isEcommerceEnabled: true,
    isPosEnabled: true,
    isQrPaymentEnabled: true,
    isReservasEnabled: true,
    themeDarkMode: false,
    favicon: '👑',
    expirationDate: '2030-01-01'
  },
  {
    id: 't-celeste',
    name: 'Academia y Tienda Celeste S.A.',
    subdomain: 'celeste',
    customDomain: 'academia.celeste.com',
    plan: 'Pro',
    status: 'active',
    isLmsEnabled: true,
    isEcommerceEnabled: true,
    isPosEnabled: true,
    isQrPaymentEnabled: true,
    isReservasEnabled: true, // Habilitado por defecto en la extensión
    medusaShopId: 'medusa-shop-celeste-prod-99',
    stripePublicKey: 'pk_test_51I...',
    stripeSecretKey: 'sk_test_51I...',
    useSaaSStripe: false,
    easyPostApiKey: 'EZPT_key_test_celeste',
    metaPixelId: 'pixel_celeste_123',
    klaviyoWebhookUrl: 'https://a.klaviyo.com/onsite/webhooks',
    qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://academia.celeste.com/pay',
    themeDarkMode: false,
    favicon: '🎨',
    googleAnalyticsId: 'UA-12345678-9',
    expirationDate: '2027-06-05'
  },
  {
    id: 't-tech',
    name: 'Ventas de Tecnología TecnoBo',
    subdomain: 'tecnobo',
    plan: 'Starter',
    status: 'active',
    isLmsEnabled: false,
    isEcommerceEnabled: true,
    isPosEnabled: true,
    isQrPaymentEnabled: false,
    isReservasEnabled: false,
    medusaShopId: 'medusa-shop-tecnobo-928',
    qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://tecnobo.com/pay',
    themeDarkMode: true,
    favicon: '💻',
    expirationDate: '2026-12-01'
  }
];

const INITIAL_COURSES: Course[] = [
  {
    id: 'c-nextjs',
    title: 'Desarrollo Full-Stack con Next.js 16',
    description: 'Aprende App Router, Server Actions y Tailwind CSS de cero a experto.',
    thumbnail: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&auto=format&fit=crop&q=80',
    lessonsCount: 12,
    instructorName: 'Rubén Castillo',
    price: 49.99
  },
  {
    id: 'c-postgres',
    title: 'PostgreSQL Avanzado y Multi-inquilino',
    description: 'Domina esquemas JSONB, Row Level Security (RLS) y optimización.',
    thumbnail: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=400&auto=format&fit=crop&q=80',
    price: 39.99,
    lessonsCount: 8,
    instructorName: 'Sarah Connor'
  }
];

const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'p-1',
    name: 'Lector de Código de Barras Láser USB',
    price: 150.00,
    stock: 25,
    barcode: '7701234567890',
    imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&auto=format&fit=crop&q=80',
    category: 'Hardware'
  },
  {
    id: 'p-2',
    name: 'Impresora Térmica de Recibos 80mm',
    price: 320.00,
    stock: 12,
    barcode: '7701234567891',
    imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&auto=format&fit=crop&q=80',
    category: 'Hardware'
  },
  {
    id: 'p-3',
    name: 'Terminal POS Inteligente Android WisePOS',
    price: 850.00,
    stock: 8,
    barcode: '7701234567892',
    imageUrl: 'https://images.unsplash.com/photo-1556742044-3c52d6e88c62?w=400&auto=format&fit=crop&q=80',
    category: 'Terminales'
  },
  {
    id: 'p-4',
    name: 'Abrigo Minimalista de Lana',
    price: 120.00,
    stock: 15,
    barcode: '7701234567895',
    imageUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&auto=format&fit=crop&q=80',
    category: 'Novedades'
  },
  {
    id: 'p-5',
    name: 'Camisa de Lino Premium',
    price: 75.00,
    stock: 30,
    barcode: '7701234567896',
    imageUrl: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=400&auto=format&fit=crop&q=80',
    category: 'Novedades'
  }
];

// Prepopulated templates
const INITIAL_TEMPLATES: Template[] = [
  {
    id: 'tpl-lms',
    name: '📚 Academia Digital Celeste',
    category: 'education',
    previewImage: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=500&auto=format&fit=crop&q=80',
    industry: 'Educación & Cursos en línea',
    isPremium: false,
    requiredModules: ['isLmsEnabled'],
    blocksIncluded: ['Navbar', 'Hero principal', 'Lista de Cursos', 'FAQs Acordeón', 'Pie de Página'],
    version: '1.2.0',
    structureJson: JSON.stringify([
      { id: 'b-h', type: 'header', version: '1.0.0', isVisible: true, styles: { padding: 'py-4', bgColor: '#ffffff' }, content: { logo: '🎓 Celeste LMS', links: [{ label: 'Inicio', url: '/' }, { label: 'Clases', url: '/cursos' }] } },
      { id: 'b-he', type: 'hero', version: '1.0.0', isVisible: true, styles: { padding: 'py-20', bgColor: '#6ac4d7', textAlign: 'center', borderRadius: 'xl', animation: 'slide-up' }, content: { title: 'Aprende del Futuro Hoy', subtitle: 'Clases en vivo y lecciones grabadas en una plataforma de alto rendimiento.', buttonText: 'Explorar Cursos', buttonLink: '/cursos', imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800' } },
      { id: 'b-cs', type: 'lms_course_list', version: '1.0.0', isVisible: true, styles: { padding: 'py-12', bgColor: '#ffffff', textAlign: 'center' }, content: { title: 'Cursos Disponibles', subtitle: 'Ingresa a clases virtuales autogestionadas' }, dynamicSource: { api: 'native_lms', endpoint: '/courses', limit: 3 } },
      { id: 'b-fq', type: 'accordion_faq', version: '1.0.0', isVisible: true, styles: { padding: 'py-12', bgColor: '#f9fafb' }, content: { title: 'Dudas Académicas', faqs: [{ q: '¿Cómo obtengo mi certificado?', a: 'Al completar el 100% de las lecciones, tu cuenta generará un código de verificación.' }, { q: '¿Hay tutorías en vivo?', a: 'Sí, programadas en el panel de eventos del estudiante.' }] } },
      { id: 'b-f', type: 'footer', version: '1.0.0', isVisible: true, styles: { padding: 'py-8', bgColor: '#1f2937' }, content: { copyText: '© 2026 Celeste LMS Academia. Todos los derechos reservados.' } }
    ])
  },
  {
    id: 'tpl-ecommerce',
    name: '🛒 TecnoStore Ecommerce',
    category: 'ecommerce',
    previewImage: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=500&auto=format&fit=crop&q=80',
    industry: 'Comercio & Hardware POS',
    isPremium: true,
    requiredModules: ['isEcommerceEnabled', 'isPosEnabled'],
    blocksIncluded: ['Navbar', 'Hero comercial', 'Grilla Productos', 'Tabla de Precios', 'Pie de Página'],
    version: '2.0.1',
    structureJson: JSON.stringify([
      { id: 'b-h2', type: 'header', version: '1.0.0', isVisible: true, styles: { padding: 'py-4', bgColor: '#111827' }, content: { logo: '💻 TecnoStore', links: [{ label: 'Tienda', url: '/' }, { label: 'POS Local', url: '/pos' }] } },
      { id: 'b-he2', type: 'hero', version: '1.0.0', isVisible: true, styles: { padding: 'py-24', bgColor: '#111827', textAlign: 'left', borderRadius: 'none', animation: 'fade-in' }, content: { title: 'Equipos y Terminales POS', subtitle: 'Lectores láser, impresoras térmicas y consolas para tu facturación física.', buttonText: 'Ver Hardware', buttonLink: '#productos', imageUrl: 'https://images.unsplash.com/photo-1556742044-3c52d6e88c62?w=800' } },
      { id: 'b-pd', type: 'dynamic_product_grid', version: '1.0.0', isVisible: true, styles: { padding: 'py-16', bgColor: '#ffffff', textAlign: 'center' }, content: { title: 'Catálogo de Dispositivos', subtitle: 'Hardware compatible con sincronización offline' }, dynamicSource: { api: 'native_ecommerce', endpoint: '/products', limit: 4 } },
      { id: 'b-pr', type: 'pricing_table', version: '1.0.0', isVisible: true, styles: { padding: 'py-16', bgColor: '#f9fafb', textAlign: 'center', borderRadius: 'xl', animation: 'slide-up' }, content: { title: 'Soporte y Garantías POS', subtitle: 'Planes adaptados a negocios físicos' } },
      { id: 'b-f2', type: 'footer', version: '1.0.0', isVisible: true, styles: { padding: 'py-8', bgColor: '#111827' }, content: { copyText: '© 2026 TecnoStore Sistemas. Todos los derechos reservados.' } }
    ])
  },
  {
    id: 'tpl-restaurant',
    name: '🍽️ Bistró Delicia Gourmet',
    category: 'restaurant',
    previewImage: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500&auto=format&fit=crop&q=80',
    industry: 'Gastronomía & Restaurantes',
    isPremium: false,
    requiredModules: [],
    blocksIncluded: ['Navbar', 'Hero comida', 'Contenedor Columnas', 'Galería de Platos', 'Contacto', 'Pie'],
    version: '1.0.0',
    structureJson: JSON.stringify([
      { id: 'b-h3', type: 'header', version: '1.0.0', isVisible: true, styles: { padding: 'py-4', bgColor: '#ffffff' }, content: { logo: '🍽️ Bistró Delicia', links: [{ label: 'Menú', url: '#menu' }, { label: 'Contacto', url: '#contacto' }] } },
      { id: 'b-he3', type: 'hero', version: '1.0.0', isVisible: true, styles: { padding: 'py-20', bgColor: '#f3f4f6', textAlign: 'center', borderRadius: 'xl' }, content: { title: 'Una Experiencia Exquisita', subtitle: 'Ingredientes frescos de granjas locales preparados por chefs expertos.', buttonText: 'Reservar Mesa', buttonLink: '#contacto', imageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800' } },
      { id: 'b-col3', type: 'columns_layout', version: '1.0.0', isVisible: true, styles: { padding: 'py-12', bgColor: '#ffffff' }, content: { col1_title: 'Ingredientes Orgánicos', col1_text: 'Platos preparados al día.', col2_title: 'Chef Estrella', col2_text: 'Gastronomía de autor.', col3_title: 'Ambiente Acogedor', col3_text: 'Música en vivo los fines de semana.' } },
      { id: 'b-gl', type: 'gallery', version: '1.0.0', isVisible: true, styles: { padding: 'py-12', bgColor: '#f9fafb', textAlign: 'center' }, content: { title: 'Nuestras Especialidades', images: [{ url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400', title: 'Pizza Italiana' }, { url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400', title: 'Ensalada Premium' }] } },
      { id: 'b-fc', type: 'contact_form', version: '1.0.0', isVisible: true, styles: { padding: 'py-12', bgColor: '#ffffff' }, content: { title: 'Reservaciones Online', subtitle: 'Ingresa tus datos y coordinamos tu mesa.' } },
      { id: 'b-f3', type: 'footer', version: '1.0.0', isVisible: true, styles: { padding: 'py-8', bgColor: '#1f2937' }, content: { copyText: '© 2026 Bistró Delicia. Todos los derechos reservados.' } }
    ])
  },
  {
    id: 'tpl-minimalist',
    name: '🧥 Moda Minimalista',
    category: 'ecommerce',
    previewImage: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=500&auto=format&fit=crop&q=80',
    industry: 'Moda y Ropa Exclusiva',
    isPremium: true,
    requiredModules: ['isEcommerceEnabled'],
    blocksIncluded: ['Navbar', 'Hero principal', 'Grilla Productos', 'Pie de Página'],
    version: '1.0.0',
    structureJson: JSON.stringify([
      { id: 'b-mh1', type: 'header', version: '1.0.0', isVisible: true, styles: { padding: 'py-4', bgColor: '#ffffff' }, content: { logo: '🧥 MINIMAL', links: [{ label: 'Colecciones', url: '/' }, { label: 'Contacto', url: '#contacto' }] } },
      { id: 'b-mh2', type: 'hero', version: '1.0.0', isVisible: true, styles: { padding: 'py-20', bgColor: '#f3f4f6', textAlign: 'center', borderRadius: 'none' }, content: { title: 'Bienvenido', subtitle: 'Colección exclusiva y sobria con diseños minimalistas.', buttonText: 'Explorar Catálogo', buttonLink: '#productos', imageUrl: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800' } },
      { id: 'b-mh3', type: 'dynamic_product_grid', version: '1.0.0', isVisible: true, styles: { padding: 'py-12', bgColor: '#ffffff', textAlign: 'center' }, content: { title: 'Colección Novedades', subtitle: 'Prendas exclusivas seleccionadas a mano.' }, dynamicSource: { api: 'native_ecommerce', endpoint: '/products', limit: 3 } },
      { id: 'b-mh4', type: 'footer', version: '1.0.0', isVisible: true, styles: { padding: 'py-8', bgColor: '#111827' }, content: { copyText: '© 2026 Minimal Studio. Todos los derechos reservados.' } }
    ])
  }
];

// Seed Enterprise Data
const INITIAL_COLLECTIONS: CMSCollection[] = [
  {
    id: 'col-articles',
    tenantId: 't-celeste',
    name: 'Artículos de Prensa',
    slug: 'articulos-prensa',
    fields: [
      { name: 'titulo', type: 'text' },
      { name: 'autor', type: 'text' },
      { name: 'contenido', type: 'text' },
      { name: 'fecha', type: 'date' }
    ]
  },
  {
    id: 'col-doctors',
    tenantId: 't-celeste',
    name: 'Citas Médicas / Especialidades',
    slug: 'citas-medicas',
    fields: [
      { name: 'doctor', type: 'text' },
      { name: 'especialidad', type: 'text' },
      { name: 'horario', type: 'text' },
      { name: 'consultorio', type: 'text' }
    ]
  }
];

const INITIAL_CMS_ITEMS: CMSItem[] = [
  {
    id: 'item-1',
    collectionId: 'col-articles',
    data: {
      titulo: 'El auge del eCommerce sin conexión',
      autor: 'Rubén Castillo',
      contenido: 'El uso de terminales POS y bases de datos locales permite mantener la facturación física sin interrupciones.',
      fecha: '2026-06-01'
    },
    createdAt: Date.now() - 86400000 * 3
  },
  {
    id: 'item-2',
    collectionId: 'col-articles',
    data: {
      titulo: 'Clases virtuales asíncronas de alto rendimiento',
      autor: 'Sarah Connor',
      contenido: 'La educación virtual moderna demanda interfaces dinámicas que carguen al instante gracias a CDN caching en el Edge.',
      fecha: '2026-06-03'
    },
    createdAt: Date.now() - 86400000
  },
  {
    id: 'item-3',
    collectionId: 'col-doctors',
    data: {
      doctor: 'Dr. Alejandro Roca',
      especialidad: 'Cardiología',
      horario: 'Lunes a Viernes 09:00 - 13:00',
      consultorio: 'Consultorio 102 (Piso 1)'
    },
    createdAt: Date.now() - 86400000 * 2
  }
];

const INITIAL_WORKFLOWS: AutomationWorkflow[] = [
  {
    id: 'wf-1',
    tenantId: 't-celeste',
    name: 'Gatillador Contacto -> Enviar Email & Webhook CRM',
    trigger: 'contact_form_submit',
    actions: ['send_email', 'sync_crm_webhook'],
    active: true
  },
  {
    id: 'wf-2',
    tenantId: 't-celeste',
    name: 'Gatillador POS Venta -> Sincronizar Inventario & SMS',
    trigger: 'pos_sale',
    actions: ['send_sms', 'sync_central_erp'],
    active: true
  }
];

const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'audit-1',
    tenantId: 't-celeste',
    userId: 'admin@celeste.com',
    action: 'Editar precio del Lector Láser',
    ip: '192.168.1.10',
    createdAt: Date.now() - 3600000 * 4,
    details: 'Se actualizó el precio del producto p-1 de $120.00 a $150.00'
  },
  {
    id: 'audit-2',
    tenantId: 't-celeste',
    userId: 'cajero@celeste.com',
    action: 'Inicio de turno POS',
    ip: '192.168.1.144',
    createdAt: Date.now() - 3600000 * 2,
    details: 'Inicio de sesión exitoso en Caja Terminal #1 usando PIN autorizado.'
  }
];

const INITIAL_SAAS_LIMITS: SaaSPlanLimit[] = [
  {
    tenantId: 't-celeste',
    maxPages: 10,
    maxPosTerminals: 3,
    currentPagesCount: 3,
    currentPosTerminalsCount: 1,
    invoices: [
      { id: 'inv-101', amount: 49.00, date: '2026-05-05', status: 'pagado' },
      { id: 'inv-102', amount: 49.00, date: '2026-06-05', status: 'pagado' }
    ]
  },
  {
    tenantId: 't-tech',
    maxPages: 3,
    maxPosTerminals: 1,
    currentPagesCount: 1,
    currentPosTerminalsCount: 1,
    invoices: [
      { id: 'inv-201', amount: 19.00, date: '2026-05-01', status: 'pagado' }
    ]
  }
];

const INITIAL_INTEGRATIONS: Integration[] = [
  { id: 'int-stripe', tenantId: 't-celeste', name: 'Stripe Payments', provider: 'stripe', connected: true, config: { apiKey: 'pk_test_celeste' } },
  { id: 'int-paypal', tenantId: 't-celeste', name: 'PayPal checkout', provider: 'paypal', connected: false, config: {} },
  { id: 'int-resend', tenantId: 't-celeste', name: 'Resend Email API', provider: 'resend', connected: true, config: { domain: 'mail.celeste.com' } },
  { id: 'int-whatsapp', tenantId: 't-celeste', name: 'WhatsApp Twilio Business', provider: 'whatsapp', connected: false, config: {} },
  { id: 'int-sap', tenantId: 't-celeste', name: 'SAP Business One Connector', provider: 'sap', connected: false, config: {} }
];

const INITIAL_CUSTOMER_ACCOUNTS: CustomerAccount[] = [
  {
    id: 'cust-maria',
    email: 'maria@gmail.com',
    name: 'María Gomez',
    tenantId: 't-celeste',
    orders: [
      { id: 'ord-9988', date: '2026-06-01', total: 120.00, status: 'Completado' }
    ],
    courses: [
      { id: 'c-nextjs', title: 'Desarrollo Full-Stack con Next.js 16', progress: 33 }
    ],
    reservations: [
      { id: 'res-1', date: '2026-06-15 14:00', service: 'Clase Particular Programación' }
    ]
  }
];

const INITIAL_API_KEYS: ApiKey[] = [
  {
    id: 'key-1',
    tenantId: 't-celeste',
    name: 'Producción API',
    publicKey: 'nram_pub_live_celeste_71ab2a9',
    secretKey: 'nram_sec_live_celeste_88ff91b',
    webhooks: [
      { id: 'wh-1', url: 'https://api.celeste-admin.com/webhook/orders', trigger: 'pos_sale' }
    ]
  }
];

class SupabaseMock {
  private getStorage<T>(key: string, defaultVal: T): T {
    if (typeof window === 'undefined') return defaultVal;
    const item = localStorage.getItem(key);
    if (item === null) return defaultVal;
    try {
      return JSON.parse(item) as T;
    } catch (e) {
      if (typeof defaultVal === 'string') {
        return item as unknown as T;
      }
      return defaultVal;
    }
  }

  private setStorage<T>(key: string, value: T) {
    if (typeof window !== 'undefined') {
      localStorage.setItem(key, JSON.stringify(value));
    }
  }

  // Helper to trigger background table syncing to Supabase
  private syncTable(key: string, data: any[]) {
    if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('TU_PROJECT_ID')) {
      syncTableToSupabase(key, data).catch(err => console.error(`Sync error for ${key}:`, err));
    }
  }

  getTenants(): Tenant[] {
    return this.getStorage('mock_tenants', INITIAL_TENANTS);
  }

  saveTenants(tenants: Tenant[]) {
    this.setStorage('mock_tenants', tenants);
    this.syncTable('tenants', tenants);
  }

  getActiveTenant(): Tenant {
    const tenants = this.getTenants();
    const activeId = this.getStorage('mock_active_tenant_id', 't-celeste');
    return tenants.find(t => t.id === activeId) || tenants[0] || INITIAL_TENANTS[0];
  }

  setActiveTenantId(id: string) {
    this.setStorage('mock_active_tenant_id', id);
  }

  getCourses(): Course[] {
    return this.getStorage('mock_courses', INITIAL_COURSES);
  }

  saveCourses(courses: Course[]) {
    this.setStorage('mock_courses', courses);
    this.syncTable('courses', courses);
  }

  getProducts(): Product[] {
    return this.getStorage('mock_products', INITIAL_PRODUCTS);
  }

  saveProducts(products: Product[]) {
    this.setStorage('mock_products', products);
    this.syncTable('products', products);
  }

  getEnrollments(): Enrollment[] {
    return this.getStorage('mock_enrollments', []);
  }

  saveEnrollments(enrollments: Enrollment[]) {
    this.setStorage('mock_enrollments', enrollments);
    this.syncTable('enrollments', enrollments);
  }

  getTemplates(): Template[] {
    return this.getStorage('mock_templates', INITIAL_TEMPLATES);
  }

  saveTemplates(templates: Template[]) {
    this.setStorage('mock_templates', templates);
  }

  getPages(): Page[] {
    return this.getStorage('mock_pages', []);
  }

  savePages(pages: Page[]) {
    this.setStorage('mock_pages', pages);
    this.syncTable('pages', pages);
  }

  getTenantPage(tenantId: string, slug: string): Page | null {
    const pages = this.getPages();
    return pages.find(p => p.tenantId === tenantId && p.slug === slug) || null;
  }

  saveTenantPage(tenantId: string, slug: string, pageData: Partial<Page>) {
    const pages = this.getPages();
    const index = pages.findIndex(p => p.tenantId === tenantId && p.slug === slug);
    const existing = index >= 0 ? pages[index] : null;

    const updatedPage: Page = {
      id: existing?.id || 'p-' + Date.now(),
      tenantId,
      slug,
      title: pageData.title || existing?.title || 'Página',
      isPublished: pageData.isPublished !== undefined ? pageData.isPublished : (existing?.isPublished ?? true),
      structureJson: pageData.structureJson || existing?.structureJson || '[]'
    };

    if (index >= 0) {
      pages[index] = updatedPage;
    } else {
      pages.push(updatedPage);
    }
    this.savePages(pages);
    return updatedPage;
  }

  getGlobalBlocks(tenantId: string): GlobalBlock[] {
    return this.getStorage(`mock_global_blocks_${tenantId}`, []);
  }

  saveGlobalBlocks(tenantId: string, blocks: GlobalBlock[]) {
    this.setStorage(`mock_global_blocks_${tenantId}`, blocks);
  }

  instantiateTemplate(templateId: string, tenantId: string, slug: string): Page {
    const templates = this.getTemplates();
    const tpl = templates.find(t => t.id === templateId);
    if (!tpl) throw new Error('Template not found');

    const sourceBlocks = JSON.parse(tpl.structureJson);
    
    const clonedBlocks = sourceBlocks.map((b: any) => ({
      ...b,
      id: `block-${Math.random().toString(36).substr(2, 9)}`,
      isVisible: b.isVisible !== undefined ? b.isVisible : true,
      styles: b.styles ? { ...b.styles } : {},
      content: b.content ? JSON.parse(JSON.stringify(b.content)) : {}
    }));

    return this.saveTenantPage(tenantId, slug, {
      title: tpl.name,
      structureJson: JSON.stringify(clonedBlocks),
      isPublished: true
    });
  }

  enrollInCourse(courseId: string) {
    const enrollments = this.getEnrollments();
    if (!enrollments.some(e => e.courseId === courseId)) {
      enrollments.push({
        id: 'e-' + Math.random().toString(36).substr(2, 9),
        courseId,
        progress: 0,
        lessonsCompleted: []
      });
      this.saveEnrollments(enrollments);
    }
  }

  updateLessonProgress(courseId: string, lessonTitle: string) {
    const enrollments = this.getEnrollments();
    const e = enrollments.find(e => e.courseId === courseId);
    if (e) {
      if (!e.lessonsCompleted.includes(lessonTitle)) {
        e.lessonsCompleted.push(lessonTitle);
        const course = this.getCourses().find(c => c.id === courseId);
        const total = course ? course.lessonsCount : 10;
        e.progress = Math.min(100, Math.round((e.lessonsCompleted.length / total) * 100));
        this.saveEnrollments(enrollments);
      }
    }
  }

  getReservations(): Reservation[] {
    return this.getStorage('mock_reservations', [
      { id: 'res-1', tenantId: 't-celeste', customerName: 'María Gomez', email: 'maria@gmail.com', dateTime: '2026-06-15 14:00', serviceName: 'Clase Particular Programación' }
    ]);
  }

  saveReservations(reservations: Reservation[]) {
    this.setStorage('mock_reservations', reservations);
    this.syncTable('reservations', reservations);
  }

  getCollections(): CMSCollection[] {
    return this.getStorage('mock_collections', INITIAL_COLLECTIONS);
  }

  saveCollections(col: CMSCollection[]) {
    this.setStorage('mock_collections', col);
    this.syncTable('cms_collections', col);
  }

  getCmsItems(): CMSItem[] {
    return this.getStorage('mock_cms_items', INITIAL_CMS_ITEMS);
  }

  saveCmsItems(items: CMSItem[]) {
    this.setStorage('mock_cms_items', items);
    this.syncTable('cms_items', items);
  }

  getWorkflows(): AutomationWorkflow[] {
    return this.getStorage('mock_workflows', INITIAL_WORKFLOWS);
  }

  saveWorkflows(wf: AutomationWorkflow[]) {
    this.setStorage('mock_workflows', wf);
    this.syncTable('workflows', wf);
  }

  getAuditLogs(): AuditLog[] {
    return this.getStorage('mock_audit_logs', INITIAL_AUDIT_LOGS);
  }

  saveAuditLogs(logs: AuditLog[]) {
    this.setStorage('mock_audit_logs', logs);
    this.syncTable('audit_logs', logs);
  }

  addAuditLog(tenantId: string, userId: string, action: string, details: string) {
    const logs = this.getAuditLogs();
    logs.unshift({
      id: 'audit-' + Date.now(),
      tenantId,
      userId,
      action,
      ip: '192.168.1.10',
      createdAt: Date.now(),
      details
    });
    this.saveAuditLogs(logs);
  }

  getSaaSPlanLimits(): SaaSPlanLimit[] {
    return this.getStorage('mock_saas_limits', INITIAL_SAAS_LIMITS);
  }

  saveSaaSPlanLimits(limits: SaaSPlanLimit[]) {
    this.setStorage('mock_saas_limits', limits);
  }

  getTenantSaaSLimits(tenantId: string): SaaSPlanLimit {
    const all = this.getSaaSPlanLimits();
    return all.find(l => l.tenantId === tenantId) || {
      tenantId, maxPages: 5, maxPosTerminals: 1, currentPagesCount: 1, currentPosTerminalsCount: 1, invoices: []
    };
  }

  getIntegrations(): Integration[] {
    return this.getStorage('mock_integrations', INITIAL_INTEGRATIONS);
  }

  saveIntegrations(integ: Integration[]) {
    this.setStorage('mock_integrations', integ);
  }

  getCustomerAccounts(): CustomerAccount[] {
    return this.getStorage('mock_customer_accounts', INITIAL_CUSTOMER_ACCOUNTS);
  }

  saveCustomerAccounts(accounts: CustomerAccount[]) {
    this.setStorage('mock_customer_accounts', accounts);
  }

  getApiKeys(): ApiKey[] {
    return this.getStorage('mock_api_keys', INITIAL_API_KEYS);
  }

  saveApiKeys(keys: ApiKey[]) {
    this.setStorage('mock_api_keys', keys);
    this.syncTable('api_keys', keys);
  }

  getGitCommits(tenantId: string): GitCommit[] {
    const defaultCommits: GitCommit[] = [
      {
        id: 'commit-initial',
        tenantId,
        message: '🚀 Despliegue inicial de plantilla base Celeste',
        timestamp: Date.now() - 86400000 * 5,
        blocksJson: JSON.stringify([
          { id: 'b-h', type: 'header', version: '1.0.0', isVisible: true, styles: { padding: 'py-4', bgColor: '#ffffff' }, content: { logo: '🎓 Celeste LMS', links: [{ label: 'Inicio', url: '/' }] } },
          { id: 'b-he', type: 'hero', version: '1.0.0', isVisible: true, styles: { padding: 'py-20', bgColor: '#6ac4d7', textAlign: 'center', borderRadius: 'xl' }, content: { title: 'Aprende del Futuro Hoy', subtitle: 'Clases en vivo y lecciones grabadas en una plataforma de alto rendimiento.', buttonText: 'Explorar Cursos', buttonLink: '/cursos', imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800' } }
        ]),
        author: 'admin@celeste.com'
      }
    ];
    return this.getStorage(`mock_git_commits_${tenantId}`, defaultCommits);
  }

  saveGitCommits(tenantId: string, commits: GitCommit[]) {
    this.setStorage(`mock_git_commits_${tenantId}`, commits);
  }

  getBranchLocations(tenantId: string): BranchLocation[] {
    const defaultBranches: BranchLocation[] = [
      { id: 'br-central', tenantId, name: 'Sede Central Celeste', address: 'Av. Las Condes 9281, Santiago', mrr: 15400, isActive: true },
      { id: 'br-providencia', tenantId, name: 'Celeste Providencia', address: 'Av. Nueva Providencia 1390, Santiago', mrr: 8900, isActive: true },
      { id: 'br-norte', tenantId, name: 'Celeste Sucursal Norte', address: 'Panamericana Norte Km 12, Santiago', mrr: 4500, isActive: true }
    ];
    return this.getStorage(`mock_branch_locations_${tenantId}`, defaultBranches);
  }

  saveBranchLocations(tenantId: string, branches: BranchLocation[]) {
    this.setStorage(`mock_branch_locations_${tenantId}`, branches);
    this.syncTable('branch_locations', branches);
  }

  getBranchInventory(branchId: string): BranchInventory[] {
    const defaultInv: BranchInventory[] = [
      { id: 'bi-1', branchId, productId: 'p-1', stock: 15 },
      { id: 'bi-2', branchId, productId: 'p-2', stock: 10 },
      { id: 'bi-3', branchId, productId: 'p-3', stock: 5 },
      { id: 'bi-4', branchId, productId: 'p-4', stock: 20 },
      { id: 'bi-5', branchId, productId: 'p-5', stock: 30 }
    ];
    return this.getStorage(`mock_branch_inventory_${branchId}`, defaultInv);
  }

  saveBranchInventory(branchId: string, inventory: BranchInventory[]) {
    this.setStorage(`mock_branch_inventory_${branchId}`, inventory);
    this.syncTable('branch_inventory', inventory);
  }

  getTelemetryMetric(tenantId: string): TelemetryMetric {
    const defaultMetric: TelemetryMetric = {
      id: 'tel-' + tenantId,
      tenantId,
      timestamp: Date.now(),
      latencyMs: 14,
      uptimePct: 99.98,
      jsErrorsCount: 0,
      recentErrors: []
    };
    return this.getStorage(`mock_telemetry_${tenantId}`, defaultMetric);
  }

  saveTelemetryMetric(tenantId: string, metric: TelemetryMetric) {
    this.setStorage(`mock_telemetry_${tenantId}`, metric);
  }
}

export const dbAdapter = new SupabaseMock();

// Field mappings between local state and Supabase tables
const PRODUCT_MAP = {
  id: 'id',
  name: 'name',
  price: 'price',
  stock: 'stock',
  barcode: 'barcode',
  imageUrl: 'image_url',
  category: 'category'
};

const COURSE_MAP = {
  id: 'id',
  title: 'title',
  description: 'description',
  thumbnail: 'thumbnail',
  lessonsCount: 'lessons_count',
  instructorName: 'instructor_name',
  price: 'price'
};

const PAGE_MAP = {
  id: 'id',
  tenantId: 'tenant_id',
  slug: 'slug',
  title: 'title',
  isPublished: 'is_published',
  structureJson: 'structure_json'
};

const CMS_COLLECTION_MAP = {
  id: 'id',
  tenantId: 'tenant_id',
  name: 'name',
  slug: 'slug',
  fields: 'fields'
};

const CMS_ITEM_MAP = {
  id: 'id',
  collectionId: 'collection_id',
  data: 'data',
  createdAt: 'created_at'
};

const RESERVATION_MAP = {
  id: 'id',
  tenantId: 'tenant_id',
  customerName: 'customer_name',
  email: 'email',
  dateTime: 'date_time',
  serviceName: 'service_name'
};

const AUDIT_LOG_MAP = {
  id: 'id',
  tenantId: 'tenant_id',
  userId: 'user_id',
  action: 'action',
  details: 'details',
  ip: 'ip',
  createdAt: 'created_at'
};

const WORKFLOW_MAP = {
  id: 'id',
  tenantId: 'tenant_id',
  name: 'name',
  trigger: 'trigger_event',
  actions: 'actions',
  active: 'active'
};

const BRANCH_LOCATION_MAP = {
  id: 'id',
  tenantId: 'tenant_id',
  name: 'name',
  address: 'address',
  mrr: 'mrr',
  isActive: 'is_active'
};

const BRANCH_INVENTORY_MAP = {
  id: 'id',
  branchId: 'branch_id',
  productId: 'product_id',
  stock: 'stock'
};

const API_KEY_MAP = {
  id: 'id',
  tenantId: 'tenant_id',
  name: 'name',
  publicKey: 'public_key',
  secretKey: 'secret_key',
  webhooks: 'webhooks'
};

const TENANT_MAP = {
  id: 'id',
  name: 'name',
  subdomain: 'subdomain',
  customDomain: 'custom_domain',
  plan: 'plan',
  status: 'status',
  isLmsEnabled: 'is_lms_enabled',
  isEcommerceEnabled: 'is_ecommerce_enabled',
  isPosEnabled: 'is_pos_enabled',
  isReservasEnabled: 'is_reservas_enabled',
  themeDarkMode: 'theme_dark_mode',
  stripePublicKey: 'stripe_public_key',
  favicon: 'favicon',
  googleAnalyticsId: 'google_analytics_id',
  expirationDate: 'expiration_date'
};

const ENROLLMENT_MAP = {
  id: 'id',
  courseId: 'course_id',
  progress: 'progress',
  lessonsCompleted: 'lessons_completed'
};

function mapToDb(obj: any, map: Record<string, string>, extra: any = {}) {
  const result: any = { ...extra };
  for (const [localKey, dbKey] of Object.entries(map)) {
    if (obj[localKey] !== undefined) {
      result[dbKey] = obj[localKey];
    }
  }
  return result;
}

function mapToLocal(dbObj: any, map: Record<string, string>) {
  const result: any = {};
  for (const [localKey, dbKey] of Object.entries(map)) {
    if (dbObj[dbKey] !== undefined) {
      result[localKey] = dbObj[dbKey];
    }
  }
  return result;
}

// Background sync functions to remote Supabase
async function syncTableToSupabase(tableKey: string, localItems: any[]) {
  if (typeof window === 'undefined') return;
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes('TU_PROJECT_ID')) return;

  const MAPS: Record<string, any> = {
    products: { dbTable: 'products', map: PRODUCT_MAP, tenantIdField: 'tenant_id' },
    courses: { dbTable: 'courses', map: COURSE_MAP, tenantIdField: 'tenant_id' },
    pages: { dbTable: 'pages', map: PAGE_MAP, tenantIdField: 'tenant_id' },
    cms_collections: { dbTable: 'cms_collections', map: CMS_COLLECTION_MAP, tenantIdField: 'tenant_id' },
    cms_items: { dbTable: 'cms_items', map: CMS_ITEM_MAP, tenantIdField: 'collection_id' },
    reservations: { dbTable: 'reservations', map: RESERVATION_MAP, tenantIdField: 'tenant_id' },
    audit_logs: { dbTable: 'audit_logs', map: AUDIT_LOG_MAP, tenantIdField: 'tenant_id' },
    workflows: { dbTable: 'automation_workflows', map: WORKFLOW_MAP, tenantIdField: 'tenant_id' },
    branch_locations: { dbTable: 'branch_locations', map: BRANCH_LOCATION_MAP, tenantIdField: 'tenant_id' },
    branch_inventory: { dbTable: 'branch_inventory', map: BRANCH_INVENTORY_MAP, tenantIdField: 'branch_id' },
    api_keys: { dbTable: 'api_keys', map: API_KEY_MAP, tenantIdField: 'tenant_id' },
    tenants: { dbTable: 'tenants', map: TENANT_MAP, tenantIdField: 'id' },
    enrollments: { dbTable: 'enrollments', map: ENROLLMENT_MAP, tenantIdField: 'user_id' }
  };

  const config = MAPS[tableKey];
  if (!config) return;

  try {
    const { getSupabase } = await import('@/lib/supabase-browser');
    const supabase = getSupabase();
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const tenantId = dbAdapter.getActiveTenant().id;

    const dbRows = localItems.map(item => {
      let extra: any = {};
      if (config.tenantIdField === 'tenant_id') {
        extra.tenant_id = tenantId;
      } else if (config.tenantIdField === 'user_id') {
        extra.user_id = session.user.id;
      }
      return mapToDb(item, config.map, extra);
    });

    if (dbRows.length > 0) {
      const { error: upsertError } = await supabase.from(config.dbTable).upsert(dbRows);
      if (upsertError) console.error(`Error upserting ${config.dbTable}`, upsertError);
    }

    // Handle removals
    let query = supabase.from(config.dbTable).select('id');
    if (config.tenantIdField === 'tenant_id') {
      query = query.eq('tenant_id', tenantId);
    } else if (config.tenantIdField === 'collection_id' && tableKey === 'cms_items') {
      const collections = dbAdapter.getCollections().filter(c => c.tenantId === tenantId);
      const collectionIds = collections.map(c => c.id);
      query = query.in('collection_id', collectionIds);
    } else if (config.tenantIdField === 'branch_id' && tableKey === 'branch_inventory') {
      const branches = dbAdapter.getBranchLocations(tenantId);
      const branchIds = branches.map(b => b.id);
      query = query.in('branch_id', branchIds);
    } else if (config.tenantIdField === 'user_id') {
      query = query.eq('user_id', session.user.id);
    } else if (config.tenantIdField === 'id' && tableKey === 'tenants') {
      query = query.eq('id', tenantId);
    }

    const { data: dbItems, error: selectError } = await query;
    if (!selectError && dbItems) {
      const localIds = new Set(localItems.map(item => item.id));
      const idsToDelete = dbItems.filter(item => !localIds.has(item.id)).map(item => item.id);

      if (idsToDelete.length > 0) {
        const { error: deleteError } = await supabase.from(config.dbTable).delete().in('id', idsToDelete);
        if (deleteError) console.error(`Error deleting from ${config.dbTable}`, deleteError);
      }
    }
  } catch (err) {
    console.error(`Failed to sync table ${tableKey}:`, err);
  }
}

async function syncFromSupabase() {
  if (typeof window === 'undefined') return;
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes('TU_PROJECT_ID')) return;

  try {
    const { getSupabase } = await import('@/lib/supabase-browser');
    const supabase = getSupabase();

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const activeTenantId = dbAdapter.getActiveTenant().id;

    // Sync tenants
    const { data: dbTenants } = await supabase.from('tenants').select('*');
    if (dbTenants) {
      const localTenants = dbTenants.map(t => mapToLocal(t, TENANT_MAP));
      localStorage.setItem('mock_tenants', JSON.stringify(localTenants));
    }

    // Sync products
    const { data: dbProducts } = await supabase.from('products').select('*').eq('tenant_id', activeTenantId);
    if (dbProducts) {
      localStorage.setItem('mock_products', JSON.stringify(dbProducts.map(p => mapToLocal(p, PRODUCT_MAP))));
    }

    // Sync courses
    const { data: dbCourses } = await supabase.from('courses').select('*').eq('tenant_id', activeTenantId);
    if (dbCourses) {
      localStorage.setItem('mock_courses', JSON.stringify(dbCourses.map(c => mapToLocal(c, COURSE_MAP))));
    }

    // Sync pages
    const { data: dbPages } = await supabase.from('pages').select('*').eq('tenant_id', activeTenantId);
    if (dbPages) {
      localStorage.setItem('mock_pages', JSON.stringify(dbPages.map(p => mapToLocal(p, PAGE_MAP))));
    }

    // Sync cms_collections
    const { data: dbCollections } = await supabase.from('cms_collections').select('*').eq('tenant_id', activeTenantId);
    if (dbCollections) {
      const collections = dbCollections.map(c => mapToLocal(c, CMS_COLLECTION_MAP));
      localStorage.setItem('mock_collections', JSON.stringify(collections));

      const collectionIds = collections.map(c => c.id);
      if (collectionIds.length > 0) {
        const { data: dbItems } = await supabase.from('cms_items').select('*').in('collection_id', collectionIds);
        if (dbItems) {
          localStorage.setItem('mock_cms_items', JSON.stringify(dbItems.map(i => mapToLocal(i, CMS_ITEM_MAP))));
        }
      }
    }

    // Sync reservations
    const { data: dbReservations } = await supabase.from('reservations').select('*').eq('tenant_id', activeTenantId);
    if (dbReservations) {
      localStorage.setItem('mock_reservations', JSON.stringify(dbReservations.map(r => mapToLocal(r, RESERVATION_MAP))));
    }

    // Sync audit_logs
    const { data: dbLogs } = await supabase.from('audit_logs').select('*').eq('tenant_id', activeTenantId).order('created_at', { ascending: false });
    if (dbLogs) {
      localStorage.setItem('mock_audit_logs', JSON.stringify(dbLogs.map(l => mapToLocal(l, AUDIT_LOG_MAP))));
    }

    // Sync automation_workflows
    const { data: dbWorkflows } = await supabase.from('automation_workflows').select('*').eq('tenant_id', activeTenantId);
    if (dbWorkflows) {
      localStorage.setItem('mock_workflows', JSON.stringify(dbWorkflows.map(w => mapToLocal(w, WORKFLOW_MAP))));
    }

    // Sync branch_locations
    const { data: dbBranches } = await supabase.from('branch_locations').select('*').eq('tenant_id', activeTenantId);
    if (dbBranches) {
      localStorage.setItem(`mock_branch_locations_${activeTenantId}`, JSON.stringify(dbBranches.map(b => mapToLocal(b, BRANCH_LOCATION_MAP))));
      
      for (const branch of dbBranches) {
        const { data: dbBranchInv } = await supabase.from('branch_inventory').select('*').eq('branch_id', branch.id);
        if (dbBranchInv) {
          localStorage.setItem(`mock_branch_inventory_${branch.id}`, JSON.stringify(dbBranchInv.map(bi => mapToLocal(bi, BRANCH_INVENTORY_MAP))));
        }
      }
    }

    // Sync api_keys
    const { data: dbApiKeys } = await supabase.from('api_keys').select('*').eq('tenant_id', activeTenantId);
    if (dbApiKeys) {
      localStorage.setItem('mock_api_keys', JSON.stringify(dbApiKeys.map(k => mapToLocal(k, API_KEY_MAP))));
    }

    // Sync enrollments
    const { data: dbEnrollments } = await supabase.from('enrollments').select('*').eq('user_id', session.user.id);
    if (dbEnrollments) {
      localStorage.setItem('mock_enrollments', JSON.stringify(dbEnrollments.map(e => mapToLocal(e, ENROLLMENT_MAP))));
    }

    // Dispatch reload event to all client listeners
    window.dispatchEvent(new CustomEvent('db-sync-complete'));

  } catch (err) {
    console.error('Failed to sync from Supabase:', err);
  }
}

// Start auth state listener and initial sync on client load
if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('TU_PROJECT_ID')) {
  import('@/lib/supabase-browser').then(({ getSupabase }) => {
    const supabase = getSupabase();
    supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        syncFromSupabase();
      }
    });
    syncFromSupabase();
  });
}

export default dbAdapter;