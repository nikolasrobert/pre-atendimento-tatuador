// === Pré-atendimento Russo · normaliza o payload do Tally e pontua o lead ===
// Entrada: webhook do Tally (FORM_RESPONSE). Saída: 1 item pronto pro Notion + WhatsApp.

const body = $input.first().json;
const fields = (body && body.data && body.data.fields) || [];

// Tally manda [{key, label, type, value, options?}]. Vira um objeto label -> valor legível.
const raw = {};
for (const f of fields) {
  let v = f.value;
  if (Array.isArray(v) && Array.isArray(f.options)) {
    // múltipla escolha / dropdown / checkboxes: value é array de ids
    v = v.map(id => (f.options.find(o => o.id === id) || {}).text).filter(Boolean).join(', ');
  } else if (Array.isArray(v) && v.length && v[0] && v[0].url) {
    // upload de arquivos
    v = v.map(a => a.url);
  } else if (Array.isArray(v)) {
    v = v.join(', ');
  }
  raw[String(f.label || '').trim()] = v;
}

const get = (label, fb = '') => {
  const v = raw[label];
  return (v === undefined || v === null || v === '') ? fb : v;
};
const arr = (label) => {
  const v = raw[label];
  return Array.isArray(v) ? v : (v ? [v] : []);
};

// --- campos ---
const nome        = String(get('Como te chamo?', 'Sem nome'));
const insta       = String(get('Seu @ do Instagram')).trim().replace(/^@/, '').replace(/\s+/g, '');
const whats       = String(get('WhatsApp')).replace(/\D/g, '');
const cidadeOpc   = String(get('De onde você vem?'));
const cidadeOutra = String(get('Qual cidade?')).trim();
const cidade      = cidadeOutra || cidadeOpc;
const regiao      = /fora da grande vit/i.test(cidadeOpc) ? '🚗 Fora da Grande Vitória' : (cidadeOpc ? '🏠 Grande Vitória' : '');
const experiencia = String(get('É sua primeira tatuagem?'));
const ideia       = String(get('Me conta a ideia'));
const refs        = arr('Referências');
const refLink     = String(get('Link de pasta / Pinterest'));
const local       = String(get('Onde no corpo?'));
const fotoLocal   = arr('Foto do local');
const tamanho     = String(get('Tamanho aproximado'));
const coberturaTx = String(get('É cobertura de uma tattoo antiga?'));
const cobertura   = /^sim/i.test(coberturaTx.trim());
const fotoCover   = arr('Foto da tattoo que vai ser coberta');
const cor         = String(get('Preto e cinza ou colorido?'));
const faixa       = String(get('Quanto você tem pra investir nesse projeto?'));
const prazo       = String(get('Quando você quer fazer?'));
const dataLimite  = String(get('Qual a data?'));
const disp        = String(get('Quando você consegue vir?'));
const origem      = String(get('Como você chegou até mim?'));

// --- pontuação ---
let score = 0;
const porque = [];
const add = (p, motivo) => { score += p; porque.push((p > 0 ? '+' : '') + p + ' ' + motivo); };

if (/j[áa] me tatuou/i.test(experiencia)) add(3, 'já é cliente');
if (/indica/i.test(origem)) add(2, 'veio por indicação');
if (refs.length || refLink) add(2, 'mandou referência');
if (fotoLocal.length) add(2, 'mandou foto do local');

if (/4\.?000|acima/i.test(faixa)) add(3, 'faixa alta');
else if (/2\.?000/i.test(faixa)) add(3, 'faixa alta');
else if (/1\.?000/i.test(faixa)) add(2, 'faixa média');
else if (/500/i.test(faixa)) add(1, 'faixa inicial');

if (/data marcada/i.test(prazo)) add(2, 'tem data marcada');
else if (/30 dias/i.test(prazo)) add(1, 'quer nos próximos 30 dias');

if (ideia.length > 120) add(1, 'descreveu bem a ideia');
if (ideia.length > 0 && ideia.length < 40) add(-1, 'ideia vaga');
if (cobertura && !fotoCover.length) add(-2, 'cobertura sem foto');
if (/at[ée] R\$ ?500/i.test(faixa) && /(15|25|fechamento)/i.test(tamanho)) add(-2, 'orçamento x tamanho incompatível');

const termometro = score >= 8 ? '🔥 Quente' : (score >= 4 ? '🌤 Morno' : '❄️ Frio');

// --- helpers Notion ---
const txt  = (s) => ({ rich_text: [{ type: 'text', text: { content: String(s || '').slice(0, 1900) } }] });
const sel  = (s) => (s ? { select: { name: String(s).slice(0, 90) } } : { select: null });
const file = (urls, prefixo) => ({
  files: (urls || []).slice(0, 10).map((u, i) => ({
    type: 'external',
    name: prefixo + '-' + (i + 1),
    external: { url: u },
  })),
});

