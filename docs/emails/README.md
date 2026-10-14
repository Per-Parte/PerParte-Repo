# Modelos de e-mail Per Parte

**Estado: preparados, sem gatilhos ativos.** A galeria está em [index.html](./index.html). Todos os nomes, números e endereços das prévias são fictícios. Nenhuma mensagem foi enviada. O aviso de simulação é acrescentado pela galeria/gerador, fora do conteúdo retornado pelo renderer.

## Contrato

Módulo sem dependências: `apps/site/emails/modelos.mjs`.

```js
import { renderizarEmail } from './apps/site/emails/modelos.mjs';

const { subject, html, text } = renderizarEmail(tipo, dados, {
  siteUrl,    // URL HTTPS confiável configurada no servidor
  accountUrl, // URL HTTPS do portal de conta configurada no servidor
  replyTo,    // e-mail simples opcional, exibido como contato
});
```

| Tipo | Dados obrigatórios | Dados opcionais | Uso preparado |
|---|---|---|---|
| `boas-vindas` | Nenhum | `nome` | Saudação sem afirmar criação de conta, compra ou sincronização. CTA para `accountUrl`, ou `siteUrl` se a conta não estiver configurada. Sem ambas, não mostra CTA. |
| `orcamento-disponivel` | `numero`, `url` | `nome` | Avisa sobre orçamento realmente disponível. O chamador precisa comprovar o evento e o vínculo com o destinatário. |
| `atualizacao-pedido` | `numero`, `titulo`, `mensagem`, `url` | `nome` | Exibe a atualização recebida nos dados. Não deduz produção, aprovação, envio, pagamento ou prazo. |

Todos os campos de conteúdo são strings. `numero` preserva zeros e prefixos do sistema de origem. Nome tem limite de 120 caracteres; número, 80; título, 160; mensagem, 12.000. Campos obrigatórios vazios, tipos desconhecidos e caracteres de controle inválidos produzem `TypeError`. Mensagem aceita quebras de linha; título, número e nome não aceitam quebras de linha. A versão de texto simples conserva a informação sem HTML.

As URLs devem ser **HTTPS absolutas**, sem credenciais, barras invertidas ou caracteres de controle. O destino de orçamento/pedido precisa ter origem exatamente igual à de `siteUrl` ou `accountUrl`; subdomínios e portas diferentes não são admitidos implicitamente. Sem origem configurada, esses modelos falham. Configuração de origem deve vir do servidor, nunca do corpo livre de uma chamada pública. A validação não consulta DNS nem prova que o evento ou o recurso existem.

Strings são escapadas para o HTML, inclusive títulos, mensagens e atributos de link. `subject` e `text` são texto simples. `replyTo` não define um cabeçalho de envio: apenas exibe o contato no rodapé. O transporte deve configurar o cabeçalho correspondente quando integrado. Dados de exemplo ficam somente no manifesto e nas prévias; o renderer não possui valores comerciais de demonstração embutidos.

## Identidade e limites

Luz Acesa `#F6E7C4`, Brasa `#A90000`, Palco Claro `#E7DFD0` e Palco Escuro `#1E1E1E` vêm dos tokens Per Parte. Tabelas de apresentação, largura máxima de 600 px, estilos essenciais inline e fallback Arial/Helvetica substituem as fontes web nesta mídia. O nome da marca é texto; não foi criado um novo símbolo. Não há imagens remotas, rastreadores, dependências externas ou scripts no HTML de e-mail.

A voz se apoia na Revista de Marca, pp. 25–28 e 54–55, sem transportar seus exemplos de prazo para promessas comerciais. Nenhum modelo informa preço, estoque, garantia ou estado de produção por conta própria. A saudação não afirma que uma conta foi criada. Códigos de acesso e autenticação das novas contas permanecem na Shopify; este módulo não implementa OTP nem sincroniza obras do configurador.

O renderer é puro: recebe dados e retorna conteúdo. Não lê ambiente/arquivos, não acessa rede, não escolhe destinatários e não registra eventos. Antes de um envio futuro, a integração deve validar o evento real e o destinatário, evitando duplicar notificações que a Shopify já envie. Cliques, favoritos, `localStorage` e rascunhos locais não são gatilhos comerciais comprovados.

## Atualizar as prévias

Na raiz do repositório:

```sh
node docs/emails/gerar-previas.mjs
```

O script lê [manifesto.json](./manifesto.json), chama o renderer e grava somente os três HTMLs, três textos simples e a galeria nesta pasta. Não envia mensagens. Abra `index.html` para revisar; cada modelo também tem uma prévia completa independente.

Para revisar pelo navegador com servidor local, execute na raiz:

```sh
node docs/emails/servir-previas.mjs
```

Abra `http://127.0.0.1:4182`. O servidor escuta somente no loopback, aceita `GET`/`HEAD` e expõe uma lista fixa: galeria, três prévias HTML, três textos simples, manifesto e este README. Nenhum outro arquivo, script, credencial ou diretório é servido. Não há envio nem dependências externas. Encerre com `Ctrl+C`.

A visualização em navegador não comprova compatibilidade de Outlook, Gmail, Apple Mail ou outros clientes, nem entrega. Testes de recebimento reais e habilitação de gatilhos permanecem etapas separadas.
