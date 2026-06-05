// Rate limiting simples usando Upstash Redis
async function checkRateLimit(ip) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  const key = `ratelimit:gerar:${ip}`;

  // Incrementa contador e define expiração de 1 hora
  const incrRes = await fetch(`${url}/incr/${key}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const incrData = await incrRes.json();
  const count = incrData.result;

  // Se é a primeira chamada, define expiração de 3600s
  if (count === 1) {
    await fetch(`${url}/expire/${key}/259200`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  }

  return count;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Rate limit: máximo 3 gerações por IP por hora
  const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket?.remoteAddress || 'unknown';
  try {
    const count = await checkRateLimit(ip);
    if (count > 3) {
      console.warn(`Rate limit atingido para IP: ${ip} (${count} tentativas)`);
      return res.status(429).json({ error: 'Limite de gerações atingido. Tente novamente em 1 hora.' });
    }
  } catch (e) {
    console.error('Erro no rate limit:', e);
    // Se Redis falhar, deixa passar para não bloquear clientes legítimos
  }

  const { genero, ocasiao, nome, relacionamento, briefing, tom, voz } = req.body;

  if (!genero || !nome || !briefing) {
    return res.status(400).json({ error: 'Dados incompletos' });
  }

  const vozEscolhida = voz || 'male voice';

  const estiloMap = {
    sertanejo: `Sertanejo Melódico, violão, guitarra, BPM 80, ${vozEscolhida}`,
    pagode:    `Pagode, cavaquinho, pandeiro, BPM 85, ${vozEscolhida}`,
    funk:      `Funk brasileiro, batida eletrônica, BPM 130, ${vozEscolhida}`,
    gospel:    `Gospel, piano, coral, BPM 75, ${vozEscolhida}`,
    pop:       `Pop brasileiro, sintetizador, bateria leve, BPM 95, ${vozEscolhida}`,
    rock:      `Rock brasileiro, guitarra elétrica, bateria, BPM 100, ${vozEscolhida}`,
    forro:     `Forró, acordeão, triângulo, BPM 90, ${vozEscolhida}`,
    mpb:       `MPB, violão clássico, BPM 70, ${vozEscolhida}`
  };

  const temaMap = {
    aniversario: 'celebração, gratidão, amor que cresce com o tempo',
    declaracao:  'paixão, descoberta, coração acelerado, novo começo',
    homenagem:   'gratidão, origem, força, amor incondicional',
    casamento:   'cumplicidade, escolha, amor eterno, parceria',
    amizade:     'lealdade, memórias, irmandade, estar junto nas tormentas',
    outro:       'amor, emoção, gratidão, momento único'
  };

  const tomMap = {
    romantico:    'emotional, romantic, heartfelt',
    animado:      'uplifting, joyful, energetic',
    emocional:    'deeply emotional, tearful, touching',
    descontraido: 'warm, lighthearted, friendly'
  };

  const estilo = estiloMap[genero] || `${genero}, ${vozEscolhida}`;
  const tema = temaMap[ocasiao] || 'amor e emoção';
  const clima = tomMap[tom] || 'emotional, heartfelt';
  const vinculo = relacionamento ? `, ${relacionamento}` : '';

  const prompt = `[style: ${estilo}, ${clima}, professional production] [intro: mencione ${nome} nos primeiros segundos] [refrão: ${nome} aparece 3 vezes] Theme: ${tema}. ${briefing.slice(0, 100)}. ${nome}${vinculo}, essa música nasceu pra você.`.slice(0, 450);

  console.log('IP:', ip, '| Prompt:', prompt);

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
        customMode: false,
        instrumental: false,
        model: 'V5',
        title: `Música para ${nome}`,
        callBackUrl: `${siteUrl}/api/webhook-kie`
      })
    });

    const data = await response.json();
    console.log('KIE.ai response:', JSON.stringify(data));

    if (!response.ok || data.code !== 200) {
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
