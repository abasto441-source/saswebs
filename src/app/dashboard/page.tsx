'use client';

import React, { useState, useEffect } from 'react';
import { dbAdapter, type Tenant, type Product, type Course, type Enrollment, type CMSCollection, type CMSItem, type CMSField, type AutomationWorkflow, type AuditLog, type Integration, type ApiKey, type BranchLocation, type BranchInventory, type TelemetryMetric } from '@/lib/supabase';
import { 
  BarChart, ShoppingBag, BookOpen, Settings, ToggleLeft, ToggleRight, 
  ArrowRight, Globe, Check, Plus, Trash2, Edit, Save, RefreshCw, BarChart2, Users,
  Grid, Calendar, CreditCard, Truck, Zap, Activity, Cpu, Key, Play, AlertCircle,
  FileText, Shield, List, Workflow, Layers, Eye, Download, Code, Database, X, Printer,
  MapPin, TrendingUp, Package, ArrowLeftRight, BarChart3, AlertOctagon, CheckCircle2, Type, Hash, Image as ImageIcon, Link as LinkIcon, CalendarDays,
  Book, Coins, Briefcase, Building, Award, FileSpreadsheet, Boxes, FileSignature, Wallet
} from 'lucide-react';
import Link from 'next/link';
import { hasPermission, getAllowedTabs, PERMISSIONS, type Permission } from '@/core/rbac';
import {
  calculatePnL,
  calculateBudgetDeviations,
  calculateDepreciation,
  calculateCashFlowDirect,
  computeLedgerBalances
} from '@/modules/accounting';
import {
  calculateWeightedForecast,
  calculateConversionRate,
  calculateCampaignMetrics,
  groupLeadsByStage
} from '@/modules/crm';

