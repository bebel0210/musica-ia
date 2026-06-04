export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { billingId } = req.query;

  if (!billingId) {
    return res.status(400).json({ error: 'billingId é obrigatório' });
  }

  try {
    const response = await fetch(`https://api.abacatepay.com/v1/billing/${billingId}`, {
      headers: {
        'Authorization': `Bearer ${process.env.ABACATE_API_KEY}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Erro ao verificar pagamento:', data);
      return res.status(500).json({ pago: false, error: data });
    }

    const pago = data.status === 'PAID';

    return res.status(200).json({ pago, status: data.status });

  } catch (error) {
    console.error('Erro interno:', error);
    return res.status(500).json({ pago: false, error: 'Erro interno' });
  }
}
