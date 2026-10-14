# Shopify como backend comercial da Per Parte

**Pesquisa:** 14/10/2026. **Fontes:** documentação oficial Shopify consultada nesta data. **Escopo:** site próprio em HTML/CSS/JavaScript e servidor Node, catálogo, variantes, filtros, carrinho, checkout e contas. Este relatório distingue capacidade documentada, proposta de arquitetura e configuração comprovada; não comprova a ativação de uma integração por si só.

## Decisão e estado observado

**DECIDIDO pelo pedido de 14/10/2026:** adotar a Shopify como backend comercial e preparar Loja, páginas de produto, seleção de cores e acesso às contas. A escolha não transfere à Shopify a validação geométrica, elétrica ou industrial do configurador.

**OBSERVADO via MCP administrativo pela sessão principal**, comunicado ao pesquisador em 14/10/2026:

- Loja `cpegt6-2x`, sem produtos cadastrados no momento da consulta.
- Novas contas de cliente ativas. URL informada pelo admin: [Conta Per Parte na Shopify](https://shopify.com/102503383338/account).
- Confirmadas dezesseis definições de metafields de produto no namespace `perparte`, com leitura Storefront `PUBLIC_READ`. As onze originais foram preservadas: `dimensoes`, `materiais`, `cuidados`, `especificacoes`, `prazo_producao`, `brilho`, `difusao`, `tamanho`, `ambiente`, `criador`, `cores_criador`. A última é lista de texto; as demais são texto simples ou multilinha conforme o uso. Foram acrescentadas e relidas `historia_titulo`, `historia`, `ano_criacao`, `imagem_escala` e `legenda_escala`; a referência de escala é restrita a Image. Nenhum produto ou mídia foi criado nessa operação.
- O MCP administrativo não dispõe dos escopos necessários para gerar/consultar os tokens Storefront. Após falhas iniciais do Chrome, a sessão principal instalou Headless e criou a vitrine “Per Parte — Site” (ID `400845`), com token público guardado somente em `.env.local` ignorado pelo Git.
- Permissões da vitrine reduzidas a `unauthenticated_read_product_listings`, `unauthenticated_read_product_tags`, `unauthenticated_read_checkouts` e `unauthenticated_write_checkouts`.
- Criada a coleção automática “Todas” (handle `todas`, ID `520521777450`), com condições OR preço maior que zero ou igual a zero. Publicada somente no canal Headless (publication `322925068586`). Não foram criados produtos reais.
- Search & Discovery foi instalado; o app abriu iframe vazio, inclusive após recarregar, impedindo concluir a configuração dos filtros.
- Nome administrativo alterado para “Per Parte” pelo Chrome e confirmado depois por `get_shop_info`; domínio técnico preservado.
- Smoke real Storefront passou em nove operações com HTTP 200 e API retornada `2026-10`, catálogo vazio. O roteiro `apps/site/tests/shopify-real.mjs` valida mutations com `@skip(if: true)`, sem criar carrinho/pedido; não comprova compra ou disponibilidade de variantes. Treze testes de backend e nove de catálogo passaram.
- Navegador real confirmou Marco como estudo sem erro JavaScript e abertura do formulário oficial de conta, sem autenticar usuário. Fixture local confirmou troca de cor com imagem/preço/URL, bloqueio de combinação inexistente/esgotada, adicionar/ajustar/remover carrinho, filtro/limpeza, paleta visual e móvel de 390 px sem overflow. São dados de teste locais, não produtos criados na Shopify; catálogo e checkout reais ainda exigem validação.
- A revisão editorial ampliou o conjunto para 33 testes aprovados (13 backend, 14 catálogo, 6 adaptador Vercel), com `site:check` aprovado. O build passou antes do último ajuste CSS e sua repetição final estava em andamento neste registro. O schema de `vercel.json` foi aprovado; adaptador preparado sem deploy e runtime na Vercel ainda pendente. Capturas da revisão em `loja-ajustes-capturas/`; ver [ajustes Gantri](gantri-ajustes-2026-10-14.md) e [hospedagem](../../apps/site/HOSPEDAGEM.md).

**DESCONHECIDO neste relatório:** condições comerciais, pagamentos, frete, domínio público final e resposta Storefront com produto real preenchido. A consulta autenticada ao domínio técnico configurado já respondeu; um identificador do admin, sozinho, não substituiria essa validação.

## Arquitetura recomendada

**PROPOSTA técnica:** preservar o site atual e consumir GraphQL Storefront por uma camada Node. A API independe de framework; Hydrogen é opcional. O admin Shopify gerencia produtos, opções, imagens, valores e publicação, enquanto o site controla layout e interação. [Introdução à Storefront API](https://shopify.dev/docs/storefronts/headless/building-with-the-storefront-api/getting-started).

```text
Admin Shopify → catálogo publicado no canal Headless
                         ↓ Storefront API
Site Per Parte ← servidor Node → carrinho → checkoutUrl Shopify
       ↓
Conta hospedada Shopify; integração OAuth local em etapa própria
```

Fixar Storefront em `2026-10`, a versão estável mais recente verificada nesta data. `2027-01` é candidata de lançamento. Revisar a versão trimestralmente e não depender de `latest` em produção; versões estáveis têm pelo menos doze meses de suporte. [Versionamento oficial](https://shopify.dev/docs/api/usage/versioning).

| Necessidade | Integração recomendada | Limite relevante |
|---|---|---|
| Lista e detalhe de produtos | Storefront: produtos, coleções, imagens, variantes, SEO | Só o conteúdo disponibilizado ao canal/contexto |
| Cores e tamanhos | Opções e variantes reais | Cada combinação comprável precisa de variante |
| Filtros | Search & Discovery + `collection.products`/`search` | Fontes precisam estar configuradas e preenchidas |
| Carrinho | Storefront Cart API | Valores finais são recalculados pela Shopify |
| Pagamento | Redirecionar para `checkoutUrl` retornada | Pagamentos/frete dependem do admin |
| Conta e pedidos | Contas hospedadas; Customer Account API se houver sessão própria | Link externo não autentica o configurador |
| Cadastro/edição de catálogo | Admin Shopify; GraphQL Admin para automações futuras | Token Admin nunca no navegador |
| Produção sob medida | Serviço próprio futuro + referência no pedido | Shopify não gera mesh nem homologa fabricação |

A divisão da tabela é uma proposta Per Parte apoiada nas capacidades das [APIs Storefront](https://shopify.dev/docs/api/storefront/latest), [Customer Account](https://shopify.dev/docs/api/customer/latest) e [escopos administrativos](https://shopify.dev/docs/api/usage/access-scopes).

## Tokens, permissões e dados públicos

O canal oficial [Headless](https://apps.shopify.com/headless) gera tokens público e privado por storefront. Caminho: **Canais de venda → Headless → Create storefront/Add storefront**; depois **storefront → Storefront API permissions → Edit → Save**. Nome sugerido: “Per Parte — site”. O canal permite publicação, atribuição de vendas e rotação de credenciais. [Configuração inicial](https://shopify.dev/docs/storefronts/headless/building-with-the-storefront-api/getting-started), [gestão do canal](https://shopify.dev/docs/storefronts/headless/building-with-the-storefront-api/manage-headless-channels).

- Token público: pode ser usado no navegador com `X-Shopify-Storefront-Access-Token`.
- Token privado: somente servidor, com `Shopify-Storefront-Private-Token`. Em tráfego de compradores, encaminhar IP confiável com `Shopify-Storefront-Buyer-IP`; não confiar cegamente em cabeçalhos fornecidos pelo cliente.
- Token Admin, segredo OAuth e refresh token nunca entram em HTML, bundle, build estático ou Git.
- Acesso sem token existe para catálogo, busca, conteúdo e carrinho, mas não resolve as consultas com metafields/metaobjects/tags. O teto de complexidade 1.000 é documentado para acesso **sem token**, não como limite universal do modo autenticado. [Autenticação Storefront](https://shopify.dev/docs/api/storefront/latest).

Permissões mínimas propostas: `unauthenticated_read_product_listings`; `unauthenticated_read_checkouts`/`unauthenticated_write_checkouts` para carrinho; `unauthenticated_read_product_tags` apenas se houver consulta de tags; `unauthenticated_read_metaobjects` se forem consultados metaobjetos. `unauthenticated_read_product_inventory` só é necessário para quantidades como `quantityAvailable`, não para tratar `availableForSale`. Confirmar as permissões efetivamente concedidas. [Lista de escopos](https://shopify.dev/docs/api/usage/access-scopes).

Metafields exigem definição com `access.storefront: PUBLIC_READ`. A antiga mutation `metafieldStorefrontVisibilityCreate` foi removida em `2025-01`; não seguir exemplos antigos que ainda a recomendem. Storefront lê esses dados; escrever definições/valores é tarefa Admin. Expor somente informação editorial/comercial pública. [Metafields na Storefront](https://shopify.dev/docs/storefronts/headless/building-with-the-storefront-api/products-collections/metafields).

## Cadastro que alimenta o site automaticamente

**PROPOSTA:** a Loja consulta Shopify em runtime, com cache curto e explícito; páginas são resolvidas pelo `handle`. Assim, publicar um produto não exige editar um array no código nem reconstruir o site. “Automático” significa aparecer na próxima consulta após publicação/indexação e eventual expiração do cache; não prometer sincronização instantânea.

Fluxo editorial:

1. **Produtos → Adicionar produto**: título, descrição aprovada, mídia original, categoria/tipo e identificador de URL.
2. Preencher opções e variantes, cada uma com preço real, SKU e imagem pertinente.
3. Preencher os metafields definidos abaixo.
4. Tornar o produto ativo e habilitar **Publicação → gerenciar canais → Headless**. Conferir também mercado/catálogo aplicável.
5. Conferir publicação das variantes. Um produto publicado pode conter variantes ocultas; produto e variante precisam estar disponíveis no canal.
6. Abrir a Loja e conferir o detalhe, a cor, o preço, a disponibilidade e o carrinho.

Fontes: [cadastro e publicação de produtos](https://help.shopify.com/en/manual/products/add-update-products), [publicação de variantes](https://help.shopify.com/en/manual/products/variants/publish-variants).

Não cadastrar os estudos Marco/Duna/Farol como mercadorias compráveis apenas para preencher a interface. Até existir catálogo real, identificar a prévia conceitual e bloquear compra. Preço zero não significa preço pendente; estoque zero não significa automaticamente fabricação sob demanda. Essa política deve ser decidida no cadastro comercial.

## Contrato de dados proposto

Os nomes nativos da Shopify permanecem no transporte; a camada de domínio pode normalizá-los em pt-BR. Ausência de um campo opcional deve ocultar seu bloco, sem fabricar especificações.

| Informação no site | Fonte Shopify | Regra Per Parte |
|---|---|---|
| Identidade/rota | `Product.id`, `handle`, `title` | ID estável; rota por handle |
| Descrição/SEO | `description`, `descriptionHtml`, `seo` | Sanitizar HTML antes de renderizar |
| Categoria | `productType`, categoria taxonômica | “Mesa” inicialmente; não anunciar categorias inexistentes |
| Galeria | `images`/`media`, `featuredImage` | Mídia própria, alt text e dimensões |
| Opções | `options.name`, `optionValues.name` | Padronizar `Cor`; `Tamanho` somente se comercial |
| Variante | `variants.id`, `sku`, `selectedOptions` | Combinação exata, sem substituir silenciosamente |
| Preço | `variant.price.amount/currencyCode` | Formatar moeda retornada; não hardcode BRL |
| Disponibilidade | `variant.availableForSale` | Compra depende da variante, não só do produto |
| Imagem por cor | `variant.image` | Conferir que a mídia representa a escolha |
| Amostra | `optionValues.swatch.color/image` | Ausente → botão textual, sem inventar HEX |
| Dimensões | `perparte.dimensoes` | Texto de medidas homologadas |
| Material/cuidados | `perparte.materiais`, `perparte.cuidados` | Somente afirmações aprovadas |
| Especificações | `perparte.especificacoes` | Não confundir texto com validação industrial |
| Prazo | `perparte.prazo_producao` | Opcional até decisão comercial |
| Facetas | `perparte.brilho`, `difusao`, `tamanho`, `ambiente`, `criador` | Vocabulário estável, coerente entre produtos |
| Cores de criador | `perparte.cores_criador` | Lista editorial; não substitui variantes compráveis |
| História | `perparte.historia_titulo`, `perparte.historia` | Conteúdo próprio opcional; história em texto multilinha |
| Ano da criação | `perparte.ano_criacao` | Só ano cadastrado, sem inferência pela data atual |
| Imagem de escala | `perparte.imagem_escala`, `perparte.legenda_escala` | Referência a Image e legenda; imagem conceitual não comprova medidas |

`ProductVariant.image` pode retornar a imagem do produto quando nenhuma foi vinculada à variante. Portanto a presença de URL, sozinha, não prova que há uma foto específica da cor. [ProductVariant](https://shopify.dev/docs/api/storefront/latest/objects/ProductVariant).

O swatch nativo é `ProductOptionValueSwatch`: `color` e `image`, sendo `image` um `Media`. Para uma miniatura, consultar `image { previewImage { url altText width height } }`. [Swatch na API](https://shopify.dev/docs/api/storefront/latest/objects/ProductOptionValueSwatch).

Fragmento de consulta proposto, a validar com as credenciais reais:

```graphql
options {
  name
  optionValues {
    name
    swatch { color image { previewImage { url altText width height } } }
  }
}
variants(first: 50) {
  nodes {
    id sku availableForSale
    selectedOptions { name value }
    price { amount currencyCode }
    image { url altText width height }
  }
  pageInfo { hasNextPage endCursor }
}
```

Limitar a consulta não autoriza descartar variantes restantes: tratar paginação ou declarar o limite da interface. Uma mudança de cor resolve a variante exata, atualiza imagem/preço/disponibilidade/URL e mantém os demais atributos selecionados. Esta é a proposta funcional da Per Parte, não uma afirmação sobre a implementação interna da Gantri.

### Visualização de cor, escolha do produto e filtro

A paleta global flutuante muda a variante mostrada nos cards compatíveis, atualizando imagem, preço e link, sem reduzir a quantidade de produtos. Usa `visualizarCor` na URL e preferência de sessão; esse parâmetro não é enviado como filtro à Shopify. É visualização das cores reais dos produtos, não uma troca de tema ou paleta da marca. A seleção preserva os demais eixos, como tamanho/acabamento, e não cria variante nem usa imagem de outra cor quando falta mídia correspondente. O comportamento observado na Gantri e sua adaptação estão em [pesquisa Gantri](gantri.md).

Na página de produto, a opção **Cor** resolve a combinação exata que será adicionada ao carrinho. Já o filtro **Cor** da barra da Loja faz uma consulta ao catálogo e pode reduzir os resultados. São operações distintas: visualizar uma cor globalmente não significa aplicá-la como faceta.

A Shopify permite swatches ligados aos atributos de categoria e a metaobjetos. Isso pode centralizar nomes, cores e padrões, mas depende da categoria e de valores cadastrados. Uma lista textual `cores_criador` não produz automaticamente swatches nativos. [Cadastro de amostras de cor](https://help.shopify.com/en/manual/custom-data/metafields/category-metafields/using-category-metafields).

## Loja e facetas

**EXECUTADO nesta sessão:** coleção real “Todas”, handle `todas`, automática com **Preço > 0 OU Preço = 0**, sem condição de estoque. A inclusão de valor zero evita excluir produtos gratuitos da coleção; não autoriza cadastrar um preço pendente como zero. Usar `SHOPIFY_COLLECTION_HANDLE=todas`. A recomendação preliminar usava `all` e preço positivo; foi substituída pela configuração concreta. A Shopify documenta o padrão de coleção automática para controlar o catálogo. [Coleção do catálogo](https://help.shopify.com/en/manual/online-store/themes/customizing-themes/common-customizations/change-catalog-page).

A URL virtual `/collections/all` da loja temática não comprova a existência de uma `Collection` GraphQL com handle `all`. A implementação usa a coleção real criada: testar `collection(handle: "todas")`. A disponibilidade da coleção e a dos produtos são independentes. [Publicação de coleções](https://help.shopify.com/en/manual/products/collections/collection-settings).

| Consulta | Uso | Filtros |
|---|---|---|
| `collection(handle).products` | Loja e categorias | Argumento `filters: [ProductFilter!]`; retorna `filters` |
| `search` | Busca textual | Argumento `productFilters`; retorno `productFilters` |
| `products` na raiz | Lista global de contingência | `query`/ordenação; não equivale às facetas configuradas |

Usar `filters.values.input` devolvido pela Shopify, após parse/validação JSON, para montar novas consultas; não reconstruir IDs por texto. Preservar filtros/ordem/paginação na URL. Não filtrar apenas os primeiros 24 produtos no navegador e apresentar o resultado como catálogo completo. [Filtro de coleções](https://shopify.dev/docs/storefronts/headless/building-with-the-storefront-api/products-collections/filter-products), [busca](https://shopify.dev/docs/api/storefront/latest/queries/search), [produtos](https://shopify.dev/docs/api/storefront/latest/queries/products).

O app oficial gratuito [Shopify Search & Discovery](https://apps.shopify.com/search-and-discovery) está instalado; a configuração dos filtros ainda não foi concluída neste registro. Caminho: **Apps → Search & Discovery → Filters → Add filter → Source → Save**. Proposta de fontes: tipo de produto, preço, disponibilidade, Cor e os metafields editoriais brilho/difusão/tamanho/ambiente/criador. Não ativar recursos de IA no produto por causa da presença do app.

**Limite operacional observado em 14/10/2026:** a interface do app ficou vazia. A inspeção das 454 operações do tipo `Mutation` no schema Admin disponibilizado pelo MCP não encontrou mutação de configuração de filtros. A documentação oficial encaminha essa edição ao app; não foi identificada alternativa pública documentada. Não confundir consultas Storefront de facetas ou buscas salvas do Admin com edição da configuração. A Shopify também informou que grupos do Search & Discovery não são expostos no Admin API. [Guia oficial de facetas](https://shopify.dev/docs/storefronts/headless/building-with-the-storefront-api/products-collections/filter-products), [resposta da equipe Shopify](https://community.shopify.dev/t/fetch-search-discovery-filter-groups-via-api/7487).

A configuração aceita até 25 filtros; opções/metafields precisam existir e conter dados. Texto simples/lista é adequado para as facetas propostas; texto multilinha não é uma fonte genérica equivalente. Valores de grupos diferentes combinam como AND; vários valores do mesmo grupo normalmente combinam como OR. O frontend deve respeitar a configuração devolvida. [Configuração de filtros](https://help.shopify.com/en/manual/online-store/storefront-search/search-and-discovery-filters).

## Carrinho e checkout

Usar `cartCreate`, `cartLinesAdd`, `cartLinesUpdate` e `cartLinesRemove`. Cada linha envia o **ID da variante**, quantidade e atributos públicos pertinentes. Recuperar `checkoutUrl` e encaminhar o comprador à Shopify. Não construir URL de pagamento a partir de SKU nem tratar a adição ao carrinho como pedido concluído.

O ID de carrinho inclui uma chave secreta: preservar o valor completo, não registrar em logs nem retirar a query `key`. Tratar `userErrors`, alterações de preço/estoque, carrinho expirado e erros de transporte. Custos do carrinho são estimativas; contexto de país/moeda deve ser coerente com o checkout. [Guia do carrinho](https://shopify.dev/docs/storefronts/headless/building-with-the-storefront-api/cart/manage).

**PROPOSTA futura:** uma obra personalizada poderá enviar referência/snapshot validado como atributo ou vínculo a registro próprio. Isso não cria preço confiável nem arquivo de produção; fabricação/orçamento exigem contrato específico e validação servidor. Nenhuma compra de teste real é necessária para comprovar navegação até checkout.

## Contas: o que fica pronto em cada caminho

### Conta hospedada Shopify

Usar o botão **Entrar ou criar conta** com a URL já confirmada no admin. Contas atuais usam e-mail e código de seis dígitos; o primeiro login com e-mail novo cria o perfil. Não é preciso construir formulário próprio de senha/cadastro. [Comparação das contas](https://help.shopify.com/en/manual/customers/customer-accounts/upgrade/compare-features).

O endereço é copiado em **Configurações → Contas de cliente → URL**. Branding das contas compartilha configurações de checkout. Subdomínio próprio é opcional e depende da configuração de domínio. [URL de conta](https://help.shopify.com/en/manual/customers/customer-accounts/upgrade), [personalização](https://help.shopify.com/en/manual/customers/customer-accounts/customize).

**Limite da proposta:** a pessoa consegue entrar no portal Shopify, porém o site/configurador não recebe automaticamente uma sessão nem acesso às criações. Favoritos e criações continuam locais até integração explícita.

### Sessão integrada no site

Requer Customer Account API, habilitada em **Headless → storefront → Customer Account API settings**. Configurar client ID, tipo de cliente, permissões, callbacks, origens e logout. Apps públicos usam Authorization Code + PKCE; apps com backend podem usar cliente confidencial e sessão de servidor. Callbacks web exigem HTTPS: `localhost` e HTTP não são aceitos pelo guia oficial. Um túnel HTTPS pode servir ao teste. [Configuração Customer Account](https://shopify.dev/docs/storefronts/headless/building-with-the-customer-account-api/getting-started).

Consultar os endpoints de descoberta `/.well-known/openid-configuration` e `/.well-known/customer-account-api`. Implementar validação de `state`/`nonce`, PKCE S256, renovação e logout; restringir os retornos a URLs autorizadas. O escopo OAuth documentado inclui `openid email customer-account-api:full`. [Referência Customer Account](https://shopify.dev/docs/api/customer/latest).

**PROPOSTA de segurança:** tokens de cliente em sessão protegida no servidor, cookie HttpOnly/Secure/SameSite e nenhum segredo em `localStorage`. Não declarar OAuth concluído sem provar login, callback, sessão, renovação e logout no domínio de teste. O acesso hospedado é a opção operacional imediata enquanto o domínio público permanece em aberto.

## Evolução e limites

Consultas em runtime dispensam webhooks para o primeiro catálogo. Para cache persistente e integração de produção, webhooks de produto/pedido podem invalidar cache e criar tarefas internas. Validar HMAC sobre o corpo original, deduplicar por identificadores e tratar eventos fora de ordem; retorno do navegador após checkout não é confirmação confiável de pagamento. [Webhooks](https://shopify.dev/docs/apps/build/webhooks), [estrutura de entrega](https://shopify.dev/docs/apps/build/webhooks/delivery-structure).

GraphQL Admin é o caminho para futuras automações de produtos/pedidos. Não introduzir REST Admin novo; é API legada. [Orientação REST/Admin](https://shopify.dev/docs/api/admin-rest/usage/versioning).

### Nome administrativo da loja

A consulta ao schema Admin não encontrou `shopUpdate` nem operação equivalente para mudar o nome. O recurso REST `Shop` também é explicitamente somente leitura. O caminho oficial é **Configurações → Geral → Informações de contato da loja → clicar no nome da loja → Nome da loja → Salvar**. Alterar o nome não muda o domínio técnico `myshopify.com`. Após uma primeira tentativa com timeout, a sessão principal salvou “Per Parte” no Chrome; a consulta posterior `get_shop_info` confirmou o novo nome. [Nome e contato da loja](https://help.shopify.com/en/manual/intro-to-shopify/initial-setup/setup-business-settings), [limite do recurso Shop](https://shopify.dev/docs/api/admin-rest/latest/resources/shop).

## Verificação necessária para declarar conexão concluída

- [x] Instalar Headless, criar vitrine e registrar token público somente no ambiente local ignorado.
- [x] Confirmar domínio técnico na consulta Storefront real.
- [x] Executar smoke Storefront autenticado: nove operações HTTP 200/API `2026-10`, sem escrita nem exposição de credenciais.
- [x] Criar/publicar coleção real `todas` somente no Headless.
- [x] Conferir retorno Storefront não nulo para a coleção `todas`, com zero produtos.
- [x] Instalar Search & Discovery.
- [ ] Configurar filtros no Search & Discovery; conferir facetas com catálogo real.
- [ ] Publicar um produto aprovado com duas variantes e imagens correspondentes.
- [ ] Conferir nova inclusão/edição aparecendo no site após atualização, sem alterar código.
- [ ] Conferir filtros combinados, ordenação, paginação e URLs compartilháveis.
- [ ] Escolher uma cor, verificar SKU/ID/preço/imagem, adicionar quantidade e abrir checkout correto.
- [ ] Conferir indisponibilidade e erros sem fallback para compra fictícia.
- [x] Abrir a URL oficial de conta; formulário Shopify exibido, sem autenticar usuário nem criar sessão no site.
- [x] Conferir interface com fixture local: cor/imagem/preço/URL, bloqueios, carrinho, filtros, paleta, teclado e viewport de 390 px.
- [ ] Repetir cenários de variantes e checkout com produto real publicado; fixture não substitui comprovação comercial.

Os itens marcados registram configuração administrativa confirmada pela sessão principal; os demais são critérios pendentes de validação. Publicação do site e `git push` continuam sujeitos à orientação vigente “Publicamos depois”.
