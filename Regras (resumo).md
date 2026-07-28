# Regras (resumo)

Cola rápida. A fonte de verdade é [regras-do-produto-v0.2](docs/regras-do-produto-v0.2.md); no código, vivem em `packages/nucleo/src/regras.ts`. ⚑ = provisório, aguarda dados reais das impressoras.

## F — Fabricação

| Regra | Valor de partida |
|---|---|
| F1 volume máx. por parte | 25 × 25 × 30 cm ⚑ |
| F2 parede estrutural | 1,6–2,4 mm ⚑ |
| F3 parede do difusor (translucidez) | 0,8–1,2 mm ⚑ |
| F4 balanço sem suporte | ≤ 45–50° ⚑ |
| F5 encaixes fixos | Ø 5,2 e Ø 3,8 cm · folga 0,2–0,4 mm ⚑ |
| F7 peso máx. por parte | 350 g ⚑ |

## S — Segurança (inviolável)

- Só **LED ≤ 9 W** — incandescente/halógena proibidas para sempre
- **≥ 25 mm** entre lâmpada e qualquer parede impressa ⚑
- Cliente **nunca desenha nada condutor**; kernel elétrico fechado e certificado
- Conformidade INMETRO 231/2026 → ver [[Decisões]]

## E — Estabilidade

- CG projetado no **terço central** da base
- **Base adaptativa**: alarga sozinha em vez de dar erro (já funciona no configurador)

## M / IP — Marketplace

- Royalty é **da parte**, não da luminária
- Peça só fica pública após a **primeira impressão física aprovada**
- A Per Parte **nunca entrega o arquivo STL** — nem ao comprador, nem ao criador

Relacionadas: [[INICIO]] · [[Decisões]] · [[Roadmap e pendências]]
