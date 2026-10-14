# Revisão visual da landing — 13/10/2026

## Revisão artística posterior — concluída e verificada

Direção estética aprovada pelo usuário: expressões individualizadas, figurinos dramáticos/artísticos e cenários surrealistas coloridos a partir de três referências Gantri. Preservar os três produtos Per Parte como referência das gerações; as imagens permanecem estudos conceituais. Ver `direcao-artistica-imagens.md`.

Orientação posterior do usuário: mudar somente as personagens das três campanhas para adequação à persona da revista (pp. 16–18), preservando cenário, câmera e luminária. Esse refinamento foi gerado e inspecionado. Idade/atitude e estilo pessoal orientam o casting; gênero, etnia e aparência escolhidos não são requisitos demográficos da fonte. As quatro inspirações permanecem preservadas.

- [x] Gerar e integrar três novas imagens de campanha.
- [x] Refinar apenas as personagens das três campanhas conforme a última orientação e conferir os novos originais/hashes.
- [x] Gerar e integrar quatro imagens de inspiração, ampliando a galeria para oito cards.
- [x] Conferir dimensões, hashes/originais e manifesto dos 17 PNGs, mantendo os dez anteriores.
- [x] Conferir recortes, leitura, consistência de produto e carregamento no site desktop/móvel; repetir verificações técnicas adequadas à alteração.

### Evidência desta revisão artística

| Verificação | Resultado | Capturas em `pesquisa/perparte-capturas/` |
|---|---|---|
| Campanhas desktop | Duna e Farol conferidas no Chrome pela extensão em 1482 × 734; Marco no navegador integrado em 1280 × 720 | `13-campanha-duna-persona-desktop.jpg`, `14-campanha-marco-persona-desktop.jpg`, `15-campanha-farol-persona-desktop.jpg` |
| Galeria | Oito cards; quatro novas imagens carregadas; seta avançou `scrollLeft` de 0 para 339; card do trio levou a `#colecao` | `16-galeria-artistica-desktop.jpg`, navegador integrado 1280 × 720 |
| Campanhas móveis | Três heros em 390 × 844, rostos/luminárias inteiros, fundos corretos e sem overflow horizontal | `17-campanha-marco-persona-mobile.jpg`, `18-campanha-duna-persona-mobile.jpg`, `19-campanha-farol-persona-mobile.jpg` |
| Três personagens finais | Três cards abaixo do hero e navbar conferidos juntos | `20-tres-personagens-final.jpg`, navegador integrado 1280 × 720 |
| Verificações técnicas | `npm run site:check`, `npm run site:build` e `git diff --check` passaram; console do navegador integrado sem erros | Resultados da revisão final das imagens |

Parte do QA usou o navegador integrado isolado porque houve navegação externa simultânea no Chrome. As capturas informam a superfície realmente usada; não foram todas produzidas pela extensão. Os arquivos individuais e seus hashes foram conferidos antes da revisão renderizada. A alteração não adiciona funcionalidade comercial nem geração de vídeo.

O vídeo segue adiado pelo usuário; essa rodada produz imagens estáticas. O seletor de cor não deve recolorir os produtos.

## Revisão anterior da interface — validada

Solicitações do usuário após revisão da primeira versão. Estado deste registro: revisão da interface validada em desktop/móvel, incluindo enquadramento do hero e comandos finais. O vídeo real é a pendência restante desta revisão. Publicação e push continuam adiados. Nenhuma nova decisão de arquitetura foi introduzida.

## Checklist

