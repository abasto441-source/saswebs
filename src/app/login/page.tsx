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

  // Tab login vs traditional login mode
  const [loginMode, setLoginMode] = useState<'tabs' | 'traditional'>('tabs');
  const [activeRoleIndex, setActiveRoleIndex] = useState(0);

  // 2FA
  const [show2fa, setShow2fa] = useState(false);
  const [code2fa, setCode2fa] = useState('');

  // Registration
  const [companyName, setCompanyName] = useState('');
  const [subdomain, setSubdomain] = useState('');
  const [businessType, setBusinessType] = useState<'education' | 'tech'>('education');
  const [plan, setPlan] = useState<'Starter' | 'Pro' | 'Enterprise'>('Pro');

  const hasSupabase = !!process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('TU_PROJECT_ID');

  const systemRoles = [
    {
      id: 'super_admin',
      name: 'Super Admin',
      email: 'superadmin@nram360.com',
      password: 'Nram2026!',
      desc: 'Administrador global del SaaS. Accede al panel de control general para gestionar empresas, subdominios y planes.',
      redirect: '/admin',
      badge: 'Plataforma SaaS',
      icon: Shield,
      color: 'from-purple-500/20 to-indigo-500/20 border-purple-200/60 dark:border-purple-800/40 text-purple-700 dark:text-purple-300'
    },
    {
      id: 'owner',
      name: 'Dueño (Owner)',
      email: 'owner@nram360.com',
      password: 'Nram2026!',
      desc: 'Dueño de la empresa demo (Celeste S.A.). Acceso administrativo total al dashboard, facturación y reportes.',
      redirect: '/dashboard',
      badge: 'Empresa Celeste S.A.',
      icon: Shield,
      color: 'from-cyan-500/20 to-blue-500/20 border-cyan-200/60 dark:border-cyan-800/40 text-cyan-700 dark:text-cyan-300'
    },
    {
      id: 'manager',
      name: 'Gerente (Manager)',
      email: 'manager@nram360.com',
      password: 'Nram2026!',
      desc: 'Gerente general de la empresa. Gestión operativa diaria de productos, inventarios, cursos y clientes.',
      redirect: '/dashboard',
      badge: 'Empresa Celeste S.A.',
      icon: Shield,
      color: 'from-teal-500/20 to-emerald-500/20 border-teal-200/60 dark:border-teal-800/40 text-teal-700 dark:text-teal-300'
    },
    {
      id: 'pos',
      name: 'Cajero (POS)',
      email: 'cajero@nram360.com',
      password: 'Nram2026!',
      desc: 'Operador de caja de sucursal. Interfaz rápida de ventas POS, boletas y stock optimizada con sincronización.',
      redirect: '/pos',
      badge: 'POS / Ventas Caja',
      icon: ShoppingBag,
      color: 'from-amber-500/20 to-orange-500/20 border-amber-200/60 dark:border-amber-800/40 text-amber-700 dark:text-amber-300'
    },
    {
      id: 'student',
      name: 'Alumno (Student)',
      email: 'alumno@nram360.com',
      password: 'Nram2026!',
      desc: 'Cliente final o estudiante. Tienda storefront para comprar cursos, reproducir lecciones y ver certificados.',
      redirect: '/mi-cuenta',
      badge: 'Plataforma Académica',
      icon: BookOpen,
      color: 'from-pink-500/20 to-rose-500/20 border-pink-200/60 dark:border-pink-800/40 text-pink-700 dark:text-pink-300'
    }
  ];

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('register') === 'true') setIsRegister(true);
      if (params.get('subdomain')) setSubdomain(params.get('subdomain')!);
      if (params.get('company')) setCompanyName(params.get('company')!);
      if (params.get('plan')) setPlan(params.get('plan') as any);
    }
  }, []);

  // Set default credentials on load
  useEffect(() => {
    if (systemRoles[activeRoleIndex]) {
      setEmail(systemRoles[activeRoleIndex].email);
      setPassword(systemRoles[activeRoleIndex].password);
    }
  }, [activeRoleIndex]);

  // --- AUTO LOGIN ACTION ---
  const handleAutoLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const role = systemRoles[activeRoleIndex];
    setError('');
    setLoading(true);

    try {
      if (hasSupabase) {
        // Real auth via API route
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: role.email, password: role.password }),
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

        window.location.href = data.redirect || role.redirect;

      } else {
        // FALLBACK: Demo mode (no Supabase configured)
        if (role.email === 'superadmin@nram360.com') {
          setShow2fa(true);
          setLoading(false);
          return;
        }

        if (typeof window !== 'undefined') {
          const userObj = {
            id: `u-${role.id}`,
            email: role.email,
            name: role.name,
            role: role.id === 'student' ? 'student' : role.id === 'pos' ? 'pos' : role.id === 'manager' ? 'manager' : 'owner',
            tenantId: 't-celeste'
          };
          localStorage.setItem('saswebs_user', JSON.stringify(userObj));
          localStorage.setItem('saswebs_role', userObj.role);
          localStorage.setItem('mock_active_tenant_id', 't-celeste');
        }

        window.location.href = role.redirect;
      }
    } catch (err) {
      setError('Error de conexión. Intenta de nuevo.');
      setLoading(false);
    }
  };

  // --- TRADITIONAL LOGIN (Supabase) ---
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

        let userRole = 'owner';
        let redirectPath = '/dashboard';
        let name = 'Dueño (Owner)';
        let tenantId = 't-celeste';

        if (email === 'owner@nram360.com') {
          userRole = 'owner';
          redirectPath = '/dashboard';
          name = 'Dueño (Owner)';
        } else if (email === 'manager@nram360.com') {
          userRole = 'manager';
          redirectPath = '/dashboard';
          name = 'Gerente (Manager)';
        } else if (email === 'cajero@nram360.com') {
          userRole = 'pos';
          redirectPath = '/pos';
          name = 'Cajero (POS)';
        } else if (email === 'alumno@nram360.com') {
          userRole = 'student';
          redirectPath = '/mi-cuenta';
          name = 'Alumno (Student)';
        }

        if (typeof window !== 'undefined') {
          const userObj = {
            id: `u-${userRole}`,
            email: email,
            name: name,
            role: userRole,
            tenantId: tenantId
          };
          localStorage.setItem('saswebs_user', JSON.stringify(userObj));
          localStorage.setItem('saswebs_role', userRole);
          localStorage.setItem('mock_active_tenant_id', tenantId);
        }

        window.location.href = redirectPath;
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
      if (typeof window !== 'undefined') {
        const userObj = {
          id: 'u-superadmin',
          email: 'superadmin@nram360.com',
          name: 'Super Administrador',
          role: 'super_admin',
          tenantId: 't-main'
        };
        localStorage.setItem('saswebs_user', JSON.stringify(userObj));
        localStorage.setItem('saswebs_role', 'super_admin');
        localStorage.setItem('mock_active_tenant_id', 't-main');
      }
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

  const selectedRole = systemRoles[activeRoleIndex];
  const SelectedIcon = selectedRole.icon;

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50/30 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-lg">

        {/* Card */}
        <div className="bg-white border border-slate-200 rounded-3xl shadow-xl p-8 relative overflow-hidden">
          <div className="absolute -top-16 -right-16 w-40 h-40 bg-cyan-400/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-slate-900/5 rounded-full blur-2xl pointer-events-none" />

          {/* Logo */}
          <div className="text-center mb-6 relative">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-slate-900 mb-3 shadow-lg">
              <span className="text-2xl font-black text-cyan-400">S</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">SASWEBS</h1>
            <p className="text-xs text-slate-400 mt-1 font-medium">
              {isRegister ? 'Crear nueva empresa en la plataforma' : 'Selecciona un rol para ingresar de inmediato'}
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
            /* TAB / ROLE SELECTION LOGIN */
            loginMode === 'tabs' ? (
              <div className="flex flex-col">
                {/* Tabs Selector */}
                <div className="flex border-b border-slate-100 pb-3 mb-5 overflow-x-auto whitespace-nowrap scrollbar-none gap-1.5 justify-between">
                  {systemRoles.map((role, idx) => (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => {
                        setActiveRoleIndex(idx);
                        setError('');
                      }}
                      className={`px-3 py-2 text-xs font-extrabold rounded-xl transition-all ${
                        activeRoleIndex === idx
                          ? 'bg-slate-900 text-white shadow-md shadow-slate-950/10'
                          : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      {role.name.split(' ')[0]}
                    </button>
                  ))}
                </div>

                {/* Selected Role Card */}
                <div className={`p-5 rounded-2xl border bg-gradient-to-br ${selectedRole.color} mb-5 transition-all duration-300`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] uppercase font-black tracking-wider bg-white/70 dark:bg-slate-900/50 px-2 py-0.5 rounded-md">
                      {selectedRole.badge}
                    </span>
                    <SelectedIcon className="w-5 h-5 opacity-75" />
                  </div>
                  <h3 className="text-lg font-black tracking-tight mb-1 text-slate-800">{selectedRole.name}</h3>
                  <p className="text-xs leading-relaxed text-slate-600 mb-4">{selectedRole.desc}</p>
                  
                  <div className="text-[11px] font-mono bg-white/50 dark:bg-slate-900/10 p-3 rounded-xl border border-white/40 flex flex-col gap-1 text-slate-700">
                    <div><span className="font-bold text-slate-900">Email:</span> {selectedRole.email}</div>
                    <div><span className="font-bold text-slate-900">Pass:</span> {selectedRole.password}</div>
                  </div>
                </div>

                <form onSubmit={handleAutoLogin} className="flex flex-col gap-3">
                  <button type="submit" disabled={loading}
                    className="w-full py-4 bg-slate-900 text-white font-extrabold rounded-2xl hover:bg-cyan-500 hover:text-slate-900 shadow-lg shadow-slate-950/10 hover:shadow-cyan-400/20 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 disabled:opacity-60">
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
                    {loading ? 'Ingresando...' : `Ingresar como ${selectedRole.name}`}
                  </button>

                  <div className="flex justify-between items-center mt-3 px-1">
                    <button type="button" onClick={() => { setLoginMode('traditional'); setError(''); }}
                      className="text-xs text-slate-400 hover:text-slate-700 font-semibold underline">
                      Login Tradicional
                    </button>
                    <button type="button" onClick={() => { setIsRegister(true); setError(''); }}
                      className="text-xs text-cyan-600 hover:text-cyan-800 font-bold">
                      Registrar Empresa →
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              /* TRADITIONAL LOGIN FORM */
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
                    🔧 <strong>Modo Demo:</strong> Elige login con pestañas arriba, o ingresa credenciales manuales.
                  </div>
                )}

                <button type="submit" disabled={loading}
                  className="w-full py-3.5 bg-slate-900 text-white font-bold rounded-xl mt-2 hover:bg-cyan-500 hover:text-slate-900 transition-all flex items-center justify-center gap-2 disabled:opacity-60">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                  {loading ? 'Verificando...' : 'Ingresar'}
                </button>

                <div className="flex justify-between items-center mt-3 px-1">
                  <button type="button" onClick={() => { setLoginMode('tabs'); setError(''); }}
                    className="text-xs text-slate-500 hover:text-slate-800 font-semibold underline">
                    ← Usar Pestañas de Roles
                  </button>
                  <button type="button" onClick={() => { setIsRegister(true); setError(''); }}
                    className="text-xs text-cyan-600 hover:text-cyan-800 font-semibold">
                    Registrar Empresa →
                  </button>
                </div>
              </form>
            )

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