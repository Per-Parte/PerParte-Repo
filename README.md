# Per Parte

**Criado por você, feito por partes.** A Per Parte começa por luminárias de mesa impressas em 3D sob demanda. A pessoa compõe ou inventa a obra no configurador; a fabricação começa depois da criação. A marca fala da autoria do cliente com acabamento premium acessível.

Este repositório foi reiniciado em 13/10/2026 para começar pela pesquisa, pelo contexto e pelo sistema visual. Reúne site editorial com Loja/produto/conta/carrinho Shopify, quadro de projeto e configurador local. A **LP de captação está ativa em [perparte.com](https://perparte.com)**, com `main` enviada até `8de190f` e deploy READY; o site completo permanece preservado para retorno por variável de ambiente. Resend Contacts guarda a lista sem envio automático. O catálogo comercial continua vazio; os estudos não podem ser comprados.

## Fonte de verdade

- [Revista de Marca, edição 01](docs/fonte/Per-Parte-Revista-de-Marca.pdf): documento mestre de visão, marca, público e direção de produto.
- [Texto extraído](docs/fonte/revista-texto-extraido.md): apoio para busca por página; imagens e tabelas devem ser conferidas no PDF.
- [Visão de projeto](.claude/project.md), [requisitos e estados](.claude/requirements.md), [estado da sessão](.claude/state.md) e [roadmap](.claude/roadmap.md): contexto operacional.
- [Design system](docs/design-system.md): regras visuais e de uso, com tokens importáveis em `packages/design-system`.
- [Gantri](docs/pesquisa/gantri.md): benchmark externo, medido em 13/10/2026.
- [Hairline](docs/pesquisa/hairline.md): pesquisa de fonte para desenho SVG e interação do configurador, em 14/10/2026.
- [Shopify](docs/pesquisa/shopify.md): pesquisa oficial, contrato de catálogo/variantes, contas e checklist de conexão.
- [E-mails transacionais](docs/integracoes/emails-transacionais.md): Resend, domínio verificado, modelos Per Parte e limites dos eventos de conta.
- [Publicação Vercel](docs/integracoes/publicacao-vercel.md): versão publicada, configuração, correção do roteamento, evidências e limites da validação em produção.
- [Direção da landing](docs/site-direcao-conteudo.md): conteúdo, três composições e distinção entre fonte da revista e propostas visuais.

## Monorepo

```text
apps/
  site/             Site editorial, vitrine e API Node para Shopify
  configurador/     Ateliê local com composição paramétrica SVG
  quadro/           Quadro visual interativo do projeto
api/                Entrada da função Vercel publicada para a API Shopify
vercel.json         Build, rewrites e cabeçalhos da publicação na Vercel
packages/
  design-system/    Tokens de cor, tipografia e regras; sem componentes
docs/
  fonte/            PDF mestre e transcrição pesquisável
  pesquisa/         Referências externas e método
  emails/           Galeria HTML/texto dos três modelos transacionais
  integracoes/      Configuração de domínio, Resend e evidências operacionais
.claude/            Contexto de trabalho, requisitos, estado, fluxos e decisões
```

Os workspaces npm estão declarados na raiz. Os três aplicativos usam Node nativo no desenvolvimento local; o site foi publicado com função Node na Vercel. Shopify foi escolhido como backend comercial do site; a implementação HTML/CSS/JavaScript ESM e Node é reversível. Sincronização e produção do configurador continuam em aberto; ele permanece separado e local.

## Executar localmente

| Comando na raiz | Resultado |
|---|---|
| `npm run site` | Site, rotas comerciais e API em `http://127.0.0.1:4174` |
| `npm run site:build` | Assets em `apps/site/dist`; comércio precisa também do servidor/API |
| `npm run site:check` | Sintaxe, IDs, âncoras, imagens e presença do modo de movimento reduzido |
| `npm run preview --workspace @perparte/site` | Prévia do build na porta 4174 |
| `npm run configurador` | Ateliê local em `http://127.0.0.1:4175` |
| `npm run configurador:build` | Build estático em `apps/configurador/dist` |
| `npm run configurador:check` | Verificações estáticas do configurador |
| `npm run configurador:test` | Testes de domínio e renderização |
| `npm run preview --workspace @perparte/configurador` | Prévia do build na porta 4175 |
| `npm run quadro` | Quadro em `http://127.0.0.1:4173` |
| `npm run tokens:verificar` | Consistência dos artefatos do design system |

### Site e Shopify

A **LP de captação publicada** usa a estrutura Springs com identidade Per Parte e foi desenvolvida somente em `main`. O site completo descrito abaixo permanece no código. Na Vercel, `PERPARTE_LP_ATIVA=TRUE` seleciona a LP; `FALSE` restaura o site após **novo build/deploy**. A variável foi criada via MCP nos três ambientes de `per-parte-website`, equipe `per-parte1`. Publicação, evidências e reversão estão em [LP na Vercel](docs/integracoes/lp-captacao-vercel.md) e no topo de [state.md](.claude/state.md).

O formulário usa **Resend Contacts, sem envio automático**, com e-mail, nome opcional e consentimento. Chave dedicada e propriedades estão configuradas; um contato sintético QA comprovou persistência pelo formulário público e API, sendo removido após o teste. Não representa lead humano, conta ou reserva. Nenhum e-mail foi enviado nesta etapa e `RESEND_ENABLED=false` permanece. Ver [ADR 0007](.claude/adr/0007-lp-captacao.md), [configuração](apps/site/README.md) e [operação na Vercel](apps/site/HOSPEDAGEM.md).

A página apresenta Marco, Duna e Farol com fotografias conceituais geradas, narrativa editorial, seleção de ambientes, acordeão, detalhes, busca, favoritos e menu móvel. A composição foi pesquisada na Gantri por capturas da extensão do Chrome e adaptada à marca Per Parte. Marco tem nome e composição-base na revista; Duna e Farol são propostas. Nenhuma imagem comprova um produto fabricado.

As páginas `/loja`, `/produtos/:handle`, `/conta` e `/carrinho` estão preparadas para catálogo e variantes Shopify. Cores comerciais alteram a variante selecionada, com imagem, preço e disponibilidade correspondentes; carrinho encaminha à URL de checkout devolvida pela Shopify. Sem token Storefront, o site apresenta estudos sem compra. Headless/token e coleção automática `todas` foram configurados; Search & Discovery está instalado, com filtros em configuração. Smoke real sem escrita passou em nove operações HTTP 200/API `2026-10`; a loja continua sem produtos reais, e compra/facetas ainda dependem de validação.

Para configurar, seguir [apps/site/README.md](apps/site/README.md) e copiar `.env.example` para `.env.local`, ignorado pelo Git. A API precisa continuar rodando: hospedar apenas `dist` não disponibiliza o comércio. O portal de conta Shopify foi confirmado; ele não cria sessão local nem sincroniza o configurador. Preço, prazo, frete, pagamento e condições comerciais aguardam definição. Veja o [fluxo do site](.claude/fluxo-site.md), a [decisão original do protótipo](.claude/adr/0003-site-visual-estatico.md) e o [ADR Shopify](.claude/adr/0005-shopify-backend-comercial.md).

Na publicação anterior do site completo, a correção de rota Vercel passou em **53 testes**; páginas e catálogo/configuração retornaram 200, com três estudos e filtro Brasa → Duna. Esses caminhos agora mostram a LP e as APIs comerciais ficam bloqueadas enquanto o modo está ativo. `SITE_ORIGINS` continua obrigatório. Nenhum POST comercial ou checkout real foi validado. Evidências históricas no [relatório de publicação](docs/integracoes/publicacao-vercel.md) e [domínio Shopify](docs/integracoes/dominio-shopify.md); operação atual em [HOSPEDAGEM.md](apps/site/HOSPEDAGEM.md).

### E-mails do sistema

Resend é o provedor dos avisos próprios. O domínio `emails.perparte.com` está verificado; o teste autorizado de boas-vindas para o titular foi entregue em 14/10/2026. Há três modelos com a identidade Per Parte: boas-vindas, orçamento disponível e atualização de pedido. O envio usa `apps/site/emails/transporte.mjs` somente no servidor, com HTML/texto, validação e idempotência.

Execute `npm run emails:preview` para abrir a [galeria local](http://127.0.0.1:4182); `npm run emails:gerar` regenera os exemplos fictícios. `npm run emails:enviar -- --ajuda` explica a CLI, que apenas gera prévia privada por padrão. Credencial e prévias privadas ficam fora do Git e do upload Vercel.

Os ambientes local e Production mantêm `RESEND_ENABLED=false`. Gatilhos automáticos e fila/histórico duráveis permanecem pendentes; publicar o site não ativou envios. O teste usou habilitação apenas no processo. Os códigos de autenticação continuam na Shopify. Ver [guia operacional](docs/integracoes/emails-transacionais.md) e [contrato dos modelos](docs/emails/README.md).

### Configurador

O ateliê abre sem login, inicialmente vazio. A pessoa escolhe Marco, Duna, Farol ou começa livremente, combina base/corpo/difusor, ajusta formas e dimensões, escolhe cores por parte e salva a composição. O painel mostra miniaturas do modelo, permite reabrir criações e destaca a composição mais recentemente criada como Nova. A tag permanece após recarregar e não muda ao editar uma obra antiga.

A peça usa desenho SVG paramétrico autoral inspirado no Hairline, com rotação por arrasto, cotas arrastáveis, zoom e controles de teclado. Os blocos de vidro discreto seguem o pedido do usuário. Presets, cores e dimensões são estudos; não constituem geometria homologada, mesh fabril ou arquivo STL.

Criações e rascunhos de pedido ficam no `localStorage` deste navegador/origem. Selecionar obras permite preparar, salvar e baixar um pedido local; nada é enviado à Per Parte. O login do configurador e sua ligação à conta Shopify, sincronização, orçamento e fabricação permanecem em aberto. Veja as [instruções do ateliê](apps/configurador/README.md), o [fluxo](.claude/fluxo-configurador.md) e a [decisão técnica](.claude/adr/0004-configurador-local-svg.md).

### Quadro

O quadro permite criar notas, links, decisões e cartões de arquivos, mover e conectar itens, pesquisar e importar/exportar cópias. Arquivos adicionados e edições ficam no navegador em que foram feitos; a exportação JSON serve para transporte e backup. Veja [instruções do quadro](apps/quadro/README.md).

## Estado das decisões

A revista diferencia decisões, propostas e pontos em aberto. Este repositório preserva isso: o PDF manda na direção da marca; os arquivos de contexto tornam a direção navegável; tokens derivados são marcados como provisórios quando a revista ainda pede validação.
