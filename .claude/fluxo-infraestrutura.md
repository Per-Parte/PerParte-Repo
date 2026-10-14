# Fluxo: infraestrutura do monorepo

**Atualização:** 14/10/2026. **Estado:** três aplicativos locais com Node; site conectado à Storefront Shopify. Atualização de `main` e publicação do site em produção na Vercel autorizadas, ainda sem conclusão registrada. Shopify é backend comercial **DECIDIDO**; implementação vanilla/Node permanece **PROVISÓRIA**.

## Árvore e responsabilidades

| Área | Runtime/armazenamento | Responsabilidade |
|---|---|---|
| `apps/site` | HTML/CSS/JavaScript ESM, Node HTTP na porta 4174, Shopify remoto | Landing, Loja, produto, conta hospedada e carrinho |
| `apps/configurador` | HTML/CSS/JavaScript ESM, Node na porta 4175, `localStorage` versionado | Composição paramétrica SVG e rascunhos locais |
| `apps/quadro` | HTML/CSS/JavaScript, Node na porta 4173, IndexedDB | Quadro visual de contexto e anexos locais |
| `packages/design-system` | Gerador Node e artefatos CSS/JavaScript | Tokens derivados da revista, sem componentes |
| `docs/fonte` / `docs/pesquisa` | Arquivos locais | Fonte mestre, transcrição e pesquisas |
| `.claude` | Markdown e ADRs | Memória, decisões e fluxos |

A raiz usa npm workspaces. Não há framework React/Next.js nem banco próprio de aplicação. O site possui uma API comercial Node; o configurador e o quadro permanecem independentes e locais. Fontes da landing são assets locais em `apps/site/public/fonts`.

## Fluxo comercial

```text
Navegador Per Parte
  ├─ landing/assets ← servidor.mjs
  ├─ /loja, /produtos/:handle, /carrinho
  │      └─ /api/* → shopify-servidor.mjs → Storefront API 2026-10
  │                                         └─ checkoutUrl → checkout Shopify
  └─ /conta → portal hospedado Shopify

Admin Shopify → Headless → coleção todas → produtos publicados
Configurador local → localStorage/JSON; sem vínculo automático ao pedido Shopify
```

`shopify-servidor.mjs` expõe operações fechadas para lista/coleção/busca, detalhe e carrinho. Valida parâmetros, origem das mutations, tamanho das entradas e timeouts. Não aceita GraphQL arbitrário nem envia token Admin ao frontend. `catalogo.js` adapta variantes/opções e registro local; `comercio.js` controla as páginas. `vitrine.js` liga a coleção editorial ao catálogo remoto.

Os produtos são consultados em runtime. Facetas dependem de coleção e Search & Discovery; publicação de coleção não publica seus produtos automaticamente. Preço, imagem e disponibilidade devem corresponder à variante selecionada. Estudos não são mercadorias.

## Ambiente e credenciais

`apps/site/.env.example` é o modelo público. `apps/site/.env.local` e `.env.local` na raiz são ignorados pelo Git e carregados pelo servidor; variáveis do processo têm prioridade. Nunca copiar tokens para assets, HTML, logs ou documentação. A configuração pública `/api/loja/config` devolve capacidades e URL de conta, sem credenciais.

O token público Storefront está configurado para a vitrine “Per Parte — Site” e é mantido no servidor. A alternativa privada exige identificação confiável do IP do comprador; o servidor não confia em `X-Forwarded-For` arbitrário. `SITE_ORIGINS` é obrigatório em produção e deve conter as origens HTTPS exatas autorizadas.

A conta Shopify usa portal hospedado; OAuth próprio, sessão local e vínculo às criações continuam pendentes. Não confundir token de catálogo, token Admin e token de cliente.

## Domínio — configuração de 14/10/2026

O usuário solicitou vincular `perparte.com` à operação Shopify. Consulta pública confirmou `perparte.com` com A `216.198.79.1`, `www` com CNAME `ef9d90000741766f.vercel-dns-017.com`, nameservers `ns51.domaincontrol.com`/`ns52.domaincontrol.com` e MX `perparte-com.mail.protection.outlook.com`. Esses registros indicam site na Vercel, DNS GoDaddy e e-mail Outlook; a configuração efetiva do projeto Vercel não foi auditada nesta rodada. As afirmações de ausência de deploy abaixo se referem à preparação local anterior, não ao estado externo atual.

**CONFIGURADO:** raiz/`www` e email preservados; `checkout.perparte.com` conectado à Shopify usando CNAME `checkout` → `shops.myshopify.com`, TTL 3600, confirmado na GoDaddy e por consulta ao DNS autoritativo. O admin mostra destino Loja virtual, tipo Domínio primário e certificado TLS provisionado. HTTPS abre a página protegida `/password` sem erro de certificado. A propagação global ainda consta em andamento; isso não comprova uma compra. Domínio de conta é uma configuração separada, ainda pendente. Evidências e roteiro em `docs/integracoes/dominio-shopify.md`.

`SHOPIFY_STORE_DOMAIN` permanece `cpegt6-2x.myshopify.com` para a Storefront API. O site continua seguindo `cart.checkoutUrl` retornado pela Shopify. Configurar `SITE_ORIGINS` no ambiente de produção com `https://perparte.com,https://www.perparte.com` quando ambas as origens forem usadas; não alterar o MX nem substituir os apontamentos Vercel por instruções genéricas de loja hospedada Shopify.

