import test from 'node:test';
import assert from 'node:assert/strict';
import { Readable } from 'node:stream';
import { criarApiCaptacao, lerConfiguracaoCaptacao, VERSAO_CONSENTIMENTO } from '../captacao.mjs';

const ambiente = { RESEND_CONTACTS_API_KEY: 're_chave_apenas_de_teste', SITE_ORIGINS: 'https://perparte.com,https://www.perparte.com' };
const cadastro = { email: 'pessoa@example.test', nome: 'Pessoa de Teste', consentimento: true, versaoConsentimento: VERSAO_CONSENTIMENTO, website: '' };
const instante = '2026-10-15T01:00:00.000Z';
const propriedades = {
  perparte_lp_origem: { value: 'lp', type: 'string' },
  perparte_lp_consentimento_versao: { value: VERSAO_CONSENTIMENTO, type: 'string' },
  perparte_lp_consentimento_em: { value: instante, type: 'string' },
};
const contato = { object: 'contact', id: 'contato-teste', email: cadastro.email, first_name: 'Pessoa', last_name: 'de Teste', unsubscribed: false, properties: propriedades };

async function executar(api, { corpo = cadastro, texto, partes, method = 'POST', rota = '/api/captacao', headers = {} } = {}) {
  const pedido = Readable.from(partes || [Buffer.from(texto ?? JSON.stringify(corpo))]);
  pedido.method = method;
  pedido.headers = { host: 'perparte.com', 'content-type': 'application/json', origin: 'https://perparte.com', ...headers };
  pedido.socket = { remoteAddress: '127.0.0.1' };
  const resultado = {};
  const resposta = {
    writeHead(status, cabecalhos) { resultado.status = status; resultado.headers = cabecalhos; },
    end(conteudo) { resultado.texto = conteudo; resultado.corpo = JSON.parse(conteudo); },
  };
  resultado.tratado = await api(pedido, resposta, new URL(rota, 'https://perparte.com'));
  return resultado;
}

function preparar({ atual = null, cliente, dados = ambiente, timeoutMs = 100 } = {}) {
  const chamadas = [];
  let registro = atual ? structuredClone(atual) : null;
  const api = criarApiCaptacao({ ambiente: dados, timeoutMs, agora: () => new Date(instante), fetchImpl: async (url, opcoes) => {
    const corpo = opcoes.body ? JSON.parse(opcoes.body) : null;
    const chamada = { url, opcoes, corpo };
    chamadas.push(chamada);
    if (cliente) return cliente(chamada, chamadas);
    if (opcoes.method === 'GET') return registro ? Response.json(registro) : Response.json({ message: 'Contact not found' }, { status: 404 });
    const properties = Object.fromEntries(Object.entries(corpo.properties).map(([chave, value]) => [chave, { value, type: 'string' }]));
    registro = opcoes.method === 'POST'
      ? { ...corpo, object: 'contact', id: 'contato-teste', unsubscribed: false, properties }
      : { ...registro, properties: { ...registro.properties, ...properties } };
    return Response.json({ object: 'contact', id: registro.id });
  } });
  return { api, chamadas, registro: () => registro };
}

test('cadastro novo persiste consentimento no Resend e confirma leitura sem enviar e-mails', async () => {
  const teste = preparar();
  const resposta = await executar(teste.api);
  assert.equal(resposta.status, 200);
  assert.equal(resposta.corpo.ok, true);
  assert.equal(resposta.headers['Cache-Control'], 'no-store');
  assert.deepEqual(teste.chamadas.map(c => c.opcoes.method), ['GET', 'POST', 'GET']);
  assert.equal(teste.chamadas[0].url, 'https://api.resend.com/contacts/pessoa%40example.test');
  assert.equal(teste.chamadas[1].url, 'https://api.resend.com/contacts');
  assert.deepEqual(teste.chamadas[1].corpo, {
    email: cadastro.email, first_name: 'Pessoa', last_name: 'de Teste',
    properties: { perparte_lp_origem: 'lp', perparte_lp_consentimento_versao: VERSAO_CONSENTIMENTO, perparte_lp_consentimento_em: instante },
  });
  for (const chamada of teste.chamadas) {
    assert.equal(chamada.opcoes.headers.Authorization, `Bearer ${ambiente.RESEND_CONTACTS_API_KEY}`);
    assert.equal(chamada.opcoes.redirect, 'error');
    assert.equal(chamada.opcoes.signal, teste.chamadas[0].opcoes.signal);
    assert(!chamada.url.includes('/emails'));
    assert(!chamada.corpo || !Object.hasOwn(chamada.corpo, 'unsubscribed'));
  }
  assert(!resposta.texto.includes(cadastro.email));
  assert(!resposta.texto.includes('contato-teste'));
  assert(!resposta.texto.includes(ambiente.RESEND_CONTACTS_API_KEY));
});

