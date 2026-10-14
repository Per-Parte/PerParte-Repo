import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PARTES, PRESETS, CORES, LIMITES, CHAVE_ESTADO, VERSAO_ESTADO,
  criarModelo, normalizarModelo, atualizarParte, alturaTotal,
  salvarModelo, criarPedido, carregarEstado, gravarEstado,
} from '../src/dominio.mjs';

function storageMemoria(texto) {
  const dados = new Map(texto === undefined ? [] : [[CHAVE_ESTADO, texto]]);
  return {
    gravacoes: 0,
    getItem(chave) { return dados.get(chave) ?? null; },
    setItem(chave, valor) { this.gravacoes += 1; dados.set(chave, valor); },
  };
}

test('primeira visita inicia vazia e cada preset cria uma obra independente', () => {
  assert.deepEqual(carregarEstado(storageMemoria()), { modelos: [], pedidos: [], erro: null });
  assert.equal(PRESETS.length, 3);
  const a = criarModelo('marco');
  const b = criarModelo('marco');
  assert.notEqual(a.id, b.id);
  a.partes.base.cor = 'brasa';
  assert.equal(b.partes.base.cor, 'verde');
  assert.equal(PRESETS[0].partes.base.cor, 'verde');
  assert.deepEqual(PARTES, ['base', 'corpo', 'difusor']);
  assert.equal(alturaTotal(b), 231);
});

test('normaliza entrada ruim sem propagar valores ou propriedades arbitrárias', () => {
  const entrada = {
    id: '../../inválido', nome: '  Minha\nobra  ', preset: 'inexistente',
    criadoEm: 'nunca', atualizadoEm: 'amanhã',
    partes: {
      base: { forma: 'hexagono', variacao: 'inexistente', cor: '#fff', largura: Infinity, altura: null },
      corpo: { largura: '-40', altura: '10000', cor: 'vinho' },
      difusor: { largura: '145.6', altura: '', segredo: 'ignorar' },
    },
  };
  const modelo = normalizarModelo(entrada);
  assert.equal(modelo.preset, 'livre');
  assert.equal(modelo.nome, 'Minha obra');
  assert.match(modelo.id, /^obra-/);
  assert.ok(Number.isFinite(Date.parse(modelo.criadoEm)));
  assert.deepEqual(modelo.partes.base, { forma: 'circulo', variacao: 'liso', cor: 'areia', largura: 110, altura: 45 });
  assert.equal(modelo.partes.corpo.largura, LIMITES.corpo.largura.min);
  assert.equal(modelo.partes.corpo.altura, LIMITES.corpo.altura.max);
  assert.equal(modelo.partes.difusor.largura, 146);
  assert.equal(modelo.partes.difusor.altura, 90);
  assert.equal('segredo' in modelo.partes.difusor, false);
  assert.equal(entrada.partes.corpo.largura, '-40');
  assert.equal(normalizarModelo(null).nome, 'Minha criação');
});

test('dimensões ficam nas faixas e a edição não altera o modelo original', () => {
  const original = criarModelo('duna');
  const copia = structuredClone(original);
  const atualizado = atualizarParte(original, 'base', { largura: -100, altura: 10000 });
  assert.equal(atualizado.partes.base.largura, 80);
  assert.equal(atualizado.partes.base.altura, 90);
  assert.deepEqual(original, copia);
  assert.equal(atualizarParte(original, 'base', { largura: NaN }).partes.base.largura, 120);
  assert.throws(() => atualizarParte(original, 'tomada', {}), /Parte desconhecida/);
});

test('as três cores são independentes e valores inválidos preservam a seleção', () => {
  let modelo = criarModelo('farol');
  modelo = atualizarParte(modelo, 'base', { cor: 'lago' });
  modelo = atualizarParte(modelo, 'corpo', { cor: 'ambar' });
  modelo = atualizarParte(modelo, 'difusor', { cor: 'brasa' });
  modelo = atualizarParte(modelo, 'base', { cor: 'cor-falsa', forma: 'forma-falsa' });
  assert.deepEqual(PARTES.map((parte) => modelo.partes[parte].cor), ['lago', 'ambar', 'brasa']);
  assert.equal(modelo.partes.base.forma, 'quadrado');
  assert.equal(CORES.find(({ id }) => id === 'luz').hex, '#F6E7C4');
});

