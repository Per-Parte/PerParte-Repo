/**
 * Vazados: a máscara é determinística, fecha em 360° e nunca fura a zona
 * dos encaixes; a validação transforma lixo em vazado válido ou em nada.
 */

import { describe, expect, it } from "vitest";
import {
  grampearDifusor,
  grampearVazado,
  mascaraVazado,
  PADROES_VAZADO,
  type ParametrosVazado,
} from "../src";

const BASE: ParametrosVazado = {
  padrao: "pontos",
  densidade: 0.5,
  gradiente: 0,
};

describe("máscara — invariantes", () => {
  it("fecha em 360°: u=0 e u=1 dão o mesmo furo", () => {
    for (const { id } of PADROES_VAZADO) {
      const p = { ...BASE, padrao: id };
      for (let k = 0; k < 40; k++) {
        const v = 0.1 + (k / 40) * 0.8;
        expect(
          mascaraVazado(p, 0, v, 60, 100),
          `padrão ${id} v=${v}`
        ).toBe(mascaraVazado(p, 1, v, 60, 100));
      }
    }
  });

  it("margens sólidas: nenhum furo perto das pontas (zona de encaixe)", () => {
    for (const { id } of PADROES_VAZADO) {
      const p = { ...BASE, padrao: id, densidade: 0.85, gradiente: 1 };
      for (let k = 0; k <= 200; k++) {
        const u = k / 200;
        expect(mascaraVazado(p, u, 0.02, 60, 100), `padrão ${id}`).toBe(false);
        expect(mascaraVazado(p, u, 0.98, 60, 100), `padrão ${id}`).toBe(false);
      }
    }
  });

  it("é determinística", () => {
    for (const { id } of PADROES_VAZADO) {
      const p = { ...BASE, padrao: id };
      for (let k = 0; k < 50; k++) {
        const u = (k * 17) % 100 / 100;
        const v = 0.15 + ((k * 7) % 60) / 100;
        expect(mascaraVazado(p, u, v, 60, 100)).toBe(
          mascaraVazado(p, u, v, 60, 100)
        );
      }
    }
  });

  it("todo padrão com densidade média fura em algum lugar", () => {
    for (const { id } of PADROES_VAZADO) {
      const p = { ...BASE, padrao: id, densidade: 0.6 };
      let furos = 0;
      for (let j = 0; j < 40; j++) {
        for (let i = 0; i < 40; i++) {
          if (mascaraVazado(p, i / 40, 0.15 + (j / 40) * 0.7, 60, 100)) {
            furos++;
          }
        }
      }
      expect(furos, `padrão ${id}`).toBeGreaterThan(0);
    }
  });
});

describe("validação — vazado vindo de fora", () => {
  it("padrão desconhecido ou não-objeto vira undefined", () => {
    expect(grampearVazado(undefined)).toBeUndefined();
    expect(grampearVazado("pontos")).toBeUndefined();
    expect(grampearVazado({ padrao: "estrela" })).toBeUndefined();
  });

  it("valores fora da faixa saem grampeados", () => {
    const v = grampearVazado({
      padrao: "trelica",
      densidade: 99,
      gradiente: -99,
    });
    expect(v).toBeDefined();
    expect(v!.densidade).toBeLessThanOrEqual(0.85);
    expect(v!.gradiente).toBeGreaterThanOrEqual(-1);
  });

  it("grampearDifusor carrega o vazado válido e descarta o inválido", () => {
    const com = grampearDifusor({ vazado: { padrao: "fenda" } });
    expect(com.vazado?.padrao).toBe("fenda");
    const sem = grampearDifusor({ vazado: { padrao: "xyz" } as never });
    expect(sem.vazado).toBeUndefined();
  });
});
