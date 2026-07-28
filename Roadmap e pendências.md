# Roadmap e pendências

## Feito ✓

- Docs de fundação (briefing, conceito v0.1, [regras v0.2](docs/regras-do-produto-v0.2.md))
- Protótipo conceitual navegável
- **28/07/2026** — Configurador v0.2 no site (Next.js + R3F + núcleo de regras), GitHub conectado ([PerParte](https://github.com/caio180820/PerParte)), Obsidian montado
- **28/07/2026** — Gerador de STL no servidor: botões "STL de produção" no configurador; sólidos estanques verificados, mm, eixo vertical (F8), regras regrampeadas no backend

## Trilha de negócio (Caio + sócio)

- [ ] Sócio responde as **6 perguntas de produção** (fim das [regras v0.2](docs/regras-do-produto-v0.2.md)) → valores ⚑ viram reais
- [ ] **Consultoria Portaria INMETRO 231/2026** → decide o kernel elétrico (ver [[Decisões]])
- [ ] Testar o configurador e anotar incômodos numa nota "Feedback do configurador"
- [ ] Depois: benchmark Gantri/mercado, identidade de marca, números do negócio

## Trilha de código (Claude)

- [x] **Gerador de STL no servidor** — mesmo núcleo do preview ✓ 28/07/2026
- [x] **Geometria real dos encaixes** (anel macho/fêmea, folga F5) nos STLs + kit de calibração no site ✓ 28/07/2026
- [ ] **Sócio imprime o kit de calibração** (botões 0,2 / 0,3 / 0,4 no configurador) e escolhe a folga → travar F5 em `regras.ts` para sempre
- [ ] Abstração de **arquétipos** no núcleo → famílias novas (task light, planos dobrados) rumo à variedade Gantri
- [ ] Contas + salvar criações (Supabase) — embrião do marketplace
- [ ] Landing e vitrine do marketplace (esboço rápido via Lovable)
- [ ] Mais adiante: preço por slicer real, pagamentos com split de royalty

Relacionadas: [[INICIO]] · [[Decisões]] · [[Regras (resumo)]]
