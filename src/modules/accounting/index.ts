import { type AccountingAccount, type JournalEntry, type JournalItem } from '@/core/config/supabase';

export interface AccountBalance {
  accountId: string;
  code: string;
  name: string;
  type: string;
  debit: number;
  credit: number;
  balance: number;
}

export function computeLedgerBalances(
  accounts: AccountingAccount[],
  journalItems: JournalItem[]
): AccountBalance[] {
  const balancesMap: Record<string, { debit: number; credit: number }> = {};
  
  accounts.forEach(a => {
    balancesMap[a.id] = { debit: 0, credit: 0 };
  });

  journalItems.forEach(item => {
    if (balancesMap[item.accountId]) {
      balancesMap[item.accountId].debit += item.debit;
      balancesMap[item.accountId].credit += item.credit;
    }
  });

  return accounts.map(a => {
    const { debit, credit } = balancesMap[a.id] || { debit: 0, credit: 0 };
    // Activo / Gasto increase on Debit. Pasivo / Patrimonio / Ingreso increase on Credit.
    const isDebitSide = a.type === 'activo' || a.type === 'gasto';
    const balance = isDebitSide ? (debit - credit) : (credit - debit);
    return {
      accountId: a.id,
      code: a.code,
      name: a.name,
      type: a.type,
      debit,
      credit,
      balance
    };
  });
}
