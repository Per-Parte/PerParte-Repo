# Vídeo de campanha — disponibilidade de geração

Diagnóstico em 13/10/2026. Pedido: pessoa dançando com uma luminária Per Parte em vídeo fotorrealista, tomando a campanha Gantri como referência de linguagem. O produto e o vídeo devem ser originais da Per Parte.

## Estado observado

| Recurso | Evidência nesta sessão | Atende ao pedido? |
|---|---|---|
| Ferramentas expostas ao agente | Inventário de ferramentas consultado; há geração de imagem, mas nenhuma operação de geração de vídeo fotorrealista anunciada | Não há geração de footage humano disponível diretamente neste inventário |
| Skill local `general-video` | Cabeçalho e escopo lidos em `C:/Users/Antônio/.codex/skills/general-video/SKILL.md`: composição HTML/HyperFrames; footage fora dessa capacidade é excluído | Não gera uma pessoa dançando a partir de uma foto |
| Outras skills locais de vídeo | Busca de arquivos encontrou fluxos de montagem, captura de site, lançamento de produto, PR e legendas; nenhuma skill local Sora/Veo/Runway/Kling encontrada na busca feita | Instruções de montagem não estabelecem acesso a um gerador de footage |
| Runway | Busca do catálogo de plugins retornou integração de geração/edição de vídeo, imagem para vídeo e anúncios de produto; `installed: false`, política `AVAILABLE` | Caminho compatível após conexão de conta; não conectado nesta sessão |
| OpenArt | Catálogo retornou geração de imagem/vídeo com referências; `installed: false`, política `AVAILABLE` | Alternativa após conexão; capacidade e créditos ainda não verificados |
| Higgsfield | Catálogo retornou geração de vídeo com referência/produto; `installed: false`, política `AVAILABLE` | Alternativa após conexão; capacidade e créditos ainda não verificados |
| Navegador do usuário | Nenhuma inspeção de conta Sora/Runway/Veo foi feita neste diagnóstico, para não concorrer com a captura Chrome da sessão principal | Autenticação e disponibilidade permanecem desconhecidas |

Busca principal do catálogo: `video generation Sora Veo Runway Kling`. A busca específica `Sora Veo` retornou `plugins: []`. O catálogo não é uma lista exaustiva de todos os serviços existentes. A ausência de um conector instalado não demonstra ausência de uma assinatura do usuário.

## Caminho concreto

O plugin Runway foi encontrado como `plugin_asdk_app_6a05e3b201788191be12b590b43e6ce3`. Sua descrição no catálogo declara geração de vídeo a partir de imagem e armazenamento no workspace privado da conta conectada. Esse é um caminho compatível com animar uma cena original da Per Parte depois de confirmar conexão e capacidade de geração.

Uma sessão já autenticada de um gerador de vídeo no Chrome também pode permitir a produção; ela precisa ser inspecionada pela sessão principal antes de afirmar disponibilidade. Nenhuma credencial foi procurada, lida ou exposta neste diagnóstico. Não foram instalados serviços, conectadas contas, configurados acessos ou comprados créditos.

## Critério para considerar o vídeo entregue

- Um arquivo de vídeo reproduzível deve mostrar movimento articulado da pessoa durante a dança e interação visual coerente com a luminária.
- Cor, proporção, partes e desenho da luminária devem permanecer consistentes com a referência Per Parte ao longo do clipe.
- O resultado deve ser assistido, com conferência de mãos, objeto, luz e continuidade. Um job aceito pelo serviço ou um poster estático não comprova o resultado.
- Zoom/pan de fotografia, slideshow, animação CSS e montagem de imagens continuam sendo recursos de apresentação; não cumprem o requisito de pessoa dançando em footage fotorrealista.
- A integração no site deve usar o vídeo real produzido. Imagem estática pode servir como poster/fallback, sem ser apresentada como vídeo concluído.

**Situação ao fim deste diagnóstico:** caminho de geração identificado no catálogo, mas nenhum gerador conectado e nenhum arquivo de vídeo produzido por esta subtarefa. A implementação da landing pode prosseguir; o requisito de vídeo depende de acesso efetivo ao gerador ou de footage fornecido para integração.
