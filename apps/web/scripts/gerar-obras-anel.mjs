/**
 * Gera as obras do Anel (§3.3 do design-do-site-v1): 13 silhuetas SVG de
 * presets do catálogo em public/obras/preset-NN.svg + src/lib/obras-anel.ts
 * com a lista completa (fotos mood + presets, cada preset com o link ?c=).
 *
 * Uso, a partir da raiz do repo:
 *   node apps/web/scripts/gerar-obras-anel.mjs
 *
 * O núcleo é TypeScript e o Node 24 o executa por type-stripping — mas os
 * imports relativos internos do núcleo não têm extensão, então o hook
 * abaixo completa o ".ts" que falta na resolução ESM. Por isso os imports
 * do núcleo/criacao são dinâmicos: precisam acontecer depois do hook.
 */

import { writeFile } from "node:fs/promises";
import { registerHooks } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

registerHooks({
  resolve(especificador, contexto, seguinte) {
    try {
      return seguinte(especificador, contexto);
    } catch (erro) {
      if (especificador.startsWith(".") && !/\.[cm]?[jt]sx?$/.test(especificador)) {
        return seguinte(`${especificador}.ts`, contexto);
      }
      throw erro;
    }
  },
});

const {
  BASES,
  CORPOS,
  DIFUSORES,
  PALETA,
  deslocamentoEspinhaMm,
  grampearBase,
  grampearCorpo,
  grampearDifusor,
  perfilBase,
  perfilCorpo,
  perfilDifusor,
} = await import(new URL("../../../packages/nucleo/src/index.ts", import.meta.url).href);
const { codificarCriacao } = await import(new URL("../src/lib/criacao.ts", import.meta.url).href);

const RAIZ_WEB = path.resolve(fileURLToPath(import.meta.url), "../..");

/* ——— Cores do brief (§2): constantes + famílias ——— */
const LUZ_ACESA = "#F6E7C4";
const AREIA = "#E4DCCB";
const PALCO_CLARO = "#E7DFD0";
const MARCO = "#7D8C6F";
const AMBAR = "#D9A441";
const BOSQUE = "#2F4A3E";
const BRASA = "#B03A2E";
const BRASA_PROFUNDO = "#7B241C";
const SOL = "#CC6B2C";
const SOL_ACENTO = "#E5B22B";
const SOL_PROFUNDO = "#8C3D14";

/** Fotos de campanha que já existem em /public/obras (entram antes dos presets). */
const FOTOS = [
  { arquivo: "mood-pp-01-manifesto-vermelho.jpg", alt: "Luminária Per Parte vermelha em cena de campanha" },
  { arquivo: "mood-pp-02-manifesto-bege.jpg", alt: "Luminária Per Parte bege em cena de campanha" },
  { arquivo: "mood-pp-03-manifesto-verde.jpg", alt: "Luminária Per Parte verde em cena de campanha" },
  { arquivo: "mood-pp-04-close-juncao.jpg", alt: "Detalhe da junção entre duas partes de uma luminária" },
  { arquivo: "mood-pp-05-obra-minima-quarto.jpg", alt: "Obra mínima acesa na mesa de cabeceira de um quarto" },
];

/**
 * Os 13 presets: combinações variadas de BASES × CORPOS × DIFUSORES.
 * `cores` = [base, corpo, difusor] em cor chapada, cada parte diferente da
 * adjacente (cor delimita parte — junções celebradas), difusor quase sempre
 * em Areia/Luz Acesa. `fundo` alterna palco-claro/areia/tons da família.
 * `paleta` = índices da PALETA do núcleo que melhor casam com as cores do
 * SVG (vão no link ?c=) — quando duas partes cairiam no mesmo índice, a
 * mais escura usa o vizinho mais próximo para a junção seguir legível.
 */
