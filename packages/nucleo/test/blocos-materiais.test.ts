/**
 * Montagem v2 — MATERIAIS do bloco (item 7 do plano de alterações).
 *
 * O invariante que mais importa aqui não é geométrico, é de PRODUTO:
 * `corIdx` viaja no estado da obra, então a ordem da lista é um
 * contrato. Se alguém reordenar ou inserir no meio, toda obra já
 * montada troca de cor sozinha — é o tipo de estrago silencioso que só
 * aparece quando um cliente reabre o link dele.
 */

import { describe, expect, it } from "vitest";
import { PALETA } from "../src/catalogo";
import {
  MATERIAIS_BLOCO,
  grampearBloco,
  materialDoBloco,
  type AcabamentoBloco,
} from "../src";

describe("materiais — a ordem é contrato", () => {
  it("os 12 primeiros índices são a PALETA do catálogo, na ordem", () => {
    PALETA.forEach((cor, i) => {
      expect(MATERIAIS_BLOCO[i].nome, `índice ${i}`).toBe(cor.nome);
      expect(MATERIAIS_BLOCO[i].hex, `índice ${i}`).toBe(cor.hex);
    });
  });

  it("as cinco referências de 08/08 entraram DEPOIS, sem deslocar nada", () => {
    expect(MATERIAIS_BLOCO).toHaveLength(PALETA.length + 5);
    const novos = MATERIAIS_BLOCO.slice(PALETA.length).map((m) => m.nome);
    expect(novos).toEqual(["Ametista", "Castanho", "Ônix", "Névoa", "Limão"]);
  });

  it("a esfera de referência metálica é a única não-fosca", () => {
    const metalicos = MATERIAIS_BLOCO.filter(
      (m) => m.acabamento === "metalico"
    );
    expect(metalicos.map((m) => m.nome)).toEqual(["Ametista"]);
  });
});

describe("materiais — higiene da lista", () => {
  it("todo material tem nome único e hex válido", () => {
    const nomes = new Set(MATERIAIS_BLOCO.map((m) => m.nome));
    expect(nomes.size).toBe(MATERIAIS_BLOCO.length);
    for (const m of MATERIAIS_BLOCO) {
      expect(m.hex, m.nome).toMatch(/^#[0-9A-F]{6}$/i);
      const acabamentos: AcabamentoBloco[] = ["fosco", "metalico"];
      expect(acabamentos, m.nome).toContain(m.acabamento);
    }
  });

  it("materialDoBloco nunca quebra: índice inválido cai no primeiro", () => {
    expect(materialDoBloco(0)).toEqual(MATERIAIS_BLOCO[0]);
    expect(materialDoBloco(MATERIAIS_BLOCO.length - 1)).toEqual(
      MATERIAIS_BLOCO[MATERIAIS_BLOCO.length - 1]
    );
    for (const ruim of [-1, 999, Number.NaN]) {
      expect(materialDoBloco(ruim), String(ruim)).toEqual(MATERIAIS_BLOCO[0]);
    }
  });
});

describe("materiais — o grampeador alcança os novos", () => {
  it("corIdx chega ao último material (antes parava na paleta antiga)", () => {
    const ultimo = MATERIAIS_BLOCO.length - 1;
    expect(grampearBloco({ corIdx: ultimo }).corIdx).toBe(ultimo);
    // E continua sendo clamp, nunca erro.
    expect(grampearBloco({ corIdx: 9999 }).corIdx).toBe(ultimo);
    expect(grampearBloco({ corIdx: -5 }).corIdx).toBe(0);
    expect(grampearBloco({ corIdx: "lixo" as unknown as number }).corIdx).toBe(
      0
    );
  });

  it("é idempotente com os materiais novos", () => {
    for (let i = 0; i < MATERIAIS_BLOCO.length; i++) {
      const uma = grampearBloco({ forma: "cubo", corIdx: i });
      expect(grampearBloco(uma)).toEqual(uma);
    }
  });
});
