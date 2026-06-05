import { NextResponse } from 'next/server';

// POST /api/send/email — Send real email via Resend
export async function POST(request: Request) {
  try {
    const { to, subject, html, text, tenantName } = await request.json();

    if (!to || !subject || (!html && !text)) {
      return NextResponse.json({ error: 'to, subject y html/text son requeridos' }, { status: 400 });
    }

    // If no Resend key configured, log and return success (dev mode)
    if (!process.env.RESEND_API_KEY) {
      console.log('[EMAIL MOCK] Would send to:', to, 'Subject:', subject);
      return NextResponse.json({ success: true, mode: 'mock', message: 'Email simulado (sin RESEND_API_KEY)' });
    }

    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);

    const fromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@nram360.com';
    const fromName = tenantName || 'SASWEBS';

    const { data, error } = await resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
      to: Array.isArray(to) ? to : [to],
      subject,
      html: html || `<p>${text}</p>`,
    });

    if (error) {
      console.error('[RESEND ERROR]', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, emailId: data?.id });

  } catch (err: any) {
    console.error('[EMAIL SEND ERROR]', err);
    return NextResponse.json({ error: err.message || 'Error al enviar email' }, { status: 500 });
  }
}
