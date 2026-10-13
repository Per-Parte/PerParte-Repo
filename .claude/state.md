# Estado da sessão

> 13/10/2026 — Criado `apps/quadro`, um quadro branco digital local para navegar e ampliar o contexto do projeto. Ele inicia com dez cartões ligados à Revista de Marca, visão, design system, requisitos, roadmap, fluxos de site/configurador e Gantri. Há pan/zoom, arraste, conexões, busca, edição, notas, links, decisões, anexos em IndexedDB e importação/exportação JSON. Rodar `npm run quadro` e abrir `http://127.0.0.1:4173`. Site e configurador continuam vazios. O fluxo é `.claude/fluxo-quadro.md` e a decisão de armazenamento inicial é ADR 0002.

> **Verificação do quadro:** sintaxe JavaScript e tokens passaram; navegador desktop e móvel verificados; nota e anexo persistiram após recarga; conexão entre cartões, rotas dos oito documentos oficiais e exportação/importação com anexo funcionaram. Os dados de teste foram removidos do navegador. Publicação remota segue adiada por decisão do usuário; branch local `codex/reinicio-marca-2026-10-13`.

> 13/10/2026 — Reinício estrutural. O código antigo foi removido do checkout em uma branch nova a partir de `origin/main`; o histórico Git permanece, e alterações locais anteriores foram guardadas em `stash@{0}` com a descrição `pre-reinicio-per-parte-2026-10-13`. A Revista de Marca (67 páginas) foi colocada em `docs/fonte/` como fonte primária. Site e configurador são workspaces vazios. Os tokens iniciais e o benchmark Gantri ficam separados.

> **Verificações da etapa:** PDF copiado com SHA-256 igual ao original e transcrição com 67 marcadores de página; `npm ci --offline --ignore-scripts` passou após permitir a criação dos links locais de workspaces no Windows; `npm ls --workspaces --depth=0` reconheceu site, configurador e design-system; `npm run tokens:verificar` e importação JS passaram. A suíte Extract Design System gerou dados brutos da Gantri, mas não reconheceu cores da homepage dinâmica; medições complementares de estilos computados estão em `docs/pesquisa/gantri.md`.

> **Publicação pendente:** `git push -u origin codex/reinicio-marca-2026-10-13` retornou HTTP 403: a única credencial GitHub disponível é `FainowAI`, sem permissão em `Per-Parte/PerParte-Repo`; `gh auth status` informa token inválido. O trabalho permanece em commits locais na branch `codex/reinicio-marca-2026-10-13`. Autenticar uma conta com acesso e repetir o push.

## Próximo passo

Usar o quadro para reunir documentos e decisões; exportar uma cópia antes de trocar de navegador. Revisar com Caio e Davi os pontos `EM ABERTO` da revista, especialmente logo e tipografia finais, filamentos, preço, prazo, garantia e engenharia elétrica. Definir sincronização compartilhada do quadro se ele passar a ser usado simultaneamente. Só então escolher stack e começar site/configurador.

## Como retomar

Leia `AGENTS.md`, `.claude/project.md`, `.claude/requirements.md`, o fluxo correspondente e a página relevante do PDF. `docs/fonte/revista-texto-extraido.md` permite localizar rapidamente termos por página.
