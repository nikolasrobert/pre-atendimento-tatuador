# Histórico de decisões

Cada etapa abaixo virou um ou mais commits. As decisões ficam registradas aqui junto com o motivo, porque o motivo é o que some primeiro.

## Fundação
- Primeiro contato pelo Instagram, com a resposta automática nativa mandando o link da ficha. ManyChat descartado: o plano grátis caiu pra 25 contatos por mês.
- Ficha no Tally (free): lógica condicional, upload de até 10 MB por arquivo, webhook pro n8n.
- Notion como painel, em vez de planilha: board por termômetro, agenda e galeria de referências saem de graça.
- Score de 0 a 10+ no n8n separa 🔥 quente, 🌤 morno e ❄️ frio. Frio nunca fica sem resposta, só vai pro bloco da semana.
- Dado de saúde fica fora da ficha e do Notion (LGPD). Anamnese é no estúdio, assinada.

## Ficha e primeiro contato
- Protótipo clicável da ficha, mobile-first, com o card do Notion e o aviso que saem no final.
- Roteiro das primeiras 72 horas: quatro portas de entrada, seis desvios e um único follow-up, sempre escrito à mão (regra do Human Agent tag da Meta).

## Voz do Russo
- Toda a copy reescrita a partir do perfil real dele: abre pelo nome da peça, "brabo", "tamo junto", quase sem emoji, frases curtas, sem travessão.
- Tela nova de freehand na ficha: ele desenha na pele, não manda desenho pronto antes.
- Cobertura confirmada como serviço. FAQ e resposta salva `/cover` incluídos.
- Revisão de copy derrubou 8 promessas que ninguém tinha confirmado com ele (prazos, percentuais, política de retoque).
- Dados que faltam viraram `{{TOKENS}}`. Nada vai pro cliente enquanto sobrar algum.

## Notion de verdade
- Banco criado com 5 views, fórmula "Parado há" e layout de página com os campos que importam no topo.
- "Entrou em" virou data escrita pelo n8n (a partir do `createdAt` do Tally), pra permitir importar histórico.
- 19 cards de exemplo simulando duas semanas de uso.

## Aviso ao tatuador: Telegram → WhatsApp
- Telegram saiu: o tatuador não usaria. Entrou a WhatsApp Cloud API oficial.
- Ficha quente apita na hora. Morno e frio não apitam: entram num resumo único às 9h, que também lista orçados parados há 5 dias ou mais.
- Custo verificado na tabela da Meta de 1º/out/2026: ~R$ 0,035 por modelo de Utilidade no Brasil.

## Foco na Grande Vitória
- Pergunta de cidade virou escolha: Vitória, Vila Velha, Serra, Cariacica, Viana, Guarapari, Fundão ou "Fora da Grande Vitória" (que abre "Qual cidade?").
- Nova propriedade Região no Notion: 🏠 Grande Vitória ou 🚗 Fora da Grande Vitória.

## Repositório
- Code nodes do n8n extraídos pra `n8n/code/`, com testes e um script que mantém o `workflow.json` em sincronia.
- CI no GitHub Actions: JSON válido, código compila, sincronia e testes.
- Site estático em `docs/`, pronto pro Netlify publicar a cada push.
