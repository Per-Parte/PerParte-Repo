# Site Per Parte

Landing editorial, Loja, páginas de produto, conta e carrinho. HTML/CSS/JavaScript ESM e Node nativo, sem framework de aplicação. Shopify é o backend comercial escolhido; a implementação vanilla/Node continua provisória. Imagens locais de Marco, Duna e Farol são estudos conceituais, sem compra.

## Rodar

Na raiz: `npm run site`. Abrir `http://127.0.0.1:4174`.

| Rota | Conteúdo |
|---|---|
| `/` | Landing editorial e acesso aos produtos |
| `/loja` | Catálogo, busca, facetas, ordenação e paginação |
| `/produtos/:handle` | Galeria, opções/variantes, informações e sacola |
| `/conta` | Acesso ao portal hospedado Shopify |
| `/carrinho` | Quantidades, remoção, subtotal e checkout |

`npm run site:build` prepara os assets em `apps/site/dist`; `npm run preview --workspace @perparte/site` serve o build com o mesmo runtime Node. **Hospedar somente `dist` não fornece a API `/api/*`.** A publicação autorizada na Vercel usa o adaptador `api/index.mjs`; execução e validação pública ainda estão pendentes.

## Configuração Shopify

Copiar `apps/site/.env.example` para `apps/site/.env.local`, preencher e reiniciar o servidor. O arquivo local é ignorado pelo Git e não é servido como asset. O servidor também aceita `.env.local` da raiz; variáveis já existentes no processo têm prioridade. Usar Node com `process.loadEnvFile` ou fornecer as variáveis diretamente ao processo.

| Variável | Uso |
|---|---|
| `SHOPIFY_STORE_DOMAIN` | Domínio técnico `*.myshopify.com` confirmado no admin |
| `SHOPIFY_API_VERSION` | Versão fixa `2026-10` |
| `SHOPIFY_STOREFRONT_PUBLIC_TOKEN` | Token público do canal Headless, mantido no servidor |
| `SHOPIFY_STOREFRONT_PRIVATE_TOKEN` | Alternativa privada; preencher apenas um dos tokens |
| `SHOPIFY_COLLECTION_HANDLE` | Handle da coleção real publicada no mesmo canal; vazio consulta catálogo geral |
| `SHOPIFY_CUSTOMER_ACCOUNT_URL` | URL copiada de Configurações → Contas de cliente |
| `SITE_ORIGINS` | Obrigatório em produção: origens HTTPS exatas autorizadas a alterar carrinho, separadas por vírgula |
| `PORT` / `HOST` | Padrão `4174` / `127.0.0.1` |

Não usar token Admin como Storefront nem colocar credenciais no JavaScript público. Com token privado, uma publicação atrás de proxy precisa capturar o IP do comprador a partir de um proxy confiável. O servidor atual ignora `X-Forwarded-For` recebido diretamente e envia o IP da conexão.

Setup: instalar Headless, criar storefront, habilitar permissões de catálogo/carrinho e obter token. Criar uma coleção automática real, publicar produtos/variantes/coleção e configurar filtros no Search & Discovery. O handle do exemplo é `todas`; se a coleção se chamar `all` ou outro nome, ajustar a variável. A URL virtual do tema `/collections/all` não comprova que existe essa coleção na API. Pesquisa e instruções completas em [Shopify](../../docs/pesquisa/shopify.md).

## Estado da conexão

Em 14/10/2026, a consulta administrativa confirmou zero produtos, novas contas ativas e dezesseis definições de produto `perparte` com acesso Storefront `PUBLIC_READ`: as onze originais (`dimensoes`, `materiais`, `cuidados`, `especificacoes`, `prazo_producao`, `brilho`, `difusao`, `tamanho`, `ambiente`, `criador`, `cores_criador`) e as cinco editoriais da seção abaixo. As onze originais foram preservadas. A URL de conta confirmada é `https://shopify.com/102503383338/account`.

