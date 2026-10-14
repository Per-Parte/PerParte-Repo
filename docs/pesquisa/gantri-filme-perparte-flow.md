# Filme Per Parte — pesquisa e produção no Flow

**Estado em 13/10/2026:** roteiro e referências preparados; geração e montagem dependem de acesso operacional à aba autenticada do Flow. O vídeo ainda não foi produzido nem incorporado ao site.

## Fonte consultada

- Filme **“Lighting is Boring”**, acessado pelo botão “Watch film” na página inicial da [Gantri](https://www.gantri.com/): [vídeo no YouTube](https://www.youtube.com/watch?v=hRdh0Us53So), duração de 43 segundos.
- A skill `baoyu-youtube-transcript` identificou legendas automáticas em inglês e português. A extração direta recebeu HTTP 429 do YouTube; o texto com timestamps foi conferido no painel **Mostrar transcrição** do próprio vídeo. As legendas automáticas contêm erros, então não foram tratadas como roteiro literal.
- Cenas conferidas durante reprodução: abertura urbana e bastidores de estúdio; pessoas criativas falando à câmera; detalhes de mãos, figurino, objetos e materiais; fundos saturados verde, azul e coral; luminárias acesas entre flores e em interiores; cortes rápidos, textura de filme e trilha rítmica.

### Estrutura narrativa observada

| Trecho | Função do filme de referência | Adaptação para Per Parte |
|---|---|---|
| 0–7 s | Abre com inconformismo e energia urbana | Uma ideia própria surge em espaço criativo |
| 7–16 s | Pessoas criativas definem sua forma de viver | Três personagens editoriais interagem com suas obras |
| 16–27 s | Luz atravessa arte, moda, cor e textura | Mãos, material fosco, partes, luz e figurino em primeiro plano |
| 27–35 s | Objetos ganham significado pessoal | Movimento corporal, interação com a peça e cenário surreal |
| 35–43 s | Fecha com a potência da luz | Hero das três peças e assinatura Per Parte |

Esta é uma peça **original da Per Parte**, inspirada no ritmo e na linguagem editorial da referência. Não reutilizar vídeo, áudio, voz, falas ou marcas da Gantri.

## Direção da marca

A Revista de Marca, pp. 16–17 e 44–47, prioriza a pessoa decoradora criativa, de 20 a 30 anos, interessada em moda, arte e decoração, e determina estúdio saturado com a luminária acesa como luz principal. O elenco das imagens da landing representa essa direção sem transformar idade, gênero ou aparência em restrição de casting. Manter expressões sérias, de editorial de moda. O vídeo mostra conceitos visuais; Duna e Farol ainda são propostas, e os produtos não são apresentados como peças homologadas.

### Referências visuais locais para enviar ao Flow

| Cena/personagem | Imagem da personagem | Imagem de produto para consistência |
|---|---|---|
| Duna, estúdio vermelho e flores | `apps/site/public/images/campanha-duna-jardim.png` | `apps/site/public/images/duna.png` |
| Marco, cenário verde e órbitas | `apps/site/public/images/campanha-marco-orbita.png` | `apps/site/public/images/marco.png` |
| Farol, cenário azul e pedestal de azulejos | `apps/site/public/images/campanha-farol-cenario.png` | `apps/site/public/images/farol.png` |

A imagem final da Farol tem a mão junto ao pedestal e anatomia corrigida; não usar o print antigo enviado no chat. Preservar rigorosamente a forma, a proporção, a cor e a textura de cada luminária. Não inventar filamento, preço, capacidade ou processo de fabricação.

## Roteiro original em português

Narração sugerida, voz brasileira natural e próxima, uma só voz em toda a montagem, sem sincronia labial. A música é instrumental original, com pulso crescente e espaço para a fala.

| Tempo de montagem | Narração | Imagem e ação |
|---|---|---|
| 0–7 s | “Tudo começa quando uma ideia encontra espaço para existir.” | Plano de estabelecimento de estúdio saturado; detalhe de mão escolhendo uma parte; corte para a Duna acesa e a personagem séria junto às flores. |
| 7–14 s | “Uma cor, uma curva, uma vontade de fazer diferente.” | Macro de superfície fosca e sombra; personagem Marco em pose editorial, orbitais cenográficos ao fundo; câmera circula lentamente a peça. |
| 14–21 s | “A gente mistura referências, testa caminhos, muda de ideia.” | Cortes de figurino, material e cenários; Farol acesa em azulejos azul-petróleo, personagem de cachos ruivos observa a luz. |
| 21–28 s | “Cada parte carrega uma escolha. Cada escolha deixa uma marca.” | Mãos posicionam peças não elétricas da luminária; detalhe de encaixes conceituais; dança curta e contida em torno da Farol, mantendo a peça firme e intacta. |
| 28–35 s | “Até a luz encontrar um jeito de ser só seu.” | Montagem de retratos sérios com Duna, Marco e Farol acesas; fundos vermelho, verde e azul; alternância com um interior afetivo. |
| 35–43 s | “Per Parte. Criado por você. Feito por partes.” | Três obras em composição original sobre cenário neutro; câmera se afasta; assinatura tipográfica adicionada na edição, sem texto gerado pelo modelo. |

## Plano de geração no Google Flow

Gerar **seis clipes curtos independentes**, formato paisagem 16:9, usando as imagens acima como ingredientes. A montagem final deve ter cerca de 43 s. Para os clipes, pedir imagem em movimento **sem fala e sem texto embutido**; adicionar narração portuguesa, música e assinatura na edição para manter voz, idioma e grafia consistentes. Caso o Flow permita uma faixa de narração única no projeto, usar o roteiro acima. Se não permitir, exportar os clipes e montar a faixa de voz fora do Flow. Não usar legendas automáticas como tradução literal.

### Instrução visual global para cada clipe

> Original premium editorial campaign film for Per Parte, a Brazilian creative lighting brand. Use the uploaded character campaign image as the exact identity, styling, facial features and set reference, and the uploaded lamp product image as the exact object reference. Serious high-fashion editorial expression, restrained body language, a vivid deep-color studio set, surreal but physically plausible props, warm illuminated lamp as the main practical light, matte 3D-printed material, subtle analog film grain, rich shadows, natural believable hand anatomy, cinematic handheld and dolly motion, short rhythmic inserts with occasional still portrait moments. The lamp must retain its exact silhouette, proportions, ribbing, base, color and light source in every frame. 16:9 horizontal. No logos, no writing, no captions, no subtitles, no watermarks, no new lamps, no extra fingers, no hand crossing through face or lamp, no shape morphing, no floating lamp, no visible electrical assembly or conductor.

### Ações por clipe

1. **Duna / ideia:** flores gigantes vermelhas e rosas, personagem em roupa magenta ao lado da Duna acesa; mão toca suavemente uma pétala; push-in com dois cortes de detalhe. Usar campanha Duna + produto Duna.
2. **Marco / cor:** estúdio verde, órbitas cenográficas; personagem em roupa listrada movimenta o corpo e olha para a Marco acesa; orbit pequeno de câmera, close na luz e na textura. Usar campanha Marco + produto Marco.
3. **Farol / forma:** estúdio azul e pedestal de azulejos; personagem ruiva de blusa amarela e calça azul muda de pose sem sorrir; câmera baixa revela a Farol acesa e a mão apoiada corretamente no pedestal. Usar campanha Farol + produto Farol.
4. **Partes / fazer:** detalhes de mãos humanas manipulando **somente partes externas não condutoras**, textura fosca e camadas, em mesa de estúdio Per Parte; objetos alinhados e a obra completa aparece acesa no corte final. Usar fotos de produto Duna/Marco/Farol conforme a ferramenta permitir; nenhum gesto deve sugerir montagem elétrica pelo cliente.
5. **Movimento / expressão:** personagem Farol faz uma dança editorial breve e contida em torno do pedestal, com passos e giro de ombro; a Farol permanece estável, acesa e legível. Cenário azul com esfera cenográfica; anatomia e produto coerentes em todos os quadros. Usar campanha Farol + produto Farol.
6. **Assinatura / luz própria:** montagem de retratos de Duna, Marco e Farol em seus respectivos cenários, seguida de três obras em composição própria sobre fundo de papel claro. Produzir planos separados se o modelo misturar identidades. Sem texto na imagem; adicionar “Per Parte / Criado por você, feito por partes” na edição.

## Critério de aprovação

Assistir aos seis arquivos antes de usar no site: rostos consistentes, mãos anatômicas, personagens com expressão editorial, cada luminária reconhecível e acesa, nenhum salto de cor ou formato, ausência de letras inventadas. Conferir a narração em português e o tempo final. Só então integrar o arquivo de vídeo real à landing; a imagem atual continua como poster até essa aprovação.
