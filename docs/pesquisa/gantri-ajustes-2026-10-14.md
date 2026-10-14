# Gantri — ajustes de produto, cor e conteúdo

**Data:** 14/10/2026. **Escopo:** segunda revisão da página de produto e da Loja. Fontes de referência: [Cantilever Floor Light](https://www.gantri.com/products/10095/cantilever-floor-light-by-louis-filosa?sku=10095-lg-sand) e [All Lights](https://www.gantri.com/shop/all-lights). Complementa [a pesquisa Gantri](gantri.md).

## Método e limites

As evidências abaixo foram observadas pela sessão principal em capturas e estados do navegador controlado por **CUA**, nas páginas Cantilever e All Lights. As medidas foram repassadas à implementação pela sessão principal. Não são resultados de uma execução do MCP Reverse Engineer Anything nem extração completa de todos os estilos ou viewports.

A metodologia da skill `reverse-engineer-anything` orientou a separação entre observação, interpretação e implementação. O MCP estava ausente; o usuário executou `rea setup --client codex --yes`, e a sessão principal confirmou `[mcp_servers.rea]` no `config.toml`, com Node e `rea.mjs mcp`. As ferramentas REA ainda não aparecem em `ALL_TOOLS` desta sessão. É necessário reabrir o Codex para carregar o registro; não repetir o setup. Instalação do registro não comprova execução do analisador. O histórico está em [rea-disponibilidade.md](rea-disponibilidade.md).

As observações OPEN 7 e 11 do log local foram consideradas: registrar estado e efeito da interação; distinguir paleta de visualização, filtro de catálogo e variante comprável. Uma captura estática não comprova o comportamento completo.

As capturas foram salvas em `docs/pesquisa/loja-ajustes-capturas/`:

| Grupo | Arquivos |
|---|---|
| Gantri — referência CUA | [Menu](loja-ajustes-capturas/gantri-menu-referencia.jpg), [Loja](loja-ajustes-capturas/gantri-loja-referencia.jpg), [produto](loja-ajustes-capturas/gantri-produto-referencia.jpg), [curadoria](loja-ajustes-capturas/gantri-curadoria-referencia.jpg) |
| Per Parte — Loja | [Desktop](loja-ajustes-capturas/loja-desktop.jpg), [320 px](loja-ajustes-capturas/loja-320.jpg), [cores em 320 px](loja-ajustes-capturas/loja-cores-320.jpg) |
| Per Parte — Duna | [Produto](loja-ajustes-capturas/duna-produto-desktop.jpg), [história](loja-ajustes-capturas/duna-historia-desktop.jpg), [tamanho](loja-ajustes-capturas/duna-tamanho-desktop.jpg) |
| Fixture local | [Curadoria em 320 px](loja-ajustes-capturas/curadoria-fixture-320.jpg); dados exclusivos de teste, sem cadastro comercial |

## Matriz de evidências e aplicação

| Componente/estado | Observado na Gantri | Aplicação na Per Parte | Limite |
|---|---|---|---|
| Cores — Creator choice | Os espaços de cada amostra permanecem em **58 × 32 px**. As cores fora da curadoria viram pontos de **8 × 8 px**, com `border-radius: 50%`. A transição de largura, altura e raio dura **0,3 s**, com `ease`. | Preservar a posição das cores; reduzir a amostra interna não curada sem retirar seu espaço da grade. | Não selecionar outra variante nem inventar curadoria para preencher o estado. |
| Barra flutuante de cores | Estado desktop medido com **836 × 56 px**, posição fixa a **24 px** do fundo, raio de **60 px**, fundo `rgba(38,38,38,.7)` e desfoque de **32 px**. | Reproduzir o tratamento visual e a posição; ajustar a largura ao viewport mantendo os controles acessíveis. | 836 px é a largura observada, não uma regra comprovada para todas as telas. |
| História da luminária | Conteúdo centralizado, com largura máxima de **640 px**. | Separar narrativa da descrição curta junto à compra; usar título e parágrafos próprios. | Não copiar a história, biografia ou autoria da Gantri. |
| Especificações / tamanho | Duas colunas: abas à esquerda, com texto de **32 px** no estado medido, e fotografia à direita. | Organizar os dados disponíveis e a imagem de pessoa com luminária nessa composição. | A foto conceitual existente não estabelece dimensões físicas. |

A visualização global de cor continua distinta do filtro Cor: o primeiro altera imagem, preço e link dos produtos compatíveis sem reduzir a grade; o segundo consulta o catálogo. A seleção de uma cor preserva os demais eixos da variante, conforme a matriz anterior em [gantri.md](gantri.md).

## Conteúdo e imagens disponíveis

O catálogo local possui uma composição conceitual por produto. Seus textos se apoiam na Revista de Marca e em [site-direcao-conteudo.md](../site-direcao-conteudo.md). Marco é a composição-base da revista; Duna e Farol são propostas. O crédito editorial é **Per Parte**, sem atribuir uma biografia ou um designer individual.

| Produto | Imagem existente para a seção Tamanho | Conteúdo visual |
|---|---|---|
| Marco | `apps/site/public/images/campanha-marco-orbita.png` | Pessoa sentada ao lado de Marco sobre um pedestal. |
| Duna | `apps/site/public/images/campanha-duna-jardim.png` | Pessoa sentada com Duna apoiada no colo. |
| Farol | `apps/site/public/images/campanha-farol-cenario.png` | Pessoa junto a Farol sobre um pedestal de azulejos. |

As três imagens têm **1536 × 1024 px**, são conceituais e já existiam no acervo; não foram geradas para esta revisão. Proveniência e manifesto em [site-imagens.md](../site-imagens.md). Legenda preparada: **“Imagem conceitual; proporções ilustrativas. Dimensões em definição.”**

Não há medidas homologadas nos três produtos locais, nem produto real cadastrado na Shopify nesta consulta. Números ilustrativos da revista ou parâmetros exploratórios do configurador não foram transformados em dimensões comerciais. Fundos violeta, verde e âmbar dos cards também não representam novas variantes da luminária.

## Contrato preparado e validação

`apps/site/catalogo.js` oferece `informacoesEditoriaisProduto(produto)`, com narrativa, crédito, seções opcionais, imagem/legenda de escala, curadoria e especificações preenchidas. `dimensoesProduto(produto)` lê `perparte.tamanho` ou `perparte.dimensoes`; ausência retorna texto vazio. Estudos têm dois parágrafos, rótulo “Composição em estudo”, ano vazio e apenas a cor original na curadoria. Nenhuma nova variante foi criada.

A consulta Storefront foi ampliada para `perparte.historia_titulo`, `historia` (texto multilinha), `ano_criacao`, `imagem_escala` e `legenda_escala`. Na conclusão administrativa, as cinco definições foram criadas e relidas com sucesso: todas `PRODUCT`, namespace `perparte` e acesso Storefront `PUBLIC_READ`. `imagem_escala` é `file_reference` restrito a Image. As onze definições anteriores foram preservadas, totalizando **dezesseis**. Nenhum produto nem mídia foi criado; o preenchimento desses campos continua opcional. Ausência não autoriza gerar narrativa, ano ou foto de escala para um produto remoto.

| Definição criada | ID confirmado |
|---|---|
| `historia_titulo` | `291170713898` |
| `historia` | `291170746666` |
| `ano_criacao` | `291170779434` |
| `imagem_escala` | `291170812202` |
| `legenda_escala` | `291170844970` |

`navegacao.js` e `navegacao.css` centralizam a navbar, seus ícones e estados para homepage e páginas comerciais. Entraram no build, na lista de arquivos públicos e na verificação da estrutura HTML montada. Essa unificação é uma decisão de implementação Per Parte, não uma descoberta sobre o código interno da Gantri.

**Verificado:** conjunto de **33/33 testes aprovado** (13 backend, 14 catálogo e 6 adaptador Vercel) e `site:check` aprovado. Os testes editoriais cobrem conteúdo ausente, não invenção de medidas/datas/cores, referência de imagem e URLs inválidas. Smoke remoto após a alteração da consulta: **9/9 operações HTTP 200, API `2026-10`**, sem escrita; mutations usam `@skip(if: true)`. O catálogo retornou zero produtos. Isso valida o schema, não um produto preenchido, escala física ou checkout real. Build e comparação visual finais desta revisão ainda estavam em andamento neste registro; o fechamento cabe à sessão principal.
