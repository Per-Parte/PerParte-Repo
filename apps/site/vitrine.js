import { montarPaleta } from './paleta.js';
import { apiLoja, demoProdutos, nos, varianteInicial, imagemProduto, coresProduto, corOpcao, urlProduto, urlSegura, precoFormatado, lerCarrinhoLocal, trocarCorPreservandoOpcoes, completarVariantesProduto } from './catalogo.js';

const grade = document.querySelector('#products');
const nota = document.querySelector('.collection-note');
const chaveCor = 'perparte.cor-catalogo.v1';
let produtos = [];
const variantesAtuais = new Map();
const consultasVariantes = new Map();
let trocaAtual = 0;

function elemento(tag, classe, texto) {
  const no = document.createElement(tag);
  if (classe) no.className = classe;
  if (texto) no.textContent = texto;
  return no;
}

function adicionarSeta(link) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  const caminho = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  caminho.setAttribute('d', 'M4 12h15M13 5l7 7-7 7');
  svg.append(caminho);
  link.append(svg);
  return link;
}

function renderizarProduto(produto) {
  const variante = varianteInicial(produto);
  variantesAtuais.set(produto.handle, variante);
  const card = elemento('article', 'product-card');
  card.dataset.handle = produto.handle;
  const area = elemento('div', 'product-image');
  const link = elemento('a', 'product-image-button');
  link.href = urlProduto(produto, variante);
  link.setAttribute('aria-label', `Conhecer ${produto.title}`);
  const foto = imagemProduto(produto, variante);
  const img = elemento('img');
  img.loading = 'lazy';
  if (urlSegura(foto?.url)) img.src = urlSegura(foto.url);
  else img.hidden = true;
  img.alt = foto?.altText || produto.title;
  link.append(img);
  const ver = adicionarSeta(elemento('a', 'product-quick', 'Conhecer a obra'));
  ver.href = link.href;
  const salvar = elemento('button', 'save-button');
  salvar.type = 'button';
  salvar.dataset.save = produto.handle;
  salvar.setAttribute('aria-label', `Salvar ${produto.title}`);
  salvar.setAttribute('aria-pressed', 'false');
  const iconeSalvar = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  iconeSalvar.setAttribute('aria-hidden', 'true');
  const usoSalvar = document.createElementNS('http://www.w3.org/2000/svg', 'use');
  usoSalvar.setAttribute('href', '#i-heart');
  iconeSalvar.append(usoSalvar);
  salvar.append(iconeSalvar);
  area.append(link, salvar, ver);
  const info = elemento('div', 'product-info');
  const texto = elemento('div');
  const titulo = elemento('a', 'product-name', produto.title);
  titulo.href = link.href;
  const preco = produto.estudo ? 'Composição em estudo' : precoFormatado(variante?.price || produto.priceRange?.minVariantPrice);
  texto.append(titulo, elemento('p', 'vitrine-preco', preco));
  const statusCor = elemento('p', 'vitrine-cor-status');
  statusCor.setAttribute('aria-live', 'polite');
  if (img.hidden) statusCor.textContent = 'Imagem desta opção em preparação.';
  texto.append(statusCor);
  const amostras = elemento('div', 'swatches');
  amostras.setAttribute('aria-label', `Cores de ${produto.title}`);
  coresProduto(produto).slice(0, 6).forEach(cor => {
    const amostra = elemento('i');
    amostra.title = cor.name;
    amostra.style.setProperty('--swatch', corOpcao(cor) || 'transparent');
    amostras.append(amostra);
  });
  info.append(texto, amostras);
  card.append(area, info);
  return card;
}

