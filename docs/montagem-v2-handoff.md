# Montagem v2 — estado da execução (handoff)

> Registro vivo da frente Montagem v2 (espec: `docs/montagem-v2-prompt.md`;
> pedidos de 06/08 no cofre: "Montagem v2 — ajustes do Davi").
> Atualizado em **06/08/2026**. Já mesclada na `main` e no ar em `/criar`.

## 📌 O plano de alterações agora é um documento VIVO no cofre

Os próximos pedidos do Davi e do Caio entram em **"Configurador — plano de alterações (vivo)"** (cofre Obsidian), com quadro de status, decisões e as perguntas que travam cada item. **Leia esse documento antes de mexer no configurador** — ele diz o que fazer, o que já foi feito e o que NÃO decidir sozinho. Este handoff continua sendo o registro técnico versionado.

## Rodada de 07/08 — itens 2, 3a, 4, 5 e 6 do plano de alterações

O plano vivo do cofre ("Configurador — plano de alterações (vivo)") guiou esta rodada; o item 3b (ponto de luz que penetra) segue TRAVADO nas 5 perguntas de produção de lá.

- **Borda em PAR** (`bordaTopo` + `bordaFundo` — o campo `borda` foi renomeado enquanto a persistência não existe): a regra F4 INVERTE entre as extremidades — oca sempre paga; sólida é livre a 90° quando converge subindo (topo pra dentro; fundo pra fora = pé de cálice) e paga F4 quando diverge. `anguloBordaRad(posicao, sentido, oca)` é a fonte única.
- **Espelhar** (`espelhar.ts`): inversão vertical como pós-processo (primitivo → espelhar → fatiar, composto no barrel); apoio espelhado troca topo↔fundo. A pirâmide de ponta-cabeça expôs um caso da base estável: quando o alvo cheio não cabe no orçamento de altura, a regra agora corta o MELHOR pé que o orçamento permite (≥ mínimo absoluto).
- **Ponto de luz 2×2×4 cm** com ombro cônico a 45° entre coluna e bulbo ⚑ (proposta de engenharia; alternativas eram afinar o bulbo ou aceitar suporte). O anel de pouso da base antiga deixou de existir (bulbo mais largo que a coluna) — apoio atualizado.
- **Estúdio fotográfico** no `/criar`: ciclorama + pool de luz + sombras VSM macias + reflexo + 5 fundos ⚑. Armadilhas registradas: a fronteira da shadow-camera desenhava uma linha diagonal no chão (frustum alargado); a costura chão×pano some quando a névoa termina no MESMO valor da borda do gradiente; o vazio além do pano precisa do background na cor da névoa.
- **Câmera sem controle**: enquadramento automático amortecido (decisão registrada no plano: enquadramento, não distância cravada).

## Base estável no chão (item 1 do plano, 06/08)

`src/blocos/base-estavel.ts` — "a primeira forma tem de ter área de contato que a sustente". Implementado como **regra geral, não como caso especial da esfera**: a peça mede a própria área de contato (`raioPlatoMm`, o raio inscrito da seção, que já existia por causa da Fatiar) e, se ela não sustenta, a regra devolve a fatia que dá o pé — mecanismo nenhum foi inventado. Alvo: raio ≥ 25% da largura ⚑ (numa esfera de 100 mm, pé chato de Ø 50 — a primeira camada da impressão adere de verdade). Cubo, cilindro e pirâmide em pé passam intactos porque a conta reconhece que já têm base cheia.

Por que geral importa: quando entrarem a **borda de fundo** (item 2) e o **espelhar** (item 6), a peça que perder o pé cai nesta mesma regra sozinha — a pirâmide de ponta-cabeça vai nascer com base sem uma linha nova. A cena decide QUANDO aplicar (na entrada, quando a peça pousa no chão; nunca durante um arrasto), e o corte aparece no painel da Fatiar como qualquer outro: o usuário pode removê-lo.

## Ferramentas novas (pedido do Davi, 06/08 — depois de ver a `/criar` no ar)

Quatro capacidades, todas com teste e todas no ar em `/criar`:

