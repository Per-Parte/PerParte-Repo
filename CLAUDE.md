# Per Parte

Empresa brasileira de luminárias impressas em 3D, fabricadas sob demanda. O cliente monta (ou cria) a própria luminária num configurador web; um marketplace permite que criadores publiquem partes e ganhem royalties. Referência de mercado: Gantri (EUA). Sócios: Caio (produto/negócio) e sócio fundador (produção 3D).

## O princípio de engenharia do produto

**Interfaces fixas, partes livres.** Toda luminária é composta de partes (base, corpo, difusor, adornos) conectadas por encaixes de geometria padronizada que nunca mudam. A forma de cada parte é livre dentro de regras; as bordas são sempre iguais. Consequência: qualquer parte criada é compatível com todas as outras, e o marketplace vende partes avulsas, não só luminárias.

A regra mestra do configurador: **se a ferramenta deixou criar, a Per Parte consegue fabricar.** O cliente nunca vê erro de fabricação — ele vê controles que não vão até onde não podem.

## Estrutura deste repositório

- `docs/briefing-inicial.md` — contexto da empresa e da ideia (leitura rápida).
- `docs/produto-e-regras-v0.1.md` — conceito completo do produto: anatomia da luminária, modos Montar/Criar, marketplace.
- `docs/regras-do-produto-v0.2.md` — **fonte de verdade das regras**: especificação numerada (F=fabricação, S=segurança, E=estabilidade, M=marketplace, IP=propriedade intelectual), cada uma com valor de partida e onde é aplicada (Ferramenta / Backend / Curadoria).
- `prototipo/configurador.html` — protótipo navegável do configurador (arquivo único, canvas 3D próprio, zero dependências). Abrir direto no navegador.

## Regras para trabalhar neste projeto

- Idioma dos docs e da UI: **português (pt-BR)**.
- As regras numeradas em `docs/regras-do-produto-v0.2.md` são a fonte de verdade. Valores marcados com ⚑ são provisórios (aguardam validação com as impressoras reais do sócio) — não os trate como definitivos nem invente valores novos sem marcar como proposta.
- Regras de segurança elétrica (S1–S6) são invioláveis em qualquer implementação: só LED ≤ 9 W, distância mínima lâmpada↔parede ≥ 25 mm, cliente nunca desenha nada condutor, kernel elétrico fechado e certificado.
- No modo Criar, geometria é sempre paramétrica (sólidos de revolução + texturas), nunca CAD livre. Limites de fabricação viram limites de sliders, não mensagens de erro.
- Decisões ainda abertas (não implementar como se estivessem decididas): kernel E27 vs. LED integrado (aguarda consultoria sobre Portaria INMETRO 231/2026), percentual de royalty, nomes definitivos dos modos, exclusividade da licença de criadores.

## Estado atual e próximos passos prováveis

Fase de conceito validado em protótipo. Próximos passos de código: evoluir o protótipo para um configurador real (stack a definir — o protótipo atual é vanilla JS de propósito, para não ancorar a escolha), geração de malha/STL no backend a partir dos parâmetros, cálculo de preço por estimativa de material/tempo, e o fluxo de publicação no marketplace.
