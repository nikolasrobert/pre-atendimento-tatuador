// Lista os {{TOKENS}} que ainda faltam nas páginas (dados que o tatuador precisa passar).
// --strict: sai com erro se sobrar algum. Use antes de publicar pra cliente.
const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '..', 'docs');
const found = {};
for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.html'))) {
  const html = fs.readFileSync(path.join(dir, f), 'utf8');
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
