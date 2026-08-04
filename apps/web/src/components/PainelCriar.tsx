"use client";

import { useState } from "react";
import {
  amostrarRaiosCorpo,
  deslocamentoMaximoMm,
  DIFUSORES,
  FACETAS,
  FAMILIAS_TEXTURA,
  LIMITES_CRIAR,
  LIMITES_VAZADO,
  NOMES_FAMILIAS,
  PADROES_VAZADO,
  REGRAS,
  type CurvaBase,
  type FamiliaTextura,
  type ResultadoEstabilidade,
} from "@per-parte/nucleo";
import { Chips, PontosDeLuzCtl, Secao, SliderCtl } from "./controles";
import EditorSilhueta from "./EditorSilhueta";
import type { EstadoCriar } from "./Configurador";

const cm = (mm: number) => (mm / 10).toFixed(1).replace(".", ",");
const fmtPos = (v: number) => (v < -0.15 ? "baixo" : v > 0.15 ? "alto" : "centro");

const CURVAS: { valor: CurvaBase; nome: string }[] = [
  { valor: "reta", nome: "Reta" },
  { valor: "cone", nome: "Cone" },
  { valor: "concava", nome: "Côncava" },
  { valor: "degrau", nome: "Degrau" },
];

interface Props {
  criar: EstadoCriar;
  aoMudar: (c: EstadoCriar) => void;
  remixDe: string;
  iFaceta: number;
  setIFaceta: (i: number) => void;
  estab: ResultadoEstabilidade;
  pontosDeLuz: number;
  separacaoMm: number;
  setPontosDeLuz: (n: 1 | 2) => void;
  setSeparacaoMm: (v: number) => void;
  /** Quando presente, renderiza só a seção pedida (modo órbita). */
  apenasSecao?: string;
}