test('nome é opcional e e-mail normalizado é codificado como um único segmento da URL', async () => {
  const teste = preparar();
  const resposta = await executar(teste.api, { corpo: { ...cadastro, email: ' Pessoa+LP/Outra@EXAMPLE.test ', nome: undefined } });
  assert.equal(resposta.status, 200);
  assert.equal(teste.chamadas[0].url, 'https://api.resend.com/contacts/pessoa%2Blp%2Foutra%40example.test');
  assert.equal(teste.chamadas[1].corpo.email, 'pessoa+lp/outra@example.test');
  assert(!Object.hasOwn(teste.chamadas[1].corpo, 'first_name'));
});

test('repetição confirma registro persistido e preserva primeira data de consentimento', async () => {
  const teste = preparar({ atual: contato });
  const resposta = await executar(teste.api, { corpo: { ...cadastro, nome: 'Outro nome' } });
  assert.equal(resposta.status, 200);
  assert.equal(teste.chamadas.length, 1);
  assert.equal(teste.registro().first_name, 'Pessoa');
  assert.equal(teste.registro().properties.perparte_lp_consentimento_em.value, instante);
});

test('contato existente sem registro da LP recebe somente propriedades, preservando nome e preferências', async () => {
  const teste = preparar({ atual: { ...contato, first_name: 'Nome anterior', properties: { outra: { value: 'preservada', type: 'string' } } } });
  const resposta = await executar(teste.api);
  assert.equal(resposta.status, 200);
  assert.deepEqual(teste.chamadas.map(c => c.opcoes.method), ['GET', 'PATCH', 'GET']);
  assert.deepEqual(Object.keys(teste.chamadas[1].corpo), ['properties']);
  assert.equal(teste.registro().first_name, 'Nome anterior');
  assert.equal(teste.registro().properties.outra.value, 'preservada');
});

test('contato descadastrado nunca é reinscrito nem retorna sucesso', async () => {
  const teste = preparar({ atual: { ...contato, unsubscribed: true } });
  const resposta = await executar(teste.api);
  assert.equal(resposta.status, 409);
  assert.equal(resposta.corpo.erro.codigo, 'CADASTRO_NAO_CONCLUIDO');
  assert.equal(teste.chamadas.length, 1);
  assert(!resposta.texto.includes('unsubscribed'));
});

test('descadastro entre a consulta e a confirmação é preservado e impede sucesso', async () => {
  const teste = preparar({ cliente: (chamada, chamadas) => {
    if (chamadas.length === 1) return Response.json({ ...contato, properties: {} });
    if (chamada.opcoes.method === 'PATCH') {
      assert(!Object.hasOwn(chamada.corpo, 'unsubscribed'));
      return Response.json({ object: 'contact', id: contato.id });
    }
    return Response.json({ ...contato, unsubscribed: true });
  } });
  assert.equal((await executar(teste.api)).status, 409);
});

