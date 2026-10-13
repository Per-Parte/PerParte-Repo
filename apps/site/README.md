# Site Per Parte

Landing editorial estática da coleção conceitual Marco, Duna e Farol. HTML, CSS e JavaScript sem dependências de runtime. Imagens originais de estudo em `public/images/`, baseadas na direção da Per Parte. A estrutura, o ritmo e os padrões de interação foram pesquisados no site da Gantri; cores, texto e produtos são da Per Parte.

## Rodar

Na raiz: `npm run dev --workspace @perparte/site`. Abrir `http://127.0.0.1:4174`.

Build: `npm run build --workspace @perparte/site`. A pasta `apps/site/dist` contém os arquivos para hospedagem estática. Preview do build: `npm run preview --workspace @perparte/site`. Verificação estática: `npm run check --workspace @perparte/site`.

## Interações

- Hero alterna duas cenas, com navegação manual e botão pausar. Animação automática desativada com preferência de movimento reduzido.
- Navegação fixa muda de cor no scroll; menu móvel possui controle de foco e Escape.
- Busca local por nome, cor e forma; detalhes de cada luminária em modal nativo com Escape e retorno de foco.
- Favoritas persistem em `localStorage` neste navegador, sem conta ou sincronização.
- Tabs de atmosfera com teclado, accordion de processo com troca de foto, trilhos horizontais e FAQ expansível.

Nenhuma compra, cadastro, checkout ou envio é realizado. Preços, prazo, material final e estoque continuam em aberto. A coleção e suas imagens estão identificadas como conceituais.

## Arquivos

`index.html`: conteúdo e estrutura semântica. `styles.css`: layout responsivo, identidade e movimento. `app.js`: interações locais. `servidor.mjs`: servidor HTTP de arquivos permitidos. `construir.mjs`: cópia para `dist`. `verificar.mjs`: sintaxe, IDs, âncoras, imagens e presença do tratamento de movimento reduzido; interações e qualidade visual ainda exigem revisão no navegador.

`packages/design-system/tokens.css` é servido diretamente no desenvolvimento e copiado no build. A fonte dos tokens de marca continua no pacote compartilhado.

Unbounded e Figtree são carregadas localmente por `fonts.css`, com arquivos e licenças em `public/fonts/`. Por decisão do usuário em 13/10/2026, todos os rótulos antes em DM Mono usam Figtree Light 300. O wordmark tipográfico é provisório; o símbolo final da marca ainda depende do master. O favicon `pp` é identificação temporária da aba.

**PROPOSTA de adaptação editorial:** títulos grandes usam Unbounded 400/500 para reproduzir o respiro e a leveza observados na Gantri. A revista trabalha com 600/700; essa adaptação pertence ao protótipo do site e não altera os tokens compartilhados nem fecha a tipografia final da marca.
