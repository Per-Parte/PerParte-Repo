// O valor é lido no build e no runtime da API; mudar na Vercel exige novo deploy.
export function lerModoCaptacao(ambiente = process.env) {
  const valor = String(ambiente.PERPARTE_LP_ATIVA ?? '').trim().toLowerCase();
  if (valor === '' || valor === 'false') return false;
  if (valor === 'true') return true;
  const erro = new Error('PERPARTE_LP_ATIVA deve ser TRUE ou FALSE; deixe ausente para manter o site atual.');
  erro.code = 'CONFIGURACAO_LP_INVALIDA';
  throw erro;
}

export function lerModoGerado(conteudo) {
  const modo = JSON.parse(conteudo);
  if (!modo || typeof modo.captacaoAtiva !== 'boolean') throw new Error('Modo do build inválido. Execute npm run site:build novamente.');
  return modo.captacaoAtiva;
}
