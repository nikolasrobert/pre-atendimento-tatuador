// Os Code nodes do n8n vivem em n8n/code/*.js (fáceis de revisar e testar).
// Este script copia o código pra dentro do n8n/workflow.json, que é o arquivo importado no n8n.
// --check: só confere se estão iguais (usado no CI).
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const wfPath = path.join(root, 'n8n', 'workflow.json');
const map = {
  'Normalizar e pontuar': 'normaliza.js',
  'Montar resumo': 'resumo.js',
  'Config do resumo': 'config.js',
};

const wf = JSON.parse(fs.readFileSync(wfPath, 'utf8'));
const check = process.argv.includes('--check');
let diff = 0;

for (const [nodeName, file] of Object.entries(map)) {
  const node = wf.nodes.find(n => n.name === nodeName);
  if (!node) { console.error(`node não encontrado: ${nodeName}`); process.exit(1); }
  const code = fs.readFileSync(path.join(root, 'n8n', 'code', file), 'utf8');
  if (node.parameters.jsCode !== code) {
    diff++;
    if (check) console.error(`fora de sincronia: ${nodeName} ≠ n8n/code/${file}`);
    else node.parameters.jsCode = code;
  }
}

if (check) {
  if (diff) { console.error('rode: npm run sync'); process.exit(1); }
  console.log('workflow.json em sincronia com n8n/code/');
} else {
  fs.writeFileSync(wfPath, JSON.stringify(wf, null, 2) + '\n');
  console.log(diff ? `${diff} node(s) atualizado(s)` : 'nada pra atualizar');
}
