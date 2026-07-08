const { Resend } = require('resend');

let resendClient = null;

// Initialize Resend if API key is available
function initNotificationService() {
  const apiKey = process.env.RESEND_API_KEY;
  if (apiKey) {
    try {
      resendClient = new Resend(apiKey);
      console.log('[Notifications] Resend initialized');
    } catch (err) {
      console.error('[Notifications] Failed to initialize Resend:', err.message);
    }
  } else {
    console.log('[Notifications] Resend not configured (RESEND_API_KEY not set)');
  }
}

// Status label mapping
const statusLabels = {
  'draft': 'Em análise',
  'scheduled': 'Agendado',
  'in-progress': 'Em andamento',
  'completed': 'Concluído',
  'delivered': 'Entregue',
  'cancelled': 'Cancelado'
};

// Send status update email to client
async function sendStatusEmail(serviceOrder, client, newStatus, baseUrl) {
  if (!resendClient || !client?.email) {
    console.log('[Notifications] Email not sent: missing Resend client or client email');
    return false;
  }

  if (!serviceOrder.shareToken) {
    console.log('[Notifications] Email not sent: no share token');
    return false;
  }

  const statusLabel = statusLabels[newStatus] || newStatus;
  const shareUrl = `${baseUrl}/public/os/${serviceOrder.shareToken}`;

  const statusEmojis = {
    'draft': '📝',
    'scheduled': '📅',
    'in-progress': '🔧',
    'completed': '✅',
    'delivered': '🚗',
    'cancelled': '❌'
  };

  const emoji = statusEmojis[newStatus] || '📋';

  try {
    await resendClient.emails.send({
      from: process.env.EMAIL_FROM || 'CRM Garagem <noreply@crmgaragem.com.br>',
      to: client.email,
      subject: `${emoji} ${serviceOrder.orderNumber} — ${statusLabel}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background: #f3f4f6; }
            .container { max-width: 560px; margin: 0 auto; padding: 24px 16px; }
            .card { background: white; border-radius: 12px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
            .header { text-align: center; margin-bottom: 24px; }
            .header h1 { font-size: 24px; color: #111827; margin: 0; }
            .header p { color: #6b7280; margin: 8px 0 0; }
            .status-badge { display: inline-block; background: #eff6ff; color: #2563eb; padding: 8px 20px; border-radius: 100px; font-weight: 600; font-size: 14px; margin: 16px 0; }
            .divider { border: none; border-top: 1px solid #e5e7eb; margin: 24px 0; }
            .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f3f4f6; font-size: 14px; }
            .info-label { color: #6b7280; }
            .info-value { color: #111827; font-weight: 500; }
            .btn { display: inline-block; background: #2563eb; color: white !important; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 15px; margin: 24px 0; }
            .footer { text-align: center; color: #9ca3af; font-size: 12px; margin-top: 24px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="card">
              <div class="header">
                <h1>${emoji} Status Atualizado</h1>
                <p>Sua ordem de serviço <strong>${serviceOrder.orderNumber}</strong> foi atualizada</p>
              </div>

              <div style="text-align: center;">
                <div class="status-badge">${statusLabel}</div>
              </div>

              <hr class="divider" />

              <div class="info-row">
                <span class="info-label">Ordem</span>
                <span class="info-value">${serviceOrder.orderNumber}</span>
              </div>
              ${serviceOrder.description ? `<div class="info-row">
                <span class="info-label">Serviço</span>
                <span class="info-value">${serviceOrder.description}</span>
              </div>` : ''}
              <div class="info-row">
                <span class="info-label">Valor</span>
                <span class="info-value">R$ ${parseFloat(serviceOrder.totalAmount).toFixed(2)}</span>
              </div>

              <div style="text-align: center;">
                <a href="${shareUrl}" class="btn">Acompanhar Status</a>
              </div>

              <p style="text-align: center; color: #6b7280; font-size: 14px; margin: 16px 0 0;">
                Clique no botão acima para ver os detalhes completos<br />
                do seu serviço em tempo real.
              </p>
            </div>
            <div class="footer">
              <p>CRM Garagem — Gerencie suas ordens de serviço</p>
              <p>Se não deseja receber essas notificações, entre em contato com a oficina.</p>
            </div>
          </div>
        </body>
        </html>
      `
    });

    console.log(`[Notifications] Email sent to ${client.email} for ${serviceOrder.orderNumber}`);
    return true;
  } catch (err) {
    console.error('[Notifications] Failed to send email:', err.message);
    return false;
  }
}

module.exports = { initNotificationService, sendStatusEmail, statusLabels };
