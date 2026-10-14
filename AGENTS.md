# Per Parte — instruções de trabalho

## Entrada obrigatória

1. Ative a skill `task-observer` no início de uma sessão com ferramentas e entregáveis. Ao carregar qualquer skill, leia as observações `OPEN` relacionadas em `skill-observations/log.md`, se existir.
2. Leia `.claude/state.md` (somente o topo), `.claude/project.md` e `.claude/requirements.md` antes de alterar produto.
3. Leia o fluxo da área: `.claude/fluxo-site.md`, `.claude/fluxo-configurador.md`, `.claude/fluxo-design-system.md` ou `.claude/fluxo-quadro.md`.
4. A fonte editorial e visual primária é `docs/fonte/Per-Parte-Revista-de-Marca.pdf`. A transcrição ao lado serve para busca; em conflito, confira a página do PDF.

## Estado do recomeço

Este repositório foi reiniciado em 13/10/2026. `apps/site` é um protótipo de landing visual em HTML, CSS e JavaScript, com servidor Node nativo na porta 4174 e build estático (ADR 0003). `apps/configurador` é o ateliê local HTML/CSS/JavaScript ESM na porta 4175, com desenho paramétrico SVG, persistência no navegador e rascunhos de pedido (ADR 0004). Essa escolha é PROVISÓRIA e reversível; login foi adiado, e backend/stack comercial permanecem em aberto. `apps/quadro` é o quadro visual local do projeto na porta 4173; `packages/design-system` contém os tokens compartilhados da revista. Não ressuscite código, stack ou decisões do projeto anterior por inércia.

## Regras

- Documentação, interface e código de domínio em pt-BR.
- Diferencie `DECIDIDO`, `PROVISÓRIO`, `PROPOSTA`, `EM ABERTO` e `FUTURO`. Uma proposta da revista não vira requisito implementado automaticamente.
- O cliente cria a obra; a Per Parte fabrica sob demanda. O configurador deve respeitar os limites de fabricação nos controles, sem permitir uma obra impossível de produzir.
- Segurança elétrica herdada das instruções do projeto: somente LED de até 9 W, pelo menos 25 mm entre lâmpada e parede impressa, e nenhuma parte condutora desenhada pelo cliente. Confirme a engenharia antes de implementar fabricação.
- Sem IA no produto, conforme direção anterior do projeto, até nova decisão explícita.
- Gantri é benchmark de pesquisa em `docs/pesquisa/gantri.md`. Seus tokens não são tokens da Per Parte.
- Hairline é referência de técnica/linguagem em `docs/pesquisa/hairline.md`; o renderizador do configurador é autoral, sem dependência do pacote. Preservar giro real na projeção, seleção por parte, cotas arrastáveis e alternativas de teclado.
- As faixas dimensionais do configurador são exploratórias PROVISÓRIAS. Não tratá-las como validação dos 25 mm, estabilidade, encaixe ou segurança elétrica. A prévia SVG não gera mesh/arquivo de fabricação.
- Criações e rascunhos são locais e versionados. Não sobrescrever armazenamento inválido sem a ação explícita de recuperação. Pedidos guardam cópias dos modelos e não são enviados à Per Parte.
- O vidro discreto dos blocos do configurador segue pedido explícito de 14/10/2026; manter tokens Per Parte e nenhuma sombra decorativa.
- A landing apresenta Marco, Duna e Farol como coleção em estudo. Duna/Farol e seus desenhos são propostas; todas as imagens geradas são conceituais. Não inferir fabricação, estoque, preço ou condições comerciais a partir da interface.
- Interações locais da landing não conectam compra, conta, cadastro, produção ou configurador. Respeite pausa de slideshow, teclado e preferência por menos movimento.
- Notas vivas do cofre Obsidian ficam fora deste repositório. Nunca apague `Documents\Projeto Per Parte`.
- Faça `git pull` no início quando as credenciais permitirem. Publicação e `git push` estão adiados por pedido do usuário (“Publicamos depois”); retome apenas após nova orientação.

## Manutenção do contexto

Fluxo alterado → atualize o `.claude/fluxo-*.md` correspondente. Decisão nova → registre em `.claude/adr/`. Fim de sessão → atualize `.claude/state.md`. Mantenha `README.md` e `.claude/roadmap.md` compatíveis com a árvore real.