Após falhas iniciais do Chrome, Headless foi instalado e a vitrine “Per Parte — Site” criada (ID `400845`). O token público fica em `.env.local` ignorado, com permissões de catálogo/tags e leitura/escrita de carrinho. A coleção automática “Todas” (`todas`, ID `520521777450`) usa OR preço maior que zero ou igual a zero e foi publicada somente no Headless (publication `322925068586`). Search & Discovery instalado; iframe vazio impediu concluir filtros. Smoke real passou em nove operações HTTP 200/API `2026-10`, sem escrita; mutations usam `@skip` e não comprovam compra. Treze testes de backend e nove de catálogo passaram. Navegador real conferiu estudo e formulário oficial de conta sem autenticar usuário; fixture local conferiu variantes, carrinho, filtros, teclado e viewport de 390 px. Catálogo preenchido e checkout reais permanecem pendentes. Consultar o topo de [state.md](../../.claude/state.md) para o escopo das rodadas.

Sem configuração Storefront, o catálogo fica em modo demonstração, com estudos sem preço e sem compra. Por autorização de 14/10/2026, uma Shopify conectada com catálogo vazio também mostra Marco, Duna e Farol na grade principal como prévia identificada, com filtros locais de categoria/cor, busca e ordenação por nome. O catálogo sem filtros é conferido antes de substituir um resultado vazio por estudos. Produtos publicados passam a ocupar a grade na consulta seguinte. Falhas de rede/credencial continuam visíveis como erro.

## Conteúdo editorial opcional

A consulta lê cinco metafields editoriais `perparte` cujas definições **foram criadas e relidas com sucesso no admin**, como `PRODUCT` e `PUBLIC_READ`. Eles complementam os onze campos originais, totalizando dezesseis. O preenchimento por produto continua opcional; nenhum produto ou mídia foi criado para preencher esses campos.

| Campo | Conteúdo esperado |
|---|---|
| `historia_titulo` | Título próprio da narrativa |
| `historia` | Texto multilinha; parágrafos separados por uma linha em branco |
| `ano_criacao` | Ano informado em quatro dígitos; nunca o ano atual por inferência |
| `imagem_escala` | `file_reference` restrito a Image; a query lê `reference` de `MediaImage` |
| `legenda_escala` | Legenda que esclarece o contexto da fotografia |

`informacoesEditoriaisProduto(produto)` normaliza narrativa, crédito, seções opcionais, escala, curadoria e especificações. `dimensoesProduto(produto)` devolve `tamanho` ou `dimensoes`, quando cadastrados. A interface deve escapar os textos antes de inserir HTML. História em rich text não faz parte deste contrato de texto simples.

Os estudos locais têm narrativa própria, crédito editorial Per Parte e campanhas existentes com pessoa e luminária; a legenda informa que as proporções são ilustrativas e as dimensões estão em definição. Materiais homologados, medidas e ano não foram preenchidos. A curadoria contém apenas a cor original representada; não cria variantes. Evidências e contrato em [gantri-ajustes-2026-10-14.md](../../docs/pesquisa/gantri-ajustes-2026-10-14.md).

## Comportamentos e limites

- Facetas, filtros ativos, ordenação e cursor vêm da API. Busca global aceita relevância/preço; não filtrar somente a primeira página no navegador.
- Cada opção comercial resolve uma variante real. Swatches, galeria, preço e disponibilidade acompanham a seleção. A paleta global atualiza imagem/preço/link dos cards compatíveis, preserva outras opções e não reduz a grade; o filtro Cor da barra é uma consulta distinta. Nenhum seletor cria variante ou filamento.
- O carrinho envia IDs de variantes, mantém registro local versionado e protege conteúdo ilegível até recuperação explícita. Seu ID completo contém uma chave e não deve ser registrado em logs.
- “Continuar para pagamento” usa `checkoutUrl` da Shopify. Preço final, frete e disponibilidade são confirmados no checkout; nenhum rascunho local do configurador é enviado automaticamente.
- A conta hospedada permite entrar/criar perfil na Shopify por código de e-mail. Não é OAuth integrado nem sincronização das criações. Integração própria exige domínio HTTPS e configuração Customer Account API.
- Hero, menus, abas, processo, favoritos locais e preferência por menos movimento continuam parte da landing. Os estudos preservam a identificação conceitual.

