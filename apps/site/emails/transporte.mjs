import { createHash } from 'node:crypto';
import { renderizarEmail } from './modelos.mjs';

const campos = Object.freeze({
  'boas-vindas': ['nome'],
  'orcamento-disponivel': ['nome', 'numero', 'url'],
  'atualizacao-pedido': ['nome', 'numero', 'titulo', 'mensagem', 'url'],
});
const controles = /[\u0000-\u001f\u007f\u2028\u2029]/;
export const LIMITE_DADOS_EMAIL = 16384;
const limiteCorpo = 262144;
const objeto = valor => valor !== null && typeof valor === 'object' && !Array.isArray(valor) && [Object.prototype, null].includes(Object.getPrototypeOf(valor));

export class ErroEmail extends Error {
  constructor(codigo, mensagem, { repetivel = false, status = null } = {}) {
    super(mensagem); this.name = 'ErroEmail'; this.codigo = codigo; this.repetivel = repetivel; this.status = status;
  }
}
const falhar = (codigo, mensagem, extras) => { throw new ErroEmail(codigo, mensagem, extras); };

function linha(valor, nome, maximo = 320) {
  if (typeof valor !== 'string' || !valor.trim() || valor.length > maximo || controles.test(valor)) falhar('DADOS_INVALIDOS', `${nome} precisa de um valor válido, sem quebras de linha.`);
  return valor.trim();
}
function endereco(valor, nome) {
  const texto = linha(valor, nome, 254);
  const partes = texto.split('@');
  if (partes.length !== 2) falhar('EMAIL_INVALIDO', `${nome} precisa conter um único endereço de e-mail.`);
  const [local, dominio] = partes;
  if (!/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]{1,64}$/.test(local) || local.startsWith('.') || local.endsWith('.') || local.includes('..') || !/^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,63}$/.test(dominio)) falhar('EMAIL_INVALIDO', `${nome} precisa conter um único endereço de e-mail.`);
  return `${local}@${dominio.toLowerCase()}`;
}
function remetente(valor) {
  const texto = linha(valor, 'EMAIL_FROM');
  if (!texto.includes('<')) return endereco(texto, 'EMAIL_FROM');
  const partes = /^([^<>,;"\\]+) <([^<>]+)>$/.exec(texto);
  if (!partes || !partes[1].trim()) falhar('EMAIL_INVALIDO', 'EMAIL_FROM precisa conter um único remetente válido.');
  return `${partes[1].trim()} <${endereco(partes[2], 'EMAIL_FROM')}>`;
}
function urlConfigurada(valor, nome) {
  const texto = linha(valor, nome, 2048);
  try {
    const url = new URL(texto);
    if (url.protocol !== 'https:' || url.username || url.password || url.hash || url.search) throw new Error();
    return url.href;
  } catch { falhar('CONFIGURACAO_INVALIDA', `${nome} precisa ser uma URL HTTPS sem credenciais, consulta ou fragmento.`); }
}
function configuracaoEditorial(ambiente) {
  return {
    from: remetente(ambiente.EMAIL_FROM),
    replyTo: endereco(ambiente.EMAIL_REPLY_TO, 'EMAIL_REPLY_TO'),
    siteUrl: urlConfigurada(ambiente.EMAIL_SITE_URL, 'EMAIL_SITE_URL'),
    accountUrl: urlConfigurada(ambiente.EMAIL_ACCOUNT_URL, 'EMAIL_ACCOUNT_URL'),
  };
}

// O evento deve ser um identificador opaco e estável do sistema de origem, nunca um e-mail.
// O hash evita transmitir esse identificador no cabeçalho do provedor.
export function prepararEmail(entrada, { ambiente = process.env } = {}) {
  if (!objeto(entrada) || Object.keys(entrada).some(chave => !['tipo', 'para', 'eventoId', 'dados'].includes(chave))) falhar('DADOS_INVALIDOS', 'Informe apenas tipo, para, eventoId e dados.');
  const { tipo, eventoId, dados = {} } = entrada;
  if (typeof tipo !== 'string' || !Object.hasOwn(campos, tipo)) falhar('TIPO_INVALIDO', 'O modelo de e-mail não está disponível.');
  if (typeof eventoId !== 'string' || !/^[a-zA-Z0-9][a-zA-Z0-9:._/-]{0,159}$/.test(eventoId)) falhar('EVENTO_INVALIDO', 'Informe um identificador opaco e estável de evento, sem dados pessoais.');
  const para = endereco(entrada.para, 'Destinatário');
  if (!objeto(dados) || Object.keys(dados).some(chave => !campos[tipo].includes(chave)) || Object.values(dados).some(valor => typeof valor !== 'string')) falhar('DADOS_INVALIDOS', 'Os dados precisam corresponder aos campos do modelo.');
  if (Buffer.byteLength(JSON.stringify(dados)) > LIMITE_DADOS_EMAIL) falhar('DADOS_GRANDES', 'Os dados excedem o limite de 16 KiB.');
  for (const [chave, valor] of Object.entries(dados)) if (chave !== 'mensagem' && controles.test(valor)) falhar('DADOS_INVALIDOS', 'Os campos do e-mail contêm caracteres de controle.');
  const config = configuracaoEditorial(ambiente);
  let modelo;
  try { modelo = renderizarEmail(tipo, dados, config); }
  catch { falhar('MODELO_INVALIDO', 'Confira os campos obrigatórios e os links permitidos para o modelo.'); }
  const subject = linha(modelo.subject, 'Assunto', 320);
  if (typeof modelo.html !== 'string' || !modelo.html || typeof modelo.text !== 'string' || !modelo.text) falhar('MODELO_INVALIDO', 'O modelo precisa das versões HTML e texto.');
  const corpo = { from: config.from, to: [para], reply_to: config.replyTo, subject, html: modelo.html, text: modelo.text };
  const serializado = JSON.stringify(corpo);
  if (Buffer.byteLength(serializado) > limiteCorpo) falhar('EMAIL_GRANDE', 'O e-mail excede o limite de 256 KiB.');
  return { tipo, chaveIdempotencia: `perparte/${tipo}/${createHash('sha256').update(eventoId).digest('hex')}`, corpo, serializado };
}

async function lerResposta(resposta, sinal) {
  if (!resposta.body) return null;
  const leitor = resposta.body.getReader(); const partes = []; let tamanho = 0;
  const cancelar = () => { leitor.cancel().catch(() => {}); };
  sinal.addEventListener('abort', cancelar, { once: true });
  try {
    if (sinal.aborted) { cancelar(); return null; }
    for (;;) {
      const { value, done } = await leitor.read();
      if (done) break;
      tamanho += value.byteLength;
      if (tamanho > 16384) { await leitor.cancel(); return null; }
      partes.push(Buffer.from(value));
    }
    return JSON.parse(Buffer.concat(partes).toString('utf8'));
  } catch { return null; }
  finally { sinal.removeEventListener('abort', cancelar); leitor.releaseLock(); }
}

// Somente código interno/CLI importa este módulo. Não há rota de disparo público.
// Cada chamada faz UMA tentativa. Repetições precisam preservar evento, conteúdo e configuração.
// A janela de idempotência do Resend é de 24 h; isto não substitui uma outbox persistente.
export function criarTransporteEmail({ ambiente = process.env, fetchImpl = globalThis.fetch, timeoutMs = 10000 } = {}) {
  if (!Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 30000) falhar('CONFIGURACAO_INVALIDA', 'O timeout precisa estar entre 1 e 30000 ms.');
  return async function enviarEmail(entrada) {
    if (ambiente.RESEND_ENABLED !== 'true') falhar('ENVIO_DESABILITADO', 'O envio está desabilitado. Habilite RESEND_ENABLED explicitamente.');
    const token = ambiente.RESEND_API_KEY;
    if (typeof token !== 'string' || !/^re_[a-zA-Z0-9_-]{8,200}$/.test(token)) falhar('CONFIGURACAO_INVALIDA', 'Configure uma chave Resend válida no ambiente do servidor.');
    const preparado = prepararEmail(entrada, { ambiente });
    const controlador = new AbortController(); let temporizador;
    const expiracao = new Promise((_, rejeitar) => { temporizador = setTimeout(() => { controlador.abort(); rejeitar(new ErroEmail('TEMPO_ESGOTADO', 'O prazo de envio terminou; o resultado pode ser desconhecido. Confira o provedor antes de repetir.', { repetivel: true })); }, timeoutMs); });
    const executar = async () => {
      let resposta;
      try { resposta = await fetchImpl('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Accept: 'application/json', 'Idempotency-Key': preparado.chaveIdempotencia }, body: preparado.serializado, signal: controlador.signal, redirect: 'error' }); }
      catch { falhar('REDE_INDISPONIVEL', 'Não foi possível confirmar o envio. Confira o provedor antes de repetir.', { repetivel: true }); }
      const retorno = await lerResposta(resposta, controlador.signal);
      if (!resposta.ok) {
        const conflito = resposta.status === 409 && retorno?.name === 'invalid_idempotent_request';
        const repetivel = resposta.status >= 500 || (resposta.status === 429 && !['daily_quota_exceeded', 'monthly_quota_exceeded'].includes(retorno?.name)) || (resposta.status === 409 && retorno?.name === 'concurrent_idempotent_requests');
        falhar(conflito ? 'EVENTO_JA_USADO' : 'PROVEDOR_RECUSOU', conflito ? 'O evento já foi usado com outro conteúdo. Preserve o evento e confira o envio anterior.' : 'O provedor recusou o envio. Confira a configuração e o status no Resend.', { repetivel, status: resposta.status });
      }
      if (typeof retorno?.id !== 'string' || !/^[a-zA-Z0-9_-]{1,100}$/.test(retorno.id)) falhar('RESPOSTA_INVALIDA', 'O provedor não retornou uma confirmação válida. Confira o envio antes de repetir.', { repetivel: true });
      return { provedor: 'resend', id: retorno.id, chaveIdempotencia: preparado.chaveIdempotencia };
    };
    try { return await Promise.race([executar(), expiracao]); }
    finally { clearTimeout(temporizador); }
  };
}
