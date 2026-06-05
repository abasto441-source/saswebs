import { createAdminClient } from '@/lib/supabase-server';

interface WorkflowData {
  orderId?: string;
  items?: any[];
  total?: number;
  paymentMethod?: string;
  customerEmail?: string;
  customerName?: string;
  formData?: Record<string, string>;
}

// Real automation engine — triggers workflows based on events
export async function triggerWorkflows(
  tenantId: string,
  triggerEvent: string,
  data: WorkflowData
) {
  const supabase = createAdminClient();

  // Get active workflows for this tenant + trigger
  const { data: workflows, error } = await supabase
    .from('automation_workflows')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('trigger_event', triggerEvent)
    .eq('active', true);

  if (error || !workflows?.length) return;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  for (const workflow of workflows) {
    const actions: string[] = Array.isArray(workflow.actions) ? workflow.actions : [];

    for (const action of actions) {
      try {
        if (action === 'send_email' && data.customerEmail) {
          await fetch(`${appUrl}/api/send/email`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: data.customerEmail,
              subject: getEmailSubject(triggerEvent),
              html: buildEmailHTML(triggerEvent, data),
            }),
          });
        }

        if (action === 'send_whatsapp') {
          // WhatsApp via Twilio — activar después
          console.log('[WHATSAPP PENDING] Would send WhatsApp to customer');
        }

        if (action === 'sync_crm_webhook' && workflow.webhook_url) {
          await fetch(workflow.webhook_url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ event: triggerEvent, data, tenantId }),
          });
        }

        // Log successful automation
        await supabase.from('audit_logs').insert({
          tenant_id: tenantId,
          user_id: 'automation',
          action: `Automatización ejecutada: ${action}`,
          details: `Workflow: "${workflow.name}" → Evento: ${triggerEvent}`,
        });

      } catch (actionErr) {
        console.error(`[AUTOMATION ACTION ERROR] ${action}:`, actionErr);
      }
    }
  }
}

function getEmailSubject(triggerEvent: string): string {
  const subjects: Record<string, string> = {
    pos_sale: '✅ Confirmación de tu compra',
    contact_form_submit: '📩 Tu mensaje fue recibido',
    course_enrollment: '🎓 Te has inscrito al curso',
    reservation_created: '📅 Reserva confirmada',
  };
  return subjects[triggerEvent] || 'Notificación de SASWEBS';
}

function buildEmailHTML(triggerEvent: string, data: WorkflowData): string {
  if (triggerEvent === 'pos_sale') {
    const itemsList = data.items?.map(
      (i: any) => `<tr><td>${i.name}</td><td>${i.quantity}</td><td>$${i.price}</td></tr>`
    ).join('') || '';

    return `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
        <h2 style="color:#1a1a1a">✅ Compra confirmada</h2>
        <p>Gracias por tu compra. Aquí está el resumen:</p>
        <table border="1" cellpadding="8" cellspacing="0" width="100%" style="border-collapse:collapse">
          <thead style="background:#f3f4f6">
            <tr><th>Producto</th><th>Cantidad</th><th>Precio</th></tr>
          </thead>
          <tbody>${itemsList}</tbody>
        </table>
        <p style="margin-top:20px"><strong>Total: $${data.total}</strong></p>
        <p style="color:#6b7280;font-size:12px">Método de pago: ${data.paymentMethod}</p>
      </div>
    `;
  }

  if (triggerEvent === 'contact_form_submit') {
    return `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
        <h2>📩 Recibimos tu mensaje</h2>
        <p>Hola ${data.customerName || 'Cliente'},</p>
        <p>Gracias por contactarnos. Nos pondremos en contacto contigo pronto.</p>
      </div>
    `;
  }

  return `<p>Notificación automática de SASWEBS.</p>`;
}
