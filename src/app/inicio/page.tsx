'use client';

export const runtime = 'edge';

import React, { useState, useEffect } from 'react';
import { dbAdapter, type Product, type Tenant } from '@/lib/supabase';
import { 
  ShoppingBag, X, Plus, Minus, Trash2, ArrowRight, 
  Check, ShieldCheck, CreditCard, ChevronRight, Home, LayoutGrid 
} from 'lucide-react';

interface CartItem {
  product: Product;
  quantity: number;
}

export default function PublicStorefront() {
  const [products, setProducts] = useState<Product[]>([]);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const activeT = dbAdapter.getActiveTenant();
    setTenant(activeT);
    setProducts(dbAdapter.getProducts());

    // Load cart from session
    const savedCart = sessionStorage.getItem(`cart_${activeT.id}`);
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  }, []);

  // Listen to DB sync event
  useEffect(() => {
    const handleSync = () => {
      setProducts(dbAdapter.getProducts());
    };
    window.addEventListener('db-sync-complete', handleSync);
    return () => window.removeEventListener('db-sync-complete', handleSync);
  }, []);

  const saveCartToStorage = (updatedCart: CartItem[]) => {
    setCart(updatedCart);
    if (tenant) {
      sessionStorage.setItem(`cart_${tenant.id}`, JSON.stringify(updatedCart));
    }
  };

  const addToCart = (product: Product) => {
    const existing = cart.find(item => item.product.id === product.id);
    let updated: CartItem[];
    if (existing) {
      updated = cart.map(item => 
        item.product.id === product.id 
          ? { ...item, quantity: item.quantity + 1 } 
          : item
      );
    } else {
      updated = [...cart, { product, quantity: 1 }];
    }
    saveCartToStorage(updated);
    setIsCartOpen(true);
  };

  const updateQuantity = (productId: string, delta: number) => {
    const updated = cart.map(item => {
      if (item.product.id === productId) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : null;
      }
      return item;
    }).filter(Boolean) as CartItem[];
    saveCartToStorage(updated);
  };

  const removeFromCart = (productId: string) => {
    const updated = cart.filter(item => item.product.id !== productId);
    saveCartToStorage(updated);
  };

  const getCartTotal = () => {
    return cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  };

  const getCartCount = () => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  };

  const handleCheckout = async () => {
    if (cart.length === 0 || !tenant) return;
    setCheckoutLoading(true);

    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: tenant.id,
          cartItems: cart.map(item => ({
            id: item.product.id,
            name: item.product.name,
            price: item.product.price,
            quantity: item.quantity
          }))
        })
      });

      const data = await res.json();
      if (data.url) {
        // Redirigir a pasarela real de Stripe
        window.location.href = data.url;
      } else if (data.success) {
        // Simulación exitosa
        alert('¡Pago Simulado Exitosamente! Reduciendo stock y procesando automatizaciones.');
        // Descontar stock localmente
        cart.forEach(item => {
          const p = products.find(prod => prod.id === item.product.id);
          if (p) {
            dbAdapter.saveProducts(products.map(prod => 
              prod.id === item.product.id 
                ? { ...prod, stock: Math.max(0, prod.stock - item.quantity) } 
                : prod
            ));
          }
        });
        
        // Agregar logs contables y auditoría
        dbAdapter.addAuditLog(
          tenant.id,
          'tienda@SaaS.com',
          'Venta Tienda Online',
          `Compra web de ${getCartCount()} productos. Total: $${getCartTotal().toFixed(2)}`
        );

        // Limpiar carrito
        saveCartToStorage([]);
        setIsCartOpen(false);
        setCheckoutLoading(false);
        window.location.href = '/mi-cuenta';
      }
    } catch (err) {
      console.error('Checkout error:', err);
      alert('Error al iniciar el pago.');
      setCheckoutLoading(false);
    }
  };

  if (!isClient || !tenant) return null;

  const categories = ['todos', ...Array.from(new Set(products.map(p => p.category)))];
  const filteredProducts = selectedCategory === 'todos' 
    ? products 
    : products.filter(p => p.category === selectedCategory);

  return (
    <div className="w-full min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
      {/* Store Header */}
      <header className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-slate-200/80 z-40 transition-colors">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-primary-celeste" />
            <span className="font-black text-lg text-slate-800 uppercase tracking-wider">{tenant.name} Store</span>
          </div>

          <div className="flex items-center gap-4">
            <a href="/mi-cuenta" className="text-xs font-bold text-slate-600 hover:text-slate-950 transition-colors flex items-center gap-1">
              Mi Cuenta <ChevronRight className="w-3 h-3" />
            </a>
            <button 
              onClick={() => setIsCartOpen(true)}
              className="relative p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-full transition-colors flex items-center justify-center"
            >
              <ShoppingBag className="w-4 h-4" />
              {getCartCount() > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary-celeste text-white font-black text-[10px] rounded-full flex items-center justify-center animate-bounce-slow">
                  {getCartCount()}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      <section className="bg-gradient-to-br from-slate-900 to-slate-800 py-16 px-6 relative overflow-hidden text-center text-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary-celeste/20 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-3xl mx-auto relative z-10 space-y-4">
          <span className="px-3.5 py-1 bg-primary-celeste/20 text-primary-celeste border border-primary-celeste/30 rounded-full font-black text-[10px] uppercase tracking-wider">
            Catálogo Oficial {tenant.name}
          </span>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white">Nuestra Tienda Virtual</h1>
          <p className="text-sm text-slate-300 leading-relaxed max-w-xl mx-auto">Adquiere de forma directa todos nuestros productos y servicios con transacciones de seguridad garantizada.</p>
        </div>
      </section>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-6 py-12 flex-grow w-full">
        {/* Categories Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-6 scrollbar-thin">
          <LayoutGrid className="w-4 h-4 text-slate-400 mr-2 flex-shrink-0" />
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4.5 py-2.5 rounded-full text-xs font-bold capitalize transition-all border ${
                selectedCategory === cat
                  ? 'bg-slate-900 border-slate-900 text-white shadow-lg shadow-slate-900/10'
                  : 'bg-white border-slate-200/80 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {cat === 'todos' ? 'Todos los Productos' : cat}
            </button>
          ))}
        </div>

        {/* Product Grid */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-20 bg-white border border-slate-200 rounded-3xl text-slate-400">
            No se encontraron productos en esta categoría.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {filteredProducts.map((prod) => (
              <div 
                key={prod.id} 
                className="flex flex-col rounded-3xl border border-slate-200/80 bg-white shadow-sm hover:shadow-xl hover:border-celeste-claro/30 transition-all duration-300 group overflow-hidden"
              >
                <div className="relative aspect-square overflow-hidden bg-slate-50 flex items-center justify-center">
                  <img 
                    src={prod.imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500'} 
                    alt={prod.name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                  />
                  <span className="absolute top-4 left-4 px-3 py-1 bg-white/95 backdrop-blur-md text-slate-800 font-extrabold text-[10px] rounded-full border border-slate-100 shadow-sm uppercase tracking-wide">
                    {prod.category}
                  </span>
                  {prod.stock === 0 && (
                    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
                      <span className="px-4 py-2 bg-red-500 text-white font-black text-xs rounded-xl shadow-lg uppercase tracking-wider">Agotado</span>
                    </div>
                  )}
                </div>
                
                <div className="p-6 flex flex-col flex-grow">
                  <h3 className="font-bold text-slate-800 text-base leading-snug group-hover:text-primary-celeste transition-colors">{prod.name}</h3>
                  <span className="text-[10px] text-slate-400 font-mono mt-1 uppercase">Barcode: {prod.barcode}</span>
                  
                  <div className="flex items-center justify-between mt-auto pt-6 border-t border-slate-50">
                    <span className="text-xl font-black text-slate-900">${prod.price.toFixed(2)}</span>
                    {prod.stock > 0 && (
                      <button 
                        onClick={() => addToCart(prod)}
                        className="px-4 py-2.5 bg-slate-900 hover:bg-primary-celeste text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow"
                      >
                        Añadir <Plus className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Cart Drawer (Sidebar) */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
          {/* Backdrop */}
          <div 
            onClick={() => setIsCartOpen(false)}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-350" 
          />
          
          {/* Panel */}
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-slide-left border-l border-slate-100">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-primary-celeste" />
                <span className="font-black text-base text-slate-800">Tu Carrito ({getCartCount()})</span>
              </div>
              <button 
                onClick={() => setIsCartOpen(false)}
                className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Cart Items List */}
            <div className="flex-grow overflow-y-auto p-6 space-y-4">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-2">
                  <ShoppingBag className="w-12 h-12 text-slate-200" />
                  <span className="text-xs font-bold">Tu carrito está vacío.</span>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.product.id} className="flex gap-4 p-4 border border-slate-100 rounded-2xl bg-slate-50/20">
                    <img 
                      src={item.product.imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500'} 
                      alt={item.product.name} 
                      className="w-16 h-16 rounded-xl object-cover border border-slate-200 bg-slate-50" 
                    />
                    <div className="flex-grow flex flex-col">
                      <span className="font-bold text-xs text-slate-800 line-clamp-1">{item.product.name}</span>
                      <span className="font-mono font-black text-slate-900 text-sm mt-1">${item.product.price.toFixed(2)}</span>
                      
                      <div className="flex items-center justify-between mt-auto">
                        <div className="flex items-center border border-slate-250 bg-white rounded-lg p-0.5 mt-2">
                          <button 
                            onClick={() => updateQuantity(item.product.id, -1)}
                            className="p-1 text-slate-400 hover:text-slate-700"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-2 text-xs font-black text-slate-800">{item.quantity}</span>
                          <button 
                            onClick={() => updateQuantity(item.product.id, 1)}
                            className="p-1 text-slate-400 hover:text-slate-700"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <button 
                          onClick={() => removeFromCart(item.product.id)}
                          className="text-red-500 hover:text-red-700 mt-2 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Cart Footer */}
            {cart.length > 0 && (
              <div className="p-6 border-t border-slate-100 bg-slate-50/50 space-y-4">
                <div className="flex justify-between items-center text-slate-800 font-bold">
                  <span>Subtotal</span>
                  <span className="text-xl font-black text-slate-950 font-mono">${getCartTotal().toFixed(2)}</span>
                </div>
                
                <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold border-t border-slate-100 pt-3">
                  <ShieldCheck className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span>Transacción de seguridad garantizada con encriptación SSL.</span>
                </div>

                <button 
                  onClick={handleCheckout}
                  disabled={checkoutLoading}
                  className="w-full py-4 bg-slate-900 hover:bg-primary-celeste disabled:bg-slate-400 text-white font-black rounded-2xl flex items-center justify-center gap-1.5 transition-colors shadow"
                >
                  {checkoutLoading ? 'Procesando...' : (
                    <>
                      Proceder al Pago <CreditCard className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
