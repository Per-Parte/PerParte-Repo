/**
 * Modelos transacionais Per Parte. Renderização pura: não envia e-mails,
 * não autentica pessoas e não confirma a ocorrência de um evento.
 * siteUrl/accountUrl devem vir da configuração confiável do servidor.
 */
const TIPOS = new Set(['boas-vindas', 'orcamento-disponivel', 'atualizacao-pedido']);
const CORES = { luz: '#F6E7C4', brasa: '#A90000', palco: '#E7DFD0', tinta: '#1E1E1E' };
const FONTE = 'Arial, Helvetica, sans-serif';
const escapar = valor => String(valor).replace(/[&<>"']/g, caractere => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[caractere]));

function texto(valor, campo, { obrigatorio = false, limite = 160, multilinha = false } = {}) {
  if (valor === undefined || valor === null) {
    if (obrigatorio) throw new TypeError(`O campo ${campo} é obrigatório.`);
    return '';
  }
  if (typeof valor !== 'string') throw new TypeError(`O campo ${campo} precisa ser texto.`);
  if ((multilinha ? /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/ : /[\u0000-\u001f\u007f]/).test(valor)) throw new TypeError(`O campo ${campo} contém caracteres inválidos.`);
  const resultado = valor.replace(/\r\n?/g, '\n').trim();
  if (obrigatorio && !resultado) throw new TypeError(`O campo ${campo} é obrigatório.`);
  if (resultado.length > limite) throw new TypeError(`O campo ${campo} excede o limite de ${limite} caracteres.`);
  return resultado;
}

function urlHttps(valor, campo) {
  if (typeof valor !== 'string' || !valor.trim() || /[\\\u0000-\u0020\u007f]/.test(valor)) throw new TypeError(`O campo ${campo} precisa ser uma URL HTTPS válida.`);
  let url;
  try { url = new URL(valor); } catch { throw new TypeError(`O campo ${campo} precisa ser uma URL HTTPS válida.`); }
  if (url.protocol !== 'https:' || !url.hostname || url.username || url.password) throw new TypeError(`O campo ${campo} precisa ser uma URL HTTPS sem credenciais.`);
  return url;
}

function enderecoResposta(valor) {
  const email = texto(valor, 'replyTo', { limite: 254 });
  if (email && !/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9.-]*[a-zA-Z0-9])?\.[a-zA-Z]{2,}$/.test(email)) throw new TypeError('O campo replyTo precisa ser um endereço de e-mail simples.');
  return email;
}

function contextoLinks({ siteUrl, accountUrl, replyTo }) {
  const site = siteUrl === undefined || siteUrl === null ? null : urlHttps(siteUrl, 'siteUrl');
  const conta = accountUrl === undefined || accountUrl === null ? null : urlHttps(accountUrl, 'accountUrl');
  const origens = new Set([site?.origin, conta?.origin].filter(Boolean));
  return {
    site: site?.href || '', conta: conta?.href || '', resposta: enderecoResposta(replyTo),
    validarDestino(valor) {
      const destino = urlHttps(valor, 'url');
      if (!origens.has(destino.origin)) throw new TypeError('A URL precisa pertencer à origem configurada do site ou da conta.');
      return destino.href;
    },
  };
}

function conteudoModelo(tipo, dados, links) {
  const nome = texto(dados.nome, 'nome', { limite: 120 });
  const saudacao = nome ? `Oi, ${nome}.` : 'Oi.';
  if (tipo === 'boas-vindas') return {
    subject: 'Boas-vindas à Per Parte',
    preheader: 'Forma, cor e luz. Toda parte tem um porquê.',
    rotulo: 'Boas-vindas', titulo: 'Toda parte tem um porquê.', saudacao,
    paragrafos: ['Que bom ter você por aqui.', 'Na Per Parte, cada composição reúne escolhas de forma, cor e luz. Conheça as obras e encontre o que conversa com você.'],
    referencia: '', destino: links.conta || links.site,
    acao: links.conta ? 'Acessar minha conta' : 'Conhecer a Per Parte',
  };
  const numero = texto(dados.numero, 'numero', { obrigatorio: true, limite: 80 });
  const destino = links.validarDestino(dados.url);
  if (tipo === 'orcamento-disponivel') return {
    subject: `Seu orçamento ${numero} está disponível — Per Parte`,
    preheader: `Confira os detalhes do orçamento ${numero}.`,
    rotulo: 'Orçamento disponível', titulo: 'Sua composição, parte por parte.', saudacao,
    paragrafos: [`O orçamento ${numero} está disponível para você consultar.`, 'Veja os detalhes e as condições antes de continuar.'],
    referencia: `Orçamento ${numero}`, destino, acao: 'Ver orçamento',
  };
  const titulo = texto(dados.titulo, 'titulo', { obrigatorio: true, limite: 160 });
  const mensagem = texto(dados.mensagem, 'mensagem', { obrigatorio: true, limite: 12000, multilinha: true });
  return {
    subject: `Pedido ${numero}: ${titulo} — Per Parte`,
    preheader: `Uma atualização sobre o pedido ${numero}.`,
    rotulo: 'Atualização do pedido', titulo, saudacao,
    paragrafos: mensagem.split(/\n\s*\n/).filter(Boolean),
    referencia: `Pedido ${numero}`, destino, acao: 'Ver pedido',
  };
}

function paragrafoHtml(conteudo) {
  return `<p style="margin:0 0 20px;color:${CORES.tinta};font-family:${FONTE};font-size:16px;line-height:26px;overflow-wrap:anywhere;word-break:break-word;">${escapar(conteudo).replace(/\n/g, '<br>')}</p>`;
}

