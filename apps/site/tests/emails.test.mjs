import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { criarTransporteEmail, prepararEmail, ErroEmail } from '../emails/transporte.mjs';
import { executarCli } from '../emails/enviar.mjs';
import { criarAdaptadorVercel } from '../vercel-adaptador.mjs';

const ambiente = {
  RESEND_ENABLED: 'true', RESEND_API_KEY: 're_somente_teste_sem_rede',
  EMAIL_FROM: 'Per Parte <sistema@emails.exemplo.test>', EMAIL_REPLY_TO: 'equipe@exemplo.test',
  EMAIL_SITE_URL: 'https://exemplo.test', EMAIL_ACCOUNT_URL: 'https://conta.exemplo.test/account',
};
const entrada = { tipo: 'boas-vindas', para: 'pessoa@exemplo.test', eventoId: 'cliente-123:boas-vindas:v1', dados: { nome: 'Pessoa' } };
const identificarErro = (codigo, repetivel = false) => erro => erro instanceof ErroEmail && erro.codigo === codigo && erro.repetivel === repetivel;

test('envio interno limita destino, usa modelos e não inclui identificador original no cabeçalho', async () => {
  const chamadas = [];
  const enviar = criarTransporteEmail({ ambiente, fetchImpl: async (url, opcoes) => { chamadas.push({ url, opcoes }); return Response.json({ id: 'email-teste-123' }); } });
  const resultado = await enviar(entrada);
  assert.deepEqual(Object.keys(resultado).sort(), ['chaveIdempotencia', 'id', 'provedor']);
  assert.equal(resultado.provedor, 'resend');
  assert.equal(chamadas.length, 1);
  const { url, opcoes } = chamadas[0];
  assert.equal(url, 'https://api.resend.com/emails');
  assert.equal(opcoes.method, 'POST');
  assert.equal(opcoes.redirect, 'error');
  assert.equal(opcoes.headers.Authorization, `Bearer ${ambiente.RESEND_API_KEY}`);
  assert.match(opcoes.headers['Idempotency-Key'], /^perparte\/boas-vindas\/[a-f0-9]{64}$/);
  assert(!opcoes.headers['Idempotency-Key'].includes(entrada.eventoId));
  const corpo = JSON.parse(opcoes.body);
  assert.deepEqual(corpo.to, [entrada.para]);
  assert.equal(corpo.from, ambiente.EMAIL_FROM);
  assert.equal(corpo.reply_to, ambiente.EMAIL_REPLY_TO);
  assert.match(corpo.html, /<html lang="pt-BR">/);
  assert.match(corpo.text, /Boas-vindas/);
  assert(!JSON.stringify(corpo).includes(ambiente.RESEND_API_KEY));
  assert(!Object.hasOwn(corpo, 'cc') && !Object.hasOwn(corpo, 'bcc'));
});

test('habilitação explícita e configuração completa são obrigatórias antes da rede', async () => {
  let chamadas = 0;
  for (const valor of [undefined, '', 'false', '1', true, 'TRUE']) {
    const enviar = criarTransporteEmail({ ambiente: { ...ambiente, RESEND_ENABLED: valor }, fetchImpl: async () => { chamadas++; } });
    await assert.rejects(enviar(entrada), identificarErro('ENVIO_DESABILITADO'));
  }
  for (const chave of ['RESEND_API_KEY', 'EMAIL_FROM', 'EMAIL_REPLY_TO', 'EMAIL_SITE_URL', 'EMAIL_ACCOUNT_URL']) {
    const enviar = criarTransporteEmail({ ambiente: { ...ambiente, [chave]: '' }, fetchImpl: async () => { chamadas++; } });
    await assert.rejects(enviar(entrada), erro => erro instanceof ErroEmail && !erro.repetivel);
  }
  assert.equal(chamadas, 0);
});

test('rejeita múltiplos destinatários, injeção em cabeçalhos e campos extras sem consultar provedor', async () => {
  let chamadas = 0;
  const fetchImpl = async () => { chamadas++; };
  for (const para of ['pessoa@exemplo.test,outra@exemplo.test', ['pessoa@exemplo.test'], 'Pessoa <pessoa@exemplo.test>', 'pessoa@exemplo.test\r\nBcc: outra@exemplo.test', '.pessoa@exemplo.test', 'pessoa..outra@exemplo.test']) {
    await assert.rejects(criarTransporteEmail({ ambiente, fetchImpl })({ ...entrada, para }), ErroEmail);
  }
  for (const chave of ['EMAIL_FROM', 'EMAIL_REPLY_TO', 'RESEND_API_KEY']) {
    await assert.rejects(criarTransporteEmail({ ambiente: { ...ambiente, [chave]: `${ambiente[chave]}\nOutra: valor` }, fetchImpl })(entrada), ErroEmail);
  }
  for (const extra of [{ html: '<b>livre</b>' }, { cc: 'outra@exemplo.test' }, { dados: { nome: 'Pessoa', html: 'livre' } }, { dados: { nome: 'Pessoa\nAssunto: outro' } }]) {
    await assert.rejects(criarTransporteEmail({ ambiente, fetchImpl })({ ...entrada, ...extra }), ErroEmail);
  }
  assert.equal(chamadas, 0);
});

