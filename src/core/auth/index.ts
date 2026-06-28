import { dbAdapter } from '@/core/config/supabase';

export interface UserProfile {
  name: string;
  email: string;
  role: 'owner' | 'manager' | 'cajero' | 'invitado';
}

export function getSessionUser(): UserProfile | null {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem('saswebs_user');
  if (!stored) return null;
  try {
    const user = JSON.parse(stored);
    return {
      name: user.name || user.email,
      email: user.email,
      role: user.role
    };
  } catch {
    return null;
  }
}

export function setSessionUser(user: UserProfile | null) {
  if (typeof window === 'undefined') return;
  if (user) {
    localStorage.setItem('saswebs_user', JSON.stringify(user));
  } else {
    localStorage.removeItem('saswebs_user');
  }
}
