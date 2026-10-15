# ADR 0007 — LP de captação reversível e Resend Contacts

**Data:** 14/10/2026. **Estado:** DECIDIDO por pedido do usuário. LP publicada, configuração remota e persistência real com contato sintético QA verificadas; resultado no topo de `../state.md`.

## Contexto

O usuário pediu trabalhar somente em `main`, estudar a estrutura de `https://springs.com.br/` com a skill `reverse-engineer-anything` e capturas da extensão do Chrome, e apresentar uma LP de captação com identidade Per Parte. O site atual deve ser ocultado, sem exclusão, com retorno controlado pela Vercel.

## Decisão

- `PERPARTE_LP_ATIVA=TRUE` seleciona a LP; `FALSE` ou ausência mantém o site completo. O valor não diferencia maiúsculas de minúsculas; valores diferentes impedem build/inicialização. A variável foi criada com TRUE via MCP Vercel para Production, Preview e Development no projeto `per-parte-website`, equipe `per-parte1`.
- A escolha vale para o build e o runtime da API. Alterar o valor na Vercel exige novo build/deploy. Os HTMLs originais permanecem no código; no build da LP, `index.html` e `comercio.html` recebem o conteúdo de `captacao.html`, cobrindo também URLs comerciais diretas. Os módulos e estilos antigos de interface ficam fora desse pacote público. APIs comerciais são recusadas enquanto a LP está ativa.
- Springs informa estrutura e hierarquia; cores, tipografia, conteúdo e imagens são Per Parte. Estudos conceituais continuam identificados, sem preço, estoque, reserva ou data de lançamento inventados.
- Por escolha explícita do usuário, os cadastros vão para **Resend Contacts, sem envio automático**. O formulário pede e-mail, nome opcional e consentimento explícito. Não cria conta Shopify, pedido, reserva ou sessão do configurador.
- A credencial de Contacts é `RESEND_CONTACTS_API_KEY`, dedicada no servidor. O usuário aprovou explicitamente Full access após ser informado de que o Resend oferece somente sending/full. Foi cadastrada como sensitive na Vercel em Production/Preview. Nunca reutilizar a chave transacional somente de envio como fallback; guardar o segredo somente em ambiente ignorado/local e na Vercel.
- Foram criadas e verificadas via API três propriedades de contato do tipo `string`: `perparte_lp_origem`, `perparte_lp_consentimento_versao` e `perparte_lp_consentimento_em`. O registro usa origem `lp`, versão `2026-10-14` e instante ISO do servidor.

## Contrato e limites

`POST /api/captacao` valida origem em `SITE_ORIGINS`, JSON, limites de tamanho, e-mail, nome, consentimento e campo antiautomação. A API consulta o contato, grava quando necessário e relê o registro antes de confirmar sucesso; uma repetição com registro válido preserva a primeira data de consentimento. Contatos descadastrados não são reinscritos automaticamente, e a API nunca envia `unsubscribed:false`.

O código não chama a API de envio e não cria automação. O painel Resend de automações estava vazio e nenhum e-mail foi enviado nesta etapa. `RESEND_ENABLED=false` permanece independente da captação. Não registrar e-mail, conteúdo pessoal ou segredo em logs. O cadastro só deve ser declarado operacional após configuração remota e prova de persistência; testes simulados não comprovam captação real. Os guardas locais não equivalem a um sistema distribuído completo de combate a abuso.

## Operação e reversão

Editar `PERPARTE_LP_ATIVA` no ambiente desejado da Vercel, gerar novo deploy e conferir página inicial, URLs comerciais e API no mesmo modo. `FALSE` mais redeploy restaura o site preservado. Consultar `apps/site/HOSPEDAGEM.md`, `apps/site/README.md` e o topo de `.claude/state.md` para configuração e resultado efetivo.

O projeto Vercel permanece ligado ao repositório antigo `FainowAI/per-parte-website`; esta publicação usou CLI a partir do checkout atual `main`, preservando o vínculo. `8de190f` foi enviado a `origin/main`, integrando sem perda o commit concorrente `d3be437` do rodapé Lago. Deploy final `dpl_FVgjPH4K5TuKvVWtUJTqAMGiFnkW` READY com alias `perparte.com`. Validação local: 77 testes, `site:check`, build TRUE com 35 arquivos e telas de 1440/390 px sem overflow. Rotas principais mostram a LP e APIs comerciais/arquivos privados estão bloqueados.

O formulário público do deploy inicial `dpl_FC7Au2z1VmKwKW1dAQqApakVTvQh` gravou um contato sintético QA em `example.com`; a API Resend confirmou propriedades e opt-in. O registro foi removido por ID, com ausência 404 confirmada; nenhum e-mail foi enviado. Isso verifica persistência real no provedor, sem representar lead humano. O deploy final mantém o mesmo código de captação; a diferença está no rodapé do site preservado e nos metadados Git. Capturas em `docs/pesquisa/perparte-lp-capturas/`, incluindo `04-sucesso-producao-mobile.png`; referência em `docs/pesquisa/springs.md`, com print da extensão Chrome.
