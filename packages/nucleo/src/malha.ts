/**
 * Malha 3D a partir do perfil de revolução — o caminho da produção.
 *
 * Gera um sólido fechado (estanque): superfície lateral revolucionada +
 * tampas superior e inferior fechadas no eixo. É a MESMA fonte de geometria
 * do preview; aqui em resolução de produção e com eixo de revolução no Z,
 * que é a vertical de impressão (regra F8).
 */

import {
  deslocamentoEspinhaMm,
  type EspinhaLateral,
  type Ponto2D,
} from "./geometria";
import {
  profundidadeEfetivaTexturaMm,
  valorTextura,
  type FamiliaTextura,
} from "./texturas";

export interface Malha {
  /** x, y, z por vértice, em mm. Z é a vertical de impressão. */
  posicoes: Float32Array;
  /** Trios de índices; enrolamento anti-horário visto de fora. */
  indices: Uint32Array;
}

/**
 * Textura de revolução: gomos (sulcos verticais esculpidos para dentro) com
 * torção opcional. Sulcos verticais imprimem limpos (F4/F8); a torção fica
 * segura porque a profundidade é pequena e a inclinação resultante
 * (raio·torção/altura) não passa do balanço permitido nos limites do Criar.
 */
export interface TexturaRevolucao {
  /** Número de gomos ao redor (0 = liso). */
  gomos: number;
  /** Profundidade do sulco, em mm — só esculpe para dentro da silhueta. */
  profundidadeMm: number;
  /** Giro total dos gomos da base ao topo, em graus. */
  torcaoGraus: number;
  /** Altura útil da parte, em mm (para a janela e a torção). */
  alturaMm: number;
  /** Família da textura (ausente = "gomos", o comportamento original). */
  familia?: FamiliaTextura;
  /** Repetição das famílias que não são gomos. */
  repeticao?: number;
}

/**
 * Janela vertical da textura: some suavemente perto das extremidades para
 * nunca tocar encaixes (F5), canaletas ou tampas.
 */
function janelaTextura(t: number): number {
  if (t <= 0.05 || t >= 0.95) return 0;
  return Math.min(1, (t - 0.05) / 0.08, (0.95 - t) / 0.08);
}

export function malhaRevolucao(
  perfil: Ponto2D[],
  segmentos: number,
  textura?: TexturaRevolucao,
  espinha?: EspinhaLateral
): Malha {
  const nAneis = perfil.length;
  const nVertices = nAneis * segmentos + 2;
  const posicoes = new Float32Array(nVertices * 3);

  // Texturas pedem malha fina; acabamentos facetados (poucos segmentos) são
  // um estilo próprio e desligam a textura — regra como ferramenta, sem erro.
  const familia: FamiliaTextura = textura?.familia ?? "gomos";
  const repeticao =
    familia === "gomos" ? (textura?.gomos ?? 0) : (textura?.repeticao ?? 0);
  const comTextura =
    !!textura &&
    repeticao > 0 &&
    textura.profundidadeMm > 0 &&
    textura.alturaMm > 0 &&
    segmentos >= 32;
  // Profundidade que respeita o orçamento de balanço da textura (F4).
  const profundidadeMm = comTextura
    ? profundidadeEfetivaTexturaMm(textura)
    : 0;
  const torcaoRad = comTextura
    ? (textura.torcaoGraus * Math.PI) / 180
    : 0;

  for (let j = 0; j < nAneis; j++) {
    // Espinha curva: o centro do anel se desloca em X conforme a altura.
    const dx = espinha ? deslocamentoEspinhaMm(perfil[j].y, espinha) : 0;
    for (let i = 0; i < segmentos; i++) {
      const th = (i / segmentos) * Math.PI * 2;
      let r = perfil[j].x;
      if (comTextura) {
        const t = perfil[j].y / textura.alturaMm;
        const w = janelaTextura(t);
        if (w > 0) {
          // A torção gira a fase; o valor [-1,1] vira [-1,0]: a textura só
          // esculpe para dentro — a silhueta continua sendo o envelope.
          const fase = torcaoRad * t;
          const u = (th + fase) / (Math.PI * 2);
          r +=
            profundidadeMm *
            w *
            0.5 *
            (valorTextura(familia, u, t, repeticao) - 1);
        }
      }
      const o = (j * segmentos + i) * 3;
      posicoes[o] = dx + r * Math.cos(th);
      posicoes[o + 1] = r * Math.sin(th);
      posicoes[o + 2] = perfil[j].y;
    }
  }

  // Ápices que fecham o sólido no eixo (fundo e topo).
  const apiceInferior = nAneis * segmentos;
  const apiceSuperior = apiceInferior + 1;
  posicoes[apiceInferior * 3] = espinha
    ? deslocamentoEspinhaMm(perfil[0].y, espinha)
    : 0;
  posicoes[apiceInferior * 3 + 2] = perfil[0].y;
  posicoes[apiceSuperior * 3] = espinha
    ? deslocamentoEspinhaMm(perfil[nAneis - 1].y, espinha)
    : 0;
  posicoes[apiceSuperior * 3 + 2] = perfil[nAneis - 1].y;

  const indices: number[] = [];

  for (let j = 0; j < nAneis - 1; j++) {
    for (let i = 0; i < segmentos; i++) {
      const i2 = (i + 1) % segmentos;
      const a = j * segmentos + i;
      const b = j * segmentos + i2;
      const c = (j + 1) * segmentos + i2;
      const d = (j + 1) * segmentos + i;
      indices.push(a, b, c, a, c, d);
    }
  }

  const ultimoAnel = (nAneis - 1) * segmentos;
  for (let i = 0; i < segmentos; i++) {
    const i2 = (i + 1) % segmentos;
    indices.push(apiceInferior, i2, i); // fundo, normal para -Z
    indices.push(apiceSuperior, ultimoAnel + i, ultimoAnel + i2); // topo, +Z
  }

  return { posicoes, indices: Uint32Array.from(indices) };
}

/** Desloca a malha em mm (X/Y no plano da mesa; Z para afundar/erguer). */
export function transladarMalha(
  m: Malha,
  dxMm: number,
  dyMm: number,
  dzMm = 0
): Malha {
  const posicoes = new Float32Array(m.posicoes);
  for (let i = 0; i < posicoes.length; i += 3) {
    posicoes[i] += dxMm;
    posicoes[i + 1] += dyMm;
    posicoes[i + 2] += dzMm;
  }
  return { posicoes, indices: m.indices };
}

/** Une malhas independentes num único arquivo (sólidos separados na mesa). */
export function unirMalhas(...malhas: Malha[]): Malha {
  let nV = 0;
  let nI = 0;
  for (const m of malhas) {
    nV += m.posicoes.length;
    nI += m.indices.length;
  }
  const posicoes = new Float32Array(nV);
  const indices = new Uint32Array(nI);
  let oV = 0;
  let oI = 0;
  for (const m of malhas) {
    posicoes.set(m.posicoes, oV);
    for (let i = 0; i < m.indices.length; i++) {
      indices[oI + i] = m.indices[i] + oV / 3;
    }
    oV += m.posicoes.length;
    oI += m.indices.length;
  }
  return { posicoes, indices };
}
