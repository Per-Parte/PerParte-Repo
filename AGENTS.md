# Per Parte — instruções de trabalho

## Entrada obrigatória

1. Ative a skill `task-observer` no início de uma sessão com ferramentas e entregáveis. Ao carregar qualquer skill, leia as observações `OPEN` relacionadas em `skill-observations/log.md`, se existir.
2. Leia `.claude/state.md` (somente o topo), `.claude/project.md` e `.claude/requirements.md` antes de alterar produto.
3. Leia o fluxo da área: `.claude/fluxo-site.md`, `.claude/fluxo-configurador.md`, `.claude/fluxo-design-system.md` ou `.claude/fluxo-quadro.md`.
4. A fonte editorial e visual primária é `docs/fonte/Per-Parte-Revista-de-Marca.pdf`. A transcrição ao lado serve para busca; em conflito, confira a página do PDF.

## Estado do recomeço

Este repositório foi reiniciado em 13/10/2026. `apps/site` reúne landing, Loja, produto, conta e carrinho em HTML/CSS/JavaScript ESM, com API Node nativa na porta 4174. Shopify é o backend comercial **DECIDIDO** pelo pedido de 14/10/2026 (ADR 0005); vanilla/Node continua **PROVISÓRIO** e reversível. Headless, token Storefront e coleção `todas` estão configurados; Search & Discovery instalado, filtros em configuração. A loja ainda não possui produtos reais. O smoke sem escrita passou, mas não comprova compra. `apps/configurador` é o ateliê local na porta 4175, com SVG paramétrico, persistência e rascunhos (ADR 0004); sessão integrada, sincronização e fabricação continuam pendentes. `apps/quadro` é o quadro local na porta 4173; `packages/design-system` contém os tokens da revista. Não ressuscite código, stack ou decisões do projeto anterior por inércia.

## Regras

Resend é o serviço **DECIDIDO** para e-mails próprios (ADR 0006). `emails.perparte.com` está verificado em `sa-east-1`; modelos, transporte interno e CLI estão preparados. A chave somente de envio fica no ambiente ignorado com `RESEND_ENABLED=false`. Um teste autorizado para Davi foi confirmado como DELIVERED no Resend, com habilitação somente naquele processo; aparência na inbox/clientes continua pendente. Não há gatilho automático ativo; o configurador continua local.

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
- Dados comerciais vêm da Shopify: produto/variante publicados, preço, disponibilidade e imagem. Estudos não são compráveis; seleção visual de cor não cria variante. O carrinho usa `checkoutUrl` retornada, sem afirmar pagamento ou produção concluídos.
- Conta hospedada Shopify não equivale a OAuth/sessão local nem sincroniza criações do configurador. Credenciais ficam em `.env.local` ignorado, nunca no frontend; operações GraphQL do servidor são fechadas. A hospedagem comercial exige runtime da API além de `dist`.
- Códigos de acesso das novas contas continuam nativos da Shopify. Resend envia mensagens próprias, sem OTP paralelo; não disparar boas-vindas cegamente por `customers/create` nem tratar clique, favorita ou rascunho local como evento comercial confirmado. Evitar duplicar notificações Shopify.
- E-mails exigem evento legítimo e destinatário vinculado. CLI gera prévias por padrão; envio exige flag explícita e configuração habilitada. Não expor rota pública de envio arbitrário, registrar chave/conteúdo pessoal em logs nem publicar `.local/emails`. Idempotência Resend de 24 h não substitui outbox persistente; automação, backend cloud e validação de inbox continuam pendentes.
- Diferencie instalação/configuração, testes simulados, smoke sem escrita e compra real. Não preencher a loja com produtos ou condições fictícias para validar a interface. Respeite pausa do slideshow, teclado e preferência por menos movimento.
- Notas vivas do cofre Obsidian ficam fora deste repositório. Nunca apague `Documents\Projeto Per Parte`.
- Faça `git pull` no início quando as credenciais permitirem. Em 14/10/2026, o usuário autorizou integrar o trabalho à `main` e publicar o site em produção na Vercel, substituindo o adiamento anterior. Preserve credenciais, logs operacionais e prévias privadas fora do Git e do pacote público; registre o resultado efetivo em `state.md`.

## Manutenção do contexto

Fluxo alterado → atualize o `.claude/fluxo-*.md` correspondente. Decisão nova → registre em `.claude/adr/`. Fim de sessão → atualize `.claude/state.md`. Mantenha `README.md` e `.claude/roadmap.md` compatíveis com a árvore real.
