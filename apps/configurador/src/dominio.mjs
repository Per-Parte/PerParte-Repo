/**
 * Contrato do estudo visual. Medidas, encaixes e colisões são PROVISÓRIOS:
 * não geram arquivo de produção nem atestam estabilidade ou segurança elétrica.
 * Paleta transcrita de packages/design-system/tokens.json (identidade v1).
 */
function congelar(valor) {
  if (valor && typeof valor === 'object') {
    Object.values(valor).forEach(congelar);
    Object.freeze(valor);
  }
  return valor;
}

export const PARTES = congelar(['base', 'corpo', 'difusor']);
export const TIPOS_PECA = PARTES;
export const FACES = congelar(['cima', 'baixo', 'esquerda', 'direita', 'frente', 'tras']);
export const MAX_PECAS = 24;
export const FORMAS = congelar([
  { id: 'circulo', nome: 'Círculo' },
  { id: 'quadrado', nome: 'Quadrado' },
  { id: 'triangulo', nome: 'Triângulo' },
]);
export const VARIACOES = congelar([
  { id: 'liso', nome: 'Liso', descricao: 'Superfície contínua, forma essencial.' },
  { id: 'ondulado', nome: 'Ondulado', descricao: 'Ritmo de curvas na superfície.' },
  { id: 'vazado', nome: 'Vazado', descricao: 'Aberturas verticais entre as linhas.' },
  { id: 'perfurado', nome: 'Perfurado', descricao: 'Pequenos furos distribuídos na peça.' },
]);
export const CORES = congelar([
  { id: 'luz', nome: 'Luz Acesa', hex: '#F6E7C4' },
  { id: 'areia', nome: 'Areia', hex: '#E4DCCB' },
  { id: 'verde', nome: 'Verde Marco', hex: '#7D8C6F' },
  { id: 'ambar', nome: 'Âmbar Marco', hex: '#D9A441' },
  { id: 'brasa', nome: 'Brasa', hex: '#A90000' },
  { id: 'vinho', nome: 'Vinho', hex: '#670700' },
  { id: 'lago', nome: 'Lago', hex: '#008795' },
  { id: 'agua', nome: 'Água', hex: '#83CFCB' },
  { id: 'grafite', nome: 'Grafite', hex: '#333333' },
  { id: 'nevoa', nome: 'Névoa', hex: '#EEEEEE' },
]);

/** Faixas da prévia em mm ilustrativos, sem homologação fabril. */
export const LIMITES = congelar({
  base: { largura: { min: 80, max: 180, padrao: 110 }, altura: { min: 24, max: 90, padrao: 45 } },
  corpo: { largura: { min: 45, max: 130, padrao: 74 }, altura: { min: 40, max: 180, padrao: 96 } },
  difusor: { largura: { min: 90, max: 230, padrao: 168 }, altura: { min: 45, max: 150, padrao: 90 } },
});

export const PRESETS = congelar([
  {
    id: 'marco', nome: 'Marco', descricao: 'Geometria essencial. Um começo cheio de possibilidades.',
    partes: {
      base: { forma: 'quadrado', variacao: 'liso', largura: 110, altura: 45, cor: 'verde' },
      corpo: { forma: 'circulo', variacao: 'ondulado', largura: 74, altura: 96, cor: 'ambar' },
      difusor: { forma: 'circulo', variacao: 'liso', largura: 168, altura: 90, cor: 'areia' },
    },
  },
  {
    id: 'duna', nome: 'Duna', descricao: 'Curvas suaves, textura e um ponto de Brasa.',
    partes: {
      base: { forma: 'circulo', variacao: 'liso', largura: 120, altura: 32, cor: 'brasa' },
      corpo: { forma: 'circulo', variacao: 'ondulado', largura: 82, altura: 80, cor: 'areia' },
      difusor: { forma: 'circulo', variacao: 'ondulado', largura: 190, altura: 100, cor: 'areia' },
    },
  },
  {
    id: 'farol', nome: 'Farol', descricao: 'Linhas verticais e luz entre as partes.',
    partes: {
      base: { forma: 'quadrado', variacao: 'liso', largura: 100, altura: 38, cor: 'vinho' },
      corpo: { forma: 'quadrado', variacao: 'vazado', largura: 62, altura: 128, cor: 'vinho' },
      difusor: { forma: 'quadrado', variacao: 'perfurado', largura: 130, altura: 106, cor: 'luz' },
    },
  },
]);

