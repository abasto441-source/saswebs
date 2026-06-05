import { NextResponse } from 'next/server';

// POST /api/stripe/checkout — Create Stripe Checkout session
export async function POST(request: Request) {
  try {
    const { items, tenantId, successUrl, cancelUrl } = await request.json();

    if (!items?.length) {
      return NextResponse.json({ error: 'items requeridos' }, { status: 400 });
    }

    // If no Stripe key, return mock URL
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({
        url: '/checkout/success?session_id=mock_session',
        mode: 'mock',
        message: 'Stripe no configurado — usando modo simulado',
      });
    }

    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: items.map((item: any) => ({
        price_data: {
          currency: 'usd',
          product_data: {
            name: item.name,
            images: item.imageUrl ? [item.imageUrl] : [],
          },
          unit_amount: Math.round(Number(item.price) * 100),
        },
        quantity: item.quantity,
      })),
      mode: 'payment',
      success_url: successUrl || `${appUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${appUrl}/checkout/cancel`,
      metadata: {
        tenantId: tenantId || '',
        itemCount: String(items.length),
      },
    });

    return NextResponse.json({ url: session.url, sessionId: session.id });

  } catch (err: any) {
    console.error('[STRIPE ERROR]', err);
    return NextResponse.json({ error: err.message || 'Error al crear sesión de pago' }, { status: 500 });
  }
}
