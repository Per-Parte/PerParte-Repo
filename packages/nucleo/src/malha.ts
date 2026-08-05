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
  modulaPorTheta,
  type EspinhaLateral,
  type FacetasRevolucao,
  type Ponto2D,
} from "./geometria";
import { deltaCorteMm, type CorteBorda } from "./terminacao";
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
  /**
   * Piso do raio que NEM O VALE DO SULCO pode cruzar, em mm. No corpo é o
   * cilindro do miolo elétrico (S2 — inviolável): o perfil respeita o piso
   * pela cascata de clamps, mas a textura esculpe a partir do perfil — num
   * corpo magro o vale desceria para dentro do miolo sem este freio. A
   * textura raseia sozinha onde falta parede: limite como ferramenta.
   */
  pisoMm?: number;
}

/**
 * Janela vertical da textura: some suavemente perto das extremidades para
 * nunca tocar encaixes (F5), canaletas ou tampas.
 */
function janelaTextura(t: number): number {
  if (t <= 0.05 || t >= 0.95) return 0;
  return Math.min(1, (t - 0.05) / 0.08, (0.95 - t) / 0.08);
}

/** Peso 0→1 da zona facetada numa altura y (rampa suave nas duas pontas). */
function pesoFacetas(y: number, f: FacetasRevolucao): number {
  const t = Math.max(0.01, f.transicaoMm ?? 8);
  const w = Math.min((y - f.yMinMm) / t, (f.yMaxMm - y) / t, 1);
  return w <= 0 ? 0 : w > 1 ? 1 : w;
}

export function malhaRevolucao(
  perfil: Ponto2D[],
  segmentos: number,
  textura?: TexturaRevolucao,
  espinha?: EspinhaLateral,
  facetas?: FacetasRevolucao,
  corte?: CorteBorda
): Malha {
  const nAneis = perfil.length;
  const nVertices = nAneis * segmentos + 2;
  const posicoes = new Float32Array(nVertices * 3);

  // Corte de terminação (z(θ)): a borda livre desce para topo − δ(θ).
  // `min` é monótono, então anéis nunca se invertem e a malha continua
  // estanque; abaixo do corte nada muda.
  const yTopoMm = corte ? Math.max(...perfil.map((p) => p.y)) : 0;

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
  // A TORÇÃO tem custo próprio de impressão: a face da aleta segue a
  // hélice, com inclinação tan = r·τ/h — independente da profundidade.
  // O orçamento das famílias só cobra a variação VERTICAL (coefV), então
  // a hélice é clampada aqui: em peça larga e baixa, a torção encosta no
  // F4 e para (limite como ferramenta). ⚑ validar impresso.
  let torcaoRad = comTextura ? (textura.torcaoGraus * Math.PI) / 180 : 0;
  if (torcaoRad !== 0 && comTextura) {
    let rMaxPerfil = 0;
    for (const p of perfil) rMaxPerfil = Math.max(rMaxPerfil, p.x);
    const teto = textura.alturaMm / Math.max(1, rMaxPerfil);
    torcaoRad = Math.sign(torcaoRad) * Math.min(Math.abs(torcaoRad), teto);
  }

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
          // S2: o vale do sulco nunca cruza o piso (miolo elétrico).
          if (textura.pisoMm != null && r < textura.pisoMm) {
            r = Math.min(perfil[j].x, textura.pisoMm);
          }
        }
      }
      // Modulação por θ: o raio vira função do ângulo, só na janela da
      // lateral — as zonas de encaixe ficam redondas. Duas funções no mesmo
      // slot: o polígono regular (vértices no raio do perfil, faces para
      // dentro; exige `segmentos` múltiplo de `lados` para as arestas
      // caírem nos vértices) e a superelipse inscrita (squircle — suave,
      // sem exigência de alinhamento). Ambas ≤ r e 1-Lipschitz em r: a
      // silhueta continua o envelope e o balanço nunca piora.
      if (modulaPorTheta(facetas)) {
        const f = facetas!;
        const wf = pesoFacetas(perfil[j].y, f);
        if (wf > 0) {
          let rMod: number;
          if (f.expoente && f.expoente > 2) {
            const nExp = f.expoente;
            const co = Math.abs(Math.cos(th));
            const se = Math.abs(Math.sin(th));
            // Raio da superelipse |x|ⁿ+|y|ⁿ=rⁿ, normalizado para inscrever
            // (a diagonal toca r; o meio da face mergulha 2^-((n-2)/2n)).
            const bruto = Math.pow(
              Math.pow(co, nExp) + Math.pow(se, nExp),
              -1 / nExp
            );
            const norma = Math.pow(2, (nExp - 2) / (2 * nExp));
            rMod = (r * bruto) / norma;
          } else if (f.lados >= 3) {
            const setor = Math.PI / f.lados;
            const dth =
              ((th % (2 * setor)) + 2 * setor) % (2 * setor) - setor;
            rMod = (r * Math.cos(setor)) / Math.cos(dth);
          } else {
            rMod = r;
          }
          // ESTICAR: terceira função da máquina r(θ) — escala anisotrópica
          // da seção (X guarda o envelope, Y encolhe para `proporcao`).
          // Fator elíptico ≤ 1 e 1-Lipschitz em r: as garantias das outras
          // funções (envelope, F4) valem de graça.
          const prop = f.proporcao ?? 1;
          if (prop < 0.999) {
            const co = Math.cos(th);
            const se = Math.sin(th);
            rMod *= prop / Math.hypot(prop * co, se);
          }
          let rf = r + (rMod - r) * wf;
          if (f.pisoMm != null) {
            rf = Math.max(rf, Math.min(r, f.pisoMm));
          }
          r = rf;
        }
      }
      let z = perfil[j].y;
      if (corte) {
        z = Math.min(z, yTopoMm - deltaCorteMm(corte, i / segmentos));
      }
      const o = (j * segmentos + i) * 3;
      posicoes[o] = dx + r * Math.cos(th);
      posicoes[o + 1] = r * Math.sin(th);
      posicoes[o + 2] = z;
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
  // Com corte, o ápice fica no fundo do corte — o leque da tampa nunca
  // sobe acima da borda cortada em nenhum θ.
  posicoes[apiceSuperior * 3 + 2] = corte
    ? Math.min(perfil[nAneis - 1].y, yTopoMm - corte.profundidadeMm)
    : perfil[nAneis - 1].y;

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

/**
 * Gira a malha em torno do eixo Y (horizontal), em radianos — é o que
 * "deita" um sólido de revolução (a PLACA nasce vertical e tomba de lado).
 */
export function rotacionarMalhaEmY(m: Malha, rad: number): Malha {
  const posicoes = new Float32Array(m.posicoes.length);
  const c = Math.cos(rad);
  const s = Math.sin(rad);
  for (let i = 0; i < posicoes.length; i += 3) {
    const x = m.posicoes[i];
    const z = m.posicoes[i + 2];
    posicoes[i] = x * c + z * s;
    posicoes[i + 1] = m.posicoes[i + 1];
    posicoes[i + 2] = -x * s + z * c;
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