const waLink = whats ? 'https://wa.me/' + (whats.length <= 11 ? '55' + whats : whats) : '';
const igLink = insta ? 'https://instagram.com/' + insta : '';

const notion = {
  parent: { database_id: $env.NOTION_DB_ATENDIMENTOS || 'COLE_AQUI_O_ID_DO_DATABASE' },
  icon: { type: 'emoji', emoji: score >= 8 ? '🔥' : (score >= 4 ? '🌤' : '❄️') },
  properties: {
    'Cliente':                { title: [{ type: 'text', text: { content: nome } }] },
    'Status':                 sel('🆕 Novo'),
    'Entrou em':              { date: { start: (body && body.data && body.data.createdAt) || new Date().toISOString() } },
    'Termômetro':             sel(termometro),
    'Score':                  { number: score },
    'Por que essa nota':      txt(porque.join(' · ')),
    'Instagram':              { url: igLink || null },
    'WhatsApp':               { url: waLink || null },
    'Cidade':                 txt(cidade),
    'Região':                 sel(regiao),
    'Experiência':            sel(experiencia),
    'Ideia':                  txt(ideia),
    'Local do corpo':         sel(local),
    'Tamanho':                sel(tamanho),
    'Cor':                    sel(cor),
    'Cobertura':              { checkbox: cobertura },
    'Faixa de investimento':  sel(faixa),
    'Prazo':                  sel(prazo),
    'Data limite':            dataLimite ? { date: { start: dataLimite } } : { date: null },
    'Disponibilidade':        txt(disp),
    'Origem':                 sel(origem),
    'Referências':            file(refs, 'ref'),
    'Foto do local':          file(fotoLocal, 'local'),
    'Cover atual':            file(fotoCover, 'cover'),
  },
  children: [
    { object: 'block', type: 'heading_3', heading_3: { rich_text: [{ type: 'text', text: { content: 'A ideia, nas palavras do cliente' } }] } },
    { object: 'block', type: 'quote', quote: { rich_text: [{ type: 'text', text: { content: ideia || '(não descreveu)' } }] } },
    { object: 'block', type: 'heading_3', heading_3: { rich_text: [{ type: 'text', text: { content: 'Rascunho de resposta' } }] } },
    { object: 'block', type: 'paragraph', paragraph: { rich_text: [{ type: 'text', text: { content:
      'Fala ' + nome.split(' ')[0] + '! Curti sua ideia. ' +
      (cobertura ? 'Cobertura dá pra fazer. O desenho tem que nascer em cima do que já tem, te explico. ' : '') +
      'Sobre a ideia: ' } }] } },
  ],
};

// WhatsApp (template "ficha_quente"): parâmetro não aceita quebra de linha, tab nem 4+ espaços seguidos
const limpa = (t, max) => {
  const v = String(t || '').replace(/[\r\n\t]+/g, ' ').replace(/ {4,}/g, '   ').trim();
  return v.length > max ? v.slice(0, max - 1) + '…' : (v || '-');
};
const primeiro   = (nome.split(' ')[0] || 'Sem nome');
const prazoCurto = /data marcada/i.test(prazo) ? ('data ' + (dataLimite || 'marcada'))
                 : (/30 dias/i.test(prazo) ? '30 dias' : 'sem pressa');
const faixaCurta = faixa.replace('Prefiro que você me diga', 'sem faixa').replace(/R\$ ?/g, 'R$');
// {{1}} vai na 1a linha, a que aparece na tela bloqueada: "🔥 Ficha quente: Marcos · R$2.000 a 4.000 · 30 dias · Coxa"
const waParams = [
  limpa([primeiro, faixaCurta, prazoCurto, local].filter(Boolean).join(' · '), 80),
  limpa(ideia, 220),
  limpa([
    tamanho, cor, cobertura ? 'COBERTURA' : '', cidade, insta ? '@' + insta : '',
    refs.length + (refs.length === 1 ? ' referência' : ' referências') + (fotoLocal.length ? ' + foto do local' : ' · SEM foto do local'),
  ].filter(Boolean).join(' · '), 300),
];

return [{
  json: {
    nome, insta, whats, waLink, igLink, cidade, ideia, local, tamanho, cor,
    cobertura, faixa, prazo, dataLimite, origem, experiencia, regiao,
    refs, fotoLocal, fotoCover,
    score, termometro, porque: porque.join(' · '),
    waParams,
    notion,
  },
}];
