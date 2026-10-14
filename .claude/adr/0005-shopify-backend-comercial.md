# ADR 0005 — Shopify como backend comercial do site

- **Data:** 14/10/2026.
- **Estado:** **DECIDIDO** para o backend comercial, por pedido explícito do usuário.
- **Implementação da interface:** HTML/CSS/JavaScript ESM e Node nativo continuam **PROVISÓRIOS** e reversíveis.
- **Relação com ADRs anteriores:** amplia o ADR 0003 com rotas comerciais e API; não altera o caráter local do configurador no ADR 0004.

## Contexto

O usuário criou a loja Shopify `cpegt6-2x` e pediu para conectá-la ao site, preparar catálogo automático, páginas de produto e Loja baseadas na referência Gantri, escolha de cores, carrinho e contas. A decisão comercial antes em aberto passa a ser Shopify para catálogo, variantes, carrinho e checkout. A implementação industrial da obra personalizada continua dependendo de contrato próprio.

A pesquisa oficial está em `docs/pesquisa/shopify.md`. A Storefront API pode ser consumida por qualquer cliente HTTP, sem obrigar migração para Hydrogen ou outro framework. A Customer Account API oferece sessão integrada, mas exige OAuth e endpoints HTTPS; um link ao portal hospedado tem escopo mais limitado.

## Decisão

Manter `apps/site` e ampliar seu servidor Node na porta 4174 com operações fechadas de Storefront GraphQL, versão `2026-10`. Credenciais ficam no ambiente do servidor, carregadas de `.env.local` ignorado pelo Git; nunca usar token Admin como token Storefront nem expor um proxy GraphQL arbitrário.

Criar `/loja`, `/produtos/:handle`, `/conta` e `/carrinho`. O catálogo comercial é consultado em runtime, sem duplicação manual de produtos no código. Produtos, preços, disponibilidade e imagens das variantes vêm da Shopify. Uma coleção real publicada e o Search & Discovery sustentam as facetas da Loja; o handle é configurável.

A cor comercial resolve uma variante exata e altera sua imagem, preço e disponibilidade. O seletor visual da landing não cria variantes. A prévia conceitual Marco/Duna/Farol permanece identificada e sem compra até haver produtos aprovados.

A observação posterior da Gantri definiu a paleta global como visualização das variantes nos cards compatíveis: muda imagem/preço/link sem reduzir a grade e preserva os demais eixos. `visualizarCor` é estado de apresentação; o filtro Cor da Loja é uma consulta distinta ao catálogo. Não é troca de tema da marca.

O carrinho usa IDs de variantes e as mutations Storefront. A finalização encaminha ao `checkoutUrl` devolvido pela Shopify. A adição ao carrinho não confirma pedido, pagamento nem produção.

Usar inicialmente as novas contas hospedadas Shopify, com botão “Entrar ou criar conta” e URL confirmada no admin. O portal atende autenticação por código de e-mail e consulta de conta/pedidos; não fornece automaticamente sessão ao site ou ao configurador. OAuth, sincronização de criações e associação dos rascunhos locais a clientes permanecem **EM ABERTO**.

## Configuração confirmada nesta sessão

Consulta administrativa via MCP encontrou zero produtos e novas contas ativas, com URL `https://shopify.com/102503383338/account`. Foram criadas onze definições públicas de metafields de produto no namespace `perparte`: dimensões, materiais, cuidados, especificações, prazo de produção, brilho, difusão, tamanho, ambiente, criador e cores de criador.

Até a redação deste ADR, Headless, token Storefront, coleção publicada e Search & Discovery ainda não estavam comprovados. A instalação foi autorizada pelo usuário, mas o acesso ao Chrome apresentou falhas. O MCP administrativo não forneceu os escopos Storefront necessários. Atualizações operacionais posteriores devem ser registradas em `.claude/state.md` e no relatório de pesquisa, sem reescrever esta decisão aceita.

## Consequências

- Adicionar/publicar um produto aprovado pode alimentar a Loja sem alteração de código; publicação de produto, variante, coleção e contexto de mercado precisam estar corretos.
- A hospedagem comercial precisa executar a API Node ou equivalente. Hospedar apenas os arquivos de `dist` não fornece `/api/*`.
- Uma configuração local incompleta mantém a prévia sem compra; falha da Shopify deve ser apresentada como falha, sem fabricar dados comerciais.
- O carrinho guarda um registro local versionado com ID e quantidade. Conteúdo inválido exige recuperação explícita; isso não sincroniza criações do ateliê.
- Search & Discovery requer dados/filtros configurados; um catálogo vazio não comprova facetas, seleção de variante ou checkout funcionando ao vivo.
- Condições de venda, pagamentos, frete, domínio e homologação dos produtos continuam pendentes. Nenhum preço, estoque, prazo ou certificação foi autorizado por inferência.
- A tecnologia do configurador e a integração industrial continuam independentes. Shopify não gera mesh, STL nem valida as guardas de segurança.

## Validação e publicação

Código e roteiro de testes estão preparados; registrar os resultados finais reais em `.claude/state.md`. Antes de declarar conexão concluída, comprovar consulta Storefront, catálogo/variante publicado, facetas, carrinho e destino do checkout com dados reais aprovados. Conta hospedada deve ser distinguida de OAuth integrado.

Publicação do site e `git push` continuam adiados pela orientação “Publicamos depois”.

## Atualização operacional de 14/10/2026

Após o registro inicial acima, Headless foi instalado e a vitrine “Per Parte — Site” criada (ID `400845`). Token público guardado em `.env.local` ignorado; escopos limitados a `unauthenticated_read_product_listings`, `unauthenticated_read_product_tags`, `unauthenticated_read_checkouts` e `unauthenticated_write_checkouts`. A coleção automática “Todas” (`todas`, ID `520521777450`) foi criada com OR preço maior que zero ou igual a zero e publicada somente no Headless (publication `322925068586`). Não há produtos reais. Search & Discovery/facetas e validação de catálogo/carrinho reais permanecem pendentes; smoke Storefront em andamento. A decisão arquitetural acima permanece a mesma.

Na sequência, Search & Discovery foi instalado, com filtros ainda em configuração. O smoke Storefront concluiu nove operações HTTP 200 com versão retornada `2026-10`, sem escrita: mutations usam `@skip(if: true)` e não criam carrinho/pedido. Treze testes de backend e nove de catálogo passaram. Catálogo vazio e schema aceito não comprovam compra nem produto preenchido. A QA final do navegador e a validação comercial continuam pendentes; nenhum deploy/push realizado.

O fechamento local acrescentou seis testes do adaptador Vercel, totalizando 28 aprovados, além de build/check e validação do JSON schema. O navegador conferiu estudo/portal oficial e a fixture local exercitou variantes, filtros, carrinho, teclado e móvel. Headless tem zero produtos reais; Search & Discovery ficou com iframe vazio e filtros pendentes. O adaptador foi preparado sem deploy, conforme `apps/site/HOSPEDAGEM.md`; runtime Vercel e checkout real ainda não foram comprovados.
