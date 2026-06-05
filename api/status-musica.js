export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { taskId } = req.query;

  if (!taskId) {
    return res.status(400).json({ error: 'taskId é obrigatório' });
  }

  try {
    const response = await fetch(`https://api.kie.ai/api/v1/generate/${taskId}`, {
      headers: {
        'Authorization': `Bearer ${process.env.KIE_API_KEY}`
      }
    });

    const data = await response.json();
    console.log('Status KIE.ai raw:', JSON.stringify(data));

    if (!response.ok || data.code !== 200) {
      return res.status(500).json({ pronta: false, error: data });
    }

    const status = data.data?.status;

    // Tenta todas as estruturas possíveis de resposta da KIE.ai
    let audioUrl = null;

    // Estrutura 1: sunoData array
    audioUrl = data.data?.response?.sunoData?.[0]?.audioUrl;

    // Estrutura 2: array direto de URLs
    if (!audioUrl) {
      const urls = data.data?.response;
      if (Array.isArray(urls) && urls.length > 0) {
        audioUrl = urls[0];
      }
    }

    // Estrutura 3: audioUrl direto
    if (!audioUrl) {
      audioUrl = data.data?.audioUrl || data.data?.audio_url;
    }

    // Estrutura 4: clips
    if (!audioUrl) {
      audioUrl = data.data?.clips?.[0]?.audio_url;
    }

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
