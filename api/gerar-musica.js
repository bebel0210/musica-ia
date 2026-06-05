export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { genero, ocasiao, nome, relacionamento, briefing, tom } = req.body;

  if (!genero || !nome || !briefing) {
    return res.status(400).json({ error: 'Dados incompletos' });
  }

  const tomMap = {
    romantico: 'romântico e emotivo',
    animado: 'animado e festivo',
    emocional: 'emocionante e tocante',
    descontraido: 'descontraído e alegre'
  };

  const ocasiaoMap = {
    aniversario: 'aniversário',
    declaracao: 'declaração de amor',
    homenagem: 'homenagem especial',
    casamento: 'casamento',
    amizade: 'homenagem a amigo',
    outro: 'ocasião especial'
  };

  const prompt = `Crie uma música de ${genero} com tom ${tomMap[tom] || tom} para ${ocasiaoMap[ocasiao] || ocasiao}. A música é para ${nome}${relacionamento ? ` (${relacionamento})` : ''}. Sobre: ${briefing}. A letra deve mencionar o nome ${nome} e refletir os sentimentos descritos. Estilo: ${genero} brasileiro autêntico.`;

  const siteUrl = process.env.SITE_URL || 'https://musica-ia-tau.vercel.app';

  try {
    const response = await fetch('https://api.kie.ai/api/v1/generate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.KIE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt,
        customMode: true,
        instrumental: false,
        model: 'V4',
        style: genero,
        title: `Música para ${nome}`,
        callBackUrl: `${siteUrl}/api/webhook-kie`
      })
    });

    const data = await response.json();
    console.log('KIE.ai response:', JSON.stringify(data));

    if (!response.ok || data.code !== 200) {
      console.error('KIE.ai error:', data);
      return res.status(500).json({ error: 'Erro ao gerar música', details: data });
    }

    const taskId = data.data?.taskId;

    if (!taskId) {
      return res.status(500).json({ error: 'taskId não retornado', raw: data });
    }

    return res.status(200).json({ taskId });

  } catch (error) {
    console.error('Erro interno:', error);
    return res.status(500).json({ error: 'Erro interno do servidor', message: error.message });
  }
}
