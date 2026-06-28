import { type HrEmployee, type InventoryWarehouse, type InventoryBatch } from '@/core/config/supabase';

export function calculateTotalPayroll(employees: HrEmployee[]): number {
  return employees
    .filter(e => e.status === 'active')
    .reduce((sum, emp) => sum + emp.salary, 0);
}

export function getBatchesInWarehouse(batches: InventoryBatch[], warehouseId: string): InventoryBatch[] {
  return batches.filter(b => b.warehouseId === warehouseId);
}