async function aplicarCor(nome) {
  const troca = ++trocaAtual;
  try { if (nome) sessionStorage.setItem(chaveCor, nome); else sessionStorage.removeItem(chaveCor); } catch { /* Preferência opcional. */ }
  await Promise.all(produtos.map(async produto => {
    const card = [...grade.children].find(item => item.dataset.handle === produto.handle);
    if (!card) return;
    const status = card.querySelector('.vitrine-cor-status');
    try {
      if (!consultasVariantes.has(produto.handle)) consultasVariantes.set(produto.handle, completarVariantesProduto(produto));
      await consultasVariantes.get(produto.handle);
    }
    catch { if (troca === trocaAtual) status.textContent = 'Não foi possível consultar as cores desta obra.'; return; }
    finally { consultasVariantes.delete(produto.handle); }
    if (troca !== trocaAtual) return;
    const variante = nome ? trocarCorPreservandoOpcoes(produto, variantesAtuais.get(produto.handle), nome) : varianteInicial(produto);
    if (!variante) {
      status.textContent = `${nome} não faz parte desta composição.`;
      return;
    }
    variantesAtuais.set(produto.handle, variante);
    card.querySelectorAll('a').forEach(link => { link.href = urlProduto(produto, variante); });
    const foto = variante.image;
    const img = card.querySelector('img');
    const fotoValida = urlSegura(foto?.url);
    img.hidden = !fotoValida;
    if (fotoValida) {
      img.src = urlSegura(foto.url);
      img.alt = foto.altText || `${produto.title}${nome ? `, ${nome}` : ''}`;
    }
    card.querySelector('.vitrine-preco').textContent = produto.estudo ? 'Composição em estudo' : precoFormatado(variante.price);
    status.textContent = fotoValida ? nome : `${nome || 'Esta opção'}: imagem em preparação.`;
    document.dispatchEvent(new CustomEvent('perparte:variante', { detail: { produto, variante } }));
  }));
}

function atualizarSacola() {
  const carrinho = lerCarrinhoLocal();
  document.querySelectorAll('.cart-count').forEach(contador => {
    contador.textContent = String(carrinho.quantidade);
    contador.hidden = !carrinho.quantidade;
  });
}

async function iniciarVitrine() {
  if (!grade) return;
  try {
    const dados = await apiLoja('/api/produtos?limite=12');
    const reais = nos(dados.produtos);
    produtos = reais.length ? reais : demoProdutos;
    grade.replaceChildren(...produtos.map(renderizarProduto));
    document.dispatchEvent(new CustomEvent('perparte:catalogo', { detail: { produtos, modo: dados.modo, emEstudo: !reais.length } }));
    if (reais.length) {
      document.querySelector('#collection-title').textContent = 'Encontre a sua luz.';
      nota.textContent = 'Explore as composições, cores e detalhes de cada obra. ';
    } else {
      nota.textContent = 'Coleção em estudo. Imagens conceituais. O catálogo de compra ainda está em preparação. ';
    }
    const loja = adicionarSeta(elemento('a', 'text-link', 'Explorar a loja'));
    loja.href = '/loja';
    nota.append(loja);
    const cores = new Map();
    produtos.forEach(produto => coresProduto(produto).forEach(cor => {
      const tom = corOpcao(cor);
      if (tom) cores.set(cor.name, tom);
    }));
    montarPaleta([...cores]);
    let corSalva;
    try { corSalva = sessionStorage.getItem(chaveCor); } catch { /* Navegação segue sem persistência. */ }
    if (corSalva) aplicarCor(corSalva);
  } catch {
    nota.textContent = 'Não foi possível consultar o catálogo agora. As imagens abaixo são estudos da coleção. Acesse a loja para tentar novamente. ';
    const tentar = adicionarSeta(elemento('a', 'text-link', 'Abrir loja'));
    tentar.href = '/loja';
    nota.append(tentar);
  }
}

document.addEventListener('perparte:cor', evento => { if (typeof evento.detail?.nome === 'string') aplicarCor(evento.detail.nome); });
window.addEventListener('perparte:carrinho', atualizarSacola);
window.addEventListener('storage', atualizarSacola);
window.addEventListener('pageshow', evento => {
  if (!evento.persisted) return;
  atualizarSacola();
  let nome = '';
  try { nome = sessionStorage.getItem(chaveCor) || ''; } catch { /* Cor opcional. */ }
  document.dispatchEvent(new CustomEvent('perparte:cor', { detail: { nome } }));
});
atualizarSacola();
iniciarVitrine();
