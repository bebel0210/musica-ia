export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { taskId } = req.query;

  if (!taskId) {
    return res.status(400).json({ error: 'taskId é obrigatório' });
  }

  try {
    // Endpoint correto conforme documentação KIE.ai
    const response = await fetch(`https://api.kie.ai/api/v1/generate/record-info?taskId=${taskId}`, {
      headers: {
        'Authorization': `Bearer ${process.env.KIE_API_KEY}`
      }
    });

    const data = await response.json();
    console.log('Status KIE.ai:', JSON.stringify(data));

    if (!response.ok || data.code !== 200) {
      return res.status(500).json({ pronta: false, error: data });
    }

    const status = data.data?.status;
    // audioUrl dentro de sunoData
    const audioUrl = data.data?.response?.sunoData?.[0]?.audioUrl || null;

    console.log('Status:', status, '| audioUrl:', audioUrl);

    const pronta = status === 'SUCCESS' && !!audioUrl;

    return res.status(200).json({
      pronta,
      status,
      audioUrl: pronta ? audioUrl : null
    });

  } catch (error) {
    console.error('Erro ao verificar status:', error);
    return res.status(500).json({ pronta: false, error: error.message });
  }
}
