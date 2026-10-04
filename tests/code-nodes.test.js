// Testa os Code nodes do n8n fora do n8n: o código roda com $input e $env simulados.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const load = (file) => fs.readFileSync(path.join(__dirname, '..', 'n8n', 'code', file), 'utf8');
const run = (code, input, env = {}) =>
  new Function('$input', '$env', code)({ first: () => ({ json: input }) }, env);

// Payload no formato do webhook do Tally: múltipla escolha chega como id + options
const campo = (label, value, options) => ({ label, value, options });
const escolha = (label, texto) => campo(label, ['a'], [{ id: 'a', text: texto }]);

function ficha(extra = {}) {
  const base = {
    'Como te chamo?': campo('Como te chamo?', 'Marcos Vinícius'),
    'Seu @ do Instagram': campo('Seu @ do Instagram', '@marcos.v'),
    'WhatsApp': campo('WhatsApp', '(27) 99999-1111'),
    'De onde você vem?': escolha('De onde você vem?', 'Vila Velha'),
    'É sua primeira tatuagem?': escolha('É sua primeira tatuagem?', 'Tenho uma ou duas'),
    'Me conta a ideia': campo('Me conta a ideia', 'Uma serpente enrolada num punhal com sombra pesada, estilo oriental, pegando a coxa de lado até o joelho, acompanhando o movimento da perna.'),
    'Referências': campo('Referências', [{ url: 'https://x/1.jpg' }, { url: 'https://x/2.jpg' }]),
    'Onde no corpo?': escolha('Onde no corpo?', 'Coxa'),
    'Foto do local': campo('Foto do local', [{ url: 'https://x/l.jpg' }]),
    'Tamanho aproximado': escolha('Tamanho aproximado', '15 a 25 cm'),
    'É cobertura de uma tattoo antiga?': escolha('É cobertura de uma tattoo antiga?', 'Não'),
    'Preto e cinza ou colorido?': escolha('Preto e cinza ou colorido?', 'Preto e cinza'),
    'Quanto você tem pra investir nesse projeto?': escolha('Quanto você tem pra investir nesse projeto?', 'R$ 2.000 a 4.000'),
    'Quando você quer fazer?': escolha('Quando você quer fazer?', 'Nos próximos 30 dias'),
    'Como você chegou até mim?': escolha('Como você chegou até mim?', 'Indicação'),
    ...extra,
  };
  return { data: { createdAt: '2026-10-04T12:00:00Z', fields: Object.values(base) } };
}

const normaliza = load('normaliza.js');
const resumo = load('resumo.js');

test('ficha completa com indicação e faixa alta vira quente', () => {
  const [{ json }] = run(normaliza, ficha(), { NOTION_DB_ATENDIMENTOS: 'db123' });
  assert.equal(json.termometro, '🔥 Quente');
  assert.ok(json.score >= 8);
  assert.equal(json.regiao, '🏠 Grande Vitória');
  assert.equal(json.waLink, 'https://wa.me/5527999991111');
  assert.equal(json.notion.properties['Entrou em'].date.start, '2026-10-04T12:00:00Z');
});

test('cidade fora da Grande Vitória usa o nome digitado e marca a região', () => {
  const [{ json }] = run(normaliza, ficha({
    'De onde você vem?': escolha('De onde você vem?', 'Fora da Grande Vitória'),
    'Qual cidade?': campo('Qual cidade?', 'Linhares, ES'),
  }));
  assert.equal(json.cidade, 'Linhares, ES');
  assert.equal(json.regiao, '🚗 Fora da Grande Vitória');
});

test('cobertura sem foto perde pontos e ideia vaga também', () => {
  const [{ json }] = run(normaliza, ficha({
    'Me conta a ideia': campo('Me conta a ideia', 'um leão'),
    'É cobertura de uma tattoo antiga?': escolha('É cobertura de uma tattoo antiga?', 'Sim'),
    'Como você chegou até mim?': escolha('Como você chegou até mim?', 'Instagram'),
  }));
  assert.match(json.porque, /-2 cobertura sem foto/);
  assert.match(json.porque, /-1 ideia vaga/);
});

test('parâmetros do WhatsApp respeitam as regras da Meta', () => {
  const [{ json }] = run(normaliza, ficha({
    'Me conta a ideia': campo('Me conta a ideia', 'linha 1\nlinha 2\t     com espaços'),
  }));
  assert.equal(json.waParams.length, 3);
  for (const p of json.waParams) {
    assert.ok(p.length > 0);
    assert.doesNotMatch(p, /[\n\t]| {4,}/);
  }
  assert.equal(json.waParams[0], 'Marcos · R$2.000 a 4.000 · 30 dias · Coxa');
});

test('resumo das 9h lista pendentes e orçados parados', () => {
  const dias = (n) => new Date(Date.now() - n * 86400000).toISOString();
  const card = (nome, status, termo, entrou, editado) => ({
    created_time: dias(entrou),
    last_edited_time: dias(editado),
    properties: {
      Cliente: { title: [{ plain_text: 'EXEMPLO · ' + nome }] },
      Status: { select: { name: status } },
      'Local do corpo': { select: { name: 'Mão' } },
      'Termômetro': { select: { name: termo } },
      'Entrou em': { date: { start: dias(entrou) } },
    },
  });
  const out = run(resumo, { results: [
    card('Pedro', '🆕 Novo', '🌤 Morno', 5, 5),
    card('Lucas', '💬 Orçado', '🌤 Morno', 7, 6),
    card('Bia', '💬 Orçado', '🔥 Quente', 2, 1),
  ] }, { NOTION_DB_ATENDIMENTOS: 'bd61-daa1' });
  const [{ json }] = out;
  assert.equal(json.waParams[0], '1');
  assert.match(json.waParams[1], /Pedro \(Mão\) 🔴5d/);
  assert.equal(json.waParams[2], 'Lucas (6d)');
  assert.equal(json.notionDb, 'bd61daa1');
});

test('dia sem pendência não manda mensagem', () => {
  assert.deepEqual(run(resumo, { results: [] }), []);
});
