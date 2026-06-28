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

export function calculatePnL(balances: AccountBalance[]): { totalRevenue: number; totalExpenses: number; netIncome: number } {
  const totalRevenue = balances
    .filter(b => b.type === 'ingreso')
    .reduce((sum, b) => sum + b.balance, 0);

  const totalExpenses = balances
    .filter(b => b.type === 'gasto')
    .reduce((sum, b) => sum + b.balance, 0);

  const netIncome = totalRevenue - totalExpenses;
  return {
    totalRevenue,
    totalExpenses,
    netIncome
  };
}

export function calculateBudgetDeviations(
  balances: AccountBalance[],
  budgetLimits: any[]
): Array<{ accountId: string; accountName: string; code: string; limit: number; spent: number; deviationPct: number }> {
  return budgetLimits.map(limit => {
    const matchedBal = balances.find(b => b.accountId === limit.accountId) || { balance: 0, name: 'Desconocida', code: '' };
    const spent = matchedBal.balance;
    const deviationPct = limit.amount > 0 ? ((spent - limit.amount) / limit.amount) * 100 : 0;
    return {
      accountId: limit.accountId,
      accountName: matchedBal.name,
      code: matchedBal.code,
      limit: limit.amount,
      spent,
      deviationPct
    };
  });
}

export function calculateDepreciation(asset: { purchaseValue: number; salvageValue: number; lifespanYears: number }): number {
  if (asset.lifespanYears <= 0) return 0;
  const yearly = (asset.purchaseValue - asset.salvageValue) / asset.lifespanYears;
  return yearly / 12; // Monthly linear depreciation amount
}

export function calculateCashFlowDirect(
  journalItems: JournalItem[],
  cashAccountId: string
): { operations: number; investment: number; financing: number; netFlow: number } {
  let operations = 0;
  let investment = 0;
  let financing = 0;

  // Simple classification based on account codes / descriptions
  journalItems.forEach(item => {
    if (item.accountId === cashAccountId) {
      const isReceipt = item.debit > 0;
      const amount = isReceipt ? item.debit : -item.credit;
      
      // Let's mock classification
      if (item.costCenter?.includes('Inversión') || item.costCenter?.includes('Activos')) {
        investment += amount;
      } else if (item.costCenter?.includes('Préstamo') || item.costCenter?.includes('Capital')) {
        financing += amount;
      } else {
        operations += amount;
      }
    }
  });

  return {
    operations,
    investment,
    financing,
    netFlow: operations + investment + financing
  };
}
