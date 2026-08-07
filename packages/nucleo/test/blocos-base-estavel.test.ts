/**
 * Montagem v2 — BASE ESTÁVEL NO CHÃO (item 1 do plano de alterações).
 *
 * O contrato: a peça que entra apoiada no chão mede a própria área de
 * contato e ganha o corte que a sustenta. A esfera é o caso visível; as
 * formas de base cheia não são tocadas. Tudo medido na MALHA REAL — o
 * pé prometido pela regra tem de existir na peça que sai.
 */

import { describe, expect, it } from "vitest";
import {
  BASE_ESTAVEL_MINIMO_MM,
  FORMAS_BLOCO,
  PRIMITIVOS_BLOCO,
  VARIACOES_BLOCO,
  apoioDaForma,
  apoioPontoDeLuz,
  blocoDaVariacao,
  fatiaDeBaseEstavel,
  gerarMalhaBloco,
  grampearBloco,
  raioBaseEstavelMm,
  type MalhaBloco,
  type ParametrosBloco,
} from "../src";
import { verificarEstanque, volumeAssinadoMm3 } from "./apoio";

/** Raio do apoio REAL da peça: o maior raio entre os vértices do chão. */
function raioDoPeMm(malha: MalhaBloco): number {
  let raio = 0;
  let vertices = 0;
  for (let i = 0; i < malha.posicoes.length; i += 3) {
    if (malha.posicoes[i + 2] > 0.01) continue;
    vertices++;
    raio = Math.max(
      raio,
      Math.hypot(malha.posicoes[i], malha.posicoes[i + 1])
    );
  }
  return vertices > 0 ? raio : 0;
}

function esperarEstanque(malha: MalhaBloco, nome: string): void {
  expect(verificarEstanque(malha).problema ?? "ok", nome).toBe("ok");
  expect(volumeAssinadoMm3(malha), nome).toBeGreaterThan(0);
}

/** Aplica a regra como a cena aplica: grampeia com o corte devolvido. */
function comBaseEstavel(p: ParametrosBloco): ParametrosBloco {
  const fatia = fatiaDeBaseEstavel(p, apoioDaForma(p.forma));
  return fatia ? grampearBloco({ ...p, fatia }) : p;
}

describe("base estável — a esfera nasce com pé chato", () => {
  it("a regra corta a esfera e o pé REAL da malha atende o alvo", () => {
    const casos = [
      { tamanhoMm: 40 },
      { tamanhoMm: 70 },
      { tamanhoMm: 100 },
      { tamanhoMm: 200 },
      { tamanhoMm: 100, escalaAltura: 1.5 },
      { tamanhoMm: 100, escalaAltura: 0.5, escalaLargura: 1.2 },
      { tamanhoMm: 100, escalaLargura: 0.5 },
    ];
    for (const caso of casos) {
      const rotulo = JSON.stringify(caso);
      const cru = grampearBloco({ forma: "esfera", ...caso });
      // Sem corte, a esfera toca o chão num PONTO: nada a sustenta.
      expect(raioDoPeMm(gerarMalhaBloco(cru)), rotulo).toBeLessThan(
        BASE_ESTAVEL_MINIMO_MM
      );

      const fatia = fatiaDeBaseEstavel(cru, apoioDaForma("esfera"));
      expect(fatia, rotulo).not.toBeNull();
      expect(fatia!.eixo, rotulo).toBe("z");
      expect(fatia!.lado, rotulo).toBe("maior");

      const estavel = comBaseEstavel(cru);
      const malha = gerarMalhaBloco(estavel);
      esperarEstanque(malha, `esfera estável ${rotulo}`);
      // O pé medido na malha entrega o alvo (folga de 5% pela discretização
      // do círculo de corte em polígono).
      expect(raioDoPeMm(malha), rotulo).toBeGreaterThanOrEqual(
        0.95 * raioBaseEstavelMm(estavel)
      );
    }
  });

  it("todas as 8 variações da esfera ganham pé e continuam estanques", () => {
    for (const variacao of VARIACOES_BLOCO) {
      const estavel = comBaseEstavel(blocoDaVariacao(variacao, "esfera"));
      expect(estavel.fatia, variacao.id).not.toBeNull();
      const malha = gerarMalhaBloco(estavel);
      esperarEstanque(malha, `esfera ${variacao.id}`);
      expect(raioDoPeMm(malha), variacao.id).toBeGreaterThanOrEqual(
        0.95 * raioBaseEstavelMm(estavel)
      );
      // A peça continua apoiada na mesa, nunca abaixo dela.
      let minZ = Infinity;
      for (let i = 2; i < malha.posicoes.length; i += 3) {
        minZ = Math.min(minZ, malha.posicoes[i]);
      }
      expect(minZ, variacao.id).toBeCloseTo(0, 4);
    }
  });

  it("o corte come pouco da altura (freio defensivo nunca dispara)", () => {
    const estavel = comBaseEstavel(
      grampearBloco({ forma: "esfera", tamanhoMm: 100 })
    );
    expect(estavel.fatia!.posicaoMm).toBeLessThan(100 * 0.25);
  });
});

