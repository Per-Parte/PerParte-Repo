# ADR 0003 — Protótipo estático para a landing visual

**Data:** 13/10/2026
**Estado:** aceito para a revisão visual local; arquitetura comercial e configurador em aberto.

## Contexto

Após o reinício, `apps/site` era um workspace reservado. O usuário pediu uma landing para três luminárias, reproduzindo a estrutura editorial e os comportamentos da Gantri com a identidade Per Parte, imagens geradas e pesquisa por capturas da extensão do Chrome. Integrações funcionais e publicação ficaram adiadas. Escolher agora a infraestrutura do produto completo ampliaria uma etapa que deve permitir revisar composição, conteúdo e interação.

## Decisão

Implementar `apps/site` em HTML, CSS e JavaScript, com servidor local e build escritos com bibliotecas nativas de Node. Servir a prévia em `127.0.0.1:4174`, mantendo `apps/quadro` na porta 4173. Gerar arquivos estáticos em `apps/site/dist` e reutilizar o pacote compartilhado de design system.

Permitir interações de apresentação: navegação, menu móvel, slideshow com pausa, seleção de ambientes, acordeão, detalhe de produto, busca e favoritos locais. Respeitar teclado e preferência por menos movimento. Não conectar checkout, conta, cadastro, catálogo remoto, produção ou configurador.

Apresentar Marco como interpretação visual de uma composição da revista; identificar Duna e Farol como propostas no contexto do projeto. Usar imagens originais geradas, com indicação de estudos conceituais na página. Não inventar preços, disponibilidade, avaliações ou promessas comerciais.

## Consequências

O site pode ser revisado e distribuído como arquivos estáticos, sem instalar framework ou backend. A decisão é reversível: uma etapa futura pode migrar a apresentação após definir arquitetura, integrações e requisitos reais. Ela não determina a stack do configurador nem retoma automaticamente a stack anterior ao reinício.

Favoritos pertencem ao navegador atual, sem sincronização. Assets gerados e tipografia provisória exigem revisão antes de publicação. A escolha de recursos visuais não implica validação industrial dos três desenhos. A publicação remota continua adiada por pedido expresso do usuário.
