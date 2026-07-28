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

/** Luminária de vitrine da landing: Prato + Ondas + Globo, terracota. */
export default function LuminariaHero() {
  const dados = useMemo(() => {
    const base = BASES[1];
    const corpo = CORPOS[3];
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
    };
  }, []);

  return (
    <div className="h-[380px] w-full overflow-hidden rounded-3xl border border-[#DDD8CC] md:h-[460px]">
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
      />
    </div>
  );
}
