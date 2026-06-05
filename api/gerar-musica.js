export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { genero, ocasiao, nome, relacionamento, briefing, tom } = req.body;

  if (!genero || !nome || !briefing) {
    return res.status(400).json({ error: 'Dados incompletos' });
  }

  const tomMap = {
    romantico: 'romântico, emotivo e apaixonado',
    animado: 'animado, festivo e cheio de energia',
    emocional: 'profundamente emocionante, tocante e que arranca lágrimas',
    descontraido: 'descontraído, alegre e cheio de leveza'
  };

  const ocasiaoMap = {
    aniversario: 'aniversário especial',
    declaracao: 'declaração de amor profunda',
    homenagem: 'homenagem especial do coração',
    casamento: 'casamento e união eterna',
    amizade: 'homenagem a um amigo especial',
    outro: 'momento único e especial'
  };

  const prompt = `Crie uma música longa de ${genero} brasileiro autêntico, com duração de pelo menos 3 minutos, com introdução instrumental, verso, pré-refrão, refrão marcante, segundo verso, refrão, ponte emocional e refrão final.

Tom: ${tomMap[tom] || tom}.
Ocasião: ${ocasiaoMap[ocasiao] || ocasiao}.
Para: ${nome}${relacionamento ? ` — ${relacionamento}` : ''}.

Contexto emocional para a letra: ${briefing}

Instruções para a letra:
- Mencione o nome "${nome}" pelo menos 3 vezes na música, incluindo no refrão
- A letra deve ser profundamente pessoal e emotiva, baseada no contexto acima
- Use metáforas e imagens poéticas típicas do ${genero} brasileiro
- O refrão deve ser marcante, fácil de cantar junto e emocionalmente poderoso
- A música deve causar arrepios e vontade de chorar em quem ouvir
- Inclua uma ponte instrumental emotiva antes do refrão final
- Finalize com um refrão grandioso e apoteótico`;

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
        model: 'V4_5',
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
    return res.status(500).json({ error: 'Erro interno', message: error.message });
  }
}
