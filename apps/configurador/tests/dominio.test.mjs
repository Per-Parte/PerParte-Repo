import test from 'node:test';
import assert from 'node:assert/strict';
import {
  FACES, MAX_PECAS, CHAVE_ESTADO, VERSAO_ESTADO, criarModelo, normalizarModelo,
  adicionarPeca, atualizarPeca, removerPeca, obterPecas, obterPeca, posicionarPecas,
  alturaTotal, salvarModelo, criarPedido, carregarEstado, gravarEstado,
} from '../src/dominio.mjs';

function storageMemoria(texto) {
  const dados = new Map(texto === undefined ? [] : [[CHAVE_ESTADO, texto]]);
  return {
    gravacoes: 0,
    getItem(chave) { return dados.get(chave) ?? null; },
    setItem(chave, valor) { this.gravacoes += 1; dados.set(chave, valor); },
  };
}

function cubo(modelo, { tipo = 'corpo', pecaId, face = 'cima' } = {}) {
  return adicionarPeca(modelo, { tipo, pecaId, face, forma: 'quadrado', largura: 90, altura: 90 });
}

function legado(patch = {}) {
  const criadoEm = '2026-10-13T12:00:00.000Z';
  return {
    id: 'obra-legada', nome: 'Marco guardado', criadoEm, atualizadoEm: criadoEm, preset: 'marco',
    partes: {
      base: { forma: 'quadrado', variacao: 'liso', largura: 110, altura: 45, cor: 'lago' },
      corpo: { forma: 'circulo', variacao: 'ondulado', largura: 74, altura: 96, cor: 'ambar' },
      difusor: { forma: 'circulo', variacao: 'liso', largura: 168, altura: 90, cor: 'areia' },
    },
    ...patch,
  };
}

test('criação livre começa com base cúbica e presets convertem suas três peças', () => {
  const livre = criarModelo();
  assert.equal(livre.pecas.length, 1);
  assert.deepEqual(livre.pecas[0], {
    id: 'peca-base', tipo: 'base', forma: 'quadrado', variacao: 'liso', largura: 90, altura: 90, cor: 'areia', conexao: null,
  });
  const marco = criarModelo('marco');
  assert.deepEqual(marco.pecas.map((p) => p.tipo), ['base', 'corpo', 'difusor']);
  assert.deepEqual(marco.pecas[1].conexao, { pecaId: 'peca-base', face: 'cima' });
  assert.deepEqual(marco.pecas[2].conexao, { pecaId: 'peca-corpo-1', face: 'cima' });
});

test('monta base, três corpos empilhados e difusor lateral com bbox global coerente', () => {
  let modelo = criarModelo();
  const base = modelo.pecas[0].id;
  modelo = cubo(modelo, { pecaId: base });
  const corpo1 = modelo.pecas[1].id;
  modelo = cubo(modelo, { pecaId: corpo1 });
  const corpo2 = modelo.pecas[2].id;
  modelo = cubo(modelo, { pecaId: corpo2 });
  const corpo3 = modelo.pecas[3].id;
  modelo = cubo(modelo, { tipo: 'difusor', pecaId: corpo3, face: 'direita' });

  const posicoes = posicionarPecas(modelo);
  assert.equal(posicoes.pecas.length, 5);
  assert.equal(posicoes.bbox.minY, 0);
  assert.equal(posicoes.bbox.maxY, 360);
  assert.equal(posicoes.bbox.maxX, 135);
  assert.deepEqual(posicoes.pecas.map(({ x, y, z }) => [x, y, z]), [
    [0, 45, 0], [0, 135, 0], [0, 225, 0], [0, 315, 0], [90, 315, 0],
  ]);
  assert.equal(alturaTotal(modelo), 360);
});

test('admite dois difusores em faces diferentes e impede face ocupada', () => {
  let modelo = criarModelo();
  modelo = cubo(modelo, { pecaId: modelo.pecas[0].id });
  const corpo = modelo.pecas[1].id;
  modelo = cubo(modelo, { tipo: 'difusor', pecaId: corpo, face: 'direita' });
  modelo = cubo(modelo, { tipo: 'difusor', pecaId: corpo, face: 'frente' });
  assert.equal(obterPecas(modelo).filter((p) => p.tipo === 'difusor').length, 2);
  assert.throws(() => cubo(modelo, { tipo: 'difusor', pecaId: corpo, face: 'direita' }), /face já está ocupada/);
  assert.deepEqual(FACES, ['cima', 'baixo', 'esquerda', 'direita', 'frente', 'tras']);
});

