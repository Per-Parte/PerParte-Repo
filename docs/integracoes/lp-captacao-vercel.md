# LP de captação — publicação e operação

Resultado de 14/10/2026 (BRT): LP ativa em https://perparte.com e https://www.perparte.com.

## Controle na Vercel

Projeto `per-parte-website`, equipe `per-parte1`. Variável criada via MCP Vercel:

| Variável | Valor atual | Efeito após novo deploy |
| --- | --- | --- |
| `PERPARTE_LP_ATIVA` | `TRUE` | Mostra a LP e oculta as rotas comerciais. |
| `PERPARTE_LP_ATIVA` | `FALSE` | Restaura o site completo preservado no código. |

Em Settings → Environment Variables, editar o valor de Production. Depois, em Deployments, usar Redeploy no deployment atual da LP. A mudança exige build novo; mudar somente a variável não modifica um deployment existente. Preview e Development também têm a chave de modo.

A conexão Git antiga `FainowAI/per-parte-website` foi preservada. Esta entrega foi publicada por CLI a partir da `main` de `Per-Parte/PerParte-Repo`; não iniciar deploy pela conexão antiga. A versão final de código é `8de190fa4f660f23ca12d6c015cd287e5a515ae9`, já enviada a `origin/main`. Ela incorpora o ajuste concorrente de rodapé Lago, sem perda de conteúdo.

## Produção verificada

- Deployment final: `dpl_FVgjPH4K5TuKvVWtUJTqAMGiFnkW`, confirmado `READY` pela CLI e pelo MCP Vercel.
- URL: https://per-parte-website-m32vwlm9o-per-parte1.vercel.app. Aliases públicos `perparte.com` e `www.perparte.com` confirmados.
- Build limpo: 35 arquivos públicos no modo LP. Código original continua no repositório.
- `/`, `/loja`, `/produtos/marco`, `/conta`, `/carrinho`: HTTP 200 com formulário da LP.
- `GET /api/captacao`: 405; `/api/produtos`: 404 enquanto LP ativa.
- `/.env.local`, `/.vercel/project.json`, `/docs/`, `/emails/transporte.mjs`: 404.
- 77 testes locais e `site:check` aprovados. Os testes do build cobrem TRUE/FALSE e preservação dos HTMLs originais. Não houve alternância temporária de produção para FALSE.

## Contacts sem envio automático

`RESEND_CONTACTS_API_KEY` está como segredo sensitive em Production/Preview. Chave dedicada “Per Parte — LP Contacts”, Full access explicitamente aprovado porque Contacts não está incluído em Sending access. O código usa apenas Contacts; a chave de envio existente e `RESEND_ENABLED=false` foram preservados. Segredos e scripts operacionais permanecem em diretórios ignorados.

As propriedades string `perparte_lp_origem`, `perparte_lp_consentimento_versao` e `perparte_lp_consentimento_em` foram criadas e relidas no Resend. O formulário exige consentimento e confirma sucesso após persistência e releitura. Não reinscreve contatos descadastrados.

O formulário público foi testado com um endereço sintético único no domínio reservado `example.com`: mensagem de sucesso visível, registro e três propriedades confirmados pela API, remoção somente desse registro por ID e ausência posterior HTTP 404. Isso comprova o fluxo real de persistência com dados de QA, não um lead humano. O teste ocorreu no deployment inicial `dpl_FC7Au2z1VmKwKW1dAQqApakVTvQh`; o final mantém exatamente o mesmo código de captação e suas rotas foram relidas.

Nenhum e-mail foi enviado. O painel Resend não tinha automações configuradas na verificação. Cadastros ficam disponíveis em Contacts; campanhas futuras exigem decisão própria.

## Evidência visual

Pesquisa: `docs/pesquisa/springs.md`, com captura da extensão real do Chrome e evidência REA. QA Per Parte: `docs/pesquisa/perparte-lp-capturas/`, incluindo desktop, mobile, erro controlado sem chave e sucesso no endereço público. As imagens de luminárias continuam identificadas como conceituais.
