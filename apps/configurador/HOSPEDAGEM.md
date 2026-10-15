# Preview do configurador na Vercel

Publicação temporária autorizada em 15/10/2026. O configurador é um aplicativo estático; o servidor Node da porta 4175 é necessário apenas para desenvolvimento. Não há API, login ou credenciais no pacote publicado.

## Destino

- Equipe: `per-parte1` / `team_hBn2FaQPz2L9balwnZrrlVld`.
- Projeto separado: `perparte-configurador-preview` / `prj_1aRyLnro2NHq55EOjI7IowA6yMsH`.
- Ambiente: **Preview**, sem domínio personalizado nem vínculo Git automático.
- O projeto de produção `per-parte-website`, seus ambientes e `perparte.com` não são alterados por este procedimento.

## Pacote público

1. Na raiz, executar `npm run configurador:test`, `npm run configurador:check` e `npm run configurador:build`.
2. Preparar uma pasta nova e ignorada em `.local/`. Copiar do build somente `index.html`, `styles.css`, `fonts.css`, `favicon.svg`, `tokens.css`, os cinco módulos de `src/` e as quatro fontes WOFF2 com suas duas licenças e README.
3. Copiar `vercel.preview.json` para `vercel.json` nessa pasta. O resultado tem 18 arquivos; não copiar a raiz do repositório, `.env*`, `.vercel`, testes, docs operacionais ou armazenamento do navegador. O builder não remove sobras do `dist`, por isso a publicação usa lista explícita em pasta nova.
4. Publicar esses arquivos pela API Vercel como deployment `target: preview`, associado ao projeto acima, com metadados do commit da `main`. A configuração tem build/instalação vazios: os assets já estão preparados.
5. Aguardar `READY` e conferir a página, módulos, CSS e fontes por HTTPS; os caminhos de credenciais/arquivos privados devem retornar 404. Registrar URL e commit em `.claude/state.md`.

O `vercel.json` da raiz configura o site comercial e não deve ser usado para esse preview. Fontes usam `/fonts/`, portanto o configurador é servido na raiz da URL. `X-Robots-Tag: noindex, nofollow` evita indexação, mas não é proteção de acesso; o preview é público por URL e não contém dados privados.

## Dados e limites

Criações e pedidos permanecem em `localStorage`, isolados por navegador e origem. Abrir a URL de preview começa com um painel vazio; as criações feitas em localhost não aparecem automaticamente. Uma nova URL de deployment também tem armazenamento separado. Rascunhos não são enviados à Per Parte. Publicar a interface não implementa conta, sincronização, checkout ou validação de fabricação.
