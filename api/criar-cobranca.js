export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { nome } = req.body;

  try {
    const response = await fetch('https://api.abacatepay.com/v1/billing/create', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.ABACATE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        frequency: 'ONE_TIME',
        methods: ['PIX'],
        products: [
          {
            externalId: 'musica-personalizada-ia',
            name: 'Música Personalizada com IA',
            description: `Música personalizada para ${nome || 'você'} — Estúdio Marcele Gianni`,
            quantity: 1,
            price: 2990
          }
        ],
        returnUrl: `${process.env.SITE_URL || 'https://musica-ia-tau.vercel.app'}?pago=true`,
        completionUrl: `${process.env.SITE_URL || 'https://musica-ia-tau.vercel.app'}?pago=true`
      })
    });

    const data = await response.json();
    console.log('AbacatePay response:', JSON.stringify(data));

    if (!response.ok || !data.success) {
      return res.status(500).json({ error: 'Erro ao criar cobrança', details: data });
    }

    return res.status(200).json({
      pixUrl: data.data?.url,
      billingId: data.data?.id
    });

  } catch (error) {
    console.error('Erro interno:', error);
    return res.status(500).json({ error: 'Erro interno', message: error.message });
  }
}
