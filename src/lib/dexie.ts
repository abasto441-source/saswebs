import Dexie, { type Table } from 'dexie';

export interface LocalProduct {
  id: string;
  barcode: string;
  name: string;
  price: number;
  stock: number;
  imageUrl?: string;
  category?: string;
}

export interface LocalOrder {
  id: string;
  tenantId: string;
  items: Array<{
    productId: string;
    name: string;
    quantity: number;
    price: number;
  }>;
  total: number;
  paymentMethod: 'cash' | 'card' | 'qr';
  status: 'pending' | 'synced';
  createdAt: number;
}

export class POSDatabase extends Dexie {
  products!: Table<LocalProduct>;
  orders!: Table<LocalOrder>;

  constructor() {
    super('NRAM360_POS_DB');
    this.version(1).stores({
      products: 'id, barcode, name, price, category',
      orders: 'id, tenantId, status, createdAt'
    });
  }
}

export const db = new POSDatabase();