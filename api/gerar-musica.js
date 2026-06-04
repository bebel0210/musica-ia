export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { genero, ocasiao, nome, relacionamento, briefing, tom } = req.body;

  if (!genero || !nome || !briefing) {
    return res.status(400).json({ error: 'Dados incompletos' });
  }

  // Monta o prompt para a KIE.ai
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

  const prompt = `Crie uma música de ${genero} com tom ${tomMap[tom] || tom} para ${ocasiaoMap[ocasiao] || ocasiao}.
A música é para ${nome}${relacionamento ? ` (${relacionamento})` : ''}.
Sobre: ${briefing}
A letra deve mencionar o nome ${nome} e refletir os sentimentos descritos acima.
Estilo: ${genero} brasileiro autêntico.`;

  try {
    // 1. Submete a geração na KIE.ai
    const generateRes = await fetch('https://api.kie.ai/api/suno/v1/music', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.KIE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt,
        style: genero,
        title: `Música para ${nome}`,
        customMode: true,
        instrumental: false,
        model: 'V4'
      })
    });

    const generateData = await generateRes.json();

    if (!generateRes.ok) {
      console.error('KIE.ai error:', generateData);
      return res.status(500).json({ error: 'Erro ao gerar música', details: generateData });
    }

    const taskId = generateData.data?.taskId || generateData.taskId;

    if (!taskId) {
      return res.status(500).json({ error: 'taskId não retornado pela KIE.ai', raw: generateData });
    }

    return res.status(200).json({ taskId });

  } catch (error) {
    console.error('Erro interno:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}