export default function PainelCriar({
  criar,
  aoMudar,
  remixDe,
  iFaceta,
  setIFaceta,
  estab,
  pontosDeLuz,
  separacaoMm,
  setPontosDeLuz,
  setSeparacaoMm,
  apenasSecao,
}: Props) {
  const vis = (id: string) => !apenasSecao || apenasSecao === id;
  const [nomePeca, setNomePeca] = useState("");
  const [publicada, setPublicada] = useState<string | null>(null);

  const LB = LIMITES_CRIAR.base;
  const LC = LIMITES_CRIAR.corpo;
  const LD = LIMITES_CRIAR.difusor;

  const mudarBase = (campo: "alturaMm" | "raioMm", v: number) =>
    aoMudar({ ...criar, base: { ...criar.base, [campo]: v } });
  const mudarCorpo = (
    campo: Exclude<keyof EstadoCriar["corpo"], never>,
    v: number
  ) => aoMudar({ ...criar, corpo: { ...criar.corpo, [campo]: v } });
  const mudarDifusor = (
    campo: "alturaMm" | "raioMm" | "gomos" | "profundidadeGomosMm",
    v: number
  ) => aoMudar({ ...criar, difusor: { ...criar.difusor, [campo]: v } });

  const iForma = DIFUSORES.findIndex((d) => d.forma === criar.difusor.forma);
  const facetadoComGomos =
    iFaceta > 0 &&
    (criar.corpo.gomos > 0 ||
      !!criar.corpo.familiaTextura ||
      criar.difusor.gomos > 0);
  const modoLivre = !!criar.corpo.perfilLivre;
  const dMax = deslocamentoMaximoMm(criar.corpo.alturaMm);

  return (
    <div>
      {!apenasSecao && (
      <div className="mx-5 mt-3 rounded-xl border border-dashed border-white/15 bg-white/[0.03] px-3.5 py-2.5 text-[11.5px] text-[#A69D8D]">
        Você está remixando{" "}
        <b className="text-[#F2EDE4]">{remixDe}</b>. Os encaixes ficam travados
        — o miolo é todo seu.
      </div>
      )}

      {vis("base") && (
      <Secao titulo="Base">
        <Chips
          nomes={CURVAS.map((c) => c.nome)}
          selecionado={Math.max(
            0,
            CURVAS.findIndex((c) => c.valor === criar.base.curva)
          )}
          aoEscolher={(i) =>
            aoMudar({ ...criar, base: { ...criar.base, curva: CURVAS[i].valor } })
          }
        />
        <div className="mt-3">
          <SliderCtl
            rotulo="Altura da base"
            valorFmt={`${cm(criar.base.alturaMm)} cm`}
            valor={criar.base.alturaMm}
            min={LB.alturaMm.min}
            max={LB.alturaMm.max}
            passo={LB.alturaMm.passo}
            aoMudar={(v) => mudarBase("alturaMm", v)}
          />
          <SliderCtl
            rotulo="Largura da base"
            valorFmt={`Ø ${Math.round(criar.base.raioMm / 5)} cm`}
            valor={criar.base.raioMm}
            min={LB.raioMm.min}
            max={LB.raioMm.max}
            passo={LB.raioMm.passo}
            aoMudar={(v) => mudarBase("raioMm", v)}
            nota="se a criação ficar pesada no topo, a base alarga sozinha (E2)"
            motivoMax="Mais larga não cabe no prato da impressora."
            motivoMin="Menor que isso a base não segura o conjunto em pé — e o encaixe precisa caber nela."
          />
        </div>
      </Secao>
      )}

      {vis("corpo") && (
      <Secao titulo="Corpo">
        <SliderCtl
          rotulo="Altura"
          valorFmt={`${cm(criar.corpo.alturaMm)} cm`}
          valor={criar.corpo.alturaMm}
          min={LC.alturaMm.min}
          max={LC.alturaMm.max}
          passo={LC.alturaMm.passo}
          aoMudar={(v) => mudarCorpo("alturaMm", v)}
          nota={`regra: ${LC.alturaMm.min / 10}–${LC.alturaMm.max / 10} cm — acima disso a peça não cabe na impressora`}
          motivoMax={`A impressora vai até ${LC.alturaMm.max / 10} cm por peça. Quer mais alta? No modo Montar, some hastes na seção Empilhar — é assim que a luminária passa de meio metro.`}
        />
        {!modoLivre && (
        <>
        <SliderCtl
          rotulo="Volume do bojo"
          valorFmt={`${criar.corpo.volumeBojoMm >= 0 ? "+" : ""}${cm(criar.corpo.volumeBojoMm)} cm`}
          valor={criar.corpo.volumeBojoMm}
          min={LC.volumeBojoMm.min}
          max={LC.volumeBojoMm.max}
          passo={LC.volumeBojoMm.passo}
          aoMudar={(v) => mudarCorpo("volumeBojoMm", v)}
          nota="regra: parede mínima e distância do miolo elétrico preservadas"
          motivoMax="Mais volume inclinaria a parede além do que imprime sem suporte — e suporte estraga o acabamento."
          motivoMin="Afinar mais encostaria no miolo elétrico, que precisa de folga livre por segurança."
        />
        <SliderCtl
          rotulo="Posição do bojo"
          valorFmt={fmtPos(criar.corpo.posicaoBojo)}
          valor={criar.corpo.posicaoBojo}
          min={LC.posicaoBojo.min}
          max={LC.posicaoBojo.max}
          passo={LC.posicaoBojo.passo}
          aoMudar={(v) => mudarCorpo("posicaoBojo", v)}
        />
        <SliderCtl
          rotulo="Ondulação"
          valorFmt={`${criar.corpo.ondulacao} ondas`}
          valor={criar.corpo.ondulacao}
          min={LC.ondulacao.min}
          max={LC.ondulacao.max}
          passo={LC.ondulacao.passo}
          aoMudar={(v) => mudarCorpo("ondulacao", v)}
        />
        <SliderCtl
          rotulo="Profundidade da onda"
          valorFmt={`${criar.corpo.amplitudeOndaMm.toFixed(1).replace(".", ",")} mm`}
          valor={criar.corpo.amplitudeOndaMm}
          min={LC.amplitudeOndaMm.min}
          max={LC.amplitudeOndaMm.max}
          passo={LC.amplitudeOndaMm.passo}
          aoMudar={(v) => mudarCorpo("amplitudeOndaMm", v)}
          nota={`regra: até ${LC.amplitudeOndaMm.max} mm — mais que isso vira balanço > ${REGRAS.F.balancoMaximoGraus}° e não imprime limpo`}
          motivoMax={`Onda mais profunda inclinaria a parede além de ${REGRAS.F.balancoMaximoGraus}° e a peça pediria suporte, que estraga o acabamento.`}
        />
        </>
        )}
      </Secao>
      )}

      {vis("silhueta") && (
      <Secao titulo="Silhueta livre (modo hard)">
        {!modoLivre ? (
          <button
            onClick={() =>
              aoMudar({
                ...criar,
                corpo: {
                  ...criar.corpo,
                  perfilLivre: amostrarRaiosCorpo(criar.corpo),
                },
              })
            }
            className="w-full rounded-full border border-[#D3AC6C]/50 bg-[#D3AC6C]/10 py-2.5 text-[12.5px] font-semibold text-[#D3AC6C] transition-colors hover:bg-[#D3AC6C]/20"
          >
            Esculpir a silhueta — arrastar as arestas
          </button>
        ) : (
          <div>
            <EditorSilhueta
              corpo={criar.corpo}
              aoMudar={(raios) =>
                aoMudar({
                  ...criar,
                  corpo: { ...criar.corpo, perfilLivre: raios },
                })
              }
            />
            <button
              onClick={() =>
                aoMudar({
                  ...criar,
                  corpo: { ...criar.corpo, perfilLivre: undefined },
                })
              }
              className="mt-2 w-full rounded-full border border-white/10 bg-white/[0.03] py-2 text-[12px] text-[#A69D8D] transition-colors hover:border-white/25 hover:text-[#E7E0D2]"
            >
              voltar aos controles simples
            </button>
          </div>
        )}
      </Secao>
      )}

      {vis("curva") && (
      <Secao titulo="Curvar o corpo (S)">
        <SliderCtl
          rotulo="Deslocamento do topo"
          valorFmt={`${criar.corpo.deslocamentoMm >= 0 ? "+" : ""}${cm(criar.corpo.deslocamentoMm)} cm`}
          valor={criar.corpo.deslocamentoMm}
          min={-dMax}
          max={dMax}
          passo={LC.deslocamentoMm.passo}
          aoMudar={(v) => mudarCorpo("deslocamentoMm", v)}
          nota={`o difusor vai junto para o lado; limite de ±${cm(dMax)} cm vem de F4 e cresce com a altura`}
          motivoMax="Mais inclinado que isso, a espinha pediria suporte. O limite cresce com a altura — um corpo mais alto pode se deslocar mais."
          motivoMin="Mais inclinado que isso, a espinha pediria suporte. O limite cresce com a altura — um corpo mais alto pode se deslocar mais."
        />
        <SliderCtl
          rotulo="Altura da dobra"
          valorFmt={fmtPos(criar.corpo.posicaoDobra)}
          valor={criar.corpo.posicaoDobra}
          min={LC.posicaoDobra.min}
          max={LC.posicaoDobra.max}
          passo={LC.posicaoDobra.passo}
          aoMudar={(v) => mudarCorpo("posicaoDobra", v)}
        />
      </Secao>
      )}

      {vis("textura") && (
      <Secao titulo="Textura do corpo">
        <Chips
          nomes={NOMES_FAMILIAS.map((f) => FAMILIAS_TEXTURA[f].nome)}
          selecionado={Math.max(
            0,
            NOMES_FAMILIAS.indexOf(criar.corpo.familiaTextura ?? "gomos")
          )}
          aoEscolher={(i) => {
            const f: FamiliaTextura = NOMES_FAMILIAS[i];
            aoMudar({
              ...criar,
              corpo: {
                ...criar.corpo,
                familiaTextura: f === "gomos" ? undefined : f,
                repeticaoTextura:
                  f === "gomos" ? undefined : (criar.corpo.repeticaoTextura ?? 12),
                // Ao entrar numa família, a textura já aparece.
                gomos:
                  f === "gomos" && criar.corpo.gomos === 0
                    ? 12
                    : criar.corpo.gomos,
                profundidadeGomosMm:
                  criar.corpo.profundidadeGomosMm === 0
                    ? 2
                    : criar.corpo.profundidadeGomosMm,
              },
            });
          }}
        />
        <div className="mt-3" />
        {!criar.corpo.familiaTextura ? (
          <SliderCtl
            rotulo="Gomos"
            valorFmt={criar.corpo.gomos === 0 ? "liso" : `${criar.corpo.gomos} gomos`}
            valor={criar.corpo.gomos}
            min={LC.gomos.min}
            max={LC.gomos.max}
            passo={LC.gomos.passo}
            aoMudar={(v) => mudarCorpo("gomos", v)}
          />
        ) : (
          <SliderCtl
            rotulo="Repetição"
            valorFmt={`${criar.corpo.repeticaoTextura ?? 12}×`}
            valor={criar.corpo.repeticaoTextura ?? 12}
            min={LC.repeticaoTextura.min}
            max={LC.repeticaoTextura.max}
            passo={LC.repeticaoTextura.passo}
            aoMudar={(v) => mudarCorpo("repeticaoTextura", v)}
            motivoMax="Mais fino que isso a impressora não desenha limpo — o traço dela tem largura fixa. E repetir mais também inclinaria a parede."
          />
        )}
        <SliderCtl
          rotulo="Profundidade"
          valorFmt={`${criar.corpo.profundidadeGomosMm.toFixed(1).replace(".", ",")} mm`}
          valor={criar.corpo.profundidadeGomosMm}
          min={LC.profundidadeGomosMm.min}
          max={LC.profundidadeGomosMm.max}
          passo={LC.profundidadeGomosMm.passo}
          aoMudar={(v) => mudarCorpo("profundidadeGomosMm", v)}
          nota={
            criar.corpo.familiaTextura
              ? "a textura só esculpe para dentro; se ela variar com a altura, paga o próprio balanço e o perfil aplaina sozinho (F4)"
              : "gomos esculpem para dentro — sulcos verticais imprimem limpos"
          }
          motivoMax="Mais fundo furaria a parede — o vale da textura precisa deixar material — ou pediria suporte."
        />
        <SliderCtl
          rotulo="Torção"
          valorFmt={`${criar.corpo.torcaoGraus}°`}
          valor={criar.corpo.torcaoGraus}
          min={LC.torcaoGraus.min}
          max={LC.torcaoGraus.max}
          passo={LC.torcaoGraus.passo}
          aoMudar={(v) => mudarCorpo("torcaoGraus", v)}
          nota="gira a textura em espiral da base ao topo"
        />
        <div className="mb-2 mt-1 text-[13px] text-[#E7E0D2]">Acabamento</div>
        <Chips
          nomes={FACETAS.map((f) => f.nome)}
          selecionado={iFaceta}
          aoEscolher={setIFaceta}
        />
        {facetadoComGomos && (
          <div className="mt-2 text-[10px] text-[#E08A4A]">
            acabamento facetado desliga a textura — escolha Liso para vê-la
          </div>
        )}
      </Secao>
      )}

      {vis("difusor") && (
      <Secao titulo="Difusor">
        <Chips
          nomes={DIFUSORES.map((d) => d.nome)}
          selecionado={iForma}
          aoEscolher={(i) => aoMudar({ ...criar, difusor: { ...DIFUSORES[i] } })}
        />
        <div className="mt-3">
          <SliderCtl
            rotulo="Altura do difusor"
            valorFmt={`${cm(criar.difusor.alturaMm)} cm`}
            valor={criar.difusor.alturaMm}
            min={LD.alturaMm.min}
            max={LD.alturaMm.max}
            passo={LD.alturaMm.passo}
            aoMudar={(v) => mudarDifusor("alturaMm", v)}
          />
          <SliderCtl
            rotulo="Abertura / largura"
            valorFmt={`Ø ${Math.round(criar.difusor.raioMm / 5)} cm`}
            valor={criar.difusor.raioMm}
            min={LD.raioMm.min}
            max={LD.raioMm.max}
            passo={LD.raioMm.passo}
            aoMudar={(v) => mudarDifusor("raioMm", v)}
            motivoMax="Mais aberto não cabe no prato da impressora."
            motivoMin="Mais fechado que isso, o difusor encostaria na lâmpada — ela precisa de folga livre por segurança."
          />
          <SliderCtl
            rotulo="Plissê (gomos)"
            valorFmt={criar.difusor.gomos === 0 ? "liso" : `${criar.difusor.gomos} gomos`}
            valor={criar.difusor.gomos}
            min={LD.gomos.min}
            max={LD.gomos.max}
            passo={LD.gomos.passo}
            aoMudar={(v) => mudarDifusor("gomos", v)}
          />
          <SliderCtl
            rotulo="Profundidade do plissê"
            valorFmt={`${criar.difusor.profundidadeGomosMm.toFixed(1).replace(".", ",")} mm`}
            valor={criar.difusor.profundidadeGomosMm}
            min={LD.profundidadeGomosMm.min}
            max={LD.profundidadeGomosMm.max}
            passo={LD.profundidadeGomosMm.passo}
            aoMudar={(v) => mudarDifusor("profundidadeGomosMm", v)}
            nota="com a luz acesa, o plissê vira desenho de sombra na parede"
          />
        </div>
        <div className="mb-2 mt-1 text-[13px] text-[#E7E0D2]">Vazado</div>
        <Chips
          nomes={["Nenhum", ...PADROES_VAZADO.map((p) => p.nome)]}
          selecionado={
            criar.difusor.vazado
              ? 1 +
                PADROES_VAZADO.findIndex(
                  (p) => p.id === criar.difusor.vazado?.padrao
                )
              : 0
          }
          aoEscolher={(i) =>
            aoMudar({
              ...criar,
              difusor: {
                ...criar.difusor,
                vazado:
                  i === 0
                    ? undefined
                    : {
                        padrao: PADROES_VAZADO[i - 1].id,
                        densidade: criar.difusor.vazado?.densidade ?? 0.45,
                        gradiente: criar.difusor.vazado?.gradiente ?? 0,
                      },
              },
            })
          }
        />
        {criar.difusor.vazado && (
          <div className="mt-3">
            <SliderCtl
              rotulo="Vazios"
              valorFmt={`${Math.round(criar.difusor.vazado.densidade * 100)}%`}
              valor={criar.difusor.vazado.densidade}
              min={LIMITES_VAZADO.densidade.min}
              max={LIMITES_VAZADO.densidade.max}
              passo={LIMITES_VAZADO.densidade.passo}
              aoMudar={(v) =>
                aoMudar({
                  ...criar,
                  difusor: {
                    ...criar.difusor,
                    vazado: { ...criar.difusor.vazado!, densidade: v },
                  },
                })
              }
              motivoMax="Mais aberto que isso a peça perde estrutura — e a lâmpada ficaria exposta demais."
            />
            <SliderCtl
              rotulo="Distribuição"
              valorFmt={
                Math.abs(criar.difusor.vazado.gradiente) < 0.06
                  ? "igual em toda a altura"
                  : criar.difusor.vazado.gradiente > 0
                    ? "mais aberto em cima"
                    : "mais aberto embaixo"
              }
              valor={criar.difusor.vazado.gradiente}
              min={LIMITES_VAZADO.gradiente.min}
              max={LIMITES_VAZADO.gradiente.max}
              passo={LIMITES_VAZADO.gradiente.passo}
              aoMudar={(v) =>
                aoMudar({
                  ...criar,
                  difusor: {
                    ...criar.difusor,
                    vazado: { ...criar.difusor.vazado!, gradiente: v },
                  },
                })
              }
            />
            <div className="mt-1 rounded-lg border border-[#D3AC6C]/25 bg-[#D3AC6C]/[0.06] px-2.5 py-1.5 text-[10px] leading-relaxed text-[#CFC7B8]">
              O vazado é o que desenha a sombra na parede — acenda a luz para
              ver. <b className="text-[#D3AC6C]">Produção em preparação ⚑</b>:
              o STL deste difusor fica travado enquanto o vazado estiver
              ligado.
            </div>
          </div>
        )}
      </Secao>
      )}

      {vis("luzes") && (
      <Secao titulo="Pontos de luz">
        <PontosDeLuzCtl
          pontosDeLuz={pontosDeLuz}
          separacaoMm={separacaoMm}
          sepMin={LIMITES_CRIAR.luminaria.separacaoMm.min}
          sepMax={LIMITES_CRIAR.luminaria.separacaoMm.max}
          sepPasso={LIMITES_CRIAR.luminaria.separacaoMm.passo}
          aoMudarPontos={setPontosDeLuz}
          aoMudarSep={setSeparacaoMm}
        />
      </Secao>
      )}

      {vis("regras") && (
      <Secao titulo="Regras embutidas">
        <div
          className={`rounded-2xl border px-4 py-3 ${
            estab.tombando
              ? "border-[#E06A55]/40 bg-[#E06A55]/[0.08]"
              : "border-white/[0.08] bg-white/[0.03]"
          }`}
        >
          <div className="flex justify-between py-1 text-xs text-[#A69D8D]">
            <span>
              Parede mínima ({String(REGRAS.F.paredeDifusorMm.min).replace(".", ",")}–
              {String(REGRAS.F.paredeEstruturalMm.max).replace(".", ",")} mm)
            </span>
            <span className="font-semibold text-[#8FB07E]">✓</span>
          </div>
          <div className="flex justify-between py-1 text-xs text-[#A69D8D]">
            <span>Balanço ≤ {REGRAS.F.balancoMaximoGraus}°</span>
            <span className="font-semibold text-[#8FB07E]">✓</span>
          </div>
          <div className="flex justify-between py-1 text-xs text-[#A69D8D]">
            <span>Distância do miolo elétrico</span>
            <span className="font-semibold text-[#8FB07E]">✓</span>
          </div>
          <div className="flex justify-between py-1 text-xs text-[#A69D8D]">
            <span>Estabilidade</span>
            <span
              className={`font-semibold ${
                estab.tombando
                  ? "text-[#E06A55]"
                  : estab.pertoDoLimite
                    ? "text-[#E08A4A]"
                    : "text-[#8FB07E]"
              }`}
            >
              {estab.tombando
                ? `⚠ tombando para a ${estab.ladoTombando}`
                : estab.ajustada
                  ? "base ajustada ✓"
                  : "✓"}
            </span>
          </div>
          <div
            className={`mt-2 text-[10.5px] ${
              estab.tombando ? "text-[#E06A55]" : "text-[#7d766a]"
            }`}
          >
            {estab.tombando
              ? "Do jeito atual ela cai — nem alargando a base ao máximo o peso fica sobre ela. Reduza o deslocamento do topo ou alargue a base."
              : estab.ajustada
                ? "A base foi alargada automaticamente para o conjunto não tombar — a regra é a ferramenta."
                : "Tudo que estes controles permitem criar, a Per Parte fabrica."}
          </div>
        </div>
      </Secao>
      )}

      {vis("publicar") && (
      <Secao titulo="Publicar no catálogo">
        <div>
          <input
            type="text"
            value={nomePeca}
            onChange={(e) => setNomePeca(e.target.value)}
            placeholder="dê um nome à sua peça (ex.: Duna)"
            className="mb-2 w-full rounded-full border border-white/10 bg-white/[0.05] px-4 py-2.5 text-[13px] text-[#F2EDE4] placeholder-[#7d766a] outline-none transition-colors focus:border-[#D3AC6C]/60"
          />
          <button
            onClick={() => setPublicada(nomePeca.trim() || "Sem nome")}
            className="w-full rounded-full bg-[#F2EDE4] py-2.5 text-[13px] font-semibold text-[#161412] transition-colors hover:bg-white"
          >
            Publicar minha parte
          </button>
          {publicada && (
            <div className="mt-2.5 rounded-2xl border border-[#D3AC6C]/30 bg-[#D3AC6C]/[0.08] px-3.5 py-2.5 text-xs leading-relaxed text-[#CFC7B8]">
              <b className="text-[#D3AC6C]">“{publicada}”</b> entrou na fila de
              curadoria. Quando aprovada, sua parte fica disponível para
              qualquer pessoa usar nas montagens dela — e você recebe{" "}
              <b className="text-[#F2EDE4]">royalty por parte</b> a cada
              luminária vendida que usar uma criação sua.
            </div>
          )}
        </div>
      </Secao>
      )}
    </div>
  );
}