test('salvar edita pelo id, preserva criação original, ordena e não altera a lista', () => {
  const primeiro = criarModelo('marco');
  primeiro.criadoEm = '2026-01-01T00:00:00.000Z';
  primeiro.atualizadoEm = primeiro.criadoEm;
  const segundo = criarModelo('duna');
  segundo.criadoEm = '2026-02-01T00:00:00.000Z';
  segundo.atualizadoEm = segundo.criadoEm;
  const originais = [primeiro, segundo];
  const edicao = { ...primeiro, nome: 'Marco em Lago', criadoEm: '2026-03-01T00:00:00.000Z' };
  const lista = salvarModelo(originais, edicao);
  assert.equal(lista.length, 2);
  assert.equal(lista[0].id, primeiro.id);
  assert.equal(lista[0].nome, 'Marco em Lago');
  assert.equal(lista[0].criadoEm, primeiro.criadoEm);
  assert.equal(originais[0].nome, 'Minha Marco');
  lista[1].partes.base.cor = 'lago';
  assert.equal(segundo.partes.base.cor, 'brasa');
});

test('rascunhos de pedido preservam snapshots e não aceitam seleção vazia ou duplicada', () => {
  const modelo = criarModelo('farol');
  const pedido = criarPedido([modelo]);
  assert.equal(pedido.status, 'rascunho');
  assert.equal(pedido.itens[0].id, modelo.id);
  modelo.partes.base.cor = 'lago';
  modelo.nome = 'Obra renomeada';
  assert.equal(pedido.itens[0].partes.base.cor, 'vinho');
  assert.equal(pedido.itens[0].nome, 'Minha Farol');
  assert.throws(() => criarPedido([]), /Selecione/);
  assert.throws(() => criarPedido([modelo, modelo]), /repetidas/);
  assert.throws(() => criarPedido([{}]), /inválida/);
});

test('roundtrip de criações e pedidos mantém todos os detalhes e a versão', () => {
  const storage = storageMemoria();
  const modelo = atualizarParte(criarModelo('duna'), 'difusor', { forma: 'triangulo', variacao: 'vazado', largura: 201, cor: 'agua' });
  const estado = { modelos: [modelo], pedidos: [criarPedido([modelo])], erro: null };
  assert.deepEqual(gravarEstado(estado, storage), { ok: true, erro: null });
  assert.equal(JSON.parse(storage.getItem(CHAVE_ESTADO)).versao, VERSAO_ESTADO);
  assert.deepEqual(carregarEstado(storage), estado);
});

test('JSON corrompido e versões futuras ficam intactos até descarte explícito', () => {
  for (const texto of ['{quebrado', JSON.stringify({ versao: 999, modelos: [], pedidos: [] }), JSON.stringify({ versao: 1, modelos: [{}], pedidos: [] })]) {
    const storage = storageMemoria(texto);
    const carregado = carregarEstado(storage);
    assert.ok(carregado.erro);
    assert.equal(storage.gravacoes, 0);
    const novoEstado = { modelos: [criarModelo()], pedidos: [], erro: null };
    assert.equal(gravarEstado(novoEstado, storage).ok, false);
    assert.equal(storage.getItem(CHAVE_ESTADO), texto);
    assert.equal(gravarEstado({ modelos: [], pedidos: [], erro: null }, storage, { substituirCorrompido: true }).ok, true);
    assert.deepEqual(carregarEstado(storage), { modelos: [], pedidos: [], erro: null });
  }
});

test('validação persistida detecta dados parciais, dimensões fora da faixa e ids repetidos', () => {
  for (const alterar of [
    (estado) => { delete estado.modelos[0].partes.corpo; },
    (estado) => { estado.modelos[0].partes.base.largura = 10000; },
    (estado) => { estado.modelos.push(structuredClone(estado.modelos[0])); },
    (estado) => { estado.pedidos[0].status = 'enviado'; },
  ]) {
    const modelo = criarModelo();
    const estado = { versao: 1, modelos: [modelo], pedidos: [criarPedido([modelo])] };
    alterar(estado);
    const texto = JSON.stringify(estado);
    const storage = storageMemoria(texto);
    assert.ok(carregarEstado(storage).erro);
    assert.equal(storage.getItem(CHAVE_ESTADO), texto);
    assert.equal(gravarEstado(estado, storage).ok, false);
  }
});

test('falhas de acesso e quota retornam erro sem anunciar salvamento', () => {
  const indisponivel = {
    getItem() { throw new Error('Acesso negado.'); },
    setItem() { throw new Error('Acesso negado.'); },
  };
  assert.match(carregarEstado(indisponivel).erro, /Acesso negado/);
  const estado = { modelos: [criarModelo()], pedidos: [], erro: null };
  assert.equal(gravarEstado(estado, indisponivel).ok, false);
  const cheio = storageMemoria();
  cheio.setItem = () => { const erro = new Error('quota'); erro.name = 'QuotaExceededError'; throw erro; };
  const resultado = gravarEstado(estado, cheio);
  assert.equal(resultado.ok, false);
  assert.match(resultado.erro, /cheio/);
  assert.equal(cheio.getItem(CHAVE_ESTADO), null);
  assert.equal(gravarEstado({ ...estado, erro: 'Falha de leitura' }, storageMemoria()).ok, false);
});
