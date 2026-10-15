// Resend Contacts: cadastro explícito, sem chamadas de envio, eventos ou automações.
// Contratos: https://resend.com/docs/api-reference/contacts/create-contact
// https://resend.com/docs/api-reference/contacts/get-contact
// https://resend.com/docs/api-reference/contacts/update-contact
export const VERSAO_CONSENTIMENTO = '2026-10-14';
export const PROPRIEDADES_CAPTACAO = Object.freeze([
  'perparte_lp_origem',
  'perparte_lp_consentimento_versao',
  'perparte_lp_consentimento_em',
]);
const LIMITE_CORPO = 4096;
const objeto = valor => valor !== null && typeof valor === 'object' && !Array.isArray(valor);
class ErroCaptacao extends Error {
  constructor(status, codigo, mensagem) { super(mensagem); this.status = status; this.codigo = codigo; }
}
const falhar = (status, codigo, mensagem) => { throw new ErroCaptacao(status, codigo, mensagem); };

function configuracao(ambiente) {
  // A chave transacional RESEND_API_KEY nunca serve como fallback de contatos.
  const chave = String(ambiente.RESEND_CONTACTS_API_KEY || '').trim();
  if (chave && (chave.length > 512 || /\s/u.test(chave))) falhar(503, 'CAPTACAO_INDISPONIVEL', 'O cadastro está temporariamente indisponível. Tente novamente mais tarde.');
  const origens = String(ambiente.SITE_ORIGINS || '').split(',').map(item => item.trim()).filter(Boolean).map(item => {
    try {
      const url = new URL(item);
      if (!['https:', 'http:'].includes(url.protocol) || url.origin !== item) throw new Error();
      return url.origin;
    } catch { falhar(503, 'CAPTACAO_INDISPONIVEL', 'O cadastro está temporariamente indisponível. Tente novamente mais tarde.'); }
  });
  return { chave, origens, desenvolvimento: ambiente.NODE_ENV !== 'production' && ambiente.VERCEL !== '1' };
}

export function lerConfiguracaoCaptacao(ambiente = process.env) {
  return { disponivel: Boolean(configuracao(ambiente).chave) };
}

