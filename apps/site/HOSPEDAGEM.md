# Hospedagem do site

## Alternar LP e site completo

O pedido de 14/10/2026 acrescenta uma LP reversível, desenvolvida somente em `main`. `PERPARTE_LP_ATIVA=TRUE` foi criada via MCP Vercel em **Production, Preview e Development** no projeto `per-parte-website`, equipe `per-parte1`.

1. Abrir Settings → Environment Variables no projeto e editar `PERPARTE_LP_ATIVA` para o ambiente desejado.
2. Usar `TRUE` para a LP ou `FALSE` para o site completo preservado. Ausência equivale a FALSE; valor inválido impede o build/inicialização.
3. Gerar **novo build/deploy** de `main` para esse ambiente. Alterar a variável não modifica um deployment existente.
4. Conferir `/`, `/loja`, `/produtos/marco`, `/conta` e `/carrinho`: todas mostram a LP no modo TRUE. APIs comerciais ficam bloqueadas; `/api/captacao` aceita somente POST. No modo FALSE, o site e comércio voltam e a API de captação fica bloqueada.

O build da LP usa `captacao.html` nas duas entradas HTML e exclui os módulos/estilos antigos de interface do pacote. Fontes originais permanecem no repositório. Manter o ambiente de build e da função coerentes. O topo de [state.md](../../.claude/state.md) registra o resultado efetivo; a criação da variável não comprova publicação.

`RESEND_CONTACTS_API_KEY` está configurada como sensitive em **Production e Preview**, com chave Resend dedicada Full access explicitamente aprovada pelo usuário (o provedor oferece somente sending/full). As propriedades string `perparte_lp_origem`, `perparte_lp_consentimento_versao` e `perparte_lp_consentimento_em` foram criadas e verificadas via API. `SITE_ORIGINS` deve conter as origens exatas autorizadas, inclusive a de preview quando usada. O código preserva descadastro e exige confirmação de persistência; uma chave ausente/falha de API não produz sucesso fictício. **Não habilitar envio:** automações Resend vazias, nenhum e-mail enviado nesta etapa e `RESEND_ENABLED=false` preservado.

QA local aprovada: 77 testes, `site:check`, build TRUE com 35 arquivos e telas de 1440/390 px sem overflow. O projeto Vercel ainda está conectado ao Git antigo `FainowAI/per-parte-website`; a publicação será pela CLI a partir do checkout atual `main`, sem mudar esse vínculo. **Deploy e cadastro real ainda estão pendentes.** Não usar redeploy do código antigo para publicar esta implementação; conferir a origem do código e o resultado no topo de `state.md`.

## Registro da publicação do site completo

**PUBLICADO em 14/10/2026:** `main` foi enviada até `fcd24a1`, e o deploy `dpl_CyPYKP68Mbm9JHfg7Znqy8ZQQqxj` está **READY** em [perparte.com](https://perparte.com). A autorização do usuário substituiu o adiamento anterior. HTTP e navegação de Loja/produto foram conferidos em produção; checkout real e mutations remotas não foram validados. A implementação vanilla/Node permanece **PROVISÓRIA**. Evidências em [publicacao-vercel.md](../../docs/integracoes/publicacao-vercel.md).

O destino confirmado é **`per-parte-website`**, projeto `prj_ESzcls5GD5df0mcBVn7UUIetFFr1`, na equipe `per-parte1` (PerParte). Os aliases são `perparte.com`, `www.perparte.com` e `per-parte-website.vercel.app`. O vínculo antigo encontrado dentro de `dist` foi descartado como referência de destino. A configuração remota foi alterada de `apps/site` para a raiz do repositório, com build `npm run site:build` e saída `apps/site/dist`, incluindo a API da raiz.

O build gera os arquivos públicos em `apps/site/dist`. A função `api/index.mjs`, na raiz do repositório, atende as operações Shopify por meio de `apps/site/vercel-adaptador.mjs`. O servidor local `servidor.mjs` continua independente. O adaptador mantém os mesmos limites, validações e erros da API e não inicia um servidor HTTP persistente.

## Configuração aplicada e manutenção

- Manter a raiz do repositório como **Root Directory**, preset **Other** e Node.js **24.x**. `vercel.json` define `npm run site:build` e `apps/site/dist`.
- As 12 variáveis de Production foram cadastradas. Manter o contrato de `apps/site/.env.example`; não enviar `.env.local`. O token **público Storefront** é a opção usada nesta integração e permanece no servidor. Nunca usar token Admin.
- `SITE_ORIGINS` é obrigatório em produção: definir as origens HTTPS exatas do site, separadas por vírgula. Usar `https://perparte.com,https://www.perparte.com` quando ambas servirem o frontend. Incluir cada domínio de preview autorizado quando for testar carrinho em preview. Essa lista não é inferida do cabeçalho Host.
- Manter a coleção publicada no canal Headless e a URL de contas hospedadas que já foi confirmada no admin.
- Os rewrites mantêm `/loja`, `/produtos/:handle`, `/conta` e `/carrinho` acessíveis ao abrir ou recarregar uma URL. `/api/*` chega à única função com `__rota` e a captura nomeada `rota`. O adaptador valida e remove esses metadados e preserva filtros/cursores; capturas conflitantes ou repetidas são recusadas.
- O build monta os assets permitidos em diretório temporário, valida e só então substitui `apps/site/dist`. Conferir a ausência de `.env*`, `.vercel`, logs e prévias privadas no upload. O vínculo Vercel antigo encontrado dentro de `dist` não é asset público.
- Manter `RESEND_ENABLED=false`. Esta publicação não ativa gatilhos de e-mail, não publica o configurador e não estabelece sessão integrada de cliente.

O adaptador usa a assinatura Web `fetch(Request) -> Response`, suportada pelo runtime Node da Vercel. Para a alternativa de token privado, só usa `x-vercel-forwarded-for` quando o ambiente confirma `VERCEL=1`; o servidor local não passa a confiar em cabeçalhos de proxy.

## Verificação da versão publicada

O build limpo gerou **42 arquivos públicos**, sem arquivos de ambiente ou vínculo `.vercel`. Após corrigir o repasse da captura `rota` pela Vercel, **53/53 testes** e `npm run site:check` passaram. Os testes do adaptador cobrem consulta de catálogo, criação/alteração de carrinho com transporte simulado, JSON inválido, limite de corpo, origem e isolamento de credenciais.

Na produção, as páginas principais retornaram 200; `/api/loja/config` e consultas de produtos com/sem cor retornaram 200 no modo Shopify, com catálogo vazio. Os caminhos privados testados retornaram 404. A Loja mostrou três estudos, o filtro Brasa deixou Duna e sua página abriu sem erro registrado no console, com compra desabilitada. A revisão automática de aprovação bloqueou o smoke de carrinho; nenhum POST foi executado em produção. Catálogo vazio não comprova compra ou checkout real. A matriz completa e os limites estão no [relatório de publicação](../../docs/integracoes/publicacao-vercel.md).

Referências oficiais consultadas em 14/10/2026: [runtime Node e assinatura fetch](https://vercel.com/docs/functions/runtimes/node-js), [configuração vercel.json](https://vercel.com/docs/project-configuration/vercel-json), [rewrites](https://vercel.com/docs/routing/rewrites) e [cabeçalhos estabelecidos pela Vercel](https://vercel.com/docs/headers/request-headers).
