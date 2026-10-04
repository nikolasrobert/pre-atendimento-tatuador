// Testa a função do Netlify que recebe a ficha, sem Netlify: store e fetch simulados.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const { pathToFileURL } = require('url');

const carregar = () => import(pathToFileURL(path.join(__dirname, '..', 'netlify', 'functions', 'ficha.mjs')).href);

function deps(resposta = { ok: true, status: 200 }) {
  const salvos = {}; const chamadas = [];
  return {
    salvos, chamadas,
    store: { set: async (k, v, o) => { salvos[k] = { bytes: v.byteLength, ...o }; } },
    env: { N8N_WEBHOOK_URL: 'https://n8n.exemplo/webhook/russo-preatendimento', FICHA_TOKEN: 'segredo' },
    fetch: async (url, opt) => { chamadas.push({ url, opt }); return { ok: resposta.ok, status: resposta.status, text: async () => '' }; },
  };
}

function envio({ site = '' } = {}) {
  const fd = new FormData();
  fd.append('respostas', JSON.stringify([
    { label: 'Como te chamo?', value: 'Marcos' },
    { label: 'Quando você consegue vir?', value: ['Sábado', 'Sou flexível'] },
  ]));
  fd.append('site', site);
  fd.append('arquivo:Foto do local', new File([new Uint8Array(2048)], 'local.jpg', { type: 'image/jpeg' }));
  fd.append('arquivo:Referências', new File([new Uint8Array(1024)], 'ref.jpg', { type: 'image/jpeg' }));
  fd.append('arquivo:Referências', new File(['x'], 'virus.exe', { type: 'application/octet-stream' }));
  return new Request('https://ficha.exemplo/api/ficha', { method: 'POST', body: fd });
}

test('guarda as fotos e repassa no formato do Tally', async () => {
  const { processar } = await carregar();
  const d = deps();
  const r = await processar(envio(), d);
  assert.equal(r.status, 200);
  assert.equal(Object.keys(d.salvos).length, 2, 'só as imagens são guardadas');
  assert.equal(d.chamadas.length, 1);
  assert.equal(d.chamadas[0].opt.headers['x-ficha-token'], 'segredo');
  const body = JSON.parse(d.chamadas[0].opt.body);
  assert.equal(body.eventType, 'FORM_RESPONSE');
  const campo = (l) => body.data.fields.find(f => f.label === l);
  assert.equal(campo('Como te chamo?').value, 'Marcos');
  assert.deepEqual(campo('Quando você consegue vir?').value, ['Sábado', 'Sou flexível']);
  assert.match(campo('Foto do local').value[0].url, /^https:\/\/ficha\.exemplo\/arquivo\/[0-9a-f-]{36}\/\d+-local\.jpg$/);
  assert.equal(campo('Referências').value.length, 1);
});

test('honeypot preenchido não chega no n8n', async () => {
  const { processar } = await carregar();
  const d = deps();
  const r = await processar(envio({ site: 'http://spam' }), d);
  assert.equal(r.status, 200);
  assert.equal(d.chamadas.length, 0);
});

test('erro do n8n vira erro pro cliente tentar de novo', async () => {
  const { processar } = await carregar();
  const d = deps({ ok: false, status: 500 });
  const r = await processar(envio(), d);
  assert.equal(r.status, 502);
});

test('sem N8N_WEBHOOK_URL a função avisa', async () => {
  const { processar } = await carregar();
  const d = deps(); d.env = {};
  const r = await processar(envio(), d);
  assert.equal(r.status, 500);
});
