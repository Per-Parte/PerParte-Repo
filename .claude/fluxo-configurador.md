# Fluxo: configurador

**Atualização:** 14/10/2026. **Estado:** protótipo local implementado em `apps/configurador`, porta **4175**. A interface segue o pedido do usuário desta data; a arquitetura comercial e a engenharia de fabricação permanecem **EM ABERTO**. Ver ADR 0004 e `docs/pesquisa/hairline.md`.

## Entrada e painel

Login foi explicitamente adiado. A aplicação abre diretamente em **Suas criações**, sem simular uma conta autenticada. Um navegador sem dados começa vazio: a ilustração de Marco no convite é um ponto de partida, não uma obra atribuída à pessoa.

O painel mostra miniaturas SVG geradas a partir das configurações salvas, nome, altura ilustrativa e cores por parte. Há busca por nome, ordenação por recência/nome e seleção de obras para preparar um pedido. Clicar em uma composição existente reabre o editor preservando sua identidade; a atualização substitui a composição salva, sem duplicá-la.

## Nova luminária

**Nova luminária** abre três presets — Marco, Duna e Farol — e **Começar do zero**. O modo livre começa com uma base cúbica de 90 mm ilustrativos; corpos e difusores são acrescentados pela pessoa. Marco remete à composição da revista; todos os presets são estudos paramétricos, e Duna/Farol continuam **PROPOSTAS** de desenho.

## Editor: Formas → Cores → Concluir

No desktop, controles à esquerda com rolagem própria e palco à direita dimensionado pela altura da janela. No móvel, palco e bandeja aparecem antes dos controles. O enquadramento considera o tamanho real do visor e os limites projetados da composição.

1. **Formas:** selecionar uma peça na lista ou no palco; escolher Círculo, Quadrado ou Triângulo e uma variação Liso, Ondulado, Vazado ou Perfurado. Cada parte tem largura e altura independentes, editáveis por campo numérico, faixa e puxadores de cotas no palco.
2. **Cores:** escolher cada parte e aplicar sua cor independentemente, a partir da paleta visual da marca. As cores são estudos de interface; não são um catálogo de filamentos homologados.
3. **Concluir:** revisar a composição, dar um nome e salvar. A aplicação volta ao painel, coloca a obra entre as mais recentes e marca a composição mais recentemente criada como **Nova**. A tag é derivada da maior data `criadoEm`, permanece após recarregar e não muda ao editar uma obra mais antiga.

A montagem admite uma base e vários corpos/difusores, até 24 peças (limite técnico PROVISÓRIO). Conexões são centralizadas em seis faces, com eixos comuns e profundidade igual à largura. Faces ocupadas e sobreposições de envelopes são recusadas; peças com descendentes precisam ser desmontadas a partir das pontas. Esses limites não validam fabricação.

As etapas podem ser revisitadas. O editor mantém histórico de desfazer/refazer para alterações do modelo; oferece aviso ao sair com alterações não salvas. O histórico de desfazer/refazer não persiste entre sessões; a tag Nova identifica a criação mais recente, sem constituir histórico de versões da obra.

## Prévia e interação direta

O renderizador autoral calcula a projeção ortográfica 3D e desenha superfícies/contornos em SVG, inspirado na pesquisa de fonte do Hairline. Não importa o pacote nem copia suas figuras prontas. A mesma geometria produz miniaturas e palco.

- Arrasto horizontal e vertical orbita a composição. A peça fica suspensa, sem plano de chão, com flutuação suave que pode ser pausada e respeita movimento reduzido.
- Clicar numa face seleciona a peça e o destino de encaixe. A bandeja permite arrastar novos corpos/difusores para uma face; botões e seletor de faces oferecem a alternativa de teclado/toque. Um encaixe válido tem retorno visual e som curto, que pode ser silenciado.
- Cada peça tem identidade e controles independentes. Arrastar um puxador altera largura ou altura da peça ativa, sem girar a câmera.
- As cotas também são sliders acessíveis por teclado. O palco admite giro por setas, e a barra oferece giro em passos, zoom e restauração da vista.
- Alternar **Desenho/Cor** muda a apresentação da mesma composição; cotas podem ser ocultadas e ficam ocultas na conclusão.
- Alterações dimensionais respeitam as faixas do domínio e atualizam a montagem. Movimento reduzido desativa transições dispensáveis.

O traço fino e a organização das superfícies vêm da referência Hairline; as cotas e cores são adaptações ao editor solicitadas pelo usuário. O vidro discreto dos blocos também foi solicitado explicitamente. Continua sem sombra decorativa. A prévia é um estudo geométrico, sem mesh de produção, STL ou certificação de fabricação.

## Rascunho de pedido

No painel, selecionar uma ou mais obras revela **Preparar pedido**. O diálogo apresenta as composições e esclarece o estado local. **Salvar rascunho** guarda cópias dos modelos escolhidos; uma edição posterior da obra não muda esse pedido. A aba **Meus pedidos** reabre os rascunhos e permite baixar JSON com `fabricacaoAutorizada: false`.

Não há envio à Per Parte, orçamento, cobrança, prazo prometido, compra concluída ou ordem de produção. A solicitação real de impressão exige uma integração futura e validação de fabricação.

## Persistência e falhas

`src/dominio.mjs` define partes, formas, variações, cores, presets, faixas exploratórias e validação. O armazenamento usa `localStorage`, chave `perparte.configurador.v1`, versão 2. Modelos v1 e cópias de pedidos são convertidos em memória, preservando os dados originais até uma ação de salvar. É restrito ao navegador e à origem local usados; não há conta nem sincronização.

Uma leitura inválida não sobrescreve o conteúdo original. A interface informa a falha, bloqueia gravação sobre dados ilegíveis e oferece baixar cópia antes de reiniciar explicitamente o armazenamento. Falha de quota ou indisponibilidade deve manter a edição aberta, sem informar salvamento concluído. Não há importação de pedidos ou backup automático nesta versão.

## Limites e pendências

As medidas em milímetros são **PROVISÓRIAS** para exploração visual. Limitar largura/altura não comprova parede mínima, encaixe, estabilidade, dissipação térmica ou distância interna de 25 mm. Preservam-se as guardas do projeto: LED até 9 W, pelo menos 25 mm entre lâmpada e parede impressa e nenhuma parte condutora desenhada pelo cliente; validar engenharia com Davi/Caio antes da fabricação.

Permanecem **EM ABERTO**: login/contas, backend, sincronização, stack comercial, contrato único entre prévia e produção, exportação fabril, catálogo homologado, preço vivo, orçamento e envio real de pedidos. Apagar a luz e ver no quarto são direções da revista ainda não implementadas. Não há IA no produto.

## Execução e verificação

Na raiz: `npm run configurador`, `npm run configurador:build`, `npm run configurador:check` e `npm run configurador:test`. O build estático fica em `apps/configurador/dist`; `npm run preview --workspace @perparte/configurador` serve esse build na porta 4175.

A matriz de estados/interações para revisão está em `docs/pesquisa/hairline.md`. Resultados efetivamente executados devem ser registrados em `.claude/state.md`; este fluxo descreve a implementação e não atesta uma rodada de QA visual concluída.
