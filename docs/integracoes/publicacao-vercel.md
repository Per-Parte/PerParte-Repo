# Publicação do site na Vercel

**Estado em 14/10/2026:** site publicado em [perparte.com](https://perparte.com), com deploy **READY**, API Shopify respondendo e navegação de Loja/produto conferida em produção. O usuário autorizou atualizar `main` e publicar; essa orientação substituiu o adiamento anterior. Este relatório registra configuração, versão e verificações da publicação. Não registra uma compra concluída.

## Identidade e versão publicada

| Item | Evidência confirmada |
|---|---|
| Projeto | `per-parte-website` |
| ID do projeto | `prj_ESzcls5GD5df0mcBVn7UUIetFFr1` |
| Equipe | `per-parte1` — PerParte |
| Código enviado para `main` e publicado | `fcd24a1` |
| Deploy | `dpl_CyPYKP68Mbm9JHfg7Znqy8ZQQqxj`, estado `READY` |
| URL do deploy | [per-parte-website-421y0l1il-per-parte1.vercel.app](https://per-parte-website-421y0l1il-per-parte1.vercel.app) |
| Aliases | [perparte.com](https://perparte.com), [www.perparte.com](https://www.perparte.com), [per-parte-website.vercel.app](https://per-parte-website.vercel.app) |

O commit de fechamento documental é posterior e não está incluído nesse hash. Um commit que altere somente esta documentação não exige novo deploy do código já validado.

## Configuração aplicada

O projeto passou a usar a **raiz do repositório**, Node.js **24.x**, build `npm run site:build` e saída `apps/site/dist`. A configuração anterior apontava diretamente para `apps/site` e não incluía a função `api/index.mjs` da raiz. O preset é Other; `vercel.json` mantém os rewrites das páginas e da API.

Foram cadastradas **12 variáveis no ambiente Production**, com credenciais protegidas no servidor. `SITE_ORIGINS` é obrigatório e limita as origens HTTPS que podem alterar carrinho. `SHOPIFY_STORE_DOMAIN` continua sendo o domínio técnico `cpegt6-2x.myshopify.com`; o domínio de checkout não o substitui. `RESEND_ENABLED=false` permanece em produção, sem gatilhos de envio. Os valores de credenciais não fazem parte deste relatório.

O build monta somente os assets da lista permitida em um diretório temporário, valida o resultado e então substitui `dist`. A rodada de preparação gerou 42 arquivos públicos, sem `.env*` ou vínculo `.vercel`. Os arquivos `mcp-logs.txt` e `wa-logs.txt` deixaram de ser rastreados pelo Git e estão ignorados; não integram o pacote público. O configurador e o quadro continuam separados e locais.

## Correção do HTTP 400 na API

O rewrite `/api/:rota*` encaminha a requisição à função com `__rota`. Na Vercel, a captura nomeada também chegou como parâmetro `rota`. A validação fechada da API reconhecia os filtros comerciais e recusava esse parâmetro adicional, produzindo HTTP 400 na consulta de produtos.

A correção em `apps/site/vercel-adaptador.mjs` é restrita ao metadado de roteamento: aceita no máximo uma captura `rota`, exige que ela corresponda à rota permitida e remove `rota`/`__rota` antes de chamar a API. Captura conflitante ou repetida é recusada com 404. Parâmetros comerciais desconhecidos ou repetidos continuam inválidos; os filtros, cursores e a rota de produto são preservados. A API não passou a aceitar parâmetros arbitrários.

Após a correção, **53/53 testes** e `npm run site:check` passaram. Dois testes adicionais cobrem a captura nomeada válida e a recusa de captura conflitante/repetida, sem perder a validação de filtros. Os testes locais também exercitam corpo, origem, limites e operações de carrinho com transporte simulado.

## Verificação HTTP em produção

As consultas abaixo foram feitas por GET na versão publicada:

| Caminho | Resultado | Interpretação |
|---|---|---|
| `/`, `/loja`, `/produtos/marco`, `/conta`, `/carrinho` | 200 | Páginas e abertura direta das rotas disponíveis |
| `/api/loja/config` | 200, modo `shopify` | Runtime configurado para Shopify |
| `/api/produtos?limite=24` | 200, modo `shopify`, quantidade 0 | Catálogo remoto acessível e vazio |
| `/api/produtos?limite=24&cor=Lago` | 200, modo `shopify`, quantidade 0 | Consulta com filtro aceita; não comprova variante real |
| `/api/produtos/marco` | 404 | Esperado: Marco é estudo local, não produto cadastrado na Shopify |
| `/.env.local`, `/.vercel/project.json`, `/docs`, `/emails/transporte.mjs` | 404 | Esses caminhos privados/de desenvolvimento não foram servidos |

A página `/produtos/marco` responder 200 e seu endpoint remoto responder 404 são estados coerentes: a interface apresenta o estudo conceitual local, sem preço ou compra. O catálogo real está vazio; por autorização anterior do usuário, a Loja apresenta os três estudos até existirem produtos publicados.

## Verificação no navegador de produção

Em `/loja`, o navegador mostrou **três estudos**, sem erro de catálogo. O filtro **Cor → Brasa** reduziu a grade a **uma composição, Duna**. O clique abriu `/produtos/duna`, com título “Duna — Per Parte”; história, galeria, especificações e seção de escala renderizaram. O botão de compra ficou desabilitado por se tratar de estudo. O console dessa navegação não registrou erros.

Capturas: [Loja publicada](capturas-producao/loja-publicada.png) e [produto publicado](capturas-producao/produto-publicado.png). A foto de escala é conceitual e não comprova medidas ou fabricação. A rodada não representa uma nova auditoria de todos os viewports nem de todas as interações; as verificações locais anteriores continuam registradas separadamente.

## Limites e próximos passos

A revisão automática de aprovação bloqueou a tentativa de smoke de carrinho em produção. **Nenhum POST foi executado em produção nesta rodada**; o smoke público ficou restrito à leitura. As mutations foram verificadas em testes locais com transporte simulado. Não declarar criação/alteração de carrinho ou compra real em produção com base nesses resultados.

Continuam pendentes: cadastrar produtos/variantes e mídias aprovados, concluir e validar facetas com catálogo real, conferir o percurso comercial de carrinho/checkout e condições de pagamento/frete. A conta permanece hospedada na Shopify, sem sessão integrada no configurador. Os modelos Resend e o teste único entregue não constituem automação; webhooks, eventos, persistência de envio e ativação dos gatilhos continuam pendentes.

Roteiros relacionados: [hospedagem](../../apps/site/HOSPEDAGEM.md), [domínio Shopify](dominio-shopify.md), [e-mails transacionais](emails-transacionais.md) e [fluxo do site](../../.claude/fluxo-site.md).