function renderizarHtml(modelo, links) {
  const acao = modelo.destino ? `<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:12px 0 28px;"><tr><td bgcolor="${CORES.brasa}" style="border-radius:28px;text-align:center;mso-padding-alt:15px 26px;"><a href="${escapar(modelo.destino)}" style="display:inline-block;padding:15px 26px;border:1px solid ${CORES.brasa};border-radius:28px;font-family:${FONTE};font-size:15px;line-height:20px;font-weight:700;color:${CORES.luz};text-decoration:none;text-align:center;">${escapar(modelo.acao)}</a></td></tr></table><p style="margin:0;font-family:${FONTE};font-size:12px;line-height:20px;color:${CORES.tinta};">Se preferir, copie o endereço no navegador:</p><p style="margin:4px 0 0;font-family:${FONTE};font-size:12px;line-height:20px;word-break:break-all;overflow-wrap:anywhere;"><a href="${escapar(modelo.destino)}" style="color:${CORES.brasa};text-decoration:underline;word-break:break-all;overflow-wrap:anywhere;">${escapar(modelo.destino)}</a></p>` : '';
  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>${escapar(modelo.subject)}</title>
  <style>@media screen and (max-width:620px){.email-externo{padding:12px!important}.email-conteudo{padding:32px 24px!important}.email-cabecalho{padding:28px 24px!important}.email-titulo{font-size:30px!important;line-height:35px!important}.email-rodape{padding:28px 24px!important}}</style>
</head>
<body style="margin:0;padding:0;width:100%;background-color:${CORES.palco};-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
  <div style="display:none;max-height:0;max-width:0;overflow:hidden;font-size:1px;line-height:1px;color:${CORES.palco};mso-hide:all;" aria-hidden="true">${escapar(modelo.preheader)}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="${CORES.palco}">
    <tr><td align="center" class="email-externo" style="padding:32px 16px;">
      <!--[if mso]><table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0"><tr><td><![endif]-->
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="${CORES.luz}" style="max-width:600px;width:100%;border-collapse:separate;">
        <tr><td class="email-cabecalho" style="padding:36px 40px 30px;border-bottom:1px solid ${CORES.palco};"><p style="margin:0;color:${CORES.brasa};font-family:${FONTE};font-size:30px;line-height:34px;font-weight:700;letter-spacing:-1.3px;">Per Parte</p></td></tr>
        <tr><td class="email-conteudo" style="padding:42px 40px 44px;">
          <p style="margin:0 0 20px;font-family:'Courier New',monospace;font-size:11px;line-height:16px;letter-spacing:1.2px;text-transform:uppercase;color:${CORES.brasa};">${escapar(modelo.rotulo)}</p>
          <h1 class="email-titulo" style="margin:0 0 28px;color:${CORES.tinta};font-family:${FONTE};font-size:36px;line-height:41px;font-weight:700;letter-spacing:-1px;overflow-wrap:anywhere;word-break:break-word;">${escapar(modelo.titulo)}</h1>
          ${modelo.referencia ? `<p style="margin:0 0 28px;font-family:'Courier New',monospace;font-size:12px;line-height:18px;color:${CORES.tinta};overflow-wrap:anywhere;word-break:break-word;">${escapar(modelo.referencia)}</p>` : ''}
          ${paragrafoHtml(modelo.saudacao)}
          ${modelo.paragrafos.map(paragrafoHtml).join('\n          ')}
          ${acao}
        </td></tr>
        <tr><td class="email-rodape" bgcolor="${CORES.tinta}" style="padding:30px 40px;">
          <p style="margin:0 0 16px;color:${CORES.luz};font-family:${FONTE};font-size:21px;line-height:28px;font-weight:700;">Criado por você,<br>feito por partes.</p>
          <p style="margin:0;color:${CORES.luz};font-family:${FONTE};font-size:12px;line-height:20px;">Per Parte${links.resposta ? `<br>Fale com a gente: ${escapar(links.resposta)}` : ''}</p>
        </td></tr>
      </table>
      <!--[if mso]></td></tr></table><![endif]-->
    </td></tr>
  </table>
</body>
</html>`;
}

/**
 * @param {'boas-vindas'|'orcamento-disponivel'|'atualizacao-pedido'} tipo
 * @param {{nome?:string,numero?:string,url?:string,titulo?:string,mensagem?:string}} dados
 * @param {{siteUrl?:string,accountUrl?:string,replyTo?:string}} opcoes
 * @returns {{subject:string,html:string,text:string}}
 * @throws {TypeError} Dados inválidos ou URL fora das origens configuradas.
 */
export function renderizarEmail(tipo, dados = {}, { siteUrl, accountUrl, replyTo } = {}) {
  if (!TIPOS.has(tipo)) throw new TypeError('Tipo de e-mail não reconhecido.');
  if (!dados || typeof dados !== 'object' || Array.isArray(dados)) throw new TypeError('Os dados do e-mail precisam ser um objeto.');
  const links = contextoLinks({ siteUrl, accountUrl, replyTo });
  const modelo = conteudoModelo(tipo, dados, links);
  const text = [
    'Per Parte', modelo.rotulo, modelo.titulo, modelo.referencia, modelo.saudacao,
    ...modelo.paragrafos, modelo.destino ? `${modelo.acao}: ${modelo.destino}` : '',
    'Criado por você, feito por partes.', links.resposta ? `Fale com a gente: ${links.resposta}` : '',
  ].filter(Boolean).join('\n\n');
  return { subject: modelo.subject, html: renderizarHtml(modelo, links), text };
}
