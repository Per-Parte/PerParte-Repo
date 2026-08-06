/**
 * Montagem v2 · F1 — primitivo CUBO (paralelepípedo com as escalas).
 *
 * Receita de topologia (espec da F1, seção "cubo"): 6 faces em grade de
 * quads; furos SÓ nas 4 faces laterais, recortados na grade em espaço de
 * parâmetro com túnel de parede externa↔interna (receita única do furo);
 * quando oco, a cavidade fecha em TETO PIRAMIDAL a 45° (= F4) — a ponte
 * plana de um teto reto não imprime em vãos grandes.
 */

import type {
  ApoioBloco,
  MalhaBloco,
  ParametrosBloco,
  PrimitivoBloco,
} from "./tipos";
import { alturaBrutaMm, grampearBloco, larguraBrutaMm } from "./limites";

export const apoioCubo: ApoioBloco = {
  alturaTopoMm: (p) => alturaBrutaMm(p),
  // Platôs quadrados: raio do círculo INSCRITO (pousar perto do canto
  // conta como fora — conservador, documentado em tipos.ts).
  raioApoioSuperiorMm: (p) => larguraBrutaMm(p) / 2,
  raioApoioInferiorMm: (p) => larguraBrutaMm(p) / 2,
  raioEnvelopeMm(p, zMm) {
    if (zMm < 0 || zMm > alturaBrutaMm(p)) return 0;
    // Planta quadrada: envelope pelo raio CIRCUNSCRITO (nunca interpenetra).
    return (larguraBrutaMm(p) / 2) * Math.SQRT2;
  },
  zSuperficieTopoMm(p, dMm) {
    if (dMm > larguraBrutaMm(p) / 2) return null;
    return alturaBrutaMm(p);
  },
  zSuperficieBaseMm(p, dMm) {
    if (dMm > larguraBrutaMm(p) / 2) return null;
    return 0;
  },
};

export function gerarMalhaCubo(
  p: ParametrosBloco,
  segmentos = 48
): MalhaBloco {
  // TODO F1: implementar pela receita da espec (grade de quads por face;
  // furos em espaço de parâmetro; cavidade com teto piramidal a F4).
  void p;
  void segmentos;
  throw new Error("TODO F1: gerarMalhaCubo — ver espec de topologia da F1");
}

export const primitivoCubo: PrimitivoBloco = {
  forma: "cubo",
  gerarMalha: gerarMalhaCubo,
  grampear: (p) => grampearBloco({ ...(p as object), forma: "cubo" }),
  apoio: apoioCubo,
};
