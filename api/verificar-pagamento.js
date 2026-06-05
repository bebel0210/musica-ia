export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { billingId } = req.query;

  if (!billingId) {
    return res.status(400).json({ error: 'billingId é obrigatório' });
  }

  try {
    // 1. Verifica primeiro no Redis (confirmação via webhook)
    const redisPago = await redisGet(`billing:${billingId}`);
    if (redisPago === 'paid') {
      return res.status(200).json({ pago: true, fonte: 'webhook' });
    }

    // 2. Fallback: verifica direto na API do AbacatePay
    const response = await fetch(`https://api.abacatepay.com/v1/billing/${billingId}`, {
      headers: {
        'Authorization': `Bearer ${process.env.ABACATE_API_KEY}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(500).json({ pago: false, error: data });
    }

    const pago = data.status === 'PAID';

    // Se pago, salva no Redis pra próxima verificação ser mais rápida
    if (pago) {
      await redisSet(`billing:${billingId}`, 'paid', 86400);
    }

    return res.status(200).json({ pago, status: data.status, fonte: 'api' });

  } catch (error) {
    console.error('Erro ao verificar pagamento:', error);
    return res.status(500).json({ pago: false, error: error.message });
  }
}

async function redisGet(key) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  const response = await fetch(`${url}/get/${key}`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  const data = await response.json();
  return data.result;
}

async function redisSet(key, value, exSeconds) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  const response = await fetch(`${url}/set/${key}/${value}/ex/${exSeconds}`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  return response.json();
}
