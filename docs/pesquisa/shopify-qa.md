# Verificação da integração Shopify — 14/10/2026

## Ambiente e alcance

- Site real local: `http://127.0.0.1:4174`, consultando a Storefront API da loja `cpegt6-2x.myshopify.com`.
- Fixture separada: `node apps/site/tests/fixture-loja.mjs`, porta 4180; catálogo e carrinho fictícios em memória, sem ler credenciais nem acessar a Shopify.
- Inspeção visual e interações pela ferramenta CUA no navegador integrado. Administração pelo Chrome do usuário e MCP Shopify.
- Nenhum produto, cliente, pedido ou pagamento de teste foi criado na loja real.

## Resultado

| Verificação | Evidência observada |
|---|---|
| Contrato real Shopify | Nove operações aceitas, HTTP 200, API 2026-10. Mutations com `@skip(if: true)`; não é teste de escrita/compra. Coleção `todas` acessível e vazia. |
| Produto sem cadastro real | `/produtos/marco` mostrou imagens locais, identificação de estudo e compra desabilitada; console sem erro. |
| Link da homepage | Alternar hero para Marco atualizou o `href`; clicar abriu `/produtos/marco`. |
| Conta | `/conta` levou à URL hospedada; Shopify exibiu “Fazer login ou criar uma conta”, e-mail e botão Continuar. Nenhum e-mail foi enviado. |
| Cor e variante na fixture | Brasa/Pequeno → Lago/Pequeno mudou imagem, R$ 120 → R$ 140 e URL para variante 90013/SKU TESTE-90013. Valores apenas de teste. |
| Combinações | Lago/Grande inexistente bloqueou compra e mostrou aviso. Brasa/Grande esgotado manteve preço fictício e botão indisponível. |
| Sacola | Adicionar criou uma linha; teclado alterou quantidade para duas e subtotal para R$ 240. Aumentar acima do limite fictício resultou em cinco e aviso; remover mostrou estado vazio. |
| Filtro Cor | Escolher Lago escreveu `variantOption` na URL; limpar removeu o filtro. |
| Paleta visual | Lago manteve uma composição na grade; alterou preço, imagem e link para a variante Lago, usando `visualizarCor=Lago`. Restaurar removeu a escolha. |
| Integração da homepage | Favoritar o produto da fixture exibiu-o no modal; busca consultou o catálogo e reabrir limpou o termo do link. Paleta Lago mudou preço/link e Restaurar voltou a Brasa. Nenhum erro no console; favorito fictício removido depois do teste. |
| Responsivo | Loja e produto em 390 × 844; homepage em 320 × 800, sem overflow horizontal. Capturas inspecionadas na sessão. |
| Validação automatizada | `site:check` passou. 28 testes passaram: 9 catálogo, 13 backend, 6 adaptador Vercel. A rodada de rede local requer execução fora do sandbox que recusa loopback com EACCES. |
| Hospedagem preparada | Build passou; `vercel.json` validado contra o schema oficial. Não houve vínculo de projeto, deploy ou push. |
| Nome da loja | Alteração para Per Parte salva no admin e confirmada pelo MCP; domínio técnico preservado. |

## Revisão visual adicional — 14/10/2026

Navbar única na homepage e no comércio, incluindo dropdowns, ícones e menu móvel. Loja com atalhos por categoria e vidro nos controles; paleta global compartilhada com a home; cards com nome/anel de cor e preço/tamanho. PDP com curadoria animada, história, seções editoriais, barra flutuante e imagem de pessoa com luminária.

| Verificação desta revisão | Resultado observado |
|---|---|
| Menu e categorias | Dropdown Luminárias contém categorias e composições; Escape fecha e devolve foco. No móvel de 320 px, submenu expande e Escape retorna a Abrir menu. Categoria De parede mostra zero estudos; Todas restaura os três. |
| Paleta compartilhada | Seleção Brasa mantém três cards e grava `visualizarCor`; reset remove a escolha. Fotografias de outras cores não são usadas como substitutas. Corrigido o hover inicial/reset que ficava oculto. |
| Cards no móvel | Indicador abre amostras. Corrigido popover que ultrapassava a esquerda: após correção, caixa entre x=16 e x=166 no viewport de 320 px. |
| Curadoria de produto | Fixture Brasa/Pequeno permanece selecionada após ligar Seleção do criador. Brasa encolhe para ponto de 8 px/desabilita; Lago permanece retângulo 58×32. Transição width/height/border-radius de 0,3 s observada. Selecionar Lago altera preço e URL para a variante 90013. |
| Barra flutuante | Aparece após galeria/painel; links levam às seções e Tamanho. CTA refletiu Lago/Pequeno a R$ 140 fictícios e adicionou uma unidade à sacola isolada. A sacola anterior da fixture havia expirado com o reinício; abrir a sacola informou a expiração e permitiu começar de novo. Item de teste removido ao terminar. |
| História e escala | Duna mostra texto autoral, seção de detalhes e foto conceitual com pessoa. Tamanho identifica dimensões em definição e proporções ilustrativas. |
| Responsividade/console | Loja e produto em 320 px: largura do documento 305 px com scrollbar, sem overflow horizontal; navbar, pills e barra inferior utilizáveis. Console consultado das páginas locais sem erros. Preferência por movimento reduzido conferida no código, sem nova simulação de sistema. |
| Backend editorial | Cinco definições criadas e relidas via MCP, todas PRODUCT/perparte/PUBLIC_READ; total16. `imagem_escala` restrito a Image. Nenhum produto ou mídia criado. |
| Validação técnica | 33/33 testes aprovados nesta revisão:14 catálogo,13 backend,6 adaptador. Smoke real:9 operações sem escrita aceitas. Verificação do site e build aprovados; revisão continua local. |

Capturas em `loja-ajustes-capturas/`: referência Gantri de produto, curadoria, menu e Loja; implementação Loja desktop/320, menu de cores320, Duna produto/história/tamanho e curadoria na fixture320. A captura da fixture mostra dados fictícios; não constitui catálogo comercial. Pesquisa detalhada em `gantri-ajustes-2026-10-14.md`.

## Limitações ainda abertas

### Prévia com os estudos existentes — atualização de 14/10/2026

Após autorização do usuário para visualizar o front com os produtos atuais, o MCP confirmou novamente zero produtos. `/loja` passou a usar os três estudos na grade principal enquanto o catálogo remoto está vazio. A verificação no navegador confirmou: três composições identificadas como estudo; filtro Brasa mostrando apenas Duna; mesmo resultado após recarregar o endereço filtrado; card abrindo `/produtos/duna`, com imagens existentes e compra desabilitada. `site:check` e build passaram nesta atualização. As tarefas de imagens por cor estão em `.claude/roadmap.md`, MID-01 a MID-07. Nenhuma geração de imagem ou escrita de produto foi executada.

### Comércio real

Search & Discovery foi instalado com autorização, mas a interface incorporada permaneceu vazia; recarga e acesso oficial externo também não permitiram concluir sua configuração. As definições dos metacampos já existem. As facetas reais precisam ser ativadas no aplicativo e verificadas com produtos aprovados preenchidos.

A loja não tem produtos publicados. Repetir variantes, filtros, atualização de catálogo e destino do checkout com o primeiro produto real. A fixture comprova comportamento da interface, não preço, estoque, frete, pagamento ou capacidade de fabricação reais. Login hospedado não cria sessão no configurador local. Publicação continua adiada.
