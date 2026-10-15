# Configurador — montagem por faces

Plano de 14/10/2026, consolidado antes da execução após análise paralela com agentes Luna em esforço alto.

## Resultado esperado

Ver a composição inteira sem reduzir o zoom do navegador. Montar uma base e vários corpos/difusores; exemplo de aceite: quatro cubos iguais empilhados (base + três corpos) e um quinto cubo difusor ligado à lateral do corpo mais alto. Acrescentar outro difusor deve continuar possível.

## Decisões de implementação

- Modelo local v2 com lista de peças identificadas, tipo, parâmetros e conexão ao pai por uma de seis faces. Eixos comuns, face de contato oposta implícita, sem rotação individual nesta etapa.
- Base única; múltiplos corpos e difusores. Migração de modelos v1 e cópias de pedidos em memória; escrita somente pelas ações normais. Conteúdo inválido continua protegido.
- Geometria compartilhada pelo palco, miniaturas e cálculo de limites. Conexões são um estudo visual, sem equivaler a encaixe industrial ou arquivo de fabricação.
- Renderer SVG autoral preservado, com faces apontáveis, profundidade, orbit em dois eixos e ajuste ao tamanho real do visor por ResizeObserver. Escala automática separada do zoom manual.
- Lista de peças e bandeja para adicionar por arrasto; seleção de face e botão como alternativa de teclado/toque. Desfazer/refazer inclui adição, remoção e medidas.
- Peça suspensa sem chão; flutuação discreta com pausa e respeito a movimento reduzido. Som de encaixe sintetizado após ação da pessoa e com controle de silêncio.
- Layout desktop limitado pela altura disponível; palco primeiro no móvel. Tokens Per Parte, vidro discreto e ausência de sombra decorativa preservados.

## Frentes e propriedade

1. Domínio/persistência e testes de domínio.
2. Renderer/projeção/interação no palco e testes de geometria.
3. Estado da interface, bandeja, seleção, histórico e áudio.
4. Coordenação: CSS responsivo, integração, testes de navegador e documentação.

## Aceite e evidências

- Testes de migração, referências inválidas/ciclos, limites, remoção, cópias de pedidos e proteção do armazenamento.
- Testes de posição lateral e enquadramento para composições altas/largas em diferentes ângulos e proporções.
- Navegador: montar os cinco cubos, outro difusor, arrasto/teclado, desfazer/refazer, editar cor/medida, salvar/reabrir e pedido local.
- Conferir 1440×900, notebook baixo e 390/320 px, movimento reduzido, console, check e build.
- Atualizar fluxo, requisitos, ADR e estado com os resultados realmente executados.

Fabricação, login/sincronização, envio comercial e publicação do configurador continuam fora do escopo.
