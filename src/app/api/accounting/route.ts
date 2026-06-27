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

    // Fetch accounts
    const { data: accounts, error: accError } = await supabase
      .from('accounting_accounts')
      .select('*')
      .eq('tenant_id', tenantId);

    if (accError) throw accError;

    // Fetch entries
    const { data: entries, error: entError } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('tenant_id', tenantId);

    if (entError) throw entError;

    return NextResponse.json({ accounts: accounts || [], entries: entries || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error al obtener datos contables' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, tenantId, account, entry, items } = body;
    const supabase = createAdminClient();

    if (action === 'create_account') {
      const { code, name, type, parentId } = account;
      const { data, error } = await supabase.from('accounting_accounts').insert({
        tenant_id: tenantId,
        code,
        name,
        type,
        parent_id: parentId || null
      }).select().single();

      if (error) throw error;
      return NextResponse.json({ success: true, data });
    }

    if (action === 'create_entry') {
      const { description, entryDate } = entry;

      // Validate double entry debit == credit
      const totalDebit = items.reduce((sum: number, item: any) => sum + (Number(item.debit) || 0), 0);
      const totalCredit = items.reduce((sum: number, item: any) => sum + (Number(item.credit) || 0), 0);

      if (Math.abs(totalDebit - totalCredit) > 0.01) {
        return NextResponse.json({ error: 'La partida doble no está cuadrada. Debe == Haber.' }, { status: 400 });
      }

      // Insert Journal Entry
      const { data: je, error: jeError } = await supabase.from('journal_entries').insert({
        tenant_id: tenantId,
        description,
        entry_date: entryDate,
        status: 'posted'
      }).select().single();

      if (jeError) throw jeError;

      // Insert Journal Items
      const dbItems = items.map((item: any) => ({
        entry_id: je.id,
        account_id: item.accountId,
        debit: Number(item.debit) || 0,
        credit: Number(item.credit) || 0,
        cost_center: item.costCenter || null
      }));

      const { error: itemsError } = await supabase.from('journal_items').insert(dbItems);
      if (itemsError) throw itemsError;

      return NextResponse.json({ success: true, entry: je });
    }

    return NextResponse.json({ error: 'Acción no soportada' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error al procesar la solicitud contable' }, { status: 500 });
  }
}