test('links, tipos, tamanho de dados e identificadores inválidos falham antes do envio', async () => {
  let chamadas = 0;
  const enviar = criarTransporteEmail({ ambiente, fetchImpl: async () => { chamadas++; } });
  const orcamento = { ...entrada, tipo: 'orcamento-disponivel', dados: { numero: '#001', url: 'https://exemplo.test/orcamentos/1' } };
  assert.match(prepararEmail(orcamento, { ambiente }).corpo.subject, /#001/);
  for (const url of ['javascript:alert(1)', 'http://exemplo.test/1', 'https://exemplo.test.evil.test/1', 'https://user:senha@exemplo.test/1', '/orcamentos/1']) {
    await assert.rejects(enviar({ ...orcamento, dados: { ...orcamento.dados, url } }), identificarErro('MODELO_INVALIDO'));
  }
  for (const eventoId of ['', undefined, 'pessoa@exemplo.test', 'evento\n123', 'x'.repeat(161)]) await assert.rejects(enviar({ ...entrada, eventoId }), identificarErro('EVENTO_INVALIDO'));
  await assert.rejects(enviar({ ...entrada, tipo: '__proto__' }), identificarErro('TIPO_INVALIDO'));
  await assert.rejects(enviar({ ...entrada, dados: { nome: 'x'.repeat(17000) } }), identificarErro('DADOS_GRANDES'));
  assert.equal(chamadas, 0);
});

test('conteúdo editorial é escapado; corpo de atualização conserva texto multilinha', () => {
  const preparado = prepararEmail({ ...entrada, tipo: 'atualizacao-pedido', dados: { nome: '<script>alert(1)</script>', numero: '#001', titulo: 'Etapa confirmada', mensagem: 'Primeira parte.\n\nSegunda parte <teste>.', url: 'https://conta.exemplo.test/account/orders/1' } }, { ambiente });
  assert(!preparado.corpo.html.includes('<script>'));
  assert(preparado.corpo.html.includes('&lt;script&gt;'));
  assert(preparado.corpo.text.includes('Segunda parte <teste>.'));
  assert(preparado.corpo.html.includes('https://conta.exemplo.test/account/orders/1'));
});

test('repetição explícita após falha mantém exatamente chave e corpo sem retry oculto', async () => {
  const chamadas = [];
  const enviar = criarTransporteEmail({ ambiente, fetchImpl: async (_, opcoes) => {
    chamadas.push(opcoes);
    return chamadas.length === 1 ? Response.json({ name: 'service_unavailable', message: ambiente.RESEND_API_KEY }, { status: 503 }) : Response.json({ id: 'email-teste-123' });
  } });
  await assert.rejects(enviar(entrada), erro => identificarErro('PROVEDOR_RECUSOU', true)(erro) && !erro.message.includes(ambiente.RESEND_API_KEY));
  assert.equal(chamadas.length, 1);
  await enviar(entrada);
  assert.equal(chamadas.length, 2);
  assert.equal(chamadas[0].body, chamadas[1].body);
  assert.equal(chamadas[0].headers['Idempotency-Key'], chamadas[1].headers['Idempotency-Key']);
  const alterado = prepararEmail({ ...entrada, dados: { nome: 'Outra pessoa' } }, { ambiente });
  assert.equal(alterado.chaveIdempotencia, chamadas[0].headers['Idempotency-Key']);
  assert.notEqual(alterado.serializado, chamadas[0].body);
  assert.notEqual(prepararEmail({ ...entrada, eventoId: 'cliente-124:boas-vindas:v1' }, { ambiente }).chaveIdempotencia, alterado.chaveIdempotencia);
});

test('distingue conflito de conteúdo, concorrência, quotas e falha de autenticação', async () => {
  for (const [status, name, repetivel, codigo] of [
    [409, 'invalid_idempotent_request', false, 'EVENTO_JA_USADO'],
    [409, 'concurrent_idempotent_requests', true, 'PROVEDOR_RECUSOU'],
    [429, 'rate_limit_exceeded', true, 'PROVEDOR_RECUSOU'],
    [429, 'daily_quota_exceeded', false, 'PROVEDOR_RECUSOU'],
    [401, 'restricted_api_key', false, 'PROVEDOR_RECUSOU'],
    [422, 'validation_error', false, 'PROVEDOR_RECUSOU'],
  ]) {
    const enviar = criarTransporteEmail({ ambiente, fetchImpl: async () => Response.json({ name, message: `sensivel:${entrada.para}` }, { status }) });
    await assert.rejects(enviar(entrada), erro => identificarErro(codigo, repetivel)(erro) && erro.status === status && !erro.message.includes(entrada.para));
  }
});

test('timeout aborta chamada e mantém resultado desconhecido; não há segunda tentativa', async () => {
  let chamadas = 0; let sinal;
  const enviar = criarTransporteEmail({ ambiente, timeoutMs: 10, fetchImpl: (_, opcoes) => { chamadas++; sinal = opcoes.signal; return new Promise(() => {}); } });
  await assert.rejects(enviar(entrada), identificarErro('TEMPO_ESGOTADO', true));
  assert.equal(sinal.aborted, true);
  assert.equal(chamadas, 1);
  assert.throws(() => criarTransporteEmail({ timeoutMs: 0 }), identificarErro('CONFIGURACAO_INVALIDA'));
});

test('timeout também cobre leitura de resposta que não termina', async () => {
  let leitorCancelado = false;
  const fluxo = new ReadableStream({ cancel() { leitorCancelado = true; } });
  const enviar = criarTransporteEmail({ ambiente, timeoutMs: 10, fetchImpl: async () => new Response(fluxo) });
  await assert.rejects(enviar(entrada), identificarErro('TEMPO_ESGOTADO', true));
  assert.equal(leitorCancelado, true);
});

test('respostas incompletas, grandes e falhas de rede não vazam conteúdo', async () => {
  for (const fetchImpl of [
    async () => Response.json({}),
    async () => new Response('x'.repeat(17000)),
    async () => Response.json({ id: `invalido\n${entrada.para}` }),
    async () => { throw new Error(`${ambiente.RESEND_API_KEY}:${entrada.para}`); },
  ]) {
    await assert.rejects(criarTransporteEmail({ ambiente, fetchImpl })(entrada), erro => erro instanceof ErroEmail && erro.repetivel && !JSON.stringify(erro).includes(ambiente.RESEND_API_KEY) && !erro.message.includes(entrada.para));
  }
});

test('CLI gera prévia privada por padrão mesmo habilitado e só envia com flag explícita', async () => {
  const base = await mkdtemp(path.join(tmpdir(), 'perparte-email-teste-'));
  const arquivo = path.join(base, 'dados.json');
  await writeFile(arquivo, JSON.stringify(entrada.dados));
  const argumentos = ['--tipo', entrada.tipo, '--para', entrada.para, '--evento', entrada.eventoId, '--dados', arquivo];
  const logs = []; let chamadas = 0;
  const opcoes = { ambiente, carregarEnv: false, diretorioPrevias: path.join(base, 'previas'), escrever: mensagem => logs.push(mensagem), fetchImpl: async () => { chamadas++; return Response.json({ id: 'email-teste-123' }); } };
  const previa = await executarCli(argumentos, opcoes);
  assert.equal(previa.modo, 'previa');
  assert.equal(chamadas, 0);
  assert.match(await readFile(path.join(previa.diretorio, 'email.html'), 'utf8'), /Boas-vindas/);
  assert.match(await readFile(path.join(previa.diretorio, 'email.txt'), 'utf8'), /Oi, Pessoa/);
  const enviado = await executarCli([...argumentos, '--enviar'], opcoes);
  assert.equal(enviado.modo, 'envio');
  assert.equal(chamadas, 1);
  for (const valor of [entrada.para, ambiente.RESEND_API_KEY, entrada.eventoId, 'Oi, Pessoa']) assert(!logs.join('\n').includes(valor));
  await assert.rejects(executarCli([...argumentos, '--enviar'], { ...opcoes, ambiente: { ...ambiente, RESEND_ENABLED: 'false' } }), identificarErro('ENVIO_DESABILITADO'));
  assert.equal(chamadas, 1);
});

test('CLI limita arquivo, recusa argumentos repetidos e permite ajuda sem credenciais', async () => {
  const base = await mkdtemp(path.join(tmpdir(), 'perparte-email-limite-'));
  const arquivo = path.join(base, 'dados.json'); await writeFile(arquivo, ' '.repeat(16385));
  const argumentos = ['--tipo', entrada.tipo, '--para', entrada.para, '--evento', entrada.eventoId, '--dados', arquivo];
  const opcoes = { ambiente: {}, carregarEnv: false, escrever: () => {}, fetchImpl: async () => { assert.fail('Não deve acessar rede.'); } };
  await assert.rejects(executarCli(argumentos, opcoes), identificarErro('DADOS_GRANDES'));
  await assert.rejects(executarCli([...argumentos, '--tipo', 'boas-vindas'], opcoes), identificarErro('ARGUMENTOS_INVALIDOS'));
  await assert.rejects(executarCli(['--enviar'], opcoes), identificarErro('ARGUMENTOS_INVALIDOS'));
  assert.equal((await executarCli(['--ajuda'], opcoes)).modo, 'ajuda');
});

test('adaptador público continua recusando qualquer rota de e-mail', async () => {
  let chamadas = 0;
  const atender = criarAdaptadorVercel({ ambiente, fetchImpl: async () => { chamadas++; } });
  for (const rota of ['/api/emails', '/api/emails/enviar', '/api/index?__rota=emails/enviar']) {
    assert.equal((await atender(new Request(`https://exemplo.test${rota}`, { method: 'POST', body: '{}' }))).status, 404);
  }
  assert.equal(chamadas, 0);
});
