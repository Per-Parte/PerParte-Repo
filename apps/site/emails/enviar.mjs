import { mkdir, mkdtemp, open, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { carregarAmbiente } from '../servidor.mjs';
import { criarTransporteEmail, prepararEmail, ErroEmail, LIMITE_DADOS_EMAIL } from './transporte.mjs';

const diretorioPadrao = fileURLToPath(new URL('../../../.local/emails/', import.meta.url));
const ajuda = `Prévia local por padrão; não há gatilhos automáticos de cadastro, obra ou pedido.
Uso: node apps/site/emails/enviar.mjs --tipo boas-vindas --para pessoa@example.test --evento evento-123 --dados caminho/dados.json
Tipos: boas-vindas, orcamento-disponivel, atualizacao-pedido.
--enviar faz uma tentativa real somente com RESEND_ENABLED=true e configuração completa.
Repetições exigem o mesmo evento, dados e configuração. A idempotência Resend dura 24 horas; não há fila ou histórico persistente de envios.
Prévias HTML/texto ficam em .local/emails. Os arquivos podem conter dados pessoais e não devem ser publicados.`;

function argumentos(lista) {
  const resultado = {};
  for (let i = 0; i < lista.length; i++) {
    const chave = lista[i];
    if (!['--tipo', '--para', '--evento', '--dados', '--enviar', '--ajuda'].includes(chave) || Object.hasOwn(resultado, chave)) throw new ErroEmail('ARGUMENTOS_INVALIDOS', 'Use somente os argumentos documentados, sem repetições. Consulte --ajuda.');
    if (['--enviar', '--ajuda'].includes(chave)) resultado[chave] = true;
    else {
      const valor = lista[++i];
      if (!valor || valor.startsWith('--')) throw new ErroEmail('ARGUMENTOS_INVALIDOS', 'Falta o valor de um argumento. Consulte --ajuda.');
      resultado[chave] = valor;
    }
  }
  if (!resultado['--ajuda'] && ['--tipo', '--para', '--evento', '--dados'].some(chave => !resultado[chave])) throw new ErroEmail('ARGUMENTOS_INVALIDOS', 'Informe --tipo, --para, --evento e --dados. Consulte --ajuda.');
  return resultado;
}
async function lerDados(arquivo) {
  let handle;
  try {
    handle = await open(arquivo, 'r');
    if (!(await handle.stat()).isFile()) throw new Error();
    const buffer = Buffer.alloc(LIMITE_DADOS_EMAIL + 1);
    let tamanho = 0;
    while (tamanho < buffer.length) { const { bytesRead } = await handle.read(buffer, tamanho, buffer.length - tamanho, null); if (!bytesRead) break; tamanho += bytesRead; }
    if (tamanho > LIMITE_DADOS_EMAIL) throw new ErroEmail('DADOS_GRANDES', 'O arquivo de dados excede o limite de 16 KiB.');
    return JSON.parse(buffer.subarray(0, tamanho).toString('utf8'));
  } catch (erro) { if (erro instanceof ErroEmail) throw erro; throw new ErroEmail('ARQUIVO_INVALIDO', 'Não foi possível ler um arquivo JSON válido de dados.'); }
  finally { await handle?.close(); }
}

export async function executarCli(lista, { ambiente = process.env, fetchImpl = globalThis.fetch, diretorioPrevias = diretorioPadrao, escrever = console.log, carregarEnv = true } = {}) {
  const opcoes = argumentos(lista);
  if (opcoes['--ajuda']) { escrever(ajuda); return { modo: 'ajuda' }; }
  if (carregarEnv) carregarAmbiente();
  const entrada = { tipo: opcoes['--tipo'], para: opcoes['--para'], eventoId: opcoes['--evento'], dados: await lerDados(opcoes['--dados']) };
  if (opcoes['--enviar']) {
    const resultado = await criarTransporteEmail({ ambiente, fetchImpl })(entrada);
    escrever('E-mail aceito pelo Resend. A aceitação não confirma entrega. Não há gatilhos automáticos ativos.');
    return { modo: 'envio', ...resultado };
  }
  const preparado = prepararEmail(entrada, { ambiente });
  let diretorio;
  try {
    await mkdir(diretorioPrevias, { recursive: true, mode: 0o700 });
    diretorio = await mkdtemp(path.join(diretorioPrevias, 'previa-'));
    await writeFile(path.join(diretorio, 'email.html'), preparado.corpo.html, { encoding: 'utf8', mode: 0o600 });
    await writeFile(path.join(diretorio, 'email.txt'), preparado.corpo.text, { encoding: 'utf8', mode: 0o600 });
  } catch { throw new ErroEmail('PREVIA_INDISPONIVEL', 'Não foi possível gravar a prévia local. Nenhum e-mail foi enviado.'); }
  escrever(`Prévia local criada em ${diretorio}. Nenhum e-mail foi enviado. Não há gatilhos automáticos ativos.`);
  return { modo: 'previa', diretorio };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  executarCli(process.argv.slice(2)).catch(erro => {
    console.error(erro instanceof ErroEmail ? `${erro.codigo}: ${erro.message}` : 'ERRO_INTERNO: Não foi possível concluir a operação.');
    process.exitCode = 1;
  });
}