test('consentimento deve ser booleano verdadeiro e estar na versão exata', async () => {
  for (const corpo of [
    { ...cadastro, consentimento: false }, { ...cadastro, consentimento: 'true' },
    { ...cadastro, consentimento: undefined }, { ...cadastro, versaoConsentimento: undefined },
    { ...cadastro, versaoConsentimento: 'antiga' },
  ]) {
    const teste = preparar();
    const resposta = await executar(teste.api, { corpo });
    assert.equal(resposta.status, 400);
    assert.equal(resposta.corpo.erro.codigo, 'CONSENTIMENTO_NECESSARIO');
    assert.equal(teste.chamadas.length, 0);
  }
});

test('entrada inválida, campos extras, nomes longos e honeypot são recusados sem gravação', async () => {
  const invalidos = [
    { email: 'sem-arroba' }, { email: 'pessoa@-dominio.test' }, { email: 'pessoa@dominio..test' },
    { email: 'pessoa..teste@example.test' }, { email: 'pessoa@example.test\r\nBcc:outra@example.test' },
    { email: ['pessoa@example.test'] }, { email: `${'a'.repeat(65)}@example.test` },
    { nome: 'a'.repeat(101) }, { nome: 'Pessoa\nTeste' }, { nome: 12 },
    { website: 'https://robo.example' }, { website: {} }, { extra: true }, { unsubscribed: false },
  ];
  for (const invalido of invalidos) {
    const teste = preparar();
    assert.equal((await executar(teste.api, { corpo: { ...cadastro, ...invalido } })).status, 400, JSON.stringify(invalido));
    assert.equal(teste.chamadas.length, 0);
  }
});

test('origens externas, ausentes, null e cross-site são recusadas sem confiar no Host', async () => {
  for (const headers of [
    { origin: undefined }, { origin: 'null' }, { origin: 'https://externo.example' },
    { origin: 'https://perparte.com', 'sec-fetch-site': 'cross-site' },
    { host: 'externo.example', origin: 'https://externo.example' },
    { host: 'perparte.com.evil.example', origin: 'https://perparte.com.evil.example' },
  ]) {
    const teste = preparar();
    assert.equal((await executar(teste.api, { headers })).status, 403);
    assert.equal(teste.chamadas.length, 0);
  }
});

test('loopback é aceito em desenvolvimento e não vira origem autorizada em produção', async () => {
  const headers = { host: '127.0.0.1:4174', origin: 'http://127.0.0.1:4174' };
  assert.equal((await executar(preparar().api, { headers })).status, 200);
  assert.equal((await executar(preparar({ dados: { ...ambiente, VERCEL: '1' } }).api, { headers })).status, 403);
  assert.equal((await executar(preparar({ dados: { ...ambiente, NODE_ENV: 'production' } }).api, { headers })).status, 403);
  assert.equal((await executar(preparar().api, { headers: { origin: 'https://www.perparte.com' } })).status, 200);
});

test('sem chave Contacts não usa chave transacional nem confirma cadastro', async () => {
  const dados = { SITE_ORIGINS: ambiente.SITE_ORIGINS, RESEND_API_KEY: 're_chave_transacional', RESEND_ENABLED: 'true' };
  const teste = preparar({ dados });
  assert.deepEqual(lerConfiguracaoCaptacao(dados), { disponivel: false });
  assert.deepEqual(lerConfiguracaoCaptacao(ambiente), { disponivel: true });
  const resposta = await executar(teste.api);
  assert.equal(resposta.status, 503);
  assert.equal(teste.chamadas.length, 0);
});

test('configuração inválida é recusada sem rede e sem expor conteúdo', async () => {
  for (const dados of [
    { ...ambiente, SITE_ORIGINS: 'https://perparte.com/caminho' },
    { ...ambiente, RESEND_CONTACTS_API_KEY: 're_privada\r\nSEGREDO' },
  ]) {
    const teste = preparar({ dados });
    const resposta = await executar(teste.api);
    assert.equal(resposta.status, 503);
    assert(!resposta.texto.includes('SEGREDO'));
    assert.equal(teste.chamadas.length, 0);
  }
});

