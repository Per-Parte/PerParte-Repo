# Per Parte — instruções de trabalho

## Entrada obrigatória

1. Ative a skill `task-observer` no início de uma sessão com ferramentas e entregáveis. Ao carregar qualquer skill, leia as observações `OPEN` relacionadas em `skill-observations/log.md`, se existir.
2. Leia `.claude/state.md` (somente o topo), `.claude/project.md` e `.claude/requirements.md` antes de alterar produto.
3. Leia o fluxo da área: `.claude/fluxo-site.md`, `.claude/fluxo-configurador.md` ou `.claude/fluxo-design-system.md`.
4. A fonte editorial e visual primária é `docs/fonte/Per-Parte-Revista-de-Marca.pdf`. A transcrição ao lado serve para busca; em conflito, confira a página do PDF.

## Estado do recomeço

Este repositório foi reiniciado em 13/10/2026. `apps/site` e `apps/configurador` são workspaces vazios, sem framework escolhido. `packages/design-system` contém tokens iniciais da revista. Não ressuscite código, stack ou decisões do projeto anterior por inércia.

## Regras

- Documentação, interface e código de domínio em pt-BR.
- Diferencie `DECIDIDO`, `PROVISÓRIO`, `PROPOSTA`, `EM ABERTO` e `FUTURO`. Uma proposta da revista não vira requisito implementado automaticamente.
- O cliente cria a obra; a Per Parte fabrica sob demanda. O configurador deve respeitar os limites de fabricação nos controles, sem permitir uma obra impossível de produzir.
- Segurança elétrica herdada das instruções do projeto: somente LED de até 9 W, pelo menos 25 mm entre lâmpada e parede impressa, e nenhuma parte condutora desenhada pelo cliente. Confirme a engenharia antes de implementar fabricação.
- Sem IA no produto, conforme direção anterior do projeto, até nova decisão explícita.
- Gantri é benchmark de pesquisa em `docs/pesquisa/gantri.md`. Seus tokens não são tokens da Per Parte.
- Notas vivas do cofre Obsidian ficam fora deste repositório. Nunca apague `Documents\Projeto Per Parte`.
- Faça `git pull` no início e `git push` ao fim da sessão quando as credenciais permitirem.

## Manutenção do contexto

Fluxo alterado → atualize o `.claude/fluxo-*.md` correspondente. Decisão nova → registre em `.claude/adr/`. Fim de sessão → atualize `.claude/state.md`. Mantenha `README.md` e `.claude/roadmap.md` compatíveis com a árvore real.
