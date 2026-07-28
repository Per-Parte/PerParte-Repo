"use client";

import { useMemo } from "react";
import {
  BASES,
  CORPOS,
  DIFUSORES,
  PALETA,
  estabilidade,
  perfilBase,
  perfilCorpo,
  perfilDifusor,
} from "@per-parte/nucleo";
import Cena3D from "./Cena3D";

/** Luminária de vitrine da landing: Prato + Espiral + Globo, terracota. */
export default function LuminariaHero() {
  const dados = useMemo(() => {
    const base = BASES[1];
    const corpo = CORPOS.find((c) => c.nome === "Espiral") ?? CORPOS[0];
    const difusor = DIFUSORES[0];
    const est = estabilidade(base, corpo, difusor);
    return {
      perfis: {
        base: perfilBase(base, est.escala),
        corpo: perfilCorpo(corpo),
        difusor: perfilDifusor(difusor),
      },
      alturasMm: {
        base: base.alturaMm,
        corpo: corpo.alturaMm,
        difusor: difusor.alturaMm,
      },
      texturas: {
        corpo: {
          gomos: corpo.gomos,
          profundidadeMm: corpo.profundidadeGomosMm,
          torcaoGraus: corpo.torcaoGraus,
          alturaMm: corpo.alturaMm,
        },
      },
    };
  }, []);

  return (
    <div className="h-[380px] w-full overflow-hidden rounded-3xl border border-white/10 shadow-2xl shadow-black/40 md:h-[460px]">
      <Cena3D
        perfis={dados.perfis}
        alturasMm={dados.alturasMm}
        coresHex={{
          base: PALETA[2].hex,
          corpo: PALETA[2].hex,
          difusor: PALETA[1].hex,
        }}
        segmentos={40}
        luzAcesa
        texturas={dados.texturas}
      />
    </div>
  );
}
