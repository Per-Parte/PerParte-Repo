/**
 * Contrato do estudo visual. Medidas e encaixes são PROVISÓRIOS:
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

/** Faixas de manipulação da prévia, em mm ilustrativos, sem homologação fabril. */
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
export const VERSAO_ESTADO = 1;
const idsFormas = new Set(FORMAS.map(({ id }) => id));
const idsVariacoes = new Set(VARIACOES.map(({ id }) => id));
const idsCores = new Set(CORES.map(({ id }) => id));
const idsPresets = new Set(['livre', ...PRESETS.map(({ id }) => id)]);
const ehObjeto = (valor) => valor !== null && typeof valor === 'object' && !Array.isArray(valor);
const copiar = (valor) => JSON.parse(JSON.stringify(valor));
const novaId = (prefixo) => `${prefixo}-${globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`}`;
const dataValida = (valor) => typeof valor === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(valor) && Number.isFinite(Date.parse(valor));
const idValida = (valor) => typeof valor === 'string' && /^[a-zA-Z0-9_-]{1,100}$/.test(valor);

function nomeLimpo(valor) {
  return typeof valor === 'string' ? valor.replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, 80) : '';
}

function limitar(valor, faixa, padrao) {
  const numero = typeof valor === 'number' ? valor : typeof valor === 'string' && valor.trim() ? Number(valor) : NaN;
  return Number.isFinite(numero) ? Math.round(Math.min(faixa.max, Math.max(faixa.min, numero))) : padrao;
}

function partesIniciais(presetId) {
  const preset = PRESETS.find(({ id }) => id === presetId);
  if (preset) return copiar(preset.partes);
  return Object.fromEntries(PARTES.map((parte) => [parte, {
    forma: 'circulo', variacao: 'liso', largura: LIMITES[parte].largura.padrao,
    altura: LIMITES[parte].altura.padrao, cor: parte === 'difusor' ? 'luz' : 'areia',
  }]));
}

export function criarModelo(presetId = 'livre') {
  const preset = PRESETS.find(({ id }) => id === presetId);
  const agora = new Date().toISOString();
  return {
    id: novaId('obra'), nome: preset ? `Minha ${preset.nome}` : 'Minha criação',
    criadoEm: agora, atualizadoEm: agora, preset: preset?.id ?? 'livre',
    partes: partesIniciais(preset?.id ?? 'livre'),
  };
}

/** Normaliza entradas da interface; leitura persistida usa validação estrita. */
export function normalizarModelo(input) {
  const origem = ehObjeto(input) ? input : {};
  const modelo = criarModelo(idsPresets.has(origem.preset) ? origem.preset : 'livre');
  if (idValida(origem.id)) modelo.id = origem.id;
  modelo.nome = nomeLimpo(origem.nome) || modelo.nome;
  if (dataValida(origem.criadoEm)) modelo.criadoEm = new Date(origem.criadoEm).toISOString();
  if (dataValida(origem.atualizadoEm)) modelo.atualizadoEm = new Date(origem.atualizadoEm).toISOString();
  if (Date.parse(modelo.atualizadoEm) < Date.parse(modelo.criadoEm)) modelo.atualizadoEm = modelo.criadoEm;
  for (const parte of PARTES) {
    const entrada = ehObjeto(origem.partes?.[parte]) ? origem.partes[parte] : {};
    const padrao = modelo.partes[parte];
    modelo.partes[parte] = {
      forma: idsFormas.has(entrada.forma) ? entrada.forma : padrao.forma,
      variacao: idsVariacoes.has(entrada.variacao) ? entrada.variacao : padrao.variacao,
      largura: limitar(entrada.largura, LIMITES[parte].largura, padrao.largura),
      altura: limitar(entrada.altura, LIMITES[parte].altura, padrao.altura),
      cor: idsCores.has(entrada.cor) ? entrada.cor : padrao.cor,
    };
  }
  return modelo;
}

export function atualizarParte(modelo, parte, patch) {
  if (!PARTES.includes(parte)) throw new RangeError('Parte desconhecida.');
  const atualizado = normalizarModelo(modelo);
  const entrada = ehObjeto(patch) ? patch : {};
  // Valores inválidos preservam a seleção atual. Somente campos de uma parte entram.
  const atual = atualizado.partes[parte];
  if (idsFormas.has(entrada.forma)) atual.forma = entrada.forma;
  if (idsVariacoes.has(entrada.variacao)) atual.variacao = entrada.variacao;
  if (idsCores.has(entrada.cor)) atual.cor = entrada.cor;
  for (const dimensao of ['largura', 'altura']) {
    if (Object.hasOwn(entrada, dimensao)) atual[dimensao] = limitar(entrada[dimensao], LIMITES[parte][dimensao], atual[dimensao]);
  }
  atualizado.atualizadoEm = new Date(Math.max(Date.now(), Date.parse(atualizado.criadoEm))).toISOString();
  return atualizado;
}

export function alturaTotal(modelo) {
  const normalizado = normalizarModelo(modelo);
  return PARTES.reduce((total, parte) => total + normalizado.partes[parte].altura, 0);
}

/** Upsert imutável; editar mantém a identidade e a data de criação da obra salva. */
export function salvarModelo(modelos, modelo) {
  const lista = Array.isArray(modelos) ? modelos : [];
  const salvo = normalizarModelo(modelo);
  const anterior = lista.find(({ id }) => id === salvo.id);
  if (anterior && dataValida(anterior.criadoEm)) salvo.criadoEm = anterior.criadoEm;
  salvo.atualizadoEm = new Date(Math.max(Date.now(), Date.parse(salvo.criadoEm))).toISOString();
  return [salvo, ...lista.filter(({ id }) => id !== salvo.id).map(normalizarModelo)]
    .sort((a, b) => Date.parse(b.atualizadoEm) - Date.parse(a.atualizadoEm));
}

/** Um rascunho local, sem envio à Per Parte ou compromisso de fabricação. */
export function criarPedido(modelosSelecionados) {
  if (!Array.isArray(modelosSelecionados) || modelosSelecionados.length === 0) {
    throw new RangeError('Selecione ao menos uma criação.');
  }
  const itens = modelosSelecionados.map((modelo) => {
    if (!modeloValido(modelo)) throw new TypeError('A seleção contém uma criação inválida.');
    return normalizarModelo(modelo);
  });
  if (new Set(itens.map(({ id }) => id)).size !== itens.length) throw new RangeError('A seleção contém criações repetidas.');
  return { id: novaId('pedido'), criadoEm: new Date().toISOString(), status: 'rascunho', itens };
}

function modeloValido(modelo) {
  return ehObjeto(modelo) && idValida(modelo.id) && typeof modelo.nome === 'string'
    && modelo.nome === nomeLimpo(modelo.nome) && modelo.nome.length > 0
    && dataValida(modelo.criadoEm) && dataValida(modelo.atualizadoEm)
    && Date.parse(modelo.atualizadoEm) >= Date.parse(modelo.criadoEm)
    && idsPresets.has(modelo.preset) && ehObjeto(modelo.partes)
    && PARTES.every((parte) => {
      const peca = modelo.partes[parte];
      return ehObjeto(peca) && idsFormas.has(peca.forma) && idsVariacoes.has(peca.variacao)
        && idsCores.has(peca.cor) && ['largura', 'altura'].every((dimensao) =>
          Number.isInteger(peca[dimensao]) && peca[dimensao] >= LIMITES[parte][dimensao].min
          && peca[dimensao] <= LIMITES[parte][dimensao].max);
    });
}

function pedidoValido(pedido) {
  return ehObjeto(pedido) && idValida(pedido.id) && dataValida(pedido.criadoEm)
    && pedido.status === 'rascunho' && Array.isArray(pedido.itens) && pedido.itens.length > 0
    && pedido.itens.every(modeloValido)
    && new Set(pedido.itens.map(({ id }) => id)).size === pedido.itens.length;
}

function colecoesValidas(estado) {
  return ehObjeto(estado) && Array.isArray(estado.modelos) && Array.isArray(estado.pedidos)
    && estado.modelos.every(modeloValido) && estado.pedidos.every(pedidoValido)
    && new Set(estado.modelos.map(({ id }) => id)).size === estado.modelos.length
    && new Set(estado.pedidos.map(({ id }) => id)).size === estado.pedidos.length;
}

function interpretarEstado(texto) {
  const estado = JSON.parse(texto);
  if (estado?.versao !== VERSAO_ESTADO) throw new Error('A versão dos dados locais não é compatível.');
  if (!colecoesValidas(estado)) throw new Error('Os dados locais estão incompletos ou inválidos.');
  return estado;
}

function obterStorage(storage) {
  const destino = storage ?? globalThis.localStorage;
  if (!destino || typeof destino.getItem !== 'function' || typeof destino.setItem !== 'function') {
    throw new Error('O armazenamento deste navegador não está disponível.');
  }
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

/**
 * Recusa sobrescrever dados inválidos. O terceiro argumento só deve ser usado
 * após a pessoa confirmar explicitamente o descarte do conteúdo corrompido.
 */
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
