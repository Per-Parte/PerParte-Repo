# Estado da sessão

> 13/10/2026 — Landing visual completa em `apps/site`: três luminárias (Marco, Duna e Farol), oito imagens originais geradas, hero com slideshow/pausa, ambientes por abas, coleção, processo com acordeão, campanha, galeria, essência e FAQ. Busca, detalhes e favoritas funcionam localmente; não há checkout, conta ou configurador conectado. Rodar `npm run site` e abrir `http://127.0.0.1:4174`. O quadro continua independente na porta 4173. Fonte técnica/decisão: `.claude/fluxo-site.md` e ADR 0003.

> **Tipografia:** a pedido do usuário, os rótulos antes em DM Mono passaram a Figtree Light 300. Títulos continuam Unbounded; fontes locais com licenças em `apps/site/public/fonts`. A tipografia final da marca segue em aberto.

> **Verificações:** `npm run site:check`, `npm run site:build`, `npm run tokens:verificar` e `git diff --check` passaram. Chrome pela extensão: desktop (1280 px CSS) e mobile (390 px CSS) sem overflow horizontal; busca por Lago encontrou Farol, detalhe e Escape funcionaram, favorito persistiu após recarga e foi removido ao terminar o teste; tabs, acordeão, menu móvel e trilho de produtos funcionaram. Todas as entradas por scroll foram reveladas na navegação. Movimento reduzido verificado no código, sem simulação da preferência do sistema. Prints em `docs/pesquisa/perparte-capturas/`.

> **Pesquisa:** prints reais da Gantri pela extensão em `docs/pesquisa/gantri-capturas/`; correspondência de seções em `docs/pesquisa/gantri-reconstrucao.md`. A skill REA foi consultada e a CLI diagnosticada; o MCP não está registrado, portanto a evidência visual veio do Chrome, sem alegação de REA Evidence. Conteúdo e imagens estão documentados em `docs/site-direcao-conteudo.md` e `docs/site-imagens.md`. Duna/Farol e todos os renders são estudos. Publicação e push continuam adiados por decisão do usuário.

> 13/10/2026 — Criado `apps/quadro`, um quadro branco digital local para navegar e ampliar o contexto do projeto. Ele inicia com dez cartões ligados à Revista de Marca, visão, design system, requisitos, roadmap, fluxos de site/configurador e Gantri. Há pan/zoom, arraste, conexões, busca, edição, notas, links, decisões, anexos em IndexedDB e importação/exportação JSON. Rodar `npm run quadro` e abrir `http://127.0.0.1:4173`. Site e configurador continuam vazios. O fluxo é `.claude/fluxo-quadro.md` e a decisão de armazenamento inicial é ADR 0002.

> **Verificação do quadro:** sintaxe JavaScript e tokens passaram; navegador desktop e móvel verificados; nota e anexo persistiram após recarga; conexão entre cartões, rotas dos oito documentos oficiais e exportação/importação com anexo funcionaram. Os dados de teste foram removidos do navegador. Publicação remota segue adiada por decisão do usuário; branch local `codex/reinicio-marca-2026-10-13`.

> 13/10/2026 — Reinício estrutural. O código antigo foi removido do checkout em uma branch nova a partir de `origin/main`; o histórico Git permanece, e alterações locais anteriores foram guardadas em `stash@{0}` com a descrição `pre-reinicio-per-parte-2026-10-13`. A Revista de Marca (67 páginas) foi colocada em `docs/fonte/` como fonte primária. Site e configurador são workspaces vazios. Os tokens iniciais e o benchmark Gantri ficam separados.

> **Verificações da etapa:** PDF copiado com SHA-256 igual ao original e transcrição com 67 marcadores de página; `npm ci --offline --ignore-scripts` passou após permitir a criação dos links locais de workspaces no Windows; `npm ls --workspaces --depth=0` reconheceu site, configurador e design-system; `npm run tokens:verificar` e importação JS passaram. A suíte Extract Design System gerou dados brutos da Gantri, mas não reconheceu cores da homepage dinâmica; medições complementares de estilos computados estão em `docs/pesquisa/gantri.md`.

> **Publicação pendente:** `git push -u origin codex/reinicio-marca-2026-10-13` retornou HTTP 403: a única credencial GitHub disponível é `FainowAI`, sem permissão em `Per-Parte/PerParte-Repo`; `gh auth status` informa token inválido. O trabalho permanece em commits locais na branch `codex/reinicio-marca-2026-10-13`. Autenticar uma conta com acesso e repetir o push.

## Próximo passo

Revisar a landing local com Caio e Davi, especialmente desenhos e nomes da coleção, logo, tipografia, imagens e conteúdo. Validar os pontos `EM ABERTO` da revista: filamentos, preço, prazo, garantia e engenharia elétrica. Decidir a arquitetura comercial antes de conectar compra ou configurador. Usar o quadro para reunir decisões e exportar uma cópia antes de trocar de navegador; definir sincronização se houver uso simultâneo.

## Como retomar

Leia `AGENTS.md`, `.claude/project.md`, `.claude/requirements.md`, o fluxo correspondente e a página relevante do PDF. `docs/fonte/revista-texto-extraido.md` permite localizar rapidamente termos por página.
