export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Valida a secret do webhook
    const secret = req.headers['x-webhook-secret'] || req.query.secret;
    if (process.env.WEBHOOK_SECRET && secret !== process.env.WEBHOOK_SECRET) {
      console.warn('Webhook com secret inválida rejeitado');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const body = req.body;
    const event = body.event;

    console.log('Webhook recebido:', event, JSON.stringify(body));

    if (event === 'checkout.completed' || event === 'BILLING_PAID') {
      const billingId = body.data?.checkout?.id || body.billing?.id;

      if (!billingId) {
        console.error('billingId não encontrado:', body);
        return res.status(400).json({ error: 'billingId não encontrado' });
      }

      await redisSet(`billing:${billingId}`, 'paid', 86400);
      console.log(`✅ Pagamento confirmado: ${billingId}`);
    }

    return res.status(200).json({ ok: true });

  } catch (error) {
    console.error('Erro no webhook:', error);
    return res.status(500).json({ error: 'Erro interno' });
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