describe("base estável — quem já tem pé não é tocado", () => {
  it("cubo, cilindro e pirâmide em pé passam intactos", () => {
    for (const forma of FORMAS_BLOCO) {
      if (forma === "esfera") continue;
      for (const variacao of VARIACOES_BLOCO) {
        const p = blocoDaVariacao(variacao, forma);
        expect(
          fatiaDeBaseEstavel(p, apoioDaForma(forma)),
          `${forma} · ${variacao.id}`
        ).toBeNull();
      }
    }
  });

  it("o apoio dessas formas já cobre o alvo (é por isso que passam)", () => {
    for (const forma of FORMAS_BLOCO) {
      if (forma === "esfera") continue;
      const p = grampearBloco({ forma, tamanhoMm: 100 });
      const plato = PRIMITIVOS_BLOCO[forma].apoio.raioPlatoMm!(p, 0);
      expect(plato, forma).toBeGreaterThanOrEqual(raioBaseEstavelMm(p));
    }
  });
});

describe("base estável — pirâmide de ponta-cabeça (composição com Espelhar)", () => {
  it("invertida no chão ganha o melhor pé que o orçamento de altura permite", () => {
    const invertida = grampearBloco({
      forma: "piramide",
      tamanhoMm: 100,
      invertido: true,
    });
    // Sem pé, ela equilibra no ápice: contato ~0.
    expect(apoioDaForma("piramide").raioPlatoMm!(invertida, 0)).toBeLessThan(
      BASE_ESTAVEL_MINIMO_MM
    );
    const fatia = fatiaDeBaseEstavel(invertida, apoioDaForma("piramide"));
    // O alvo cheio (25% da largura) exigiria cortar metade da peça — o
    // fallback corta no teto do orçamento e entrega um pé ≥ mínimo.
    expect(fatia).not.toBeNull();
    const estavel = grampearBloco({ ...invertida, fatia });
    const malha = gerarMalhaBloco(estavel);
    esperarEstanque(malha, "pirâmide invertida com pé");
    expect(raioDoPeMm(malha)).toBeGreaterThanOrEqual(
      0.95 * BASE_ESTAVEL_MINIMO_MM
    );
  });
});

describe("base estável — não atropela nem se repete", () => {
  it("corte do usuário vence: peça já fatiada passa intacta", () => {
    const comCorteProprio = grampearBloco({
      forma: "esfera",
      tamanhoMm: 100,
      fatia: { eixo: "x", posicaoMm: 0, lado: "menor" },
    });
    expect(
      fatiaDeBaseEstavel(comCorteProprio, apoioDaForma("esfera"))
    ).toBeNull();
  });

  it("é estável: aplicar a regra na peça já estável não corta de novo", () => {
    const estavel = comBaseEstavel(
      grampearBloco({ forma: "esfera", tamanhoMm: 100 })
    );
    expect(fatiaDeBaseEstavel(estavel, apoioDaForma("esfera"))).toBeNull();
  });

  it("o apoio A1 passa a oferecer o pé (nada flutua sobre ele)", () => {
    const estavel = comBaseEstavel(
      grampearBloco({ forma: "esfera", tamanhoMm: 100 })
    );
    const apoio = apoioDaForma("esfera");
    expect(apoio.raioApoioInferiorMm(estavel)).toBeGreaterThanOrEqual(
      0.95 * raioBaseEstavelMm(estavel)
    );
    // A base da peça cortada é plana em z = 0.
    expect(apoio.zSuperficieBaseMm(estavel, 0)).toBeCloseTo(0, 5);
  });

  it("forma sem seção declarada (ponto de luz) fica intocada", () => {
    const p = grampearBloco({ forma: "esfera", tamanhoMm: 100 });
    expect(fatiaDeBaseEstavel(p, apoioPontoDeLuz)).toBeNull();
  });
});