function validarOrigem(pedido, config) {
  const origem = pedido.headers.origin;
  if (typeof origem !== 'string' || pedido.headers['sec-fetch-site'] === 'cross-site') falhar(403, 'ORIGEM_INVALIDA', 'O cadastro deve começar neste site.');
  const origens = new Set(config.origens);
  const host = pedido.headers.host;
  if (config.desenvolvimento && /^(?:localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/.test(host || '')) origens.add(`http://${host}`);
  if (!origens.has(origem)) falhar(403, 'ORIGEM_INVALIDA', 'O cadastro deve começar neste site.');
}

async function lerCorpo(pedido) {
  if (pedido.headers['content-type']?.split(';')[0].trim().toLowerCase() !== 'application/json') falhar(415, 'FORMATO_INVALIDO', 'Envie application/json.');
  if (Number(pedido.headers['content-length']) > LIMITE_CORPO) falhar(413, 'CORPO_GRANDE', 'O cadastro excede o tamanho permitido.');
  const partes = []; let tamanho = 0;
  try {
    for await (const parte of pedido) {
      const bytes = Buffer.isBuffer(parte) ? parte : Buffer.from(parte);
      tamanho += bytes.length;
      if (tamanho > LIMITE_CORPO) falhar(413, 'CORPO_GRANDE', 'O cadastro excede o tamanho permitido.');
      partes.push(bytes);
    }
  } catch (erro) {
    if (erro instanceof ErroCaptacao) throw erro;
    falhar(400, 'JSON_INVALIDO', 'Não foi possível ler o cadastro. Tente novamente.');
  }
  try {
    const corpo = JSON.parse(Buffer.concat(partes).toString('utf8'));
    if (!objeto(corpo)) throw new Error();
    return corpo;
  } catch { falhar(400, 'JSON_INVALIDO', 'Envie um cadastro válido.'); }
}

function validarCadastro(corpo) {
  const campos = ['email', 'nome', 'consentimento', 'versaoConsentimento', 'website'];
  if (Object.keys(corpo).some(chave => !campos.includes(chave))) falhar(400, 'DADO_INVALIDO', 'O cadastro contém campos não reconhecidos.');
  if (typeof corpo.email !== 'string' || corpo.email.length > 254 || /[\s\u0000-\u001f\u007f]/u.test(corpo.email.trim())) falhar(400, 'EMAIL_INVALIDO', 'Informe um e-mail válido.');
  const email = corpo.email.trim().toLowerCase();
  const [local, dominio, extra] = email.split('@');
  if (!local || local.length > 64 || !/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+$/i.test(local) || local.startsWith('.') || local.endsWith('.') || local.includes('..') || extra !== undefined || !dominio?.includes('.') || dominio.split('.').some(parte => !/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i.test(parte))) falhar(400, 'EMAIL_INVALIDO', 'Informe um e-mail válido.');
  if (corpo.nome !== undefined && (typeof corpo.nome !== 'string' || corpo.nome.length > 100 || /[\u0000-\u001f\u007f]/u.test(corpo.nome))) falhar(400, 'NOME_INVALIDO', 'Informe um nome de até 100 caracteres.');
  if (corpo.consentimento !== true || corpo.versaoConsentimento !== VERSAO_CONSENTIMENTO) falhar(400, 'CONSENTIMENTO_NECESSARIO', 'Confirme que deseja receber novidades da Per Parte.');
  if (corpo.website !== undefined && (typeof corpo.website !== 'string' || corpo.website.trim() !== '')) falhar(400, 'CADASTRO_INVALIDO', 'Não foi possível validar o cadastro.');
  return { email, nome: (corpo.nome || '').trim().replace(/\s+/gu, ' ') };
}

function responder(resposta, status, dados, extras = {}) {
  resposta.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer', ...extras });
  resposta.end(JSON.stringify(dados));
}

function validarContato(contato, email) {
  if (!objeto(contato) || contato.object !== 'contact' || typeof contato.id !== 'string' || !contato.id || contato.email?.toLowerCase() !== email || typeof contato.unsubscribed !== 'boolean') falhar(502, 'CAPTACAO_RESPOSTA_INVALIDA', 'Não foi possível confirmar o cadastro. Tente novamente.');
  // Não expor existência, preferências ou identificador do contato ao navegador.
  if (contato.unsubscribed) falhar(409, 'CADASTRO_NAO_CONCLUIDO', 'Não foi possível concluir este cadastro. Entre em contato com a Per Parte.');
  return contato;
}

function consentimentoRegistrado(contato) {
  const propriedades = contato.properties;
  return propriedades?.perparte_lp_origem?.value === 'lp'
    && propriedades?.perparte_lp_consentimento_versao?.value === VERSAO_CONSENTIMENTO
    && typeof propriedades?.perparte_lp_consentimento_em?.value === 'string'
    && Number.isFinite(Date.parse(propriedades.perparte_lp_consentimento_em.value));
}

export function criarApiCaptacao({ ambiente = process.env, fetchImpl = globalThis.fetch, timeoutMs = 8000, agora = () => new Date() } = {}) {
  async function consultar(config, caminho, method, corpo, signal, permiteAusente = false) {
    let resposta;
    try {
      resposta = await fetchImpl(`https://api.resend.com${caminho}`, {
        method, headers: { Authorization: `Bearer ${config.chave}`, Accept: 'application/json', ...(corpo ? { 'Content-Type': 'application/json' } : {}) },
        ...(corpo ? { body: JSON.stringify(corpo) } : {}), signal, redirect: 'error',
      });
    } catch { falhar(503, 'CAPTACAO_INDISPONIVEL', 'Não foi possível confirmar o cadastro. Tente novamente em instantes.'); }
    if (permiteAusente && resposta.status === 404) return null;
    if (!resposta.ok) {
      if (resposta.status === 429) falhar(429, 'CAPTACAO_LIMITE', 'Aguarde um momento antes de tentar novamente.');
      falhar(503, 'CAPTACAO_INDISPONIVEL', 'Não foi possível confirmar o cadastro. Tente novamente em instantes.');
    }
    try { return await resposta.json(); }
    catch { falhar(502, 'CAPTACAO_RESPOSTA_INVALIDA', 'Não foi possível confirmar o cadastro. Tente novamente.'); }
  }

  return async function apiCaptacao(pedido, resposta, url) {
    if (url.pathname !== '/api/captacao') return false;
    try {
      if (pedido.method !== 'POST') {
        responder(resposta, 405, { erro: { codigo: 'METODO_INVALIDO', mensagem: 'Use POST para cadastrar seu interesse.' } }, { Allow: 'POST' });
        return true;
      }
      if (url.search) falhar(400, 'DADO_INVALIDO', 'Envie os dados somente no formulário.');
      const config = configuracao(ambiente);
      validarOrigem(pedido, config);
      const cadastro = validarCadastro(await lerCorpo(pedido));
      if (!config.chave) falhar(503, 'CAPTACAO_INDISPONIVEL', 'O cadastro está temporariamente indisponível. Tente novamente mais tarde.');
      const signal = AbortSignal.timeout(timeoutMs);
      const caminho = `/contacts/${encodeURIComponent(cadastro.email)}`;
      const existente = await consultar(config, caminho, 'GET', null, signal, true);
      if (existente) validarContato(existente, cadastro.email);
      if (!existente || !consentimentoRegistrado(existente)) {
        // Estas três propriedades string precisam ser criadas previamente no Resend.
        const properties = {
          perparte_lp_origem: 'lp',
          perparte_lp_consentimento_versao: VERSAO_CONSENTIMENTO,
          perparte_lp_consentimento_em: agora().toISOString(),
        };
        const [first_name, ...sobrenomes] = cadastro.nome.split(' ');
        const dados = existente ? { properties } : { email: cadastro.email, ...(cadastro.nome ? { first_name, last_name: sobrenomes.join(' ') } : {}), properties };
        // Nunca enviar unsubscribed:false, nem na criação: preservar opt-out também
        // se outro pedido criar o mesmo e-mail entre nossa consulta e gravação.
        const gravado = await consultar(config, existente ? caminho : '/contacts', existente ? 'PATCH' : 'POST', dados, signal);
        if (gravado?.object !== 'contact' || typeof gravado.id !== 'string' || !gravado.id) falhar(502, 'CAPTACAO_RESPOSTA_INVALIDA', 'Não foi possível confirmar o cadastro. Tente novamente.');
        const confirmado = validarContato(await consultar(config, caminho, 'GET', null, signal), cadastro.email);
        if (!consentimentoRegistrado(confirmado)) falhar(502, 'CAPTACAO_NAO_CONFIRMADA', 'Não foi possível confirmar o cadastro. Tente novamente.');
      }
      responder(resposta, 200, { ok: true, mensagem: 'Cadastro recebido. Você está na lista de novidades da Per Parte.' });
    } catch (erro) {
      const conhecido = erro instanceof ErroCaptacao;
      responder(resposta, conhecido ? erro.status : 500, { erro: { codigo: conhecido ? erro.codigo : 'ERRO_INTERNO', mensagem: conhecido ? erro.message : 'Não foi possível concluir o cadastro. Tente novamente.' } }, erro.status === 429 ? { 'Retry-After': '30' } : {});
    }
    return true;
  };
}
