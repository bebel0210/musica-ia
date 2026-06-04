export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { nome, email } = req.body;

  if (!nome || !email) {
    return res.status(400).json({ error: 'Nome e email são obrigatórios' });
  }

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
            description: `Música personalizada para ${nome} — Estúdio Marcele Gianni`,
            quantity: 1,
            price: 2990 // R$29,90 em centavos
          }
        ],
        customer: {
          name: nome,
          email: email
        },
        returnUrl: `${process.env.SITE_URL || 'https://musica-ia.vercel.app'}?pago=true`,
        completionUrl: `${process.env.SITE_URL || 'https://musica-ia.vercel.app'}?pago=true`
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('AbacatePay error:', data);
      return res.status(500).json({ error: 'Erro ao criar cobrança', details: data });
    }

    return res.status(200).json({
      pixUrl: data.url,
      billingId: data.id
    });

  } catch (error) {
    console.error('Erro interno:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}