## Arquivos e verificação

| Arquivo | Responsabilidade |
|---|---|
| `index.html`, `styles.css`, `app.js` | Landing editorial e navegação |
| `navegacao.js`, `navegacao.css` | Navbar compartilhada, ícones, menus e estados entre homepage e comércio |
| `paleta.js`, `paleta.css` | Visualização global de cores nos produtos compatíveis |
| `comercio.html`, `comercio.css`, `comercio.js` | Páginas comerciais e interações |
| `catalogo.js` | Produtos/variantes, dados editoriais, medidas cadastradas, estudos e registro local do carrinho |
| `vitrine.js` | Integração da coleção editorial com o catálogo remoto |
| `shopify-servidor.mjs` | Operações GraphQL fechadas, validação e tratamento de erros |
| `servidor.mjs` | Rotas/API e lista permitida de assets públicos |
| `vercel-adaptador.mjs`, `../../api/index.mjs` | Adaptador local preparado para a função Vercel |
| `construir.mjs`, `verificar.mjs` | Build e verificações estáticas |
| `tests/shopify-servidor.test.mjs` | Contrato/erros da API com transporte simulado |
| `tests/catalogo.test.mjs` | Variantes, preços, URLs e persistência local |
| `tests/vercel-adaptador.test.mjs` | Contrato Web Request/Response e limites da função |
| `tests/shopify-real.mjs` | Smoke opt-in real sem escrita; mutations usam `@skip` |

Executar `npm run site:check`, `npm run site:build` e `npm run site:test` na raiz. Na revisão editorial atual, **33/33 testes passaram**: treze de backend, quatorze de catálogo e seis do adaptador Vercel; `site:check` também passou. Build e QA de navegador finais estavam em andamento neste registro. O smoke real é explícito: `node apps/site/tests/shopify-real.mjs`, com ambiente configurado, e confirmou novamente nove operações após a ampliação editorial. Consultar o fechamento em [state.md](../../.claude/state.md); schema aceito com catálogo vazio não comprova seleção/compra de produtos reais.

A publicação está preparada em `vercel.json` e `api/index.mjs` na raiz; instruções em [HOSPEDAGEM.md](HOSPEDAGEM.md). Build, configuração JSON e testes locais passaram nas rodadas registradas. O usuário autorizou atualizar `main` e publicar em produção na Vercel em 14/10/2026. A conta correta foi acessada e confirmou o projeto `per-parte-website`, da equipe `per-parte1` (PerParte), com os aliases `perparte.com` e `www.perparte.com`. A configuração remota ainda precisa usar a raiz do repositório para incluir a API; publicação desta versão e validação do runtime permanecem pendentes. A preparação atual passou em 51 testes, incluindo cinco de build, e gerou 42 arquivos públicos sem `.env*` ou `.vercel`. `SITE_ORIGINS` é obrigatório no ambiente de produção.

Tokens compartilhados vêm de `packages/design-system`. Unbounded/Figtree são locais; rótulos usam Figtree Light 300. Wordmark e tipografia final seguem provisórios. Estrutura/interações Gantri orientam a referência, com conteúdo e assets próprios Per Parte.

A autorização atual substitui o adiamento anterior de publicação e `git push`. O configurador continua separado e local; e-mails permanecem sem gatilhos e com `RESEND_ENABLED=false`. Ver [fluxo](../../.claude/fluxo-site.md) e [ADR 0005](../../.claude/adr/0005-shopify-backend-comercial.md).
