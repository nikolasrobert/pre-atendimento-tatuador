// Serve as fotos guardadas pela ficha. A chave tem um UUID, então só abre quem tem o link (o card do Notion).
import { getStore } from '@netlify/blobs';

export default async (req) => {
  const key = decodeURIComponent(new URL(req.url).pathname.replace(/^\/arquivo\//, ''));
  if (!/^[0-9a-f-]{36}\/[\w.-]+$/.test(key)) return new Response('não encontrado', { status: 404 });
  const res = await getStore('fichas').getWithMetadata(key, { type: 'stream' });
  if (!res) return new Response('não encontrado', { status: 404 });
  return new Response(res.data, {
    headers: {
      'content-type': (res.metadata && res.metadata.contentType) || 'image/jpeg',
      'cache-control': 'private, max-age=31536000, immutable',
      'x-robots-tag': 'noindex',
    },
  });
};

export const config = { path: '/arquivo/*' };