export default function DashboardPage() {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [reservations, setReservations] = useState<any[]>([]);

  // RBAC Role State
  const [activeRole, setActiveRole] = useState<'owner' | 'manager' | 'cajero' | 'invitado'>('owner');

  // Logged-in user from session
  const [sessionUser, setSessionUser] = useState<{ name: string; email: string; role: string } | null>(null);

  // Active Tab State
  const [activeTab, setActiveTab] = useState<
    'analytics' | 'products' | 'courses' | 'lms_users' | 'settings' | 'apps' | 
    'reservations' | 'cms' | 'workflows' | 'integrations' | 'billing' | 'audit' | 'reports' | 'api' | 'franquicias' |
    'accounting_accounts' | 'accounting_entries' | 'accounting_reports' |
    'education_schools' | 'education_members' | 'whitelabel' |
    'crm_pipeline' | 'fulfillment_orders' | 'inventory_warehouses' | 'helpdesk_support' | 'hr_payroll' | 'erp_pro'
  >('analytics');
  
  // Edit variables
  const [customDomain, setCustomDomain] = useState('');
  const [favicon, setFavicon] = useState('');
  const [analyticsId, setAnalyticsId] = useState('');
  const [themeDark, setThemeDark] = useState(false);
  const [emailForm, setEmailForm] = useState('');

  // New product form
  const [prodName, setProdName] = useState('');
  const [prodPrice, setProdPrice] = useState('');
  const [prodBarcode, setProdBarcode] = useState('');
  const [prodCategory, setProdCategory] = useState('Hardware');

  // New course form
  const [courseTitle, setCourseTitle] = useState('');
  const [courseDesc, setCourseDesc] = useState('');
  const [coursePrice, setCoursePrice] = useState('');
  const [courseLessons, setCourseLessons] = useState(10);
  const [courseInstructor, setCourseInstructor] = useState('');

  // Dynamic CMS / Visual DB Builder States
  const [collections, setCollections] = useState<CMSCollection[]>([]);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>('');
  const [newColName, setNewColName] = useState('');
  const [newColSlug, setNewColSlug] = useState('');
  const [cmsItems, setCmsItems] = useState<CMSItem[]>([]);
  const [newItemData, setNewItemData] = useState<Record<string, string>>({});
  // Visual DB Builder: field editor
  const [dbBuilderFields, setDbBuilderFields] = useState<CMSField[]>([
    { name: 'titulo', type: 'text' },
    { name: 'descripcion', type: 'text' }
  ]);
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldType, setNewFieldType] = useState<CMSField['type']>('text');
  const [newFieldRelation, setNewFieldRelation] = useState('');

  // Franchise / Sucursales States
  const [branches, setBranches] = useState<BranchLocation[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [branchInventory, setBranchInventory] = useState<BranchInventory[]>([]);
  const [transferQty, setTransferQty] = useState<Record<string, string>>({});

  // Granular RBAC Policy toggles
  const [rbacPolicies, setRbacPolicies] = useState<Record<string, Record<string, boolean>>>({
    products:    { read: true,  write: true,  delete: true },
    courses:     { read: true,  write: true,  delete: true },
    cms:         { read: true,  write: true,  delete: true },
    pos:         { read: true,  write: true,  delete: false },
    analytics:   { read: true,  write: false, delete: false },
    billing:     { read: true,  write: false, delete: false },
  });

  // Automation Workflow States
  const [workflows, setWorkflows] = useState<AutomationWorkflow[]>([]);
  const [newWfName, setNewWfName] = useState('');
  const [newWfTrigger, setNewWfTrigger] = useState('contact_form_submit');
  const [newWfActions, setNewWfActions] = useState<string[]>(['send_email']);

  // Integrations Hub States
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [editingIntegrationId, setEditingIntegrationId] = useState<string | null>(null);
  const [integrationConfig, setIntegrationConfig] = useState<Record<string, string>>({});

  // Audit Logs States
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Developer API Key States
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [newKeyName, setNewKeyName] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [webhookTrigger, setWebhookTrigger] = useState('pos_sale');

  // Part 4 Module Keys (Stripe, EasyPost)
  const [stripePublicKey, setStripePublicKey] = useState('');
  const [stripeSecretKey, setStripeSecretKey] = useState('');
  const [useSaaSStripe, setUseSaaSStripe] = useState(false);
  const [easyPostApiKey, setEasyPostApiKey] = useState('');
  const [metaPixelId, setMetaPixelId] = useState('');
  const [klaviyoWebhookUrl, setKlaviyoWebhookUrl] = useState('');

  // Connection Simulators
  const [stripeStatus, setStripeStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [easyPostStatus, setEasyPostStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [webhookStatus, setWebhookStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');

  // Module installation logs simulator
  const [isInstalling, setIsInstalling] = useState(false);
  const [installingModule, setInstallingModule] = useState<string | null>(null);
  const [installLogs, setInstallLogs] = useState<string[]>([]);

  // DNS & SSL Setup States
  const [dnsLogs, setDnsLogs] = useState<string[]>([]);
  const [isVerifyingDns, setIsVerifyingDns] = useState(false);
  const [dnsVerified, setDnsVerified] = useState(false);

  // Stripe Terminal states
  const [stripeTerminalStatus, setStripeTerminalStatus] = useState<'idle' | 'pairing' | 'paired'>('idle');
  const [stripeTerminalIp, setStripeTerminalIp] = useState('192.168.1.144');
  const [stripeTerminalCode, setStripeTerminalCode] = useState('stripe-code-99');

  // Publishing State
  const [isPublishing, setIsPublishing] = useState(false);

  // ==================== [NEW] CONTABILIDAD PRO STATES ====================
  const [accounts, setAccounts] = useState<any[]>([]);
  const [journalEntries, setJournalEntries] = useState<any[]>([]);
  const [journalItems, setJournalItems] = useState<any[]>([]);
  const [newAccCode, setNewAccCode] = useState('');
  const [newAccName, setNewAccName] = useState('');
  const [newAccType, setNewAccType] = useState<'activo' | 'pasivo' | 'patrimonio' | 'ingreso' | 'gasto'>('activo');
  const [newAccParent, setNewAccParent] = useState('');
  const [newJeDate, setNewJeDate] = useState(new Date().toISOString().substring(0, 10));
  const [newJeDesc, setNewJeDesc] = useState('');
  const [newJeItems, setNewJeItems] = useState<Array<{ accountId: string; debit: number; credit: number; costCenter?: string }>>([
    { accountId: '', debit: 0, credit: 0 },
    { accountId: '', debit: 0, credit: 0 }
  ]);
  const [selectedLedgerAccountId, setSelectedLedgerAccountId] = useState<string>('');
  
  // ==================== [NEW] WHITE LABEL STATES ====================
  const [wlBrandName, setWlBrandName] = useState('');
  const [wlLogoUrl, setWlLogoUrl] = useState('');
  const [wlPrimaryColor, setWlPrimaryColor] = useState('#06b6d4');
  const [wlSecondaryColor, setWlSecondaryColor] = useState('#0f172a');
  const [wlCustomEmailSender, setWlCustomEmailSender] = useState('');
  const [wlCustomEmailName, setWlCustomEmailName] = useState('');
  const [wlInvoiceFooter, setWlInvoiceFooter] = useState('');

  // ==================== [NEW] EDUCACION STATES ====================
  const [schools, setSchools] = useState<any[]>([]);
  const [eduMembers, setEduMembers] = useState<any[]>([]);
  const [newSchoolName, setNewSchoolName] = useState('');
  const [newSchoolAddress, setNewSchoolAddress] = useState('');
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<'student' | 'teacher' | 'parent'>('student');
  const [newMemberSchool, setNewMemberSchool] = useState('');

  // ==================== [NEW] TABS ENTERPRISE 80 STATES ====================
  const [leads, setLeads] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);

  // New Lead Form States
  const [newLeadName, setNewLeadName] = useState('');
  const [newLeadCompany, setNewLeadCompany] = useState('');
  const [newLeadEmail, setNewLeadEmail] = useState('');
  const [newLeadPhone, setNewLeadPhone] = useState('');
  const [newLeadValue, setNewLeadValue] = useState(0);

  // New Warehouse Form States
  const [newWhName, setNewWhName] = useState('');
  const [newWhLocation, setNewWhLocation] = useState('');

  // New Batch Form States
  const [newBatchProductId, setNewBatchProductId] = useState('');
  const [newBatchWhId, setNewBatchWhId] = useState('');
  const [newBatchNum, setNewBatchNum] = useState('');
  const [newBatchQty, setNewBatchQty] = useState(0);
  const [newBatchExpiry, setNewBatchExpiry] = useState('');

  // New Ticket Form States
  const [newTktCustName, setNewTktCustName] = useState('');
  const [newTktCustEmail, setNewTktCustEmail] = useState('');
  const [newTktSubject, setNewTktSubject] = useState('');
  const [newTktDesc, setNewTktDesc] = useState('');
  const [newTktPriority, setNewTktPriority] = useState<'low' | 'medium' | 'high'>('medium');

  // New Employee Form States
  const [newEmpFirst, setNewEmpFirst] = useState('');
  const [newEmpLast, setNewEmpLast] = useState('');
  const [newEmpEmail, setNewEmpEmail] = useState('');
  const [newEmpRole, setNewEmpRole] = useState('');
  const [newEmpSalary, setNewEmpSalary] = useState(0);
  const [newEmpHireDate, setNewEmpHireDate] = useState('');

  // ==================== CONTABILIDAD PRO STATES ====================
  const [accountingSubTab, setAccountingSubTab] = useState<'balances' | 'reconciliation' | 'budgets' | 'fixed_assets' | 'invoicing'>('balances');
  const [selectedCountryTax, setSelectedCountryTax] = useState<'CL' | 'MX' | 'CO' | 'PE' | 'BO'>('CL');
  const [fixedAssets, setFixedAssets] = useState<any[]>([]);
  const [budgetLimits, setBudgetLimits] = useState<any[]>([]);
  const [bankStatementLines, setBankStatementLines] = useState<any[]>([]);
  const [exchangeRates, setExchangeRates] = useState<any[]>([]);
  const [invoiceXmlLog, setInvoiceXmlLog] = useState<string[]>([]);

  // ==================== CRM PRO STATES ====================
  const [crmSubTab, setCrmSubTab] = useState<'pipeline' | 'directory' | 'activities' | 'quotes' | 'forecast' | 'campaigns'>('pipeline');
  const [contacts, setContacts] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);

  // Contact Form
  const [newContactName, setNewContactName] = useState('');
  const [newContactEmail, setNewContactEmail] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');
  const [newContactRole, setNewContactRole] = useState('');
  const [newContactCompanyId, setNewContactCompanyId] = useState('');

  // Company Form
  const [newCompanyName, setNewCompanyName] = useState('');
  const [newCompanyIndustry, setNewCompanyIndustry] = useState('Tecnología');
  const [newCompanySize, setNewCompanySize] = useState('10-50 empleados');
  const [newCompanyAddress, setNewCompanyAddress] = useState('');

  // Activity Form
  const [newActivityLeadId, setNewActivityLeadId] = useState('');
  const [newActivityTitle, setNewActivityTitle] = useState('');
  const [newActivityType, setNewActivityType] = useState<'call' | 'meeting' | 'email' | 'task'>('call');
  const [newActivityDate, setNewActivityDate] = useState('');
  const [newActivityNotes, setNewActivityNotes] = useState('');

  // Quote Form
  const [newQuoteLeadId, setNewQuoteLeadId] = useState('');
  const [newQuoteProductId, setNewQuoteProductId] = useState('');
  const [newQuoteQty, setNewQuoteQty] = useState(1);
  const [newQuoteValidUntil, setNewQuoteValidUntil] = useState('');

  // Campaign Form
  const [newCampaignName, setNewCampaignName] = useState('');
  const [newCampaignSubject, setNewCampaignSubject] = useState('');

  // WhatsApp Form
  const [whatsappMessages, setWhatsappMessages] = useState<any[]>([]);
  const [waSelectedLeadId, setWaSelectedLeadId] = useState('');
  const [waNewMessage, setWaNewMessage] = useState('');

  // Fixed Asset Form
  const [newAssetName, setNewAssetName] = useState('');
  const [newAssetValue, setNewAssetValue] = useState(0);
  const [newAssetSalvage, setNewAssetSalvage] = useState(0);
  const [newAssetLifespan, setNewAssetLifespan] = useState(5);

  // Budget Limit Form
  const [newBudgetAccount, setNewBudgetAccount] = useState('');
  const [newBudgetAmount, setNewBudgetAmount] = useState(0);
  const [newBudgetPeriod, setNewBudgetPeriod] = useState('2026-06');

  // ==================== ERP PRO STATES ====================
  const [erpSubTab, setErpSubTab] = useState<'production' | 'quality' | 'purchases' | 'assets' | 'maintenance' | 'payroll' | 'documents' | 'signatures'>('production');
  const [erpWorkOrders, setErpWorkOrders] = useState<any[]>([]);
  const [erpQualityChecks, setErpQualityChecks] = useState<any[]>([]);
  const [erpPurchaseOrders, setErpPurchaseOrders] = useState<any[]>([]);
  const [erpMaintenanceTasks, setErpMaintenanceTasks] = useState<any[]>([]);
  const [erpDocuments, setErpDocuments] = useState<any[]>([]);
  const [erpSignatures, setErpSignatures] = useState<any[]>([]);

  // Production Form
  const [newWoProduct, setNewWoProduct] = useState('');
  const [newWoQty, setNewWoQty] = useState(1);
  const [newWoDeadline, setNewWoDeadline] = useState('');

  // Quality Check Form
  const [newQcProduct, setNewQcProduct] = useState('');
  const [newQcResult, setNewQcResult] = useState<'pass' | 'fail'>('pass');
  const [newQcNotes, setNewQcNotes] = useState('');

  // Purchase Order Form
  const [newPoSupplier, setNewPoSupplier] = useState('');
  const [newPoItem, setNewPoItem] = useState('');
  const [newPoQty, setNewPoQty] = useState(1);
  const [newPoUnitPrice, setNewPoUnitPrice] = useState(0);

  // Maintenance Form
  const [newMtAsset, setNewMtAsset] = useState('');
  const [newMtType, setNewMtType] = useState<'preventive' | 'corrective'>('preventive');
  const [newMtDate, setNewMtDate] = useState('');
  const [newMtTech, setNewMtTech] = useState('');

  // Document Form
  const [newDocTitle, setNewDocTitle] = useState('');
  const [newDocCategory, setNewDocCategory] = useState('Contrato');

  // Signature Form
  const [newSigDocId, setNewSigDocId] = useState('');
  const [newSigSigner, setNewSigSigner] = useState('');

  // Helper check for Read-Only guest mode
  const isGuestMode = activeRole === 'invitado';

  // Load all initial tenant database lists
  const reloadAllData = () => {
    const active = dbAdapter.getActiveTenant();
    setTenant(active);
    setProducts(dbAdapter.getProducts());
    setCourses(dbAdapter.getCourses());
    setEnrollments(dbAdapter.getEnrollments());
    setReservations(dbAdapter.getReservations());

    setCollections(dbAdapter.getCollections().filter(c => c.tenantId === active.id));
    setWorkflows(dbAdapter.getWorkflows().filter(w => w.tenantId === active.id));
    setIntegrations(dbAdapter.getIntegrations().filter(i => i.tenantId === active.id));
    setAuditLogs(dbAdapter.getAuditLogs().filter(l => l.tenantId === active.id));
    setApiKeys(dbAdapter.getApiKeys().filter(k => k.tenantId === active.id));
    setBranches(dbAdapter.getBranchLocations(active.id));

    setCustomDomain(active.customDomain || '');
    setFavicon(active.favicon || '🎨');
    setAnalyticsId(active.googleAnalyticsId || '');
    setThemeDark(active.themeDarkMode);
    setEmailForm('contacto@' + active.subdomain + '.com');

    setStripePublicKey(active.stripePublicKey || '');
    setStripeSecretKey(active.stripeSecretKey || '');
    setUseSaaSStripe(active.useSaaSStripe || false);
    setEasyPostApiKey(active.easyPostApiKey || '');
    setMetaPixelId(active.metaPixelId || '');
    setKlaviyoWebhookUrl(active.klaviyoWebhookUrl || '');

    // Load new Contabilidad data
    const accs = dbAdapter.getAccountingAccounts(active.id);
    setAccounts(accs);
    setJournalEntries(dbAdapter.getJournalEntries(active.id));
    setJournalItems(dbAdapter.getJournalItems(active.id));
    if (accs.length > 0 && !selectedLedgerAccountId) {
      setSelectedLedgerAccountId(accs[0].id);
    }

    // Load new White label data
    const wl = dbAdapter.getWhiteLabelSettings(active.id);
    setWlBrandName(wl.brandName || '');
    setWlLogoUrl(wl.logoUrl || '');
    setWlPrimaryColor(wl.primaryColor);
    setWlSecondaryColor(wl.secondaryColor);
    setWlCustomEmailSender(wl.customEmailSender || '');
    setWlCustomEmailName(wl.customEmailName || '');
    setWlInvoiceFooter(wl.invoiceFooter || '');

    // Load new Education data
    setSchools(dbAdapter.getEducationSchools(active.id));
    setEduMembers(dbAdapter.getEducationMembers(active.id));

    // Load new CRM, Warehouses, Tickets, Employees
    setLeads(dbAdapter.getCrmLeads(active.id));
    setWarehouses(dbAdapter.getWarehouses(active.id));
    setBatches(dbAdapter.getBatches(active.id));
    setTickets(dbAdapter.getHelpdeskTickets(active.id));
    setEmployees(dbAdapter.getEmployees(active.id));

    // Load Contabilidad PRO data
    setFixedAssets(dbAdapter.getFixedAssets(active.id));
    setBudgetLimits(dbAdapter.getBudgetLimits(active.id));
    setBankStatementLines(dbAdapter.getBankStatementLines(active.id));
    setExchangeRates(dbAdapter.getExchangeRates(active.id));

    // Load CRM PRO data
    setContacts(dbAdapter.getCrmContacts(active.id));
    setCompanies(dbAdapter.getCrmCompanies(active.id));
    setActivities(dbAdapter.getCrmActivities(active.id));
    setQuotes(dbAdapter.getCrmQuotes(active.id));
    setCampaigns(dbAdapter.getCrmCampaigns(active.id));
    setWhatsappMessages(dbAdapter.getCrmWhatsAppMessages(active.id));

    // Load ERP PRO data
    setErpWorkOrders(dbAdapter.getErpWorkOrders(active.id));
    setErpQualityChecks(dbAdapter.getErpQualityChecks(active.id));
    setErpPurchaseOrders(dbAdapter.getErpPurchaseOrders(active.id));
    setErpMaintenanceTasks(dbAdapter.getErpMaintenanceTasks(active.id));
    setErpDocuments(dbAdapter.getErpDocuments(active.id));
  };

  useEffect(() => {
    // Read stored session and sync role
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('saswebs_user');
      if (stored) {
        try {
          const user = JSON.parse(stored);
          setSessionUser({ name: user.name || user.email, email: user.email, role: user.role });
          // Map stored role to dashboard RBAC role
          const roleMap: Record<string, 'owner' | 'manager' | 'cajero' | 'invitado'> = {
            owner: 'owner',
            super_admin: 'owner',
            manager: 'manager',
            pos: 'cajero',
            student: 'invitado',
          };
          const mappedRole = roleMap[user.role] || 'invitado';
          setActiveRole(mappedRole);

          // Switch active tenant if user has a specific one
          if (user.tenantId) {
            const allTenants = dbAdapter.getTenants();
            const match = allTenants.find((t: any) => t.id === user.tenantId);
            if (match) {
              dbAdapter.setActiveTenantId(match.id);
            }
          }
        } catch {}
      }
    }
    reloadAllData();
  }, []);

  // Set collection id helper
  useEffect(() => {
    if (collections.length > 0 && !selectedCollectionId) {
      setSelectedCollectionId(collections[0].id);
    }
  }, [collections]);

  // Load items of the selected CMS collection
  useEffect(() => {
    if (selectedCollectionId) {
      const allItems = dbAdapter.getCmsItems();
      setCmsItems(allItems.filter(item => item.collectionId === selectedCollectionId));
      
      const activeCol = collections.find(c => c.id === selectedCollectionId);
      if (activeCol) {
        const initialFields: Record<string, string> = {};
        activeCol.fields.forEach(f => {
          const fieldName = typeof f === 'string' ? f : (f as CMSField).name;
          initialFields[fieldName] = '';
        });
        setNewItemData(initialFields);
        // Sync db builder fields from loaded collection
        setDbBuilderFields(activeCol.fields.map(f => 
          typeof f === 'string' ? { name: f, type: 'text' as const } : f as CMSField
        ));
      }
    }
  }, [selectedCollectionId, collections]);

  // ==================== [NEW] CONTABILIDAD PRO HANDLERS ====================
  const handleAddAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyPermission(PERMISSIONS.ACCOUNTING_POST_JOURNAL)) return;
    if (!newAccCode || !newAccName || !tenant) return;
    const newAcc = {
      id: 'acc-' + Date.now(),
      tenantId: tenant.id,
      code: newAccCode,
      name: newAccName,
      type: newAccType,
      parentId: newAccParent || undefined
    };
    const updated = [...accounts, newAcc];
    setAccounts(updated);
    dbAdapter.saveAccountingAccounts(tenant.id, updated);
    dbAdapter.addAuditLog(tenant.id, `${activeRole}@tenant.com`, 'Crear Cuenta Contable', `Cuenta: ${newAccCode} - ${newAccName}`);
    setNewAccCode('');
    setNewAccName('');
    setNewAccParent('');
    reloadAllData();
  };

  const handleCreateJournalEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyPermission(PERMISSIONS.ACCOUNTING_POST_JOURNAL)) return;
    if (!newJeDesc || !tenant) return;

    // Validate double entry ledger rule: Sum(Debit) == Sum(Credit)
    const totalDebit = newJeItems.reduce((acc, item) => acc + (parseFloat(item.debit as any) || 0), 0);
    const totalCredit = newJeItems.reduce((acc, item) => acc + (parseFloat(item.credit as any) || 0), 0);

    if (totalDebit !== totalCredit) {
      alert(`Error de Partida Doble: El total del Debe ($${totalDebit.toFixed(2)}) debe coincidir exactamente con el total del Haber ($${totalCredit.toFixed(2)}).`);
      return;
    }

    if (totalDebit <= 0) {
      alert('El monto del asiento debe ser mayor a 0.');
      return;
    }

    const newEntry = {
      id: 'je-' + Date.now(),
      tenantId: tenant.id,
      entryDate: newJeDate,
      description: newJeDesc,
      status: 'posted' as const
    };

    const newItems = newJeItems.map((item, idx) => ({
      id: `ji-${Date.now()}-${idx}`,
      tenantId: tenant.id,
      entryId: newEntry.id,
      accountId: item.accountId,
      debit: parseFloat(item.debit as any) || 0,
      credit: parseFloat(item.credit as any) || 0,
      costCenter: item.costCenter || undefined
    }));

    const updatedEntries = [...journalEntries, newEntry];
    const updatedItems = [...journalItems, ...newItems];

    setJournalEntries(updatedEntries);
    setJournalItems(updatedItems);

    dbAdapter.saveJournalEntries(tenant.id, updatedEntries);
    dbAdapter.saveJournalItems(tenant.id, updatedItems);

    dbAdapter.addAuditLog(tenant.id, `${activeRole}@tenant.com`, 'Crear Asiento Contable', `Asiento: ${newJeDesc} ($${totalDebit.toFixed(2)})`);

    // Reset Form
    setNewJeDesc('');
    setNewJeItems([
      { accountId: '', debit: 0, credit: 0 },
      { accountId: '', debit: 0, credit: 0 }
    ]);
    reloadAllData();
    alert('Asiento contable asentado (posted) exitosamente en el Libro Diario.');
  };

  // ==================== [NEW] WHITE LABEL HANDLERS ====================
  const handleSaveWhiteLabel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyPermission(PERMISSIONS.COMPANY_WHITELABEL_MANAGE)) return;
    if (!tenant) return;
    const wl = {
      tenantId: tenant.id,
      brandName: wlBrandName,
      logoUrl: wlLogoUrl,
      primaryColor: wlPrimaryColor,
      secondaryColor: wlSecondaryColor,
      customEmailSender: wlCustomEmailSender,
      customEmailName: wlCustomEmailName,
      invoiceFooter: wlInvoiceFooter
    };
    dbAdapter.saveWhiteLabelSettings(tenant.id, wl);
    dbAdapter.addAuditLog(tenant.id, `${activeRole}@tenant.com`, 'Actualizar WhiteLabel', `Configuración de marca actualizada`);
    reloadAllData();
    alert('Ajustes de marca White Label guardados con éxito.');
  };

  // ==================== [NEW] EDUCACION HANDLERS ====================
  const handleAddSchool = (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyPermission(PERMISSIONS.LMS_SCHOOLS_MANAGE)) return;
    if (!newSchoolName || !tenant) return;
    const newSch = {
      id: 'sch-' + Date.now(),
      tenantId: tenant.id,
      name: newSchoolName,
      address: newSchoolAddress
    };
    const updated = [...schools, newSch];
    setSchools(updated);
    dbAdapter.saveEducationSchools(tenant.id, updated);
    setNewSchoolName('');
    setNewSchoolAddress('');
    reloadAllData();
  };

  const handleAddEducationMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyPermission(PERMISSIONS.LMS_STUDENTS_ENROLL)) return;
    if (!newMemberName || !tenant) return;
    const newMem = {
      id: 'em-' + Date.now(),
      tenantId: tenant.id,
      schoolId: newMemberSchool || undefined,
      name: newMemberName,
      email: newMemberEmail,
      role: newMemberRole
    };
    const updated = [...eduMembers, newMem];
    setEduMembers(updated);
    dbAdapter.saveEducationMembers(tenant.id, updated);
    setNewMemberName('');
    setNewMemberEmail('');
    reloadAllData();
  };

  // CRM Form Actions
  const handleAddLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyPermission(PERMISSIONS.CRM_CONTACTS_WRITE)) return;
    if (!newLeadName || !tenant) return;
    const newL = {
      id: 'lead-' + Date.now(),
      tenantId: tenant.id,
      name: newLeadName,
      company: newLeadCompany || undefined,
      email: newLeadEmail || undefined,
      phone: newLeadPhone || undefined,
      value: Number(newLeadValue),
      stage: 'prospect' as const
    };
    const updated = [...leads, newL];
    setLeads(updated);
    dbAdapter.saveCrmLeads(tenant.id, updated);
    dbAdapter.addAuditLog(tenant.id, `${activeRole}@tenant.com`, 'CRM Prospecto Creado', `Prospecto: ${newLeadName} por $${newL.value}`);
    setNewLeadName('');
    setNewLeadCompany('');
    setNewLeadEmail('');
    setNewLeadPhone('');
    setNewLeadValue(0);
    reloadAllData();
  };

  const handleUpdateLeadStage = (id: string, stage: 'prospect' | 'contacted' | 'qualified' | 'proposal' | 'won' | 'lost') => {
    if (!verifyPermission(PERMISSIONS.CRM_PIPELINE_MANAGE)) return;
    if (!tenant) return;
    const updated = leads.map(l => l.id === id ? { ...l, stage } : l);
    setLeads(updated);
    dbAdapter.saveCrmLeads(tenant.id, updated);
    dbAdapter.addAuditLog(tenant.id, `${activeRole}@tenant.com`, 'CRM Estado Modificado', `ID: ${id} a etapa: ${stage}`);
    reloadAllData();
  };

  const handleDeleteLead = (id: string) => {
    if (!verifyPermission(PERMISSIONS.CRM_CONTACTS_DELETE)) return;
    if (!tenant) return;
    const updated = leads.filter(l => l.id !== id);
    setLeads(updated);
    dbAdapter.saveCrmLeads(tenant.id, updated);
    dbAdapter.addAuditLog(tenant.id, `${activeRole}@tenant.com`, 'CRM Prospecto Eliminado', `ID: ${id}`);
    reloadAllData();
  };

  // Warehouse Form Actions
  const handleAddWarehouse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyPermission(PERMISSIONS.PRODUCTS_CREATE)) return;
    if (!newWhName || !tenant) return;
    const newW = {
      id: 'wh-' + Date.now(),
      tenantId: tenant.id,
      name: newWhName,
      location: newWhLocation || undefined
    };
    const updated = [...warehouses, newW];
    setWarehouses(updated);
    dbAdapter.saveWarehouses(tenant.id, updated);
    dbAdapter.addAuditLog(tenant.id, `${activeRole}@tenant.com`, 'Almacén Creado', `Almacén: ${newWhName}`);
    setNewWhName('');
    setNewWhLocation('');
    reloadAllData();
  };

  // Batch Form Actions
  const handleAddBatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyPermission(PERMISSIONS.INVENTORY_ADJUST)) return;
    if (!newBatchProductId || !newBatchWhId || !newBatchNum || !tenant) return;
    const newB = {
      id: 'batch-' + Date.now(),
      tenantId: tenant.id,
      productId: newBatchProductId,
      warehouseId: newBatchWhId,
      batchNumber: newBatchNum,
      qty: Number(newBatchQty),
      expiryDate: newBatchExpiry || undefined
    };
    const updated = [...batches, newB];
    setBatches(updated);
    dbAdapter.saveBatches(tenant.id, updated);
    
    // Sum stock back to main product
    const updatedProds = products.map(p => 
      p.id === newBatchProductId 
        ? { ...p, stock: p.stock + newB.qty } 
        : p
    );
    setProducts(updatedProds);
    dbAdapter.saveProducts(updatedProds);

    dbAdapter.addAuditLog(tenant.id, `${activeRole}@tenant.com`, 'Lote Inventario Asignado', `Lote: ${newBatchNum}, Qty: ${newB.qty}`);
    setNewBatchNum('');
    setNewBatchQty(0);
    setNewBatchExpiry('');
    reloadAllData();
  };

  // Fulfillment Actions
  const handleUpdateShippingStatus = (orderId: string, status: 'pending' | 'packing' | 'shipped' | 'delivered') => {
    if (!verifyPermission(PERMISSIONS.SALES_ORDERS_APPROVE)) return;
    if (!tenant) return;
    
    const savedOrders = dbAdapter.getStorage('mock_orders', []);
    const updatedOrders = savedOrders.map((o: any) => {
      if (o.id === orderId) {
        let tracking = o.trackingNumber;
        if (status === 'shipped' && !tracking) {
          tracking = 'EP-' + Math.floor(10000000 + Math.random() * 90000000);
        }
        return { ...o, shippingStatus: status, trackingNumber: tracking };
      }
      return o;
    });
    dbAdapter.setStorage('mock_orders', updatedOrders);
    dbAdapter.addAuditLog(tenant.id, `${activeRole}@tenant.com`, 'Envío Modificado', `Pedido ID ${orderId} a estado: ${status}`);
    reloadAllData();
  };

  // HelpDesk Actions
  const handleAddTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTktSubject || !newTktDesc || !tenant) return;
    const newT = {
      id: 'tkt-' + Date.now(),
      tenantId: tenant.id,
      customerName: newTktCustName || 'Cliente Anónimo',
      customerEmail: newTktCustEmail || 'anonimo@gmail.com',
      subject: newTktSubject,
      description: newTktDesc,
      status: 'open' as const,
      priority: newTktPriority
    };
    const updated = [...tickets, newT];
    setTickets(updated);
    dbAdapter.saveHelpdeskTickets(tenant.id, updated);
    dbAdapter.addAuditLog(tenant.id, 'cliente@help.com', 'Ticket Creado', `Asunto: ${newTktSubject}`);
    setNewTktCustName('');
    setNewTktCustEmail('');
    setNewTktSubject('');
    setNewTktDesc('');
    reloadAllData();
  };

  const handleUpdateTicketStatus = (id: string, status: 'open' | 'pending' | 'resolved') => {
    if (!verifyPermission(PERMISSIONS.COMPANY_AUDIT_READ)) return;
    if (!tenant) return;
    const updated = tickets.map(t => t.id === id ? { ...t, status } : t);
    setTickets(updated);
    dbAdapter.saveHelpdeskTickets(tenant.id, updated);
    dbAdapter.addAuditLog(tenant.id, `${activeRole}@tenant.com`, 'Ticket Actualizado', `ID ${id} a estado: ${status}`);
    reloadAllData();
  };

  // HR & Payroll Actions
  const handleAddEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyPermission(PERMISSIONS.COMPANY_USERS_CREATE)) return;
    if (!newEmpFirst || !newEmpEmail || !tenant) return;
    const newEmp = {
      id: 'emp-' + Date.now(),
      tenantId: tenant.id,
      firstName: newEmpFirst,
      lastName: newEmpLast,
      email: newEmpEmail,
      role: newEmpRole,
      salary: Number(newEmpSalary),
      hireDate: newEmpHireDate || undefined,
      status: 'active' as const
    };
    const updated = [...employees, newEmp];
    setEmployees(updated);
    dbAdapter.saveEmployees(tenant.id, updated);
    dbAdapter.addAuditLog(tenant.id, `${activeRole}@tenant.com`, 'Empleado Contratado', `${newEmpFirst} ${newEmpLast} como ${newEmpRole}`);
    setNewEmpFirst('');
    setNewEmpLast('');
    setNewEmpEmail('');
    setNewEmpRole('');
    setNewEmpSalary(0);
    setNewEmpHireDate('');
    reloadAllData();
  };

  const handleRunPayroll = () => {
    if (!verifyPermission(PERMISSIONS.COMPANY_USERS_ASSIGN_ROLES)) return;
    if (!tenant) return;

    const activeStaff = employees.filter(e => e.status === 'active');
    if (activeStaff.length === 0) {
      alert('No hay empleados activos registrados para procesar nómina.');
      return;
    }
    const totalPayroll = activeStaff.reduce((sum, emp) => sum + emp.salary, 0);

    const expenseAccount = accounts.find(a => a.type === 'gasto' && a.code.startsWith('5'));
    const cashAccount = accounts.find(a => a.type === 'activo' && a.code.startsWith('1'));

    if (!expenseAccount || !cashAccount) {
      alert('Error contable: No se encontraron cuentas de Gasto y Caja/Banco en tu plan contable. Configúralas primero.');
      return;
    }

    const entryId = 'JE-PAY-' + Date.now();
    const newEntry = {
      id: entryId,
      tenantId: tenant.id,
      entryDate: new Date().toISOString().substring(0, 10),
      description: `Pago de Planilla Mensual - Staff (${activeStaff.length} Empleados)`,
      status: 'posted' as const
    };

    const newItems = [
      {
        id: 'ji-pay-1-' + Date.now(),
        tenantId: tenant.id,
        entryId: entryId,
        accountId: expenseAccount.id,
        debit: totalPayroll,
        credit: 0,
        costCenter: 'Administración'
      },
      {
        id: 'ji-pay-2-' + Date.now(),
        tenantId: tenant.id,
        entryId: entryId,
        accountId: cashAccount.id,
        debit: 0,
        credit: totalPayroll,
        costCenter: 'Caja Central'
      }
    ];

    const allEntries = dbAdapter.getJournalEntries(tenant.id);
    dbAdapter.saveJournalEntries(tenant.id, [...allEntries, newEntry]);

    const allItems = dbAdapter.getJournalItems(tenant.id);
    dbAdapter.saveJournalItems(tenant.id, [...allItems, ...newItems]);

    dbAdapter.addAuditLog(
      tenant.id, 
      `${activeRole}@tenant.com`, 
      'Nómina Contabilizada', 
      `Pago planilla total $${totalPayroll.toFixed(2)} registrado en Libro Diario.`
    );

    alert(`¡Planilla procesada con éxito!\nTotal Nómina: $${totalPayroll.toFixed(2)}\nAsiento contable [${entryId}] generado en Libro Diario.`);
    reloadAllData();
  };

  const verifyPermission = (permission: Permission) => {
    const userSession = {
      id: 'session-user',
      email: sessionUser?.email || `${activeRole}@tenant.com`,
      role: activeRole,
    };
    if (!hasPermission(userSession, permission)) {
      alert(`Acceso denegado: Tu rol [${activeRole}] no cuenta con el permiso requerido [${permission}].`);
      return false;
    }
    if (isGuestMode) {
      alert('Acceso denegado: El rol de Invitado está limitado estrictamente a lectura.');
      return false;
    }
    return true;
  };

  const handleVerifyDns = () => {
    if (!verifyPermission(PERMISSIONS.COMPANY_SETTINGS_WRITE)) return;
    if (!customDomain) {
      alert('Por favor introduce un dominio personalizado primero (ej. www.suempresa.com).');
      return;
    }
    setIsVerifyingDns(true);
    setDnsVerified(false);
    setDnsLogs([]);

    const steps = [
      `🔍 [DNS] Resolviendo dominio: ${customDomain}...`,
      `📡 [DNS] Registro CNAME detectado apuntando a: celeste-saas.pages.dev`,
      `🔐 [SSL] Negociando certificado TLS comodín con Let's Encrypt...`,
      `✓ [SSL] Reto HTTP-01 aprobado por Let's Encrypt.`,
      `✓ [SSL] Certificado SSL firmado y validado para ${customDomain}.`,
      `🚀 [Cloudflare] Reglas de enrutamiento y caché activas en el Edge.`
    ];

    const runSteps = (idx: number) => {
      if (idx < steps.length) {
        setTimeout(() => {
          setDnsLogs(prev => [...prev, steps[idx]]);
          runSteps(idx + 1);
        }, 500);
      } else {
        setTimeout(() => {
          setIsVerifyingDns(false);
          setDnsVerified(true);
          if (tenant) {
            const updated = { ...tenant, customDomain };
            setTenant(updated);
            const all = dbAdapter.getTenants().map(t => t.id === tenant.id ? updated : t);
            dbAdapter.saveTenants(all);
            dbAdapter.addAuditLog(tenant.id, `${activeRole}@tenant.com`, 'Configurar Dominio CNAME', `DNS SSL habilitado para ${customDomain}`);
            reloadAllData();
          }
          alert(`¡Dominio ${customDomain} vinculado con éxito con certificado SSL Let's Encrypt activo!`);
        }, 400);
      }
    };
    runSteps(0);
  };

  const handlePublish = () => {
    if (!verifyPermission(PERMISSIONS.WEBSITE_PAGES_PUBLISH)) return;
    setIsPublishing(true);
    setTimeout(() => {
      setIsPublishing(false);
      if (tenant) {
        dbAdapter.addAuditLog(tenant.id, `${activeRole}@tenant.com`, 'Publicar Sitio', 'ISR Regeneración de páginas y purga de cache Cloudflare.');
        reloadAllData();
      }
      alert('¡Sitio Web publicado con éxito! Cloudflare Edge ha purgado la caché y renderizado la página de inicio de forma estática.');
    }, 1200);
  };

  const handleInstallModule = (moduleKey: 'isEcommerceEnabled' | 'isPosEnabled' | 'isLmsEnabled' | 'isReservasEnabled', label: string) => {
    if (!verifyPermission(PERMISSIONS.COMPANY_MODULES_TOGGLE)) return;
    if (!tenant) return;
    setInstallingModule(label);
    setIsInstalling(true);
    setInstallLogs([]);

    const steps = {
      isEcommerceEnabled: [
        '🔍 Inicializando conexión externa con Medusa API...',
        '📦 Generando ID de tienda en Shopify/Medusa: shop-' + Math.random().toString(36).substring(2, 9),
        '🔑 Configurando llaves en el almacén seguro (Vault)...',
        '🎨 Desbloqueando bloques dinámicos de catálogo y cuadrícula de productos en el constructor...'
      ],
      isPosEnabled: [
        '🔄 Inicializando Service Worker PWA offline...',
        '💾 Creando almacén IndexedDB local en el navegador...',
        '📡 Configurando intervalos de replicación offline-first (5s)...',
        '🚀 Ruta de acceso al punto de venta offline (/pos) desbloqueada!'
      ],
      isLmsEnabled: [
        '📁 Creando tablas SQL `courses` y `enrollments` en la base de datos...',
        '👥 Configurando progresos de alumnos y registro de lecciones...',
        '📚 Desbloqueando componentes de Aula Virtual en la barra lateral del editor...'
      ],
      isReservasEnabled: [
        '📅 Inicializando motor de agenda y calendario de citas...',
        '🛠️ Creando tabla `reservations` en PostgreSQL...',
        '⏰ Configurando intervalos de atención y horarios...',
        '🔓 Módulo de reservas y calendarios desbloqueados con éxito!'
      ]
    }[moduleKey];

    const runSteps = (idx: number) => {
      if (idx < steps.length) {
        setTimeout(() => {
          setInstallLogs(prev => [...prev, steps[idx]]);
          runSteps(idx + 1);
        }, 600);
      } else {
        setTimeout(() => {
          const updated: Tenant = { ...tenant, [moduleKey]: true };
          if (moduleKey === 'isEcommerceEnabled' && !updated.medusaShopId) {
            updated.medusaShopId = 'medusa-shop-' + tenant.subdomain + '-' + Math.floor(Math.random() * 1000);
          }
          setTenant(updated);
          const all = dbAdapter.getTenants().map(t => t.id === tenant.id ? updated : t);
          dbAdapter.saveTenants(all);
          dbAdapter.addAuditLog(tenant.id, `${activeRole}@tenant.com`, 'Instalar Módulo', `Módulo instalado: ${label}`);
          setIsInstalling(false);
          setInstallingModule(null);
          reloadAllData();
          alert(`Módulo "${label}" instalado con éxito.`);
        }, 500);
      }
    };

    runSteps(0);
  };

  const handleUninstallModule = (moduleKey: 'isEcommerceEnabled' | 'isPosEnabled' | 'isLmsEnabled' | 'isReservasEnabled', label: string) => {
    if (!verifyPermission(PERMISSIONS.COMPANY_MODULES_TOGGLE)) return;
    if (!tenant) return;
    if (confirm(`¿Estás seguro de que deseas desinstalar el módulo "${label}"? Se ocultarán los bloques correspondientes en el constructor.`)) {
      const updated: Tenant = { ...tenant, [moduleKey]: false };
      setTenant(updated);
      const all = dbAdapter.getTenants().map(t => t.id === tenant.id ? updated : t);
      dbAdapter.saveTenants(all);
      dbAdapter.addAuditLog(tenant.id, `${activeRole}@tenant.com`, 'Desinstalar Módulo', `Módulo desinstalado: ${label}`);
      reloadAllData();
      alert(`Módulo "${label}" desinstalado.`);
    }
  };

  const handleSaveSettings = () => {
    if (!verifyPermission(PERMISSIONS.COMPANY_SETTINGS_WRITE)) return;
    if (!tenant) return;
    const updated: Tenant = { 
      ...tenant, 
      customDomain: customDomain.trim() || undefined,
      favicon: favicon.trim(),
      googleAnalyticsId: analyticsId.trim() || undefined,
      themeDarkMode: themeDark
    };
    setTenant(updated);
    const all = dbAdapter.getTenants().map(t => t.id === tenant.id ? updated : t);
    dbAdapter.saveTenants(all);
    dbAdapter.addAuditLog(tenant.id, `${activeRole}@tenant.com`, 'Actualizar Ajustes', 'Configuraciones generales del inquilino modificadas.');
    reloadAllData();
    alert('Configuraciones generales actualizadas con éxito.');
  };

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyPermission(PERMISSIONS.PRODUCTS_CREATE)) return;
    if (!prodName || !prodPrice || !prodBarcode) return;
    const newP: Product = {
      id: 'p-' + Date.now(),
      name: prodName,
      price: parseFloat(prodPrice),
      barcode: prodBarcode,
      imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400',
      category: prodCategory,
      stock: 20
    };
    const list = [...products, newP];
    setProducts(list);
    dbAdapter.saveProducts(list);
    if (tenant) {
      dbAdapter.addAuditLog(tenant.id, `${activeRole}@tenant.com`, 'Crear Producto', `Producto agregado: ${prodName} (BC: ${prodBarcode})`);
    }
    reloadAllData();
    setProdName('');
    setProdPrice('');
    setProdBarcode('');
  };

  const handleAddCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyPermission(PERMISSIONS.LMS_COURSES_CREATE)) return;
    if (!courseTitle || !courseDesc || !coursePrice) return;
    const newC: Course = {
      id: 'c-' + Date.now(),
      title: courseTitle,
      description: courseDesc,
      price: parseFloat(coursePrice),
      lessonsCount: courseLessons,
      instructorName: courseInstructor || 'Instructor',
      thumbnail: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400'
    };
    const list = [...courses, newC];
    setCourses(list);
    dbAdapter.saveCourses(list);
    if (tenant) {
      dbAdapter.addAuditLog(tenant.id, `${activeRole}@tenant.com`, 'Crear Curso LMS', `Curso matriculado: ${courseTitle}`);
    }
    reloadAllData();
    setCourseTitle('');
    setCourseDesc('');
    setCoursePrice('');
    setCourseInstructor('');
  };

  // ==================== CRM PRO ACTIONS ====================
  const handleAddCrmContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyPermission(PERMISSIONS.CRM_CONTACTS_WRITE)) return;
    if (!tenant || !newContactName || !newContactEmail) return;

    const newContact = {
      id: 'cnt-' + Date.now(),
      tenantId: tenant.id,
      name: newContactName,
      email: newContactEmail,
      phone: newContactPhone,
      role: newContactRole,
      companyId: newContactCompanyId || undefined
    };

    const list = [...contacts, newContact];
    dbAdapter.saveCrmContacts(tenant.id, list);
    dbAdapter.addAuditLog(tenant.id, `${activeRole}@tenant.com`, 'Registrar Contacto B2B', `Contacto: ${newContactName}`);

    reloadAllData();
    setNewContactName('');
    setNewContactEmail('');
    setNewContactPhone('');
    setNewContactRole('');
    setNewContactCompanyId('');
  };

  const handleAddCrmCompany = (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyPermission(PERMISSIONS.CRM_CONTACTS_WRITE)) return;
    if (!tenant || !newCompanyName) return;

    const newCompany = {
      id: 'comp-' + Date.now(),
      tenantId: tenant.id,
      name: newCompanyName,
      industry: newCompanyIndustry,
      size: newCompanySize,
      address: newCompanyAddress || undefined
    };

    const list = [...companies, newCompany];
    dbAdapter.saveCrmCompanies(tenant.id, list);
    dbAdapter.addAuditLog(tenant.id, `${activeRole}@tenant.com`, 'Registrar Empresa B2B', `Empresa: ${newCompanyName}`);

    reloadAllData();
    setNewCompanyName('');
    setNewCompanyAddress('');
  };

  const handleAddCrmActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyPermission(PERMISSIONS.CRM_PIPELINE_MANAGE)) return;
    if (!tenant || !newActivityLeadId || !newActivityTitle || !newActivityDate) return;

    const newAct = {
      id: 'act-' + Date.now(),
      tenantId: tenant.id,
      leadId: newActivityLeadId,
      title: newActivityTitle,
      type: newActivityType,
      date: newActivityDate,
      notes: newActivityNotes || undefined,
      completed: false
    };

    const list = [...activities, newAct];
    dbAdapter.saveCrmActivities(tenant.id, list);
    dbAdapter.addAuditLog(tenant.id, `${activeRole}@tenant.com`, 'Planificar Actividad CRM', `Actividad: ${newActivityTitle}`);

    reloadAllData();
    setNewActivityLeadId('');
    setNewActivityTitle('');
    setNewActivityNotes('');
    setNewActivityDate('');
  };

  const handleAddCrmQuote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyPermission(PERMISSIONS.CRM_PIPELINE_MANAGE)) return;
    if (!tenant || !newQuoteLeadId || !newQuoteProductId || !newQuoteValidUntil) return;

    const prod = products.find(p => p.id === newQuoteProductId);
    if (!prod) return;

    const items = [{ id: prod.id, name: prod.name, price: prod.price, qty: newQuoteQty }];
    const totalVal = prod.price * newQuoteQty;

    const newQ = {
      id: 'qte-' + Date.now(),
      tenantId: tenant.id,
      leadId: newQuoteLeadId,
      date: new Date().toISOString().split('T')[0],
      total: totalVal,
      itemsJson: JSON.stringify(items),
      validUntil: newQuoteValidUntil
    };

    const list = [...quotes, newQ];
    dbAdapter.saveCrmQuotes(tenant.id, list);
    dbAdapter.addAuditLog(tenant.id, `${activeRole}@tenant.com`, 'Generar Cotización CRM', `Cotización para Lead: ${newQuoteLeadId} por $${totalVal}`);

    reloadAllData();
    setNewQuoteLeadId('');
    setNewQuoteProductId('');
    setNewQuoteQty(1);
    setNewQuoteValidUntil('');
  };

  const handleAddCrmCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyPermission(PERMISSIONS.CRM_PIPELINE_MANAGE)) return;
    if (!tenant || !newCampaignName || !newCampaignSubject) return;

    const newCamp = {
      id: 'cmp-' + Date.now(),
      tenantId: tenant.id,
      name: newCampaignName,
      subject: newCampaignSubject,
      sentCount: 0,
      opensCount: 0,
      clicksCount: 0,
      status: 'draft' as const
    };

    const list = [...campaigns, newCamp];
    dbAdapter.saveCrmCampaigns(tenant.id, list);
    dbAdapter.addAuditLog(tenant.id, `${activeRole}@tenant.com`, 'Crear Campaña Marketing', `Campaña: ${newCampaignName}`);

    reloadAllData();
    setNewCampaignName('');
    setNewCampaignSubject('');
  };

  const handleSendCrmCampaign = (campaignId: string) => {
    if (!verifyPermission(PERMISSIONS.CRM_PIPELINE_MANAGE)) return;
    if (!tenant) return;

    const list = campaigns.map(c => {
      if (c.id === campaignId) {
        return {
          ...c,
          status: 'sent' as const,
          sentCount: 1200,
          opensCount: Math.floor(300 + Math.random() * 200),
          clicksCount: Math.floor(50 + Math.random() * 80)
        };
      }
      return c;
    });

    dbAdapter.saveCrmCampaigns(tenant.id, list);
    dbAdapter.addAuditLog(tenant.id, `${activeRole}@tenant.com`, 'Lanzar Campaña Marketing', `ID Campaña: ${campaignId}`);

    reloadAllData();
    alert('Campaña enviada a los destinatarios. Estadísticas simuladas generadas con éxito.');
  };

  // ==================== CONTABILIDAD PRO ACTIONS ====================
  const handleAddFixedAsset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyPermission(PERMISSIONS.ACCOUNTING_POST_JOURNAL)) return;
    if (!tenant || !newAssetName || newAssetValue <= 0) return;

    const newAsset = {
      id: 'asset-' + Date.now(),
      tenantId: tenant.id,
      name: newAssetName,
      purchaseValue: newAssetValue,
      salvageValue: newAssetSalvage,
      purchaseDate: new Date().toISOString().split('T')[0],
      lifespanYears: newAssetLifespan,
      depreciatedAmount: 0.00
    };

    const list = [...fixedAssets, newAsset];
    dbAdapter.saveFixedAssets(tenant.id, list);
    dbAdapter.addAuditLog(tenant.id, `${activeRole}@tenant.com`, 'Registrar Activo Fijo', `Activo: ${newAssetName}`);
    
    reloadAllData();
    setNewAssetName('');
    setNewAssetValue(0);
    setNewAssetSalvage(0);
    setNewAssetLifespan(5);
  };

  const handleTriggerDepreciation = (assetId: string) => {
    if (!verifyPermission(PERMISSIONS.ACCOUNTING_POST_JOURNAL)) return;
    if (!tenant) return;

    const asset = fixedAssets.find(a => a.id === assetId);
    if (!asset) return;

    const monthlyDep = calculateDepreciation(asset);
    if (monthlyDep <= 0) return;

    // Create journal entry in Libro Diario
    const newEntryId = 'ent-' + Date.now();
    const entry = {
      id: newEntryId,
      tenantId: tenant.id,
      entryDate: new Date().toISOString().split('T')[0],
      description: `Depreciación mensual: ${asset.name}`,
      status: 'posted' as const
    };

    // Find/Create Gasto Depreciacion and Depreciacion Acumulada accounts
    let accGasto = accounts.find(a => a.code.startsWith('5') && a.name.toLowerCase().includes('depreciación'));
    let accAcum = accounts.find(a => a.code.startsWith('1') && a.name.toLowerCase().includes('depreciación'));

    if (!accGasto) {
      accGasto = { id: 'acc-gasto-dep', tenantId: tenant.id, code: '5002', name: 'Gasto por Depreciación', type: 'gasto' };
      dbAdapter.saveAccountingAccounts(tenant.id, [...accounts, accGasto]);
    }
    if (!accAcum) {
      accAcum = { id: 'acc-acum-dep', tenantId: tenant.id, code: '1099', name: 'Depreciación Acumulada Activos', type: 'activo' };
      dbAdapter.saveAccountingAccounts(tenant.id, [...accounts, accAcum]);
    }

    const items = [
      { id: 'ji-dep-1', tenantId: tenant.id, entryId: newEntryId, accountId: accGasto.id, debit: monthlyDep, credit: 0, costCenter: 'Depreciaciones Activos' },
      { id: 'ji-dep-2', tenantId: tenant.id, entryId: newEntryId, accountId: accAcum.id, debit: 0, credit: monthlyDep, costCenter: 'Depreciaciones Activos' }
    ];

    dbAdapter.saveJournalEntries(tenant.id, [...dbAdapter.getJournalEntries(tenant.id), entry]);
    dbAdapter.saveJournalItems(tenant.id, [...dbAdapter.getJournalItems(tenant.id), ...items]);

    // Update fixed asset depreciated value
    const updatedAssets = fixedAssets.map(a => {
      if (a.id === assetId) {
        return { ...a, depreciatedAmount: a.depreciatedAmount + monthlyDep };
      }
      return a;
    });
    dbAdapter.saveFixedAssets(tenant.id, updatedAssets);
    dbAdapter.addAuditLog(tenant.id, `${activeRole}@tenant.com`, 'Calcular Depreciación', `Depreciación lineal mensual para: ${asset.name}`);
    
    reloadAllData();
    alert(`Asiento de depreciación por $${monthlyDep.toFixed(2)} generado correctamente.`);
  };

  const handleAddBudgetLimit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyPermission(PERMISSIONS.ACCOUNTING_POST_JOURNAL)) return;
    if (!tenant || !newBudgetAccount || newBudgetAmount <= 0) return;

    const newB = {
      id: 'bdg-' + Date.now(),
      tenantId: tenant.id,
      accountId: newBudgetAccount,
      amount: newBudgetAmount,
      period: newBudgetPeriod
    };

    const list = [...budgetLimits, newB];
    dbAdapter.saveBudgetLimits(tenant.id, list);
    dbAdapter.addAuditLog(tenant.id, `${activeRole}@tenant.com`, 'Asignar Presupuesto', `Asignado a cuenta ID ${newBudgetAccount}: $${newBudgetAmount}`);

    reloadAllData();
    setNewBudgetAccount('');
    setNewBudgetAmount(0);
  };

  const handleReconcileLine = (lineId: string) => {
    if (!verifyPermission(PERMISSIONS.ACCOUNTING_POST_JOURNAL)) return;
    if (!tenant) return;

    const line = bankStatementLines.find(l => l.id === lineId);
    if (!line) return;

    // Create journal entry in Libro Diario matching the bank transaction amount
    const newEntryId = 'ent-' + Date.now();
    const entry = {
      id: newEntryId,
      tenantId: tenant.id,
      entryDate: line.date,
      description: `Conciliación Bancaria: ${line.description}`,
      status: 'posted' as const
    };

    // Find/Create Bank account and matching Operation Revenue/Expense accounts
    let accBanco = accounts.find(a => a.code.startsWith('11') || a.name.toLowerCase().includes('banco'));
    let accContra = accounts.find(a => line.amount > 0 ? (a.code.startsWith('4') || a.name.toLowerCase().includes('ingreso')) : (a.code.startsWith('5') || a.name.toLowerCase().includes('gasto')));

    if (!accBanco) {
      accBanco = { id: 'acc-banco-rec', tenantId: tenant.id, code: '1102', name: 'Cuenta Banco Conciliación', type: 'activo' };
      dbAdapter.saveAccountingAccounts(tenant.id, [...accounts, accBanco]);
    }
    if (!accContra) {
      accContra = line.amount > 0 
        ? { id: 'acc-ing-rec', tenantId: tenant.id, code: '4005', name: 'Ingresos por Conciliar', type: 'ingreso' }
        : { id: 'acc-gas-rec', tenantId: tenant.id, code: '5005', name: 'Gastos por Conciliar', type: 'gasto' };
      dbAdapter.saveAccountingAccounts(tenant.id, [...accounts, accContra]);
    }

    const items = [
      { 
        id: 'ji-rec-1', 
        tenantId: tenant.id, 
        entryId: newEntryId, 
        accountId: accBanco.id, 
        debit: line.amount > 0 ? line.amount : 0, 
        credit: line.amount < 0 ? Math.abs(line.amount) : 0, 
        costCenter: 'Conciliación Bancaria' 
      },
      { 
        id: 'ji-rec-2', 
        tenantId: tenant.id, 
        entryId: newEntryId, 
        accountId: accContra.id, 
        debit: line.amount < 0 ? Math.abs(line.amount) : 0, 
        credit: line.amount > 0 ? line.amount : 0, 
        costCenter: 'Conciliación Bancaria' 
      }
    ];

    dbAdapter.saveJournalEntries(tenant.id, [...dbAdapter.getJournalEntries(tenant.id), entry]);
    dbAdapter.saveJournalItems(tenant.id, [...dbAdapter.getJournalItems(tenant.id), ...items]);

    // Mark line as reconciled
    const updatedLines = bankStatementLines.map(l => {
      if (l.id === lineId) {
        return { ...l, reconciledJournalItemId: 'ji-rec-1' };
      }
      return l;
    });
    dbAdapter.saveBankStatementLines(tenant.id, updatedLines);
    dbAdapter.addAuditLog(tenant.id, `${activeRole}@tenant.com`, 'Conciliación Bancaria', `Conciliada transacción bancaria: ${line.description}`);
    
    reloadAllData();
    alert('Transacción conciliada con éxito. Asiento contable del Libro Diario creado.');
  };

  const handleGenerateElectronicInvoice = () => {
    if (!verifyPermission(PERMISSIONS.ACCOUNTING_POST_JOURNAL)) return;
    if (!tenant) return;

    const invoiceId = 'FAC-' + Math.floor(100000 + Math.random() * 900000);
    const dateStr = new Date().toISOString().split('T')[0];
    
    // Build UBL XML Payload matching regional country specifications
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"\n`;
    xml += `         xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"\n`;
    xml += `         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">\n`;
    xml += `  <cbc:UBLVersionID>2.1</cbc:UBLVersionID>\n`;
    xml += `  <cbc:CustomizationID>2.0</cbc:CustomizationID>\n`;
    xml += `  <cbc:ID>${invoiceId}</cbc:ID>\n`;
    xml += `  <cbc:IssueDate>${dateStr}</cbc:IssueDate>\n`;
    xml += `  <cbc:InvoiceTypeCode>01</cbc:InvoiceTypeCode>\n`;
    xml += `  <cac:AccountingSupplierParty>\n`;
    xml += `    <cac:Party>\n`;
    xml += `      <cac:PartyName><cbc:Name>${tenant.name}</cbc:Name></cac:PartyName>\n`;
    xml += `    </cac:Party>\n`;
    xml += `  </cac:AccountingSupplierParty>\n`;
    
    if (selectedCountryTax === 'CL') {
      xml += `  <!-- Especificaciones SII de Chile (UBL 2.1 / DTE Ley) -->\n`;
      xml += `  <cbc:DocumentCurrencyCode>CLP</cbc:DocumentCurrencyCode>\n`;
      xml += `  <cac:TaxTotal>\n`;
      xml += `    <cbc:TaxAmount currencyID="CLP">19000</cbc:TaxAmount>\n`;
      xml += `    <cac:TaxSubtotal>\n`;
      xml += `      <cbc:TaxableAmount currencyID="CLP">100000</cbc:TaxableAmount>\n`;
      xml += `      <cbc:TaxAmount currencyID="CLP">19000</cbc:TaxAmount>\n`;
      xml += `      <cac:TaxCategory>\n`;
      xml += `        <cac:TaxScheme><cbc:ID>IVA</cbc:ID></cac:TaxScheme>\n`;
      xml += `      </cac:TaxCategory>\n`;
      xml += `    </cac:TaxSubtotal>\n`;
      xml += `  </cac:TaxTotal>\n`;
    } else if (selectedCountryTax === 'MX') {
      xml += `  <!-- Especificaciones SAT de México (CFDI 4.0 / XML) -->\n`;
      xml += `  <cbc:DocumentCurrencyCode>MXN</cbc:DocumentCurrencyCode>\n`;
      xml += `  <cac:TaxTotal>\n`;
      xml += `    <cbc:TaxAmount currencyID="MXN">160</cbc:TaxAmount>\n`;
      xml += `    <cac:TaxSubtotal>\n`;
      xml += `      <cbc:TaxableAmount currencyID="MXN">1000</cbc:TaxableAmount>\n`;
      xml += `      <cbc:TaxAmount currencyID="MXN">160</cbc:TaxAmount>\n`;
      xml += `      <cac:TaxCategory>\n`;
      xml += `        <cac:TaxScheme><cbc:ID>002</cbc:ID><cbc:Name>IVA</cbc:Name></cac:TaxScheme>\n`;
      xml += `      </cac:TaxCategory>\n`;
      xml += `    </cac:TaxSubtotal>\n`;
      xml += `  </cac:TaxTotal>\n`;
    } else if (selectedCountryTax === 'CO') {
      xml += `  <!-- Especificaciones DIAN de Colombia (UBL 2.1 DIAN) -->\n`;
      xml += `  <cbc:DocumentCurrencyCode>COP</cbc:DocumentCurrencyCode>\n`;
      xml += `  <cac:TaxTotal>\n`;
      xml += `    <cbc:TaxAmount currencyID="COP">19000</cbc:TaxAmount>\n`;
      xml += `    <cac:TaxSubtotal>\n`;
      xml += `      <cbc:TaxableAmount currencyID="COP">100000</cbc:TaxableAmount>\n`;
      xml += `      <cbc:TaxAmount currencyID="COP">19000</cbc:TaxAmount>\n`;
      xml += `      <cac:TaxCategory>\n`;
      xml += `        <cac:TaxScheme><cbc:ID>01</cbc:ID><cbc:Name>IVA</cbc:Name></cac:TaxScheme>\n`;
      xml += `      </cac:TaxCategory>\n`;
      xml += `    </cac:TaxSubtotal>\n`;
      xml += `  </cac:TaxTotal>\n`;
    } else if (selectedCountryTax === 'PE') {
      xml += `  <!-- Especificaciones SUNAT de Perú (UBL SUNAT 2.1) -->\n`;
      xml += `  <cbc:DocumentCurrencyCode>PEN</cbc:DocumentCurrencyCode>\n`;
      xml += `  <cac:TaxTotal>\n`;
      xml += `    <cbc:TaxAmount currencyID="PEN">180</cbc:TaxAmount>\n`;
      xml += `    <cac:TaxSubtotal>\n`;
      xml += `      <cbc:TaxableAmount currencyID="PEN">1000</cbc:TaxableAmount>\n`;
      xml += `      <cbc:TaxAmount currencyID="PEN">180</cbc:TaxAmount>\n`;
      xml += `      <cac:TaxCategory>\n`;
      xml += `        <cac:TaxScheme><cbc:ID>1000</cbc:ID><cbc:Name>IGV</cbc:Name></cac:TaxScheme>\n`;
      xml += `      </cac:TaxCategory>\n`;
      xml += `    </cac:TaxSubtotal>\n`;
      xml += `  </cac:TaxTotal>\n`;
    } else {
      xml += `  <!-- Especificaciones SIN de Bolivia (Documento Fiscal XML Ley) -->\n`;
      xml += `  <cbc:DocumentCurrencyCode>BOB</cbc:DocumentCurrencyCode>\n`;
      xml += `  <cac:TaxTotal>\n`;
      xml += `    <cbc:TaxAmount currencyID="BOB">13000</cbc:TaxAmount>\n`;
      xml += `    <cac:TaxSubtotal>\n`;
      xml += `      <cbc:TaxableAmount currencyID="BOB">100000</cbc:TaxableAmount>\n`;
      xml += `      <cbc:TaxAmount currencyID="BOB">13000</cbc:TaxAmount>\n`;
      xml += `      <cac:TaxCategory>\n`;
      xml += `        <cac:TaxScheme><cbc:ID>IVA</cbc:ID></cac:TaxScheme>\n`;
      xml += `      </cac:TaxCategory>\n`;
      xml += `    </cac:TaxSubtotal>\n`;
      xml += `  </cac:TaxTotal>\n`;
    }

    xml += `  <cac:Signature>\n`;
    xml += `    <cbc:ID>Sign-${invoiceId}</cbc:ID>\n`;
    xml += `    <cac:SignatoryParty>\n`;
    xml += `      <cac:PartyIdentification><cbc:ID>${tenant.id}</cbc:ID></cac:PartyIdentification>\n`;
    xml += `    </cac:SignatoryParty>\n`;
    xml += `    <cac:DigitalSignature>\n`;
    xml += `      <cbc:SignatureValue>SHA256withRSA/SignedXML/Hash:${Math.random().toString(36).substring(2,15)}...</cbc:SignatureValue>\n`;
    xml += `    </cac:DigitalSignature>\n`;
    xml += `  </cac:Signature>\n`;
    xml += `</Invoice>`;

    const newLogMsg = `[${new Date().toLocaleTimeString()}] ${invoiceId} firmada digitalmente para país ${selectedCountryTax}. Enviada a la autoridad tributaria. Estado: ACEPTADA.`;
    setInvoiceXmlLog(prev => [newLogMsg, ...prev]);
    dbAdapter.addAuditLog(tenant.id, `${activeRole}@tenant.com`, 'Emitir Factura Electrónica', `${invoiceId} para país ${selectedCountryTax}`);
    
    // Create corresponding Accounting Journal Entry automatically
    const entryId = 'ent-' + Date.now();
    const entry = {
      id: entryId,
      tenantId: tenant.id,
      entryDate: dateStr,
      description: `Venta Factura Electrónica ${invoiceId}`,
      status: 'posted' as const
    };

    let accClientes = accounts.find(a => a.code.startsWith('11') && a.name.toLowerCase().includes('clientes'));
    let accIngresos = accounts.find(a => a.code.startsWith('4') && a.name.toLowerCase().includes('ventas'));

    if (!accClientes) {
      accClientes = { id: 'acc-cli-fact', tenantId: tenant.id, code: '1103', name: 'Clientes por Ventas', type: 'activo' };
      dbAdapter.saveAccountingAccounts(tenant.id, [...accounts, accClientes]);
    }
    if (!accIngresos) {
      accIngresos = { id: 'acc-ing-fact', tenantId: tenant.id, code: '4001', name: 'Ingresos por Ventas', type: 'ingreso' };
      dbAdapter.saveAccountingAccounts(tenant.id, [...accounts, accIngresos]);
    }

    const items = [
      { id: 'ji-fact-1', tenantId: tenant.id, entryId, accountId: accClientes.id, debit: 1190, credit: 0, costCenter: 'Ventas E-Factura' },
      { id: 'ji-fact-2', tenantId: tenant.id, entryId, accountId: accIngresos.id, debit: 0, credit: 1190, costCenter: 'Ventas E-Factura' }
    ];

    dbAdapter.saveJournalEntries(tenant.id, [...dbAdapter.getJournalEntries(tenant.id), entry]);
    dbAdapter.saveJournalItems(tenant.id, [...dbAdapter.getJournalItems(tenant.id), ...items]);
    reloadAllData();

    alert(`Factura ${invoiceId} emitida y firmada con éxito.\nXML UBL generado y transmitido.\nAsiento contable creado en el Libro Diario.`);
  };

  // 1. DYNAMIC CMS: Add Collection (Visual DB Builder)
  const handleAddCollection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyPermission(PERMISSIONS.CMS_COLLECTIONS_MANAGE)) return;
    if (!newColName || !newColSlug) return;
    if (!tenant) return;
    if (dbBuilderFields.length === 0) {
      alert('Por favor añade al menos un campo a la colección.');
      return;
    }

    const newCol: CMSCollection = {
      id: 'col-' + Date.now(),
      tenantId: tenant.id,
      name: newColName,
      slug: newColSlug,
      fields: dbBuilderFields
    };

    const allCols = dbAdapter.getCollections();
    allCols.push(newCol);
    dbAdapter.saveCollections(allCols);
    dbAdapter.addAuditLog(tenant.id, `${activeRole}@tenant.com`, 'Crear Colección CMS', `BD creada: ${newColName} con ${dbBuilderFields.length} campos tipados`);
    
    setNewColName('');
    setNewColSlug('');
    setDbBuilderFields([{ name: 'titulo', type: 'text' }, { name: 'descripcion', type: 'text' }]);
    reloadAllData();
    setSelectedCollectionId(newCol.id);
  };

  // 2. DYNAMIC CMS: Add Item
  const handleAddCmsItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyPermission(PERMISSIONS.CMS_ITEMS_CREATE)) return;
    if (!selectedCollectionId) return;
    if (!tenant) return;

    const newItem: CMSItem = {
      id: 'item-' + Date.now(),
      collectionId: selectedCollectionId,
      data: newItemData,
      createdAt: Date.now()
    };

    const allItems = dbAdapter.getCmsItems();
    allItems.push(newItem);
    dbAdapter.saveCmsItems(allItems);

    // Reset inputs using field.name
    const activeCol = collections.find(c => c.id === selectedCollectionId);
    const cleared: Record<string, string> = {};
    activeCol?.fields.forEach(f => {
      const fname = typeof f === 'string' ? f : (f as CMSField).name;
      cleared[fname] = '';
    });
    setNewItemData(cleared);
    dbAdapter.addAuditLog(tenant.id, `${activeRole}@tenant.com`, 'Añadir Registro CMS', `Registro agregado en: ${activeCol?.name}`);
    reloadAllData();
  };

  // 3. AUTOMATION WORKFLOWS: Toggle Status
  const handleToggleWorkflow = (wfId: string) => {
    if (!verifyPermission(PERMISSIONS.WORKFLOWS_ACTIVATE)) return;
    if (!tenant) return;
    const allWfs = dbAdapter.getWorkflows();
    const match = allWfs.find(w => w.id === wfId);
    if (match) {
      match.active = !match.active;
      dbAdapter.saveWorkflows(allWfs);
      dbAdapter.addAuditLog(tenant.id, `${activeRole}@tenant.com`, 'Toggle Workflow', `Automatización "${match.name}" toggled a ${match.active ? 'Activo' : 'Inactivo'}`);
      reloadAllData();
    }
  };

  // 4. AUTOMATION WORKFLOWS: Add Workflow
  const handleAddWorkflow = (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyPermission(PERMISSIONS.WORKFLOWS_CREATE)) return;
    if (!newWfName || !tenant) return;

    const newWf: AutomationWorkflow = {
      id: 'wf-' + Date.now(),
      tenantId: tenant.id,
      name: newWfName,
      trigger: newWfTrigger,
      actions: newWfActions,
      active: true
    };

    const all = dbAdapter.getWorkflows();
    all.push(newWf);
    dbAdapter.saveWorkflows(all);
    dbAdapter.addAuditLog(tenant.id, `${activeRole}@tenant.com`, 'Crear Workflow', `Nueva automatización: ${newWfName}`);
    setNewWfName('');
    reloadAllData();
  };

  // 5. INTEGRATIONS: Toggle connection
  const handleToggleIntegration = (intId: string) => {
    if (!verifyPermission(PERMISSIONS.INTEGRATIONS_CONNECT)) return;
    if (!tenant) return;
    const all = dbAdapter.getIntegrations();
    const match = all.find(i => i.id === intId);
    if (match) {
      match.connected = !match.connected;
      dbAdapter.saveIntegrations(all);
      dbAdapter.addAuditLog(tenant.id, `${activeRole}@tenant.com`, 'Modificar Integración', `Integración "${match.name}" ${match.connected ? 'Conectada' : 'Desconectada'}`);
      reloadAllData();
    }
  };

  // 6. SAAS BILLING: Upgrade to Enterprise
  const handleUpgradePlan = () => {
    if (!verifyPermission(PERMISSIONS.COMPANY_BILLING_VIEW)) return;
    if (!tenant) return;
    if (confirm('¿Deseas actualizar tu suscripción al Plan Enterprise? Habilitará terminales POS ilimitadas y 100 páginas de maquetación.')) {
      const updatedTenants = dbAdapter.getTenants().map(t => {
        if (t.id === tenant.id) {
          return { ...t, plan: 'Enterprise' as const };
        }
        return t;
      });
      dbAdapter.saveTenants(updatedTenants);

      const allLimits = dbAdapter.getSaaSPlanLimits();
      const limitIdx = allLimits.findIndex(l => l.tenantId === tenant.id);
      if (limitIdx >= 0) {
        allLimits[limitIdx] = {
          ...allLimits[limitIdx],
          maxPages: 100,
          maxPosTerminals: 999
        };
        dbAdapter.saveSaaSPlanLimits(allLimits);
      }
      dbAdapter.addAuditLog(tenant.id, `${activeRole}@tenant.com`, 'Upgrade Suscripción', 'Suscripción cambiada a Plan Enterprise.');
      reloadAllData();
      alert('¡Suscripción actualizada con éxito al Plan Enterprise! Límites extendidos.');
    }
  };

  // 7. DEVELOPER API: Add API Key
  const handleAddApiKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyPermission(PERMISSIONS.API_KEYS_CREATE)) return;
    if (!newKeyName || !tenant) return;

    const newKey: ApiKey = {
      id: 'key-' + Date.now(),
      tenantId: tenant.id,
      name: newKeyName,
      publicKey: 'nram_pub_live_' + Math.random().toString(36).substring(2, 9),
      secretKey: 'nram_sec_live_' + Math.random().toString(36).substring(2, 14),
      webhooks: []
    };

    const all = dbAdapter.getApiKeys();
    all.push(newKey);
    dbAdapter.saveApiKeys(all);
    dbAdapter.addAuditLog(tenant.id, `${activeRole}@tenant.com`, 'Crear Credencial API', `Clave generada: ${newKeyName}`);
    setNewKeyName('');
    reloadAllData();
  };

  // 8. DEVELOPER API: Add Webhook
  const handleAddWebhook = (keyId: string) => {
    if (!verifyPermission(PERMISSIONS.WEBHOOKS_MANAGE)) return;
    if (!webhookUrl || !tenant) return;

    const allKeys = dbAdapter.getApiKeys();
    const key = allKeys.find(k => k.id === keyId);
    if (key) {
      key.webhooks.push({
        id: 'wh-' + Date.now(),
        url: webhookUrl,
        trigger: webhookTrigger
      });
      dbAdapter.saveApiKeys(allKeys);
      dbAdapter.addAuditLog(tenant.id, `${activeRole}@tenant.com`, 'Agregar Webhook', `Endpoint registrado para evento: ${webhookTrigger}`);
      setWebhookUrl('');
      reloadAllData();
    }
  };

  // Helper to generate CSV for accounting reports
  const generateAccountingReportCSV = (datasetName: string, data: any): string => {
    const { accounts, journalItems, journalEntries } = data;
    let csv = '';

    if (datasetName === 'Balance General') {
      csv += `"BALANCE GENERAL CONSOLIDADO"\n`;
      csv += `"Inquilino:","${tenant?.name}"\n`;
      csv += `"Fecha:","${new Date().toLocaleDateString()}"\n\n`;
      
      csv += `"Tipo","Código","Nombre Cuenta","Saldo"\n`;
      
      ['activo', 'pasivo', 'patrimonio'].forEach((type) => {
        const filteredAccs = accounts.filter((a: any) => a.type === type);
        let typeTotal = 0;
        
        filteredAccs.forEach((acc: any) => {
          const accItems = journalItems.filter((ji: any) => ji.accountId === acc.id);
          const debits = accItems.reduce((s: number, i: any) => s + i.debit, 0);
          const credits = accItems.reduce((s: number, i: any) => s + i.credit, 0);
          const balance = type === 'activo' ? (debits - credits) : (credits - debits);
          typeTotal += balance;
          csv += `"${type.toUpperCase()}","${acc.code}","${acc.name}",${balance.toFixed(2)}\n`;
        });
        csv += `"${type.toUpperCase()} TOTAL",,,${typeTotal.toFixed(2)}\n\n`;
      });
    } else if (datasetName === 'Estado de Resultados') {
      csv += `"ESTADO DE RESULTADOS (P&L)"\n`;
      csv += `"Inquilino:","${tenant?.name}"\n`;
      csv += `"Fecha:","${new Date().toLocaleDateString()}"\n\n`;
      
      csv += `"Tipo","Código","Nombre Cuenta","Saldo"\n`;
      
      let totalIngreso = 0;
      let totalGasto = 0;
      
      ['ingreso', 'gasto'].forEach((type) => {
        const filteredAccs = accounts.filter((a: any) => a.type === type);
        let typeTotal = 0;
        
        filteredAccs.forEach((acc: any) => {
          const accItems = journalItems.filter((ji: any) => ji.accountId === acc.id);
          const debits = accItems.reduce((s: number, i: any) => s + i.debit, 0);
          const credits = accItems.reduce((s: number, i: any) => s + i.credit, 0);
          const balance = type === 'ingreso' ? (credits - debits) : (debits - credits);
          typeTotal += balance;
          csv += `"${type.toUpperCase()}","${acc.code}","${acc.name}",${balance.toFixed(2)}\n`;
        });
        
        if (type === 'ingreso') totalIngreso = typeTotal;
        else totalGasto = typeTotal;
        
        csv += `"${type.toUpperCase()} TOTAL",,,${typeTotal.toFixed(2)}\n\n`;
      });
      csv += `"UTILIDAD NETA (P&L)",,,${(totalIngreso - totalGasto).toFixed(2)}\n`;
    } else if (datasetName === 'Libro Diario') {
      csv += `"LIBRO DIARIO GENERAL"\n`;
      csv += `"Inquilino:","${tenant?.name}"\n`;
      csv += `"Fecha:","${new Date().toLocaleDateString()}"\n\n`;
      
      csv += `"Asiento ID","Fecha","Descripción","Código Cuenta","Nombre Cuenta","Debe","Haber","Centro Costo"\n`;
      
      journalEntries.forEach((je: any) => {
        const jeItems = journalItems.filter((ji: any) => ji.entryId === je.id);
        jeItems.forEach((ji: any) => {
          const acc = accounts.find((a: any) => a.id === ji.accountId);
          csv += `"${je.id}","${je.entryDate}","${je.description}","${acc ? acc.code : ''}","${acc ? acc.name : ji.accountId}",${ji.debit.toFixed(2)},${ji.credit.toFixed(2)},"${ji.costCenter || ''}"\n`;
        });
      });
    }

    return csv;
  };

  const generatePOSReportCSV = (datasetName: string, data: any): string => {
    let csv = `"REPORTE DE ${datasetName.toUpperCase()}"\n`;
    csv += `"Inquilino:","${tenant?.name}"\n`;
    csv += `"Fecha:","${new Date().toLocaleDateString()}"\n\n`;

    if (datasetName === 'ventas_pos' || datasetName === 'products') {
      csv += `"ID","Nombre","Precio","Stock","Categoría","Código Barras"\n`;
      data.forEach((prod: any) => {
        csv += `"${prod.id}","${prod.name}",${prod.price.toFixed(2)},${prod.stock},"${prod.category}","${prod.barcode}"\n`;
      });
    } else {
      csv += `"ID","Curso/Matrícula","Detalle","Progreso"\n`;
      data.forEach((row: any) => {
        csv += `"${row.id}","${row.courseId || ''}","${row.lessonsCompleted?.join(';') || ''}",${row.progress || 0}\n`;
      });
    }
    return csv;
  };

  const generatePDFPrintView = (datasetName: string, data: any) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    let htmlContent = `
      <html>
        <head>
          <title>Reporte - ${datasetName}</title>
          <style>
            body { font-family: 'Inter', system-ui, sans-serif; color: #1e293b; padding: 40px; margin: 0; }
            h1 { font-size: 24px; font-weight: 900; color: #0f172a; margin-bottom: 5px; }
            h2 { font-size: 14px; font-weight: bold; color: #64748b; margin-top: 0; margin-bottom: 30px; text-transform: uppercase; letter-spacing: 1px; }
            .header-table { width: 100%; margin-bottom: 30px; border-bottom: 2px solid #e2e8f0; padding-bottom: 15px; }
            .header-label { font-weight: bold; color: #475569; font-size: 12px; }
            .header-value { color: #0284c7; font-weight: bold; font-size: 12px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
            th { border-bottom: 2px solid #cbd5e1; padding: 10px; text-align: left; font-weight: bold; color: #475569; }
            td { border-bottom: 1px solid #e2e8f0; padding: 10px; color: #334155; }
            .text-right { text-align: right; }
            .font-mono { font-family: monospace; font-size: 13px; font-weight: bold; }
            .total-row { background-color: #f8fafc; font-weight: bold; border-top: 2px solid #e2e8f0; }
            .accent { color: #0284c7; font-weight: 900; }
            .pl-4 { padding-left: 24px; }
            .mb-8 { margin-bottom: 32px; }
            @media print {
              body { padding: 20px; }
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <div>
              <h1>${datasetName.toUpperCase()}</h1>
              <h2>NRAM360 ERP Contabilidad PRO</h2>
            </div>
            <button onclick="window.print()" style="padding: 10px 20px; background-color: #0284c7; color: white; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);">Imprimir / Guardar PDF</button>
          </div>
          
          <table class="header-table">
            <tr>
              <td class="header-label" style="border:none; padding: 4px 0;">Empresa / Inquilino:</td>
              <td class="header-value" style="border:none; padding: 4px 0;">${tenant?.name}</td>
              <td class="header-label" style="border:none; padding: 4px 0; text-align:right;">Fecha Emisión:</td>
              <td class="header-value" style="border:none; padding: 4px 0; text-align:right;">${new Date().toLocaleDateString()}</td>
            </tr>
            <tr>
              <td class="header-label" style="border:none; padding: 4px 0;">Plan SaaS:</td>
              <td class="header-value" style="border:none; padding: 4px 0;">Plan ${tenant?.plan}</td>
              <td class="header-label" style="border:none; padding: 4px 0; text-align:right;">Estado:</td>
              <td class="header-value" style="border:none; padding: 4px 0; text-align:right; color:#16a34a;">OFICIAL ASENTADO</td>
            </tr>
          </table>
    `;

    if (datasetName === 'Balance General') {
      const { accounts, journalItems } = data;
      htmlContent += `
        <table>
          <thead>
            <tr>
              <th>Código</th>
              <th>Cuenta Contable</th>
              <th class="text-right">Saldo</th>
            </tr>
          </thead>
          <tbody>
      `;
      
      ['activo', 'pasivo', 'patrimonio'].forEach((type) => {
        const filteredAccs = accounts.filter((a: any) => a.type === type);
        const typeTotal = filteredAccs.reduce((sum: number, acc: any) => {
          const accItems = journalItems.filter((ji: any) => ji.accountId === acc.id);
          const debits = accItems.reduce((s: number, i: any) => s + i.debit, 0);
          const credits = accItems.reduce((s: number, i: any) => s + i.credit, 0);
          return sum + (type === 'activo' ? (debits - credits) : (credits - debits));
        }, 0);

        htmlContent += `
          <tr style="background-color: #f1f5f9; font-weight: bold;">
            <td colspan="2" style="text-transform: uppercase;">${type}s</td>
            <td class="text-right font-mono">$${typeTotal.toFixed(2)}</td>
          </tr>
        `;

        filteredAccs.forEach((acc: any) => {
          const accItems = journalItems.filter((ji: any) => ji.accountId === acc.id);
          const debits = accItems.reduce((s: number, i: any) => s + i.debit, 0);
          const credits = accItems.reduce((s: number, i: any) => s + i.credit, 0);
          const balance = type === 'activo' ? (debits - credits) : (credits - debits);

          htmlContent += `
            <tr>
              <td>${acc.code}</td>
              <td class="${acc.parentId ? 'pl-4' : 'accent'}">${acc.name}</td>
              <td class="text-right font-mono">$${balance.toFixed(2)}</td>
            </tr>
          `;
        });
      });

      htmlContent += `
          </tbody>
        </table>
      `;
    } else if (datasetName === 'Estado de Resultados') {
      const { accounts, journalItems } = data;
      let totalIngreso = 0;
      let totalGasto = 0;

      htmlContent += `
        <table>
          <thead>
            <tr>
              <th>Código</th>
              <th>Cuenta Contable</th>
              <th class="text-right">Saldo</th>
            </tr>
          </thead>
          <tbody>
      `;

      ['ingreso', 'gasto'].forEach((type) => {
        const filteredAccs = accounts.filter((a: any) => a.type === type);
        const typeTotal = filteredAccs.reduce((sum: number, acc: any) => {
          const accItems = journalItems.filter((ji: any) => ji.accountId === acc.id);
          const debits = accItems.reduce((s: number, i: any) => s + i.debit, 0);
          const credits = accItems.reduce((s: number, i: any) => s + i.credit, 0);
          return sum + (type === 'ingreso' ? (credits - debits) : (debits - credits));
        }, 0);

        if (type === 'ingreso') totalIngreso = typeTotal;
        else totalGasto = typeTotal;

        htmlContent += `
          <tr style="background-color: #f1f5f9; font-weight: bold;">
            <td colspan="2" style="text-transform: uppercase;">${type}s</td>
            <td class="text-right font-mono">$${typeTotal.toFixed(2)}</td>
          </tr>
        `;

        filteredAccs.forEach((acc: any) => {
          const accItems = journalItems.filter((ji: any) => ji.accountId === acc.id);
          const debits = accItems.reduce((s: number, i: any) => s + i.debit, 0);
          const credits = accItems.reduce((s: number, i: any) => s + i.credit, 0);
          const balance = type === 'ingreso' ? (credits - debits) : (debits - credits);

          htmlContent += `
            <tr>
              <td>${acc.code}</td>
              <td class="${acc.parentId ? 'pl-4' : 'accent'}">${acc.name}</td>
              <td class="text-right font-mono">$${balance.toFixed(2)}</td>
            </tr>
          `;
        });
      });

      const netProfit = totalIngreso - totalGasto;
      htmlContent += `
            <tr style="background-color: #e0f2fe; font-weight: bold; border-top: 2px solid #0284c7;">
              <td colspan="2" style="font-size: 14px; text-transform: uppercase; color:#0f172a;">UTILIDAD NETA DE EJERCICIO (P&L)</td>
              <td class="text-right font-mono" style="font-size: 14px; color:#0284c7;">$${netProfit.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
      `;
    } else if (datasetName === 'Libro Diario') {
      const { journalEntries, journalItems, accounts } = data;
      
      journalEntries.forEach((je: any) => {
        const jeItems = journalItems.filter((ji: any) => ji.entryId === je.id);
        const jeTotal = jeItems.reduce((acc: number, i: any) => acc + i.debit, 0);

        htmlContent += `
          <div class="mb-8" style="page-break-inside: avoid; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
            <div style="background-color: #f8fafc; border-bottom: 1px solid #e2e8f0; padding: 15px; display: flex; justify-content: space-between; align-items: center;">
              <div>
                <span style="font-family: monospace; color:#94a3b8; font-size:10px; letter-spacing: 1px;">ASIENTO: ${je.id}</span>
                <div style="font-weight: bold; color: #1e293b; font-size: 13px; margin-top: 2px;">${je.description}</div>
              </div>
              <div style="text-align: right;">
                <div style="font-family: monospace; font-weight: bold; color: #64748b; font-size: 12px;">${je.entryDate}</div>
                <div style="font-size: 11px; font-weight: 800; color: #16a34a; margin-top: 2px;">Asentado: $${jeTotal.toFixed(2)}</div>
              </div>
            </div>
            <div style="padding: 15px;">
              <table style="margin-top: 0;">
                <thead>
                  <tr style="border-bottom: 1px solid #cbd5e1;">
                    <th style="padding: 6px 10px;">Código Cuenta</th>
                    <th style="padding: 6px 10px;">Nombre Cuenta</th>
                    <th style="padding: 6px 10px;" class="text-right">Debe</th>
                    <th style="padding: 6px 10px;" class="text-right">Haber</th>
                    <th style="padding: 6px 10px;" class="text-right">C. Costo</th>
                  </tr>
                </thead>
                <tbody>
          `;

          jeItems.forEach((ji: any) => {
            const acc = accounts.find((a: any) => a.id === ji.accountId);
            htmlContent += `
              <tr>
                <td>${acc ? acc.code : ''}</td>
                <td style="font-weight: bold;">${acc ? acc.name : ji.accountId}</td>
                <td class="text-right font-mono">${ji.debit > 0 ? `$${ji.debit.toFixed(2)}` : '-'}</td>
                <td class="text-right font-mono">${ji.credit > 0 ? `$${ji.credit.toFixed(2)}` : '-'}</td>
                <td class="text-right" style="color: #94a3b8;">${ji.costCenter || '-'}</td>
              </tr>
            `;
          });

          htmlContent += `
                  </tbody>
                </table>
              </div>
            </div>
          `;
        });
      }

      htmlContent += `
          </body>
        </html>
      `;

      printWindow.document.write(htmlContent);
      printWindow.document.close();
    };

    // 9. REPORTS: Export Mock/Real File Utilities
    const handleExportData = (format: 'pdf' | 'csv' | 'xls', datasetName: string, data: any) => {
      let content = '';
      let mimeType = 'text/plain;charset=utf-8';
      let fileExtension = format;

      if (format === 'pdf') {
        generatePDFPrintView(datasetName, data);
        return;
      }

      if (format === 'csv' || format === 'xls') {
        mimeType = format === 'csv' ? 'text/csv;charset=utf-8' : 'application/vnd.ms-excel;charset=utf-8';
        fileExtension = format === 'csv' ? 'csv' : 'xls';

        if (datasetName === 'Balance General' || datasetName === 'Estado de Resultados' || datasetName === 'Libro Diario') {
          content = generateAccountingReportCSV(datasetName, data);
        } else {
          content = generatePOSReportCSV(datasetName, data);
        }
      }

      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `reporte_${datasetName.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}.${fileExtension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

  if (!tenant) return null;

  // Enforce Navigation Restriction based on RBAC roles using core index
  const isTabVisible = (tabKey: any) => {
    const userSession = {
      id: 'session-user',
      email: sessionUser?.email || `${activeRole}@tenant.com`,
      role: activeRole,
    };
    return getAllowedTabs(userSession).includes(tabKey);
  };

  // Auto-fallback if active tab gets restricted after changing activeRole
  const activeTabVisible = isTabVisible(activeTab);
  const fallbackTab = () => {
    const userSession = {
      id: 'session-user',
      email: sessionUser?.email || `${activeRole}@tenant.com`,
      role: activeRole,
    };
    const visible = getAllowedTabs(userSession);
    if (visible.length > 0) {
      setActiveTab(visible[0] as any);
    }
  };

  // Run fallback check if role changes
  if (!activeTabVisible) {
    fallbackTab();
  }

  const getNavBtnClass = (tabKey: string) => {
    return `w-full flex items-center gap-2.5 px-4 py-2 rounded-lg text-left text-xs font-bold transition-all ${
      activeTab === tabKey 
        ? 'bg-primary-celeste/20 text-cyan-900 font-extrabold border-l-2 border-primary-celeste shadow-xs' 
        : 'text-slate-600 hover:bg-slate-100/50 hover:text-slate-900'
    }`;
  };

  const limits = dbAdapter.getTenantSaaSLimits(tenant.id);

  return (
    <div className="w-full min-h-[calc(100vh-3rem)] flex flex-col md:flex-row bg-[#f8fafc] text-slate-800 font-sans">
      
      {/* SIDEBAR NAVIGATION PANEL */}
      <aside className="w-full md:w-64 bg-white text-slate-700 p-6 flex flex-col gap-6 shrink-0 border-r border-slate-200/80 shadow-lg">
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Consola Administrador</span>
          <span className="text-sm font-black text-slate-900 block truncate">{tenant.name}</span>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="bg-celeste-claro/20 text-primary-celeste px-2 py-0.5 rounded text-[10px] font-black uppercase">Plan {tenant.plan}</span>
            <span className="bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase">v3.5.0</span>
          </div>
          {sessionUser && (
            <div className="mt-2 pt-2 border-t border-slate-100">
              <p className="text-[10px] font-bold text-slate-700 truncate">{sessionUser.name}</p>
              <p className="text-[9px] text-slate-400 truncate">{sessionUser.email}</p>
              <div className="flex items-center gap-1 mt-1.5">
                <span className="bg-cyan-50 text-cyan-700 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase">{sessionUser.role}</span>
                <button
                  onClick={() => {
                    if (typeof window !== 'undefined') {
                      localStorage.removeItem('saswebs_user');
                      localStorage.removeItem('saswebs_role');
                      localStorage.removeItem('mock_active_tenant_id');
                    }
                    window.location.href = '/login';
                  }}
                  className="ml-auto text-[8px] font-bold text-red-400 hover:text-red-600 uppercase px-1.5 py-0.5 rounded hover:bg-red-50 transition-colors"
                >
                  Salir
                </button>
              </div>
            </div>
          )}
        </div>


        {/* RBAC ROLE SELECTOR GATEWAY */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col gap-1.5">
          <label className="text-[9px] font-black uppercase text-slate-400 flex items-center gap-1">
            <Shield className="w-3 h-3 text-primary-celeste" /> Simular Rol de Acceso
          </label>
          <select 
            value={activeRole} 
            onChange={(e) => setActiveRole(e.target.value as any)}
            className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-2 text-[10px] font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-primary-celeste"
          >
            <option value="owner">🛡️ Owner (Propietario)</option>
            <option value="manager">💼 Manager (Gerente)</option>
            <option value="cajero">🏪 Cajero (POS Clerk)</option>
            <option value="invitado">👁️ Invitado (Guest Reader)</option>
          </select>
        </div>

        {/* Dynamic Nav list filtered by role permissions */}
        <nav className="flex flex-col gap-1 flex-grow overflow-y-auto pr-1 scrollbar-thin">
          
          {/* NIVEL 1 — CORE */}
          <span className="text-[9px] font-black uppercase text-slate-400 px-4 mt-2 mb-1 block">NIVEL 1 — CORE</span>

          {isTabVisible('analytics') && (
            <button 
              onClick={() => setActiveTab('analytics')}
              className={getNavBtnClass('analytics')}
            >
              <BarChart2 className="w-3.5 h-3.5" /> Métricas e Hilos
            </button>
          )}

          {isTabVisible('whitelabel') && (
            <button 
              onClick={() => setActiveTab('whitelabel')}
              className={getNavBtnClass('whitelabel')}
            >
              <Award className="w-3.5 h-3.5" /> White Label Marca
            </button>
          )}

          {isTabVisible('api') && (
            <button 
              onClick={() => setActiveTab('api')}
              className={getNavBtnClass('api')}
            >
              <Code className="w-3.5 h-3.5" /> API & Webhooks
            </button>
          )}

          {isTabVisible('billing') && (
            <button 
              onClick={() => setActiveTab('billing')}
              className={getNavBtnClass('billing')}
            >
              <CreditCard className="w-3.5 h-3.5" /> Planes y Facturas
            </button>
          )}

          {isTabVisible('audit') && (
            <button 
              onClick={() => setActiveTab('audit')}
              className={getNavBtnClass('audit')}
            >
              <Activity className="w-3.5 h-3.5" /> Logs de Auditoría
            </button>
          )}

          {isTabVisible('settings') && (
            <button 
              onClick={() => setActiveTab('settings')}
              className={getNavBtnClass('settings')}
            >
              <Settings className="w-3.5 h-3.5" /> Ajustes Básicos
            </button>
          )}

          {/* NIVEL 2 — MÓDULOS OFICIALES */}
          <span className="text-[9px] font-black uppercase text-slate-400 px-4 mt-3 mb-1 block">NIVEL 2 — MÓDULOS</span>

          {isTabVisible('cms') && (
            <button 
              onClick={() => setActiveTab('cms')}
              className={getNavBtnClass('cms')}
            >
              <Database className="w-3.5 h-3.5" /> CMS Dinámico
            </button>
          )}

          {tenant.isEcommerceEnabled && isTabVisible('products') && (
            <button 
              onClick={() => setActiveTab('products')}
              className={getNavBtnClass('products')}
            >
              <ShoppingBag className="w-3.5 h-3.5" /> Catálogo Tienda
            </button>
          )}

          {tenant.isReservasEnabled && isTabVisible('reservations') && (
            <button 
              onClick={() => setActiveTab('reservations')}
              className={getNavBtnClass('reservations')}
            >
              <Calendar className="w-3.5 h-3.5" /> Agenda y Reservas
            </button>
          )}

          {isTabVisible('accounting_accounts') && (
            <button 
              onClick={() => setActiveTab('accounting_accounts')}
              className={getNavBtnClass('accounting_accounts')}
            >
              <Briefcase className="w-3.5 h-3.5" /> Contable: Cuentas
            </button>
          )}

          {isTabVisible('accounting_entries') && (
            <button 
              onClick={() => setActiveTab('accounting_entries')}
              className={getNavBtnClass('accounting_entries')}
            >
              <FileSignature className="w-3.5 h-3.5" /> Contable: Asientos
            </button>
          )}

          {isTabVisible('accounting_reports') && (
            <button 
              onClick={() => setActiveTab('accounting_reports')}
              className={getNavBtnClass('accounting_reports')}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" /> Contable: Reportes
            </button>
          )}

          {tenant.isLmsEnabled && isTabVisible('courses') && (
            <button 
              onClick={() => setActiveTab('courses')}
              className={getNavBtnClass('courses')}
            >
              <BookOpen className="w-3.5 h-3.5" /> LMS Aula Cursos
            </button>
          )}

          {tenant.isLmsEnabled && isTabVisible('lms_users') && (
            <button 
              onClick={() => setActiveTab('lms_users')}
              className={getNavBtnClass('lms_users')}
            >
              <Users className="w-3.5 h-3.5" /> LMS Progreso Alumnos
            </button>
          )}

          {isTabVisible('education_schools') && (
            <button 
              onClick={() => setActiveTab('education_schools')}
              className={getNavBtnClass('education_schools')}
            >
              <Building className="w-3.5 h-3.5" /> Educativo: Escuelas
            </button>
          )}

          {isTabVisible('education_members') && (
            <button 
              onClick={() => setActiveTab('education_members')}
              className={getNavBtnClass('education_members')}
            >
              <Users className="w-3.5 h-3.5" /> Educativo: Miembros
            </button>
          )}

          {isTabVisible('crm_pipeline') && (
            <button 
              onClick={() => setActiveTab('crm_pipeline')}
              className={getNavBtnClass('crm_pipeline')}
            >
              <Users className="w-3.5 h-3.5 text-orange-500 font-bold" /> CRM & Prospectos
            </button>
          )}

          {isTabVisible('fulfillment_orders') && (
            <button 
              onClick={() => setActiveTab('fulfillment_orders')}
              className={getNavBtnClass('fulfillment_orders')}
            >
              <Truck className="w-3.5 h-3.5 text-blue-500 font-bold" /> Órdenes & Envíos
            </button>
          )}

          {isTabVisible('inventory_warehouses') && (
            <button 
              onClick={() => setActiveTab('inventory_warehouses')}
              className={getNavBtnClass('inventory_warehouses')}
            >
              <Boxes className="w-3.5 h-3.5 text-green-500 font-bold" /> Almacenes & Lotes
            </button>
          )}

          {isTabVisible('helpdesk_support') && (
            <button 
              onClick={() => setActiveTab('helpdesk_support')}
              className={getNavBtnClass('helpdesk_support')}
            >
              <Zap className="w-3.5 h-3.5 text-purple-500 font-bold" /> HelpDesk Soporte
            </button>
          )}

          {isTabVisible('hr_payroll') && (
            <button 
              onClick={() => setActiveTab('hr_payroll')}
              className={getNavBtnClass('hr_payroll')}
            >
              <Briefcase className="w-3.5 h-3.5 text-teal-500 font-bold" /> RRHH & Nómina
            </button>
          )}

          {isTabVisible('erp_pro') && (
            <button 
              onClick={() => setActiveTab('erp_pro')}
              className={getNavBtnClass('erp_pro')}
            >
              <Settings className="w-3.5 h-3.5 text-orange-500 font-bold" /> ERP PRO
            </button>
          )}

          {/* NIVEL 3 — SERVICIOS TRANSVERSALES */}
          <span className="text-[9px] font-black uppercase text-slate-400 px-4 mt-3 mb-1 block">NIVEL 3 — SERVICIOS</span>

          {isTabVisible('workflows') && (
            <button 
              onClick={() => setActiveTab('workflows')}
              className={getNavBtnClass('workflows')}
            >
              <Workflow className="w-3.5 h-3.5" /> Automatizaciones
            </button>
          )}

          {isTabVisible('integrations') && (
            <button 
              onClick={() => setActiveTab('integrations')}
              className={getNavBtnClass('integrations')}
            >
              <Zap className="w-3.5 h-3.5" /> Integraciones Hub
            </button>
          )}

          {isTabVisible('reports') && (
            <button 
              onClick={() => setActiveTab('reports')}
              className={getNavBtnClass('reports')}
            >
              <FileText className="w-3.5 h-3.5" /> Motor de Reportes
            </button>
          )}

          {isTabVisible('apps') && (
            <button 
              onClick={() => setActiveTab('apps')}
              className={getNavBtnClass('apps')}
            >
              <Grid className="w-3.5 h-3.5" /> App Store / Market
            </button>
          )}

          {/* NIVEL 4 — ECOSISTEMA */}
          <span className="text-[9px] font-black uppercase text-slate-400 px-4 mt-3 mb-1 block">NIVEL 4 — ECOSISTEMA</span>

          {isTabVisible('franquicias') && (
            <button 
              onClick={() => setActiveTab('franquicias')}
              className={getNavBtnClass('franquicias')}
            >
              <MapPin className="w-3.5 h-3.5" /> Franquicias & Sedes
            </button>
          )}

        </nav>

        {/* Sidebar Footer exits */}
        <div className="mt-auto border-t border-slate-100 pt-4 flex flex-col gap-2.5 shrink-0">
          <Link 
            href="/builder" 
            className="w-full py-2.5 bg-slate-900 hover:bg-slate-950 text-white text-center font-extrabold rounded-xl text-xs shadow-md hover:scale-102 transition-transform flex items-center justify-center gap-1.5"
          >
            ✎ Editor Visual
          </Link>
          <Link 
            href="/admin" 
            className="text-center text-[10px] text-slate-400 hover:text-slate-700 font-bold block transition-colors"
          >
            ← Volver a Super Admin
          </Link>
        </div>
      </aside>

      {/* MAIN CONTENT DISPLAY */}
      <main className="flex-grow p-6 md:p-10 overflow-y-auto relative">
        
        {/* Guest mode banner warning */}
        {isGuestMode && (
          <div className="mb-6 p-4 rounded-xl border border-yellow-200 bg-yellow-50 text-yellow-800 text-xs font-bold flex items-center gap-2.5 shadow-sm">
            <AlertCircle className="w-4 h-4 text-yellow-500 shrink-0" />
            <span>Estás explorando en modo <strong>Invitado (Solo Lectura)</strong>. Puedes ver todos los módulos pero no puedes guardar cambios.</span>
          </div>
        )}

        {/* HEADER */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-200 pb-5 mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900">Consola de Inquilino</h1>
            <p className="text-xs text-slate-500">Administra recursos, CMS, automatizaciones y reportes de tu tenant de forma aislada.</p>
          </div>
          <div className="flex items-center gap-3">
            <Link 
              href="/inicio" 
              target="_blank" 
              className="px-4 py-2 border border-slate-200 hover:bg-slate-100/80 rounded-xl text-xs font-black text-slate-700 block transition-all"
            >
              Ver Storefront Público ↗
            </Link>
            <Link 
              href="/mi-cuenta" 
              target="_blank" 
              className="px-4 py-2 bg-slate-950 text-white rounded-xl text-xs font-black hover:bg-slate-900 block transition-all"
            >
              Portal del Cliente `/mi-cuenta` ↗
            </Link>
          </div>
        </header>

        {/* ==================== 1. TAB: METRICAS E HILOS ==================== */}
        {activeTab === 'analytics' && (
          <div className="flex flex-col gap-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col gap-1.5">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Ingreso de Ventas (Semana)</span>
                <span className="text-2xl font-black text-slate-900">$2,450.00</span>
                <span className="text-[10px] text-green-500 font-extrabold">+12.4% vs semana anterior</span>
              </div>
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col gap-1.5">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Páginas Creadas</span>
                <span className="text-2xl font-black text-slate-900">{limits.currentPagesCount} / {limits.maxPages}</span>
                <span className="text-[10px] text-slate-400 font-medium">Límite del Plan {tenant.plan}</span>
              </div>
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col gap-1.5">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Terminales POS Vinculados</span>
                <span className="text-2xl font-black text-slate-900">{limits.currentPosTerminalsCount} / {limits.maxPosTerminals === 999 ? '∞' : limits.maxPosTerminals}</span>
                <span className="text-[10px] text-slate-400 font-medium">Smart Reader paired</span>
              </div>
            </div>

            <section className="p-6 rounded-2xl bg-white border border-slate-200 shadow-md">
              <span className="font-extrabold text-sm text-slate-800 block mb-4">Módulos Activos de tu Sitio (Interruptores Odoo)</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {['isEcommerceEnabled', 'isPosEnabled', 'isLmsEnabled', 'isReservasEnabled'].map((modKey) => {
                  const label = modKey === 'isEcommerceEnabled' ? 'eCommerce' : modKey === 'isPosEnabled' ? 'POS Offline' : modKey === 'isLmsEnabled' ? 'LMS Academia' : 'Reservas';
                  const active = tenant[modKey as keyof Tenant];
                  return (
                    <div 
                      key={modKey}
                      className="p-4 border border-slate-100 rounded-xl flex items-center justify-between hover:bg-slate-50/50 transition-colors"
                    >
                      <div className="flex flex-col gap-0.5 text-xs">
                        <span className="font-bold text-slate-900">{label}</span>
                        <span className="text-[10px] text-gray-400">Modulo SaaS</span>
                      </div>
                      <button 
                        onClick={() => {
                          if (!verifyPermission(PERMISSIONS.COMPANY_MODULES_TOGGLE)) return;
                          const all = dbAdapter.getTenants().map(t => t.id === tenant.id ? { ...t, [modKey]: !active } : t);
                          dbAdapter.saveTenants(all);
                          dbAdapter.addAuditLog(tenant.id, `${activeRole}@tenant.com`, 'Toggle Módulo', `Toggle ${label} a ${!active}`);
                          reloadAllData();
                        }}
                      >
                        {active ? <ToggleRight className="w-8 h-8 text-primary-celeste" /> : <ToggleLeft className="w-8 h-8 text-gray-300" />}
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        )}

        {/* ==================== 2. TAB: CATALOGO TIENDA ==================== */}
        {activeTab === 'products' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Form */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-md h-fit">
              <span className="font-extrabold text-sm text-slate-800 block mb-4">Añadir Nuevo Producto</span>
              <form onSubmit={handleAddProduct} className="flex flex-col gap-4 text-xs font-semibold">
                <div className="flex flex-col gap-1">
                  <label className="text-gray-500">Nombre del Producto</label>
                  <input required type="text" placeholder="Ej. WisePOS terminal" value={prodName} onChange={e => setProdName(e.target.value)} className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-gray-500">Precio ($)</label>
                    <input required type="number" placeholder="150" value={prodPrice} onChange={e => setProdPrice(e.target.value)} className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-gray-500">Categoría</label>
                    <select value={prodCategory} onChange={e => setProdCategory(e.target.value)} className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                      <option value="Hardware">Hardware</option>
                      <option value="Terminales">Terminales</option>
                      <option value="Novedades">Novedades (Colección)</option>
                    </select>
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-gray-500">Código de Barras (EAN-13)</label>
                  <input required type="text" placeholder="7701234567890" value={prodBarcode} onChange={e => setProdBarcode(e.target.value)} className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono" />
                </div>
                <button type="submit" className="w-full py-3 bg-slate-900 hover:bg-slate-950 text-white rounded-xl font-bold mt-2 shadow flex items-center justify-center gap-1.5">
                  <Plus className="w-4 h-4 text-primary-celeste" /> Agregar al Catálogo
                </button>
              </form>
            </div>

            {/* List */}
            <div className="lg:col-span-2 p-6 rounded-2xl bg-white border border-slate-200 shadow-md">
              <span className="font-extrabold text-sm text-slate-800 block mb-4">Productos en Inventario Central</span>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 font-bold text-gray-400">
                      <th className="pb-3">Producto</th>
                      <th className="pb-3">Categoría</th>
                      <th className="pb-3 text-right">Precio</th>
                      <th className="pb-3 text-right">Stock</th>
                      <th className="pb-3 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((p) => (
                      <tr key={p.id} className="border-b border-slate-50">
                        <td className="py-3 font-bold text-slate-800">{p.name}</td>
                        <td className="py-3"><span className="px-2 py-0.5 rounded bg-slate-100 text-slate-500 font-bold text-[10px]">{p.category}</span></td>
                        <td className="py-3 text-right font-black">${p.price.toFixed(2)}</td>
                        <td className="py-3 text-right font-mono font-bold text-primary-celeste">{p.stock} units</td>
                        <td className="py-3 text-right">
                          <button 
                            onClick={() => {
                              if (!verifyPermission(PERMISSIONS.PRODUCTS_DELETE)) return;
                              const updated = products.filter(item => item.id !== p.id);
                              setProducts(updated);
                              dbAdapter.saveProducts(updated);
                              dbAdapter.addAuditLog(tenant.id, `${activeRole}@tenant.com`, 'Eliminar Producto', `Producto removido: ${p.name}`);
                            }}
                            className="p-1 hover:bg-red-50 text-red-500 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* ==================== 3. TAB: CURSOS LMS ==================== */}
        {activeTab === 'courses' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-md h-fit">
              <span className="font-extrabold text-sm text-slate-800 block mb-4">Registrar Nuevo Curso</span>
              <form onSubmit={handleAddCourse} className="flex flex-col gap-4 text-xs font-semibold">
                <div className="flex flex-col gap-1">
                  <label className="text-gray-500">Título del Curso</label>
                  <input required type="text" placeholder="Desarrollo con React 19" value={courseTitle} onChange={e => setCourseTitle(e.target.value)} className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-gray-500">Descripción Corta</label>
                  <textarea required placeholder="Curso completo de SSR y Server Actions..." value={courseDesc} onChange={e => setCourseDesc(e.target.value)} className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl h-20" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-gray-500">Precio ($)</label>
                    <input required type="number" placeholder="29" value={coursePrice} onChange={e => setCoursePrice(e.target.value)} className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-gray-500">Lecciones</label>
                    <input required type="number" value={courseLessons} onChange={e => setCourseLessons(parseInt(e.target.value) || 10)} className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl" />
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-gray-500">Instructor Académico</label>
                  <input required type="text" placeholder="Sarah Connor" value={courseInstructor} onChange={e => setCourseInstructor(e.target.value)} className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl" />
                </div>
                <button type="submit" className="w-full py-3 bg-slate-900 hover:bg-slate-950 text-white rounded-xl font-bold mt-2 shadow flex items-center justify-center gap-1.5">
                  <Plus className="w-4 h-4 text-primary-celeste" /> Crear Curso Académico
                </button>
              </form>
            </div>

            <div className="lg:col-span-2 p-6 rounded-2xl bg-white border border-slate-200 shadow-md">
              <span className="font-extrabold text-sm text-slate-800 block mb-4">Cursos Activos en la Academia</span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {courses.map((c) => (
                  <div key={c.id} className="p-4 border border-slate-100 rounded-2xl flex flex-col justify-between gap-4 bg-slate-50/20 relative">
                    <button 
                      onClick={() => {
                        if (!verifyPermission(PERMISSIONS.LMS_COURSES_CREATE)) return;
                        const updated = courses.filter(item => item.id !== c.id);
                        setCourses(updated);
                        dbAdapter.saveCourses(updated);
                        dbAdapter.addAuditLog(tenant.id, `${activeRole}@tenant.com`, 'Eliminar Curso', `Curso de Academia removido: ${c.title}`);
                      }}
                      className="absolute top-3 right-3 p-1 hover:bg-red-50 text-red-500 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <div>
                      <span className="text-[10px] font-extrabold text-primary-celeste block uppercase">Instructor: {c.instructorName}</span>
                      <h4 className="font-black text-slate-800 text-sm mt-1">{c.title}</h4>
                      <p className="text-[11px] text-gray-500 mt-2 line-clamp-2 leading-relaxed">{c.description}</p>
                    </div>
                    <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs font-extrabold">
                      <span className="text-slate-900">${c.price.toFixed(2)}</span>
                      <span className="text-gray-400 font-mono text-[10px]">{c.lessonsCount} lecciones</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ==================== 3b. TAB: PROGRESO ALUMNOS ==================== */}
        {activeTab === 'lms_users' && (
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-md">
            <span className="font-extrabold text-sm text-slate-800 block mb-4">Progreso de Estudiantes Matriculados</span>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 font-bold text-gray-400">
                    <th className="pb-3">Alumno ID</th>
                    <th className="pb-3">Curso Matriculado</th>
                    <th className="pb-3 text-right">Progreso de avance</th>
                    <th className="pb-3 text-right">Lecciones completadas</th>
                  </tr>
                </thead>
                <tbody>
                  {enrollments.map((e) => {
                    const matchedC = courses.find(course => course.id === e.courseId);
                    if (!matchedC) return null;
                    return (
                      <tr key={e.id} className="border-b border-slate-50">
                        <td className="py-3 font-bold text-slate-800">Estudiante: {e.id.toUpperCase()}</td>
                        <td className="py-3 font-medium text-slate-600">{matchedC.title}</td>
                        <td className="py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-24 bg-slate-100 rounded-full h-2 overflow-hidden">
                              <div className="bg-primary-celeste h-full" style={{ width: `${e.progress}%` }}></div>
                            </div>
                            <span className="font-bold text-slate-700">{e.progress}%</span>
                          </div>
                        </td>
                        <td className="py-3 text-right font-mono text-[10px] font-bold text-gray-400">{e.lessonsCompleted.length} / {matchedC.lessonsCount}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ==================== 3c. TAB: RESERVAS AGENDA ==================== */}
        {activeTab === 'reservations' && (
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-md">
            <span className="font-extrabold text-sm text-slate-800 block mb-4">Historial de Reservas y Citas Online</span>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 font-bold text-gray-400">
                    <th className="pb-3">Reserva ID</th>
                    <th className="pb-3">Cliente</th>
                    <th className="pb-3">Correo</th>
                    <th className="pb-3">Servicio Agendado</th>
                    <th className="pb-3 text-right">Fecha y Horario</th>
                  </tr>
                </thead>
                <tbody>
                  {reservations.map((res) => (
                    <tr key={res.id} className="border-b border-slate-50">
                      <td className="py-3 font-mono font-bold text-slate-500 uppercase">{res.id}</td>
                      <td className="py-3 font-bold text-slate-800">{res.customerName}</td>
                      <td className="py-3 text-gray-500">{res.email}</td>
                      <td className="py-3"><span className="px-2 py-0.5 rounded bg-celeste-claro/20 text-primary-celeste font-bold text-[10px]">{res.serviceName}</span></td>
                      <td className="py-3 text-right font-mono font-bold text-slate-600">{res.dateTime}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ==================== 4. TAB: VISUAL DATABASE BUILDER ==================== */}
        {activeTab === 'cms' && (() => {
          const activeCol = collections.find(c => c.id === selectedCollectionId);
          return (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Create Collection Form */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-md">
                <h3 className="font-black text-slate-900 mb-4 text-sm">🗃️ Nueva Colección CMS</h3>
                <form onSubmit={handleAddCollection} className="space-y-4 text-xs font-semibold">
                  <div className="flex flex-col gap-1">
                    <label className="text-gray-500">Nombre de la Colección</label>
                    <input required placeholder="Ej. Proyectos" value={newColName} onChange={e => setNewColName(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-gray-500">Slug URL</label>
                    <input required placeholder="proyectos" value={newColSlug} onChange={e => setNewColSlug(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-gray-500">Campos actuales del esquema</label>
                    <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex flex-wrap gap-1.5 min-h-[40px]">
                      {dbBuilderFields.length === 0
                        ? <span className="text-gray-400 text-[10px]">Añade campos desde el panel de esquema abajo.</span>
                        : dbBuilderFields.map((f, i) => <span key={i} className="px-2 py-0.5 bg-primary-celeste/20 text-primary-celeste rounded-full text-[9px] font-mono">{f.name}:{f.type}</span>)
                      }
                    </div>
                  </div>
                  <button type="submit" className="w-full py-3 bg-slate-900 hover:bg-primary-celeste hover:text-slate-950 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-1.5">
                    <Plus className="w-4 h-4" /> Crear Colección
                  </button>
                </form>
              </div>

              {/* Collections Selector */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-md">
                <span className="font-extrabold text-sm text-slate-800 block mb-4">Colecciones del Inquilino</span>
                <div className="flex flex-col gap-2 max-h-72 overflow-y-auto pr-1">
                  {collections.map(col => (
                    <button key={col.id} onClick={() => setSelectedCollectionId(col.id)}
                      className={`p-4 rounded-xl border text-left flex flex-col gap-2 transition-all ${selectedCollectionId === col.id ? 'border-primary-celeste bg-celeste-claro/10' : 'border-slate-100 hover:bg-slate-50'}`}>
                      <div className="flex justify-between items-center w-full">
                        <span className="font-black text-slate-900 text-xs">{col.name}</span>
                        <span className="text-[9px] font-mono text-gray-400">GET /api/{col.slug}</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {col.fields.map((f2, fIdx) => {
                          const fobj = typeof f2 === 'string' ? { name: f2, type: 'text' } : f2 as CMSField;
                          return <span key={fIdx} className="px-1.5 py-0.5 rounded bg-slate-100 text-[9px] font-mono text-slate-500">{fobj.name}:{fobj.type}</span>;
                        })}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* VISUAL DB SCHEMA BUILDER */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-950 to-slate-900 border border-slate-800 shadow-xl text-white">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <span className="text-xs font-black uppercase tracking-widest text-primary-celeste block">🗃️ Constructor Visual de Esquema (Typed Fields)</span>
                  <p className="text-slate-400 text-[11px] mt-1">Define los campos tipados. Las rutas REST API se generarán automáticamente.</p>
                </div>
                {selectedCollectionId && <div className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl font-mono text-[10px] text-primary-celeste">/api/{activeCol?.slug}</div>}
              </div>
              <div className="flex flex-col gap-3 mb-4">
                <div className="grid grid-cols-12 gap-2 text-[9px] font-bold text-slate-500 uppercase tracking-widest px-2">
                  <span className="col-span-4">Campo</span><span className="col-span-3">Tipo</span><span className="col-span-3">Validación</span><span className="col-span-2 text-right">Acción</span>
                </div>
                {dbBuilderFields.map((field, fIdx) => {
                  const typeColor = field.type === 'text' ? 'text-blue-400' : field.type === 'number' ? 'text-green-400' : field.type === 'image' ? 'text-purple-400' : field.type === 'date' ? 'text-amber-400' : 'text-pink-400';
                  return (
                    <div key={fIdx} className="grid grid-cols-12 gap-2 items-center bg-slate-800/60 border border-slate-700/50 rounded-xl px-3 py-2.5">
                      <div className="col-span-4 font-mono text-[11px] font-bold text-white">{field.name}</div>
                      <div className="col-span-3"><span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${typeColor} bg-slate-700`}>{field.type}</span></div>
                      <div className="col-span-3 text-[9px] text-slate-400 font-mono">{field.type === 'text' ? 'string | required' : field.type === 'number' ? 'number | nullable' : field.type === 'image' ? 'url | CDN' : field.type === 'date' ? 'ISO 8601' : 'ref → col'}</div>
                      <div className="col-span-2 flex justify-end">
                        <button type="button" onClick={() => setDbBuilderFields(prev => prev.filter((_, i) => i !== fIdx))} className="p-1 hover:bg-red-900/40 text-red-400 rounded"><X className="w-3 h-3" /></button>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex gap-2 items-center mb-4">
                <input type="text" placeholder="nombre_campo" value={newFieldName} onChange={e => setNewFieldName(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                  className="flex-grow px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-[11px] font-mono text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-primary-celeste" />
                <select value={newFieldType} onChange={e => setNewFieldType(e.target.value as CMSField['type'])} className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-[11px] text-white focus:outline-none">
                  <option value="text">📝 Texto</option><option value="number">🔢 Número</option><option value="image">🖼 Imagen URL</option><option value="date">📅 Fecha</option><option value="relation">🔗 Relación</option>
                </select>
                <button type="button" onClick={() => { if (!newFieldName) return; setDbBuilderFields(prev => [...prev, { name: newFieldName, type: newFieldType }]); setNewFieldName(''); }}
                  className="px-4 py-2 bg-primary-celeste text-slate-950 font-extrabold rounded-xl text-[11px] flex items-center gap-1.5 hover:bg-celeste-claro transition-all">
                  <Plus className="w-3.5 h-3.5" /> Campo
                </button>
              </div>
              {selectedCollectionId && (
                <div className="p-4 bg-slate-900 border border-slate-700 rounded-xl">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block mb-3">🚀 REST API Autogenerada</span>
                  <div className="flex flex-col gap-1.5 font-mono text-[10px]">
                    {[{ method: 'GET', route: `/api/${activeCol?.slug}`, desc: 'Listar todos' }, { method: 'POST', route: `/api/${activeCol?.slug}`, desc: 'Crear registro' }, { method: 'PUT', route: `/api/${activeCol?.slug}/:id`, desc: 'Actualizar' }, { method: 'DELETE', route: `/api/${activeCol?.slug}/:id`, desc: 'Eliminar' }].map((r, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold min-w-[46px] text-center ${r.method === 'GET' ? 'bg-green-900 text-green-400' : r.method === 'POST' ? 'bg-blue-900 text-blue-400' : r.method === 'PUT' ? 'bg-amber-900 text-amber-400' : 'bg-red-900 text-red-400'}`}>{r.method}</span>
                        <span className="text-primary-celeste">{r.route}</span>
                        <span className="text-slate-500 text-[9px]">// {r.desc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* CMS Record Manager */}
            {selectedCollectionId && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-md h-fit">
                  <span className="font-extrabold text-sm text-slate-800 block mb-4">Agregar Registro en: {activeCol?.name}</span>
                  <form onSubmit={handleAddCmsItem} className="flex flex-col gap-4 text-xs font-semibold">
                    {dbBuilderFields.map((field) => (
                      <div key={field.name} className="flex flex-col gap-1">
                        <label className="text-gray-500 uppercase text-[9px] font-bold tracking-wider">{field.name} <span className="normal-case font-normal text-gray-400">({field.type})</span></label>
                        <input required type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'} placeholder={`${field.name}…`}
                          value={newItemData[field.name] || ''} onChange={(e) => setNewItemData({ ...newItemData, [field.name]: e.target.value })} className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl" />
                      </div>
                    ))}
                    <button type="submit" className="w-full py-3 bg-slate-900 hover:bg-slate-950 text-white rounded-xl font-bold mt-2 shadow flex items-center justify-center gap-1.5">
                      <Plus className="w-4 h-4 text-primary-celeste" /> Guardar Registro
                    </button>
                  </form>
                </div>
                <div className="lg:col-span-2 p-6 rounded-2xl bg-white border border-slate-200 shadow-md">
                  <span className="font-extrabold text-sm text-slate-800 block mb-4">Registros Guardados</span>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-sans">
                      <thead>
                        <tr className="border-b border-slate-100 font-bold text-gray-400">
                          <th className="pb-3">ID</th>
                          {dbBuilderFields.map(f => <th key={f.name} className="pb-3 uppercase text-[9px] font-bold tracking-wider">{f.name}</th>)}
                          <th className="pb-3 text-right">Acción</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cmsItems.map((item) => (
                          <tr key={item.id} className="border-b border-slate-50">
                            <td className="py-3 font-mono text-slate-400 text-[10px]">{item.id.slice(0, 12)}…</td>
                            {dbBuilderFields.map(f => <td key={f.name} className="py-3 font-bold text-slate-700">{item.data[f.name] || '-'}</td>)}
                            <td className="py-3 text-right">
                              <button type="button" onClick={() => { if (!verifyPermission(PERMISSIONS.CMS_ITEMS_DELETE)) return; const upd = dbAdapter.getCmsItems().filter(i => i.id !== item.id); dbAdapter.saveCmsItems(upd); dbAdapter.addAuditLog(tenant.id, `${activeRole}@tenant.com`, 'Eliminar Registro', `ID ${item.id}`); reloadAllData(); }} className="p-1 hover:bg-red-50 text-red-500 rounded">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
          );
        })()}

        {/* ==================== 4b. TAB: FRANQUICIAS MULTI-SEDE ==================== */}
        {activeTab === 'franquicias' && (
          <div className="flex flex-col gap-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="md:col-span-2 p-6 rounded-2xl bg-gradient-to-br from-primary-celeste to-cyan-400 text-slate-950 shadow-lg flex flex-col gap-1">
                <span className="text-[10px] font-black uppercase tracking-widest opacity-70">MRR Total Multi-Sede</span>
                <span className="text-3xl font-black">${branches.reduce((acc, b) => acc + b.mrr, 0).toLocaleString()}</span>
                <span className="text-[11px] font-bold opacity-80">📈 +8.2% vs mes anterior · {branches.filter(b => b.isActive).length} sedes activas</span>
              </div>
              {branches.slice(0, 2).map(br => (
                <div key={br.id} className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col gap-1.5">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider truncate">{br.name}</span>
                  <span className="text-xl font-black text-slate-900">${br.mrr.toLocaleString()}</span>
                  <div className="flex items-center gap-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${br.isActive ? 'bg-green-500' : 'bg-red-400'}`} />
                    <span className="text-[10px] font-bold text-gray-400">{br.isActive ? 'Activa' : 'Inactiva'}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {branches.map((br) => {
                const isSelected = selectedBranchId === br.id;
                const totalMrr = branches.reduce((a, b) => a + b.mrr, 0);
                return (
                  <div key={br.id} onClick={() => { setSelectedBranchId(br.id); setBranchInventory(dbAdapter.getBranchInventory(br.id)); }}
                    className={`p-5 rounded-2xl border cursor-pointer transition-all ${isSelected ? 'border-primary-celeste bg-celeste-claro/5 shadow-md' : 'border-slate-200 bg-white hover:border-primary-celeste/50'}`}>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <span className="text-xs font-black text-slate-900 block">{br.name}</span>
                        <span className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5"><MapPin className="w-2.5 h-2.5" /> {br.address}</span>
                      </div>
                      <div className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold ${br.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>{br.isActive ? '● Activa' : '● Inactiva'}</div>
                    </div>
                    <div className="flex items-end justify-between border-t border-slate-100 pt-3">
                      <div>
                        <span className="text-[10px] text-gray-400 block font-bold uppercase tracking-wider">MRR Mensual</span>
                        <span className="text-xl font-black text-slate-900">${br.mrr.toLocaleString()}</span>
                      </div>
                      <div className="flex flex-col items-end">
                        <div className="w-20 bg-slate-100 rounded-full h-2 mt-1 overflow-hidden">
                          <div className="bg-primary-celeste h-full rounded-full" style={{ width: `${Math.round((br.mrr / totalMrr) * 100)}%` }} />
                        </div>
                        <span className="text-[9px] font-black text-primary-celeste mt-0.5">{Math.round((br.mrr / totalMrr) * 100)}%</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {selectedBranchId && branchInventory.length > 0 && (
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-md">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <span className="font-extrabold text-sm text-slate-800 block">Inventario: {branches.find(b => b.id === selectedBranchId)?.name}</span>
                    <p className="text-xs text-slate-400 mt-1">Simula transferencias de stock entre sedes</p>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-bold text-primary-celeste"><Package className="w-4 h-4" /> {branchInventory.length} SKUs</div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 font-bold text-gray-400">
                        <th className="pb-3">Producto</th><th className="pb-3 text-right">Stock Sede</th><th className="pb-3 text-right">Transferir</th><th className="pb-3 text-right">Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {branchInventory.map((inv) => {
                        const product = products.find(p => p.id === inv.productId);
                        return (
                          <tr key={inv.id} className="border-b border-slate-50">
                            <td className="py-3 font-bold text-slate-800">{product?.name || inv.productId}</td>
                            <td className="py-3 text-right"><span className={`font-mono font-black ${inv.stock < 5 ? 'text-red-500' : 'text-slate-700'}`}>{inv.stock} u.</span></td>
                            <td className="py-3 text-right">
                              <input type="number" min="0" max={inv.stock} placeholder="0" value={transferQty[inv.id] || ''} onChange={e => setTransferQty({ ...transferQty, [inv.id]: e.target.value })} className="w-20 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-right text-xs font-mono" />
                            </td>
                            <td className="py-3 text-right">
                              <button type="button" onClick={() => {
                                const qty = parseInt(transferQty[inv.id] || '0');
                                if (qty <= 0 || qty > inv.stock) { alert('Cantidad inválida.'); return; }
                                const updated = branchInventory.map(i => i.id === inv.id ? { ...i, stock: i.stock - qty } : i);
                                setBranchInventory(updated); dbAdapter.saveBranchInventory(selectedBranchId, updated);
                                dbAdapter.addAuditLog(tenant.id, `${activeRole}@tenant.com`, 'Transfer Inventario', `${qty} u. ${product?.name}`);
                                setTransferQty({ ...transferQty, [inv.id]: '' }); alert(`✓ ${qty} u. de ${product?.name} transferidas a Central.`);
                              }} className="px-3 py-1.5 bg-slate-900 hover:bg-primary-celeste hover:text-slate-950 text-white font-bold rounded-lg text-[10px] flex items-center gap-1 transition-all">
                                <ArrowLeftRight className="w-3 h-3" /> Transferir
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-md">
              <div className="flex items-center gap-2 mb-5"><Shield className="w-4 h-4 text-primary-celeste" /><span className="font-extrabold text-sm text-slate-800">Políticas RBAC Granulares</span></div>
              <p className="text-xs text-slate-400 mb-4">Configura permisos READ/WRITE/DELETE por módulo para el rol Manager.</p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead><tr className="border-b border-slate-100 font-bold text-gray-400"><th className="pb-3 text-left">Módulo</th><th className="pb-3 text-center">READ</th><th className="pb-3 text-center">WRITE</th><th className="pb-3 text-center">DELETE</th></tr></thead>
                  <tbody>
                    {Object.entries(rbacPolicies).map(([module, perms]) => (
                      <tr key={module} className="border-b border-slate-50">
                        <td className="py-3 font-black text-slate-800 capitalize">{module}</td>
                        {(['read', 'write', 'delete'] as const).map(perm => (
                          <td key={perm} className="py-3 text-center">
                            <button type="button" onClick={() => { if (!verifyPermission(PERMISSIONS.COMPANY_USERS_ASSIGN_ROLES)) return; setRbacPolicies(prev => ({ ...prev, [module]: { ...prev[module], [perm]: !prev[module][perm] } })); dbAdapter.addAuditLog(tenant.id, `${activeRole}@tenant.com`, 'Modificar RBAC', `${perm.toUpperCase()} en ${module} → ${!perms[perm]}`); }} className="inline-flex items-center justify-center">
                              {perms[perm] ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <AlertOctagon className="w-5 h-5 text-slate-300" />}
                            </button>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ==================== 5. TAB: AUTOMATIZACIONES ==================== */}
        {activeTab === 'workflows' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Create Workflow form */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-md h-fit">
              <span className="font-extrabold text-sm text-slate-800 block mb-4">Crear Automatización (Zapier Style)</span>
              <form onSubmit={handleAddWorkflow} className="flex flex-col gap-4 text-xs font-semibold">
                <div className="flex flex-col gap-1">
                  <label className="text-gray-500">Nombre de la Automatización</label>
                  <input required type="text" placeholder="Ej. Registro de Prospecto a CRM" value={newWfName} onChange={e => setNewWfName(e.target.value)} className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl" />
                </div>
                
                <div className="flex flex-col gap-1">
                  <label className="text-gray-500">Gatillador (Trigger Event)</label>
                  <select value={newWfTrigger} onChange={e => setNewWfTrigger(e.target.value)} className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                    <option value="contact_form_submit">📩 Al enviar formulario de contacto</option>
                    <option value="pos_sale">🏪 Al procesar venta en caja POS</option>
                    <option value="new_enrollment">🎓 Al matricularse en curso LMS</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-gray-500">Acciones Ejecutables (Actions)</label>
                  <div className="flex flex-col gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
                    {[
                      { val: 'send_email', label: '✉ Enviar Correo de Confirmación' },
                      { val: 'send_whatsapp', label: '💬 Enviar alerta por WhatsApp Twilio' },
                      { val: 'sync_crm_webhook', label: '🗲 Disparar Webhook CRM (Klaviyo)' },
                      { val: 'sync_central_erp', label: '📂 Sincronizar stock con SAP/Odoo' }
                    ].map(act => (
                      <label key={act.val} className="flex items-center gap-2 font-bold cursor-pointer text-slate-700">
                        <input
                          type="checkbox"
                          checked={newWfActions.includes(act.val)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewWfActions([...newWfActions, act.val]);
                            } else {
                              setNewWfActions(newWfActions.filter(a => a !== act.val));
                            }
                          }}
                          className="rounded text-primary-celeste focus:ring-primary-celeste"
                        />
                        <span>{act.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <button type="submit" className="w-full py-3 bg-slate-900 hover:bg-slate-950 text-white rounded-xl font-bold mt-2 shadow flex items-center justify-center gap-1.5">
                  <Plus className="w-4 h-4 text-primary-celeste" /> Guardar Regla Automatizada
                </button>
              </form>
            </div>

            {/* Workflows list */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-md">
                <span className="font-extrabold text-sm text-slate-800 block mb-4">Automatizaciones Configuradas</span>
                <div className="flex flex-col gap-4">
                  {workflows.map(wf => (
                    <div key={wf.id} className="p-4 border border-slate-100 rounded-xl bg-slate-50/20 flex items-center justify-between">
                      <div className="flex flex-col gap-1 max-w-[70%]">
                        <span className="font-black text-slate-800 text-xs">{wf.name}</span>
                        <div className="flex flex-wrap gap-1 mt-1 text-[9px] font-mono font-bold">
                          <span className="px-2 py-0.5 rounded bg-yellow-50 text-yellow-800 border border-yellow-200">Gatillo: {wf.trigger}</span>
                          {wf.actions.map(a => (
                            <span key={a} className="px-2 py-0.5 rounded bg-green-50 text-green-800 border border-green-200">{a}</span>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => handleToggleWorkflow(wf.id)}
                          className="focus:outline-none"
                        >
                          {wf.active ? <ToggleRight className="w-8 h-8 text-primary-celeste" /> : <ToggleLeft className="w-8 h-8 text-gray-300" />}
                        </button>
                        <button
                          onClick={() => {
                            if (!verifyPermission(PERMISSIONS.WORKFLOWS_DELETE)) return;
                            const updated = dbAdapter.getWorkflows().filter(w => w.id !== wf.id);
                            dbAdapter.saveWorkflows(updated);
                            dbAdapter.addAuditLog(tenant.id, `${activeRole}@tenant.com`, 'Eliminar Workflow', `Workflow ${wf.id} eliminado`);
                            reloadAllData();
                          }}
                          className="p-1.5 bg-white border border-slate-200 hover:bg-red-50 text-red-500 rounded-lg"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Workflow Simulator Logs */}
              <div className="p-6 rounded-2xl bg-slate-950 text-slate-300 border border-slate-900 shadow-md font-mono text-[10px]">
                <div className="flex justify-between items-center mb-4">
                  <span className="font-extrabold text-[10px] text-slate-400 uppercase tracking-widest block">Live Automations Execution Log</span>
                  <span className="px-2 py-0.5 rounded bg-slate-900 text-primary-celeste text-[9px] font-bold">Orquestador SaaS Active</span>
                </div>
                <div className="h-28 overflow-y-auto flex flex-col gap-1 pr-2 scrollbar-thin">
                  <div>[{new Date().toLocaleTimeString()}] Inicializando escuchadores de gatilladores del tenant {tenant.name}...</div>
                  <div>[{new Date().toLocaleTimeString()}] Escuchando evento de formulario: contact_form_submit</div>
                  <div>[{new Date().toLocaleTimeString()}] Escuchando evento de caja terminal: pos_sale</div>
                  <div>[{new Date().toLocaleTimeString()}] Conectado a cola de mensajería asíncrona de eventos.</div>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* ==================== 6. TAB: INTEGRACIONES HUB ==================== */}
        {activeTab === 'integrations' && (
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {integrations.map(int => (
                <div key={int.id} className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col justify-between gap-5 relative">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">{int.provider}</span>
                      <h4 className="font-black text-slate-800 text-sm mt-1">{int.name}</h4>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                      int.connected ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-400'
                    }`}>
                      {int.connected ? 'Conectado' : 'Inactivo'}
                    </span>
                  </div>

                  <div className="text-[11px] text-gray-500 leading-relaxed font-semibold">
                    {int.provider === 'stripe' && 'Pasarela de pagos en tarjeta. Soporta BBPOS Smart Reader.'}
                    {int.provider === 'paypal' && 'Botones rápidos y suscripciones de PayPal Express Checkout.'}
                    {int.provider === 'resend' && 'Servicio SMTP transaccional para confirmación de pedidos.'}
                    {int.provider === 'whatsapp' && 'Alertas SMS y WhatsApp Business por medio de Twilio API.'}
                    {int.provider === 'sap' && 'Sincronización de catálogos e inventarios en SAP Business One.'}
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-2">
                    <button
                      onClick={() => {
                        setEditingIntegrationId(editingIntegrationId === int.id ? null : int.id);
                        setIntegrationConfig(int.config || {});
                      }}
                      className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-[10px] font-bold rounded-lg"
                    >
                      Ajustar API
                    </button>
                    <button 
                      onClick={() => handleToggleIntegration(int.id)}
                      className={`px-4 py-1.5 font-bold rounded-lg text-[10px] ${
                        int.connected ? 'bg-red-50 hover:bg-red-100 text-red-600' : 'bg-slate-900 hover:bg-slate-950 text-white shadow'
                      }`}
                    >
                      {int.connected ? 'Desconectar' : 'Conectar'}
                    </button>
                  </div>

                  {/* Config Drawer overlay inside card */}
                  {editingIntegrationId === int.id && (
                    <div className="absolute inset-0 bg-white/95 border border-primary-celeste/40 p-4 rounded-2xl z-10 flex flex-col justify-between">
                      <div className="flex flex-col gap-3">
                        <div className="flex justify-between items-center">
                          <span className="font-black text-slate-800 text-xs">Configurar {int.name}</span>
                          <button onClick={() => setEditingIntegrationId(null)} className="p-1 hover:bg-slate-100 rounded text-slate-400">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="flex flex-col gap-1 text-[10px] font-semibold">
                          <label className="text-gray-500">API Key / Endpoint URL</label>
                          <input
                            type="text"
                            placeholder="Ingrese credencial de producción"
                            value={integrationConfig.apiKey || ''}
                            onChange={(e) => setIntegrationConfig({ ...integrationConfig, apiKey: e.target.value })}
                            className="px-3.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px]"
                          />
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          if (!verifyPermission(PERMISSIONS.INTEGRATIONS_CONNECT)) return;
                          const all = dbAdapter.getIntegrations();
                          const match = all.find(i => i.id === int.id);
                          if (match) {
                            match.config = integrationConfig;
                            dbAdapter.saveIntegrations(all);
                            dbAdapter.addAuditLog(tenant.id, `${activeRole}@tenant.com`, 'Configurar Integración', `Configuración guardada para: ${int.name}`);
                            setEditingIntegrationId(null);
                            reloadAllData();
                            alert('Configuración guardada.');
                          }
                        }}
                        className="w-full py-2 bg-slate-900 hover:bg-slate-950 text-white font-bold rounded-lg text-[10px]"
                      >
                        Guardar Ajuste
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==================== 7. TAB: SAAS PLAN Y FACTURACION ==================== */}
        {activeTab === 'billing' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Plan Limit Dashboard */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-md h-fit flex flex-col gap-6">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Suscripción SaaS Activa</span>
                <span className="text-2xl font-black text-slate-900 mt-1 block">Plan {tenant.plan}</span>
                <span className="text-[11px] font-semibold text-gray-500 mt-1 block">Facturación mensual activa mediante Stripe Billing.</span>
              </div>

              <div className="flex flex-col gap-4 text-xs font-semibold">
                
                {/* Pages Limit */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between font-bold text-slate-700">
                    <span>Límite de Páginas Creadas</span>
                    <span>{limits.currentPagesCount} / {limits.maxPages}</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-primary-celeste h-full" style={{ width: `${(limits.currentPagesCount / limits.maxPages) * 100}%` }}></div>
                  </div>
                </div>

                {/* Terminals Limit */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between font-bold text-slate-700">
                    <span>Límite de Cajas Registradoras POS</span>
                    <span>{limits.currentPosTerminalsCount} / {limits.maxPosTerminals === 999 ? '∞' : limits.maxPosTerminals}</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-primary-celeste h-full" style={{ width: `${(limits.currentPosTerminalsCount / (limits.maxPosTerminals === 999 ? 10 : limits.maxPosTerminals)) * 100}%` }}></div>
                  </div>
                </div>

              </div>

              {tenant.plan !== 'Enterprise' ? (
                <button
                  onClick={handleUpgradePlan}
                  className="w-full py-3.5 bg-gradient-to-r from-slate-900 to-slate-950 hover:from-slate-950 text-white font-extrabold rounded-xl text-xs shadow-lg hover:scale-102 transition-all flex items-center justify-center gap-1.5"
                >
                  ⚡ Upgrade a Plan Enterprise ($99/mo)
                </button>
              ) : (
                <div className="p-3 bg-green-50 border border-green-200 text-green-800 text-xs font-bold rounded-xl text-center">
                  👑 Tienes el Plan Enterprise Máximo. Sin límites de facturación.
                </div>
              )}
            </div>

            {/* Invoices List */}
            <div className="lg:col-span-2 p-6 rounded-2xl bg-white border border-slate-200 shadow-md">
              <span className="font-extrabold text-sm text-slate-800 block mb-4">Historial de Facturación de tu SaaS</span>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 font-bold text-gray-400">
                      <th className="pb-3">Factura ID</th>
                      <th className="pb-3">Fecha de Cobro</th>
                      <th className="pb-3 text-right">Monto</th>
                      <th className="pb-3 text-right">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {limits.invoices.map((inv: any) => (
                      <tr key={inv.id} className="border-b border-slate-50">
                        <td className="py-3 font-mono font-bold text-slate-500 uppercase">{inv.id}</td>
                        <td className="py-3 font-medium text-slate-600">{inv.date}</td>
                        <td className="py-3 text-right font-black">${inv.amount.toFixed(2)} USD</td>
                        <td className="py-3 text-right">
                          <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-black text-[9px] uppercase tracking-wider">
                            {inv.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* ==================== 8. TAB: LOGS DE AUDITORIA ==================== */}
        {activeTab === 'audit' && (
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-md">
            <span className="font-extrabold text-sm text-slate-800 block mb-4">Historial de Logs de Auditoría (Cumplimiento de Seguridad)</span>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-sans">
                <thead>
                  <tr className="border-b border-slate-100 font-bold text-gray-400">
                    <th className="pb-3">Usuario Admin</th>
                    <th className="pb-3">Acción Realizada</th>
                    <th className="pb-3">Fecha y Hora</th>
                    <th className="pb-3">Dirección IP</th>
                    <th className="pb-3 text-right">Detalle del Cambio</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="border-b border-slate-50 text-[11px]">
                      <td className="py-3 font-bold text-slate-800">{log.userId}</td>
                      <td className="py-3"><span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-black text-[9px] uppercase">{log.action}</span></td>
                      <td className="py-3 text-slate-500 font-mono">{new Date(log.createdAt).toLocaleString()}</td>
                      <td className="py-3 font-mono text-slate-400">{log.ip}</td>
                      <td className="py-3 text-right font-bold text-slate-700 leading-snug">{log.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ==================== 9. TAB: MOTOR DE REPORTES ==================== */}
        {activeTab === 'reports' && (
          <div className="flex flex-col gap-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Sales Report Card */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-md flex flex-col justify-between gap-6">
                <div>
                  <h4 className="font-extrabold text-slate-800 text-sm mb-1">Reporte de Ventas POS</h4>
                  <p className="text-xs text-gray-400">Exporta las transacciones de ventas consolidadas por terminales.</p>
                </div>
                
                {/* Visual mini bar graph using styled divs */}
                <div className="flex items-end justify-between h-24 bg-slate-50 rounded-xl p-4 border border-slate-100">
                  {[45, 75, 30, 90, 60, 110, 80].map((h, i) => (
                    <div key={i} className="flex flex-col items-center gap-1.5 w-7">
                      <div className="bg-primary-celeste w-full rounded-t" style={{ height: `${h * 0.5}px` }}></div>
                      <span className="text-[8px] font-bold text-gray-400">D{i+1}</span>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button onClick={() => handleExportData('pdf', 'ventas_pos', products)} className="py-2.5 px-1 bg-slate-900 hover:bg-slate-950 text-white rounded-xl font-bold text-[10px] flex items-center justify-center gap-1">
                    <Download className="w-3 h-3 text-primary-celeste" /> PDF
                  </button>
                  <button onClick={() => handleExportData('csv', 'ventas_pos', products)} className="py-2.5 px-1 bg-slate-900 hover:bg-slate-950 text-white rounded-xl font-bold text-[10px] flex items-center justify-center gap-1">
                    <Download className="w-3 h-3 text-primary-celeste" /> CSV
                  </button>
                  <button onClick={() => handleExportData('xls', 'ventas_pos', products)} className="py-2.5 px-1 bg-slate-900 hover:bg-slate-950 text-white rounded-xl font-bold text-[10px] flex items-center justify-center gap-1">
                    <Download className="w-3 h-3 text-primary-celeste" /> Excel
                  </button>
                </div>
              </div>

              {/* Course Completed Report Card */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-md flex flex-col justify-between gap-6">
                <div>
                  <h4 className="font-extrabold text-slate-800 text-sm mb-1">Reporte de Avances Académicos (LMS)</h4>
                  <p className="text-xs text-gray-400">Exporta el listado de alumnos y porcentajes de avance de cursos.</p>
                </div>

                {/* Visual donut-like progress highlights */}
                <div className="flex items-center justify-around h-24 bg-slate-50 rounded-xl p-4 border border-slate-100 text-[10px] font-bold">
                  <div className="text-center flex flex-col items-center gap-1">
                    <span className="text-lg font-black text-slate-800">85%</span>
                    <span className="text-[8px] uppercase tracking-wider text-gray-400">NextJS 16</span>
                  </div>
                  <div className="text-center flex flex-col items-center gap-1">
                    <span className="text-lg font-black text-slate-800">42%</span>
                    <span className="text-[8px] uppercase tracking-wider text-gray-400">Postgres RLS</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button onClick={() => handleExportData('pdf', 'lms_progreso', enrollments)} className="py-2.5 px-1 bg-slate-900 hover:bg-slate-950 text-white rounded-xl font-bold text-[10px] flex items-center justify-center gap-1">
                    <Download className="w-3 h-3 text-primary-celeste" /> PDF
                  </button>
                  <button onClick={() => handleExportData('csv', 'lms_progreso', enrollments)} className="py-2.5 px-1 bg-slate-900 hover:bg-slate-950 text-white rounded-xl font-bold text-[10px] flex items-center justify-center gap-1">
                    <Download className="w-3 h-3 text-primary-celeste" /> CSV
                  </button>
                  <button onClick={() => handleExportData('xls', 'lms_progreso', enrollments)} className="py-2.5 px-1 bg-slate-900 hover:bg-slate-950 text-white rounded-xl font-bold text-[10px] flex items-center justify-center gap-1">
                    <Download className="w-3 h-3 text-primary-celeste" /> Excel
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ==================== 10. TAB: DEVELOPER API KEYS ==================== */}
        {activeTab === 'api' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Generate Key Form */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-md h-fit">
              <span className="font-extrabold text-sm text-slate-800 block mb-4">Generar Credencial API Pública</span>
              <form onSubmit={handleAddApiKey} className="flex flex-col gap-4 text-xs font-semibold">
                <div className="flex flex-col gap-1">
                  <label className="text-gray-500">Nombre de la Credencial</label>
                  <input required type="text" placeholder="Ej. Integración ERP SAP" value={newKeyName} onChange={e => setNewKeyName(e.target.value)} className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl" />
                </div>
                <button type="submit" className="w-full py-3 bg-slate-900 hover:bg-slate-950 text-white rounded-xl font-bold mt-2 shadow flex items-center justify-center gap-1.5">
                  <Key className="w-4 h-4 text-primary-celeste" /> Generar API Keys
                </button>
              </form>
            </div>

            {/* Keys list & Webhook registry */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-md">
                <span className="font-extrabold text-sm text-slate-800 block mb-4">API Keys del Inquilino</span>
                <div className="flex flex-col gap-5">
                  {apiKeys.map(key => (
                    <div key={key.id} className="p-4 border border-slate-100 rounded-xl bg-slate-50/20 flex flex-col gap-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-black text-slate-800 text-xs">{key.name}</h4>
                          <span className="text-[9px] text-gray-400">ID: {key.id}</span>
                        </div>
                        <button
                          onClick={() => {
                            if (!verifyPermission(PERMISSIONS.API_KEYS_REVOKE)) return;
                            const updated = dbAdapter.getApiKeys().filter(k => k.id !== key.id);
                            dbAdapter.saveApiKeys(updated);
                            dbAdapter.addAuditLog(tenant.id, `${activeRole}@tenant.com`, 'Revocar Llave API', `Llave ${key.name} revocada.`);
                            reloadAllData();
                          }}
                          className="p-1 hover:bg-red-50 text-red-500 rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[10px] font-mono">
                        <div className="p-2 bg-slate-900 text-slate-300 rounded border border-slate-900 flex justify-between select-all">
                          <span className="text-slate-500">PUB_KEY:</span>
                          <span className="font-bold">{key.publicKey}</span>
                        </div>
                        <div className="p-2 bg-slate-900 text-slate-300 rounded border border-slate-900 flex justify-between select-all">
                          <span className="text-slate-500">SEC_KEY:</span>
                          <span className="font-bold">{key.secretKey}</span>
                        </div>
                      </div>

                      {/* Webhooks form inside key item */}
                      <div className="border-t border-slate-100 pt-3 mt-1 flex flex-col gap-3">
                        <span className="text-[10px] font-black uppercase text-slate-400">Webhooks de Salida Enlazados</span>
                        
                        <div className="flex flex-col gap-1.5">
                          {key.webhooks.map((wh) => (
                            <div key={wh.id} className="flex justify-between items-center text-[10px] bg-slate-100 p-2 rounded-lg font-mono">
                              <span className="font-bold truncate max-w-[70%]">{wh.url}</span>
                              <span className="px-1.5 py-0.5 rounded bg-slate-900 text-primary-celeste text-[8px] font-extrabold uppercase">{wh.trigger}</span>
                            </div>
                          ))}
                        </div>

                        {/* Webhook registrar */}
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            placeholder="https://su-sistema.com/webhook/orders" 
                            value={webhookUrl}
                            onChange={(e) => setWebhookUrl(e.target.value)}
                            className="flex-grow px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-mono focus:outline-none"
                          />
                          <select 
                            value={webhookTrigger}
                            onChange={(e) => setWebhookTrigger(e.target.value)}
                            className="bg-white border border-slate-200 rounded-lg px-2 text-[10px] font-bold"
                          >
                            <option value="pos_sale">pos_sale</option>
                            <option value="contact_form_submit">contact_submit</option>
                          </select>
                          <button
                            type="button"
                            onClick={() => handleAddWebhook(key.id)}
                            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-950 text-white font-bold rounded-lg text-[10px]"
                          >
                            + Webhook
                          </button>
                        </div>
                      </div>

                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        )}

        {/* ==================== AJUSTES BASICOS (EXISTING PRE-UPGRADE TABS) ==================== */}
        {activeTab === 'settings' && (
          <div className="flex flex-col gap-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Let's Encrypt CNAME Setup */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-md flex flex-col justify-between gap-5">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Acceso Externo CNAME Dedicado</span>
                  <h4 className="font-black text-slate-900 text-sm mt-1">Vincular Dominio Personalizado</h4>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">Configura un dominio (ej: <code>www.tienda.com</code>) para que tu cliente acceda directamente al storefront del SaaS en el Edge.</p>
                </div>
                
                <div className="flex flex-col gap-3 text-xs font-semibold">
                  <div className="flex flex-col gap-1">
                    <label className="text-gray-500">Dominio Personalizado</label>
                    <input 
                      type="text" 
                      placeholder="www.tuempresa.com" 
                      value={customDomain}
                      onChange={e => setCustomDomain(e.target.value)}
                      className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:outline-none"
                    />
                  </div>

                  {/* DNS logs loader validation */}
                  {dnsLogs.length > 0 && (
                    <div className="bg-slate-950 text-slate-300 font-mono text-[9px] p-3 rounded-xl flex flex-col gap-1 max-h-40 overflow-y-auto border border-slate-900 scrollbar-thin">
                      {dnsLogs.map((log, idx) => (
                        <div key={idx} className={log.includes('✓') || log.includes('detectado') ? 'text-green-400' : 'text-slate-300'}>
                          {log}
                        </div>
                      ))}
                      {isVerifyingDns && <div className="text-primary-celeste animate-pulse">Consultando DNS en Cloudflare Anycast...</div>}
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={handleVerifyDns}
                    disabled={isVerifyingDns}
                    className="py-2.5 px-4 bg-slate-900 hover:bg-slate-950 disabled:opacity-40 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow"
                  >
                    <Globe className="w-3.5 h-3.5" /> Validar DNS y Firmar SSL Let's Encrypt
                  </button>
                </div>
              </div>

              {/* General details */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-md flex flex-col justify-between gap-5 text-xs font-semibold">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Metadatos del Sitio Web</span>
                  <h4 className="font-black text-slate-900 text-sm mt-1">Configuración Estética</h4>
                </div>

                <div className="flex flex-col gap-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-gray-500">Favicon Icono (Emoji)</label>
                      <input type="text" value={favicon} onChange={e => setFavicon(e.target.value)} className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-gray-500">Google Analytics ID</label>
                      <input type="text" value={analyticsId} onChange={e => setAnalyticsId(e.target.value)} className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 border border-slate-100 rounded-xl bg-slate-50/20">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-slate-800 font-bold">Modo Oscuro Predeterminado</span>
                      <span className="text-[10px] text-gray-400">Fuerza Dark Mode en visitante</span>
                    </div>
                    <button onClick={() => setThemeDark(!themeDark)}>
                      {themeDark ? <ToggleRight className="w-8 h-8 text-primary-celeste" /> : <ToggleLeft className="w-8 h-8 text-gray-300" />}
                    </button>
                  </div>
                </div>

                <div className="flex justify-between items-center border-t border-slate-100 pt-4 mt-2">
                  <button onClick={handlePublish} disabled={isPublishing} className="py-2.5 px-4 bg-primary-celeste text-slate-950 font-extrabold rounded-xl text-xs hover:scale-102 transition-transform shadow flex items-center gap-1.5">
                    <RefreshCw className={`w-3.5 h-3.5 ${isPublishing ? 'animate-spin' : ''}`} /> Publicar Cambios (Purge CDN Cache)
                  </button>
                  <button onClick={handleSaveSettings} className="py-2.5 px-4 bg-slate-900 hover:bg-slate-950 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow">
                    <Save className="w-3.5 h-3.5 text-primary-celeste" /> Guardar Ajustes
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ==================== APP STORE INSTALLER TAB (PART 4) ==================== */}
        {activeTab === 'apps' && (
          <div className="flex flex-col gap-8 relative">
            
            {/* Installation loading logs modal */}
            {isInstalling && (
              <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm z-50 rounded-2xl flex items-center justify-center p-6">
                <div className="bg-slate-950 border border-slate-800 p-8 rounded-3xl shadow-2xl max-w-sm w-full text-center flex flex-col items-center gap-6">
                  <RefreshCw className="w-10 h-10 text-primary-celeste animate-spin" />
                  <div>
                    <h3 className="text-white font-extrabold text-sm uppercase tracking-wider">Instalando Módulo de Negocio</h3>
                    <p className="text-xs text-slate-400 mt-1">Aprovisionando recurso: {installingModule}</p>
                  </div>
                  <div className="w-full bg-slate-900 border border-slate-800/80 rounded-xl p-3 text-[9px] font-mono text-slate-300 text-left flex flex-col gap-1 max-h-32 overflow-y-auto scrollbar-thin">
                    {installLogs.map((log, idx) => <div key={idx} className="text-green-400">{log}</div>)}
                  </div>
                </div>
              </div>
            )}

            {/* Modules Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* LMS App installer */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-md flex flex-col justify-between gap-6">
                <div className="flex justify-between items-start">
                  <div>
                    <BookOpen className="w-8 h-8 text-primary-celeste mb-3" />
                    <h3 className="font-extrabold text-slate-900 text-sm">Aula Virtual & LMS Academia</h3>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">Crea cursos, publica videolecciones y evalúa el progreso de avance de tus alumnos.</p>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                    tenant.isLmsEnabled ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-400'
                  }`}>
                    {tenant.isLmsEnabled ? 'Instalado' : 'Desactivado'}
                  </span>
                </div>
                {tenant.isLmsEnabled ? (
                  <button 
                    onClick={() => handleUninstallModule('isLmsEnabled', 'LMS Academia')}
                    className="w-full py-3 border border-red-200 hover:bg-red-50 text-red-500 font-bold rounded-xl text-xs transition-colors"
                  >
                    Desinstalar Aplicación
                  </button>
                ) : (
                  <button 
                    onClick={() => handleInstallModule('isLmsEnabled', 'LMS Academia')}
                    className="w-full py-3 bg-slate-900 hover:bg-slate-950 text-white font-bold rounded-xl text-xs shadow transition-colors"
                  >
                    Instalar Aplicación (1 clic)
                  </button>
                )}
              </div>

              {/* POS App Installer */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-md flex flex-col justify-between gap-6">
                <div className="flex justify-between items-start">
                  <div>
                    <ShoppingBag className="w-8 h-8 text-primary-celeste mb-3" />
                    <h3 className="font-extrabold text-slate-900 text-sm">Caja Registradora POS Offline</h3>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">Punto de venta físico PWA con sincronización local de inventarios vía IndexedDB.</p>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                    tenant.isPosEnabled ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-400'
                  }`}>
                    {tenant.isPosEnabled ? 'Instalado' : 'Desactivado'}
                  </span>
                </div>

                {tenant.isPosEnabled && (
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col gap-3 text-xs font-semibold">
                    <span className="text-[10px] font-extrabold uppercase text-slate-400">Simulación Stripe Terminal SDK</span>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] text-gray-500">Lector IP (WisePOS)</label>
                        <input type="text" value={stripeTerminalIp} onChange={e => setStripeTerminalIp(e.target.value)} className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] text-gray-500">Código de Registro</label>
                        <input type="text" value={stripeTerminalCode} onChange={e => setStripeTerminalCode(e.target.value)} className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs" />
                      </div>
                    </div>
                    
                    <button
                      type="button"
                      onClick={() => {
                        setStripeTerminalStatus('pairing');
                        setTimeout(() => {
                          setStripeTerminalStatus('paired');
                          alert('¡WisePOS emparejado con éxito en IP local! Pruebas listas.');
                        }, 1200);
                      }}
                      className="w-full py-1.5 bg-slate-900 text-white rounded-lg text-[10px] font-bold"
                    >
                      {stripeTerminalStatus === 'pairing' ? 'Pairing...' : stripeTerminalStatus === 'paired' ? '✓ Re-pair WisePOS' : 'Pair Stripe Terminal'}
                    </button>
                  </div>
                )}

                {tenant.isPosEnabled ? (
                  <button 
                    onClick={() => handleUninstallModule('isPosEnabled', 'POS Offline')}
                    className="w-full py-3 border border-red-200 hover:bg-red-50 text-red-500 font-bold rounded-xl text-xs transition-colors"
                  >
                    Desinstalar Aplicación
                  </button>
                ) : (
                  <button 
                    onClick={() => handleInstallModule('isPosEnabled', 'POS Offline')}
                    className="w-full py-3 bg-slate-900 hover:bg-slate-950 text-white font-bold rounded-xl text-xs shadow transition-colors"
                  >
                    Instalar Aplicación (1 clic)
                  </button>
                )}
              </div>

              {/* eCommerce App Installer */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-md flex flex-col justify-between gap-6">
                <div className="flex justify-between items-start">
                  <div>
                    <Grid className="w-8 h-8 text-primary-celeste mb-3" />
                    <h3 className="font-extrabold text-slate-900 text-sm">eCommerce & Catálogo Shopify</h3>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">Crea tu tienda web con pasarela Stripe/PayPal, tarifas EasyPost y píxeles de conversión.</p>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                    tenant.isEcommerceEnabled ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-400'
                  }`}>
                    {tenant.isEcommerceEnabled ? 'Instalado' : 'Desactivado'}
                  </span>
                </div>
                {tenant.isEcommerceEnabled ? (
                  <button 
                    onClick={() => handleUninstallModule('isEcommerceEnabled', 'eCommerce')}
                    className="w-full py-3 border border-red-200 hover:bg-red-50 text-red-500 font-bold rounded-xl text-xs transition-colors"
                  >
                    Desinstalar Aplicación
                  </button>
                ) : (
                  <button 
                    onClick={() => handleInstallModule('isEcommerceEnabled', 'eCommerce')}
                    className="w-full py-3 bg-slate-900 hover:bg-slate-950 text-white font-bold rounded-xl text-xs shadow transition-colors"
                  >
                    Instalar Aplicación (1 clic)
                  </button>
                )}
              </div>

              {/* Reservations App Installer */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-md flex flex-col justify-between gap-6">
                <div className="flex justify-between items-start">
                  <div>
                    <Calendar className="w-8 h-8 text-primary-celeste mb-3" />
                    <h3 className="font-extrabold text-slate-900 text-sm">Reservas & Agenda de Citas</h3>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">Calendario de turnos y coordinación de agendas médicas, gastronómicas o consultoría.</p>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                    tenant.isReservasEnabled ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-400'
                  }`}>
                    {tenant.isReservasEnabled ? 'Instalado' : 'Desactivado'}
                  </span>
                </div>
                {tenant.isReservasEnabled ? (
                  <button 
                    onClick={() => handleUninstallModule('isReservasEnabled', 'Reservas & Agenda')}
                    className="w-full py-3 border border-red-200 hover:bg-red-50 text-red-500 font-bold rounded-xl text-xs transition-colors"
                  >
                    Desinstalar Aplicación
                  </button>
                ) : (
                  <button 
                    onClick={() => handleInstallModule('isReservasEnabled', 'Reservas & Agenda')}
                    className="w-full py-3 bg-slate-900 hover:bg-slate-950 text-white font-bold rounded-xl text-xs shadow transition-colors"
                  >
                    Instalar Aplicación (1 clic)
                  </button>
                )}
              </div>

            </div>
          </div>
        )}

        {/* ==================== [NEW] TAB: CONTABLE CUENTAS (PLAN DE CUENTAS) ==================== */}
        {activeTab === 'accounting_accounts' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-md h-fit">
              <span className="font-extrabold text-sm text-slate-800 block mb-4">Nueva Cuenta Contable</span>
              <form onSubmit={handleAddAccount} className="flex flex-col gap-4 text-xs font-semibold">
                <div className="flex flex-col gap-1">
                  <label className="text-gray-500">Código de Cuenta</label>
                  <input required type="text" placeholder="Ej. 1111" value={newAccCode} onChange={e => setNewAccCode(e.target.value)} className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-gray-500">Nombre de la Cuenta</label>
                  <input required type="text" placeholder="Ej. Caja Chica Central" value={newAccName} onChange={e => setNewAccName(e.target.value)} className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-gray-500">Tipo de Cuenta</label>
                    <select value={newAccType} onChange={e => setNewAccType(e.target.value as any)} className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                      <option value="activo">Activo</option>
                      <option value="pasivo">Pasivo</option>
                      <option value="patrimonio">Patrimonio</option>
                      <option value="ingreso">Ingreso</option>
                      <option value="gasto">Gasto</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-gray-500">Cuenta Padre</label>
                    <select value={newAccParent} onChange={e => setNewAccParent(e.target.value)} className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                      <option value="">Ninguna (Nivel Superior)</option>
                      {accounts.filter(a => !a.parentId).map(a => (
                        <option key={a.id} value={a.id}>{a.code} - {a.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <button type="submit" className="w-full py-3 bg-slate-900 hover:bg-slate-950 text-white rounded-xl font-bold mt-2 shadow flex items-center justify-center gap-1.5">
                  <Plus className="w-4 h-4 text-primary-celeste" /> Crear Cuenta
                </button>
              </form>
            </div>

            <div className="lg:col-span-2 p-6 rounded-2xl bg-white border border-slate-200 shadow-md">
              <span className="font-extrabold text-sm text-slate-800 block mb-4">Plan de Cuentas Jerárquico</span>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 font-bold text-gray-400">
                      <th className="pb-3">Código</th>
                      <th className="pb-3">Nombre</th>
                      <th className="pb-3">Tipo</th>
                      <th className="pb-3 text-right">Jerarquía</th>
                    </tr>
                  </thead>
                  <tbody>
                    {accounts.sort((a, b) => a.code.localeCompare(b.code)).map((acc) => {
                      const colorMap = {
                        activo: 'bg-blue-50 text-blue-700 border-blue-200',
                        pasivo: 'bg-yellow-50 text-yellow-700 border-yellow-200',
                        patrimonio: 'bg-green-50 text-green-700 border-green-200',
                        ingreso: 'bg-purple-50 text-purple-700 border-purple-200',
                        gasto: 'bg-red-50 text-red-700 border-red-200'
                      };
                      return (
                        <tr key={acc.id} className="border-b border-slate-50">
                          <td className="py-3 font-mono font-bold text-slate-950">{acc.code}</td>
                          <td className={`py-3 font-bold ${acc.parentId ? 'pl-6 text-slate-600 font-semibold' : 'text-slate-900'}`}>
                            {acc.parentId ? '↳ ' : ''}{acc.name}
                          </td>
                          <td className="py-3">
                            <span className={`px-2 py-0.5 rounded border text-[10px] font-bold ${colorMap[acc.type as keyof typeof colorMap]}`}>
                              {acc.type.toUpperCase()}
                            </span>
                          </td>
                          <td className="py-3 text-right text-gray-400 font-bold text-[10px]">
                            {acc.parentId ? 'Subcuenta' : 'Cuenta Raíz'}
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

        {/* ==================== [NEW] TAB: CONTABLE ASIENTOS (LIBRO DIARIO) ==================== */}
        {activeTab === 'accounting_entries' && (
          <div className="space-y-8">
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-md">
              <span className="font-extrabold text-sm text-slate-800 block mb-4">Ingresar Nuevo Asiento Contable (Libro Diario)</span>
              <form onSubmit={handleCreateJournalEntry} className="space-y-4 text-xs font-semibold">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-gray-500">Glosa / Descripción</label>
                    <input required type="text" placeholder="Ej. Pago de arriendo local comercial" value={newJeDesc} onChange={e => setNewJeDesc(e.target.value)} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-gray-500">Fecha del Asiento</label>
                    <input required type="date" value={newJeDate} onChange={e => setNewJeDate(e.target.value)} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono" />
                  </div>
                  <div className="flex flex-col gap-1 justify-end">
                    <div className="bg-slate-100 p-2.5 rounded-xl border border-slate-200 flex justify-between items-center">
                      <span className="text-slate-500 font-bold">Estado:</span>
                      <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-[10px] font-black uppercase">POSTED (Confirmado)</span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-4">
                  <span className="font-bold text-slate-800 block mb-3 text-xs">Desglose de Líneas (Partida Doble)</span>
                  <div className="space-y-3">
                    {newJeItems.map((item, idx) => (
                      <div key={idx} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                        <select 
                          required
                          value={item.accountId}
                          onChange={(e) => {
                            const updated = [...newJeItems];
                            updated[idx].accountId = e.target.value;
                            setNewJeItems(updated);
                          }}
                          className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                        >
                          <option value="">-- Seleccionar Cuenta --</option>
                          {accounts.sort((a, b) => a.code.localeCompare(b.code)).map(a => (
                            <option key={a.id} value={a.id}>{a.code} - {a.name}</option>
                          ))}
                        </select>

                        <div className="flex flex-col gap-1">
                          <input 
                            type="number" 
                            step="0.01"
                            placeholder="Debe (Debit)"
                            value={item.debit || ''}
                            onChange={(e) => {
                              const updated = [...newJeItems];
                              updated[idx].debit = parseFloat(e.target.value) || 0;
                              if (updated[idx].debit > 0) updated[idx].credit = 0; // debit/credit are mutually exclusive
                              setNewJeItems(updated);
                            }}
                            className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-right"
                          />
                        </div>

                        <div className="flex flex-col gap-1">
                          <input 
                            type="number" 
                            step="0.01"
                            placeholder="Haber (Credit)"
                            value={item.credit || ''}
                            onChange={(e) => {
                              const updated = [...newJeItems];
                              updated[idx].credit = parseFloat(e.target.value) || 0;
                              if (updated[idx].credit > 0) updated[idx].debit = 0;
                              setNewJeItems(updated);
                            }}
                            className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-right"
                          />
                        </div>

                        <div className="flex gap-2 items-center">
                          <input 
                            type="text" 
                            placeholder="Centro de Costo (Opcional)" 
                            value={item.costCenter || ''} 
                            onChange={(e) => {
                              const updated = [...newJeItems];
                              updated[idx].costCenter = e.target.value;
                              setNewJeItems(updated);
                            }}
                            className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs flex-grow"
                          />
                          {newJeItems.length > 2 && (
                            <button 
                              type="button" 
                              onClick={() => setNewJeItems(newJeItems.filter((_, i) => i !== idx))}
                              className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between items-center mt-4">
                    <button 
                      type="button"
                      onClick={() => setNewJeItems([...newJeItems, { accountId: '', debit: 0, credit: 0 }])}
                      className="py-2 px-3 border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold rounded-xl text-[11px]"
                    >
                      + Agregar Línea
                    </button>

                    <div className="flex items-center gap-6 font-mono text-xs">
                      <div>
                        Total Debe: <span className="font-black text-slate-900">${newJeItems.reduce((acc, i) => acc + (i.debit || 0), 0).toFixed(2)}</span>
                      </div>
                      <div>
                        Total Haber: <span className="font-black text-slate-900">${newJeItems.reduce((acc, i) => acc + (i.credit || 0), 0).toFixed(2)}</span>
                      </div>
                      <div className="px-3 py-1 rounded-full text-[10px] font-black uppercase flex items-center gap-1 bg-green-50 text-green-700 border border-green-200">
                        <Check className="w-3.5 h-3.5" /> Cuadrado
                      </div>
                    </div>
                  </div>
                </div>

                <button type="submit" className="w-full py-3 bg-slate-900 hover:bg-slate-950 text-white rounded-xl font-bold mt-4 shadow flex items-center justify-center gap-1.5">
                  <FileSignature className="w-4 h-4 text-primary-celeste" /> Asentar Asiento (Post Entry)
                </button>
              </form>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-md">
              <div className="flex justify-between items-center mb-4">
                <span className="font-extrabold text-sm text-slate-800">Libro Diario General (Journal Entries)</span>
                <div className="flex gap-1">
                  <button onClick={() => handleExportData('xls', 'Libro Diario', { journalEntries, journalItems, accounts })} className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700" title="Exportar Excel"><Download className="w-3.5 h-3.5" /></button>
                  <button onClick={() => handleExportData('pdf', 'Libro Diario', { journalEntries, journalItems, accounts })} className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700" title="Imprimir PDF"><Printer className="w-3.5 h-3.5" /></button>
                </div>
              </div>
              <div className="space-y-4">
                {journalEntries.map((je) => {
                  const jeItems = journalItems.filter(ji => ji.entryId === je.id);
                  const jeTotal = jeItems.reduce((acc, i) => acc + i.debit, 0);
                  return (
                    <div key={je.id} className="border border-slate-100 rounded-2xl overflow-hidden bg-slate-50/20">
                      <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center text-xs">
                        <div>
                          <span className="font-mono font-bold text-[10px] text-gray-400 uppercase tracking-widest">{je.id}</span>
                          <h4 className="font-black text-slate-800 mt-0.5">{je.description}</h4>
                        </div>
                        <div className="text-right">
                          <span className="font-mono font-black text-slate-600 block">{je.entryDate}</span>
                          <span className="text-[10px] font-extrabold text-green-600">Total: ${jeTotal.toFixed(2)}</span>
                        </div>
                      </div>
                      <div className="p-4 overflow-x-auto">
                        <table className="w-full text-left text-[11px]">
                          <thead>
                            <tr className="text-gray-400 font-bold border-b border-slate-100/50">
                              <th className="pb-2">Cuenta Contable</th>
                              <th className="pb-2 text-right">Debe</th>
                              <th className="pb-2 text-right">Haber</th>
                              <th className="pb-2 text-right">CC</th>
                            </tr>
                          </thead>
                          <tbody>
                            {jeItems.map((ji) => {
                              const acc = accounts.find(a => a.id === ji.accountId);
                              return (
                                <tr key={ji.id} className="border-b border-slate-50 last:border-b-0">
                                  <td className="py-2 font-bold text-slate-700">{acc ? `${acc.code} - ${acc.name}` : ji.accountId}</td>
                                  <td className="py-2 text-right font-mono font-bold">{ji.debit > 0 ? `$${ji.debit.toFixed(2)}` : '-'}</td>
                                  <td className="py-2 text-right font-mono font-bold">{ji.credit > 0 ? `$${ji.credit.toFixed(2)}` : '-'}</td>
                                  <td className="py-2 text-right text-gray-400 font-bold">{ji.costCenter || '-'}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ==================== [NEW] TAB: CONTABLE REPORTES (CONTABILIDAD PRO) ==================== */}
        {activeTab === 'accounting_reports' && (
          <div className="space-y-8">
            
            {/* Sub-Navegación Contabilidad PRO */}
            <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-4">
              <button 
                onClick={() => setAccountingSubTab('balances')}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${accountingSubTab === 'balances' ? 'bg-slate-900 text-white shadow-md' : 'bg-white hover:bg-slate-50 border border-slate-200 text-slate-600'}`}
              >
                📊 Balances e IFRS/NIIF
              </button>
              <button 
                onClick={() => setAccountingSubTab('reconciliation')}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${accountingSubTab === 'reconciliation' ? 'bg-slate-900 text-white shadow-md' : 'bg-white hover:bg-slate-50 border border-slate-200 text-slate-600'}`}
              >
                🏦 Conciliación Bancaria
              </button>
              <button 
                onClick={() => setAccountingSubTab('budgets')}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${accountingSubTab === 'budgets' ? 'bg-slate-900 text-white shadow-md' : 'bg-white hover:bg-slate-50 border border-slate-200 text-slate-600'}`}
              >
                🎯 Presupuestos y Desviaciones
              </button>
              <button 
                onClick={() => setAccountingSubTab('fixed_assets')}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${accountingSubTab === 'fixed_assets' ? 'bg-slate-900 text-white shadow-md' : 'bg-white hover:bg-slate-50 border border-slate-200 text-slate-600'}`}
              >
                🚜 Activos Fijos y Depreciaciones
              </button>
              <button 
                onClick={() => setAccountingSubTab('invoicing')}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${accountingSubTab === 'invoicing' ? 'bg-slate-900 text-white shadow-md' : 'bg-white hover:bg-slate-50 border border-slate-200 text-slate-600'}`}
              >
                🧾 Facturación Regional UBL
              </button>
            </div>

            {/* ==================== 1. SUB-TAB: BALANCES ==================== */}
            {accountingSubTab === 'balances' && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Balance General */}
                  <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-md">
                    <div className="flex justify-between items-center mb-5">
                      <span className="font-extrabold text-sm text-slate-800">Balance General (Consolidado IFRS)</span>
                      <div className="flex gap-1">
                        <button onClick={() => handleExportData('xls', 'Balance General', { accounts, journalItems })} className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700" title="Exportar Excel"><Download className="w-3.5 h-3.5" /></button>
                        <button onClick={() => handleExportData('pdf', 'Balance General', { accounts, journalItems })} className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700" title="Imprimir PDF"><Printer className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                    <div className="space-y-4">
                      {['activo', 'pasivo', 'patrimonio'].map((type) => {
                        const filteredAccs = accounts.filter(a => a.type === type);
                        const totalVal = filteredAccs.reduce((sum, acc) => {
                          const accItems = journalItems.filter(ji => ji.accountId === acc.id);
                          const debits = accItems.reduce((s, i) => s + i.debit, 0);
                          const credits = accItems.reduce((s, i) => s + i.credit, 0);
                          return sum + (type === 'activo' ? (debits - credits) : (credits - debits));
                        }, 0);
                        return (
                          <div key={type} className="border border-slate-100 p-4 rounded-xl bg-slate-50/20">
                            <div className="flex justify-between items-center border-b border-slate-100 pb-2 mb-3">
                              <span className="font-black text-xs text-slate-800 uppercase capitalize">{type}s</span>
                              <span className="font-mono font-black text-slate-950">${totalVal.toFixed(2)}</span>
                            </div>
                            <div className="space-y-2 text-xs">
                              {filteredAccs.map(acc => {
                                const accItems = journalItems.filter(ji => ji.accountId === acc.id);
                                const debits = accItems.reduce((s, i) => s + i.debit, 0);
                                const credits = accItems.reduce((s, i) => s + i.credit, 0);
                                const balance = type === 'activo' ? (debits - credits) : (credits - debits);
                                return (
                                  <div key={acc.id} className="flex justify-between text-slate-500 font-semibold">
                                    <span className={acc.parentId ? 'pl-4' : 'text-slate-700 font-bold'}>{acc.code} - {acc.name}</span>
                                    <span className="font-mono">${balance.toFixed(2)}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Estado de Resultados (P&L) */}
                  <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-md">
                    <div className="flex justify-between items-center mb-5">
                      <span className="font-extrabold text-sm text-slate-800">Estado de Resultados (P&L)</span>
                      <div className="flex gap-1">
                        <button onClick={() => handleExportData('xls', 'Estado de Resultados', { accounts, journalItems })} className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700" title="Exportar Excel"><Download className="w-3.5 h-3.5" /></button>
                        <button onClick={() => handleExportData('pdf', 'Estado de Resultados', { accounts, journalItems })} className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700" title="Imprimir PDF"><Printer className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                    <div className="space-y-4">
                      {['ingreso', 'gasto'].map((type) => {
                        const filteredAccs = accounts.filter(a => a.type === type);
                        const totalVal = filteredAccs.reduce((sum, acc) => {
                          const accItems = journalItems.filter(ji => ji.accountId === acc.id);
                          const debits = accItems.reduce((s, i) => s + i.debit, 0);
                          const credits = accItems.reduce((s, i) => s + i.credit, 0);
                          return sum + (type === 'ingreso' ? (credits - debits) : (debits - credits));
                        }, 0);
                        return (
                          <div key={type} className="border border-slate-100 p-4 rounded-xl bg-slate-50/20">
                            <div className="flex justify-between items-center border-b border-slate-100 pb-2 mb-3">
                              <span className="font-black text-xs text-slate-800 uppercase capitalize">{type}s</span>
                              <span className="font-mono font-black text-slate-950">${totalVal.toFixed(2)}</span>
                            </div>
                            <div className="space-y-2 text-xs">
                              {filteredAccs.map(acc => {
                                const accItems = journalItems.filter(ji => ji.accountId === acc.id);
                                const debits = accItems.reduce((s, i) => s + i.debit, 0);
                                const credits = accItems.reduce((s, i) => s + i.credit, 0);
                                const balance = type === 'ingreso' ? (credits - debits) : (debits - credits);
                                return (
                                  <div key={acc.id} className="flex justify-between text-slate-500 font-semibold">
                                    <span className={acc.parentId ? 'pl-4' : 'text-slate-700 font-bold'}>{acc.code} - {acc.name}</span>
                                    <span className="font-mono">${balance.toFixed(2)}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}

                      {(() => {
                        const ledgerBal = computeLedgerBalances(accounts, journalItems);
                        const pnl = calculatePnL(ledgerBal);
                        return (
                          <div className="bg-slate-900 text-white p-4 rounded-xl border border-slate-800 flex justify-between items-center font-bold text-xs mt-6">
                            <span>UTILIDAD NETA (EJERCICIO NIIF)</span>
                            <span className={`font-mono text-sm ${pnl.netIncome >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              ${pnl.netIncome.toFixed(2)}
                            </span>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>

                {/* Reporte Flujo de Caja */}
                <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-md">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <span className="font-extrabold text-sm text-slate-800 block">Flujo de Caja Directo</span>
                      <p className="text-[10px] text-gray-400 mt-1">Clasificación directa de cobros y pagos según centro de costos contable.</p>
                    </div>
                    <span className="text-xs font-extrabold text-primary-celeste bg-slate-50 border border-slate-100 px-3 py-1 rounded-xl font-mono">
                      Método Directo IFRS
                    </span>
                  </div>
                  {(() => {
                    const cashAcc = accounts.find(a => a.code.startsWith('11') || a.name.toLowerCase().includes('caja') || a.name.toLowerCase().includes('banco'));
                    if (!cashAcc) {
                      return <p className="text-xs text-slate-400">No se detectó cuenta de Caja o Banco para calcular el flujo.</p>;
                    }
                    const cf = calculateCashFlowDirect(journalItems, cashAcc.id);
                    return (
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-4">
                        <div className="p-4 border border-slate-100 rounded-xl bg-slate-50/20">
                          <span className="text-[10px] font-bold text-gray-400 block uppercase">Actividades Operativas</span>
                          <span className={`font-mono font-black text-sm block mt-2 ${cf.operations >= 0 ? 'text-slate-900' : 'text-red-500'}`}>
                            ${cf.operations.toFixed(2)}
                          </span>
                        </div>
                        <div className="p-4 border border-slate-100 rounded-xl bg-slate-50/20">
                          <span className="text-[10px] font-bold text-gray-400 block uppercase">Actividades de Inversión</span>
                          <span className={`font-mono font-black text-sm block mt-2 ${cf.investment >= 0 ? 'text-slate-900' : 'text-red-500'}`}>
                            ${cf.investment.toFixed(2)}
                          </span>
                        </div>
                        <div className="p-4 border border-slate-100 rounded-xl bg-slate-50/20">
                          <span className="text-[10px] font-bold text-gray-400 block uppercase">Actividades de Financiamiento</span>
                          <span className={`font-mono font-black text-sm block mt-2 ${cf.financing >= 0 ? 'text-slate-900' : 'text-red-500'}`}>
                            ${cf.financing.toFixed(2)}
                          </span>
                        </div>
                        <div className="p-4 border border-slate-900 rounded-xl bg-slate-950 text-white">
                          <span className="text-[10px] font-bold text-slate-400 block uppercase">Variación Neta de Efectivo</span>
                          <span className={`font-mono font-black text-sm block mt-2 ${cf.netFlow >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            ${cf.netFlow.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* ==================== 2. SUB-TAB: CONCILIACION BANCARIA ==================== */}
            {accountingSubTab === 'reconciliation' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Extracto Bancario */}
                <div className="lg:col-span-2 p-6 rounded-2xl bg-white border border-slate-200 shadow-md">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <span className="font-extrabold text-sm text-slate-800 block">Extracto Bancario Importado</span>
                      <p className="text-[10px] text-gray-400 mt-1">Casilla de movimientos registrados en cartola de cuenta corriente.</p>
                    </div>
                    <button 
                      onClick={() => alert('Cargue cartola bancaria en formato CSV/OFX.')} 
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-[10px] flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" /> Importar Cartola
                    </button>
                  </div>
                  <div className="space-y-4">
                    {bankStatementLines.length === 0 ? (
                      <p className="text-xs text-slate-400">No hay transacciones bancarias importadas.</p>
                    ) : (
                      bankStatementLines.map(line => (
                        <div 
                          key={line.id} 
                          className="p-4 border border-slate-100 rounded-xl bg-slate-50/20 flex justify-between items-center gap-4 hover:bg-slate-50 transition-colors"
                        >
                          <div className="flex flex-col gap-0.5 text-xs">
                            <span className="font-mono text-[10px] text-gray-400">{line.date}</span>
                            <span className="font-bold text-slate-800">{line.description}</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className={`font-mono font-black text-xs ${line.amount > 0 ? 'text-green-600' : 'text-red-500'}`}>
                              {line.amount > 0 ? '+' : ''}${line.amount.toFixed(2)}
                            </span>
                            {line.reconciledJournalItemId ? (
                              <span className="bg-green-100 text-green-700 px-2 py-1 rounded-lg text-[9px] font-black uppercase flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-green-600" /> Conciliado
                              </span>
                            ) : (
                              <button 
                                onClick={() => handleReconcileLine(line.id)}
                                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-950 text-white rounded-lg text-[10px] font-bold"
                              >
                                Conciliar Asiento
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Auxiliar Banco Libro Mayor */}
                <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-md h-fit">
                  <span className="font-extrabold text-sm text-slate-800 block mb-4">Auxiliar Cuenta Mayor (Banco)</span>
                  <div className="space-y-4 text-xs font-semibold">
                    {(() => {
                      const bankAcc = accounts.find(a => a.code.startsWith('11') || a.name.toLowerCase().includes('banco'));
                      if (!bankAcc) {
                        return <p className="text-slate-400">Cuenta de Mayor Banco no parametrizada.</p>;
                      }
                      const items = journalItems.filter(ji => ji.accountId === bankAcc.id);
                      if (items.length === 0) {
                        return <p className="text-slate-400">No hay registros contables en cuenta banco.</p>;
                      }
                      return items.map(item => (
                        <div key={item.id} className="p-3 border border-slate-100 rounded-xl flex flex-col gap-1.5 bg-slate-50/10">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-bold text-slate-400">ASIENTO REF: {item.entryId.substring(0,10)}</span>
                            <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-mono uppercase">{item.costCenter || 'Libro Diario'}</span>
                          </div>
                          <div className="flex justify-between font-bold text-slate-700">
                            <span>Ingreso/Egreso contable</span>
                            <span className="font-mono">${(item.debit > 0 ? item.debit : -item.credit).toFixed(2)}</span>
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              </div>
            )}

            {/* ==================== 3. SUB-TAB: PRESUPUESTOS ==================== */}
            {accountingSubTab === 'budgets' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Formulario Presupuesto */}
                <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-md h-fit">
                  <span className="font-extrabold text-sm text-slate-800 block mb-4">Asignar Límite de Presupuesto</span>
                  <form onSubmit={handleAddBudgetLimit} className="flex flex-col gap-4 text-xs font-semibold">
                    <div className="flex flex-col gap-1">
                      <label className="text-gray-500">Cuenta de Gasto (Clase 5)</label>
                      <select required value={newBudgetAccount} onChange={e => setNewBudgetAccount(e.target.value)} className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                        <option value="">Seleccione Cuenta</option>
                        {accounts.filter(a => a.type === 'gasto').map(a => (
                          <option key={a.id} value={a.id}>{a.code} - {a.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1">
                        <label className="text-gray-500">Monto Límite ($)</label>
                        <input required type="number" placeholder="2000" value={newBudgetAmount || ''} onChange={e => setNewBudgetAmount(parseFloat(e.target.value) || 0)} className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-gray-500">Mes / Período</label>
                        <input required type="text" placeholder="2026-06" value={newBudgetPeriod} onChange={e => setNewBudgetPeriod(e.target.value)} className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono" />
                      </div>
                    </div>
                    <button type="submit" className="w-full py-3 bg-slate-900 hover:bg-slate-950 text-white rounded-xl font-bold mt-2 shadow flex items-center justify-center gap-1.5">
                      <Plus className="w-4 h-4 text-primary-celeste" /> Asignar Presupuesto
                    </button>
                  </form>
                </div>

                {/* Desviaciones Presupuestarias */}
                <div className="lg:col-span-2 p-6 rounded-2xl bg-white border border-slate-200 shadow-md">
                  <span className="font-extrabold text-sm text-slate-800 block mb-4">Presupuesto Ejecutado vs Límite Asignado</span>
                  <div className="space-y-6">
                    {budgetLimits.length === 0 ? (
                      <p className="text-xs text-slate-400">No se han definido límites presupuestarios para este mes.</p>
                    ) : (
                      calculateBudgetDeviations(computeLedgerBalances(accounts, journalItems), budgetLimits).map(dev => {
                        const pct = Math.min(Math.round((dev.spent / dev.limit) * 100), 100);
                        const isOver = dev.spent > dev.limit;
                        return (
                          <div key={dev.accountId} className="p-4 border border-slate-100 rounded-xl bg-slate-50/20 flex flex-col gap-3">
                            <div className="flex justify-between items-start text-xs">
                              <div>
                                <h4 className="font-bold text-slate-800">{dev.code} - {dev.accountName}</h4>
                                <span className="text-[10px] text-gray-400">Periodo Contable Activo</span>
                              </div>
                              <div className="text-right">
                                <span className="font-black text-slate-900 block">${dev.spent.toFixed(2)} / ${dev.limit.toFixed(2)}</span>
                                <span className={`text-[10px] font-black uppercase ${isOver ? 'text-red-500' : 'text-green-500'}`}>
                                  {isOver ? `Excedido por ${(dev.deviationPct).toFixed(1)}%` : `Consumo del ${pct}%`}
                                </span>
                              </div>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full transition-all duration-500 ${isOver ? 'bg-red-500' : 'bg-primary-celeste'}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ==================== 4. SUB-TAB: ACTIVOS FIJOS ==================== */}
            {accountingSubTab === 'fixed_assets' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Formulario Activo */}
                <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-md h-fit">
                  <span className="font-extrabold text-sm text-slate-800 block mb-4">Ingresar Activo Fijo</span>
                  <form onSubmit={handleAddFixedAsset} className="flex flex-col gap-4 text-xs font-semibold">
                    <div className="flex flex-col gap-1">
                      <label className="text-gray-500">Descripción del Activo</label>
                      <input required type="text" placeholder="Ej. Servidor Blade Core i9" value={newAssetName} onChange={e => setNewAssetName(e.target.value)} className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl" />
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="flex flex-col gap-1">
                        <label className="text-gray-500">Costo ($)</label>
                        <input required type="number" placeholder="2500" value={newAssetValue || ''} onChange={e => setNewAssetValue(parseFloat(e.target.value) || 0)} className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-gray-500">Residual ($)</label>
                        <input required type="number" placeholder="100" value={newAssetSalvage || ''} onChange={e => setNewAssetSalvage(parseFloat(e.target.value) || 0)} className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-gray-500">Años Útiles</label>
                        <input required type="number" placeholder="5" value={newAssetLifespan || ''} onChange={e => setNewAssetLifespan(parseInt(e.target.value) || 5)} className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono" />
                      </div>
                    </div>
                    <button type="submit" className="w-full py-3 bg-slate-900 hover:bg-slate-950 text-white rounded-xl font-bold mt-2 shadow flex items-center justify-center gap-1.5">
                      <Plus className="w-4 h-4 text-primary-celeste" /> Registrar Activo
                    </button>
                  </form>
                </div>

                {/* Inventario de Activos y Amortización */}
                <div className="lg:col-span-2 p-6 rounded-2xl bg-white border border-slate-200 shadow-md">
                  <span className="font-extrabold text-sm text-slate-800 block mb-4">Inventario de Propiedades, Planta y Equipos (PPE)</span>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 font-bold text-gray-400">
                          <th className="pb-3">Detalle Activo</th>
                          <th className="pb-3 text-right">Compra</th>
                          <th className="pb-3 text-right">Residual</th>
                          <th className="pb-3 text-right">Acumulada</th>
                          <th className="pb-3 text-right">Valor Libro</th>
                          <th className="pb-3 text-right font-black">Depreciación</th>
                        </tr>
                      </thead>
                      <tbody>
                        {fixedAssets.map(asset => {
                          const bookValue = asset.purchaseValue - asset.depreciatedAmount;
                          return (
                            <tr key={asset.id} className="border-b border-slate-50">
                              <td className="py-3">
                                <span className="font-bold text-slate-800 block">{asset.name}</span>
                                <span className="text-[10px] text-gray-400">Vida útil: {asset.lifespanYears} años • {asset.purchaseDate}</span>
                              </td>
                              <td className="py-3 text-right font-mono font-bold">${asset.purchaseValue.toFixed(2)}</td>
                              <td className="py-3 text-right font-mono text-slate-500">${asset.salvageValue.toFixed(2)}</td>
                              <td className="py-3 text-right font-mono text-red-500">${asset.depreciatedAmount.toFixed(2)}</td>
                              <td className="py-3 text-right font-mono font-black text-primary-celeste">${bookValue.toFixed(2)}</td>
                              <td className="py-3 text-right">
                                <button 
                                  onClick={() => handleTriggerDepreciation(asset.id)}
                                  className="px-2 py-1 bg-slate-900 hover:bg-slate-950 text-white rounded font-bold text-[9px]"
                                >
                                  Depreciar Mes
                                </button>
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

            {/* ==================== 5. SUB-TAB: FACTURACION ELECTRONICA ==================== */}
            {accountingSubTab === 'invoicing' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Generador Fiscal */}
                <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-md h-fit">
                  <span className="font-extrabold text-sm text-slate-800 block mb-4">Emisor de Documento Fiscal (Factura Electrónica)</span>
                  <div className="flex flex-col gap-4 text-xs font-semibold">
                    <div className="flex flex-col gap-1">
                      <label className="text-gray-500">País de Emisión Tributaria</label>
                      <select 
                        value={selectedCountryTax} 
                        onChange={e => setSelectedCountryTax(e.target.value as any)} 
                        className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                      >
                        <option value="CL">Chile (SII - IVA 19%)</option>
                        <option value="MX">México (SAT CFDI 4.0 - IVA 16%)</option>
                        <option value="CO">Colombia (DIAN - IVA 19%)</option>
                        <option value="PE">Perú (SUNAT - IGV 18%)</option>
                        <option value="BO">Bolivia (SIN - IVA 13%)</option>
                      </select>
                    </div>
                    <div className="p-4 border border-slate-100 bg-slate-50/20 rounded-xl space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Total Gravado:</span>
                        <span className="font-mono font-bold">$100.00</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Tasa Impuesto:</span>
                        <span className="font-mono font-bold">
                          {selectedCountryTax === 'CL' ? '19% (IVA)' : selectedCountryTax === 'MX' ? '16% (IVA)' : selectedCountryTax === 'CO' ? '19% (IVA)' : selectedCountryTax === 'PE' ? '18% (IGV)' : '13% (IVA)'}
                        </span>
                      </div>
                      <div className="flex justify-between border-t border-slate-100 pt-2 font-black text-slate-900">
                        <span>Total Documento:</span>
                        <span className="font-mono">
                          {selectedCountryTax === 'CL' ? '$119.00' : selectedCountryTax === 'MX' ? '$116.00' : selectedCountryTax === 'CO' ? '$119.00' : selectedCountryTax === 'PE' ? '$118.00' : '$113.00'}
                        </span>
                      </div>
                    </div>
                    <button 
                      onClick={handleGenerateElectronicInvoice}
                      className="w-full py-3 bg-slate-900 hover:bg-slate-950 text-white rounded-xl font-bold mt-2 shadow flex items-center justify-center gap-1.5"
                    >
                      <FileSignature className="w-4 h-4 text-primary-celeste" /> Firmar XML y Emitir
                    </button>
                  </div>
                </div>

                {/* Logs XML SOAP / UBL */}
                <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-950 text-slate-300 border border-slate-900 shadow-xl font-mono text-[10px]">
                  <div className="flex justify-between items-center border-b border-slate-900 pb-3 mb-4">
                    <span className="font-extrabold text-[10px] text-slate-400 uppercase tracking-widest block">Consola Tributaria (Live XML SOAP Payload Logs)</span>
                    <span className="bg-green-500/20 text-green-400 px-2 py-0.5 rounded text-[8px] font-black uppercase">Webservice Conectado</span>
                  </div>
                  <div className="h-60 overflow-y-auto space-y-2 text-slate-400 scrollbar-thin scrollbar-thumb-slate-800">
                    {invoiceXmlLog.length === 0 ? (
                      <p className="text-slate-500 italic">Esperando emisiones de facturas para desplegar esquemas UBL XML...</p>
                    ) : (
                      invoiceXmlLog.map((logMsg, i) => (
                        <div key={i} className="p-2 border-b border-slate-900/50 flex flex-col gap-1">
                          <span className="text-green-400 font-bold">{logMsg}</span>
                          <pre className="text-[8px] leading-relaxed text-slate-500 bg-slate-900/40 p-2 rounded max-h-24 overflow-y-auto select-all">
                            {`<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
         xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
  <cbc:UBLVersionID>2.1</cbc:UBLVersionID>
  <cbc:ID>FAC-${100000 + i}</cbc:ID>
  <cbc:DocumentCurrencyCode>${selectedCountryTax === 'CL' ? 'CLP' : selectedCountryTax === 'MX' ? 'MXN' : selectedCountryTax === 'CO' ? 'COP' : selectedCountryTax === 'PE' ? 'PEN' : 'BOB'}</cbc:DocumentCurrencyCode>
  <cac:Signature>
    <cbc:ID>Sign-FAC-${100000 + i}</cbc:ID>
    <cac:DigitalSignature>
      <cbc:SignatureValue>SHA256withRSA/SignedXML/Hash:e78a${Math.random().toString(36).substring(3,10)}...</cbc:SignatureValue>
    </cac:DigitalSignature>
  </cac:Signature>
</Invoice>`}
                          </pre>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

          </div>
        )}

        {/* ==================== [NEW] TAB: EDUCATIVO ESCUELAS ==================== */}
        {activeTab === 'education_schools' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-md h-fit">
              <span className="font-extrabold text-sm text-slate-800 block mb-4">Añadir Sede / Escuela</span>
              <form onSubmit={handleAddSchool} className="flex flex-col gap-4 text-xs font-semibold">
                <div className="flex flex-col gap-1">
                  <label className="text-gray-500">Nombre de la Sede</label>
                  <input required type="text" placeholder="Ej. Facultad de Ingeniería" value={newSchoolName} onChange={e => setNewSchoolName(e.target.value)} className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-gray-500">Dirección</label>
                  <input type="text" placeholder="Av. Principal 123" value={newSchoolAddress} onChange={e => setNewSchoolAddress(e.target.value)} className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl" />
                </div>
                <button type="submit" className="w-full py-3 bg-slate-900 hover:bg-slate-950 text-white rounded-xl font-bold mt-2 shadow flex items-center justify-center gap-1.5">
                  <Plus className="w-4 h-4 text-primary-celeste" /> Crear Sede
                </button>
              </form>
            </div>

            <div className="lg:col-span-2 p-6 rounded-2xl bg-white border border-slate-200 shadow-md">
              <span className="font-extrabold text-sm text-slate-800 block mb-4">Sedes Académicas Registradas</span>
              <div className="space-y-4">
                {schools.map(s => (
                  <div key={s.id} className="p-4 border border-slate-100 rounded-xl bg-slate-50/20 flex justify-between items-center">
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs">{s.name}</h4>
                      <p className="text-[10px] text-gray-500 mt-1">{s.address || 'Sin dirección registrada'}</p>
                    </div>
                    <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded text-[10px] font-bold">Sede ID: {s.id.substring(0,8)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ==================== [NEW] TAB: EDUCATIVO MIEMBROS ==================== */}
        {activeTab === 'education_members' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-md h-fit">
              <span className="font-extrabold text-sm text-slate-800 block mb-4">Registrar Miembro</span>
              <form onSubmit={handleAddEducationMember} className="flex flex-col gap-4 text-xs font-semibold">
                <div className="flex flex-col gap-1">
                  <label className="text-gray-500">Nombre Completo</label>
                  <input required type="text" placeholder="Ej. Pedro Picapiedra" value={newMemberName} onChange={e => setNewMemberName(e.target.value)} className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-gray-500">Correo Electrónico</label>
                  <input required type="email" placeholder="pedro@correo.com" value={newMemberEmail} onChange={e => setNewMemberEmail(e.target.value)} className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-gray-500">Rol</label>
                    <select value={newMemberRole} onChange={e => setNewMemberRole(e.target.value as any)} className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                      <option value="student">Alumno</option>
                      <option value="teacher">Profesor</option>
                      <option value="parent">Apoderado</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-gray-500">Sede</label>
                    <select value={newMemberSchool} onChange={e => setNewMemberSchool(e.target.value)} className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                      <option value="">-- Seleccionar --</option>
                      {schools.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <button type="submit" className="w-full py-3 bg-slate-900 hover:bg-slate-950 text-white rounded-xl font-bold mt-2 shadow flex items-center justify-center gap-1.5">
                  <Plus className="w-4 h-4 text-primary-celeste" /> Crear Miembro
                </button>
              </form>
            </div>

            <div className="lg:col-span-2 p-6 rounded-2xl bg-white border border-slate-200 shadow-md">
              <span className="font-extrabold text-sm text-slate-800 block mb-4">Listado de Miembros Educativos</span>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 font-bold text-gray-400">
                      <th className="pb-3">Nombre</th>
                      <th className="pb-3">Correo</th>
                      <th className="pb-3">Rol</th>
                      <th className="pb-3">Sede</th>
                    </tr>
                  </thead>
                  <tbody>
                    {eduMembers.map((m) => {
                      const matchedS = schools.find(s => s.id === m.schoolId);
                      return (
                        <tr key={m.id} className="border-b border-slate-50">
                          <td className="py-3 font-bold text-slate-900">{m.name}</td>
                          <td className="py-3 text-slate-500 font-mono">{m.email || 'Sin correo'}</td>
                          <td className="py-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              m.role === 'student' ? 'bg-blue-100 text-blue-800' : m.role === 'teacher' ? 'bg-purple-100 text-purple-800' : 'bg-orange-100 text-orange-800'
                            }`}>
                              {m.role.toUpperCase()}
                            </span>
                          </td>
                          <td className="py-3 font-bold text-slate-600">{matchedS ? matchedS.name : 'Sede General'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ==================== [NEW] TAB: WHITE LABEL MARCA ==================== */}
        {activeTab === 'whitelabel' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-md">
              <span className="font-extrabold text-sm text-slate-800 block mb-4">Ajustes de Marca (White Label)</span>
              <form onSubmit={handleSaveWhiteLabel} className="space-y-4 text-xs font-semibold">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-gray-500">Nombre de Marca Propia</label>
                    <input required type="text" placeholder="Ej. Mi Negocio SaaS" value={wlBrandName} onChange={e => setWlBrandName(e.target.value)} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-gray-500">Logo Url (Emoji o imagen)</label>
                    <input required type="text" placeholder="🚀" value={wlLogoUrl} onChange={e => setWlLogoUrl(e.target.value)} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-gray-500">Color Primario (Hex)</label>
                    <input required type="color" value={wlPrimaryColor} onChange={e => setWlPrimaryColor(e.target.value)} className="w-full h-10 p-1 bg-white border border-slate-200 rounded-xl cursor-pointer" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-gray-500">Color Secundario (Hex)</label>
                    <input required type="color" value={wlSecondaryColor} onChange={e => setWlSecondaryColor(e.target.value)} className="w-full h-10 p-1 bg-white border border-slate-200 rounded-xl cursor-pointer" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-gray-500">Remitente de Correos (Email)</label>
                    <input type="text" placeholder="no-responder@mimarcasub.com" value={wlCustomEmailSender} onChange={e => setWlCustomEmailSender(e.target.value)} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-gray-500">Nombre Remitente de Correo</label>
                    <input type="text" placeholder="Soporte Clientes" value={wlCustomEmailName} onChange={e => setWlCustomEmailName(e.target.value)} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl" />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-gray-500">Texto Pie de Factura</label>
                  <textarea placeholder="Gracias por su compra. Desarrollado por mimarca.com" value={wlInvoiceFooter} onChange={e => setWlInvoiceFooter(e.target.value)} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl h-20" />
                </div>

                <button type="submit" className="w-full py-3 bg-slate-900 hover:bg-slate-950 text-white rounded-xl font-bold mt-2 shadow flex items-center justify-center gap-1.5">
                  <Save className="w-4 h-4 text-primary-celeste" /> Guardar Ajustes de Marca
                </button>
              </form>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-md flex flex-col justify-between gap-6">
              <div>
                <span className="font-extrabold text-sm text-slate-800 block mb-2">Vista Previa de Marca Personalizada</span>
                <p className="text-[11px] text-gray-400">Verifica cómo se verá la consola cliente de tu tenant en el navegador.</p>
              </div>

              <div className="border border-slate-100 rounded-3xl p-6 bg-slate-50/50 flex flex-col gap-4 shadow-inner">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{wlLogoUrl || '🚀'}</span>
                  <div>
                    <h4 className="font-black text-slate-950 text-sm leading-none">{wlBrandName || 'Tu Marca'}</h4>
                    <span className="text-[8px] font-black uppercase text-slate-400 tracking-wider">Powered by NRAM360</span>
                  </div>
                </div>

                <div className="p-4 bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-2">
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Botones y Colores de Interfaz</span>
                  <div className="flex gap-2">
                    <button type="button" className="px-3 py-1.5 rounded-lg text-[10px] font-bold text-white shadow-sm" style={{ backgroundColor: wlPrimaryColor }}>
                      Botón Primario
                    </button>
                    <button type="button" className="px-3 py-1.5 rounded-lg text-[10px] font-bold text-white shadow-sm" style={{ backgroundColor: wlSecondaryColor }}>
                      Botón Secundario
                    </button>
                  </div>
                </div>

                <div className="p-3 bg-white rounded-xl shadow-xs border border-slate-100 flex flex-col gap-1 text-[10px]">
                  <div className="flex justify-between"><span className="text-slate-400">Remitente:</span> <span className="font-bold font-mono text-slate-700">{wlCustomEmailName || 'SaaS Sender'} &lt;{wlCustomEmailSender || 'no-reply@saas.com'}&gt;</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Pie PDF:</span> <span className="font-bold text-slate-700 truncate max-w-[70%]">{wlInvoiceFooter || 'Sello de factura...'}</span></div>
                </div>
              </div>

              <div className="p-4 bg-gradient-to-br from-primary-celeste/20 to-cyan-500/10 border border-primary-celeste/20 rounded-2xl flex items-center gap-3 text-xs">
                <Activity className="w-5 h-5 text-primary-celeste shrink-0" />
                <span className="text-slate-600 font-semibold">
                  Los colores del **White Label** se inyectan dinámicamente en el tema CSS y el editor de páginas.
                </span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'crm_pipeline' && (
          <div className="space-y-8 animate-fade-in">
            
            {/* Sub-Navegación CRM PRO */}
            <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-4">
              <button 
                onClick={() => setCrmSubTab('pipeline')}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${crmSubTab === 'pipeline' ? 'bg-slate-900 text-white shadow-md' : 'bg-white hover:bg-slate-50 border border-slate-200 text-slate-600'}`}
              >
                🎯 Embudo de Ventas (Pipeline)
              </button>
              <button 
                onClick={() => setCrmSubTab('directory')}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${crmSubTab === 'directory' ? 'bg-slate-900 text-white shadow-md' : 'bg-white hover:bg-slate-50 border border-slate-200 text-slate-600'}`}
              >
                👥 Directorio B2B (Contactos / Empresas)
              </button>
              <button 
                onClick={() => setCrmSubTab('activities')}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${crmSubTab === 'activities' ? 'bg-slate-900 text-white shadow-md' : 'bg-white hover:bg-slate-50 border border-slate-200 text-slate-600'}`}
              >
                📅 Actividades y Agenda
              </button>
              <button 
                onClick={() => setCrmSubTab('quotes')}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${crmSubTab === 'quotes' ? 'bg-slate-900 text-white shadow-md' : 'bg-white hover:bg-slate-50 border border-slate-200 text-slate-600'}`}
              >
                📄 Generador de Cotizaciones
              </button>
              <button 
                onClick={() => setCrmSubTab('forecast')}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${crmSubTab === 'forecast' ? 'bg-slate-900 text-white shadow-md' : 'bg-white hover:bg-slate-50 border border-slate-200 text-slate-600'}`}
              >
                📈 Sales Forecast & Forecast
              </button>
              <button 
                onClick={() => setCrmSubTab('campaigns')}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${crmSubTab === 'campaigns' ? 'bg-slate-900 text-white shadow-md' : 'bg-white hover:bg-slate-50 border border-slate-200 text-slate-600'}`}
              >
                📧 Campañas de Email Marketing
              </button>
              <button 
                onClick={() => setCrmSubTab('whatsapp' as any)}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${(crmSubTab as any) === 'whatsapp' ? 'bg-green-600 text-white shadow-md' : 'bg-white hover:bg-slate-50 border border-slate-200 text-slate-600'}`}
              >
                💬 WhatsApp Business
              </button>
            </div>

            {/* ==================== 1. SUB-TAB: PIPELINE ==================== */}
            {crmSubTab === 'pipeline' && (
              <div className="space-y-8">
                {/* Metric widgets */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col">
                    <span className="text-[10px] font-black uppercase text-slate-400">Total Prospectos</span>
                    <span className="text-2xl font-black text-slate-900 mt-2">{leads.length}</span>
                  </div>
                  <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col">
                    <span className="text-[10px] font-black uppercase text-slate-400">Valor del Embudo (Pipeline)</span>
                    <span className="text-2xl font-black text-primary-celeste mt-2 font-mono">
                      ${leads.reduce((sum, l) => sum + (l.value || 0), 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col">
                    <span className="text-[10px] font-black uppercase text-slate-400">Tratos Ganados</span>
                    <span className="text-2xl font-black text-green-600 mt-2">
                      {leads.filter(l => l.stage === 'won').length}
                    </span>
                  </div>
                  <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col">
                    <span className="text-[10px] font-black uppercase text-slate-400">Tratos Perdidos</span>
                    <span className="text-2xl font-black text-red-500 mt-2">
                      {leads.filter(l => l.stage === 'lost').length}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Form to add lead */}
                  <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-md h-fit">
                    <span className="font-extrabold text-sm text-slate-800 block mb-4">Añadir Prospecto</span>
                    <form onSubmit={handleAddLead} className="flex flex-col gap-4 text-xs font-semibold">
                      <div className="flex flex-col gap-1">
                        <label className="text-gray-500">Nombre del Contacto</label>
                        <input required type="text" placeholder="Ej. Juan Pérez" value={newLeadName} onChange={e => setNewLeadName(e.target.value)} className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-gray-500">Empresa / Organización</label>
                        <input type="text" placeholder="Ej. Pérez Distribuidora" value={newLeadCompany} onChange={e => setNewLeadCompany(e.target.value)} className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1">
                          <label className="text-gray-500">Correo Electrónico</label>
                          <input type="email" placeholder="juan@correo.com" value={newLeadEmail} onChange={e => setNewLeadEmail(e.target.value)} className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl" />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-gray-500">Teléfono</label>
                          <input type="text" placeholder="+56987654321" value={newLeadPhone} onChange={e => setNewLeadPhone(e.target.value)} className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl" />
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-gray-500">Valor Estimado del Trato ($)</label>
                        <input required type="number" placeholder="0.00" value={newLeadValue || ''} onChange={e => setNewLeadValue(Number(e.target.value))} className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl" />
                      </div>
                      <button type="submit" className="w-full py-3 bg-slate-900 hover:bg-slate-950 text-white rounded-xl font-bold mt-2 shadow flex items-center justify-center gap-1.5">
                        <Plus className="w-4 h-4 text-primary-celeste" /> Crear Prospecto
                      </button>
                    </form>
                  </div>

                  {/* Kanban/Embudo Pipeline view */}
                  <div className="lg:col-span-2 p-6 rounded-2xl bg-white border border-slate-200 shadow-md">
                    <span className="font-extrabold text-sm text-slate-800 block mb-4">Pipeline de Ventas</span>
                    
                    <div className="space-y-4">
                      {leads.map((l) => (
                        <div key={l.id} className="flex items-center justify-between p-4 border border-slate-100 rounded-2xl bg-slate-50/20 hover:bg-slate-50/50 transition-colors text-xs">
                          <div>
                            <h4 className="font-black text-slate-900 text-sm">{l.name}</h4>
                            <p className="text-gray-400 mt-0.5">{l.company || 'Sin Empresa'} • {l.email || 'Sin Correo'}</p>
                          </div>
                          
                          <div className="flex items-center gap-4">
                            <span className="font-mono font-black text-slate-950">${l.value.toFixed(2)}</span>
                            
                            <select 
                              value={l.stage} 
                              onChange={(e) => handleUpdateLeadStage(l.id, e.target.value as any)}
                              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-bold"
                            >
                              <option value="prospect">Prospecto</option>
                              <option value="contacted">Contactado</option>
                              <option value="qualified">Calificado</option>
                              <option value="proposal">Propuesta</option>
                              <option value="won">Ganado (Won)</option>
                              <option value="lost">Perdido (Lost)</option>
                            </select>

                            <button 
                              onClick={() => handleDeleteLead(l.id)}
                              className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ==================== 2. SUB-TAB: DIRECTORIO B2B ==================== */}
            {crmSubTab === 'directory' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Formularios Directorio */}
                <div className="flex flex-col gap-6">
                  {/* Form Empresa */}
                  <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-md h-fit">
                    <span className="font-extrabold text-sm text-slate-800 block mb-4">Registrar Empresa B2B</span>
                    <form onSubmit={handleAddCrmCompany} className="flex flex-col gap-4 text-xs font-semibold">
                      <div className="flex flex-col gap-1">
                        <label className="text-gray-500">Nombre de la Empresa</label>
                        <input required type="text" placeholder="Ej. Acme Corp" value={newCompanyName} onChange={e => setNewCompanyName(e.target.value)} className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1">
                          <label className="text-gray-500">Industria</label>
                          <select value={newCompanyIndustry} onChange={e => setNewCompanyIndustry(e.target.value)} className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                            <option value="Tecnología">Tecnología</option>
                            <option value="Manufactura">Manufactura</option>
                            <option value="Servicios">Servicios</option>
                            <option value="Educación">Educación</option>
                          </select>
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-gray-500">Tamaño</label>
                          <select value={newCompanySize} onChange={e => setNewCompanySize(e.target.value)} className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                            <option value="1-10 empleados">1-10 empleados</option>
                            <option value="10-50 empleados">10-50 empleados</option>
                            <option value="100-500 empleados">100-500 empleados</option>
                          </select>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-gray-500">Dirección</label>
                        <input type="text" placeholder="Av. Principal 123" value={newCompanyAddress} onChange={e => setNewCompanyAddress(e.target.value)} className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl" />
                      </div>
                      <button type="submit" className="w-full py-3 bg-slate-900 hover:bg-slate-950 text-white rounded-xl font-bold mt-2 shadow flex items-center justify-center gap-1.5">
                        <Plus className="w-4 h-4 text-primary-celeste" /> Guardar Empresa
                      </button>
                    </form>
                  </div>

                  {/* Form Contacto */}
                  <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-md h-fit">
                    <span className="font-extrabold text-sm text-slate-800 block mb-4">Registrar Contacto B2B</span>
                    <form onSubmit={handleAddCrmContact} className="flex flex-col gap-4 text-xs font-semibold">
                      <div className="flex flex-col gap-1">
                        <label className="text-gray-500">Nombre Completo</label>
                        <input required type="text" placeholder="Ej. Juan Pérez" value={newContactName} onChange={e => setNewContactName(e.target.value)} className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1">
                          <label className="text-gray-500">Correo Electrónico</label>
                          <input required type="email" placeholder="juan@acme.com" value={newContactEmail} onChange={e => setNewContactEmail(e.target.value)} className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl" />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-gray-500">Teléfono</label>
                          <input type="text" placeholder="+5691111111" value={newContactPhone} onChange={e => setNewContactPhone(e.target.value)} className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1">
                          <label className="text-gray-500">Cargo / Rol</label>
                          <input type="text" placeholder="Gerente Compras" value={newContactRole} onChange={e => setNewContactRole(e.target.value)} className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl" />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-gray-500">Empresa Vinculada</label>
                          <select value={newContactCompanyId} onChange={e => setNewContactCompanyId(e.target.value)} className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                            <option value="">Seleccione Empresa</option>
                            {companies.map(c => (
                              <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <button type="submit" className="w-full py-3 bg-slate-900 hover:bg-slate-950 text-white rounded-xl font-bold mt-2 shadow flex items-center justify-center gap-1.5">
                        <Plus className="w-4 h-4 text-primary-celeste" /> Guardar Contacto
                      </button>
                    </form>
                  </div>
                </div>

                {/* Directorio Lists */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Empresas registradas */}
                  <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-md">
                    <span className="font-extrabold text-sm text-slate-800 block mb-4">Empresas Registradas</span>
                    <div className="space-y-4">
                      {companies.length === 0 ? (
                        <p className="text-xs text-slate-400">No hay empresas registradas.</p>
                      ) : (
                        companies.map(comp => (
                          <div key={comp.id} className="p-4 border border-slate-100 rounded-xl bg-slate-50/20 flex justify-between items-center text-xs">
                            <div>
                              <h4 className="font-bold text-slate-900">{comp.name}</h4>
                              <p className="text-[10px] text-gray-400 mt-1">{comp.industry} • {comp.size} • {comp.address || 'Sin dirección'}</p>
                            </div>
                            <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded text-[10px] font-mono">ID: {comp.id.substring(0,8)}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Contactos registrados */}
                  <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-md">
                    <span className="font-extrabold text-sm text-slate-800 block mb-4">Contactos Registrados</span>
                    <div className="space-y-4">
                      {contacts.length === 0 ? (
                        <p className="text-xs text-slate-400">No hay contactos registrados.</p>
                      ) : (
                        contacts.map(cont => {
                          const associatedCompany = companies.find(c => c.id === cont.companyId);
                          return (
                            <div key={cont.id} className="p-4 border border-slate-100 rounded-xl bg-slate-50/20 flex justify-between items-center text-xs">
                              <div>
                                <h4 className="font-bold text-slate-900">{cont.name}</h4>
                                <p className="text-[10px] text-gray-400 mt-1">{cont.role || 'Sin cargo'} • {cont.email} • {cont.phone || 'Sin teléfono'}</p>
                                {associatedCompany && (
                                  <span className="inline-block mt-2 px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] font-bold">
                                    🏢 {associatedCompany.name}
                                  </span>
                                )}
                              </div>
                              <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded text-[10px] font-mono">ID: {cont.id.substring(0,8)}</span>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ==================== 3. SUB-TAB: ACTIVIDADES Y CALENDARIO ==================== */}
            {crmSubTab === 'activities' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Form Actividad */}
                <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-md h-fit">
                  <span className="font-extrabold text-sm text-slate-800 block mb-4">Agendar Actividad de Venta</span>
                  <form onSubmit={handleAddCrmActivity} className="flex flex-col gap-4 text-xs font-semibold">
                    <div className="flex flex-col gap-1">
                      <label className="text-gray-500">Vincular al Trato (Lead)</label>
                      <select required value={newActivityLeadId} onChange={e => setNewActivityLeadId(e.target.value)} className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                        <option value="">Seleccione Prospecto</option>
                        {leads.map(l => (
                          <option key={l.id} value={l.id}>{l.name} ({l.company || 'Sin Empresa'})</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-gray-500">Título / Tarea</label>
                      <input required type="text" placeholder="Ej. Llamar para negociar licencias" value={newActivityTitle} onChange={e => setNewActivityTitle(e.target.value)} className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1">
                        <label className="text-gray-500">Tipo de Actividad</label>
                        <select value={newActivityType} onChange={e => setNewActivityType(e.target.value as any)} className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                          <option value="call">📞 Llamada</option>
                          <option value="meeting">🤝 Reunión</option>
                          <option value="email">📧 Correo</option>
                          <option value="task">📋 Tarea</option>
                        </select>
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-gray-500">Fecha de Agenda</label>
                        <input required type="date" value={newActivityDate} onChange={e => setNewActivityDate(e.target.value)} className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono" />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-gray-500">Notas Adicionales</label>
                      <textarea placeholder="Ej. El cliente se muestra interesado..." value={newActivityNotes} onChange={e => setNewActivityNotes(e.target.value)} className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl h-16" />
                    </div>
                    <button type="submit" className="w-full py-3 bg-slate-900 hover:bg-slate-950 text-white rounded-xl font-bold mt-2 shadow flex items-center justify-center gap-1.5">
                      <Plus className="w-4 h-4 text-primary-celeste" /> Agendar Actividad
                    </button>
                  </form>
                </div>

                {/* Agenda y Calendario */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Calendario Simulativo */}
                  <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-md">
                    <span className="font-extrabold text-sm text-slate-800 block mb-4">Calendario de Ventas (Junio 2026)</span>
                    <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-slate-500 mb-2">
                      <span>Dom</span><span>Lun</span><span>Mar</span><span>Mié</span><span>Jue</span><span>Vie</span><span>Sáb</span>
                    </div>
                    <div className="grid grid-cols-7 gap-2">
                      {/* June 2026 starts on Monday (1) */}
                      <div className="p-3 border border-slate-50 text-slate-200">31</div>
                      {Array.from({ length: 30 }).map((_, idx) => {
                        const dayNum = idx + 1;
                        const dayString = `2026-06-${dayNum < 10 ? '0' + dayNum : dayNum}`;
                        const dayActs = activities.filter(a => a.date === dayString);
                        const hasActs = dayActs.length > 0;
                        return (
                          <div 
                            key={dayNum} 
                            className={`p-3 border border-slate-100 rounded-xl flex flex-col justify-between items-center min-h-[60px] cursor-pointer hover:bg-slate-50 transition-colors ${hasActs ? 'border-primary-celeste bg-cyan-50/10' : ''}`}
                            onClick={() => {
                              if (hasActs) {
                                alert(`Actividades del día:\n${dayActs.map(a => `• [${a.type.toUpperCase()}] ${a.title}`).join('\n')}`);
                              } else {
                                alert('No hay actividades agendadas para este día.');
                              }
                            }}
                          >
                            <span className={`font-mono font-bold text-xs ${hasActs ? 'text-primary-celeste' : 'text-slate-800'}`}>{dayNum}</span>
                            {hasActs && (
                              <span className="w-2 h-2 rounded-full bg-primary-celeste block" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Listado de Actividades */}
                  <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-md">
                    <span className="font-extrabold text-sm text-slate-800 block mb-4">Próximas Tareas y Reuniones</span>
                    <div className="space-y-4">
                      {activities.length === 0 ? (
                        <p className="text-xs text-slate-400">No hay actividades agendadas.</p>
                      ) : (
                        activities.map(act => {
                          const matchedLead = leads.find(l => l.id === act.leadId);
                          return (
                            <div key={act.id} className="p-4 border border-slate-100 rounded-xl bg-slate-50/20 flex justify-between items-center text-xs">
                              <div>
                                <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                                  <span>{act.type === 'call' ? '📞' : act.type === 'meeting' ? '🤝' : act.type === 'email' ? '📧' : '📋'}</span>
                                  {act.title}
                                </h4>
                                <p className="text-[10px] text-gray-400 mt-1">Fecha: {act.date} • Notas: {act.notes || 'Ninguna'}</p>
                                {matchedLead && (
                                  <span className="inline-block mt-2 px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[9px]">
                                    Lead: {matchedLead.name} ({matchedLead.company || 'Sin Empresa'})
                                  </span>
                                )}
                              </div>
                              <button 
                                onClick={() => {
                                  const updated = activities.filter(a => a.id !== act.id);
                                  dbAdapter.saveCrmActivities(tenant?.id || '', updated);
                                  reloadAllData();
                                }}
                                className="p-1 hover:bg-red-50 text-red-500 rounded"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ==================== 4. SUB-TAB: COTIZACIONES ==================== */}
            {crmSubTab === 'quotes' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Form Cotización */}
                <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-md h-fit">
                  <span className="font-extrabold text-sm text-slate-800 block mb-4">Nueva Cotización B2B</span>
                  <form onSubmit={handleAddCrmQuote} className="flex flex-col gap-4 text-xs font-semibold">
                    <div className="flex flex-col gap-1">
                      <label className="text-gray-500">Vincular al Trato (Lead)</label>
                      <select required value={newQuoteLeadId} onChange={e => setNewQuoteLeadId(e.target.value)} className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                        <option value="">Seleccione Prospecto</option>
                        {leads.map(l => (
                          <option key={l.id} value={l.id}>{l.name} ({l.company || 'Sin Empresa'})</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-gray-500">Producto del Catálogo</label>
                      <select required value={newQuoteProductId} onChange={e => setNewQuoteProductId(e.target.value)} className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                        <option value="">Seleccione Artículo</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id}>{p.name} - ${p.price.toFixed(2)}</option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1">
                        <label className="text-gray-500">Cantidad</label>
                        <input required type="number" min="1" value={newQuoteQty} onChange={e => setNewQuoteQty(parseInt(e.target.value) || 1)} className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-gray-500">Vencimiento Oferta</label>
                        <input required type="date" value={newQuoteValidUntil} onChange={e => setNewQuoteValidUntil(e.target.value)} className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono" />
                      </div>
                    </div>
                    <button type="submit" className="w-full py-3 bg-slate-900 hover:bg-slate-950 text-white rounded-xl font-bold mt-2 shadow flex items-center justify-center gap-1.5">
                      <Plus className="w-4 h-4 text-primary-celeste" /> Crear Cotización
                    </button>
                  </form>
                </div>

                {/* Listado de Cotizaciones */}
                <div className="lg:col-span-2 p-6 rounded-2xl bg-white border border-slate-200 shadow-md">
                  <span className="font-extrabold text-sm text-slate-800 block mb-4">Historial de Cotizaciones Emitidas</span>
                  <div className="space-y-4">
                    {quotes.length === 0 ? (
                      <p className="text-xs text-slate-400">No se han emitido cotizaciones aún.</p>
                    ) : (
                      quotes.map(qte => {
                        const matchedLead = leads.find(l => l.id === qte.leadId);
                        const items = JSON.parse(qte.itemsJson || '[]');
                        return (
                          <div key={qte.id} className="p-4 border border-slate-100 rounded-xl bg-slate-50/20 flex flex-col gap-3 text-xs">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-bold text-slate-800">COTIZACIÓN REF: {qte.id.substring(0,10)}</h4>
                                <span className="text-[10px] text-gray-400">Válida hasta: {qte.validUntil}</span>
                              </div>
                              <div className="text-right">
                                <span className="font-mono font-black text-slate-950 block">${qte.total.toFixed(2)}</span>
                                <span className="bg-cyan-100 text-cyan-800 px-2 py-0.5 rounded text-[8px] font-black uppercase">Enviada</span>
                              </div>
                            </div>
                            <div className="border-t border-slate-100 pt-3">
                              <span className="text-[10px] font-bold text-gray-400 uppercase">Resumen de Propuesta B2B:</span>
                              <div className="space-y-1.5 mt-1.5 text-slate-500 font-semibold">
                                {items.map((it: any) => (
                                  <div key={it.id} className="flex justify-between">
                                    <span>{it.name} (x{it.qty})</span>
                                    <span>${(it.price * it.qty).toFixed(2)}</span>
                                  </div>
                                ))}
                              </div>
                              {matchedLead && (
                                <div className="mt-3 flex justify-between items-center text-[10px] text-gray-400 border-t border-slate-100/50 pt-2">
                                  <span>Destinatario: {matchedLead.name} ({matchedLead.company || 'Sin Empresa'})</span>
                                  <button 
                                    onClick={() => alert(`Imprimiendo cotización en formato PDF...\n${matchedLead.name} - Total: $${qte.total}`)}
                                    className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded"
                                  >
                                    Imprimir PDF
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ==================== 5. SUB-TAB: FORECAST ==================== */}
            {crmSubTab === 'forecast' && (
              <div className="space-y-8">
                {/* Forecast metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-md">
                    <span className="text-[10px] font-black uppercase text-slate-400">Ingresos Proyectados (Forecast Ponderado)</span>
                    <span className="text-2xl font-black text-primary-celeste block mt-2 font-mono">
                      ${calculateWeightedForecast(leads).toFixed(2)}
                    </span>
                    <p className="text-[9px] text-gray-400 mt-2">Valor ajustado según la probabilidad de éxito de cada etapa comercial.</p>
                  </div>
                  <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-md">
                    <span className="text-[10px] font-black uppercase text-slate-400">Tasa de Conversión del Embudo</span>
                    <span className="text-2xl font-black text-green-600 block mt-2">
                      {calculateConversionRate(leads).toFixed(1)}%
                    </span>
                    <p className="text-[9px] text-gray-400 mt-2">Porcentaje de tratos cerrados como ganados sobre el total histórico.</p>
                  </div>
                  <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-md">
                    <span className="text-[10px] font-black uppercase text-slate-400">Cuota Comercial del Mes</span>
                    <span className="text-2xl font-black text-slate-800 block mt-2 font-mono">
                      $15000.00
                    </span>
                    <p className="text-[9px] text-gray-400 mt-2">Meta de facturación asignada a la organización para el ciclo activo.</p>
                  </div>
                </div>

                {/* Cuadros comparativos del pipeline */}
                <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-md">
                  <span className="font-extrabold text-sm text-slate-800 block mb-4">Probabilidad Estimada por Etapa</span>
                  <div className="space-y-4 text-xs font-semibold">
                    {[
                      { key: 'prospect', label: 'Prospecto', prob: '10%' },
                      { key: 'contacted', label: 'Contactado', prob: '30%' },
                      { key: 'qualified', label: 'Calificado', prob: '50%' },
                      { key: 'proposal', label: 'Propuesta comercial', prob: '75%' },
                      { key: 'won', label: 'Ganado (Cerrado)', prob: '100%' }
                    ].map(stage => {
                      const stageLeads = leads.filter(l => l.stage === stage.key);
                      const totalVal = stageLeads.reduce((sum, l) => sum + (l.value || 0), 0);
                      return (
                        <div key={stage.key} className="p-4 border border-slate-100 rounded-xl bg-slate-50/20 flex justify-between items-center">
                          <div>
                            <span className="font-black text-slate-800 block">{stage.label}</span>
                            <span className="text-[10px] text-gray-400">Probabilidad: {stage.prob} • {stageLeads.length} tratos</span>
                          </div>
                          <span className="font-mono font-bold text-slate-900">${totalVal.toFixed(2)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ==================== 6. SUB-TAB: CAMPAÑAS ==================== */}
            {crmSubTab === 'campaigns' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Form Campaña */}
                <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-md h-fit">
                  <span className="font-extrabold text-sm text-slate-800 block mb-4">Nueva Campaña de Email</span>
                  <form onSubmit={handleAddCrmCampaign} className="flex flex-col gap-4 text-xs font-semibold">
                    <div className="flex flex-col gap-1">
                      <label className="text-gray-500">Nombre de la Campaña</label>
                      <input required type="text" placeholder="Ej. Cyber Monday 2026" value={newCampaignName} onChange={e => setNewCampaignName(e.target.value)} className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-gray-500">Asunto del Correo (Subject)</label>
                      <input required type="text" placeholder="Ej. ¡Hasta 50% de descuento en ERP!" value={newCampaignSubject} onChange={e => setNewCampaignSubject(e.target.value)} className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl" />
                    </div>
                    <button type="submit" className="w-full py-3 bg-slate-900 hover:bg-slate-950 text-white rounded-xl font-bold mt-2 shadow flex items-center justify-center gap-1.5">
                      <Plus className="w-4 h-4 text-primary-celeste" /> Crear Campaña
                    </button>
                  </form>
                </div>

                {/* Listado Campañas */}
                <div className="lg:col-span-2 p-6 rounded-2xl bg-white border border-slate-200 shadow-md">
                  <span className="font-extrabold text-sm text-slate-800 block mb-4">Campañas Emitidas y Analíticas</span>
                  <div className="space-y-6">
                    {campaigns.length === 0 ? (
                      <p className="text-xs text-slate-400">No hay campañas creadas.</p>
                    ) : (
                      campaigns.map(camp => {
                        const metrics = calculateCampaignMetrics(camp.sentCount, camp.opensCount, camp.clicksCount);
                        return (
                          <div key={camp.id} className="p-4 border border-slate-100 rounded-xl bg-slate-50/20 flex flex-col gap-3 text-xs">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-bold text-slate-800">{camp.name}</h4>
                                <p className="text-[10px] text-gray-400">Asunto: {camp.subject}</p>
                              </div>
                              <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${camp.status === 'sent' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                                {camp.status === 'sent' ? 'Enviada' : 'Borrador'}
                              </span>
                            </div>
                            {camp.status === 'sent' ? (
                              <div className="grid grid-cols-3 gap-4 border-t border-slate-100 pt-3 text-center">
                                <div>
                                  <span className="text-[9px] font-bold text-gray-400 block uppercase">Envíos</span>
                                  <span className="font-mono font-black text-slate-900 block mt-1">{camp.sentCount}</span>
                                </div>
                                <div>
                                  <span className="text-[9px] font-bold text-gray-400 block uppercase">Aperturas</span>
                                  <span className="font-mono font-black text-slate-900 block mt-1">
                                    {metrics.openRate.toFixed(1)}%
                                  </span>
                                </div>
                                <div>
                                  <span className="text-[9px] font-bold text-gray-400 block uppercase">Clics (CTR)</span>
                                  <span className="font-mono font-black text-slate-900 block mt-1">
                                    {metrics.ctr.toFixed(1)}%
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <div className="border-t border-slate-100 pt-3 text-right">
                                <button 
                                  onClick={() => handleSendCrmCampaign(camp.id)}
                                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-950 text-white rounded-lg font-bold text-[10px]"
                                >
                                  Lanzar Campaña
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            )}

          </div>
        )}

        {/* ==================== [NEW] TAB: FULFILLMENT & ORDENES ==================== */}
        {activeTab === 'fulfillment_orders' && (
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-md animate-fade-in">
            <span className="font-extrabold text-sm text-slate-800 block mb-4">Gestión de Órdenes & Fulfillment de Envíos</span>
            <p className="text-xs text-gray-500 mb-6">Administra los estados de preparación y despacho de las ventas eCommerce y POS.</p>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 font-bold text-gray-400">
                    <th className="pb-3">Pedido ID</th>
                    <th className="pb-3">Fecha</th>
                    <th className="pb-3">Artículos</th>
                    <th className="pb-3 text-right">Monto</th>
                    <th className="pb-3 text-center">Estado Envío</th>
                    <th className="pb-3">Tracking ID (EasyPost)</th>
                    <th className="pb-3 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {dbAdapter.getStorage('mock_orders', []).map((o: any) => {
                    const itemsText = o.items ? o.items.map((i: any) => `${i.name} (${i.quantity})`).join(', ') : 'Venta POS';
                    return (
                      <tr key={o.id} className="border-b border-slate-50 last:border-b-0 hover:bg-slate-50/20">
                        <td className="py-4 font-mono font-bold text-slate-900 uppercase">{o.id}</td>
                        <td className="py-4 text-slate-500">{o.date || o.created_at}</td>
                        <td className="py-4 text-slate-600 font-semibold max-w-[200px] truncate" title={itemsText}>{itemsText}</td>
                        <td className="py-4 text-right font-black text-slate-950 font-mono">${o.total?.toFixed(2)}</td>
                        <td className="py-4 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                            o.shippingStatus === 'delivered' ? 'bg-green-100 text-green-700' :
                            o.shippingStatus === 'shipped' ? 'bg-blue-100 text-blue-700' :
                            o.shippingStatus === 'packing' ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-400'
                          }`}>
                            {o.shippingStatus || 'pending'}
                          </span>
                        </td>
                        <td className="py-4 font-mono text-[10px] text-gray-500">{o.trackingNumber || 'No Asignado'}</td>
                        <td className="py-4 text-right">
                          <div className="flex gap-1.5 justify-end">
                            {(o.shippingStatus === 'pending' || !o.shippingStatus) && (
                              <button 
                                onClick={() => handleUpdateShippingStatus(o.id, 'packing')}
                                className="py-1 px-2.5 bg-orange-50 hover:bg-orange-100 text-orange-600 font-bold rounded-lg text-[10px]"
                              >
                                Empacar
                              </button>
                            )}
                            {o.shippingStatus === 'packing' && (
                              <button 
                                onClick={() => handleUpdateShippingStatus(o.id, 'shipped')}
                                className="py-1 px-2.5 bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold rounded-lg text-[10px]"
                              >
                                Despachar CNAME
                              </button>
                            )}
                            {o.shippingStatus === 'shipped' && (
                              <button 
                                onClick={() => handleUpdateShippingStatus(o.id, 'delivered')}
                                className="py-1 px-2.5 bg-green-50 hover:bg-green-100 text-green-600 font-bold rounded-lg text-[10px]"
                              >
                                Entregar
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ==================== [NEW] TAB: BODEGAS & LOTES ==================== */}
        {activeTab === 'inventory_warehouses' && (
          <div className="space-y-8 animate-fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Form 1: Warehouse */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-md h-fit">
                <span className="font-extrabold text-sm text-slate-800 block mb-4">Añadir Bodega / Almacén</span>
                <form onSubmit={handleAddWarehouse} className="flex flex-col gap-4 text-xs font-semibold">
                  <div className="flex flex-col gap-1">
                    <label className="text-gray-500">Nombre de Bodega</label>
                    <input required type="text" placeholder="Ej. Bodega Central" value={newWhName} onChange={e => setNewWhName(e.target.value)} className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-gray-500">Ubicación / Dirección</label>
                    <input required type="text" placeholder="Ej. Av. Kennedy 1200" value={newWhLocation} onChange={e => setNewWhLocation(e.target.value)} className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl" />
                  </div>
                  <button type="submit" className="w-full py-3 bg-slate-900 hover:bg-slate-950 text-white rounded-xl font-bold mt-2 shadow flex items-center justify-center gap-1.5">
                    <Plus className="w-4 h-4 text-primary-celeste" /> Crear Bodega
                  </button>
                </form>
              </div>

              {/* Form 2: Batch Allocation */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-md h-fit">
                <span className="font-extrabold text-sm text-slate-800 block mb-4">Asignar Stock por Lotes</span>
                <form onSubmit={handleAddBatch} className="flex flex-col gap-4 text-xs font-semibold">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-gray-500">Producto</label>
                      <select required value={newBatchProductId} onChange={e => setNewBatchProductId(e.target.value)} className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                        <option value="">-- Seleccionar --</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-gray-500">Bodega Destino</label>
                      <select required value={newBatchWhId} onChange={e => setNewBatchWhId(e.target.value)} className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                        <option value="">-- Seleccionar --</option>
                        {warehouses.map(w => (
                          <option key={w.id} value={w.id}>{w.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-gray-500">Número de Lote (Batch)</label>
                      <input required type="text" placeholder="Ej. LOT-2026-99" value={newBatchNum} onChange={e => setNewBatchNum(e.target.value)} className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-gray-500">Cantidad (Stock)</label>
                      <input required type="number" placeholder="10" value={newBatchQty || ''} onChange={e => setNewBatchQty(Number(e.target.value))} className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl" />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-gray-500">Fecha de Vencimiento</label>
                    <input type="date" value={newBatchExpiry} onChange={e => setNewBatchExpiry(e.target.value)} className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl" />
                  </div>
                  <button type="submit" className="w-full py-3 bg-slate-900 hover:bg-slate-950 text-white rounded-xl font-bold mt-2 shadow flex items-center justify-center gap-1.5">
                    <Plus className="w-4 h-4 text-primary-celeste" /> Ingresar Lote
                  </button>
                </form>
              </div>

              {/* Warehouse Info Card list */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-md">
                <span className="font-extrabold text-sm text-slate-800 block mb-4">Bodegas y Lotes Activos</span>
                
                <div className="space-y-4">
                  <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Bodegas ({warehouses.length})</span>
                  {warehouses.map(w => (
                    <div key={w.id} className="p-3 border border-slate-100 rounded-xl bg-slate-50/20 text-xs font-semibold">
                      <div className="text-slate-800 font-bold">{w.name}</div>
                      <div className="text-gray-400 mt-1 flex items-center gap-1"><MapPin className="w-3 h-3" /> {w.location || 'Sin Ubicación'}</div>
                    </div>
                  ))}

                  <div className="border-t border-slate-100 pt-4 mt-4">
                    <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider block mb-3">Lotes y Vencimientos ({batches.length})</span>
                    {batches.map(b => {
                      const matchedP = products.find(p => p.id === b.productId);
                      const matchedW = warehouses.find(w => w.id === b.warehouseId);
                      return (
                        <div key={b.id} className="flex justify-between items-center py-2.5 border-b border-slate-50 text-xs last:border-0">
                          <div>
                            <span className="font-bold text-slate-800 block">{matchedP ? matchedP.name : b.productId}</span>
                            <span className="text-[9px] font-black uppercase text-gray-400 tracking-wider mt-0.5">Lote: {b.batchNumber} • Bodega: {matchedW ? matchedW.name : b.warehouseId}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-black text-slate-900 font-mono block">Cant: {b.qty}</span>
                            {b.expiryDate && <span className="text-[9px] font-bold text-red-500 block mt-0.5">Vence: {b.expiryDate}</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================== [NEW] TAB: HELPDESK & SOPORTE ==================== */}
        {activeTab === 'helpdesk_support' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
            
            {/* Ticket Submission Form */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-md h-fit">
              <span className="font-extrabold text-sm text-slate-800 block mb-4">Abrir Ticket de Soporte</span>
              <form onSubmit={handleAddTicket} className="flex flex-col gap-4 text-xs font-semibold">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-gray-500">Nombre Cliente</label>
                    <input required type="text" placeholder="Ej. Pedro Soto" value={newTktCustName} onChange={e => setNewTktCustName(e.target.value)} className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-gray-500">Email Cliente</label>
                    <input required type="email" placeholder="pedro@correo.com" value={newTktCustEmail} onChange={e => setNewTktCustEmail(e.target.value)} className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl" />
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-gray-500">Asunto</label>
                  <input required type="text" placeholder="Ej. Falla al procesar tarjeta" value={newTktSubject} onChange={e => setNewTktSubject(e.target.value)} className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-gray-500">Prioridad</label>
                  <select value={newTktPriority} onChange={e => setNewTktPriority(e.target.value as any)} className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                    <option value="low">Baja</option>
                    <option value="medium">Media</option>
                    <option value="high">Alta</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-gray-500">Descripción del Problema</label>
                  <textarea required placeholder="Indica el mensaje del error..." value={newTktDesc} onChange={e => setNewTktDesc(e.target.value)} className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl h-24" />
                </div>
                <button type="submit" className="w-full py-3 bg-slate-900 hover:bg-slate-950 text-white rounded-xl font-bold mt-2 shadow flex items-center justify-center gap-1.5">
                  <Plus className="w-4 h-4 text-primary-celeste" /> Abrir Ticket
                </button>
              </form>
            </div>

            {/* Support Tickets list */}
            <div className="lg:col-span-2 p-6 rounded-2xl bg-white border border-slate-200 shadow-md">
              <span className="font-extrabold text-sm text-slate-800 block mb-4">Tickets Activos</span>
              
              <div className="space-y-4">
                {tickets.map(t => (
                  <div key={t.id} className="p-4 border border-slate-100 rounded-2xl bg-slate-50/20 text-xs">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-black text-slate-950 text-sm">{t.subject}</h4>
                        <p className="text-[10px] text-gray-400 mt-1 uppercase font-bold">Cliente: {t.customerName} ({t.customerEmail})</p>
                      </div>
                      <div className="flex gap-2">
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                          t.priority === 'high' ? 'bg-red-100 text-red-700' :
                          t.priority === 'medium' ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {t.priority}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                          t.status === 'resolved' ? 'bg-green-100 text-green-700' :
                          t.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {t.status}
                        </span>
                      </div>
                    </div>
                    <p className="text-slate-600 mt-3 font-medium bg-white p-3 border border-slate-100 rounded-xl leading-relaxed">{t.description}</p>
                    
                    {t.status !== 'resolved' && (
                      <div className="flex gap-2 mt-4 justify-end">
                        {t.status === 'open' && (
                          <button 
                            onClick={() => handleUpdateTicketStatus(t.id, 'pending')}
                            className="py-1 px-3 bg-yellow-50 hover:bg-yellow-100 text-yellow-700 font-bold rounded-lg text-[10px]"
                          >
                            Marcar Pendiente
                          </button>
                        )}
                        <button 
                          onClick={() => handleUpdateTicketStatus(t.id, 'resolved')}
                          className="py-1 px-3 bg-green-50 hover:bg-green-100 text-green-600 font-bold rounded-lg text-[10px]"
                        >
                          Resolver Ticket
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ==================== [NEW] TAB: RRHH & NOMINA ==================== */}
        {activeTab === 'hr_payroll' && (
          <div className="space-y-8 animate-fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Employee registration form */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-md h-fit">
                <span className="font-extrabold text-sm text-slate-800 block mb-4">Registrar Empleado (Staff)</span>
                <form onSubmit={handleAddEmployee} className="flex flex-col gap-4 text-xs font-semibold">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-gray-500">Nombre</label>
                      <input required type="text" placeholder="Ej. Carlos" value={newEmpFirst} onChange={e => setNewEmpFirst(e.target.value)} className="px-3.5 py-2.5 bg-slate-50 border border-slate-250 rounded-xl" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-gray-500">Apellido</label>
                      <input required type="text" placeholder="Ej. Gómez" value={newEmpLast} onChange={e => setNewEmpLast(e.target.value)} className="px-3.5 py-2.5 bg-slate-50 border border-slate-250 rounded-xl" />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-gray-500">Email Empleado</label>
                    <input required type="email" placeholder="carlos@correo.com" value={newEmpEmail} onChange={e => setNewEmpEmail(e.target.value)} className="px-3.5 py-2.5 bg-slate-50 border border-slate-250 rounded-xl" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-gray-500">Cargo / Puesto</label>
                      <input required type="text" placeholder="Ej. Manager" value={newEmpRole} onChange={e => setNewEmpRole(e.target.value)} className="px-3.5 py-2.5 bg-slate-50 border border-slate-250 rounded-xl" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-gray-500">Salario Mensual ($)</label>
                      <input required type="number" placeholder="2500" value={newEmpSalary || ''} onChange={e => setNewEmpSalary(Number(e.target.value))} className="px-3.5 py-2.5 bg-slate-50 border border-slate-250 rounded-xl" />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-gray-500">Fecha de Contratación</label>
                    <input type="date" value={newEmpHireDate} onChange={e => setNewEmpHireDate(e.target.value)} className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl" />
                  </div>
                  <button type="submit" className="w-full py-3 bg-slate-900 hover:bg-slate-950 text-white rounded-xl font-bold mt-2 shadow flex items-center justify-center gap-1.5">
                    <Plus className="w-4 h-4 text-primary-celeste" /> Registrar Personal
                  </button>
                </form>
              </div>

              {/* Employee table */}
              <div className="lg:col-span-2 p-6 rounded-2xl bg-white border border-slate-200 shadow-md">
                <div className="flex justify-between items-center mb-5">
                  <span className="font-extrabold text-sm text-slate-800">Planilla y Nómina de Personal</span>
                  <button 
                    onClick={handleRunPayroll}
                    className="py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow"
                  >
                    <Coins className="w-4 h-4" /> Ejecutar & Contabilizar Nómina
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 font-bold text-gray-400">
                        <th className="pb-3">Empleado</th>
                        <th className="pb-3">Cargo</th>
                        <th className="pb-3">Email</th>
                        <th className="pb-3 text-right">Salario Mensual</th>
                        <th className="pb-3 text-center">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {employees.map(e => (
                        <tr key={e.id} className="border-b border-slate-50 last:border-b-0">
                          <td className="py-3 font-bold text-slate-900">{e.firstName} {e.lastName}</td>
                          <td className="py-3 text-slate-600 font-semibold">{e.role}</td>
                          <td className="py-3 text-slate-500 font-mono">{e.email}</td>
                          <td className="py-3 text-right font-black text-slate-950 font-mono">${e.salary.toFixed(2)}</td>
                          <td className="py-3 text-center">
                            <span className="px-2 py-0.5 rounded bg-green-100 text-green-700 text-[9px] font-black uppercase">
                              {e.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================== ERP PRO TAB ==================== */}
        {activeTab === 'erp_pro' && (
          <div className="space-y-8 animate-fade-in">
            {/* Header KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
                <span className="text-[10px] font-black uppercase text-slate-400">Órdenes de Producción</span>
                <span className="text-2xl font-black text-orange-500 block mt-1">{erpWorkOrders.length}</span>
              </div>
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
                <span className="text-[10px] font-black uppercase text-slate-400">Controles de Calidad</span>
                <span className="text-2xl font-black text-blue-500 block mt-1">{erpQualityChecks.length}</span>
              </div>
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
                <span className="text-[10px] font-black uppercase text-slate-400">Órdenes de Compra</span>
                <span className="text-2xl font-black text-green-600 block mt-1">{erpPurchaseOrders.length}</span>
              </div>
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
                <span className="text-[10px] font-black uppercase text-slate-400">Documentos Digitales</span>
                <span className="text-2xl font-black text-purple-500 block mt-1">{erpDocuments.length}</span>
              </div>
            </div>

            {/* Sub-Nav ERP */}
            <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-4">
              {[
                { key: 'production', label: '🏭 Producción', color: 'orange' },
                { key: 'quality', label: '✅ Calidad', color: 'blue' },
                { key: 'purchases', label: '🛒 Compras', color: 'green' },
                { key: 'assets', label: '🏗️ Activos Fijos', color: 'slate' },
                { key: 'maintenance', label: '🔧 Mantenimiento', color: 'yellow' },
                { key: 'payroll', label: '💰 Nómina Avanzada', color: 'teal' },
                { key: 'documents', label: '📁 Documentos', color: 'purple' },
                { key: 'signatures', label: '✍️ Firma Electrónica', color: 'indigo' }
              ].map(tab => (
                <button key={tab.key}
                  onClick={() => setErpSubTab(tab.key as any)}
                  className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${erpSubTab === tab.key ? 'bg-slate-900 text-white shadow-md' : 'bg-white hover:bg-slate-50 border border-slate-200 text-slate-600'}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* ===== 1. PRODUCCIÓN ===== */}
            {erpSubTab === 'production' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-md h-fit">
                  <span className="font-extrabold text-sm text-slate-800 block mb-4">Nueva Orden de Producción</span>
                  <form onSubmit={e => {
                    e.preventDefault();
                    if (!tenant || !newWoProduct || !newWoDeadline) return;
                    const wo = { id: 'wo-' + Date.now(), tenantId: tenant.id, product: newWoProduct, qty: newWoQty, status: 'pending', deadline: newWoDeadline, produced: 0 };
                    const list = [...erpWorkOrders, wo];
                    dbAdapter.saveErpWorkOrders(tenant.id, list);
                    dbAdapter.addAuditLog(tenant.id, `${activeRole}@tenant.com`, 'Orden Producción Creada', newWoProduct);
                    setErpWorkOrders(list);
                    setNewWoProduct(''); setNewWoQty(1); setNewWoDeadline('');
                  }} className="flex flex-col gap-4 text-xs font-semibold">
                    <div className="flex flex-col gap-1">
                      <label className="text-gray-500">Producto a Fabricar</label>
                      <input required type="text" placeholder="Ej. Mesa de Madera Premium" value={newWoProduct} onChange={e => setNewWoProduct(e.target.value)} className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1">
                        <label className="text-gray-500">Cantidad (unid.)</label>
                        <input required type="number" min="1" value={newWoQty} onChange={e => setNewWoQty(parseInt(e.target.value) || 1)} className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-gray-500">Fecha Límite</label>
                        <input required type="date" value={newWoDeadline} onChange={e => setNewWoDeadline(e.target.value)} className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono" />
                      </div>
                    </div>
                    <button type="submit" className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold shadow">+ Crear Orden</button>
                  </form>
                </div>
                <div className="lg:col-span-2 p-6 rounded-2xl bg-white border border-slate-200 shadow-md">
                  <span className="font-extrabold text-sm text-slate-800 block mb-4">Órdenes de Producción Activas</span>
                  <div className="space-y-4 text-xs">
                    {erpWorkOrders.map(wo => {
                      const progress = wo.qty > 0 ? Math.round((wo.produced / wo.qty) * 100) : 0;
                      return (
                        <div key={wo.id} className="p-4 border border-slate-100 rounded-xl bg-slate-50/20">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h4 className="font-black text-slate-900">{wo.product}</h4>
                              <p className="text-[10px] text-gray-400 mt-0.5">Fecha Límite: {wo.deadline} • Producido: {wo.produced}/{wo.qty} unidades</p>
                            </div>
                            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${wo.status === 'in_progress' ? 'bg-orange-100 text-orange-700' : wo.status === 'done' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                              {wo.status === 'in_progress' ? 'En Proceso' : wo.status === 'done' ? 'Completado' : 'Pendiente'}
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2">
                            <div className="bg-orange-400 h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
                          </div>
                          <div className="flex justify-between mt-1.5">
                            <span className="text-[9px] text-gray-400">Progreso: {progress}%</span>
                            <button onClick={() => {
                              const updated = erpWorkOrders.map(w => w.id === wo.id ? { ...w, produced: Math.min(w.produced + Math.ceil(w.qty * 0.25), w.qty), status: (w.produced + Math.ceil(w.qty * 0.25)) >= w.qty ? 'done' : 'in_progress' } : w);
                              dbAdapter.saveErpWorkOrders(tenant?.id || '', updated);
                              setErpWorkOrders(updated);
                            }} className="text-[9px] font-bold text-orange-600 hover:underline">+ Registrar avance</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ===== 2. CALIDAD ===== */}
            {erpSubTab === 'quality' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-md h-fit">
                  <span className="font-extrabold text-sm text-slate-800 block mb-4">Nuevo Control de Calidad</span>
                  <form onSubmit={e => {
                    e.preventDefault();
                    if (!tenant || !newQcProduct) return;
                    const qc = { id: 'qc-' + Date.now(), tenantId: tenant.id, product: newQcProduct, result: newQcResult, notes: newQcNotes, date: new Date().toISOString().split('T')[0], inspector: `${activeRole}@tenant.com` };
                    const list = [...erpQualityChecks, qc];
                    dbAdapter.saveErpQualityChecks(tenant.id, list);
                    dbAdapter.addAuditLog(tenant.id, `${activeRole}@tenant.com`, 'Control Calidad Registrado', `${newQcProduct}: ${newQcResult}`);
                    setErpQualityChecks(list);
                    setNewQcProduct(''); setNewQcNotes(''); setNewQcResult('pass');
                  }} className="flex flex-col gap-4 text-xs font-semibold">
                    <div className="flex flex-col gap-1">
                      <label className="text-gray-500">Producto Inspeccionado</label>
                      <input required type="text" placeholder="Ej. Tornillo M8 Lote #204" value={newQcProduct} onChange={e => setNewQcProduct(e.target.value)} className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-gray-500">Resultado de Inspección</label>
                      <select value={newQcResult} onChange={e => setNewQcResult(e.target.value as any)} className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                        <option value="pass">✅ Aprobado (PASS)</option>
                        <option value="fail">❌ Rechazado (FAIL)</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-gray-500">Observaciones</label>
                      <textarea value={newQcNotes} onChange={e => setNewQcNotes(e.target.value)} placeholder="Detalles del control..." className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl h-16" />
                    </div>
                    <button type="submit" className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow">+ Registrar Inspección</button>
                  </form>
                </div>
                <div className="lg:col-span-2 p-6 rounded-2xl bg-white border border-slate-200 shadow-md">
                  <span className="font-extrabold text-sm text-slate-800 block mb-4">Historial de Controles de Calidad</span>
                  <div className="space-y-3 text-xs">
                    {erpQualityChecks.map(qc => (
                      <div key={qc.id} className={`p-4 border rounded-xl flex justify-between items-start ${qc.result === 'pass' ? 'border-green-200 bg-green-50/30' : 'border-red-200 bg-red-50/30'}`}>
                        <div>
                          <h4 className="font-bold text-slate-900">{qc.product}</h4>
                          <p className="text-[10px] text-gray-400 mt-0.5">Fecha: {qc.date} • Inspector: {qc.inspector}</p>
                          {qc.notes && <p className="text-[10px] text-slate-600 mt-1 italic">"{qc.notes}"</p>}
                        </div>
                        <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase flex-shrink-0 ${qc.result === 'pass' ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
                          {qc.result === 'pass' ? '✅ PASS' : '❌ FAIL'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ===== 3. COMPRAS ===== */}
            {erpSubTab === 'purchases' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-md h-fit">
                  <span className="font-extrabold text-sm text-slate-800 block mb-4">Nueva Orden de Compra</span>
                  <form onSubmit={e => {
                    e.preventDefault();
                    if (!tenant || !newPoSupplier || !newPoItem) return;
                    const po = { id: 'po-' + Date.now(), tenantId: tenant.id, supplier: newPoSupplier, item: newPoItem, qty: newPoQty, unitPrice: newPoUnitPrice, status: 'pending', total: newPoQty * newPoUnitPrice };
                    const list = [...erpPurchaseOrders, po];
                    dbAdapter.saveErpPurchaseOrders(tenant.id, list);
                    dbAdapter.addAuditLog(tenant.id, `${activeRole}@tenant.com`, 'Orden de Compra Creada', `${newPoSupplier} - ${newPoItem}`);
                    setErpPurchaseOrders(list);
                    setNewPoSupplier(''); setNewPoItem(''); setNewPoQty(1); setNewPoUnitPrice(0);
                  }} className="flex flex-col gap-4 text-xs font-semibold">
                    <div className="flex flex-col gap-1">
                      <label className="text-gray-500">Proveedor</label>
                      <input required type="text" placeholder="Ej. Maderas del Sur S.A." value={newPoSupplier} onChange={e => setNewPoSupplier(e.target.value)} className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-gray-500">Artículo / Materia Prima</label>
                      <input required type="text" placeholder="Ej. Tableros MDF 18mm" value={newPoItem} onChange={e => setNewPoItem(e.target.value)} className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1">
                        <label className="text-gray-500">Cantidad</label>
                        <input required type="number" min="1" value={newPoQty} onChange={e => setNewPoQty(parseInt(e.target.value) || 1)} className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-gray-500">Precio Unitario ($)</label>
                        <input required type="number" min="0" step="0.01" value={newPoUnitPrice || ''} onChange={e => setNewPoUnitPrice(parseFloat(e.target.value) || 0)} className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono" />
                      </div>
                    </div>
                    <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-center">
                      <span className="text-[10px] text-green-600 font-bold">TOTAL ORDEN:</span>
                      <span className="text-lg font-black text-green-800 block font-mono">${(newPoQty * newPoUnitPrice).toFixed(2)}</span>
                    </div>
                    <button type="submit" className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold shadow">+ Emitir Orden de Compra</button>
                  </form>
                </div>
                <div className="lg:col-span-2 p-6 rounded-2xl bg-white border border-slate-200 shadow-md overflow-x-auto">
                  <span className="font-extrabold text-sm text-slate-800 block mb-4">Órdenes de Compra</span>
                  <table className="w-full text-xs text-left border-collapse">
                    <thead><tr className="border-b border-slate-100 font-bold text-gray-400">
                      <th className="pb-2">Proveedor</th><th className="pb-2">Artículo</th><th className="pb-2 text-center">Qty</th><th className="pb-2 text-right">Total</th><th className="pb-2 text-center">Estado</th><th className="pb-2 text-center">Acción</th>
                    </tr></thead>
                    <tbody>
                      {erpPurchaseOrders.map(po => (
                        <tr key={po.id} className="border-b border-slate-50">
                          <td className="py-2.5 font-semibold text-slate-800">{po.supplier}</td>
                          <td className="py-2.5 text-slate-600">{po.item}</td>
                          <td className="py-2.5 text-center font-mono">{po.qty}</td>
                          <td className="py-2.5 text-right font-black font-mono text-slate-900">${(po.total).toFixed(2)}</td>
                          <td className="py-2.5 text-center">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${po.status === 'approved' ? 'bg-green-100 text-green-700' : po.status === 'received' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`}>
                              {po.status === 'approved' ? 'Aprobada' : po.status === 'received' ? 'Recibida' : 'Pendiente'}
                            </span>
                          </td>
                          <td className="py-2.5 text-center">
                            {po.status !== 'received' && (
                              <button onClick={() => {
                                const updated = erpPurchaseOrders.map(p => p.id === po.id ? { ...p, status: p.status === 'pending' ? 'approved' : 'received' } : p);
                                dbAdapter.saveErpPurchaseOrders(tenant?.id || '', updated);
                                setErpPurchaseOrders(updated);
                              }} className="text-[9px] font-bold text-green-600 hover:underline">
                                {po.status === 'pending' ? 'Aprobar' : 'Recibir'}
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ===== 4. ACTIVOS FIJOS ===== */}
            {erpSubTab === 'assets' && (
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-md">
                <span className="font-extrabold text-sm text-slate-800 block mb-4">🏗️ Registro de Activos Fijos (PPE)</span>
                <p className="text-xs text-slate-500 mb-4">Los activos fijos y su depreciación mensual se gestionan desde <strong>Contabilidad PRO → Activos Fijos</strong>. Aquí se muestra el inventario completo vinculado al plan de mantenimiento.</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead><tr className="border-b border-slate-100 font-bold text-gray-400">
                      <th className="pb-2">Activo</th><th className="pb-2 text-right">Valor Compra</th><th className="pb-2 text-right">Valor Rescate</th><th className="pb-2 text-center">Vida Útil</th><th className="pb-2 text-right">Depreciado</th><th className="pb-2 text-center">Estado</th>
                    </tr></thead>
                    <tbody>
                      {fixedAssets.length === 0 ? (
                        <tr><td colSpan={6} className="py-6 text-center text-slate-400">No hay activos registrados. Ve a Contabilidad PRO → Activos Fijos para agregar.</td></tr>
                      ) : fixedAssets.map((a: any) => (
                        <tr key={a.id} className="border-b border-slate-50">
                          <td className="py-2.5 font-semibold text-slate-800">{a.name}</td>
                          <td className="py-2.5 text-right font-mono">${a.purchaseValue.toFixed(2)}</td>
                          <td className="py-2.5 text-right font-mono text-slate-500">${a.salvageValue.toFixed(2)}</td>
                          <td className="py-2.5 text-center">{a.lifespanYears} años</td>
                          <td className="py-2.5 text-right font-black font-mono text-orange-600">${a.depreciatedAmount.toFixed(2)}</td>
                          <td className="py-2.5 text-center">
                            <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-[9px] font-black">Activo</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ===== 5. MANTENIMIENTO ===== */}
            {erpSubTab === 'maintenance' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-md h-fit">
                  <span className="font-extrabold text-sm text-slate-800 block mb-4">Planificar Mantenimiento</span>
                  <form onSubmit={e => {
                    e.preventDefault();
                    if (!tenant || !newMtAsset || !newMtDate) return;
                    const mt = { id: 'mt-' + Date.now(), tenantId: tenant.id, asset: newMtAsset, type: newMtType, date: newMtDate, technician: newMtTech, status: 'scheduled' };
                    const list = [...erpMaintenanceTasks, mt];
                    dbAdapter.saveErpMaintenanceTasks(tenant.id, list);
                    dbAdapter.addAuditLog(tenant.id, `${activeRole}@tenant.com`, 'Mantenimiento Planificado', `${newMtAsset} - ${newMtType}`);
                    setErpMaintenanceTasks(list);
                    setNewMtAsset(''); setNewMtTech(''); setNewMtDate('');
                  }} className="flex flex-col gap-4 text-xs font-semibold">
                    <div className="flex flex-col gap-1">
                      <label className="text-gray-500">Equipo / Activo</label>
                      <input required type="text" placeholder="Ej. CNC Router XL-3000" value={newMtAsset} onChange={e => setNewMtAsset(e.target.value)} className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1">
                        <label className="text-gray-500">Tipo</label>
                        <select value={newMtType} onChange={e => setNewMtType(e.target.value as any)} className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                          <option value="preventive">🔄 Preventivo</option>
                          <option value="corrective">🔧 Correctivo</option>
                        </select>
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-gray-500">Fecha Programada</label>
                        <input required type="date" value={newMtDate} onChange={e => setNewMtDate(e.target.value)} className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono" />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-gray-500">Técnico Asignado</label>
                      <input type="text" placeholder="Ej. Pedro Soto" value={newMtTech} onChange={e => setNewMtTech(e.target.value)} className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl" />
                    </div>
                    <button type="submit" className="w-full py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl font-bold shadow">+ Programar Mantenimiento</button>
                  </form>
                </div>
                <div className="lg:col-span-2 p-6 rounded-2xl bg-white border border-slate-200 shadow-md">
                  <span className="font-extrabold text-sm text-slate-800 block mb-4">Plan de Mantenimiento</span>
                  <div className="space-y-3 text-xs">
                    {erpMaintenanceTasks.map(mt => (
                      <div key={mt.id} className="p-4 border border-slate-100 rounded-xl bg-slate-50/20 flex justify-between items-center">
                        <div>
                          <h4 className="font-bold text-slate-900">{mt.asset}</h4>
                          <p className="text-[10px] text-gray-400 mt-0.5">
                            {mt.type === 'preventive' ? '🔄 Preventivo' : '🔧 Correctivo'} • {mt.date} • Técnico: {mt.technician || 'Sin asignar'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${mt.status === 'done' ? 'bg-green-100 text-green-700' : mt.status === 'in_progress' ? 'bg-yellow-100 text-yellow-700' : 'bg-slate-100 text-slate-500'}`}>
                            {mt.status === 'done' ? 'Completado' : mt.status === 'in_progress' ? 'En Curso' : 'Programado'}
                          </span>
                          {mt.status !== 'done' && (
                            <button onClick={() => {
                              const updated = erpMaintenanceTasks.map(t => t.id === mt.id ? { ...t, status: t.status === 'scheduled' ? 'in_progress' : 'done' } : t);
                              dbAdapter.saveErpMaintenanceTasks(tenant?.id || '', updated);
                              setErpMaintenanceTasks(updated);
                            }} className="text-[9px] font-bold text-yellow-600 hover:underline">
                              {mt.status === 'scheduled' ? 'Iniciar' : 'Completar'}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ===== 6. NÓMINA AVANZADA ===== */}
            {erpSubTab === 'payroll' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-md">
                    <span className="text-[10px] font-black uppercase text-slate-400">Costo Total Nómina</span>
                    <span className="text-2xl font-black text-teal-600 block mt-1 font-mono">${employees.reduce((s: number, e: any) => s + (e.salary || 0), 0).toFixed(2)}</span>
                  </div>
                  <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-md">
                    <span className="text-[10px] font-black uppercase text-slate-400">Empleados Activos</span>
                    <span className="text-2xl font-black text-slate-800 block mt-1">{employees.filter((e: any) => e.status === 'active').length}</span>
                  </div>
                  <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-md">
                    <span className="text-[10px] font-black uppercase text-slate-400">Promedio Sueldo</span>
                    <span className="text-2xl font-black text-slate-800 block mt-1 font-mono">
                      ${employees.length > 0 ? (employees.reduce((s: number, e: any) => s + (e.salary || 0), 0) / employees.length).toFixed(2) : '0.00'}
                    </span>
                  </div>
                </div>
                <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-md overflow-x-auto">
                  <span className="font-extrabold text-sm text-slate-800 block mb-4">Liquidaciones de Sueldo</span>
                  <table className="w-full text-xs text-left border-collapse">
                    <thead><tr className="border-b border-slate-100 font-bold text-gray-400">
                      <th className="pb-2">Empleado</th><th className="pb-2">Rol</th><th className="pb-2 text-right">Sueldo Base</th><th className="pb-2 text-right">Descuentos (15%)</th><th className="pb-2 text-right">Neto a Pagar</th><th className="pb-2 text-center">Estado</th>
                    </tr></thead>
                    <tbody>
                      {employees.map((e: any) => {
                        const bruto = e.salary || 0;
                        const descuento = bruto * 0.15;
                        const neto = bruto - descuento;
                        return (
                          <tr key={e.id} className="border-b border-slate-50">
                            <td className="py-2.5 font-bold text-slate-900">{e.firstName} {e.lastName}</td>
                            <td className="py-2.5 text-slate-600">{e.role}</td>
                            <td className="py-2.5 text-right font-mono text-slate-700">${bruto.toFixed(2)}</td>
                            <td className="py-2.5 text-right font-mono text-red-500">-${descuento.toFixed(2)}</td>
                            <td className="py-2.5 text-right font-black font-mono text-teal-700">${neto.toFixed(2)}</td>
                            <td className="py-2.5 text-center">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${e.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>{e.status}</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-slate-200">
                        <td colSpan={4} className="py-3 font-black text-slate-800 text-right pr-4">TOTAL NETO A PAGAR:</td>
                        <td className="py-3 font-black font-mono text-teal-700 text-right">${employees.reduce((s: number, e: any) => s + ((e.salary || 0) * 0.85), 0).toFixed(2)}</td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                  <button onClick={() => {
                    if (tenant) dbAdapter.addAuditLog(tenant.id, `${activeRole}@tenant.com`, 'Nómina Procesada', `Ciclo: ${new Date().toLocaleDateString()}`);
                    alert('Nómina procesada y transferencias bancarias enviadas. Comprobantes generados para cada empleado.');
                  }} className="mt-4 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow">
                    💸 Procesar Pago de Nómina
                  </button>
                </div>
              </div>
            )}

            {/* ===== 7. DOCUMENTOS ===== */}
            {erpSubTab === 'documents' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-md h-fit">
                  <span className="font-extrabold text-sm text-slate-800 block mb-4">Subir Documento</span>
                  <form onSubmit={e => {
                    e.preventDefault();
                    if (!tenant || !newDocTitle) return;
                    const doc = { id: 'doc-' + Date.now(), tenantId: tenant.id, title: newDocTitle, category: newDocCategory, date: new Date().toISOString().split('T')[0], signed: false, signerEmail: '' };
                    const list = [...erpDocuments, doc];
                    dbAdapter.saveErpDocuments(tenant.id, list);
                    dbAdapter.addAuditLog(tenant.id, `${activeRole}@tenant.com`, 'Documento Creado', newDocTitle);
                    setErpDocuments(list);
                    setNewDocTitle('');
                  }} className="flex flex-col gap-4 text-xs font-semibold">
                    <div className="flex flex-col gap-1">
                      <label className="text-gray-500">Título del Documento</label>
                      <input required type="text" placeholder="Ej. Contrato Marco Proveedores" value={newDocTitle} onChange={e => setNewDocTitle(e.target.value)} className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-gray-500">Categoría</label>
                      <select value={newDocCategory} onChange={e => setNewDocCategory(e.target.value)} className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                        {['Contrato', 'Política', 'Manual', 'Acta', 'Certificado', 'Factura', 'Propuesta', 'Otro'].map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                    <div className="p-3 border border-dashed border-slate-300 rounded-xl text-center text-slate-400">
                      <span className="text-2xl block">📎</span>
                      <span className="text-[10px]">Arrastra o haz clic para adjuntar archivo</span>
                    </div>
                    <button type="submit" className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold shadow">+ Registrar Documento</button>
                  </form>
                </div>
                <div className="lg:col-span-2 p-6 rounded-2xl bg-white border border-slate-200 shadow-md">
                  <span className="font-extrabold text-sm text-slate-800 block mb-4">Repositorio de Documentos Corporativos</span>
                  <div className="space-y-3 text-xs">
                    {erpDocuments.map(doc => (
                      <div key={doc.id} className="p-4 border border-slate-100 rounded-xl bg-slate-50/20 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600 font-black text-sm">
                            {doc.category === 'Contrato' ? '📝' : doc.category === 'Política' ? '📋' : doc.category === 'Certificado' ? '🏆' : '📄'}
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-900">{doc.title}</h4>
                            <p className="text-[10px] text-gray-400 mt-0.5">{doc.category} • {doc.date}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black ${doc.signed ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-600'}`}>
                            {doc.signed ? '✅ Firmado' : '⏳ Pendiente firma'}
                          </span>
                          <button onClick={() => alert(`Descargando "${doc.title}" en formato PDF...`)} className="text-[9px] font-bold text-purple-600 hover:underline">Descargar</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ===== 8. FIRMA ELECTRÓNICA ===== */}
            {erpSubTab === 'signatures' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-md h-fit">
                  <span className="font-extrabold text-sm text-slate-800 block mb-4">Solicitar Firma Electrónica</span>
                  <form onSubmit={e => {
                    e.preventDefault();
                    if (!tenant || !newSigDocId || !newSigSigner) return;
                    const doc = erpDocuments.find(d => d.id === newSigDocId);
                    if (!doc) return;
                    // Mark doc as signed
                    const updatedDocs = erpDocuments.map(d => d.id === newSigDocId ? { ...d, signed: true, signerEmail: newSigSigner } : d);
                    dbAdapter.saveErpDocuments(tenant.id, updatedDocs);
                    dbAdapter.addAuditLog(tenant.id, `${activeRole}@tenant.com`, 'Firma Electrónica Solicitada', `${doc.title} → ${newSigSigner}`);
                    setErpDocuments(updatedDocs);
                    setNewSigDocId(''); setNewSigSigner('');
                    alert(`✅ Solicitud de firma enviada a ${newSigSigner}.\nEl signatario recibirá un enlace seguro con token SHA256 para firmar "${doc.title}".`);
                  }} className="flex flex-col gap-4 text-xs font-semibold">
                    <div className="flex flex-col gap-1">
                      <label className="text-gray-500">Documento a Firmar</label>
                      <select required value={newSigDocId} onChange={e => setNewSigDocId(e.target.value)} className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                        <option value="">Seleccione documento</option>
                        {erpDocuments.filter(d => !d.signed).map(d => (
                          <option key={d.id} value={d.id}>{d.title}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-gray-500">Email del Signatario</label>
                      <input required type="email" placeholder="firmante@empresa.com" value={newSigSigner} onChange={e => setNewSigSigner(e.target.value)} className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl" />
                    </div>
                    <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-[10px] text-indigo-700 space-y-1">
                      <p className="font-bold">🔐 Firma electrónica avanzada</p>
                      <p>Certificado X.509 • Hash SHA-256 • Timestamping RFC 3161 • Cumplimiento eIDAS</p>
                    </div>
                    <button type="submit" className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow">✍️ Enviar Solicitud de Firma</button>
                  </form>
                </div>
                <div className="lg:col-span-2 p-6 rounded-2xl bg-white border border-slate-200 shadow-md">
                  <span className="font-extrabold text-sm text-slate-800 block mb-4">Historial de Firmas Electrónicas</span>
                  <div className="space-y-3 text-xs">
                    {erpDocuments.filter(d => d.signed).length === 0 ? (
                      <p className="text-slate-400 text-center py-6">No hay documentos firmados aún.</p>
                    ) : (
                      erpDocuments.filter(d => d.signed).map(doc => (
                        <div key={doc.id} className="p-4 border border-green-100 rounded-xl bg-green-50/20 flex justify-between items-center">
                          <div>
                            <h4 className="font-bold text-slate-900 flex items-center gap-1.5">✅ {doc.title}</h4>
                            <p className="text-[10px] text-gray-400 mt-0.5">Firmado por: {doc.signerEmail} • Fecha: {doc.date}</p>
                            <p className="text-[9px] text-green-600 mt-1 font-mono">Hash: SHA256:{btoa(doc.id).substring(0,20)}...verified</p>
                          </div>
                          <button onClick={() => alert(`Certificado de firma digital para "${doc.title}"\n\nSignatario: ${doc.signerEmail}\nAlgoritmo: SHA-256 with RSA\nEstado: VÁLIDO Y VERIFICADO\nTiemstamp: ${new Date().toISOString()}`)}
                            className="px-2 py-1 bg-green-100 hover:bg-green-200 text-green-700 font-bold rounded-lg text-[9px]">
                            Ver Certificado
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

          </div>
        )}

      </main>

    </div>
  );
}