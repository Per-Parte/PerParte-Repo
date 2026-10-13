# Gantri → landing Per Parte

Pesquisa e adaptação: 13/10/2026. Fonte observada: [homepage oficial da Gantri](https://www.gantri.com/), aberta no Chrome pela extensão solicitada pelo usuário. Complementa [gantri.md](gantri.md). As capturas e os estilos computados são evidência do navegador; não são registros `Evidence` da REA. O diagnóstico da skill está em [rea-disponibilidade.md](rea-disponibilidade.md).

## Evidência e alcance

| Captura em `gantri-capturas/` | O que demonstra | Limite |
|---|---|---|
| `01-hero-desktop.jpg` | Abertura de campanha, cabeçalho, texto e ações sobre fotografia | Estado da abertura no momento da captura |
| `02-home-completa-desktop.jpg` | Ordem geral das seções, proporções e grandes intervalos de respiro | Captura inicial com imagens de carregamento tardio ainda ausentes; áreas cinzentas/vazias não são decisões de design |
| `03-ambientes-restore-desktop.jpg` | Seção de ambientes com fotografia, abas, texto inferior e botão à direita; cabeçalho branco fixo | Um estado selecionado, não todos os estados possíveis |
| `04-processo-plant-based-desktop.jpg` | Acordeão de processo à esquerda e imagem relacionada à direita | Um item expandido e sua imagem |
| `05-categorias-desktop.jpg` | Trilho de categorias com imagens, rótulos, título e setas circulares | A captura mostra os cartões visíveis, sem provar o conteúdo completo do trilho |
| `07-hero-mobile.jpg` | Título/ações na metade inferior da fotografia, miniatura inferior esquerda e pausa inferior direita | Um viewport móvel observado |
| `08-menu-mobile.jpg` | Menu sobreposto, fundo escuro translúcido com blur, contorno arredondado e links grandes | Estado aberto do menu móvel |

As capturas móveis e as medidas computadas foram verificadas durante a sessão principal. A reprodução parte desses estados visíveis e da estrutura da homepage; não houve auditoria de checkout, conta ou toda a navegação comercial.

## Comparação por seção

| Ordem | Estrutura observada na Gantri | Tradução para Per Parte | Estado da adaptação |
|---|---|---|---|
| 1 · Navegação | Wordmark compacto à esquerda, links centrais, ação em pílula e ícones à direita; cabeçalho acompanha o scroll | Marca Per Parte, âncoras para coleção, inspiração, processo e essência; busca e favoritas locais | PROPOSTA visual; identidade vem da revista |
| 2 · Abertura | Fotografia de campanha em largura total, pessoa/produto à direita, título e duas ações à esquerda; controles discretos e miniatura de produto | Cena Brasa com Duna, título curto, dois caminhos para coleção e essência, miniatura e alternância de cenas | PROPOSTA com imagem original gerada |
| 3 · Faixa curta | Linha horizontal de reconhecimento após o hero | Princípios da Per Parte: partes, impressão 3D, cor e personalidade | Adaptação editorial; nenhum selo ou reconhecimento inventado |
| 4 · Editorial | Título muito grande, espaço em branco amplo, três colunas com frases curtas e imagens | “Uma luz. Seu jeito.” com composição, textura e ambiente em três colunas | Estrutura observada; texto e imagens próprios |
| 5 · Ambientes | Título contido antes de grande fotografia; abas sobre a imagem mudam o contexto; texto inferior e CTA | “Habitar”, “Pausar” e “Criar”, com cenas de Duna/Farol e botão para o produto relacionado | Estrutura observada; nomes/cenas próprios |
| 6 · Coleção | Título de produtos populares, trilho de cartões, setas circulares e metadados discretos | Exatamente Marco, Duna e Farol; cards, paleta, detalhe visual e salvar local | Coleção em estudo; sem alegação de mais vendidos, preço ou venda conectada |
| 7 · Processo | Pequena introdução, três itens grandes de acordeão e foto contextual à direita; apenas um item expandido | Composição por partes, textura das camadas e presença no ambiente; imagem acompanha o item | Padrão observado; fatos sustentados pela revista |
| 8 · Campanha | Grande intervalo visual seguido de painel fotográfico escuro, título e CTA sobrepostos | Marco à direita em cenário vinho escuro; manifesto “A era do criar.” | Adaptação da marca, com fotografia conceitual |
| 9 · Categorias | Título, ação pequena, trilho horizontal de categorias com fotos e setas | Entradas para as três composições em vez de inventar linhas de piso/parede | Estrutura observada com catálogo reduzido ao escopo solicitado |
| 10 · Galeria | Trilho de ambientes com fotos e legendas curtas | Ambientes e detalhes dos três estudos de produto | Sem depoimentos, casas de clientes ou prova social fictícia |
| 11 · Essência | Bloco de missão em duas colunas, com imagem e texto/CTA | Visão Per Parte sobre autoria, formas, cor e impressão 3D | Conteúdo próprio baseado na revista |
| 12 · Dúvidas | Sem bloco equivalente confirmado nas capturas desta homepage | FAQ sobre marca, processo, imagens conceituais e lançamento | Acréscimo proposto para esclarecer o estado da coleção |
| 13 · Rodapé | Grande área colorida, marca, chamada e grupos de navegação | Brasa, chamada editorial e links internos úteis | Sem cadastro remoto, pagamento ou integração |

Busca, favoritas, painéis de detalhe e links internos são recursos locais do protótipo. A estrutura comercial prepara a apresentação das três luminárias; o pedido desta etapa não inclui checkout, cadastro ou conectores.

## Medidas observadas

Os pares abaixo são `font-size / line-height` em CSS px no viewport medido; descrevem o benchmark, não tokens aprovados da Per Parte.

| Elemento | Medida/comportamento observado |
|---|---|
| Hero | 36 / 48; no móvel também 36 / 48 |
| Grande título editorial | 91 / 96 no desktop; tamanho 36 no móvel |
| Título de ambientes | 36 / 48 |
| Título de coleção | 36 / 48 |
| Introdução do processo | 15 / 24 |
| Itens do acordeão de processo | 36 / 48 |
| Título de campanha | 52 / 64 |
| Cabeçalho | 64 px; acompanha o scroll; branco sobre conteúdo claro e transparente sobre fotografia |
| Menu móvel | Overlay escuro translúcido com blur, raio visual aproximado de 24 px e links de 36 px |
| Botões | Ações principais em pílula; setas de trilho em círculos |
| Fotografias e cartões | Predomínio de raio zero; algumas bordas de 4 px; sem sombra decorativa aparente |
| Abas de ambientes | Transições de `opacity` e `color` de 200 ms |
| Imagens alternadas | `opacity` de 200 ms com `ease-in-out` |

No móvel, título e CTAs do hero ocupam aproximadamente 50–80% da altura da cena. A leitura mantém imagem dominante, com controles próximos à borda inferior. Esse percentual descreve o enquadramento observado, não um breakpoint ou regra recuperada do código original.

## Movimento: observação versus proposta

- **OBSERVADO:** troca de ambiente por abas, troca de item/foto no acordeão, controles de trilhos e de hero, cabeçalho persistente, transições de opacidade/cor com os valores medidos acima.
- **NÃO MEDIDO:** intervalo de autoplay do hero, duração de vídeos/campanhas, curvas completas de cada animação, todos os efeitos em hover e todas as regras responsivas.
- **PROPOSTA Per Parte:** alternância automática de imagens geradas, pause/play, mudanças suaves de foto, realces em hover e entradas ao rolar. Os tempos definidos no código são escolhas desta implementação; não devem ser apresentados como valores extraídos da Gantri.
- **REQUISITO da implementação:** respeitar `prefers-reduced-motion`, oferecer pausa para movimento automático e manter teclado/foco/semântica das abas, acordeões, menus e diálogos.

## Identidade e conteúdo

A composição usa o ritmo editorial, a divisão dos blocos e as relações entre texto, imagem e ações da referência. Cores, tipografia, linguagem, luminárias e fotografias são da direção Per Parte: Luz Acesa, Brasa, famílias Marco/Lago, Figtree e Unbounded conforme o estado provisório descrito no design system.

As imagens da Gantri servem exclusivamente à pesquisa. O site usa oito arquivos originais gerados para esta sessão, listados em [site-imagens.md](../site-imagens.md). Marco é nomeada na revista; Duna e Farol e suas formas são propostas. As cenas não comprovam fabricação, certificação ou produtos disponíveis.