- [x] Hero com três cenas, incluindo homem com Marco e mulher em gesto de dança com Farol; imagens de campanha originais.
- [x] Três fotografias em três colunas imediatamente após o hero.
- [x] Menu desktop escuro/translúcido e desfoque de 15 px no fundo.
- [x] Modal com raio de 24 px; fotografias arredondadas e bordas de 1 px.
- [x] Ocultar “Conhecer a obra” durante detalhes: opacidade zero enquanto o modal está aberto.
- [x] Texto branco no cartão Marco em “Qual é a sua luz?”: estilo computado `rgb(255, 255, 255)` confirmado.
- [x] Rodapé com grupos de opções acima e Per Parte em grande escala.
- [x] Seção Missão explícita.
- [x] Processo com etapas abertas/fechadas conforme a rolagem; sequência desktop 0 → 1 → 2 verificada.
- [x] Seletor flutuante com 25 cores em sete colunas, expansão de 420 ms e controle compacto de 48 px; seleção Cobalto preservou as imagens dos três produtos.
- [x] Verificar navegação e paleta móvel em 351 × 760 CSS px, sem overflow; foco e seleção por teclado após a correção.
- [x] Enquadramento da cabeça no hero masculino móvel conferido abaixo da navbar; fundo Vinho `#670700` une a faixa superior.
- [x] Build/check finais após correção de foco passaram; build repetido após o último CSS também passou.
- [ ] Vídeo real de pessoa dançando com luminária. Adiado pelo usuário em 13/10/2026; retomar quando solicitado. Ver `pesquisa/video-campanha-disponibilidade.md`.

## Evidência de verificação até este registro

| Verificação | Resultado confirmado | Limite |
|---|---|---|
| Menu desktop | Painel escuro, vidro/desfoque de 15 px e composição revisada | Captura `04-menu-revisado.jpg` |
| Paleta | 25 botões, sete colunas, seleção Cobalto, Escape recolhe, modal oculta; `src` de Marco/Duna/Farol permaneceu igual | Captura `05-paleta-25-cores.jpg`; seleção é visual/local |
| Modal | Raio de 24 px; CTA sobre a imagem com opacidade zero durante a abertura | Captura `06-modal-arredondado.jpg` |
| Processo desktop | PageDown de 518 px em viewport com 678 px de altura avançou 0 → 1 → 2; apenas um painel aberto por vez, fotos mudaram | Captura `07-processo-por-scroll.jpg`; fallback móvel implementado; preferência reduced-motion conferida somente no código |
| Rodapé | Grupos de opções e wordmark em grande escala presentes | Captura `08-rodape-revisado.jpg` |
| Marco e Missão | Texto do cartão Marco `rgb(255, 255, 255)`; “Nossa missão” visível com foto de Farol e texto | Verificação renderizada; não é inferência da regra CSS |
| Móvel real | 351 × 760 CSS px, sem overflow; menu abre/navega/fecha; paleta de 272 px cabe na tela | `10-mobile-paleta.jpg` |
| Hero masculino | Cabeça abaixo da navbar no móvel; enquadramento desktop conferido; fundo Vinho `#670700` une a faixa superior | `09-mobile-hero-homem.jpg` atualizado e `11-hero-homem-desktop.jpg` |
| Teclado da paleta móvel | Foco automático em Flor ao expandir, ArrowRight → Cânion, Enter seleciona, Escape compacta | Resultado após correção do foco; sem recoloração das imagens |
| Comandos de código/build | `npm run site:check` e `npm run site:build` passaram após a correção de foco; build repetido após o último CSS passou | Verificação do estado final da revisão da interface |
| Integridade e runtime | `git diff --check` passou; console Chrome sem erros | Sem teste de gerador ou reprodução de vídeo, pois ainda não há clipe |

As capturas ficam em `pesquisa/perparte-capturas/`. Os testes da primeira versão permanecem históricos; os resultados da tabela documentam a revisão atual. A preferência por movimento reduzido foi conferida no código, sem simulação da configuração do sistema. Não há resultado de vídeo a validar nesta etapa.

## Pendência de vídeo

Em 13/10/2026, o usuário decidiu deixar o vídeo pendente por enquanto. Manter a fotografia atual e retomar a geração quando solicitado. Não há gerador de vídeo conectado. A imagem `hero-farol-mulher.png` mostra uma pose de dança, mas é PNG estático. Nenhum vídeo deve ser marcado como disponível ou concluído sem arquivo reproduzível e revisão da ação e da luminária durante o clipe.

## Limites e decisões

- Manter Figtree Light e identidade Per Parte.
- Paleta do seletor pedida como reprodução visual do benchmark; não representa catálogo de filamentos aprovado.
- Sem checkout, conta, disponibilidade comercial ou recoloração de produto simulados.
- Fotografias novas são estudos gerados. Um slideshow ou zoom em fotografia não atende ao requisito do vídeo de dança.
- Evidências do benchmark em `pesquisa/gantri-revisao/`; verificação local em `pesquisa/perparte-capturas/`.