test('barra interseção de caixas com peças sem conexão direta', () => {
  let modelo = criarModelo();
  const base = modelo.pecas[0].id;
  modelo = adicionarPeca(modelo, { tipo: 'corpo', pecaId: base, face: 'cima', forma: 'quadrado', largura: 130, altura: 180 });
  assert.throws(() => adicionarPeca(modelo, {
    tipo: 'corpo', pecaId: base, face: 'direita', forma: 'quadrado', largura: 130, altura: 150,
  }), /sobrepõe outra/);
});

test('seleção e atualização são por id e mantêm o original imutável', () => {
  let modelo = criarModelo();
  modelo = cubo(modelo, { pecaId: modelo.pecas[0].id });
  const id = modelo.pecas[1].id;
  const atualizado = atualizarPeca(modelo, id, { cor: 'lago', largura: 100, altura: 110 });
  assert.equal(obterPeca(atualizado, id).cor, 'lago');
  assert.equal(obterPeca(atualizado, id).altura, 110);
  assert.equal(obterPeca(modelo, id).cor, 'areia');
  assert.equal(atualizado.pecas.length, 2);
  assert.throws(() => atualizarPeca(modelo, 'inexistente', {}), /não existe/);
});

test('só remove folhas e não permite remover a base', () => {
  let modelo = criarModelo();
  const base = modelo.pecas[0].id;
  modelo = cubo(modelo, { pecaId: base });
  const corpo = modelo.pecas[1].id;
  modelo = cubo(modelo, { tipo: 'difusor', pecaId: corpo, face: 'direita' });
  const difusor = modelo.pecas[2].id;
  assert.throws(() => removerPeca(modelo, corpo), /Remova primeiro/);
  assert.throws(() => removerPeca(modelo, base), /base não pode/);
  modelo = removerPeca(modelo, difusor);
  assert.equal(modelo.pecas.length, 2);
  modelo = removerPeca(modelo, corpo);
  assert.equal(modelo.pecas.length, 1);
});

test('limita a composição e rejeita tipos, pais e faces inválidos', () => {
  let modelo = criarModelo();
  for (let i = 1; i < MAX_PECAS; i += 1) {
    const pai = modelo.pecas.at(-1);
    const face = FACES.find((f) => !modelo.pecas.some((p) => p.conexao?.pecaId === pai.id && p.conexao.face === f));
    if (!face) break;
    modelo = cubo(modelo, { pecaId: pai.id, face });
  }
  assert.throws(() => cubo(modelo, { pecaId: modelo.pecas.at(-1).id, face: 'cima' }), /até 24/);
  const base = criarModelo();
  assert.throws(() => adicionarPeca(base, { tipo: 'base', pecaId: base.pecas[0].id, face: 'cima' }), /corpo ou difusor/);
  assert.throws(() => adicionarPeca(base, { tipo: 'corpo', pecaId: 'ausente', face: 'cima' }), /não existe/);
  assert.throws(() => adicionarPeca(base, { tipo: 'corpo', pecaId: base.pecas[0].id, face: 'diagonal' }), /face válida/);
});

test('migra v1 de modelos e snapshots sem gravar até ação normal', () => {
  const modeloV1 = legado();
  const pedido = { id: 'pedido-um', criadoEm: modeloV1.criadoEm, status: 'rascunho', itens: [structuredClone(modeloV1)] };
  const textoV1 = JSON.stringify({ versao: 1, modelos: [modeloV1], pedidos: [pedido] });
  const storage = storageMemoria(textoV1);
  const estado = carregarEstado(storage);
  assert.equal(estado.erro, null);
  assert.equal(storage.gravacoes, 0);
  assert.equal(storage.getItem(CHAVE_ESTADO), textoV1);
  assert.equal(estado.modelos[0].id, modeloV1.id);
  assert.equal(estado.modelos[0].criadoEm, modeloV1.criadoEm);
  assert.equal(estado.modelos[0].pecas.find((p) => p.tipo === 'base').cor, 'lago');
  assert.equal(estado.pedidos[0].itens[0].pecas.find((p) => p.tipo === 'base').cor, 'lago');
  estado.modelos[0].pecas[0].cor = 'brasa';
  assert.equal(estado.pedidos[0].itens[0].pecas[0].cor, 'lago');
  assert.equal(gravarEstado(estado, storage).ok, true);
  assert.equal(JSON.parse(storage.getItem(CHAVE_ESTADO)).versao, VERSAO_ESTADO);
});

