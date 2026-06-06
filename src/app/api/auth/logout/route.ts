export const runtime = 'edge';

import { createServerClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

// POST /api/auth/logout
export async function POST() {
  try {
    const supabase = createServerClient();
    await supabase.auth.signOut();
    return NextResponse.json({ success: true, redirect: '/login' });
  } catch {
    return NextResponse.json({ success: true, redirect: '/login' });
  }
}