export const CHAVE_ESTADO = 'perparte.configurador.v1';
export const VERSAO_ESTADO = 2;
const VERSAO_LEGADA = 1;
const idsFormas = new Set(FORMAS.map(({ id }) => id));
const idsVariacoes = new Set(VARIACOES.map(({ id }) => id));
const idsCores = new Set(CORES.map(({ id }) => id));
const idsPresets = new Set(['livre', ...PRESETS.map(({ id }) => id)]);
const facesSet = new Set(FACES);
const ehObjeto = (valor) => valor !== null && typeof valor === 'object' && !Array.isArray(valor);
const copiar = (valor) => JSON.parse(JSON.stringify(valor));
const novaId = (prefixo) => `${prefixo}-${globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`}`;
const dataValida = (valor) => typeof valor === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(valor) && Number.isFinite(Date.parse(valor));
const idValida = (valor) => typeof valor === 'string' && /^[a-zA-Z0-9_-]{1,100}$/.test(valor);
const atualizarData = (modelo) => { modelo.atualizadoEm = new Date(Math.max(Date.now(), Date.parse(modelo.criadoEm))).toISOString(); };

function nomeLimpo(valor) {
  return typeof valor === 'string' ? valor.replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, 80) : '';
}

function limitar(valor, faixa, padrao) {
  const numero = typeof valor === 'number' ? valor : typeof valor === 'string' && valor.trim() ? Number(valor) : NaN;
  return Number.isFinite(numero) ? Math.round(Math.min(faixa.max, Math.max(faixa.min, numero))) : padrao;
}

function criarPeca(id, tipo, dados, conexao = null) {
  const limites = LIMITES[tipo];
  return {
    id,
    tipo,
    forma: idsFormas.has(dados?.forma) ? dados.forma : 'quadrado',
    variacao: idsVariacoes.has(dados?.variacao) ? dados.variacao : 'liso',
    largura: limitar(dados?.largura, limites.largura, limites.largura.padrao),
    altura: limitar(dados?.altura, limites.altura, limites.altura.padrao),
    cor: idsCores.has(dados?.cor) ? dados.cor : (tipo === 'difusor' ? 'luz' : 'areia'),
    conexao: conexao ? { pecaId: conexao.pecaId, face: conexao.face } : null,
  };
}

function pecasDePreset(preset) {
  const p = preset.partes;
  return [
    criarPeca('peca-base', 'base', p.base),
    criarPeca('peca-corpo-1', 'corpo', p.corpo, { pecaId: 'peca-base', face: 'cima' }),
    criarPeca('peca-difusor-1', 'difusor', p.difusor, { pecaId: 'peca-corpo-1', face: 'cima' }),
  ];
}

function modeloLivre() {
  return [criarPeca('peca-base', 'base', { forma: 'quadrado', variacao: 'liso', largura: 90, altura: 90, cor: 'areia' })];
}

function pecasLegadas(origem) {
  const preset = PRESETS.find(({ id }) => id === origem?.preset);
  const dados = origem?.partes ?? {};
  const padroes = preset?.partes ?? {
    base: { forma: 'circulo', variacao: 'liso', largura: 110, altura: 45, cor: 'areia' },
    corpo: { forma: 'circulo', variacao: 'liso', largura: 74, altura: 96, cor: 'areia' },
    difusor: { forma: 'circulo', variacao: 'liso', largura: 168, altura: 90, cor: 'luz' },
  };
  return [
    criarPeca('peca-base', 'base', { ...padroes.base, ...dados.base }),
    criarPeca('peca-corpo-1', 'corpo', { ...padroes.corpo, ...dados.corpo }, { pecaId: 'peca-base', face: 'cima' }),
    criarPeca('peca-difusor-1', 'difusor', { ...padroes.difusor, ...dados.difusor }, { pecaId: 'peca-corpo-1', face: 'cima' }),
  ];
}

export function criarModelo(presetId = 'livre') {
  const preset = PRESETS.find(({ id }) => id === presetId);
  const agora = new Date().toISOString();
  return {
    id: novaId('obra'), nome: preset ? `Minha ${preset.nome}` : 'Minha criação',
    criadoEm: agora, atualizadoEm: agora, preset: preset?.id ?? 'livre',
    pecas: preset ? pecasDePreset(preset) : modeloLivre(),
  };
}

function migrarModeloV1(modelo) {
  const origem = modelo ?? {};
  const pecas = pecasLegadas(origem);
  return {
    id: idValida(origem.id) ? origem.id : novaId('obra'),
    nome: nomeLimpo(origem.nome) || 'Minha criação',
    criadoEm: dataValida(origem.criadoEm) ? new Date(origem.criadoEm).toISOString() : new Date().toISOString(),
    atualizadoEm: dataValida(origem.atualizadoEm) ? new Date(origem.atualizadoEm).toISOString() : new Date().toISOString(),
    preset: idsPresets.has(origem.preset) ? origem.preset : 'livre',
    pecas,
  };
}

/** Normaliza modelos v2 e também converte objetos legados v1 usados pela interface. */
export function normalizarModelo(input) {
  const origem = ehObjeto(input) ? input : {};
  if (!Array.isArray(origem.pecas)) return migrarModeloV1(origem);
  const preset = idsPresets.has(origem.preset) ? origem.preset : 'livre';
  const pecas = origem.pecas.filter(ehObjeto).map((peca, indice) => {
    const tipo = PARTES.includes(peca.tipo) ? peca.tipo : 'corpo';
    const conexao = peca.conexao === null ? null : ehObjeto(peca.conexao)
      ? { pecaId: idValida(peca.conexao.pecaId) ? peca.conexao.pecaId : `referencia-invalida-${indice}`, face: facesSet.has(peca.conexao.face) ? peca.conexao.face : 'cima' }
      : null;
    return criarPeca(idValida(peca.id) ? peca.id : novaId('peca'), tipo, peca, conexao);
  });
  const agora = new Date().toISOString();
  return {
    id: idValida(origem.id) ? origem.id : novaId('obra'),
    nome: nomeLimpo(origem.nome) || 'Minha criação',
    criadoEm: dataValida(origem.criadoEm) ? new Date(origem.criadoEm).toISOString() : agora,
    atualizadoEm: dataValida(origem.atualizadoEm) ? new Date(origem.atualizadoEm).toISOString() : agora,
    preset,
    pecas: pecas.length ? pecas : modeloLivre(),
  };
}

export function obterPecas(modelo) {
  return copiar(normalizarModelo(modelo).pecas);
}

export function obterPeca(modelo, pecaId) {
  return obterPecas(modelo).find((peca) => peca.id === pecaId) ?? null;
}

function mapaPecas(pecas) { return new Map(pecas.map((peca) => [peca.id, peca])); }

function meioLado(peca, face) {
  if (face === 'cima' || face === 'baixo') return peca.altura / 2;
  return peca.largura / 2;
}

function vetorFace(face) {
  return {
    cima: [0, 1, 0], baixo: [0, -1, 0], direita: [1, 0, 0],
    esquerda: [-1, 0, 0], frente: [0, 0, 1], tras: [0, 0, -1],
  }[face];
}

function envelope(x, y, z, peca) {
  const ex = peca.largura / 2;
  const ey = peca.altura / 2;
  const ez = peca.largura / 2;
  return { minX: x - ex, maxX: x + ex, minY: y - ey, maxY: y + ey, minZ: z - ez, maxZ: z + ez };
}

function sobreposicao(a, b) {
  const eps = 1e-7;
  return Math.min(a.maxX, b.maxX) - Math.max(a.minX, b.minX) > eps
    && Math.min(a.maxY, b.maxY) - Math.max(a.minY, b.minY) > eps
    && Math.min(a.maxZ, b.maxZ) - Math.max(a.minZ, b.minZ) > eps;
}

/** Posições nos eixos comuns; profundidade da prévia é igual à largura. */
export function posicionarPecas(modelo) {
  const pecas = obterPecas(modelo);
  const porId = mapaPecas(pecas);
  const posicionadas = new Map();
  const emVisita = new Set();
  const posicionar = (peca) => {
    if (posicionadas.has(peca.id)) return posicionadas.get(peca.id);
    if (emVisita.has(peca.id)) throw new Error('A composição contém uma conexão circular.');
    emVisita.add(peca.id);
    let x = 0; let y = peca.altura / 2; let z = 0;
    if (peca.conexao) {
      const pai = porId.get(peca.conexao.pecaId);
      if (!pai) throw new Error('A conexão aponta para uma peça que não existe.');
      const pp = posicionar(pai);
      const [vx, vy, vz] = vetorFace(peca.conexao.face);
      const distancia = meioLado(pai, peca.conexao.face) + meioLado(peca, ({ cima: 'baixo', baixo: 'cima', esquerda: 'direita', direita: 'esquerda', frente: 'tras', tras: 'frente' })[peca.conexao.face]);
      x = pp.x + vx * distancia;
      y = pp.y + vy * distancia;
      z = pp.z + vz * distancia;
    }
    const resultado = { ...peca, x, y, z, bbox: envelope(x, y, z, peca) };
    posicionadas.set(peca.id, resultado);
    emVisita.delete(peca.id);
    return resultado;
  };
  const resultado = pecas.map(posicionar);
  const bbox = resultado.reduce((total, peca) => ({
    minX: Math.min(total.minX, peca.bbox.minX), maxX: Math.max(total.maxX, peca.bbox.maxX),
    minY: Math.min(total.minY, peca.bbox.minY), maxY: Math.max(total.maxY, peca.bbox.maxY),
    minZ: Math.min(total.minZ, peca.bbox.minZ), maxZ: Math.max(total.maxZ, peca.bbox.maxZ),
  }), { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity, minZ: Infinity, maxZ: -Infinity });
  return { pecas: resultado, bbox };
}

function conexoesValidas(pecas) {
  if (!Array.isArray(pecas) || pecas.length < 1 || pecas.length > MAX_PECAS) return false;
  if (!pecas.every((p) => ehObjeto(p) && idValida(p.id) && PARTES.includes(p.tipo)
    && idsFormas.has(p.forma) && idsVariacoes.has(p.variacao) && idsCores.has(p.cor)
    && ['largura', 'altura'].every((d) => Number.isInteger(p[d]) && p[d] >= LIMITES[p.tipo][d].min && p[d] <= LIMITES[p.tipo][d].max)
    && (p.conexao === null || (ehObjeto(p.conexao) && idValida(p.conexao.pecaId) && facesSet.has(p.conexao.face))))) return false;
  if (new Set(pecas.map((p) => p.id)).size !== pecas.length) return false;
  const bases = pecas.filter((p) => p.tipo === 'base');
  if (bases.length !== 1 || bases[0].conexao !== null) return false;
  const porId = mapaPecas(pecas);
  const facesOcupadas = new Set();
  for (const peca of pecas) {
    if (peca === bases[0]) continue;
    if (peca.conexao === null || peca.tipo === 'base') return false;
    const pai = porId.get(peca.conexao.pecaId);
    if (!pai || pai.id === peca.id) return false;
    const facePropria = oposta(peca.conexao.face);
    const chaves = [`${pai.id}:${peca.conexao.face}`, `${peca.id}:${facePropria}`];
    if (chaves.some((chave) => facesOcupadas.has(chave))) return false;
    chaves.forEach((chave) => facesOcupadas.add(chave));
  }
  const conectada = pecas.every((peca) => {
    let atual = peca; const vistos = new Set();
    while (atual.conexao) {
      if (vistos.has(atual.id)) return false;
      vistos.add(atual.id);
      atual = porId.get(atual.conexao.pecaId);
      if (!atual) return false;
    }
    return atual.id === bases[0].id;
  });
  if (!conectada) return false;
  try { posicionarPecas({ pecas }); } catch { return false; }
  return true;
}

function oposta(face) {
  return ({ cima: 'baixo', baixo: 'cima', esquerda: 'direita', direita: 'esquerda', frente: 'tras', tras: 'frente' })[face];
}

export function facesDisponiveis(modelo, pecaId) {
  const pecas = obterPecas(modelo);
  const peca = pecas.find((item) => item.id === pecaId);
  if (!peca) return [];
  const ocupadas = new Set();
  for (const item of pecas) {
    if (item.conexao) {
      ocupadas.add(`${item.conexao.pecaId}:${item.conexao.face}`);
      ocupadas.add(`${item.id}:${oposta(item.conexao.face)}`);
    }
  }
  return FACES.filter((face) => !ocupadas.has(`${pecaId}:${face}`));
}

function colisaoValida(pecas) {
  const { pecas: posicoes } = posicionarPecas({ pecas });
  const porId = mapaPecas(pecas);
  for (let i = 0; i < posicoes.length; i += 1) {
    for (let j = i + 1; j < posicoes.length; j += 1) {
      const a = posicoes[i]; const b = posicoes[j];
      const contatoDireto = a.conexao?.pecaId === b.id || b.conexao?.pecaId === a.id;
      if (contatoDireto) continue;
      if (sobreposicao(a.bbox, b.bbox)) return false;
    }
  }
  return true;
}

function modeloValido(modelo) {
  return ehObjeto(modelo) && idValida(modelo.id) && typeof modelo.nome === 'string'
    && modelo.nome === nomeLimpo(modelo.nome) && modelo.nome.length > 0
    && dataValida(modelo.criadoEm) && dataValida(modelo.atualizadoEm)
    && Date.parse(modelo.atualizadoEm) >= Date.parse(modelo.criadoEm)
    && idsPresets.has(modelo.preset) && conexoesValidas(modelo.pecas) && colisaoValida(modelo.pecas);
}

function validarModeloOuErro(modelo) {
  if (!conexoesValidas(modelo.pecas)) throw new Error('A composição precisa ter uma base e conexões válidas.');
  if (!colisaoValida(modelo.pecas)) throw new Error('Esta peça sobrepõe outra na prévia. Escolha outra face ou ajuste as dimensões.');
}

export function adicionarPeca(modelo, { tipo, pecaId, face, forma, variacao, largura, altura, cor } = {}) {
  if (!PARTES.includes(tipo) || tipo === 'base') throw new Error('Adicione um corpo ou difusor. A composição já tem uma base.');
  if (!facesSet.has(face)) throw new Error('Escolha uma face válida.');
  const atualizado = normalizarModelo(modelo);
  if (atualizado.pecas.length >= MAX_PECAS) throw new Error(`A prévia aceita até ${MAX_PECAS} peças.`);
  const pai = atualizado.pecas.find((p) => p.id === pecaId);
  if (!pai) throw new Error('A peça escolhida para conexão não existe.');
  if (!facesDisponiveis(atualizado, pai.id).includes(face)) throw new Error('Esta face já está ocupada.');
  const padrao = LIMITES[tipo];
  const formaNova = idsFormas.has(forma) ? forma : 'quadrado';
  const nova = criarPeca(novaId('peca'), tipo, {
    forma: formaNova, variacao: variacao ?? 'liso',
    largura: largura ?? padrao.largura.padrao,
    altura: altura ?? (formaNova === 'quadrado' ? largura ?? padrao.largura.padrao : padrao.altura.padrao),
    cor: cor ?? (tipo === 'difusor' ? 'luz' : 'areia'),
  }, { pecaId: pai.id, face });
  atualizado.pecas.push(nova);
  validarModeloOuErro(atualizado);
  atualizarData(atualizado);
  return atualizado;
}

export function removerPeca(modelo, pecaId) {
  const atualizado = normalizarModelo(modelo);
  const peca = atualizado.pecas.find((p) => p.id === pecaId);
  if (!peca) throw new Error('A peça escolhida não existe.');
  if (peca.tipo === 'base') throw new Error('A base não pode ser removida.');
  if (atualizado.pecas.some((p) => p.conexao?.pecaId === pecaId)) throw new Error('Remova primeiro as peças conectadas a esta peça.');
  atualizado.pecas = atualizado.pecas.filter((p) => p.id !== pecaId);
  atualizarData(atualizado);
  return atualizado;
}

export function atualizarPeca(modelo, pecaId, patch) {
  const atualizado = normalizarModelo(modelo);
  const peca = atualizado.pecas.find((p) => p.id === pecaId);
  if (!peca) throw new Error('A peça escolhida não existe.');
  const entrada = ehObjeto(patch) ? patch : {};
  if (idsFormas.has(entrada.forma)) peca.forma = entrada.forma;
  if (idsVariacoes.has(entrada.variacao)) peca.variacao = entrada.variacao;
  if (idsCores.has(entrada.cor)) peca.cor = entrada.cor;
  for (const dimensao of ['largura', 'altura']) {
    if (Object.hasOwn(entrada, dimensao)) peca[dimensao] = limitar(entrada[dimensao], LIMITES[peca.tipo][dimensao], peca[dimensao]);
  }
  validarModeloOuErro(atualizado);
  atualizarData(atualizado);
  return atualizado;
}

/** Compatibilidade temporária para consumidores ainda migrando do identificador de tipo. */
export function atualizarParte(modelo, parte, patch) {
  if (!PARTES.includes(parte)) throw new RangeError('Parte desconhecida.');
  const peca = normalizarModelo(modelo).pecas.find((p) => p.tipo === parte);
  if (!peca) throw new RangeError('A composição não contém esse tipo de peça.');
  return atualizarPeca(modelo, peca.id, patch);
}

export function alturaTotal(modelo) {
  const { bbox } = posicionarPecas(modelo);
  return bbox.maxY - bbox.minY;
}

/** Upsert imutável; editar mantém a identidade e a data de criação da obra salva. */
export function salvarModelo(modelos, modelo) {
  const lista = Array.isArray(modelos) ? modelos : [];
  const salvo = normalizarModelo(modelo);
  const anterior = lista.find(({ id }) => id === salvo.id);
  if (anterior && dataValida(anterior.criadoEm)) salvo.criadoEm = anterior.criadoEm;
  atualizarData(salvo);
  return [salvo, ...lista.filter(({ id }) => id !== salvo.id).map(normalizarModelo)]
    .sort((a, b) => Date.parse(b.atualizadoEm) - Date.parse(a.atualizadoEm));
}

/** Um rascunho local, sem envio à Per Parte ou compromisso de fabricação. */
export function criarPedido(modelosSelecionados) {
  if (!Array.isArray(modelosSelecionados) || modelosSelecionados.length === 0) throw new RangeError('Selecione ao menos uma criação.');
  const itens = modelosSelecionados.map((modelo) => {
    if (!modeloValido(modelo) && !modeloV1Valido(modelo)) throw new TypeError('A seleção contém uma criação inválida.');
    const normalizado = normalizarModelo(modelo);
    if (!modeloValido(normalizado)) throw new TypeError('A seleção contém uma criação inválida.');
    return normalizado;
  });
  if (new Set(itens.map(({ id }) => id)).size !== itens.length) throw new RangeError('A seleção contém criações repetidas.');
  return { id: novaId('pedido'), criadoEm: new Date().toISOString(), status: 'rascunho', itens };
}

function modeloV1Valido(modelo) {
  return ehObjeto(modelo) && idValida(modelo.id) && typeof modelo.nome === 'string'
    && modelo.nome === nomeLimpo(modelo.nome) && modelo.nome.length > 0
    && dataValida(modelo.criadoEm) && dataValida(modelo.atualizadoEm)
    && Date.parse(modelo.atualizadoEm) >= Date.parse(modelo.criadoEm)
    && idsPresets.has(modelo.preset) && ehObjeto(modelo.partes)
    && PARTES.every((tipo) => {
      const peca = modelo.partes[tipo];
      return ehObjeto(peca) && idsFormas.has(peca.forma) && idsVariacoes.has(peca.variacao)
        && idsCores.has(peca.cor) && ['largura', 'altura'].every((d) => Number.isInteger(peca[d]) && peca[d] >= LIMITES[tipo][d].min && peca[d] <= LIMITES[tipo][d].max);
    });
}

function pedidoValido(pedido, modeloValidador = modeloValido) {
  return ehObjeto(pedido) && idValida(pedido.id) && dataValida(pedido.criadoEm)
    && pedido.status === 'rascunho' && Array.isArray(pedido.itens) && pedido.itens.length > 0
    && pedido.itens.every(modeloValidador)
    && new Set(pedido.itens.map(({ id }) => id)).size === pedido.itens.length;
}

function colecoesValidas(estado, validador = modeloValido) {
  return ehObjeto(estado) && Array.isArray(estado.modelos) && Array.isArray(estado.pedidos)
    && estado.modelos.every(validador) && estado.pedidos.every((pedido) => pedidoValido(pedido, validador))
    && new Set(estado.modelos.map(({ id }) => id)).size === estado.modelos.length
    && new Set(estado.pedidos.map(({ id }) => id)).size === estado.pedidos.length;
}

function migrarEstadoV1(estado) {
  return {
    modelos: estado.modelos.map(migrarModeloV1),
    pedidos: estado.pedidos.map((pedido) => ({ ...pedido, itens: pedido.itens.map(migrarModeloV1) })),
  };
}

function interpretarEstado(texto) {
  const estado = JSON.parse(texto);
  if (estado?.versao === VERSAO_LEGADA && colecoesValidas(estado, modeloV1Valido)) return migrarEstadoV1(estado);
  if (estado?.versao !== VERSAO_ESTADO) throw new Error('A versão dos dados locais não é compatível.');
  if (!colecoesValidas(estado)) throw new Error('Os dados locais estão incompletos ou inválidos.');
  return estado;
}

function obterStorage(storage) {
  const destino = storage ?? globalThis.localStorage;
  if (!destino || typeof destino.getItem !== 'function' || typeof destino.setItem !== 'function') throw new Error('O armazenamento deste navegador não está disponível.');
  return destino;
}

export function carregarEstado(storage) {
  try {
    const texto = obterStorage(storage).getItem(CHAVE_ESTADO);
    if (texto === null) return { modelos: [], pedidos: [], erro: null };
    const estado = interpretarEstado(texto);
    return { modelos: copiar(estado.modelos), pedidos: copiar(estado.pedidos), erro: null };
  } catch (erro) {
    return { modelos: [], pedidos: [], erro: `Não foi possível abrir suas criações. ${erro.message || 'Verifique o armazenamento local.'} Seus dados não foram alterados.` };
  }
}

/** Só substitui estado legível; estados v1 válidos migram em memória até uma gravação normal. */
export function gravarEstado(estado, storage, { substituirCorrompido = false } = {}) {
  try {
    if (!colecoesValidas(estado)) throw new Error('Há criações ou rascunhos inválidos.');
    if (estado.erro && !substituirCorrompido) throw new Error('Resolva o erro de leitura antes de salvar.');
    const destino = obterStorage(storage);
    const textoAnterior = destino.getItem(CHAVE_ESTADO);
    if (textoAnterior !== null && !substituirCorrompido) interpretarEstado(textoAnterior);
    const dados = {
      versao: VERSAO_ESTADO,
      modelos: estado.modelos.map(normalizarModelo),
      pedidos: estado.pedidos.map((pedido) => ({
        id: pedido.id, criadoEm: pedido.criadoEm, status: 'rascunho', itens: pedido.itens.map(normalizarModelo),
      })),
    };
    destino.setItem(CHAVE_ESTADO, JSON.stringify(dados));
    return { ok: true, erro: null };
  } catch (erro) {
    const mensagem = erro?.name === 'QuotaExceededError' ? 'O armazenamento local está cheio.' : erro.message || 'O armazenamento local não está disponível.';
    return { ok: false, erro: `Não foi possível salvar. ${mensagem} Mantenha esta aba aberta e tente novamente.` };
  }
}
