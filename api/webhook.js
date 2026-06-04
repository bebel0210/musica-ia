export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { event, billing } = req.body;

    console.log('Webhook recebido:', event, billing?.id);

    if (event === 'BILLING_PAID') {
      const billingId = billing.id;
      const customerName = billing.customer?.name || 'Cliente';
      const customerEmail = billing.customer?.email;

      console.log(`✅ Pagamento confirmado! ID: ${billingId} — ${customerName} (${customerEmail})`);
      // O desbloqueio do download acontece no frontend
      // via verificar-pagamento.js que checa o status no AbacatePay
    }

    return res.status(200).json({ ok: true });

  } catch (error) {
    console.error('Erro no webhook:', error);
    return res.status(500).json({ error: 'Erro interno' });
  }
}