1. **Borda encurvada** (`src/blocos/borda.ts` + os três primitivos de lado reto): a faixa de cima da silhueta vira um arco que abre para fora (aba de abajur) ou fecha para dentro (lábio); o slider é o raio do arco. **O ângulo que o arco varre sai de F4**, e depende de ser oca: para fora sempre paga F4 (a superfície diverge); para dentro e sólida vai até 90° (cúpula convergente — cada camada assenta na de baixo); para dentro e oca volta a pagar F4 (o material passa a pairar sobre a cavidade). A esfera não tem borda (é curva inteira — o grampeador zera). Na pirâmide com borda para fora o ápice vira um platô, e o apoio passa a reconhecê-lo.
2. **Fatiar** (`src/blocos/fatiar.ts`): corte plano em x, y ou z, com o lado que fica escolhido. Recorte Sutherland–Hodgman com vértices de interseção cacheados por aresta (estanqueidade por índice preservada), fronteira achada por **topologia** (aresta sem par oposto), tampa por polígono-com-buracos (classificação por área assinada + aresta-ponte + ear clipping) e reassentamento da base em z = 0. Composto no barrel: `gerarMalhaBloco` e `apoioDaForma` já entregam a peça cortada e o apoio que conta a verdade sobre ela. Prova mais forte do teste: `volume(lado menor) + volume(lado maior) = volume da peça inteira` nos 576 cortes da varredura (erro relativo ≤ 6,5e-9) — tampa que sobra, falta ou dobra aparece aí.
3. **Manivela de giro** (`components/montagem/ManivelaCena.tsx`): a órbita livre saiu (`enableRotate={false}`); quem gira a obra é um ícone 3D de luminária no canto superior direito, que gira junto e funciona como mostrador. A câmera só aproxima/afasta. Os deltas de arrasto voltam ao referencial local antes de virar mm — senão empurrar para a direita moveria a peça de través.
4. **Balde de tinta**: ferramenta própria; com ela na mão o painel mostra a paleta e tocar numa forma pinta com a cor escolhida.

**Detalhe de render que veio junto:** o preview usa `toCreasedNormals` (aresta viva acima de 30°). Sem isso a normal média de vértice espalhava o sombreado da tampa do corte pela parede e a peça aparecia listrada. Só o preview — o STL sai da malha indexada do núcleo, intacta.

## Onde estamos: F1 REVISADA ✅ · F2/F3 v0 no ar ✅ · F4/F5 a fazer

A F1 (núcleo blocos) está completa em `packages/nucleo/src/blocos/`, passou por **revisão adversarial** (4 lentes independentes com testes-sonda, 23 achados — todos corrigidos ou documentados abaixo) e tem **292 testes verdes** (131 pré-existentes intactos + 161 do módulo blocos). Nenhum arquivo existente do núcleo foi modificado além do export do barrel em `src/index.ts` (regra "o núcleo cresce, não muda").

| Peça | Arquivo | Testes | Estado |
| --- | --- | --- | --- |
| Tipos e contratos (`raiosNotaveisMm`, `raioPlatoMm`, borda, fatia) | `src/blocos/tipos.ts` | — | ✅ |
| Clamps derivados de F1/F2/F4 (medem a casca interna) | `src/blocos/limites.ts` | via variações | ✅ |
| Catálogo das 8 variações | `src/blocos/variacoes.ts` | 66 | ✅ |
| Tangência A1 (varredura + ímã multi-bloco) | `src/blocos/tangencia.ts` | 21 | ✅ |
| Borda encurvada (arco derivado de F4) | `src/blocos/borda.ts` | via primitivos | ✅ |
| Fatiar (corte plano + tampa + apoio) | `src/blocos/fatiar.ts` | 14 | ✅ |
| Ponto de luz (base 5×5, bulbo 4 cm, clamp 1–2/obra) | `src/blocos/ponto-de-luz.ts` | 8 | ✅ |
| Cilindro (oca de borda ABERTA) | `src/blocos/cilindro.ts` | 14 | ✅ |
| Pirâmide (oca fechada, cavidade paralela) | `src/blocos/piramide.ts` | 14 | ✅ |
| Esfera (oca com respiro polar por ângulo) | `src/blocos/esfera.ts` | 11 | ✅ |
| Cubo (oca de borda ABERTA) | `src/blocos/cubo.ts` | 13 | ✅ |

## ⚠️ Para validar com Davi + Caio (divergências da espec §4)

A espec define a variação **"oca (borda aberta em cima)"**. Estado por forma:

- **Cilindro e cubo**: borda ABERTA, como a espec pede (e isso eliminou 2 achados ALTA de placas-ponte não-imprimíveis que o teto fechado criava).
- **Pirâmide**: FECHADA (cavidade interna paralela) — abrir a borda truncaria o ápice e a pirâmide deixaria de ser pirâmide. O grampeador alonga a peça até o teto da cavidade respeitar F4.
- **Esfera**: RESPIRO polar (abertura circular no topo, ~69,5° de inclinação real na borda ⚑) — abre parcialmente; uma esfera de borda totalmente aberta viraria uma tigela.

Se os sócios quiserem outra leitura para pirâmide/esfera, a topologia do túnel de borda já existe nos 4 arquivos.

## Decisões de geometria da F1 (resumo)

