export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = req.body;
    const event = body.event;

    console.log('Webhook recebido:', event, JSON.stringify(body));

    // AbacatePay usa "checkout.completed" como evento de pagamento confirmado
    if (event === 'checkout.completed' || event === 'BILLING_PAID') {
      const billingId = body.data?.checkout?.id || body.billing?.id;

      if (!billingId) {
        console.error('billingId não encontrado no payload:', body);
        return res.status(400).json({ error: 'billingId não encontrado' });
      }

      // Salva no Redis que esse billingId foi pago
      await redisSet(`billing:${billingId}`, 'paid', 86400);
      console.log(`✅ Pagamento confirmado e salvo no Redis: ${billingId}`);
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