test('formato, JSON e corpo excessivo são recusados inclusive em fluxo sem Content-Length', async () => {
  const exemplos = [
    [{ headers: { 'content-type': 'text/plain' } }, 415],
    [{ texto: '{invalido' }, 400], [{ corpo: [] }, 400], [{ corpo: null }, 400],
    [{ headers: { 'content-length': '4097' } }, 413],
    [{ partes: [Buffer.alloc(3000, ' '), Buffer.alloc(1097, ' ')] }, 413],
    [{ texto: JSON.stringify({ ...cadastro, nome: 'á'.repeat(2500) }) }, 413],
  ];
  for (const [pedido, status] of exemplos) {
    const teste = preparar();
    assert.equal((await executar(teste.api, pedido)).status, status);
    assert.equal(teste.chamadas.length, 0);
  }
});

test('rota exclusiva, sem query, não aceita GET nem OPTIONS e informa Allow', async () => {
  const teste = preparar();
  assert.equal((await executar(teste.api, { rota: '/api/loja/config' })).tratado, false);
  assert.equal((await executar(teste.api, { rota: '/api/captacao?email=pessoa@example.test' })).status, 400);
  for (const method of ['GET', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD']) {
    const resposta = await executar(teste.api, { method });
    assert.equal(resposta.status, 405);
    assert.equal(resposta.headers.Allow, 'POST');
  }
  assert.equal(teste.chamadas.length, 0);
});

test('erro de leitura, credencial restrita, limite e conflito de gravação não viram sucesso', async () => {
  for (const [status, etapa, esperado] of [[403, 1, 503], [500, 1, 503], [429, 1, 429], [409, 2, 503], [422, 2, 503], [429, 3, 429]]) {
    const teste = preparar({ cliente: (_chamada, chamadas) => {
      if (chamadas.length === etapa) return Response.json({ message: 'SEGREDO E pessoa@example.test' }, { status });
      if (chamadas.length === 1) return Response.json({ message: 'not found' }, { status: 404 });
      return Response.json({ object: 'contact', id: contato.id });
    } });
    const resposta = await executar(teste.api);
    assert.equal(resposta.status, esperado);
    assert.equal(teste.chamadas.length, etapa);
    assert(!resposta.texto.includes('SEGREDO'));
    assert(!resposta.texto.includes(cadastro.email));
    if (status === 429) assert.equal(resposta.headers['Retry-After'], '30');
  }
});

test('respostas malformadas e confirmação sem consentimento persistido falham de modo explícito', async () => {
  for (const retorno of [
    () => new Response('não-json'),
    () => Response.json({ id: contato.id }),
    () => Response.json({ ...contato, email: 'outra@example.test' }),
    () => Response.json({ ...contato, unsubscribed: undefined }),
  ]) {
    const teste = preparar({ cliente: retorno });
    assert.equal((await executar(teste.api)).status, 502);
    assert.equal(teste.chamadas.length, 1);
  }
  const teste = preparar({ cliente: (_chamada, chamadas) => chamadas.length === 1
    ? Response.json({}, { status: 404 }) : chamadas.length === 2
      ? Response.json({ object: 'contact', id: contato.id }) : Response.json({ ...contato, properties: {} }) });
  const resposta = await executar(teste.api);
  assert.equal(resposta.status, 502);
  assert.equal(resposta.corpo.erro.codigo, 'CAPTACAO_NAO_CONFIRMADA');
});

test('timeout limita a operação inteira e nenhuma falha de rede revela dados do provedor', async () => {
  const teste = preparar({ timeoutMs: 5, cliente: ({ opcoes }) => new Promise((_resolve, reject) => {
    const limiteTeste = setTimeout(() => reject(new Error('Timeout de teste')), 1000);
    opcoes.signal.addEventListener('abort', () => { clearTimeout(limiteTeste); reject(new Error('SEGREDO pessoa@example.test')); }, { once: true });
  }) });
  const resposta = await executar(teste.api);
  assert.equal(resposta.status, 503);
  assert.equal(teste.chamadas.length, 1);
  assert(!resposta.texto.includes('SEGREDO'));
  assert(!resposta.texto.includes(cadastro.email));
});
