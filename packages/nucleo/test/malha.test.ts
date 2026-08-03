/**
 * O invariante mais importante da produção: TODA malha que o núcleo gera é
 * um sólido estanque com normais para fora — para qualquer parte do
 * catálogo, qualquer faceta, textura, espinha e silhueta hostil.
 */

import { describe, expect, it } from "vitest";
import {
  BASES,
  CORPOS,
  DIFUSORES,
  ENCAIXES,
  FACETAS,
  malhaRevolucao,
  perfilBase,
  perfilCorpo,
  perfilDifusor,
  perfilPastilhaFemea,
  perfilPastilhaMacho,
  transladarMalha,
  unirMalhas,
} from "../src";
import { verificarEstanque, volumeAssinadoMm3 } from "./apoio";

function esperarSolida(m: ReturnType<typeof malhaRevolucao>, nome: string) {
  const r = verificarEstanque(m);
  expect(r.problema ?? "ok", nome).toBe("ok");
  expect(volumeAssinadoMm3(m), `${nome}: volume deve ser positivo`).toBeGreaterThan(0);
}

describe("malha de revolução — sólidos estanques", () => {
  it("todas as bases do catálogo, com e sem alargamento E2, com e sem macho", () => {
    for (const base of BASES) {
      for (const escala of [1, 1.3]) {
        for (const comMacho of [true, false]) {
          const m = malhaRevolucao(perfilBase(base, escala, comMacho), 40);
          esperarSolida(m, `base ${base.nome} escala ${escala} macho ${comMacho}`);
        }
      }
    }
  });

  it("todos os corpos do catálogo, com textura e espinha de cada preset", () => {
    for (const corpo of CORPOS) {
      const m = malhaRevolucao(
        perfilCorpo(corpo),
        96,
        {
          gomos: corpo.gomos,
          profundidadeMm: corpo.profundidadeGomosMm,
          torcaoGraus: corpo.torcaoGraus,
          alturaMm: corpo.alturaMm,
        },
        {
          deslocamentoMm: corpo.deslocamentoMm,
          posicaoDobra: corpo.posicaoDobra,
          alturaMm: corpo.alturaMm,
        }
      );
      esperarSolida(m, `corpo ${corpo.nome}`);
    }
  });

  it("todos os difusores do catálogo, liso e com plissê", () => {
    for (const difusor of DIFUSORES) {
      for (const segmentos of [40, 96]) {
        const m = malhaRevolucao(perfilDifusor(difusor), segmentos, {
          gomos: difusor.gomos,
          profundidadeMm: difusor.profundidadeGomosMm,
          torcaoGraus: 0,
          alturaMm: difusor.alturaMm,
        });
        esperarSolida(m, `difusor ${difusor.nome} seg ${segmentos}`);
      }
    }
  });

  it("acabamentos facetados (6 a 16 segmentos)", () => {
    for (const faceta of FACETAS) {
      const m = malhaRevolucao(perfilCorpo(CORPOS[1]), faceta.segmentos);
      esperarSolida(m, `faceta ${faceta.nome}`);
    }
  });

  it("silhueta livre hostil (zigue-zague no limite dos controles)", () => {
    const m = malhaRevolucao(
      perfilCorpo({
        ...CORPOS[0],
        alturaMm: 100,
        perfilLivre: [60, 16, 60, 16, 60],
      }),
      96,
      { gomos: 24, profundidadeMm: 4, torcaoGraus: 90, alturaMm: 100 }
    );
    esperarSolida(m, "silhueta hostil com textura máxima");
  });

  it("pastilhas do kit de calibração F5, nas três folgas", () => {
    for (const anel of [ENCAIXES.baseCorpo.anel, ENCAIXES.corpoDifusor.anel]) {
      esperarSolida(
        malhaRevolucao(perfilPastilhaMacho(anel), 64),
        "pastilha macho"
      );
      for (const folga of [0.2, 0.3, 0.4]) {
        esperarSolida(
          malhaRevolucao(perfilPastilhaFemea(anel, folga), 64),
          `pastilha fêmea folga ${folga}`
        );
      }
    }
  });

  it("transladar e unir malhas preserva o sólido e soma volumes", () => {
    const a = malhaRevolucao(perfilPastilhaMacho(ENCAIXES.baseCorpo.anel), 48);
    const b = transladarMalha(a, 120, 0, 0);
    const uniao = unirMalhas(a, b);
    const r = verificarEstanque(uniao);
    expect(r.problema ?? "ok").toBe("ok");
    // Precisão 0 (±0,5 mm³): a translação quantiza as coordenadas em float32.
    expect(volumeAssinadoMm3(uniao)).toBeCloseTo(2 * volumeAssinadoMm3(a), 0);
  });
});
