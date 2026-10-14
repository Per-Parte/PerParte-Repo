# Gantri — benchmark da Per Parte

**Pesquisa iniciada em 13/10/2026; ampliada em 14/10/2026.** Gantri é a principal referência de categoria, experiência editorial e confiança comercial, descrita na Revista de Marca pp. 4, 14–22 e 35–38. O levantamento inicial vem do [site oficial](https://www.gantri.com/), da [página de missão](https://www.gantri.com/about) e de medição da homepage em navegador (desktop 1689 × 1221; móvel 390 × 844). O complemento de 14/10 abaixo cobre produto, loja, navegação e troca de cores. São amostras de páginas e datas, não um design system oficial da Gantri.

## Posição e lição para a Per Parte

A [Gantri](https://www.gantri.com/about) apresenta iluminação feita sob demanda, com criadores creditados e remuneração por venda, material nomeado, processo de fabricação e promessas comerciais explícitas. Na Per Parte, a diferença de posicionamento é que a pessoa cria a obra no configurador. A revista recomenda aprender com a disciplina da Gantri — prova do processo, nome nas coisas, prazo e confiança — e manter autoria do cliente e uma marca mais vibrante (pp. 14–22).

## Extração automatizada

A skill **Extract Design System** executou `extract-design-system https://www.gantri.com/ --extract-only`. Os arquivos reproduzíveis estão em `gantri-extracao/.extract-design-system/`:

- `raw.json`: dados capturados pela ferramenta.
- `normalized.json`: paleta vazia, sem escala de raio ou sombra; a fonte foi identificada somente pelo nome interno `__buch_032087`. A escala de espaçamento detectada foi 2, 4, 5, 8, 12, 16, 24, 32, 48, 64, 72, 80, 128, 160 e 256 px, mas é uma frequência de CSS, não regra aprovada nem escala da Per Parte.

A homepage usa estilos dinâmicos, então a paleta vazia **não significa ausência de cores**. Medições abaixo complementam a extração. O extrator não gerou tokens da Per Parte e nada de Gantri foi importado para `packages/design-system`.

## Medições da homepage

| Elemento | Desktop | Móvel | Interpretação |
|---|---|---|---|
| Corpo | Söhne Buch/Helvetica, 15/22 px, peso 400 | Mesmo corpo na amostra | Leitura contida, sem peso excessivo |
| Primeiro `h1` | 36/48 px, 400, tracking −0,54 px | 36/48 px | Título de abertura sobre imagem |
| Primeiro `h2` editorial | 91/96 px, 400, tracking −2,73 px | 36/48 px, tracking −0,5 px | Hierarquia cresce muito no desktop |
| `h3` observado | 36/48 px, 400 | Variável por seção | Títulos regulares com respiro |
| Botão principal observado | raio 40 px; padding 12 × 24 px | raio 40 px; padding 12 × 24 px | Formato pílula |
| Logo no cabeçalho | SVG de wordmark 91 × 22 px, a 24 px da esquerda | SVG 80 × 19,6 px, centralizado | Presença pequena e nítida; cabeçalho mede 64 px no desktop |
| Verde de ação observado | `rgb(0, 133, 91)` = `#00855B` | Mesmo valor na amostra | Cor da Gantri, **não** token da Per Parte |

Contagem de estilos computados em cerca de 970 elementos da homepage desktop: raio `0px` em 886, `4px` em 52, `50%` em 17, `40px` em 12, `8px` em 2 e `12px` em 2; `box-shadow: none` em 956. Os poucos efeitos restantes eram brilhos **internos** suaves, sobretudo em camadas sobre imagem. Isso sustenta uma leitura minimalista na homepage, mas não define cada tela ou campanha. Os números podem mudar com a versão do site.

## Padrões visuais observados

- **Hierarquia:** fotografia e títulos grandes regulares carregam a abertura. O peso tipográfico discreto contrasta com a Unbounded mais assertiva, provisória na Per Parte.
- **Logo:** wordmark pequeno e legível no cabeçalho, sem competir com a imagem e a manchete. A Per Parte já possui regra própria de símbolo, respiro e escala (Revista pp. 31–34).
- **Interface:** muitos elementos sem raio e sem sombra, com pílulas reservadas às ações. A Per Parte prescreve fosco e sem sombra decorativa, mas seu raio de botões ainda não está decidido.
- **Prova de confiança:** a [missão oficial](https://www.gantri.com/about) explicita fabricação sob demanda, materiais, durabilidade, LED, garantia de três anos e devolução em 30 dias. Esses números são da Gantri; prazos e garantias da Per Parte continuam em aberto.
- **Nomes e autoria:** a Gantri credita designers e sua [Reference Series](https://www.gantri.com/gantri) explica diretrizes de fabricação. A Per Parte pode tornar visíveis os nomes dos criadores das partes e de quem compôs a obra, como determina a revista.

## Tradução prática para a Per Parte

| Aprendizado | Aplicação já apoiada pela revista | Evitar inferir |
|---|---|---|
| Um acento reconhecível | Luz Acesa sempre; Brasa em ação no lançamento | Copiar o verde Gantri |
| Manchete e produto em foco | Uma manchete curta; obra acesa como personagem | Copiar Söhne ou sua escala literalmente |
| Pouca decoração de interface | Fosco, sombra decorativa ausente, cor estrutural | Fixar todo raio em 40 px |
| Segurança de compra comprovável | Prazo honesto, material, processo e certificado | Anunciar garantia/prazo antes de validar |
| Autoria em cada página | Nome de quem criou a obra e das partes | Tratar a obra como desenho pré-selecionado de um designer |

## Limites da pesquisa

A extração automática inicial registrou só a homepage. As medições de 13/10 foram feitas nos elementos disponíveis em duas larguras, não em toda a jornada de compra. Não foram copiadas fontes, imagens, SVGs ou código da Gantri. Revise as páginas oficiais e repita a medição antes de usar números atuais em uma decisão nova.

## Complemento de 14/10/2026: produto, loja e cor

O usuário solicitou estudar a [página Cantilever Floor Light](https://www.gantri.com/products/10095/cantilever-floor-light-by-louis-filosa?sku=10095-lg-sand) e a [loja All Lights](https://www.gantri.com/shop/all-lights). A observação foi feita no Chrome, por controle de navegador da sessão. Houve capturas de produto em desktop de 1440 px e de loja em 1268 × 714 px. As capturas e os estados foram inspecionados durante a conversa; este complemento registra suas conclusões, sem atribuir identificadores de evidência REA a capturas do navegador. O diagnóstico da ferramenta está em `rea-disponibilidade.md`.

### Composição visual observada

| Área | Observação da referência | Adaptação Per Parte |
|---|---|---|
| Navegação | Faixa superior de aproximadamente 64 px; busca, conta e sacola em traços finos. A conta usa cabeça circular e corpo triangular. | SVG próprio, geometria explícita e mesma organização de ações; wordmark e tokens Per Parte. |
| Produto | Galeria à esquerda, próxima da metade da largura; miniaturas verticais e imagem principal ampla, seguidas de outras imagens. Painel de informações à direita acompanha a rolagem. | Galeria com miniaturas, ampliação e painel sticky no desktop; troca de imagem no móvel. |
| Escolhas do produto | Cor em amostras retangulares, sete colunas; grupos de todas as cores/escolha do criador; opções adicionais independentes da cor; preço e botão em pílula. | Opções reais Shopify; escolha do criador só quando cadastrada; combinações exatas entre os eixos. |
| Loja | Margens próximas de 24 px, breadcrumb, título e descrição com respiro; contador à direita. Barra de filtros em pílulas, densidade da grade e ordenação. | Categoria, Brilho, Difusão e Tamanho como grupos; valores e demais facetas vindos do catálogo. Não inventar especificações para preencher filtros. |
| Grade | Quatro colunas no estado observado; três controles de densidade. | Densidades desktop de duas, quatro e seis colunas; no móvel, uma ou duas. Esses números da implementação são decisões responsivas, não uma medição de todos os estados Gantri. |

As dimensões descritas como aproximadas foram estimadas das capturas. Não equivalem a uma extração de todos os estilos computados dessas páginas. Texto, fotos, fontes, garantias e condições comerciais da referência não foram transplantados para a Per Parte.

### Matriz de comportamento verificada

| Ação na Gantri | Antes/depois observado | Consequência para a implementação |
|---|---|---|
| Selecionar Cobalt na página de produto | A imagem trocou de Sand para Cobalt; o SKU na URL acompanhou a escolha. O acabamento da haste permaneceu independente. | Alterar somente o eixo Cor; resolver a variante exata preservando tamanho e acabamento; imagem, preço, disponibilidade e URL precisam apontar para a mesma variante. |
| Selecionar Cobalt no controle flutuante da loja | A contagem permaneceu **108 antes e 108 depois**. O endereço passou a carregar `?colors=cobalt`; imagens e links dos cards passaram à variante correspondente quando existente. | A paleta global é uma **visualização de cor**, sem reduzir a grade. Na Per Parte usa `visualizarCor` na URL e preferência de sessão; esse parâmetro não é encaminhado como filtro à Shopify. |
| Usar os controles de filtro da barra | São controles distintos da paleta flutuante, agrupados por Category, Brightness, Diffusion e Size. | Manter filtros de catálogo separados da visualização global. A semântica de combinação das facetas vem da Shopify, não de inferência sobre o contador da Gantri. |

O teste com contagem estável é a evidência que diferencia troca visual de filtro. O simples nome “Escolher cor” não determina a operação. Não foi inspecionado o código privado da Gantri nem comprovada sua arquitetura interna; mudança de URL e mídia permite reproduzir o comportamento observado sem presumir a tecnologia utilizada.

### Integridade da cor e limites da coleção

Uma variante sem imagem própria não autoriza reutilizar a foto de outra cor como se fosse a escolhida. A implementação mostra imagem pendente nesse caso. Uma combinação inexistente também não pode selecionar silenciosamente outro tamanho/acabamento para aparentar sucesso. Links com variante removida exigem nova escolha, em vez de assumir a primeira variante comprável.

Marco, Duna e Farol continuam estudos, sem preço ou compra. As imagens `categoria-marco-violeta.png`, `categoria-duna-verde.png` e `categoria-farol-ambar.png` mudam o **cenário**, preservando as cores dos objetos; portanto não viram variantes Violeta/Verde/Âmbar. Novas cores comerciais dependem de opções e imagens cadastradas na Shopify. A validação técnica com variantes de teste é separada do catálogo real.
