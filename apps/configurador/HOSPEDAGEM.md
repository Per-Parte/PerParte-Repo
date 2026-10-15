# Preview do configurador na Vercel

Publicação temporária autorizada e concluída em 15/10/2026. O configurador é um aplicativo estático; o servidor Node da porta 4175 é necessário apenas para desenvolvimento. Não há API, login ou credenciais no pacote publicado.

## Destino

- Equipe: `per-parte1` / `team_hBn2FaQPz2L9balwnZrrlVld`.
- Projeto separado: `perparte-configurador-preview` / `prj_1aRyLnro2NHq55EOjI7IowA6yMsH`.
- Ambiente: **Preview** (`target: staging` na API), sem domínio personalizado nem vínculo Git automático.
- O projeto de produção `per-parte-website`, seus ambientes e `perparte.com` não são alterados por este procedimento.

## Pacote público

1. Na raiz, executar `npm run configurador:test`, `npm run configurador:check` e `npm run configurador:build`.
2. Preparar uma pasta nova e ignorada em `.local/`. Copiar do build somente `index.html`, `styles.css`, `fonts.css`, `favicon.svg`, `tokens.css`, os cinco módulos de `src/` e as quatro fontes WOFF2 com suas duas licenças e README.
3. Copiar `vercel.preview.json` para `vercel.json` nessa pasta. O resultado tem 18 arquivos; não copiar a raiz do repositório, `.env*`, `.vercel`, testes, docs operacionais ou armazenamento do navegador. O builder não remove sobras do `dist`, por isso a publicação usa lista explícita em pasta nova.
4. Publicar esses arquivos pela API Vercel como deployment `target: staging`, associado ao projeto acima, e registrar o commit da `main`. A configuração tem build/instalação vazios: os assets já estão preparados. Confirmar o destino efetivo na resposta; a [referência da API](https://vercel.com/docs/rest-api/deployments/create-a-new-deployment) admite `staging`, `production` ou omissão para preview.
5. Aguardar `READY` e conferir a página, módulos, CSS e fontes por HTTPS; os caminhos de credenciais/arquivos privados devem retornar 404. Registrar URL e commit em `.claude/state.md`.

O `vercel.json` da raiz configura o site comercial e não deve ser usado para esse preview. Fontes usam `/fonts/`, portanto o configurador é servido na raiz da URL. `X-Robots-Tag: noindex, nofollow` evita indexação, mas não é proteção de acesso; o preview é público por URL e não contém dados privados.

## Publicação verificada em 15/10/2026

- URL: [abrir o configurador](https://perparte-configurador-preview-kvbl2al7e-per-parte1.vercel.app/).
- Deployment: `dpl_2yGbyg8Povh2HNLMAsJ1Ej6U5qqR`, **READY**, `target: staging`.
- Código publicado: `12af36468b26cac8e4d44441858c71761a86af18`, enviado à `origin/main`.
- 19 testes Node, check e build aprovados; 17 assets públicos retornaram 200 e hashes SHA-256 idênticos ao pacote preparado. O 18º arquivo é a configuração Vercel.
- Raiz 200, cabeçalhos noindex/nosniff presentes; `/.env.local`, `/.vercel/project.json`, `/docs/`, `/servidor.mjs` e `/api/produtos` retornaram 404.
- Navegador abriu painel vazio, editor livre e montagem de cinco cubos com difusor à direita. Console sem avisos/erros registrados. Captura de tela permaneceu indisponível na ferramenta.

A primeira chamada, com `target: preview`, foi classificada como `production` pela Vercel **somente dentro deste novo projeto separado** (`dpl_8UzDeDTQ9xuMaYeJV46w6bXnXy32`). A segunda chamada usou `staging` explicitamente e é a URL de revisão acima. Nenhuma chamada publicou ou alterou o projeto comercial `per-parte-website`.

## Dados e limites

Criações e pedidos permanecem em `localStorage`, isolados por navegador e origem. Abrir a URL de preview começa com um painel vazio; as criações feitas em localhost não aparecem automaticamente. Uma nova URL de deployment também tem armazenamento separado. Rascunhos não são enviados à Per Parte. Publicar a interface não implementa conta, sincronização, checkout ou validação de fabricação.
