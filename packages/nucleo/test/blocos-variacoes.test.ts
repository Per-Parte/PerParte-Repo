/**
 * Montagem v2 · F1 — catálogo das 8 variações × 4 formas (32 entradas
 * da grade da F3). O contrato do catálogo: TODA variação é SEGURA —
 * materializada em qualquer forma, ela já respeita todos os clamps
 * (o grampeamento não muda nada) e as coerências de fabricação valem.
 */

import { describe, expect, it } from "vitest";
import { blocoDaVariacao, VARIACOES_BLOCO } from "../src/blocos/variacoes";
import {
  BLOCO_PADRAO,
  escalaAlturaMinimaPiramideOca,
  furoMaximoMm,
  grampearBloco,
  LIMITES_BLOCO,
  PAREDE_MINIMA_BLOCO_MM,
} from "../src/blocos/limites";
import { FORMAS_BLOCO } from "../src/blocos/tipos";

describe("catálogo VARIACOES_BLOCO", () => {
  it("são 8 variações, com ids estáveis e únicos", () => {
    expect(VARIACOES_BLOCO).toHaveLength(8);
    expect(new Set(VARIACOES_BLOCO.map((v) => v.id)).size).toBe(8);
    const ids = VARIACOES_BLOCO.map((v) => v.id);
    // O requisito do sistema: oca/sólida, furos ○ △ □, esticada/achatada.
    for (const esperado of [
      "pura",
      "oca",
      "furos-circulo-poucos",
      "furos-circulo-grade",
      "furos-quadrado",
      "furos-triangulo",
      "achatada",
      "esticada",
    ]) {
      expect(ids).toContain(esperado);
    }
  });

  it("toda variação tem rótulo pt-BR para a grade da F3", () => {
    for (const v of VARIACOES_BLOCO) {
      expect(v.nome.length).toBeGreaterThan(0);
    }
  });
});

describe("as 32 entradas (4 formas × 8 variações) são seguras", () => {
  for (const forma of FORMAS_BLOCO) {
    for (const variacao of VARIACOES_BLOCO) {
      const rotulo = `${forma} · ${variacao.id}`;

      it(`${rotulo}: passa pelo grampeamento SEM MUDAR (já válida)`, () => {
        const bloco = blocoDaVariacao(variacao, forma);
        // O pedido cru da variação sobre o padrão É o resultado grampeado.
        expect(bloco).toEqual({
          ...BLOCO_PADRAO,
          ...variacao.params,
          forma,
          corIdx: 0,
        });
        // E o grampeador é idempotente sobre ele.
        expect(grampearBloco(bloco)).toEqual(bloco);
      });

      it(`${rotulo}: coerências de fabricação valem`, () => {
        const bloco = blocoDaVariacao(variacao, forma);
        expect(bloco.espessuraParedeMm).toBeGreaterThanOrEqual(
          PAREDE_MINIMA_BLOCO_MM
        );
        expect(bloco.escalaAltura).toBeGreaterThanOrEqual(
          LIMITES_BLOCO.escalaAltura.min
        );
        expect(bloco.escalaLargura).toBeGreaterThanOrEqual(
          LIMITES_BLOCO.escalaLargura.min
        );
        if (bloco.furos) {
          // Furos são passantes de parede: exigem casca…
          expect(bloco.oca).toBe(true);
          expect(bloco.furos.quantidade).toBeGreaterThanOrEqual(1);
          // …e nunca passam do teto que preserva parede ≥ F2.
          expect(bloco.furos.tamanhoMm).toBeGreaterThanOrEqual(
            LIMITES_BLOCO.furoTamanhoMm.min
          );
          expect(bloco.furos.tamanhoMm).toBeLessThanOrEqual(
            furoMaximoMm(bloco)
          );
        }
        if (bloco.forma === "piramide" && bloco.oca) {
          // Teto da cavidade da pirâmide oca imprimível (piso de altura F4).
          expect(bloco.escalaAltura).toBeGreaterThanOrEqual(
            escalaAlturaMinimaPiramideOca(bloco.escalaLargura)
          );
        }
      });
    }
  }
});