test('migra modelo v1 livre sem descartar corpo ou difusor', () => {
  const modelo = legado({ id: 'obra-livre', nome: 'Livre salvo', preset: 'livre' });
  const estado = carregarEstado(storageMemoria(JSON.stringify({ versao: 1, modelos: [modelo], pedidos: [] })));
  assert.equal(estado.erro, null);
  assert.deepEqual(estado.modelos[0].pecas.map((p) => p.tipo), ['base', 'corpo', 'difusor']);
  assert.equal(estado.modelos[0].pecas.find((p) => p.tipo === 'difusor').largura, 168);
});

test('roundtrip v2 mantém criações e snapshots independentes', () => {
  let modelo = criarModelo();
  modelo = cubo(modelo, { pecaId: modelo.pecas[0].id });
  const pedido = criarPedido([modelo]);
  const storage = storageMemoria();
  assert.equal(gravarEstado({ modelos: [modelo], pedidos: [pedido], erro: null }, storage).ok, true);
  const carregado = carregarEstado(storage);
  assert.equal(carregado.erro, null);
  assert.deepEqual(carregado.modelos[0].pecas, modelo.pecas);
  carregado.modelos[0].pecas[1].cor = 'lago';
  assert.equal(carregado.pedidos[0].itens[0].pecas[1].cor, 'areia');
});

test('salvarModelo atualiza por id sem alterar lista ou manter referência compartilhada', () => {
  const primeiro = criarModelo('marco');
  const segundo = criarModelo('duna');
  const salvo = salvarModelo([primeiro, segundo], { ...primeiro, nome: 'Marco em Lago' });
  assert.equal(salvo.length, 2);
  assert.equal(salvo.find((m) => m.id === primeiro.id).nome, 'Marco em Lago');
  salvo[0].pecas[0].cor = 'lago';
  assert.notEqual(primeiro.pecas[0].cor, 'lago');
});

test('recusa json quebrado, versão futura e v1 inválido sem tocar nos dados', () => {
  for (const texto of [
    '{quebrado', JSON.stringify({ versao: 999, modelos: [], pedidos: [] }),
    JSON.stringify({ versao: 1, modelos: [legado({ partes: {} })], pedidos: [] }),
  ]) {
    const storage = storageMemoria(texto);
    assert.ok(carregarEstado(storage).erro);
    assert.equal(storage.gravacoes, 0);
    assert.equal(gravarEstado({ modelos: [criarModelo()], pedidos: [], erro: null }, storage).ok, false);
    assert.equal(storage.getItem(CHAVE_ESTADO), texto);
    assert.equal(gravarEstado({ modelos: [], pedidos: [], erro: null }, storage, { substituirCorrompido: true }).ok, true);
  }
});

test('validação persistida rejeita órfãos, ciclos, raízes e colisões de id sem sobrescrever', () => {
  let modelo = criarModelo();
  modelo = cubo(modelo, { pecaId: modelo.pecas[0].id });
  const mutacoes = [
    (m) => { m.pecas[1].conexao.pecaId = 'ausente'; },
    (m) => { m.pecas[0].tipo = 'corpo'; },
    (m) => { m.pecas[1].id = m.pecas[0].id; },
    (m) => { m.pecas[1].conexao.face = 'diagonal'; },
    (m) => { m.pecas[1].conexao = { pecaId: m.pecas[1].id, face: 'cima' }; },
    (m) => { m.pecas.push({ ...structuredClone(m.pecas[1]), id: 'peca-duplicada' }); },
  ];
  for (const alterar of mutacoes) {
    const invalidado = structuredClone(modelo);
    alterar(invalidado);
    const texto = JSON.stringify({ versao: VERSAO_ESTADO, modelos: [invalidado], pedidos: [] });
    const storage = storageMemoria(texto);
    assert.ok(carregarEstado(storage).erro);
    assert.equal(storage.getItem(CHAVE_ESTADO), texto);
    assert.equal(gravarEstado({ modelos: [invalidado], pedidos: [], erro: null }, storage).ok, false);
  }
});

test('pedidos exigem modelos válidos e preservam cópia sem compartilhamento', () => {
  const modelo = criarModelo('farol');
  const pedido = criarPedido([modelo]);
  modelo.pecas[0].cor = 'lago';
  assert.equal(pedido.status, 'rascunho');
  assert.equal(pedido.itens[0].pecas[0].cor, 'vinho');
  assert.throws(() => criarPedido([]), /Selecione/);
  assert.throws(() => criarPedido([{}]), /inválida/);
  assert.throws(() => criarPedido([pedido.itens[0], pedido.itens[0]]), /repetidas/);
});
