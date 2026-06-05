export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { nome } = req.body;
  const produtoId = process.env.ABACATE_PRODUCT_ID;

  if (!produtoId) {
    return res.status(500).json({ error: 'ABACATE_PRODUCT_ID não configurado' });
  }

  try {
    const response = await fetch('https://api.abacatepay.com/v2/checkouts/create', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.ABACATE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        items: [{ id: produtoId, quantity: 1 }],
        methods: ['PIX'],
        externalId: `musica-${nome || 'cliente'}-${Date.now()}`,
        completionUrl: `${process.env.SITE_URL || 'https://musica-ia-tau.vercel.app'}?pago=true`,
        returnUrl: `${process.env.SITE_URL || 'https://musica-ia-tau.vercel.app'}`
      })
    });

    const data = await response.json();
    console.log('AbacatePay v2 response:', JSON.stringify(data));

    if (!response.ok || !data.data?.url) {
      return res.status(500).json({ error: 'Erro ao criar cobrança', details: data });
    }

    return res.status(200).json({
      pixUrl: data.data.url,
      billingId: data.data.id
    });

  } catch (error) {
    console.error('Erro interno:', error);
    return res.status(500).json({ error: 'Erro interno', message: error.message });
  }
}
