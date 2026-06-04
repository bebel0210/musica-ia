export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { taskId } = req.query;

  if (!taskId) {
    return res.status(400).json({ error: 'taskId é obrigatório' });
  }

  try {
    const response = await fetch(`https://api.kie.ai/api/suno/v1/music/${taskId}`, {
      headers: {
        'Authorization': `Bearer ${process.env.KIE_API_KEY}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(500).json({ pronta: false, error: data });
    }

    const status = data.data?.status || data.status;
    const audioUrl = data.data?.clips?.[0]?.audio_url || data.data?.audioUrl || null;

    // Status possíveis: pending, processing, completed, failed
    const pronta = status === 'completed' && audioUrl;

    return res.status(200).json({
      pronta: !!pronta,
      status,
      audioUrl: pronta ? audioUrl : null
    });

  } catch (error) {
    console.error('Erro ao verificar status:', error);
    return res.status(500).json({ pronta: false, error: 'Erro interno' });
  }
}