const CARTOES = [
  { partes: [0, 0, 0], cores: [BOSQUE, MARCO, LUZ_ACESA], fundo: PALCO_CLARO, paleta: [7, 4, 1] },
  { partes: [1, 1, 1], cores: [BRASA_PROFUNDO, BRASA, LUZ_ACESA], fundo: AREIA, paleta: [10, 2, 1] },
  { partes: [2, 4, 2], cores: [SOL_PROFUNDO, SOL_ACENTO, LUZ_ACESA], fundo: SOL, paleta: [8, 3, 1] },
  { partes: [1, 5, 0], cores: [SOL_PROFUNDO, SOL, LUZ_ACESA], fundo: PALCO_CLARO, paleta: [8, 2, 1] },
  { partes: [2, 6, 1], cores: [MARCO, BOSQUE, AMBAR], fundo: AREIA, paleta: [4, 7, 3] },
  { partes: [3, 3, 3], cores: [AMBAR, MARCO, LUZ_ACESA], fundo: BOSQUE, paleta: [3, 4, 1] },
  { partes: [3, 7, 2], cores: [BRASA, BRASA_PROFUNDO, LUZ_ACESA], fundo: PALCO_CLARO, paleta: [2, 10, 1] },
  { partes: [0, 4, 3], cores: [SOL_ACENTO, SOL, LUZ_ACESA], fundo: AREIA, paleta: [3, 2, 1] },
  { partes: [0, 2, 4], cores: [AREIA, BRASA, LUZ_ACESA], fundo: BRASA_PROFUNDO, paleta: [0, 2, 1] },
  { partes: [3, 6, 1], cores: [SOL_PROFUNDO, SOL, SOL_ACENTO], fundo: PALCO_CLARO, paleta: [8, 2, 3] },
  { partes: [1, 2, 0], cores: [BOSQUE, AMBAR, LUZ_ACESA], fundo: MARCO, paleta: [7, 3, 1] },
  { partes: [2, 1, 4], cores: [AREIA, BRASA_PROFUNDO, LUZ_ACESA], fundo: BRASA, paleta: [0, 10, 1] },
  { partes: [0, 7, 4], cores: [MARCO, LUZ_ACESA, AMBAR], fundo: BOSQUE, paleta: [4, 1, 3] },
];

for (const [n, cartao] of CARTOES.entries()) {
  const { cores, fundo, paleta } = cartao;
  if (cores[0] === cores[1] || cores[1] === cores[2]) {
    throw new Error(`preset ${n + 1}: partes adjacentes com a mesma cor`);
  }
  if (cores.includes(fundo)) throw new Error(`preset ${n + 1}: parte na cor do fundo`);
  if (paleta[0] === paleta[1] || paleta[1] === paleta[2]) {
    throw new Error(`preset ${n + 1}: índices de paleta adjacentes iguais`);
  }
  if (paleta.some((i) => !PALETA[i])) throw new Error(`preset ${n + 1}: índice fora da PALETA`);
}

/* ——— Silhuetas: contorno 2D real do núcleo, espelhado no eixo ——— */

const LARG = 500;
const ALT = 700;
const MARGEM_X = 90;
const MARGEM_Y = 80;

/**
 * Fecha o meridiano (raio × altura) numa silhueta de revolução: lado
 * direito como veio, lado esquerdo espelhado. `deslocDe` é o desvio da
 * espinha (corpo em S) numa altura local y, em mm.
 */
function silhueta(perfil, deslocDe) {
  const direita = perfil.map((p) => ({ x: deslocDe(p.y) + p.x, y: p.y }));
  const esquerda = perfil.map((p) => ({ x: deslocDe(p.y) - p.x, y: p.y })).reverse();
  return [...direita, ...esquerda];
}

/**
 * Achata os anéis de encaixe na linha da junção: montada, a obra esconde
 * macho e fêmea — a silhueta mostra só a linha onde as cores se encontram.
 * pontosFemea/pontosMacho contribuem exatamente 5 pontos cada (núcleo).
 */
function achatarEncaixes(perfil, { comFemea = false, tetoMachoMm = null } = {}) {
  const pontos = perfil.map((p) => ({ ...p }));
  if (comFemea) for (let i = 0; i < 5; i++) pontos[i].y = 0;
  if (tetoMachoMm !== null) {
    for (let i = pontos.length - 5; i < pontos.length; i++) {
      pontos[i].y = Math.min(pontos[i].y, tetoMachoMm);
    }
  }
  return pontos;
}

