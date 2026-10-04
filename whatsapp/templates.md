# Modelos de mensagem (WhatsApp Cloud API)

Cadastrar no Gerenciador do WhatsApp → Modelos. Categoria **Utilidade**, idioma **Português (BR)**. A Meta pede um exemplo pra cada variável.

Regras que o n8n já respeita: variável não pode ter quebra de linha, tab nem 4 espaços seguidos, e o texto não começa nem termina numa variável.

## `ficha_quente`

```
🔥 Ficha quente: {{1}}

Ideia: {{2}}
Detalhes: {{3}}

Nota e motivos estão no card.
```

Botão de link "Abrir card", URL dinâmica `https://www.notion.so/{{1}}` (o n8n manda o id da página).

Exemplo do que aparece na tela bloqueada: `🔥 Ficha quente: Marcos · R$2.000 a 4.000 · 30 dias · Coxa`

## `resumo_fichas`

```
Bom dia. Fichas esperando resposta: {{1}}

{{2}}

Orçados pra cutucar: {{3}}

Abre a aba Responder hoje no Notion.
```

Botão de link "Abrir Notion", URL dinâmica `https://www.notion.so/{{1}}` (o n8n manda o id do database). Só sai se tiver alguma pendência.

## Custo

Desde 1º/out/2026 a Meta cobra todo modelo de Utilidade no Brasil: cerca de R$ 0,035 (US$ 0,0068) por mensagem. Com 30 avisos e 30 resumos por mês, uns R$ 2. Se a Meta reclassificar como Marketing, sobe pra ~R$ 0,32 cada; por isso os textos são secos.
