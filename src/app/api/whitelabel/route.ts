export const runtime = 'edge';

import { createAdminClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');
    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId es requerido' }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('white_label_settings')
      .select('*')
      .eq('tenant_id', tenantId)
      .maybeSingle();

    if (error) throw error;
    return NextResponse.json(data || null);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error al obtener marca' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tenantId, brandName, logoUrl, primaryColor, secondaryColor, customEmailSender, customEmailName, invoiceFooter } = body;
    
    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId es requerido' }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('white_label_settings')
      .upsert({
        tenant_id: tenantId,
        brand_name: brandName,
        logo_url: logoUrl,
        primary_color: primaryColor,
        secondary_color: secondaryColor,
        custom_email_sender: customEmailSender || null,
        custom_email_name: customEmailName || null,
        invoice_footer: invoiceFooter || null
      }, { onConflict: 'tenant_id' })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error al guardar ajustes de marca' }, { status: 500 });
  }
}
