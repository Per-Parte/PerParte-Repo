# Per Parte

Empresa brasileira de luminárias impressas em 3D, fabricadas sob demanda. O cliente monta (ou cria) a própria luminária num configurador web; um marketplace permite que criadores publiquem partes e ganhem royalties. Referência de mercado: Gantri (EUA). Sócios: Caio (produto/negócio) e sócio fundador (produção 3D).

## O princípio de engenharia do produto

**Interfaces fixas, partes livres.** Toda luminária é composta de partes (base, corpo, difusor, adornos) conectadas por encaixes de geometria padronizada que nunca mudam. A forma de cada parte é livre dentro de regras; as bordas são sempre iguais. Consequência: qualquer parte criada é compatível com todas as outras, e o marketplace vende partes avulsas, não só luminárias.

A regra mestra do configurador: **se a ferramenta deixou criar, a Per Parte consegue fabricar.** O cliente nunca vê erro de fabricação — ele vê controles que não vão até onde não podem.

## Onde as coisas moram (decisão de 02/08/2026)

- **Este repositório** = código + documentação oficial. Sincroniza por **Git** entre os sócios.
- **As notas vivas do dia a dia** (INICIO, Decisões, Roadmap, Regras-resumo, atas, ideias) moram numa pasta **separada**, fora deste repositório, sincronizada entre os sócios pelo **Obsidian Sync** (no Windows do Caio: `Documents\Per Parte — Notas`). Nunca misturar as duas: clone de código dentro de cofre do Obsidian já causou duplicação em cascata entre as máquinas.

## Estrutura deste repositório

- `docs/documento-mestre.md` — **fonte de verdade do produto** (versão consolidada, 03/08/2026). Reúne tudo sobre produto, regras e forma de trabalho; quem lê só este entende o projeto inteiro. Substitui os documentos abaixo, mantidos como histórico.
- `docs/briefing-inicial.md`, `docs/produto-e-regras-v0.1.md`, `docs/regras-do-produto-v0.2.md` — rascunhos anteriores, histórico.
- `apps/web` — o configurador real (Next.js + React Three Fiber).
- `packages/nucleo` (`@per-parte/nucleo`) — regras do produto como código e geração de geometria paramétrica; mesmo código gera o preview no navegador e o STL de produção no servidor.
- `prototipo/configurador.html` — protótipo original (arquivo único, canvas 3D próprio, zero dependências). Histórico; a versão real está em `apps/web`.

## Regras para trabalhar neste projeto

- Idioma dos docs e da UI: **português (pt-BR)**.
- `docs/documento-mestre.md` é a fonte de verdade. Valores marcados com ⚑ são provisórios (aguardam validação com as impressoras reais do sócio) — não os trate como definitivos nem invente valores novos sem marcar como proposta. ✗ = ninguém decidiu ainda.
- Regras de segurança elétrica são invioláveis em qualquer implementação: só LED ≤ 9 W, distância mínima lâmpada↔parede ≥ 25 mm, cliente nunca desenha nada condutor, kernel elétrico fechado e certificado.
- No modo Criar, geometria é sempre paramétrica (sólidos de revolução + texturas), nunca CAD livre. Limites de fabricação viram limites de controles, não mensagens de erro.
- Decisões ainda abertas (não implementar como se estivessem decididas): kernel E27 vs. LED integrado (aguarda consultoria sobre Portaria INMETRO 231/2026), percentual de royalty, nomes definitivos dos modos (Montar/Criar vs. Compor/Esculpir), exclusividade da licença de criadores, escopo do lançamento (K1 + Montar vs. incluir Criar).

## Estado atual

Configurador real em produção: [per-parte-web.vercel.app](https://per-parte-web.vercel.app) (`apps/web`), com modos Montar e Criar, geração de STL de produção, kit de calibração de encaixe (F5), links compartilháveis de criação, e interface em órbita ao redor da luminária. Próximas frentes: contas e galeria de criações (marketplace), arquétipos além da revolução (task light, formas planas), decisões de negócio pendentes acima.