- **Escala de largura é UMA** (X = Y): esfera e cilindro continuam sólidos de revolução; seção oval futura usa a `proporcao` da máquina r(θ) do núcleo.
- **Receita única do furo** nos 4 primitivos: bloco de células reservado na grade, polígono em espaço de parâmetro (○ 16, □ 8, △ 6 com vértice para cima — F4 de graça), costura em zíper, túnel de parede. Estanqueidade por índice.
- **Furos só fora das regiões de apoio**: laterais (cubo/pirâmide/cilindro), banda equatorial da esfera — banda EFETIVA derivada de F4 (`bandaFuroEsferaRad`): aperta com o achatamento para o teto do furo nunca deitar além de 45°.
- **Clamps medem a casca interna** (`furoMaximoMm` com W − 2t): o furo prometido pelo slider é o furo entregue pela malha.
- **Tangência por varredura radial** (passo 1 mm + raios notáveis dos apoios), sem solver. `contatoIma`: topo alcançável → mesa com empurrão para fora de TODOS os envelopes (tangência dupla exata no caso entre-dois-blocos). Apoios dizem a verdade: topo truncado da esfera oca, cápsula do bulbo do ponto de luz, piso interno de cavidades abertas.
- **Plantas quadradas na tangência**: aproximação radial (pouso pelo disco inscrito, envelope pelo circunscrito) — contatos diagonais exatos ficam para a F2 se o uso pedir.

## ⚑ Pendências para validar impresso (kit de validação dos ⚑)

- `RESPIRO_ANGULO_GRAUS = 69,5` (inclusive numa oca achatada), `MOLDURA_FURO_MM = 2`, `TIRA_BANDA_MM = 1`, `FURO_PONTE_MAX_MM = 20` (□ tem teto reto = ponte pura).
- Heurística `furoMaximoMm` da pirâmide mede a face externa; o polígono encolhe para caber na casca interna (clamp geométrico) — se apertar demais no impresso, endurecer em `limites.ts`.
- Mapeamento meridional linearizado da esfera (`v = c·φ`): furo levemente distorcido em esferoides extremos (só visual).

## Rodar os testes

`npm test` na raiz. São ~300 testes e levam ~1,5 min: não são testes de unidade rápidos, são **varreduras de geometria** (as 32 combinações forma × variação, os 576 cortes da Fatiar, as matrizes de borda), cada uma verificando estanqueidade aresta por aresta. `packages/nucleo/vitest.config.ts` sobe o teto por teste para 30 s de propósito — no teto padrão de 5 s, máquina ocupada (a do sócio com o navegador aberto, ou runner de CI compartilhado) dava vermelho por falta de CPU e não por defeito, que é o pior tipo de teste vermelho. Se algum dia precisar cortar tempo, o gasto está concentrado em `test/blocos-fatiar.test.ts`.

## Dívida técnica declarada

- **`casca.ts`**: a receita única do furo está copiada em cilindro (cópia-mãe), pirâmide, esfera e cubo — todas com nota ⚑; extrair na consolidação. Idem `RAIO_EIXO_MM`/`RAIO_POLO_MM` (0,6 re-declarado; `geometria.ts` tem a constante sem exportar).
- Vértices órfãos nas malhas furadas (colunas interiores aos blocos recortados — inofensivos, sobre a superfície; podar na consolidação).
- Fixação física entre formas tangentes (pino, cola, encaixe): decisão de produção em aberto ⚑ — TODO no cabeçalho de `tangencia.ts`; não bloqueia F2–F5.
- Abertura de encaixe do ponto de luz no bloco de baixo: fase posterior (fundos fechados na F1; pouso por cima assenta na cápsula do bulbo).

## Próximas fases

- **F2/F3 v0 — no ar** em `/criar` (rota paralela; o configurador atual segue intocado): UI plugada em `tangencia.ts` (assentarAoEntrar/deslizarContato/contatoIma), grade de variações com miniaturas do motor, sliders grampeados, ponto de luz emissivo `#FFC478`, undo por gesto, lixeira com re-ancoragem, `PONTOS_DE_LUZ_POR_OBRA` do núcleo, e as 4 ferramentas de 06/08. Falta da F3: alças 3D de escala e realce do ponto de contato durante o arrasto.
- **F4 — Persistência e preço**: schema v2 no `?c=`, salvar, preço por soma, STL por forma (cada `gerarMalha` já devolve o sólido pronto).
- **F5 — Polimento e aceite**: touch, performance, teste com usuário leigo (critérios da espec §8).

## Convergência (seção 0.5 da espec)

A 1ª leva "Ferramentas do Criar" do Caio (commit `7f58aba`: estruturais COAXIAIS com juntas F5) fica intacta no motor v1. O blocos v2 é tangência LIVRE sem junta F5 — sistemas distintos que coexistem. Avisar o Caio que esta frente virou a principal.
