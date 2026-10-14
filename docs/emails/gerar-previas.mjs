import { readFile, writeFile } from 'node:fs/promises';
import { renderizarEmail } from '../../apps/site/emails/modelos.mjs';

const manifesto = JSON.parse(await readFile(new URL('./manifesto.json', import.meta.url), 'utf8'));
const tipos = new Set(['boas-vindas', 'orcamento-disponivel', 'atualizacao-pedido']);
const escapar = valor => String(valor).replace(/[&<>"']/g, caractere => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[caractere]));
const modelos = [];

for (const modelo of manifesto.modelos) {
  if (!tipos.has(modelo.tipo)) throw new TypeError('O manifesto contém um tipo de prévia não permitido.');
  const email = renderizarEmail(modelo.tipo, modelo.dadosDeSimulacao, manifesto.opcoesDeSimulacao);
  const aviso = `<aside aria-label="Aviso de simulação" style="padding:16px 24px;background:#1E1E1E;color:#F6E7C4;font:13px/1.6 Arial,Helvetica,sans-serif;text-align:center;"><strong>SIMULAÇÃO LOCAL · NENHUM ENVIO</strong><br>Dados e endereços fictícios. Modelos preparados; nenhum gatilho ativo.<br><span style="font-size:12px;">Assunto: ${escapar(email.subject)}</span></aside>`;
  const previa = email.html.replace(/(<body\b[^>]*>)/, `$1\n${aviso}`);
  await writeFile(new URL(`./${modelo.tipo}.html`, import.meta.url), previa, 'utf8');
  await writeFile(new URL(`./${modelo.tipo}.txt`, import.meta.url), `SIMULAÇÃO LOCAL · NENHUM ENVIO\nDados e endereços fictícios. Modelos preparados; nenhum gatilho ativo.\nAssunto: ${email.subject}\n\n--- INÍCIO DO MODELO ---\n\n${email.text}\n`, 'utf8');
  modelos.push({ ...modelo, subject: email.subject });
}

const galeria = `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Prévias de e-mail — Per Parte</title>
<style>
*{box-sizing:border-box}body{margin:0;background:#E7DFD0;color:#1E1E1E;font:16px/1.5 Arial,Helvetica,sans-serif}a{color:#A90000;text-underline-offset:4px}header,main,footer{max-width:1440px;margin:auto;padding:36px}.marca{font-size:26px;font-weight:700;letter-spacing:-1px;color:#A90000}.estado{font:11px/1.5 'Courier New',monospace;letter-spacing:1px;text-transform:uppercase;margin:36px 0 16px}h1{font-size:clamp(30px,4vw,52px);line-height:1.1;max-width:700px;letter-spacing:-1.8px;margin:0 0 25px}header p:last-child{max-width:750px;margin:0;font-size:16px}.galeria{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:24px;padding-top:0}article{min-width:0}article header{padding:24px 0 20px;border-top:1px solid #1e1e1e30}h2{font-size:20px;line-height:1.3;margin:0 0 10px;letter-spacing:-.4px}.assunto{font-size:12px;min-height:40px;margin:0 0 12px}.links{display:flex;gap:16px;flex-wrap:wrap;font-size:12px}iframe{width:100%;height:1050px;background:#F6E7C4;border:1px solid #1e1e1e30;border-radius:8px}footer{padding-top:10px;font-size:12px;max-width:1440px}footer p{max-width:820px}:focus-visible{outline:2px solid #A90000;outline-offset:4px}@media(max-width:1100px){.galeria{grid-template-columns:1fr;max-width:720px}iframe{height:1000px}.assunto{min-height:0}}@media(max-width:480px){header,main,footer{padding:24px 16px}header p:last-child{font-size:14px}iframe{height:1150px}.estado{margin-top:28px}h1{letter-spacing:-1px}}
</style></head><body>
<header><div class="marca">Per Parte</div><p class="estado">Prévias locais · 3 modelos · nenhum envio</p><h1>Mensagens com a voz da Per Parte.</h1><p>Modelos preparados, sem gatilhos ativos. Os exemplos abaixo usam nomes, números e endereços fictícios. Não representam contas criadas, orçamentos disponíveis ou pedidos reais.</p></header>
<main class="galeria">${modelos.map(modelo => `<article><header><h2>${escapar(modelo.nome)}</h2><p class="assunto"><strong>Assunto:</strong> ${escapar(modelo.subject)}</p><div class="links"><a href="./${modelo.tipo}.html">Abrir prévia completa</a><a href="./${modelo.tipo}.txt">Ver texto simples</a></div></header><iframe title="Simulação de ${escapar(modelo.nome)}" src="./${modelo.tipo}.html" loading="lazy" sandbox></iframe></article>`).join('')}</main>
<footer><p>Largura máxima do e-mail: 600 px, com adaptação para telas estreitas. A estrutura usa tabelas, estilos essenciais inline e fontes de fallback. Esta galeria permite revisão visual; compatibilidade e entrega em clientes reais ainda dependem de validação.</p><p>A autenticação e os códigos de acesso continuam na Shopify. O renderer não envia mensagens nem sincroniza criações. <a href="./README.md">Contrato dos modelos</a> · <a href="./manifesto.json">Manifesto</a></p></footer>
</body></html>`;
await writeFile(new URL('./index.html', import.meta.url), galeria, 'utf8');
console.log(`Prévias locais geradas: ${modelos.length} modelos. Nenhuma mensagem enviada.`);
