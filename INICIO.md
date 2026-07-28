# Per Parte — início

Luminárias **de mesa** impressas em 3D, fabricadas sob demanda. O cliente monta ou cria a própria luminária num configurador web; criadores publicam partes e ganham royalties. Referência de mercado: [Gantri](https://www.gantri.com).

## Notas vivas (dia a dia)

- [[Decisões]] — o que já foi decidido e o que está em aberto
- [[Roadmap e pendências]] — trilhas de negócio e de código, com checkboxes
- [[Regras (resumo)]] — cola rápida das regras com os números

## Mapa do projeto

### Produto (documentos)
- [Briefing inicial](docs/briefing-inicial.md) — contexto da empresa e da ideia
- [Produto e regras v0.1](docs/produto-e-regras-v0.1.md) — conceito completo: anatomia, modos Montar/Criar, marketplace
- [Regras do produto v0.2](docs/regras-do-produto-v0.2.md) — **fonte de verdade das regras** (F/S/E/M/IP); ⚑ = valor provisório

### Software
- [Protótipo original](prototipo/configurador.html) — HTML único, abre direto no navegador
- **Configurador v0.2** — `apps/web` (Next.js + React Three Fiber) + `packages/nucleo` (regras e geometria como código)
  - Rodar: `npm run dev` na pasta do projeto → abrir http://localhost:3000
  - Princípio: o mesmo núcleo gera o preview no navegador e (futuramente) o STL de produção

## Decisões tomadas
- **Escopo: só luminária de mesa** — 28/07/2026
- **Stack do configurador**: monorepo (npm workspaces), Next.js 16 + React Three Fiber, núcleo TypeScript puro — 28/07/2026
- **Interfaces fixas (F5)**: Ø 5,2 cm (base↔corpo) e Ø 3,8 cm (corpo↔difusor) ⚑ validar com peças reais

## Decisões abertas (não implementar como decididas)
- Kernel elétrico: soquete E27 vs. LED integrado — aguarda consultoria sobre a Portaria INMETRO 231/2026
- Percentual de royalty do marketplace
- Nomes definitivos dos modos
- Exclusividade da licença de criadores

## Próximos passos
1. Sócio responde as 6 perguntas de produção (fim das [regras v0.2](docs/regras-do-produto-v0.2.md)) → valores ⚑ viram reais
2. Consultoria da Portaria 231/2026 → decisão do kernel elétrico
3. Geração de STL no servidor a partir do núcleo
4. Contas + salvar criações; landing e vitrine do marketplace

## Notas livres
Crie notas soltas (reuniões, fornecedores, ideias) numa pasta `notas/` — o Obsidian cria sozinho quando você fizer a primeira.
