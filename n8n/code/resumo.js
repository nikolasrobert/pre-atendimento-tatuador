// === Resumo das 9h · o que está esperando o Russo ===
// Entrada: resposta do Notion (databases/query). Saída: 3 parâmetros do template "resumo_fichas", ou nada.
const res  = ($input.first().json && $input.first().json.results) || [];
const DIA  = 86400000;
const agora = Date.now();

const P       = (pg, k) => (pg.properties && pg.properties[k]) || {};
const nomeDe  = (pg) => (((P(pg, 'Cliente').title || [])[0] || {}).plain_text || 'Sem nome').replace(/^EXEMPLO · /, '').split(' ')[0];
const status  = (pg) => (P(pg, 'Status').select || {}).name || '';
const local   = (pg) => (P(pg, 'Local do corpo').select || {}).name || '';
const termo   = (pg) => ((P(pg, 'Termômetro').select || {}).name || '').split(' ')[0];
const entrou  = (pg) => new Date((P(pg, 'Entrou em').date || {}).start || pg.created_time).getTime();
const parado  = (pg) => Math.floor((agora - entrou(pg)) / DIA);
const semMexer = (pg) => Math.floor((agora - new Date(pg.last_edited_time).getTime()) / DIA);

const esperando = res.filter(pg => /Novo|Triagem/.test(status(pg))).sort((a, b) => entrou(a) - entrou(b));
// Orçado sem ninguém mexer no card há 5+ dias = hora do follow-up. Quem manda é o Russo, à mão (regra da Meta no Direct).
const cutucar   = res.filter(pg => /Orçado/.test(status(pg)) && semMexer(pg) >= 5);

if (!esperando.length && !cutucar.length) return [];   // dia limpo: não manda nada

const limpa = (t, max) => {
  const v = String(t || '').replace(/[\r\n\t]+/g, ' ').replace(/ {4,}/g, '   ').trim();
  return v.length > max ? v.slice(0, max - 1) + '…' : (v || '-');
};
const linha = (pg) => {
  const d = parado(pg);
  return [termo(pg), nomeDe(pg)].filter(Boolean).join(' ') + (local(pg) ? ' (' + local(pg) + ')' : '') + (d >= 2 ? ' 🔴' + d + 'd' : '');
};

return [{
  json: {
    waParams: [
      String(esperando.length),
      limpa(esperando.map(linha).join(' · ') || 'nenhuma', 400),
      limpa(cutucar.map(pg => nomeDe(pg) + ' (' + semMexer(pg) + 'd)').join(' · ') || 'ninguém', 200),
    ],
    notionDb: String($env.NOTION_DB_ATENDIMENTOS || '').replace(/-/g, ''),
  },
}];
