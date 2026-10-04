# Colocando no ar

O site público é **só a ficha** (`site/`). As páginas internas (`docs/`) não vão pro ar.

```
celular do cliente → site/index.html → /api/ficha (função Netlify)
                                         ├─ fotos → Netlify Blobs → /arquivo/...
                                         └─ respostas + links → webhook do n8n → Notion + WhatsApp
```

## 1. Netlify (ficha no ar)

1. app.netlify.com → **Add new project → Import from GitHub** → este repositório. O `netlify.toml` já define a pasta `site/` e as funções; não precisa de build command.
2. **Project configuration → Environment variables**:

   | Variável | Valor |
   | --- | --- |
   | `N8N_WEBHOOK_URL` | URL de **produção** do node "Webhook da ficha" (a que tem `/webhook/`, não `/webhook-test/`) |
   | `FICHA_TOKEN` | opcional: um texto aleatório; o n8n confere no header `x-ficha-token` |

3. **Deploys → Trigger deploy** (variável nova só vale depois de um deploy).
4. Em **Domain management**, troque o nome do site por algo curto (ex.: `ficha-russo.netlify.app`). Esse é o link da bio.

Fotos: o celular comprime pra no máximo 1600 px antes de enviar (fica em torno de 300 KB cada). Vídeo vai pelo botão de WhatsApp da ficha, que aparece quando `CONFIG.WHATSAPP_VIDEO` está preenchido em `site/index.html`.

## 2. n8n

1. Importe `n8n/workflow.json`.
2. Credenciais:
   - **Notion** (nos dois nodes do Notion): token de uma integração interna. No Notion, abra o banco **Atendimentos** → `···` → Conexões → adicione a integração. Sem isso a API devolve 404.
   - **WhatsApp Cloud API (Bearer)**: Header Auth com `Authorization` = `Bearer <token>`.
3. Variáveis de ambiente do n8n (ou o objeto `CFG` no topo dos nodes "Normalizar e pontuar" e "Config do resumo", se o seu n8n bloqueia `$env`):

   | Variável | Teste | Produção |
   | --- | --- | --- |
   | `NOTION_DB_ATENDIMENTOS` | id do banco | id do banco |
   | `NOTION_USER_ID` | seu id de usuário no Notion (a menção dispara a notificação do app) | id do tatuador |
   | `WA_PHONE_NUMBER_ID` | número de teste da Meta | número do bot |
   | `WA_RUSSO` | seu WhatsApp (55 + DDD) | WhatsApp do tatuador |
   | `WA_MODO` | `texto` | `modelo` |
   | `WA_AVISAR_TODAS` | `sim` | `nao` |

4. Opcional: no node "Webhook da ficha", Authentication = Header Auth com nome `x-ficha-token` e o mesmo valor do `FICHA_TOKEN`.
5. **Ative** o workflow.

## 3. WhatsApp para o teste (sem modelo aprovado)

1. developers.facebook.com → seu app → WhatsApp → **API Setup**.
2. Use o **número de teste** da Meta como remetente e cadastre seu WhatsApp como destinatário (chega um código).
3. Mande qualquer mensagem do seu WhatsApp para o número de teste. Isso abre a janela de 24 h em que `WA_MODO=texto` funciona sem modelo aprovado.
4. O token temporário da página dura 24 h. Para não expirar no meio do teste, gere um token de usuário do sistema.

## 4. Teste

1. Abra o link no celular e preencha como cliente.
2. Em segundos: card novo no Notion (com menção = notificação no app) e aviso no WhatsApp.
3. Fotos: abra o card; as imagens vêm de `/arquivo/...` no próprio site.
4. Se algo falhar: Netlify → Logs → Functions → `ficha`; n8n → Executions.

## Antes de ir pro cliente de verdade

- `npm run placeholders` sem nada pendente (prazo, sinal, Pix, endereço).
- `WA_MODO=modelo` com os modelos aprovados e `WA_AVISAR_TODAS=nao`.
- `CONFIG.WHATSAPP_VIDEO` com o WhatsApp do tatuador.
- Apagar os cards `EXEMPLO ·` do Notion.
