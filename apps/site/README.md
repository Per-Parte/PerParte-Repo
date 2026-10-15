# Site Per Parte

LP de captação selecionável e site completo preservado: landing editorial, Loja, páginas de produto, conta e carrinho. HTML/CSS/JavaScript ESM e Node nativo, sem framework de aplicação. Shopify é o backend comercial escolhido; a implementação vanilla/Node continua provisória. Imagens locais de Marco, Duna e Farol são estudos conceituais, sem compra.

## LP de captação

`PERPARTE_LP_ATIVA=TRUE` seleciona a LP com estrutura Springs e identidade Per Parte. `FALSE` ou ausência mantém o site completo; outros valores são recusados. Na Vercel, a variável foi criada com TRUE via MCP para Production, Preview e Development no projeto `per-parte-website`, equipe `per-parte1`. **Mudar o valor exige novo build/deploy.** No desenvolvimento, reiniciar `npm run site` após mudar o ambiente; a prévia de `dist` lê o modo gravado no build.

Os fontes originais permanecem intactos. No build LP, `captacao.html` é publicado nas entradas `index.html`/`comercio.html`, inclusive para links diretos de Loja/produto/conta/carrinho. Os módulos/estilos antigos de interface ficam fora do pacote e as APIs comerciais são recusadas. Com modo completo, `/api/captacao` é recusada.

O usuário escolheu **Resend Contacts, sem envio automático** e aprovou explicitamente a chave dedicada Full access, diante das opções sending/full disponíveis no Resend. `RESEND_CONTACTS_API_KEY` está cadastrada como sensitive na Vercel em Production/Preview; a chave de envio `RESEND_API_KEY` não é reaproveitada. Estas propriedades string foram criadas no Resend e verificadas via API:

| Propriedade | Valor registrado |
|---|---|
| `perparte_lp_origem` | `lp` |
| `perparte_lp_consentimento_versao` | `2026-10-14` |
| `perparte_lp_consentimento_em` | Instante ISO gerado no servidor |

`POST /api/captacao` recebe e-mail, nome opcional e consentimento explícito; valida origem em `SITE_ORIGINS`, campos, corpo e honeypot. Confirma sucesso após gravação/releitura do contato. Repetição com consentimento já registrado preserva sua data; opt-out existente não é revertido. A chave e os contatos não entram no frontend ou logs. `RESEND_ENABLED=false` permanece, pois cadastrar interesse não envia mensagem nem cria conta ou reserva.

Foram aprovados 77 testes, `site:check`, build TRUE com 35 arquivos e QA de 1440/390 px sem overflow, incluindo validação nativa e erro 503 sem chave. **LP publicada em [perparte.com](https://perparte.com)**, com `main` enviada até `8de190f` e deploy final READY. O formulário público gravou um contato sintético QA em `example.com`, confirmado com propriedades e opt-in pela API Resend, depois removido e verificado como ausente. O teste no deploy inicial usa o mesmo código de captação do final; não representa lead humano. Automações vazias e nenhum envio nesta etapa.

Prints em [perparte-lp-capturas](../../docs/pesquisa/perparte-lp-capturas/), incluindo sucesso móvel em produção; a pesquisa [Springs](../../docs/pesquisa/springs.md) inclui captura da extensão Chrome. Resultado completo em [state.md](../../.claude/state.md), operação/reversão em [HOSPEDAGEM.md](HOSPEDAGEM.md) e decisão no [ADR 0007](../../.claude/adr/0007-lp-captacao.md).

## Rodar

Na raiz: `npm run site`. Abrir `http://127.0.0.1:4174`.

| Rota | Conteúdo |
|---|---|
| `/` | LP com modo TRUE; landing editorial e produtos com FALSE |
| `/loja` | Catálogo, busca, facetas, ordenação e paginação |
| `/produtos/:handle` | Galeria, opções/variantes, informações e sacola |
| `/conta` | Acesso ao portal hospedado Shopify |
| `/carrinho` | Quantidades, remoção, subtotal e checkout |

As quatro rotas comerciais da tabela mostram a LP quando `PERPARTE_LP_ATIVA=TRUE`.

`npm run site:build` prepara os assets em `apps/site/dist`; `npm run preview --workspace @perparte/site` serve o build com o mesmo runtime Node. **Hospedar somente `dist` não fornece a API `/api/*`.** A publicação em [perparte.com](https://perparte.com) usa o adaptador `api/index.mjs` na Vercel. Atualmente a LP está ativa; as consultas comerciais conferidas na publicação anterior ficam bloqueadas nesse modo.

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
| `SITE_ORIGINS` | Obrigatório em produção: origens HTTPS exatas autorizadas a alterar carrinho ou cadastrar interesse, separadas por vírgula |
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
| `captacao.html`, `captacao.css`, `captacao.js` | LP, formulário e estados acessíveis de cadastro |
| `captacao.mjs`, `modo-captacao.mjs` | Resend Contacts, consentimento e seleção validada do modo |
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

A publicação usa `vercel.json` e `api/index.mjs` na raiz; instruções em [HOSPEDAGEM.md](HOSPEDAGEM.md). No registro histórico do site completo, `main` foi enviada até `fcd24a1`, com deploy READY no projeto `per-parte-website`, equipe `per-parte1` (PerParte), e aliases `perparte.com`, `www.perparte.com` e `per-parte-website.vercel.app`. Essa versão foi substituída pela LP registrada acima. A configuração remota usa raiz do repositório, Node 24.x, `npm run site:build` e `apps/site/dist`. `SITE_ORIGINS` é obrigatório e `RESEND_ENABLED=false` foi preservado.

Naquela publicação anterior, após a correção restrita da captura `rota` repassada pela Vercel, **53/53 testes** e `site:check` passaram. As páginas principais e as consultas públicas de configuração/catálogo retornaram 200; o catálogo real estava vazio. A Loja apresentou três estudos e o filtro Brasa abriu Duna, com compra desabilitada e sem erro registrado no console. Nenhum POST comercial foi executado em produção: a revisão automática de aprovação bloqueou o smoke de carrinho. Mutations comerciais foram verificadas apenas em testes locais. Versão, evidências e limites em [publicacao-vercel.md](../../docs/integracoes/publicacao-vercel.md).

Tokens compartilhados vêm de `packages/design-system`. Unbounded/Figtree são locais; rótulos usam Figtree Light 300. Wordmark e tipografia final seguem provisórios. Estrutura/interações Gantri orientam a referência, com conteúdo e assets próprios Per Parte.

A publicação e o envio de `main` substituem o adiamento anterior. O configurador continua separado e local; e-mails permanecem sem gatilhos e com `RESEND_ENABLED=false`. Ver [fluxo](../../.claude/fluxo-site.md) e [ADR 0005](../../.claude/adr/0005-shopify-backend-comercial.md).
