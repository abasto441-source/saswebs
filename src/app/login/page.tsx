'use client';

import React, { useState, useEffect } from 'react';
import { Shield, BookOpen, ShoppingBag, ArrowRight, Eye, EyeOff, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 2FA
  const [show2fa, setShow2fa] = useState(false);
  const [code2fa, setCode2fa] = useState('');

  // Registration
  const [companyName, setCompanyName] = useState('');
  const [subdomain, setSubdomain] = useState('');
  const [businessType, setBusinessType] = useState<'education' | 'tech'>('education');
  const [plan, setPlan] = useState<'Starter' | 'Pro' | 'Enterprise'>('Pro');

  const hasSupabase = !!process.env.NEXT_PUBLIC_SUPABASE_URL;

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('register') === 'true') setIsRegister(true);
      if (params.get('subdomain')) setSubdomain(params.get('subdomain')!);
      if (params.get('company')) setCompanyName(params.get('company')!);
      if (params.get('plan')) setPlan(params.get('plan') as any);
    }
  }, []);

  // --- REAL LOGIN (Supabase) ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (hasSupabase) {
        // Real auth via API route
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.error || 'Email o contraseña incorrectos');
          setLoading(false);
          return;
        }

        // Store session info for client-side use
        if (typeof window !== 'undefined') {
          localStorage.setItem('saswebs_user', JSON.stringify(data.user));
          localStorage.setItem('saswebs_role', data.user.role);
          if (data.user.tenantId) {
            localStorage.setItem('mock_active_tenant_id', data.user.tenantId);
          }
        }

        window.location.href = data.redirect || '/dashboard';

      } else {
        // FALLBACK: Demo mode (no Supabase configured)
        if (email === 'superadmin@nram360.com') {
          setShow2fa(true);
          setLoading(false);
          return;
        }
        // Any email → dashboard in demo mode
        window.location.href = '/dashboard';
      }
    } catch (err) {
      setError('Error de conexión. Intenta de nuevo.');
      setLoading(false);
    }
  };

  // --- 2FA verification (demo mode only) ---
  const handleVerify2fa = (e: React.FormEvent) => {
    e.preventDefault();
    if (code2fa.trim() === '123456') {
      window.location.href = '/admin';
    } else {
      setError('Código incorrecto. Demo: 123456');
    }
  };

  // --- REAL REGISTER (Supabase) ---
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!companyName || !subdomain || !email || !password) {
      setError('Completa todos los campos');
      return;
    }

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    setLoading(true);

    try {
      if (hasSupabase) {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            password,
            name: companyName,
            companyName,
            subdomain,
            plan,
            businessType,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.error || 'Error al registrar');
          setLoading(false);
          return;
        }

        // Auto-login after register
        const loginRes = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        const loginData = await loginRes.json();

        if (loginData.user) {
          localStorage.setItem('saswebs_user', JSON.stringify(loginData.user));
          localStorage.setItem('saswebs_role', loginData.user.role);
          if (loginData.user.tenantId) {
            localStorage.setItem('mock_active_tenant_id', loginData.user.tenantId);
          }
        }

        window.location.href = '/dashboard';

      } else {
        // FALLBACK: Demo mode
        const { dbAdapter } = await import('@/lib/supabase');
        const tenants = dbAdapter.getTenants();
        const newTenant = {
          id: 't-' + Date.now(),
          name: companyName,
          subdomain: subdomain.toLowerCase().trim(),
          plan,
          status: 'active' as const,
          isLmsEnabled: businessType === 'education',
          isEcommerceEnabled: true,
          isPosEnabled: true,
          isQrPaymentEnabled: false,
          isReservasEnabled: false,
          themeDarkMode: false,
          expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        };
        tenants.push(newTenant);
        dbAdapter.saveTenants(tenants);
        dbAdapter.setActiveTenantId(newTenant.id);
        window.location.href = '/dashboard';
      }
    } catch (err) {
      setError('Error de conexión. Intenta de nuevo.');
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50/30 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Card */}
        <div className="bg-white border border-slate-200 rounded-3xl shadow-xl p-8 relative overflow-hidden">
          <div className="absolute -top-16 -right-16 w-40 h-40 bg-cyan-400/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-slate-900/5 rounded-full blur-2xl pointer-events-none" />

          {/* Logo */}
          <div className="text-center mb-8 relative">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-slate-900 mb-4 shadow-lg">
              <span className="text-2xl font-black text-cyan-400">S</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">SASWEBS</h1>
            <p className="text-xs text-slate-400 mt-1 font-medium">
              {isRegister ? 'Crear nueva empresa en la plataforma' : 'Acceso unificado a tu panel'}
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-semibold">
              ⚠️ {error}
            </div>
          )}

          {/* 2FA form */}
          {show2fa ? (
            <form onSubmit={handleVerify2fa} className="flex flex-col gap-4">
              <div className="p-4 bg-cyan-50 border border-cyan-200 rounded-xl text-xs text-slate-700 leading-relaxed">
                <span className="font-black text-slate-900 block mb-1">🔐 Verificación 2FA requerida</span>
                Ingresa el código de 6 dígitos de tu app autenticadora.
                {!hasSupabase && <span className="block mt-1 text-cyan-700 font-bold">Demo: 123456</span>}
              </div>
              <input
                required
                type="text"
                maxLength={6}
                placeholder="000000"
                value={code2fa}
                onChange={e => { setCode2fa(e.target.value); setError(''); }}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-center font-mono text-xl tracking-widest focus:outline-none focus:ring-2 focus:ring-cyan-400"
              />
              <button type="submit" className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-cyan-500 hover:text-slate-900 transition-colors flex items-center justify-center gap-2">
                Verificar <Shield className="w-4 h-4" />
              </button>
              <button type="button" onClick={() => { setShow2fa(false); setCode2fa(''); setError(''); }} className="text-center text-sm text-slate-400 hover:text-slate-700 font-semibold mt-2">
                ← Volver
              </button>
            </form>

          ) : !isRegister ? (
            /* LOGIN FORM */
            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Correo Electrónico</label>
                <input
                  required type="email"
                  placeholder="tu@empresa.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Contraseña</label>
                <div className="relative">
                  <input
                    required type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full px-4 py-3 pr-12 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 transition-all"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {!hasSupabase && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[10px] text-amber-700 font-semibold leading-relaxed">
                  🔧 <strong>Modo Demo:</strong> Usa <code>superadmin@nram360.com</code> para Super Admin, o cualquier email para el Dashboard.
                </div>
              )}

              <button type="submit" disabled={loading}
                className="w-full py-3.5 bg-slate-900 text-white font-bold rounded-xl mt-2 hover:bg-cyan-500 hover:text-slate-900 transition-all flex items-center justify-center gap-2 disabled:opacity-60">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                {loading ? 'Verificando...' : 'Ingresar'}
              </button>

              <button type="button" onClick={() => { setIsRegister(true); setError(''); }}
                className="text-center text-sm text-cyan-600 hover:text-cyan-800 font-semibold mt-1">
                ¿No tienes cuenta? → Registrar Empresa
              </button>
            </form>

          ) : (
            /* REGISTER FORM */
            <form onSubmit={handleRegister} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Nombre de la Empresa</label>
                  <input required type="text" placeholder="Ej. Academia Digital"
                    value={companyName} onChange={e => setCompanyName(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400" />
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Subdominio</label>
                  <div className="flex items-center gap-1">
                    <input required type="text" placeholder="mi-empresa"
                      value={subdomain} onChange={e => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                      className="flex-1 px-4 py-3 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-cyan-400" />
                    <span className="text-[10px] text-slate-400 font-mono whitespace-nowrap">.nram360.com</span>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Email</label>
                  <input required type="email" placeholder="admin@empresa.com"
                    value={email} onChange={e => setEmail(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Contraseña</label>
                  <input required type="password" placeholder="Min 8 chars"
                    value={password} onChange={e => setPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400" />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Plan</label>
                <select value={plan} onChange={e => setPlan(e.target.value as any)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400">
                  <option value="Starter">Starter — $49/mes · POS + Builder</option>
                  <option value="Pro">Pro — $99/mes · + LMS + Reservas + CRM ⭐</option>
                  <option value="Enterprise">Enterprise — $199/mes · + Franquicias + Auditoría</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Tipo de Negocio</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { val: 'education', label: '🎓 Academia / LMS', icon: BookOpen },
                    { val: 'tech', label: '🛍️ Ventas / POS', icon: ShoppingBag },
                  ].map(opt => (
                    <button key={opt.val} type="button" onClick={() => setBusinessType(opt.val as any)}
                      className={`p-3 border rounded-xl flex flex-col items-center gap-1.5 text-xs font-bold transition-all ${businessType === opt.val ? 'border-cyan-400 bg-cyan-50 text-slate-900' : 'border-slate-200 text-slate-400 hover:border-slate-300'}`}>
                      <opt.icon className="w-5 h-5" />
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="w-full py-3.5 bg-slate-900 text-white font-bold rounded-xl mt-1 hover:bg-cyan-500 hover:text-slate-900 transition-all flex items-center justify-center gap-2 disabled:opacity-60">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                {loading ? 'Creando empresa...' : 'Registrar y Activar'}
              </button>

              <button type="button" onClick={() => { setIsRegister(false); setError(''); }}
                className="text-center text-sm text-cyan-600 hover:text-cyan-800 font-semibold">
                ← Ya tengo cuenta
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-[10px] text-slate-400 mt-6">
          © 2026 SASWEBS · saswebs.nram360.com · Plataforma SaaS Multi-Tenant
        </p>
      </div>
    </div>
  );
}