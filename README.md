# Estúdio Marcele Gianni — Funil de Música com IA

## Estrutura do projeto

```
musica-ia/
├── index.html               ← Funil completo (frontend)
├── vercel.json              ← Configuração do Vercel
└── api/
    ├── criar-cobranca.js    ← Cria cobrança Pix no AbacatePay
    ├── verificar-pagamento.js ← Verifica se Pix foi pago
    └── webhook.js           ← Recebe confirmação de pagamento
```

---

## Deploy passo a passo

### 1. Subir no GitHub

1. Acessa github.com → New Repository
2. Nome: `musica-ia` → Create
3. Clica em "uploading an existing file"
4. Arrasta TODOS os arquivos desta pasta (incluindo a pasta `api/`)
5. Clica "Commit changes"

### 2. Conectar ao Vercel

1. Acessa vercel.com → Add New Project
2. Seleciona o repositório `musica-ia`
3. Clica Deploy (não muda nada)
4. Aguarda — em 1 minuto o site está no ar

### 3. Configurar variáveis de ambiente

No painel do Vercel → Settings → Environment Variables, adiciona:

| Nome | Valor |
|------|-------|
| `ABACATE_API_KEY` | Sua chave do AbacatePay |
| `SITE_URL` | https://musica-ia.vercel.app |

Depois de adicionar, vai em **Deployments → Redeploy** para aplicar.

### 4. Configurar Webhook no AbacatePay

1. Acessa painel.abacatepay.com → Webhooks
2. Adiciona a URL: `https://musica-ia.vercel.app/api/webhook`
3. Seleciona o evento: `BILLING_PAID`
4. Salva

---

## Testando

1. Acessa seu site `https://musica-ia.vercel.app`
2. Preenche o quiz até a tela de pagamento
3. Coloca seu próprio email e clica em Pagar
4. Uma aba abre com o QR Code do Pix
5. Paga com qualquer valor de teste
6. O site detecta o pagamento e vai pra tela de download

---

## Próximos passos

- [ ] Domínio próprio (ex: estudiomarcelegi anni.com.br)
- [ ] Integrar KIE.ai para gerar música real após pagamento
- [ ] Enviar link de download por email automaticamente
