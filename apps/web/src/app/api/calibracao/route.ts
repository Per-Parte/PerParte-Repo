import {
  ENCAIXES,
  gerarSTLBinario,
  malhaRevolucao,
  perfilPastilhaFemea,
  perfilPastilhaMacho,
  transladarMalha,
  unirMalhas,
} from "@per-parte/nucleo";

/**
 * Kit de calibração da folga F5: um STL com a pastilha macho e a pastilha
 * fêmea lado a lado, na folga pedida. Imprimir em várias folgas e escolher
 * a que der encaixe firme-mas-desmontável — esse número trava a regra F5.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const folgaMm = Math.min(
    0.6,
    Math.max(0.1, Number(url.searchParams.get("folgaMm")) || 0.3)
  );

  const anel = ENCAIXES.baseCorpo.anel;
  const macho = malhaRevolucao(perfilPastilhaMacho(anel), 128);
  const distancia = (anel.externoMm + 6) * 2 + 10;
  const femea = transladarMalha(
    malhaRevolucao(perfilPastilhaFemea(anel, folgaMm), 128),
    distancia,
    0
  );

  const stl = gerarSTLBinario(
    unirMalhas(macho, femea),
    `kit calibracao F5 folga ${folgaMm}mm`
  );

  const rotulo = folgaMm.toFixed(1).replace(".", ",");
  return new Response(new Blob([stl.buffer as ArrayBuffer]), {
    headers: {
      "Content-Type": "model/stl",
      "Content-Disposition": `attachment; filename="per-parte-calibracao-folga-${rotulo}mm.stl"`,
    },
  });
}
