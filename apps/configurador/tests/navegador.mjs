// E2E isolado. PLAYWRIGHT_MODULE permite usar a biblioteca do runtime local.
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const destino = fileURLToPath(new URL('../../../docs/pesquisa/configurador-capturas/', import.meta.url));
await mkdir(destino, { recursive: true });
const browser = await chromium.launch({ headless: true, channel: 'chrome' });
const context = await browser.newContext({ viewport: { width: 1440, height: 1040 }, deviceScaleFactor: 1 });
const page = await context.newPage();
const erros = [];
const provas = [];
page.on('pageerror', erro => erros.push(erro.message));
const foto = async nome => {
  await page.locator('#avisos.visivel').waitFor({ state: 'hidden', timeout: 6000 }).catch(() => {});
  await page.screenshot({ path: destino + nome + '.png', fullPage: true });
};
const estado = () => page.evaluate(() => JSON.parse(localStorage.getItem('perparte.configurador.v1')));
const clicar = async nome => page.getByRole('button', { name: nome, exact: true }).click();

try {
  await page.goto(process.env.CONFIGURADOR_URL || 'http://127.0.0.1:4175/', { waitUntil: 'networkidle' });
  await page.getByRole('heading', { name: 'Suas criações.' }).waitFor();
  assert.equal(await page.locator('.cartao-criacao').count(), 0);
  await foto('01-painel-vazio');
  await clicar('Nova luminária');
  await page.locator('[data-preset="livre"]').click();
  await page.locator('.visualizador-svg').waitFor();
  let modelo = await page.evaluate(() => JSON.parse(localStorage.getItem('perparte.configurador.v1')));
  assert.equal(modelo.modelos.length, 0);
  await foto('02-editor-livre');

  // A base livre começa como cubo; cotas por ponteiro/teclado e histórico continuam disponíveis.
  const largura = page.locator('#numero-largura');
  assert.equal(await largura.inputValue(), '90');
  await clicar('Girar 30 graus');
  const handle = page.locator('svg [data-dimensao="largura"]').first();
  await handle.scrollIntoViewIfNeeded();
  const caixa = await handle.boundingBox();
  await page.mouse.move(caixa.x + caixa.width / 2, caixa.y + caixa.height / 2);
  await page.mouse.down();
  await page.mouse.move(caixa.x + caixa.width / 2 + 38, caixa.y + caixa.height / 2, { steps: 8 });
  await page.mouse.up();
  await page.waitForTimeout(80);
  assert.ok(Number(await largura.inputValue()) > 90);
  await clicar('Desfazer alteração');
  assert.equal(await largura.inputValue(), '90');
  await clicar('Refazer alteração');
  assert.ok(Number(await largura.inputValue()) > 90);
  provas.push('Cota após giro altera largura; desfazer/refazer restaura medida');
  const alturaHandle = page.locator('svg [data-dimensao="altura"]').first();
  await alturaHandle.focus();
  await page.keyboard.press('End');
  assert.equal(await page.locator('#numero-altura').inputValue(), '90');
  await page.keyboard.press('Home');
  assert.equal(await page.locator('#numero-altura').inputValue(), '24');
  await page.locator('#numero-largura').fill('90');
  await page.locator('#numero-largura').press('Tab');
  await page.locator('#numero-altura').fill('90');
  await page.locator('#numero-altura').press('Tab');
  provas.push('Cotas por teclado respeitam limites e permitem edição numérica');

  // Cinco cubos (uma base e quatro corpos) e dois difusores ficam em IDs próprios.
  for (let i = 0; i < 4; i++) await page.locator('[data-adicionar="corpo"]').click();
  assert.equal(await page.locator('[data-selecionar-peca]').count(), 5);
  const idsLista = await page.locator('[data-selecionar-peca]').evaluateAll(el => el.map(item => item.dataset.selecionarPeca));
  assert.equal(new Set(idsLista).size, 5);

  const corpoAlvo = idsLista[2];
  await page.locator('[data-selecionar-peca="' + corpoAlvo + '"]').click();
  await page.locator('[data-face="direita"]').click();
  const alvoVisual = page.locator('#visualizador [data-peca="' + corpoAlvo + '"][data-face="direita"]').first();
  const alvoCaixa = await alvoVisual.boundingBox();
  const fonte = page.locator('[data-adicionar="difusor"]');
  const fonteCaixa = await fonte.boundingBox();
  await page.evaluate(() => {
    window.__capturarCliqueBandeja = true;
    window.__cliqueNativoBandejaInterceptado = false;
    document.addEventListener('click', event => {
      if (window.__capturarCliqueBandeja && event.target.closest('.peca-arrastavel')) {
        window.__capturarCliqueBandeja = false;
        window.__cliqueNativoBandejaInterceptado = true;
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    }, true);
  });
  await page.mouse.move(fonteCaixa.x + fonteCaixa.width / 2, fonteCaixa.y + fonteCaixa.height / 2);
  await page.mouse.down();
  await page.mouse.move(alvoCaixa.x + alvoCaixa.width / 2, alvoCaixa.y + alvoCaixa.height / 2, { steps: 12 });
  await page.mouse.up();
  await page.waitForTimeout(500);
  assert.equal(await page.evaluate(() => window.__cliqueNativoBandejaInterceptado), true);
  assert.equal(await page.locator('[data-selecionar-peca]').count(), 6);
  await fonte.dispatchEvent('click', { bubbles: true, cancelable: true, detail: 1 });
  assert.equal(await page.locator('[data-selecionar-peca]').count(), 6, 'clique atrasado após o arrasto não deve adicionar outra peça');
  provas.push('Arrastar bandeja conecta difusor à face indicada');

  await page.locator('[data-selecionar-peca="' + corpoAlvo + '"]').click();
  await page.locator('[data-face="esquerda"]').click();
  await page.locator('[data-adicionar="difusor"]').click();
  assert.equal(await page.locator('[data-selecionar-peca]').count(), 7);
  const bodyId = idsLista[1];
  await page.locator('[data-selecionar-peca="' + bodyId + '"]').click();
  await clicar('Brasa');
  await foto('03-montagem-multiplas-pecas');
  await page.locator('[data-etapa="2"]').click();
  await page.locator('#nome-criacao').fill('Montagem de teste');
  await clicar('Salvar criação');
  modelo = await page.evaluate(() => JSON.parse(localStorage.getItem('perparte.configurador.v1'))).modelos[0];
  assert.equal(modelo.pecas.length, 7);
  assert.equal(modelo.pecas.filter(p => p.tipo === 'base').length, 1);
  assert.equal(modelo.pecas.filter(p => p.tipo === 'corpo').length, 4);
  assert.equal(modelo.pecas.filter(p => p.tipo === 'difusor').length, 2);
  assert.equal(modelo.pecas.find(p => p.id === bodyId).cor, 'brasa');
  assert.equal(new Set(modelo.pecas.map(p => p.id)).size, 7);
  assert.equal(await page.locator('.tag-nova').count(), 1);
  await page.reload({ waitUntil: 'networkidle' });
  assert.equal(await page.locator('.tag-nova').count(), 1);
  provas.push('Cinco cubos e dois difusores persistem por ID, com cor independente');

  await page.locator('.abrir-criacao').click();
  assert.equal(await page.locator('[data-selecionar-peca]').count(), 7);
  const identidadeAntes = (await estado()).modelos[0].id;
  await page.locator('[data-etapa="2"]').click();
  await page.locator('#nome-criacao').fill('Montagem editada');
  await clicar('Salvar criação');
  let dados = await estado();
  assert.equal(dados.modelos.length, 1);
  assert.equal(dados.modelos[0].id, identidadeAntes);
  assert.equal(dados.modelos[0].pecas.length, 7);
  provas.push('Reabrir composição mantém ID da obra e das peças sem duplicar');

  // Segunda criação para preservar o fluxo de rascunho de pedido local.
  await clicar('Nova luminária');
  await page.locator('[data-preset="livre"]').click();
  await page.locator('[data-etapa="2"]').click();
  await page.locator('#nome-criacao').fill('Peça simples');
  await clicar('Salvar criação');
  await page.locator('[data-selecionar]').nth(0).check();
  await page.locator('[data-selecionar]').nth(1).check();
  await clicar('Preparar pedido');
  await foto('04-pedido');
  await clicar('Salvar rascunho');
  dados = await estado();
  assert.equal(dados.pedidos.length, 1);
  assert.equal(dados.pedidos[0].itens.length, 2);
  assert.equal(dados.pedidos[0].status, 'rascunho');
  await clicar('Ver pedido');
  const downloadEvent = page.waitForEvent('download');
  await clicar('Baixar pedido');
  assert.ok((await downloadEvent).suggestedFilename().endsWith('.json'));
  await clicar('Concluído');
  provas.push('Pedido local preserva duas composições e exportação JSON');

  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('tab', { name: /Minhas criações/ }).click();
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await clicar('Nova luminária');
  await page.locator('[data-preset="livre"]').click();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  assert.equal(await page.locator('[data-acao="flutuacao"]').getAttribute('aria-pressed'), 'false');
  assert.equal(await page.locator('[data-acao="som"]').getAttribute('aria-pressed'), 'false');
  await page.locator('[data-acao="som"]').click();
  assert.equal(await page.locator('[data-acao="som"]').getAttribute('aria-pressed'), 'true');
  await page.setViewportSize({ width: 320, height: 760 });
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await foto('05-editor-mobile');
  provas.push('Editor móvel sem overflow a 320/390 px; movimento reduzido pausa flutuação e mute funciona');
  assert.deepEqual(erros, []);
  provas.push('Nenhum pageerror nos fluxos');
  await writeFile(destino + 'resultado.json', JSON.stringify({ ok: true, provas, erros }, null, 2));
  console.log(JSON.stringify({ ok: true, provas, erros }, null, 2));
} catch (error) {
  await foto('falha-e2e').catch(() => {});
  console.error(error);
  console.error(await page.locator('body').innerText());
  process.exitCode = 1;
} finally {
  await browser.close();
}
