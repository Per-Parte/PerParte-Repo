# Montagem v2 — estado da execução (handoff)

> Registro vivo da frente `montagem-v2` (espec: `docs/montagem-v2-prompt.md`).
> Atualizado em **06/08/2026**. Branch: `montagem-v2`.

## Onde estamos: F1 CONCLUÍDA e REVISADA ✅ · F2/F3 em construção

A F1 (núcleo blocos) está completa em `packages/nucleo/src/blocos/`, passou por **revisão adversarial** (4 lentes independentes com testes-sonda, 23 achados — todos corrigidos ou documentados abaixo) e tem 262 testes verdes (131 pré-existentes intactos + 131 do módulo blocos). Nenhum arquivo existente do núcleo foi modificado além do export do barrel em `src/index.ts` (regra "o núcleo cresce, não muda").

| Peça | Arquivo | Testes | Estado |
| --- | --- | --- | --- |
| Tipos e contratos (com `raiosNotaveisMm`) | `src/blocos/tipos.ts` | — | ✅ |
| Clamps derivados de F1/F2/F4 (medem a casca interna) | `src/blocos/limites.ts` | via variações | ✅ |
| Catálogo das 8 variações | `src/blocos/variacoes.ts` | 66 | ✅ |
| Tangência A1 (varredura + ímã multi-bloco) | `src/blocos/tangencia.ts` | 21 | ✅ |
| Ponto de luz (base 5×5, bulbo 4 cm, clamp 1–2/obra) | `src/blocos/ponto-de-luz.ts` | 9 | ✅ |
| Cilindro (oca de borda ABERTA) | `src/blocos/cilindro.ts` | 8 | ✅ |
| Pirâmide (oca fechada, cavidade paralela) | `src/blocos/piramide.ts` | 9 | ✅ |
| Esfera (oca com respiro polar por ângulo) | `src/blocos/esfera.ts` | 11 | ✅ |
| Cubo (oca de borda ABERTA) | `src/blocos/cubo.ts` | 8 | ✅ |

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

## Dívida técnica declarada

- **`casca.ts`**: a receita única do furo está copiada em cilindro (cópia-mãe), pirâmide, esfera e cubo — todas com nota ⚑; extrair na consolidação. Idem `RAIO_EIXO_MM`/`RAIO_POLO_MM` (0,6 re-declarado; `geometria.ts` tem a constante sem exportar).
- Vértices órfãos nas malhas furadas (colunas interiores aos blocos recortados — inofensivos, sobre a superfície; podar na consolidação).
- Fixação física entre formas tangentes (pino, cola, encaixe): decisão de produção em aberto ⚑ — TODO no cabeçalho de `tangencia.ts`; não bloqueia F2–F5.
- Abertura de encaixe do ponto de luz no bloco de baixo: fase posterior (fundos fechados na F1; pouso por cima assenta na cápsula do bulbo).

## Próximas fases

- **F2/F3 — Cena + UI** (em construção, rota `/criar`): decisão dos sócios de 06/08 — **pode subir no site principal** (rota paralela; o configurador atual continua intocado na rota dele). Plugar a UI em `tangencia.ts` (assentarAoEntrar/deslizarContato/contatoIma), grade de variações 3 colunas com miniaturas do motor, propriedades com sliders grampeados, ponto de luz emissivo (cor da cena atual: `#FFC478`), undo, lixeira com re-ancoragem via `contatoIma`, `PONTOS_DE_LUZ_POR_OBRA` do núcleo.
- **F4 — Persistência e preço**: schema v2 no `?c=`, salvar, preço por soma, STL por forma (cada `gerarMalha` já devolve o sólido pronto).
- **F5 — Polimento e aceite**: touch, performance, teste com usuário leigo (critérios da espec §8).

## Convergência (seção 0.5 da espec)

A 1ª leva "Ferramentas do Criar" do Caio (commit `7f58aba`: estruturais COAXIAIS com juntas F5) fica intacta no motor v1. O blocos v2 é tangência LIVRE sem junta F5 — sistemas distintos que coexistem. Avisar o Caio que esta frente virou a principal.
