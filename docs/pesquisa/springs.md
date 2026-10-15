# Springs — referência para a LP de captação

Data: 14/10/2026. Referência: https://springs.com.br/.

## Observação

A leitura pública e a operação no Chrome mostram um teaser: marca e anúncio no topo; título editorial grande à esquerda e flor vermelha tridimensional à direita; faixa de cadastro; ilustração; wordmark ampliado no rodapé e Instagram. Não há navegação de catálogo ou menu expansível nessa página.

O formulário mostra e-mail e botão inicialmente. Nome e telefone existem no DOM, mas estão num contêiner com altura zero e overflow oculto. Focar e-mail não revelou esses campos na amostra. Nenhum cadastro foi enviado à Springs; o destino e a persistência não foram verificados.

Na medição desktop de 1536 × 674, o h1 usou PPMori de 132,096 px, o h2 40 px, com texto NeueHaasGrotesk. Fundo medido rgb(242,239,234); a faixa de cadastro é azul clara, com botão preto. Esses valores são evidência da referência, não tokens da Per Parte. A captura da extensão Chrome usa a janela do usuário (1466 px de conteúdo); a captura adicional mobile foi feita em 390 × 844 no navegador de teste.

## Evidências e estados

- `springs-capturas/04-extensao-chrome-desktop.jpg`: página completa capturada pela extensão real do Chrome (browser tipo extension), incluindo rodapé. Este é o print primário pedido.
- `springs-capturas/01-desktop.png`, `02-formulario-foco.png` e `03-mobile.png`: capturas adicionais do navegador controlado pelo MCP Playwright; não confundir com a extensão do Chrome.
- `springs-capturas/observacoes-dom.json`: leitura de formulário, scripts e campos ocultos, sem dados pessoais.
- Sem submissão à Springs e sem inferência de backend a partir da aparência.

## Adaptação Per Parte

Usar a composição como referência, com tokens e assets próprios: Luz Acesa, Brasa, a assinatura “Criado por você, feito por partes.” e imagens explicitamente conceituais. Não copiar marca, fotos, texto ou promessas comerciais da Springs. Não prometer data de lançamento, exclusividade comercial ou benefícios ainda não decididos.

O site atual deve permanecer preservado e voltar quando a variável de ambiente da LP estiver desativada. Cadastro só pode confirmar sucesso após persistência real; nenhum envio automático de e-mail está autorizado por este fluxo.

## Limites da evidência

A skill `reverse-engineer-anything` e suas observações OPEN foram aplicadas. Depois de uma tentativa inicial sem CDP disponível, o REA inspecionou a página num Chrome isolado: 82 nós DOM, 70 nós de acessibilidade e 7 scripts da origem aprovada. A evidência resumida está em `springs-capturas/rea-evidencia.json` (ID `ev_cf31eae1d7f596d89d9d7160830e3989bcc219266a50bbbf4ccc738669449026`). A janela é posterior ao carregamento; não comprova tráfego anterior, backend ou submissão. Fontes de scripts, cookies e valores de armazenamento não foram capturados.

A extensão real do Chrome forneceu a captura primária acima. O navegador Playwright forneceu medidas, interação de foco e mobile; esses resultados não são atribuídos ao REA. Capturas confirmam somente os estados operados, sem comprovar envio, animações não exercitadas ou infraestrutura privada.