## Build e publicação

`construir.mjs` copia landing e páginas comerciais para `apps/site/dist`. O comando de preview executa `servidor.mjs --dist`, preservando API e roteamento. Hospedagem apenas estática não basta para o comércio: é necessário runtime Node ou uma adaptação equivalente das rotas/API.

O adaptador Vercel está preparado localmente: `api/index.mjs` chama `apps/site/vercel-adaptador.mjs`, enquanto `vercel.json` define build, rewrites das páginas e `/api/*`. Ele reutiliza as validações da API sem abrir servidor HTTP persistente. Na rodada inicial, build, JSON schema e seis testes do adaptador passaram; o conjunto completo somou 28 testes aprovados. A execução desta versão na infraestrutura Vercel permanece pendente. Instruções de ambiente e publicação em `apps/site/HOSPEDAGEM.md`.

O pedido posterior de 14/10/2026 autoriza atualizar `main` e publicar em produção. Login isolado com `davi-2705` e inspeção autenticada confirmaram o projeto correto **`per-parte-website`** (`prj_ESzcls5GD5df0mcBVn7UUIetFFr1`), da equipe `per-parte1` (PerParte), com aliases `perparte.com` e `www.perparte.com`. O vínculo antigo de `dist` foi descartado como referência de destino. A configuração remota consultada ainda usa Root Directory `apps/site`, build `node construir.mjs` e saída `dist`; a mudança para raiz, `npm run site:build` e `apps/site/dist` é necessária para incluir a API e ainda aguarda confirmação.

A preparação atual passou em 51 testes, incluindo cinco de build; o build limpo gerou 42 arquivos públicos, sem `.env*` ou `.vercel`. A verificação estática final está em conclusão. Antes do envio, conferir também exclusão de logs/prévias privadas e o ambiente de produção. A retirada de `mcp-logs.txt` e `wa-logs.txt` do rastreamento Git está planejada, preservando os arquivos locais. Esses resultados locais não confirmam deploy desta versão.

O configurador gera build estático próprio. Quadro e configurador não precisam de Shopify para funcionar localmente. O servidor não hospeda arquivos de ambiente, código administrativo ou o restante do repositório.

A autorização atual substitui “Publicamos depois”; push e deploy desta versão ainda não foram confirmados neste registro. Validação pública do runtime, pagamentos, frete e operação industrial permanecem pendentes. Configurador e quadro continuam separados e locais; `RESEND_ENABLED=false` e a ausência de gatilhos de e-mail são preservados.

## Estado verificado

Headless e Search & Discovery instalados; vitrine e coleção automática `todas` configuradas, com publicação somente no Headless. Onze definições de metafields públicas e conta hospedada confirmadas. Catálogo sem produtos reais; nenhum produto fictício criado.

Smoke contra Shopify: nove operações com HTTP 200 e versão retornada `2026-10`, sem escrita. As mutations usam `@skip(if: true)` para validar schema sem criar carrinho/pedido; essa rodada não comprova uma compra. Treze testes de backend e nove de catálogo passaram. Navegador real conferiu estudo e formulário oficial de conta; fixture local conferiu variantes, filtros, carrinho, teclado e móvel de 390 px. Search & Discovery abriu iframe vazio, e a configuração das facetas permanece pendente. Roteiros em `apps/site/tests`; escopo e limites de cada rodada em `state.md`.

## E-mails transacionais próprios

Resend foi escolhido pelo usuário em 14/10/2026 (ADR 0006). O domínio `emails.perparte.com` está verificado na região São Paulo. O DNS usa TXT `resend._domainkey.emails`, CNAME `rsend.emails` → `rsend-sae1.forge.rmta.net` e `send.emails` → `send.forge.rmta.net`. Não habilitar recebimento por inferência: a caixa `davi@perparte.com` permanece na Microsoft e serve de reply-to.

`apps/site/emails/modelos.mjs` renderiza HTML/texto; `transporte.mjs` valida entradas e faz uma tentativa de envio com timeout e chave de idempotência por evento; `enviar.mjs` é a CLI interna, sem rota pública. A chave somente de envio e os remetentes ficam em ambiente de servidor ignorado. `RESEND_ENABLED=false` persiste até ativação deliberada; um teste autorizado usou habilitação só no processo e foi marcado DELIVERED pelo Resend. Não colocar chave no frontend nem ampliar seu escopo para consultar o painel.

A galeria `docs/emails` roda no loopback 4182, com allowlist de arquivos. Prévias privadas `.local/emails` ficam fora do Git/upload Vercel. Não existe integração automática com eventos Shopify ou do configurador, banco, fila ou registro persistente de envios; idempotência do Resend dura 24 horas e não substitui esses componentes. Novas contas e seus códigos continuam na Shopify. Guia e prova de entrega: `docs/integracoes/emails-transacionais.md`.

## Regra de extensão

ADRs 0003/0004 registram as escolhas reversíveis de site/configurador; ADR 0005 registra Shopify. Adicione workspace ou dependência entre site, configurador e produção somente com responsabilidade e contrato explícitos. A lógica de geometria/fabricação deve representar a mesma obra na prévia e no arquivo de produção (Revista pp. 7–8 e 14); Shopify não substitui esse requisito.
