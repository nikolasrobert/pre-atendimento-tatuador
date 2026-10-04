// Lista os {{TOKENS}} que ainda faltam na ficha (site/) e nas páginas (docs/) (dados que o tatuador precisa passar).
// --strict: sai com erro se sobrar algum. Use antes de publicar pra cliente.
const fs = require('fs');
const path = require('path');

const raiz = path.join(__dirname, '..');
const found = {};
const arquivos = ['site', 'docs'].flatMap(d =>
  fs.readdirSync(path.join(raiz, d)).filter(f => f.endsWith('.html')).map(f => path.join(d, f)));
for (const f of arquivos) {
  const html = fs.readFileSync(path.join(raiz, f), 'utf8');
  // <code>{{TOKEN}}</code> é documentação sobre o token, não copy: não conta
  const copy = html.replace(/<code>\{\{[A-Z_]+\}\}<\/code>/g, '');
  for (const m of copy.matchAll(/\{\{([A-Z_]+)\}\}/g)) {
    (found[m[1]] = found[m[1]] || new Set()).add(f);
  }
}

const tokens = Object.keys(found).sort();
if (!tokens.length) { console.log('nenhum placeholder: pronto pra publicar'); process.exit(0); }
console.log(`${tokens.length} placeholder(s) pendente(s):`);
for (const t of tokens) console.log(`  {{${t}}}  →  ${[...found[t]].join(', ')}`);
if (process.argv.includes('--strict')) process.exit(1);
