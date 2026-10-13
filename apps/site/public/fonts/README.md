# Fontes locais — Per Parte

Obtidas em 13/10/2026 da distribuição oficial Google Fonts, sem converter ou modificar os arquivos WOFF2. A landing carrega somente **Figtree e Unbounded**. Figtree inclui o peso 300 para rótulos mais leves, conforme pedido do usuário. Os `unicode-range` e intervalos de peso em `apps/site/fonts.css` preservam a resposta oficial para os subsets Latin e Latin Extended. Todas as regras usam `font-display: swap`.

| Família | Pesos normais | Subsets | Versão da URL Google Fonts | Licença incluída |
|---|---|---|---|---|
| Figtree | 300–700, variável | Latin / Latin Extended | v9 | `Figtree-OFL.txt` |
| Unbounded | 400–700, variável | Latin / Latin Extended | v12 | `Unbounded-OFL.txt` |

As versões acima são segmentos da URL de distribuição, não números inferidos de versão interna da família. Não foram incluídos itálicos nem subsets cirílicos/vietnamitas.

O diretório contém somente os quatro WOFF2 utilizados pela landing. DM Mono permanece nos tokens gerais da marca para outros usos.

## Fontes oficiais

- CSS Figtree atual: `https://fonts.googleapis.com/css2?family=Figtree:wght@300..700&display=swap`.
- CSS da obtenção inicial: `https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Figtree:wght@400..700&family=Unbounded:wght@400..700&display=swap`.
- Binários Figtree 300–700: URLs `https://fonts.gstatic.com/l/font?...&v=v9` retornadas pelo CSS atual; arquivos locais `figtree-300-700-latin.woff2` e `figtree-300-700-latin-ext.woff2`.
- Binários iniciais: `https://fonts.gstatic.com/s/dmmono/v16/`, `https://fonts.gstatic.com/s/figtree/v9/` e `https://fonts.gstatic.com/s/unbounded/v12/`, URLs retornadas pelo CSS inicial.
- [Figtree no repositório google/fonts](https://github.com/google/fonts/tree/main/ofl/figtree).
- [Unbounded no repositório google/fonts](https://github.com/google/fonts/tree/main/ofl/unbounded).

As duas licenças OFL foram obtidas dos respectivos `OFL.txt` no repositório oficial. Devem acompanhar a redistribuição dos arquivos.

## Integração

Carregar `/fonts.css` antes do CSS da página e servir este diretório público em `/fonts/`. Incluir `fonts.css` na saída do build. Os nomes `font-family` são os mesmos já usados pelo site; não são necessárias novas dependências. A validação final no navegador deve confirmar o carregamento de Figtree e Unbounded pela origem local e Figtree no peso 300 nos rótulos definidos pelo CSS.
