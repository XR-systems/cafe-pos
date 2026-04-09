// Emite eventos a n8n (fire-and-forget)
// Configurar: N8N_WEBHOOK_URL=https://tu-n8n.com/webhook en .env o variables de entorno

const N8N_URL = process.env.N8N_WEBHOOK_URL;

async function emitWebhook(event, payload) {
  if (!N8N_URL) return; // silencioso si no está configurado

  try {
    await fetch(`${N8N_URL}/${event}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event,
        data: payload,
        timestamp: new Date().toISOString()
      }),
      signal: AbortSignal.timeout(5000) // no bloquear más de 5s
    });
  } catch (err) {
    // No crashear el servidor si n8n no responde
    console.error(`[webhook] Error en evento "${event}":`, err.message);
  }
}

module.exports = { emitWebhook };