function gerarSvg(cartao) {
  const [iBase, iCorpo, iDifusor] = cartao.partes;
  const base = BASES[iBase];
  const corpo = CORPOS[iCorpo];
  const difusor = DIFUSORES[iDifusor];

  const espinha = {
    deslocamentoMm: corpo.deslocamentoMm,
    posicaoDobra: corpo.posicaoDobra,
    alturaMm: corpo.alturaMm,
  };
  const deslocTopoMm = deslocamentoEspinhaMm(corpo.alturaMm, espinha);

  // Cada parte no referencial da obra (y para cima, 0 = mesa), empilhada
  // como monta de verdade: o topo de uma é o chão da seguinte.
  const partes = [
    {
      pontos: silhueta(
        achatarEncaixes(perfilBase(base), { tetoMachoMm: base.alturaMm }),
        () => 0
      ),
      yMm: 0,
      cor: cartao.cores[0],
    },
    {
      pontos: silhueta(
        achatarEncaixes(perfilCorpo(corpo), { comFemea: true, tetoMachoMm: corpo.alturaMm }),
        (y) => deslocamentoEspinhaMm(y, espinha)
      ),
      yMm: base.alturaMm,
      cor: cartao.cores[1],
    },
    {
      pontos: silhueta(
        achatarEncaixes(perfilDifusor(difusor), { comFemea: true }),
        () => deslocTopoMm
      ),
      yMm: base.alturaMm + corpo.alturaMm,
      cor: cartao.cores[2],
    },
  ];

  let xMin = Infinity;
  let xMax = -Infinity;
  let yMaxMm = 0;
  for (const parte of partes) {
    for (const p of parte.pontos) {
      xMin = Math.min(xMin, p.x);
      xMax = Math.max(xMax, p.x);
      yMaxMm = Math.max(yMaxMm, parte.yMm + p.y);
    }
  }
  const s = Math.min((LARG - 2 * MARGEM_X) / (xMax - xMin), (ALT - 2 * MARGEM_Y) / yMaxMm);
  const cx = LARG / 2 - (s * (xMin + xMax)) / 2;
  const chao = (ALT + s * yMaxMm) / 2; // obra centrada na vertical do card
  const X = (x) => (cx + s * x).toFixed(1);
  const Y = (y) => (chao - s * y).toFixed(1);

  const caminhos = partes.map(
    (parte) =>
      `<path fill="${parte.cor}" d="M${parte.pontos
        .map((p) => `${X(p.x)} ${Y(parte.yMm + p.y)}`)
        .join("L")}Z"/>`
  );
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${LARG} ${ALT}">`,
    `  <rect width="${LARG}" height="${ALT}" fill="${cartao.fundo}"/>`,
    ...caminhos.map((c) => `  ${c}`),
    `</svg>`,
    ``,
  ].join("\n");
}

/* ——— Link ?c=: a criação mínima válida de cada preset ——— */

function criacaoDoCartao(cartao) {
  const [iBase, iCorpo, iDifusor] = cartao.partes;
  return {
    v: 1,
    modo: "montar",
    iBase,
    iCorpo,
    iDifusor,
    cores: { base: cartao.paleta[0], corpo: cartao.paleta[1], difusor: cartao.paleta[2] },
    estruturais: [],
    iFaceta: 0,
    luzAcesa: true,
    pontosDeLuz: 1,
    separacaoMm: 100,
    placa: null,
    criar: {
      base: grampearBase({}),
      corpo: grampearCorpo({}),
      difusor: grampearDifusor({}),
    },
    remixDe: "",
  };
}

/* ——— Escrita: preset-NN.svg + obras-anel.ts ——— */

const obras = FOTOS.map((foto) => ({
  src: `/obras/${foto.arquivo}`,
  alt: foto.alt,
  href: "/configurador",
}));

for (const [n, cartao] of CARTOES.entries()) {
  const nome = `preset-${String(n + 1).padStart(2, "0")}.svg`;
  const svg = gerarSvg(cartao);
  if (svg.includes("NaN")) throw new Error(`${nome}: coordenada NaN`);
  await writeFile(path.join(RAIZ_WEB, "public/obras", nome), svg);

  const [iBase, iCorpo, iDifusor] = cartao.partes;
  obras.push({
    src: `/obras/${nome}`,
    alt: `Luminária com base ${BASES[iBase].nome}, corpo ${CORPOS[iCorpo].nome} e difusor ${DIFUSORES[iDifusor].nome}`,
    href: `/configurador?c=${codificarCriacao(criacaoDoCartao(cartao))}`,
  });
}

const ts = [
  `/**`,
  ` * ARQUIVO GERADO por \`node apps/web/scripts/gerar-obras-anel.mjs\` — não editar à mão.`,
  ` *`,
  ` * As obras do Anel (§3.3): 5 fotos de campanha e 13 presets do catálogo,`,
  ` * cada preset com o link ?c= que abre a criação no configurador.`,
  ` */`,
  ``,
  `export interface ObraDoAnel {`,
  `  /** Caminho da imagem em /public. */`,
  `  src: string;`,
  `  alt: string;`,
  `  /** Destino do clique no card. */`,
  `  href: string;`,
  `}`,
  ``,
  `export const OBRAS_ANEL: ObraDoAnel[] = [`,
  ...obras.map(
    (o) =>
      `  {\n    src: ${JSON.stringify(o.src)},\n    alt: ${JSON.stringify(o.alt)},\n    href: ${JSON.stringify(o.href)},\n  },`
  ),
  `];`,
  ``,
].join("\n");

await writeFile(path.join(RAIZ_WEB, "src/lib/obras-anel.ts"), ts);

console.log(`ok: ${CARTOES.length} SVGs em public/obras + src/lib/obras-anel.ts (${obras.length} obras)`);
