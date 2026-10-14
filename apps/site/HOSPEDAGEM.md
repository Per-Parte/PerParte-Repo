# Hospedagem do site

**AUTORIZADO, EXECUÇÃO PENDENTE:** em 14/10/2026, o usuário autorizou atualizar `main` e publicar o site em produção na Vercel, substituindo o adiamento anterior. O adaptador está preparado; este registro ainda não confirma push, deploy desta versão ou validação pública. A implementação vanilla/Node permanece **PROVISÓRIA**.

O destino confirmado pelo usuário e pela consulta autenticada é **`per-parte-website`**, projeto `prj_ESzcls5GD5df0mcBVn7UUIetFFr1`, na equipe `per-parte1` (PerParte). O login isolado foi concluído com `davi-2705`; os aliases `perparte.com` e `www.perparte.com` já pertencem a esse projeto. O vínculo antigo encontrado dentro de `dist` não deve definir o destino. A inspeção atual mostrou Root Directory `apps/site`, comando `node construir.mjs` e saída `dist`; é necessário mudar para a configuração abaixo para incluir a API da raiz. Essa mudança e o deploy desta versão ainda não estão confirmados neste registro.

O build gera os arquivos públicos em `apps/site/dist`. A função `api/index.mjs`, na raiz do repositório, atende as operações Shopify por meio de `apps/site/vercel-adaptador.mjs`. O servidor local `servidor.mjs` continua independente. O adaptador mantém os mesmos limites, validações e erros da API e não inicia um servidor HTTP persistente.

## Configuração da publicação autorizada

- Usar a raiz do repositório como **Root Directory**, preset **Other** e Node.js **24.x**. `vercel.json` define o comando de build e o diretório de saída.
- Cadastrar as variáveis de `apps/site/.env.example` no ambiente do projeto. Não enviar `.env.local`. O token **público Storefront** é a opção usada nesta integração; ele permanece no servidor. Nunca usar token Admin.
- `SITE_ORIGINS` é obrigatório em produção: definir as origens HTTPS exatas do site, separadas por vírgula. Usar `https://perparte.com,https://www.perparte.com` quando ambas servirem o frontend. Incluir cada domínio de preview autorizado quando for testar carrinho em preview. Essa lista não é inferida do cabeçalho Host.
- Manter a coleção publicada no canal Headless e a URL de contas hospedadas que já foi confirmada no admin.
- Os rewrites mantêm `/loja`, `/produtos/:handle`, `/conta` e `/carrinho` acessíveis ao abrir ou recarregar uma URL. `/api/*` chega à única função com o parâmetro interno `__rota`; os demais parâmetros são preservados.
- Conferir a limpeza de `apps/site/dist` antes do build e a ausência de `.env*`, `.vercel`, logs e prévias privadas no upload. O vínculo Vercel antigo encontrado dentro de `dist` não é asset público.
- Manter `RESEND_ENABLED=false`. Esta publicação não ativa gatilhos de e-mail, não publica o configurador e não estabelece sessão integrada de cliente.

O adaptador usa a assinatura Web `fetch(Request) -> Response`, suportada pelo runtime Node da Vercel. Para a alternativa de token privado, só usa `x-vercel-forwarded-for` quando o ambiente confirma `VERCEL=1`; o servidor local não passa a confiar em cabeçalhos de proxy.

## Verificação antes de publicar

`npm run site:build` e `npm run site:test` verificam o build e a integração local. A preparação atual passou em **51/51 testes**, incluindo cinco novos testes de build, e gerou **42 arquivos públicos**, sem arquivos de ambiente ou vínculo `.vercel`; a verificação estática final ainda está em conclusão neste registro. Os testes do adaptador cobrem a mesma consulta de catálogo e criação/alteração de carrinho por Web Requests, incluindo JSON inválido, limite de corpo, origem e isolamento de credenciais. A autorização já foi concedida; a validação da função na infraestrutura Vercel e das rotas no domínio público permanece pendente de execução. Conferir catálogo/configuração, abertura direta das páginas, origens permitidas e ausência de credenciais nos assets/respostas. Catálogo vazio não comprova compra ou checkout real.

Referências oficiais consultadas em 14/10/2026: [runtime Node e assinatura fetch](https://vercel.com/docs/functions/runtimes/node-js), [configuração vercel.json](https://vercel.com/docs/project-configuration/vercel-json), [rewrites](https://vercel.com/docs/routing/rewrites) e [cabeçalhos estabelecidos pela Vercel](https://vercel.com/docs/headers/request-headers).
