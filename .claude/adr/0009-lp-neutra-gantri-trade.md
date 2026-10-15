# ADR 0009 — Revisão neutra da LP com referência Gantri Trade

**Data:** 14/10/2026. **Estado:** DECIDIDO por pedido do usuário para a direção visual desta LP. QA local concluída; código em `main`, commit `e918b7a`. Deploy READY e publicação desta revisão confirmada em perparte.com.

## Contexto

A LP de captação inicial usou Springs como referência estrutural e foi publicada conforme ADR 0007. O novo pedido muda a direção visual para uma narrativa com fotografias amplas, pessoas e ambientes, tipografia leve, cores neutras e painéis de vidro, tomando [Gantri Trade](https://www.gantri.com/trade) como referência. O site completo preservado e a integração de captação continuam existentes.

## Decisão

1. Aplicar a direção neutra **somente à LP** em `apps/site/captacao.html`, `captacao.css` e `captacao.js`. Papel local `#F5F5F3`, branco, cinzas e texto escuro são uma exceção visual autorizada nesta superfície; não substituir os tokens globais ou declarar revisada toda a identidade da revista.
2. Usar Figtree nos textos e títulos com peso 400, mantendo o wordmark pelo token display local. Tipografia final da marca continua PROVISÓRIA.
3. Organizar a página em hero fotográfico, introdução branca, cenas narrativas, convite, formulário e rodapé enxuto. Navegação fixa passa do transparente ao claro na rolagem; links conduzem às seções e ao cadastro. O CTA do cabeçalho usa fundo claro com 90% de opacidade e texto `#1E1E1E` para legibilidade sobre a fotografia.
4. Usar fotografias conceituais originais com pessoas fictícias adultas de 20–30 anos, conforme a persona prioritária. Quatro novos assets: `lp-vida-hero-v2.png`, `lp-criar-v2.png` e as versões verticais `lp-vida-hero-mobile-v2.png`/`lp-criar-mobile-v2.png` de 1024 × 1536 px. Elementos `picture` selecionam as versões móveis até 600 px, e o preload do hero usa a condição de mídia correspondente. Reaproveitar ambientes locais Duna/Farol como estudos. Nenhuma mídia, marca, copy ou fonte Gantri é incorporada.
5. Aplicar vidro translúcido com blur de 26 px nos painéis, sem sombra decorativa. **É adaptação solicitada pelo usuário**: os painéis narrativos Gantri inspecionados não tinham `backdrop-filter`; blur de 32 px apareceu somente em um input do rodapé.
6. Implementar painéis narrativos sticky no desktop e fluxo normal no móvel, com revelações suaves de 22 px. Não introduzir parallax ou dependência de GSAP por inferência: ambos não foram comprovados na referência. Movimento reduzido remove transições, deslocamento, scroll suave e sticky.

## Evidências e limites

Gantri Trade foi observada em 1440 × 900 e 390 × 844. Capturas via Playwright em `docs/pesquisa/gantri-trade-capturas/`; após timeouts iniciais, o hero também foi capturado pela extensão Chrome em `08-extensao-chrome.png`. Inspeção REA por Chrome headless/CDP 9335 produziu Evidence `ev_c6a3216e8fb4265c4152b693ee87d3ceb746b81f34d463294644feec7c6d38ef`, com 743 nós DOM, 21 scripts e janela de 750 ms após conexão, sem storage ou fontes de scripts. Pesquisa completa em `docs/pesquisa/gantri-trade.md`.

Pessoas, luminárias, peças avulsas e acabamentos nas novas fotos são conceituais. Não inferir fabricação, medidas homologadas, estoque ou variante comercial; gerar assets não adiciona IA ao produto. Prompts e proveniência estão em `docs/imagens-lp-v2-prompts.md`. Preservar avisos de estudo e textos alternativos.

## Contratos preservados e aceite

O formulário mantém e-mail obrigatório, nome opcional, consentimento `2026-10-14`, honeypot, status acessível e envio JSON para `/api/captacao`. Resend Contacts continua sem envio automático; credenciais no servidor, opt-out preservado e confirmação por persistência/releitura. `PERPARTE_LP_ATIVA=TRUE/FALSE`, build/deploy e restauração do site seguem ADR 0007; `RESEND_ENABLED=false` permanece.

QA local desta revisão concluída: 77 testes aprovados fora do sandbox após `EACCES` de loopback na primeira tentativa, `site:check` aprovado e build TRUE com 39 arquivos. Desktop de 1440 px e móveis de 390/320 px sem overflow; quatro imagens carregadas no desktop, versões móveis selecionadas pelos `picture`, sticky estável em 275 px após 150 px de scroll e blur de 26 px confirmado.

Com movimento reduzido emulado, não há revelações ativas, o scroll é `auto` e os painéis usam `position: relative`. Por teclado, o primeiro Tab alcança “Pular para o cadastro”; Enter e o Tab seguinte chegam ao campo de e-mail. O cadastro foi verificado com resposta 200 simulada: payload conserva consentimento `2026-10-14`, status recebe foco, formulário limpa e botão é reabilitado. Não houve escrita no Resend nesta rodada. Contraste do CTA do cabeçalho foi corrigido para fundo claro de 90% e texto `#1E1E1E`.

O commit `e918b7a` está em `origin/main` e foi publicado a partir de uma exportação limpa desse commit. Deploy `dpl_HmtWz29t5wxqXoTvce7NREbzc4pf` READY, com alias `https://perparte.com`; MCP confirmou metadados e build remoto de 39 arquivos. Rotas públicas mostram a nova LP; desktop e móvel foram conferidos em produção, sem erros de JavaScript registrados no desktop e sem overflow móvel. A persistência real do Resend pertence à rodada anterior; esta revisão fez teste de interface com resposta simulada, sem novo cadastro ou envio. Evidências completas em `docs/pesquisa/gantri-trade.md` e no topo de `.claude/state.md`.
