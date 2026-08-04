/**
 * PLACA — disco de revolução deitado + pescoço com fêmea F5.
 * Garantias: sólidos estanques, disco de fato deitado e inclinado para
 * trás, fêmea idêntica à das outras partes, limites grampeados, F1.
 */

import { describe, expect, it } from "vitest";
import {
  ENCAIXES,
  grampearPlaca,
  LIMITES_PLACA,
  malhaPlaca,
  malhaRevolucao,
  perfilDisco,
  perfilPescoco,
  PLACA_PADRAO,
  REGRAS,
  rotacionarMalhaEmY,
  type Malha,
} from "../src";
import { verificarEstanque, volumeAssinadoMm3 } from "./apoio";

function extremos(m: Malha) {
  let xMin = Infinity, xMax = -Infinity, zMin = Infinity, zMax = -Infinity;
  for (let i = 0; i < m.posicoes.length; i += 3) {
    xMin = Math.min(xMin, m.posicoes[i]);
    xMax = Math.max(xMax, m.posicoes[i]);
    zMin = Math.min(zMin, m.posicoes[i + 2]);
    zMax = Math.max(zMax, m.posicoes[i + 2]);
  }
  return { xMin, xMax, zMin, zMax };
}

describe("PLACA — revolução deitada com adaptador", () => {
  it("disco e pescoço são sólidos estanques (separados e unidos)", () => {
    const disco = malhaRevolucao(perfilDisco(PLACA_PADRAO), 96);
    const rd = verificarEstanque(disco);
    expect(rd.ok, rd.problema ?? "").toBe(true);
    expect(volumeAssinadoMm3(disco)).toBeGreaterThan(0);

    const pescoco = malhaRevolucao(perfilPescoco(PLACA_PADRAO), 96);
    const rp = verificarEstanque(pescoco);
    expect(rp.ok, rp.problema ?? "").toBe(true);

    const tudo = malhaPlaca(PLACA_PADRAO, 96);
    const rt = verificarEstanque(tudo);
    expect(rt.ok, rt.problema ?? "").toBe(true);
  });

  it("rotação preserva o volume e deita o disco de verdade", () => {
    const disco = malhaRevolucao(perfilDisco(PLACA_PADRAO), 96);
    const vAntes = volumeAssinadoMm3(disco);
    const deitado = rotacionarMalhaEmY(disco, Math.PI / 2);
    expect(volumeAssinadoMm3(deitado)).toBeCloseTo(vAntes, 0);
    // Em pé: fino em z; deitado: fino em x, alto em z (Ø do disco).
    const a = extremos(disco);
    const d = extremos(deitado);
    expect(a.zMax - a.zMin).toBeLessThan(20);
    expect(d.zMax - d.zMin).toBeGreaterThan(PLACA_PADRAO.raioMm * 1.8);
    expect(d.xMax - d.xMin).toBeLessThan(20);
  });

  it("a placa montada sobe, inclina para trás (−X) e nunca fura a mesa", () => {
    const m = malhaPlaca(PLACA_PADRAO, 96);
    const e = extremos(m);
    expect(e.zMin).toBeGreaterThanOrEqual(-1e-4);
    expect(e.zMax).toBeGreaterThan(
      PLACA_PADRAO.pescocoMm + 1.8 * PLACA_PADRAO.raioMm
    );
    // Topo pende para trás: alcance em −X maior que em +X.
    expect(-e.xMin).toBeGreaterThan(e.xMax);
    // F1: deitado na impressão o limite é o Ø do disco (≤ 250 já no limite).
    expect(2 * LIMITES_PLACA.raioMm.max).toBeLessThanOrEqual(
      REGRAS.F.volumeMaximoParteMm.largura
    );
  });

  it("sem inclinação, o disco fica simétrico em X", () => {
    const m = malhaPlaca({ ...PLACA_PADRAO, inclinacaoGraus: 0 }, 96);
    const e = extremos(m);
    expect(Math.abs(e.xMax + e.xMin)).toBeLessThan(1);
  });

  it("a fêmea do pescoço é a mesma F5 das outras partes", () => {
    const perfil = perfilPescoco(PLACA_PADRAO);
    const anel = ENCAIXES.baseCorpo.anel;
    // Os primeiros pontos são a canaleta fêmea padrão (pontosFemea).
    expect(perfil[1].x).toBeCloseTo(
      anel.internoMm - ENCAIXES.folgaPadraoMm,
      6
    );
    expect(perfil[3].x).toBeCloseTo(
      anel.externoMm + ENCAIXES.folgaPadraoMm,
      6
    );
  });

  it("grampear devolve tudo para dentro dos limites", () => {
    const p = grampearPlaca({
      raioMm: 999,
      concavidadeMm: -5,
      inclinacaoGraus: 90,
      pescocoMm: 0,
    });
    expect(p.raioMm).toBe(LIMITES_PLACA.raioMm.max);
    expect(p.concavidadeMm).toBe(LIMITES_PLACA.concavidadeMm.min);
    expect(p.inclinacaoGraus).toBe(LIMITES_PLACA.inclinacaoGraus.max);
    expect(p.pescocoMm).toBe(LIMITES_PLACA.pescocoMm.min);
    expect(grampearPlaca(undefined)).toEqual(PLACA_PADRAO);
  });
});
