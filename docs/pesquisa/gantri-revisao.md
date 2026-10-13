# Gantri — revisão de interações e composição

Data: 13/10/2026. A revisão responde ao pedido explícito de aproximar a composição e as interações visuais da [Gantri](https://www.gantri.com/) da landing Per Parte, incluindo navegação, menu, paleta e rodapé. As evidências foram obtidas no Chrome pela extensão do usuário e estão em `docs/pesquisa/gantri-revisao/`.

A reprodução visual pedida não confirma um catálogo comercial de cores Per Parte: disponibilidade, combinação de filamentos, preços, estoque e compra continuam fora desta etapa. Os valores Gantri abaixo são referência de interface e pesquisa; não substituem os tokens oficiais em `packages/design-system`.

## Evidências desta revisão

| Arquivo | Evidência observada | Alcance |
|---|---|---|
| `01-rodape.jpg` | Rodapé verde em largura total, chamada e campo de newsletter à esquerda, três colunas de links à direita, ícone social e amplo respiro | Captura parcial: a borda inferior corta conteúdo; não comprova o rodapé inteiro |
| `02-menu-loja.jpg` | Menu desktop de loja aberto sob a navegação: painel escuro translúcido arredondado, duas áreas de links, imagem promocional à direita, página desfocada ao fundo e indicador sob o link ativo | Estado aberto confirmado; gatilho, atraso e política de fechamento precisam de verificação de interação |
| `03-paleta-expandida.jpg` | Seletor de cores aberto e centralizado próximo à borda inferior, sobre a listagem; grade de 25 amostras e controle de fechar abaixo | Estado expandido; seleção de cor e suas consequências comerciais não foram estabelecidas pela foto |
| `04-paleta-recolhida.jpg` | Estado após selecionar Cobalt: controle compacto em pílula com amostra e nome; produtos visíveis aparecem azuis | Demonstra a aparência desse estado na Gantri; não define recoloração ou catálogo Per Parte |
| `05-rodape-wordmark.jpg` | Continuação abaixo dos grupos de links, textos legais à esquerda e wordmark Gantri branco em grande escala ocupando a largura | Complementa o rodapé parcial da captura 01; permite observar a hierarquia inferior sem atribuir medidas não capturadas |
| `paleta-medida.json` | Estilos computados das 25 cores, painel, grade e contêiner fixo | Valores do viewport e estado selecionados, não uma especificação completa do site |

O relatório inicial está em [gantri-reconstrucao.md](gantri-reconstrucao.md). A captura completa inicial tinha mídia de carregamento tardio ausente; essa ausência não deve ser reproduzida como espaço vazio intencional. As capturas 01 e 05 desta revisão mostram partes complementares do rodapé, incluindo seu wordmark amplo. A referência inicial de processo está em `gantri-capturas/04-processo-plant-based-desktop.jpg`; o comportamento exato por scroll exige evidência de interação, não apenas essa foto.

## Geometria e transições medidas da paleta

| Parte | Valor computado |
|---|---|
| Painel expandido | 272 × 168 px, padding 24 px, raio 16 px, fundo `rgb(28, 28, 28)` / `#1C1C1C` |
| Sombra do painel | `rgba(0, 0, 0, 0.25) 0px 8px 24px 0px` |
| Grade | 224 × 120 px, sete colunas de 24 px, gap de 8 px |
| Amostras | 24 × 24 px, raio 50%, sem sombra, sem padding |
| Contêiner externo | `position: fixed`, `bottom: 24px`, largura 272 px, altura 212 px |
| Alinhamento registrado | `left: 735.6px`, `transform: matrix(1, 0, 0, 1, -136, 0)` no viewport observado |
| Expansão do painel | `width`, `min-width`, `height`, `border-radius` e `padding`: 420 ms, `cubic-bezier(0.32, 0.72, 0, 1)` |
| Amostra de cor | `transform`: 180 ms com `cubic-bezier(0.32, 0.72, 0, 1)`; `border-color`: 180 ms |

**Inferência controlada:** deslocar o painel pela metade de sua largura sugere centralização horizontal. O número `left: 735.6px` depende da janela e não deve ser tratado como coordenada universal. A propriedade `position: relative` do painel é interna ao contêiner fixo.

**Limites:** os estilos registram propriedades de transição, não uma medição quadro a quadro da animação. Duração de hover/abertura do menu, comportamento ao rolar, duração do vídeo e política de seleção do catálogo não estão contidos nesse JSON. A sombra medida deste controle flutuante também corrige uma generalização: a referência usa pouca sombra, mas não é correto afirmar que toda a interface é sem sombras.

## As 25 amostras observadas

Nomes e RGB foram lidos no estado medido. HEX abaixo é conversão direta dos canais RGB, sem amostragem de screenshot ou aproximação visual.

| Nome na referência | RGB medido | HEX convertido |
|---|---|---|
| Blossom | rgb(203, 140, 123) | #CB8C7B |
| Canyon | rgb(161, 41, 40) | #A12928 |
| Carbon | rgb(46, 47, 49) | #2E2F31 |
| Cobalt | rgb(0, 58, 165) | #003AA5 |
| Lichen | rgb(249, 234, 100) | #F9EA64 |
| Lilac | rgb(205, 219, 252) | #CDDBFC |
| Magnolia | rgb(249, 202, 220) | #F9CADC |
| Manzanita | rgb(104, 47, 54) | #682F36 |
| Meadow | rgb(196, 205, 186) | #C4CDBA |
| Midnight | rgb(37, 65, 103) | #254167 |
| Mist | rgb(193, 198, 200) | #C1C6C8 |
| Mustard | rgb(209, 144, 0) | #D19000 |
| Olive | rgb(94, 103, 56) | #5E6738 |
| Peach | rgb(243, 207, 179) | #F3CFB3 |
| Persimmon | rgb(242, 125, 59) | #F27D3B |
| Poppy | rgb(225, 6, 0) | #E10600 |
| Sage | rgb(110, 152, 112) | #6E9870 |
| Sand | rgb(223, 213, 190) | #DFD5BE |
| Sedona | rgb(137, 67, 31) | #89431F |
| Smoke | rgb(131, 120, 111) | #83786F |
| Snow | rgb(241, 241, 241) | #F1F1F1 |
| Spruce | rgb(2, 69, 62) | #02453E |
| Stone | rgb(225, 219, 214) | #E1DBD6 |
| Sunrise | rgb(241, 189, 86) | #F1BD56 |
| Walnut | rgb(99, 81, 61) | #63513D |

## Tradução visual solicitada

- **Menu:** reproduzir a relação entre painel escuro, grupos de links, imagem lateral, página desfocada e link ativo, usando conteúdos e imagens Per Parte. Uma screenshot aberta não define sozinha o comportamento de hover ou foco.
- **Paleta:** usar geometria, disposição, expansão e amostras medidas como estudo visual explicitamente pedido. Não converter a seleção local em promessa de fabricação de uma cor nem em variantes comerciais homologadas.
- **Paleta recolhida:** a captura 04 mostra pílula com nome após seleção na Gantri. O círculo compacto de 48 px da implementação local é uma decisão registrada da revisão Per Parte; a dimensão não foi extraída dessa screenshot. As imagens Per Parte permanecem inalteradas após selecionar uma cor.
- **Rodapé:** manter a composição ampla, chamada curta à esquerda, colunas de navegação e wordmark de grande escala abaixo. Cores e voz devem seguir a Per Parte; newsletter não deve confirmar um envio enquanto não houver integração.
- **Campanha:** imagens originais de pessoas e luminárias Per Parte. Uma pose de dança em PNG continua estática; o vídeo permanece um requisito separado, registrado em [video-campanha-disponibilidade.md](video-campanha-disponibilidade.md).

## Matriz para revisão da implementação

Esta matriz define os estados a comprovar; não é uma lista de testes já concluídos.

| Área | Estados/interações a capturar | Evidência necessária |
|---|---|---|
| Navegação desktop | Inicial, scroll sobre imagem, scroll sobre área clara, menu aberto, troca de grupo, fechamento | Capturas com viewport e posição de scroll; operação por ponteiro e teclado |
| Navegação móvel | Menu fechado/aberto, foco, fechamento e retorno ao conteúdo | Capturas móveis e resultado das ações |
| Paleta | Fechada, expandida, amostra em hover/foco, seleção e fechar | Screenshots dos estados e verificação de transição sem inferir compra/estoque |
| Hero e campanha | Mudança de cena, pausa, recorte desktop/móvel; reprodução se houver arquivo de vídeo | Capturas em mais de um instante; assistir ao vídeo real para verificar dança |
| Processo | Todos os itens ativos, texto, foto e distribuição espacial | Captura após cada troca; verificar que mídias carregaram |
| Rodapé | Composição inteira, última linha, links e campo sem integração | Captura completa após scroll até o fim e checagem local dos controles |

A aproximação visual só pode ser julgada comparando os mesmos estados da referência e da implementação. Fotos isoladas não verificam hover, transições, scroll ou conteúdo cortado.
