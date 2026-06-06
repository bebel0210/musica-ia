export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = req.body;
    const event = body.event;

    console.log('Webhook recebido:', event, JSON.stringify(body));

    if (event === 'checkout.completed' || event === 'BILLING_PAID') {
      const billingId = body.data?.checkout?.id || body.billing?.id;

      if (!billingId) {
        console.error('billingId não encontrado:', body);
        return res.status(400).json({ error: 'billingId não encontrado' });
      }

      // Salva no Redis
      await redisSet(`billing:${billingId}`, 'paid', 86400);
      console.log(`✅ Pagamento confirmado: ${billingId}`);

      // Envia evento Purchase para a API de Conversões do Facebook
      await enviarEventoFacebook(billingId);
    }

    return res.status(200).json({ ok: true });

  } catch (error) {
    console.error('Erro no webhook:', error);
    return res.status(500).json({ error: 'Erro interno' });
  }
}

async function enviarEventoFacebook(billingId) {
  const accessToken = process.env.FB_ACCESS_TOKEN;
  const pixelId = '4538584363133110';

  if (!accessToken) {
    console.warn('FB_ACCESS_TOKEN não configurado');
    return;
  }

  try {
    const response = await fetch(
      `https://graph.facebook.com/v19.0/${pixelId}/events?access_token=${accessToken}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: [{
            event_name: 'Purchase',
            event_time: Math.floor(Date.now() / 1000),
            action_source: 'website',
            custom_data: {
              currency: 'BRL',
              value: 29.90,
              order_id: billingId
            }
          }]
        })
      }
    );

    const data = await response.json();
    console.log('Facebook API de Conversões:', JSON.stringify(data));
  } catch (err) {
    console.error('Erro ao enviar evento para Facebook:', err);
  }
}

async function redisSet(key, value, exSeconds) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  const response = await fetch(`${url}/set/${key}/${value}/ex/${exSeconds}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.json();
}
