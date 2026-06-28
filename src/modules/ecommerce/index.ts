import { type Product } from '@/core/config/supabase';

export interface CartItem {
  product: Product;
  quantity: number;
}

export function calculateCartTotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
}

export function buildStripeCheckoutBody(items: CartItem[], successUrl: string, cancelUrl: string) {
  return {
    lineItems: items.map(item => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.product.name,
          images: [item.product.imageUrl || '']
        },
        unit_amount: Math.round(item.product.price * 100)
      },
      quantity: item.quantity
    })),
    successUrl,
    cancelUrl
  };
}
