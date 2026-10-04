// === Configuração do resumo das 9h ===
// Lê do ambiente do n8n. Se o seu n8n bloqueia $env (N8N_BLOCK_ENV_ACCESS_IN_NODE=true),
// preencha o CFG aqui no editor do n8n. Não commite valores reais.
const CFG = {
  NOTION_DB_ATENDIMENTOS: '',
  WA_PHONE_NUMBER_ID: '',
  WA_RUSSO: '',
  WA_API_VERSION: 'v23.0',
  WA_MODO: 'modelo',   // 'texto' no teste com o número de teste da Meta (janela de 24h)
};
const envGet = (k) => { let v; try { v = $env[k]; } catch (e) {} return (v !== undefined && v !== '') ? v : CFG[k]; };

return [{
  json: {
    db: String(envGet('NOTION_DB_ATENDIMENTOS') || '').replace(/-/g, ''),
    wa: {
      url: 'https://graph.facebook.com/' + envGet('WA_API_VERSION') + '/' + envGet('WA_PHONE_NUMBER_ID') + '/messages',
      to: String(envGet('WA_RUSSO') || '').replace(/\D/g, ''),
      modo: envGet('WA_MODO') === 'texto' ? 'texto' : 'modelo',
    },
  },
}];
