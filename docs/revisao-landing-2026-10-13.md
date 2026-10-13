# Revisão visual da landing — 13/10/2026

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
- [ ] Vídeo real de pessoa dançando com luminária. Pendente de gerador de vídeo conectado; ver `pesquisa/video-campanha-disponibilidade.md`.

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

Não há gerador de vídeo conectado. A pergunta de acesso enviada ao usuário ainda não recebeu resposta neste registro. A imagem `hero-farol-mulher.png` mostra uma pose de dança, mas é PNG estático. Nenhum vídeo deve ser marcado como disponível ou concluído sem arquivo reproduzível e revisão da ação e da luminária durante o clipe.

## Limites e decisões

- Manter Figtree Light e identidade Per Parte.
- Paleta do seletor pedida como reprodução visual do benchmark; não representa catálogo de filamentos aprovado.
- Sem checkout, conta, disponibilidade comercial ou recoloração de produto simulados.
- Fotografias novas são estudos gerados. Um slideshow ou zoom em fotografia não atende ao requisito do vídeo de dança.
- Evidências do benchmark em `pesquisa/gantri-revisao/`; verificação local em `pesquisa/perparte-capturas/`.
