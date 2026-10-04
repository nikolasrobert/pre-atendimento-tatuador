// Recebe a ficha do site, guarda as fotos no Netlify Blobs e repassa pro n8n
// no mesmo formato do webhook do Tally (assim o workflow não muda).
//
// Variáveis no Netlify: N8N_WEBHOOK_URL (obrigatória) e FICHA_TOKEN (opcional,
// mandado no header x-ficha-token pro n8n conferir).
const MAX_ARQUIVOS = 12;
const MAX_BYTES = 4.5 * 1024 * 1024;  // por arquivo, depois da compressão no celular
const TIPOS = /^image\/(jpeg|png|webp|heic|heif|gif)$/;

const json = (status, obj) => new Response(JSON.stringify(obj), {
  status, headers: { 'content-type': 'application/json; charset=utf-8' },
});

export async function processar(req, { store, env, fetch }) {
  if (req.method !== 'POST') return json(405, { erro: 'Método não permitido.' });

  const destino = env.N8N_WEBHOOK_URL;
  if (!destino) return json(500, { erro: 'Ficha fora do ar por configuração. Me chama no direct.' });

  let form;
  try { form = await req.formData(); }
  catch { return json(400, { erro: 'Não consegui ler o envio. Tenta de novo.' }); }

  // honeypot: robô preenche o campo escondido, gente não
  if (String(form.get('site') || '').trim()) return json(200, { ok: true });

  let respostas;
  try { respostas = JSON.parse(String(form.get('respostas') || '[]')); }
  catch { return json(400, { erro: 'Respostas inválidas.' }); }
  if (!Array.isArray(respostas) || !respostas.length) return json(400, { erro: 'Ficha vazia.' });

  const id = crypto.randomUUID();
  const origem = new URL(req.url).origin;
  const arquivos = {};  // label -> [{ url }]
  let n = 0;

  for (const [chave, valor] of form.entries()) {
    if (!chave.startsWith('arquivo:') || typeof valor === 'string') continue;
    if (++n > MAX_ARQUIVOS) break;
    if (!TIPOS.test(valor.type) || valor.size > MAX_BYTES) continue;
    const label = chave.slice('arquivo:'.length);
    const nome = String(valor.name || 'foto.jpg').replace(/[^\w.-]/g, '_');
    const key = `${id}/${n}-${nome}`;
    await store.set(key, await valor.arrayBuffer(), { metadata: { contentType: valor.type } });
    (arquivos[label] = arquivos[label] || []).push({ url: `${origem}/arquivo/${key}` });
  }

  const fields = respostas
    .filter(r => r && typeof r.label === 'string')
    .map(r => ({ label: r.label.slice(0, 200), value: Array.isArray(r.value) ? r.value.map(String) : String(r.value).slice(0, 5000) }));
  for (const [label, lista] of Object.entries(arquivos)) fields.push({ label, value: lista });

  const payload = {
    eventType: 'FORM_RESPONSE',
    source: 'site',
    data: { responseId: id, createdAt: new Date().toISOString(), fields },
  };

  try {
    const r = await fetch(destino, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(env.FICHA_TOKEN ? { 'x-ficha-token': env.FICHA_TOKEN } : {}),
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(9000),
    });
    if (!r.ok) {
      console.error('n8n respondeu', r.status, await r.text().catch(() => ''));
      return json(502, { erro: 'A ficha não chegou do outro lado. Tenta de novo em um minuto.' });
    }
  } catch (e) {
    // timeout: o n8n pode ter recebido e só demorado pra responder
    console.error('falha ao chamar o n8n', e && e.name, e && e.message);
    if (e && e.name === 'TimeoutError') return json(200, { ok: true, id, aviso: 'n8n demorou pra responder' });
    return json(502, { erro: 'A ficha não chegou do outro lado. Tenta de novo em um minuto.' });
  }

  return json(200, { ok: true, id });
}

export default async (req) => {
  const { getStore } = await import('@netlify/blobs');
  return processar(req, { store: getStore('fichas'), env: process.env, fetch: globalThis.fetch });
};

export const config = { path: '/api/ficha' };
