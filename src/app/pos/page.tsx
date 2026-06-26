'use client';

import React, { useState, useEffect } from 'react';
import { db, type LocalProduct, type LocalOrder } from '@/lib/dexie';
import { dbAdapter } from '@/lib/supabase';
import { 
  ShoppingBag, Wifi, WifiOff, RefreshCw, CreditCard, 
  DollarSign, QrCode, Search, Trash2, Plus, Minus, CheckCircle, 
  Terminal, Lock, Check, AlertCircle, Printer, X
} from 'lucide-react';

export default function POSPage() {
  // Cashier Lock & Sync States
  const [isCashierLoggedIn, setIsCashierLoggedIn] = useState(false);
  const [cashierPin, setCashierPin] = useState('');
  const [pinError, setPinError] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncPhase, setSyncPhase] = useState('Iniciando...');

  // Standard POS States
  const [products, setProducts] = useState<LocalProduct[]>([]);
  const [cart, setCart] = useState<Array<{ product: LocalProduct; quantity: number }>>([]);
  const [barcodeSearch, setBarcodeSearch] = useState('');
  const [isOnline, setIsOnline] = useState(true);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [checkoutState, setCheckoutState] = useState<'idle' | 'stripe_pairing' | 'stripe_swiping' | 'qr_display' | 'success'>('idle');
  const [pairedReader, setPairedReader] = useState(false);
  const [activeQrUrl, setActiveQrUrl] = useState('');
  
  // Printed thermal receipt state
  const [printedOrder, setPrintedOrder] = useState<LocalOrder | null>(null);

  // Initialize active tenant settings
  useEffect(() => {
    const activeTenant = dbAdapter.getActiveTenant();
    setActiveQrUrl(activeTenant.qrCodeUrl || 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=pay');
  }, []);

  // Update pending sync orders count
  const updatePendingCount = async () => {
    const pending = await db.orders.where('status').equals('pending').toArray();
    setPendingSyncCount(pending.length);
  };

  // Populate local Dexie database and set states
  const initLocalDb = async () => {
    const count = await db.products.count();
    if (count === 0) {
      const mockProds = dbAdapter.getProducts();
      await db.products.bulkAdd(mockProds.map(p => ({
        id: p.id,
        barcode: p.barcode,
        name: p.name,
        price: p.price,
        stock: p.stock,
        imageUrl: p.imageUrl,
        category: p.category
      })));
    }
    setProducts(await db.products.toArray());
    await updatePendingCount();
  };

  // Handle PIN input click
  const handlePinInput = (val: string) => {
    setPinError(false);
    if (val === 'C') {
      setCashierPin('');
      return;
    }
    if (val === '⌫') {
      setCashierPin(prev => prev.slice(0, -1));
      return;
    }
    if (cashierPin.length >= 4) return;
    const newPin = cashierPin + val;
    setCashierPin(newPin);

    // Verify PIN when length reaches 4
    if (newPin === '4321') {
      startInitialSync();
    } else if (newPin.length === 4) {
      setTimeout(() => {
        setPinError(true);
        setCashierPin('');
      }, 200);
    }
  };

  // Visual Sync Loader Sequence
  const startInitialSync = () => {
    setIsSyncing(true);
    setSyncProgress(0);
    setSyncPhase('Estableciendo túnel HTTPS seguro...');

    const phases = [
      { progress: 20, text: 'Autenticando credenciales de Cajero #1...' },
      { progress: 40, text: 'Indexando base de datos IndexedDB local...' },
      { progress: 65, text: 'Descargando catálogo de productos y precios...' },
      { progress: 85, text: 'Sincronizando pasarelas de pago y Stripe Terminal...' },
      { progress: 100, text: '¡Turno de caja abierto correctamente!' }
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < phases.length) {
        setSyncProgress(phases[currentStep].progress);
        setSyncPhase(phases[currentStep].text);
        currentStep++;
      } else {
        clearInterval(interval);
        setTimeout(async () => {
          await initLocalDb();
          setIsSyncing(false);
          setIsCashierLoggedIn(true);
        }, 500);
      }
    }, 300);
  };

  // Reload products from local DB
  const reloadLocalProducts = async () => {
    setProducts(await db.products.toArray());
  };

  // Add item to cart
  const addToCart = (product: LocalProduct) => {
    // Check local stock limit
    const cartItem = cart.find(item => item.product.id === product.id);
    const currentQty = cartItem ? cartItem.quantity : 0;
    if (currentQty >= product.stock) {
      alert(`No hay suficiente stock en caja para agregar más unidades de: ${product.name}`);
      return;
    }

    setCart((prev) => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  // Decrement/Remove from cart
  const removeFromCart = (productId: string) => {
    setCart((prev) => {
      const existing = prev.find(item => item.product.id === productId);
      if (existing && existing.quantity > 1) {
        return prev.map(item => item.product.id === productId ? { ...item, quantity: item.quantity - 1 } : item);
      }
      return prev.filter(item => item.product.id !== productId);
    });
  };

  // Handle barcode submission or text search
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeSearch) return;
    const match = products.find(p => p.barcode === barcodeSearch || p.name.toLowerCase().includes(barcodeSearch.toLowerCase()));
    if (match) {
      addToCart(match);
      setBarcodeSearch('');
    } else {
      alert('Producto no encontrado por código de barras o descripción.');
    }
  };

  const getCartTotal = () => {
    return cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  };

  // Handle network toggle button (Online / Offline mode)
  const handleNetworkToggle = async (online: boolean) => {
    setIsOnline(online);
    if (online) {
      // Automatically trigger reconciliation upon internet reconnection
      const pendingOrders = await db.orders.where('status').equals('pending').toArray();
      if (pendingOrders.length > 0) {
        setIsSyncing(true);
        setSyncProgress(0);
        setSyncPhase(`Reconexión: Sincronizando ${pendingOrders.length} transacciones...`);

        let progress = 0;
        const interval = setInterval(() => {
          progress += 25;
          setSyncProgress(progress);
          if (progress >= 100) clearInterval(interval);
        }, 150);

        setTimeout(async () => {
          const liveProducts = dbAdapter.getProducts();
          for (const order of pendingOrders) {
            // Reconcile and reduce live database stocks
            for (const item of order.items) {
              const liveProd = liveProducts.find(p => p.id === item.productId);
              if (liveProd) {
                liveProd.stock = Math.max(0, liveProd.stock - item.quantity);
              }
            }
            await db.orders.update(order.id, { status: 'synced' });
          }
          dbAdapter.saveProducts(liveProducts);
          await updatePendingCount();
          await reloadLocalProducts();
          setIsSyncing(false);
          alert(`¡Reconexión exitosa! Se han conciliado ${pendingOrders.length} transacciones con el inventario central.`);
        }, 850);
      }
    }
  };

  // Process manual order synchronization
  const handleSyncOrders = async () => {
    if (!isOnline) {
      alert('No puedes sincronizar mientras estés desconectado (Modo Offline).');
      return;
    }
    const pendingOrders = await db.orders.where('status').equals('pending').toArray();
    if (pendingOrders.length === 0) {
      alert('No hay órdenes locales pendientes de sincronizar.');
      return;
    }

    setIsSyncing(true);
    setSyncProgress(0);
    setSyncPhase('Conectando con base de datos principal...');

    const interval = setInterval(() => {
      setSyncProgress(prev => Math.min(95, prev + 15));
    }, 100);

    setTimeout(async () => {
      clearInterval(interval);
      const liveProducts = dbAdapter.getProducts();
      
      for (const order of pendingOrders) {
        // Post to real server if URL env var is present
        if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('TU_PROJECT_ID')) {
          try {
            await fetch('/api/orders', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                tenantId: order.tenantId,
                items: order.items,
                total: order.total,
                paymentMethod: order.paymentMethod,
              })
            });
          } catch (err) {
            console.error('Failed to sync order to Supabase:', err);
          }
        }

        for (const item of order.items) {
          const liveProd = liveProducts.find(p => p.id === item.productId);
          if (liveProd) {
            liveProd.stock = Math.max(0, liveProd.stock - item.quantity);
          }
        }
        await db.orders.update(order.id, { status: 'synced' });
      }
      
      dbAdapter.saveProducts(liveProducts);
      await updatePendingCount();
      await reloadLocalProducts();
      setIsSyncing(false);
      alert(`¡Sincronización exitosa! ${pendingOrders.length} órdenes enviadas a la nube. Inventario central actualizado.`);
    }, 1000);
  };

  // Complete checkout order
  const handleCheckout = async (method: 'cash' | 'card' | 'qr') => {
    if (cart.length === 0) return;
    
    if (method === 'card' && !pairedReader) {
      setCheckoutState('stripe_pairing');
      setTimeout(() => {
        setPairedReader(true);
        setCheckoutState('stripe_swiping');
        setTimeout(() => {
          completeOrder(method);
        }, 2000);
      }, 1500);
      return;
    }

    if (method === 'qr') {
      setCheckoutState('qr_display');
      setTimeout(() => {
        completeOrder(method);
      }, 2000);
      return;
    }

    completeOrder(method);
  };

  const completeOrder = async (method: 'cash' | 'card' | 'qr') => {
    const activeTenant = dbAdapter.getActiveTenant();
    const newOrder: LocalOrder = {
      id: 'ord-' + Date.now().toString().slice(-6),
      tenantId: activeTenant.id,
      items: cart.map(item => ({
        productId: item.product.id,
        name: item.product.name,
        quantity: item.quantity,
        price: item.product.price
      })),
      total: getCartTotal(),
      paymentMethod: method,
      status: isOnline ? 'synced' : 'pending',
      createdAt: Date.now()
    };

    // 1. Add order to local IndexedDB
    await db.orders.add(newOrder);

    // 2. Decrement inventory stock inside local IndexedDB
    for (const item of cart) {
      const dbProd = await db.products.get(item.product.id);
      if (dbProd) {
        const newStock = Math.max(0, dbProd.stock - item.quantity);
        await db.products.update(item.product.id, { stock: newStock });
      }
    }

    // 3. Decrement inventory stock inside central database adapter immediately if online
    if (isOnline) {
      const liveProducts = dbAdapter.getProducts();
      for (const item of cart) {
        const liveProd = liveProducts.find(p => p.id === item.product.id);
        if (liveProd) {
          liveProd.stock = Math.max(0, liveProd.stock - item.quantity);
        }
      }
      dbAdapter.saveProducts(liveProducts);

      // Async fetch to process order in real Supabase database if configured
      if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('TU_PROJECT_ID')) {
        fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tenantId: activeTenant.id,
            items: cart.map(item => ({
              productId: item.product.id,
              name: item.product.name,
              quantity: item.quantity,
              price: item.product.price
            })),
            total: getCartTotal(),
            paymentMethod: method,
            cashTendered: method === 'cash' ? getCartTotal() : undefined,
            changeGiven: method === 'cash' ? 0 : undefined
          })
        }).catch(err => console.error('Error posting order to Supabase:', err));
      }
    }

    // Set printed order to display the thermal receipt modal
    setPrintedOrder(newOrder);

    // Clear cart and reset states
    setCart([]);
    setCheckoutState('success');
    await updatePendingCount();
    await reloadLocalProducts();

    setTimeout(() => {
      setCheckoutState('idle');
    }, 2000);
  };

  // Render Cashier Lockscreen / PIN Dialer
  if (!isCashierLoggedIn) {
    return (
      <div className="w-full min-h-[calc(100vh-3rem)] bg-slate-950 flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans select-none">
        
        {/* Abstract Background Accents */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
          <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-primary-celeste filter blur-3xl"></div>
          <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-celeste-claro filter blur-3xl"></div>
        </div>

        {/* Sync / Reconnecting Progress Overlay */}
        {isSyncing ? (
          <div className="z-10 bg-slate-900/90 border border-slate-800 p-8 rounded-3xl shadow-2xl max-w-sm w-full text-center flex flex-col items-center gap-6 backdrop-blur-xl">
            <RefreshCw className="w-10 h-10 text-primary-celeste animate-spin" />
            <div>
              <h3 className="text-white font-extrabold text-sm uppercase tracking-wider">Inicializando Caja Registradora</h3>
              <p className="text-xs text-slate-400 mt-1.5 min-h-[1.5rem] font-medium">{syncPhase}</p>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
              <div 
                className="bg-gradient-to-r from-primary-celeste to-celeste-claro h-full rounded-full transition-all duration-300 shadow-[0_0_8px_rgba(188,230,237,0.5)]" 
                style={{ width: `${syncProgress}%` }}
              ></div>
            </div>
            <span className="font-mono text-xs font-bold text-primary-celeste">{syncProgress}%</span>
          </div>
        ) : (
          
          /* PIN Dialer Card */
          <div className="z-10 bg-slate-900/90 border border-slate-800 p-8 rounded-3xl shadow-2xl max-w-sm w-full text-center backdrop-blur-xl flex flex-col gap-6">
            <div className="flex flex-col items-center gap-2">
              <div className="p-3 bg-slate-800/80 rounded-2xl border border-slate-700 text-primary-celeste">
                <Lock className="w-6 h-6" />
              </div>
              <h2 className="text-white font-black text-lg mt-1">Control de Acceso POS</h2>
              <p className="text-xs text-slate-400 px-4">Ingrese su PIN de seguridad para iniciar el turno de facturación local.</p>
            </div>

            {/* PIN Entry Display */}
            <div className="flex flex-col items-center gap-2">
              <div className="flex justify-center gap-4 py-2">
                {[0, 1, 2, 3].map((idx) => {
                  const hasVal = cashierPin.length > idx;
                  return (
                    <div 
                      key={idx}
                      className={`w-4 h-4 rounded-full border-2 transition-all duration-150 ${
                        hasVal 
                          ? 'bg-primary-celeste border-primary-celeste scale-110 shadow-[0_0_8px_rgba(188,230,237,0.4)]' 
                          : 'border-slate-700 bg-transparent'
                      }`}
                    ></div>
                  );
                })}
              </div>
              
              {pinError && (
                <span className="text-[10px] text-red-400 font-extrabold flex items-center gap-1 mt-1 animate-pulse">
                  <AlertCircle className="w-3.5 h-3.5" /> PIN incorrecto. Intente de nuevo.
                </span>
              )}
            </div>

            {/* Numpad Grid */}
            <div className="grid grid-cols-3 gap-3 max-w-[240px] mx-auto">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map((btn) => (
                <button
                  key={btn}
                  onClick={() => handlePinInput(btn)}
                  type="button"
                  className={`w-14 h-14 rounded-full flex items-center justify-center font-bold text-sm transition-all border ${
                    btn === 'C' || btn === '⌫'
                      ? 'border-slate-800 bg-slate-800/40 text-slate-400 hover:bg-slate-800/80 hover:text-white'
                      : 'border-slate-800 bg-slate-800 hover:bg-slate-700/80 text-white'
                  }`}
                >
                  {btn}
                </button>
              ))}
            </div>

            {/* Hint Box */}
            <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-3 text-[10px] text-slate-400 text-left leading-relaxed">
              <span className="font-extrabold text-primary-celeste uppercase block mb-1">🔑 Acceso Rápido de Demostración</span>
              Use el PIN de caja autorizado <code className="font-mono font-bold text-white px-1.5 py-0.5 bg-slate-800 rounded">4321</code> para abrir el catálogo e IndexedDB.
            </div>

          </div>
        )}

      </div>
    );
  }

  // Active cashier username & active tenant name
  const activeTenant = dbAdapter.getActiveTenant();

  return (
    <div className="w-full min-h-[calc(100vh-3rem)] bg-gray-50 flex flex-col overflow-hidden text-slate-800 relative">
      
      {/* Visual Sync Loader Sequence while reconciling/syncing in page */}
      {isSyncing && (
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-slate-950 border border-slate-800 p-8 rounded-3xl shadow-2xl max-w-sm w-full text-center flex flex-col items-center gap-6">
            <RefreshCw className="w-10 h-10 text-primary-celeste animate-spin" />
            <div>
              <h3 className="text-white font-extrabold text-sm uppercase tracking-wider">Turno POS Sincronizando</h3>
              <p className="text-xs text-slate-400 mt-1">{syncPhase}</p>
            </div>
            <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
              <div 
                className="bg-primary-celeste h-full rounded-full transition-all duration-300" 
                style={{ width: `${syncProgress}%` }}
              ></div>
            </div>
            <span className="font-mono text-xs font-bold text-primary-celeste">{syncProgress}%</span>
          </div>
        </div>
      )}

      {/* POS Top Control Panel */}
      <header className="h-14 bg-white border-b border-gray-200 px-6 flex items-center justify-between z-10 shrink-0 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-1.5 bg-celeste-claro/20 rounded-lg text-primary-celeste">
            <ShoppingBag className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm font-black text-slate-900 leading-tight">Caja Registradora POS</h1>
            <span className="text-[10px] text-gray-400 font-bold block">{activeTenant.name}</span>
          </div>
        </div>

        {/* Network Toggle Buttons */}
        <div className="flex items-center gap-3">
          <div className="flex items-center p-0.5 bg-gray-100 rounded-full border border-gray-200 text-xs">
            <button 
              onClick={() => handleNetworkToggle(true)}
              className={`px-4 py-1.5 rounded-full flex items-center gap-1.5 font-bold transition-all ${isOnline ? 'bg-white text-green-600 shadow' : 'text-gray-400'}`}
            >
              <Wifi className="w-3.5 h-3.5" /> Modo Online
            </button>
            <button 
              onClick={() => handleNetworkToggle(false)}
              className={`px-4 py-1.5 rounded-full flex items-center gap-1.5 font-bold transition-all ${!isOnline ? 'bg-red-500 text-white shadow' : 'text-gray-400'}`}
            >
              <WifiOff className="w-3.5 h-3.5" /> Modo Offline
            </button>
          </div>

          {/* Sync Button */}
          {pendingSyncCount > 0 && (
            <button 
              onClick={handleSyncOrders}
              className="px-4 py-1.5 bg-yellow-500 hover:bg-yellow-600 text-white rounded-full font-bold text-xs flex items-center gap-1.5 shadow"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Sincronizar ({pendingSyncCount})
            </button>
          )}
        </div>
      </header>

      {/* POS Workspace Layout */}
      <div className="flex-grow flex w-full overflow-hidden">
        
        {/* LEFT COMPONENT: Catalog Grid & Scanner Input */}
        <div className="flex-grow flex flex-col p-6 overflow-hidden">
          
          {/* Scanner Input Form */}
          <form onSubmit={handleBarcodeSubmit} className="relative mb-6 shrink-0">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Escanea el código de barras o busca por nombre..."
              value={barcodeSearch}
              onChange={(e) => setBarcodeSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-xs font-semibold shadow-sm focus:ring-1 focus:ring-primary-celeste"
            />
          </form>

          {/* Products Grid */}
          <div className="flex-grow overflow-y-auto pr-2">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {products.map((p) => {
                const cartItem = cart.find(item => item.product.id === p.id);
                const currentQty = cartItem ? cartItem.quantity : 0;
                const remainingStock = Math.max(0, p.stock - currentQty);

                return (
                  <div 
                    key={p.id} 
                    onClick={() => {
                      if (remainingStock > 0) addToCart(p);
                    }}
                    className={`p-4 bg-white border rounded-2xl shadow-sm hover:border-primary-celeste hover:shadow cursor-pointer transition-all flex flex-col justify-between relative ${
                      remainingStock === 0 ? 'opacity-60 border-red-200 hover:border-red-200' : 'border-gray-200'
                    }`}
                  >
                    <img src={p.imageUrl} alt={p.name} className="w-full h-32 object-cover rounded-xl mb-4" />
                    <div>
                      <h3 className="font-extrabold text-xs text-slate-900 leading-snug line-clamp-2">{p.name}</h3>
                      <div className="flex items-center justify-between mt-4">
                        <span className="font-black text-sm text-slate-900">${p.price.toFixed(2)}</span>
                        <div className="text-right">
                          <span className="text-[10px] text-gray-400 font-mono block">BC: {p.barcode.slice(-4)}</span>
                          <span className={`text-[9px] font-black uppercase tracking-wider block ${
                            remainingStock === 0 ? 'text-red-500' : 'text-primary-celeste'
                          }`}>
                            {remainingStock === 0 ? 'Agotado' : `Stock: ${remainingStock}`}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT SIDEBAR: Receipt Cart & Checkout Panel */}
        <aside className="w-96 border-l border-gray-200 bg-white flex flex-col overflow-hidden shrink-0">
          
          <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between shrink-0">
            <span className="font-extrabold text-xs uppercase tracking-wider text-slate-800">Detalle de Compra</span>
            <span className="text-xs text-gray-400 font-black">{cart.reduce((sum, i) => sum + i.quantity, 0)} items</span>
          </div>

          {/* Cart items list */}
          <div className="flex-grow overflow-y-auto p-4 flex flex-col gap-3">
            {cart.length === 0 ? (
              <div className="my-auto text-center text-gray-400 flex flex-col items-center gap-2">
                <ShoppingBag className="w-10 h-10 text-primary-celeste opacity-40 animate-pulse" />
                <span className="font-bold text-xs">El carrito está vacío</span>
                <p className="text-[10px] text-gray-400 max-w-[150px] mx-auto leading-relaxed">Selecciona artículos del catálogo o escanea con el lector.</p>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.product.id} className="flex justify-between items-center p-3 border border-gray-100 rounded-xl bg-gray-50/50">
                  <div className="max-w-[150px]">
                    <span className="font-bold text-xs text-slate-900 block truncate">{item.product.name}</span>
                    <span className="text-[10px] text-gray-400 mt-0.5 block">${item.product.price.toFixed(2)} c/u</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => removeFromCart(item.product.id)}
                      className="p-1 rounded bg-white border border-gray-200 hover:bg-red-50 text-red-500"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="font-bold text-xs w-4 text-center">{item.quantity}</span>
                    <button 
                      onClick={() => addToCart(item.product)}
                      className="p-1 rounded bg-white border border-gray-200 hover:bg-green-50 text-green-500"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Checkout overlay states */}
          {checkoutState !== 'idle' && (
            <div className="p-4 border-t border-gray-200 bg-slate-900 text-white flex flex-col items-center justify-center gap-4 text-center shrink-0">
              
              {checkoutState === 'stripe_pairing' && (
                <div className="py-4">
                  <RefreshCw className="w-8 h-8 text-primary-celeste animate-spin mx-auto mb-2" />
                  <span className="font-extrabold text-xs text-primary-celeste block">Stripe Terminal SDK</span>
                  <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">Vinculando lector de tarjetas WisePOS E...</p>
                </div>
              )}

              {checkoutState === 'stripe_swiping' && (
                <div className="py-4">
                  <CreditCard className="w-8 h-8 text-primary-celeste animate-pulse mx-auto mb-2" />
                  <span className="font-extrabold text-xs text-primary-celeste block">Esperando Transacción</span>
                  <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">Por favor deslice o acerque la tarjeta en el lector.</p>
                </div>
              )}

              {checkoutState === 'qr_display' && (
                <div className="py-2 flex flex-col items-center">
                  <div className="p-2 bg-white rounded-xl shadow mb-2">
                    <img src={activeQrUrl} alt="Bank QR Code" className="w-28 h-28" />
                  </div>
                  <span className="font-extrabold text-xs text-primary-celeste block">Módulo de Pago QR Activo</span>
                  <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">Escanea y transfiere. Esperando validación automática...</p>
                </div>
              )}

              {checkoutState === 'success' && (
                <div className="py-6">
                  <CheckCircle className="w-10 h-10 text-green-400 mx-auto mb-2 animate-bounce" />
                  <span className="font-extrabold text-sm text-green-400 block">Venta Procesada</span>
                  <p className="text-[10px] text-slate-400 mt-1">Suscripción/Venta guardada localmente.</p>
                </div>
              )}

            </div>
          )}

          {/* Total & checkout controls */}
          {checkoutState === 'idle' && (
            <div className="p-6 border-t border-gray-200 bg-gray-50 flex flex-col gap-4 shrink-0">
              <div className="flex justify-between items-center font-black text-slate-900">
                <span className="text-xs uppercase text-slate-400 font-bold">Total a Pagar:</span>
                <span className="text-2xl font-black">${getCartTotal().toFixed(2)}</span>
              </div>
              
              <div className="grid grid-cols-3 gap-2 mt-2">
                <button 
                  onClick={() => handleCheckout('cash')}
                  disabled={cart.length === 0}
                  className="py-3 px-1.5 bg-slate-900 hover:bg-slate-950 disabled:opacity-40 text-white font-bold rounded-xl text-xs flex flex-col items-center justify-center gap-1.5 shadow"
                >
                  <DollarSign className="w-4 h-4 text-green-400" />
                  <span>Efectivo</span>
                </button>
                <button 
                  onClick={() => handleCheckout('card')}
                  disabled={cart.length === 0}
                  className="py-3 px-1.5 bg-slate-900 hover:bg-slate-950 disabled:opacity-40 text-white font-bold rounded-xl text-xs flex flex-col items-center justify-center gap-1.5 shadow"
                >
                  <CreditCard className="w-4 h-4 text-primary-celeste" />
                  <span>Stripe</span>
                </button>
                <button 
                  onClick={() => handleCheckout('qr')}
                  disabled={cart.length === 0}
                  className="py-3 px-1.5 bg-slate-900 hover:bg-slate-950 disabled:opacity-40 text-white font-bold rounded-xl text-xs flex flex-col items-center justify-center gap-1.5 shadow"
                >
                  <QrCode className="w-4 h-4 text-yellow-400" />
                  <span>Pago QR</span>
                </button>
              </div>
            </div>
          )}

        </aside>

      </div>

      {/* PHYSICAL THERMAL RECEIPT MODAL OVERLAY */}
      {printedOrder && (
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="flex flex-col items-center gap-4 animate-scale-up">
            
            {/* The Thermal Ticket */}
            <div className="bg-white text-slate-900 p-6 rounded-2xl w-80 shadow-2xl font-mono text-xs flex flex-col border border-gray-200 border-t-8 border-t-primary-celeste relative">
              
              {/* Paper tear visual design */}
              <div className="absolute -top-3 left-0 right-0 flex justify-between overflow-hidden h-2.5 opacity-25">
                {Array.from({ length: 16 }).map((_, i) => (
                  <div key={i} className="w-4 h-4 bg-gray-300 rounded-full flex-shrink-0 -mt-2"></div>
                ))}
              </div>

              {/* Logo / Header */}
              <div className="text-center flex flex-col items-center gap-1.5 mt-2">
                <ShoppingBag className="w-6 h-6 text-primary-celeste" />
                <h3 className="font-extrabold uppercase tracking-wider text-sm">{activeTenant.name}</h3>
                <span className="text-[10px] text-gray-500 font-sans font-bold">{activeTenant.customDomain || `${activeTenant.subdomain}.tusaas.com`}</span>
              </div>

              <div className="my-3 border-b border-dashed border-gray-300"></div>

              {/* Order Meta details */}
              <div className="flex flex-col gap-1 text-[10px] text-gray-600">
                <div className="flex justify-between">
                  <span>TRANSACCIÓN ID:</span>
                  <span className="font-bold text-slate-900">{printedOrder.id}</span>
                </div>
                <div className="flex justify-between">
                  <span>FECHA:</span>
                  <span>{new Date(printedOrder.createdAt).toLocaleDateString()} {new Date(printedOrder.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="flex justify-between">
                  <span>ESTADO CONEXIÓN:</span>
                  <span className={`font-black ${printedOrder.status === 'synced' ? 'text-green-600' : 'text-amber-600'}`}>
                    {printedOrder.status === 'synced' ? 'ONLINE (Sincronizado)' : 'OFFLINE (Pendiente)'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>CAJERO:</span>
                  <span>Terminal POS #1 (PIN: 4321)</span>
                </div>
              </div>

              <div className="my-3 border-b border-dashed border-gray-300"></div>

              {/* Items Table */}
              <div className="flex flex-col gap-2">
                <div className="grid grid-cols-12 font-bold text-[10px] text-gray-400">
                  <span className="col-span-2 text-left">CANT</span>
                  <span className="col-span-6 text-left">DESCRIPCIÓN</span>
                  <span className="col-span-4 text-right">TOTAL</span>
                </div>
                {printedOrder.items.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-12 items-start text-[11px] text-slate-800">
                    <span className="col-span-2 text-left">{item.quantity}x</span>
                    <span className="col-span-6 text-left leading-tight truncate">{item.name}</span>
                    <span className="col-span-4 text-right font-bold">${(item.quantity * item.price).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="my-3 border-b border-dashed border-gray-300"></div>

              {/* Financial Summary */}
              <div className="flex flex-col gap-1.5 text-xs">
                <div className="flex justify-between text-[11px] text-gray-500">
                  <span>Subtotal:</span>
                  <span>${(printedOrder.total * 0.87).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[11px] text-gray-500">
                  <span>IVA Simulado (13%):</span>
                  <span>${(printedOrder.total * 0.13).toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-black text-sm text-slate-900 pt-1">
                  <span>TOTAL NETO:</span>
                  <span>${printedOrder.total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[10px] text-slate-500 uppercase font-bold tracking-wider pt-0.5">
                  <span>MÉTODO DE PAGO:</span>
                  <span className="font-extrabold text-slate-900">{printedOrder.paymentMethod}</span>
                </div>
              </div>

              <div className="my-4 border-b border-dashed border-gray-300"></div>

              {/* Barcode Visual Representation */}
              <div className="flex flex-col items-center gap-1.5">
                <div className="h-7 w-48 bg-slate-950 flex items-center justify-around px-2 py-1 select-none">
                  {Array.from({ length: 32 }).map((_, i) => {
                    const width = (i % 3 === 0 || i % 7 === 0) ? 'w-1' : 'w-0.5';
                    const opacity = i % 5 === 0 ? 'opacity-20' : 'opacity-100';
                    return <div key={i} className={`h-full bg-white ${width} ${opacity}`}></div>;
                  })}
                </div>
                <span className="font-mono text-[9px] tracking-widest text-gray-400 font-bold">{printedOrder.id.toUpperCase()}</span>
              </div>

              <div className="text-center mt-4 text-[10px] text-gray-400 leading-snug font-sans font-bold">
                ¡Gracias por su compra en el SaaS!<br />
                Turno de Caja Sincronizado.
              </div>

            </div>

            {/* Print and Close controls */}
            <div className="flex gap-3 w-full justify-center">
              <button
                onClick={() => {
                  alert('Imprimiendo recibo térmico de 80mm en BBPOS WisePOS...');
                }}
                className="py-2.5 px-4 bg-primary-celeste hover:bg-celeste-claro/80 text-white font-extrabold rounded-xl text-xs flex items-center gap-1.5 shadow-lg"
              >
                <Printer className="w-3.5 h-3.5" /> Imprimir Ticket
              </button>
              <button
                onClick={() => setPrintedOrder(null)}
                className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-white font-extrabold rounded-xl text-xs flex items-center gap-1.5 shadow-lg border border-slate-700"
              >
                <X className="w-3.5 h-3.5" /> Cerrar Vista
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}