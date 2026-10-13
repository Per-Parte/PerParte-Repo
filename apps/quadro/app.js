const $ = (selector) => document.querySelector(selector);
const viewport = $('#viewport');
const world = $('#world');
const cardsLayer = $('#cardsLayer');
const connections = $('#connections');
const inspector = $('#inspector');
const itemList = $('#itemList');
const searchInput = $('#searchInput');
const saveState = $('#saveState');
const toast = $('#toast');

const seed = {
  version: 1,
  cards: [
    { id: 'revista', type: 'document', title: 'Revista de Marca', body: 'O documento mestre da Per Parte. Visão, público, produto e identidade em 67 páginas.', url: '/conteudo/revista', label: 'FONTE PRIMÁRIA · PDF', cover: 'brand', x: 90, y: 155 },
    { id: 'visao', type: 'document', title: 'A era do criar', body: 'A pessoa cria sua obra parte por parte. A Per Parte fabrica sob demanda e reconhece sua autoria.', url: '/conteudo/visao', label: 'VISÃO GERAL', cover: 'vision', x: 420, y: 155 },
    { id: 'design', type: 'document', title: 'Design system', body: 'Luz Acesa, Brasa, tipografia provisória, fotografia e regras de uso da marca.', url: '/conteudo/design', label: 'IDENTIDADE VISUAL', cover: 'design', x: 90, y: 455 },
    { id: 'requisitos', type: 'document', title: 'Requisitos & decisões', body: 'O que está decidido, provisório, em aberto e reservado para o futuro.', url: '/conteudo/requisitos', label: 'DOCUMENTO DE CONTEXTO', x: 420, y: 455 },
    { id: 'site', type: 'document', title: 'Site', body: 'Narrativa de autoria, obra acesa, acabamento real e convite para começar a criar.', url: '/conteudo/site', label: 'APLICATIVO / 01', x: 840, y: 155 },
    { id: 'configurador', type: 'document', title: 'Configurador', body: 'Montar e Inventar: criar uma luminária de mesa dentro dos limites de fabricação.', url: '/conteudo/configurador', label: 'APLICATIVO / 02', x: 1170, y: 155 },
    { id: 'roadmap', type: 'document', title: 'Roadmap', body: 'Pesquisa concluída, decisões a validar e próximos passos dos aplicativos.', url: '/conteudo/roadmap', label: 'PLANEJAMENTO', x: 840, y: 455 },
    { id: 'pendencias', type: 'decision', title: 'Decisões em aberto', body: 'Validar logo e fontes finais, filamentos, preços, prazo, garantia e royalties com Caio e Davi.', status: 'EM ABERTO', label: 'PRÓXIMA CONVERSA', x: 1170, y: 455 },
    { id: 'gantri', type: 'document', title: 'Gantri', body: 'Principal benchmark. Pesquisa de composição, tipografia, raios, sombras e apresentação de luminárias.', url: '/conteudo/gantri', label: 'BENCHMARK', cover: 'research', x: 1590, y: 155 },
    { id: 'gantri-site', type: 'link', title: 'Visitar Gantri', body: 'Acompanhar a apresentação das peças e a experiência atual do site.', url: 'https://www.gantri.com/', label: 'REFERÊNCIA EXTERNA', x: 1590, y: 455 }
  ],
  edges: [
    { from: 'revista', to: 'visao' },
    { from: 'revista', to: 'design' },
    { from: 'visao', to: 'site' },
    { from: 'visao', to: 'configurador' },
    { from: 'requisitos', to: 'pendencias' },
    { from: 'gantri', to: 'gantri-site' }
  ]
};

const typeNames = { document: 'DOCUMENTO', file: 'ARQUIVO', note: 'NOTA', link: 'LINK', decision: 'DECISÃO' };
const typeGlyphs = { document: '▤', file: '▧', note: '✳', link: '↗', decision: '✓' };
const allowedTypes = new Set(Object.keys(typeNames));
let db;
let board;
let selectedId = null;
let connectFrom = null;
let offsetX = 28;
let offsetY = 26;
let scale = 0.78;
let gesture = null;
let saveTimer;
let toastTimer;

function requestResult(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('perparte-quadro', 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore('state');
      request.result.createObjectStore('files');
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function getRecord(store, key) {
  return requestResult(db.transaction(store, 'readonly').objectStore(store).get(key));
}

function putRecord(store, key, value) {
  return requestResult(db.transaction(store, 'readwrite').objectStore(store).put(value, key));
}

function deleteRecord(store, key) {
  return requestResult(db.transaction(store, 'readwrite').objectStore(store).delete(key));
}

function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
}

function safeUrl(value) {
  if (typeof value !== 'string') return null;
  if (value.startsWith('/conteudo/')) return value;
  try {
    const parsed = new URL(value);
    return ['http:', 'https:'].includes(parsed.protocol) ? parsed.href : null;
  } catch { return null; }
}

function cardById(id) { return board.cards.find((card) => card.id === id); }
function uid() { return crypto.randomUUID(); }
function cardSummary(card) { return `${card.title} ${card.body || ''} ${card.label || ''}`.toLocaleLowerCase('pt-BR'); }

function notify(message) {
  toast.textContent = message;
  toast.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('visible'), 3200);
}

function queueSave() {
  saveState.innerHTML = '<span class="save-dot"></span> Salvando…';
  clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    try {
      await putRecord('state', 'main', board);
      saveState.innerHTML = '<span class="save-dot"></span> Salvo neste navegador';
    } catch {
      saveState.textContent = 'Erro ao salvar';
      notify('Não foi possível salvar o quadro. Exporte uma cópia.');
    }
  }, 240);
}

function renderTransform() {
  world.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
  $('#zoomLevel').textContent = `${Math.round(scale * 100)}%`;
}

function renderConnections() {
  connections.innerHTML = board.edges.map(({ from, to }) => {
    const a = cardById(from);
    const b = cardById(to);
    if (!a || !b) return '';
    const leftToRight = a.x <= b.x;
    const x1 = a.x + (leftToRight ? 294 : 0);
    const y1 = a.y + 100;
    const x2 = b.x + (leftToRight ? 0 : 294);
    const y2 = b.y + 100;
    const bend = Math.max(50, Math.abs(x2 - x1) * .45);
    const d = `M ${x1} ${y1} C ${x1 + (leftToRight ? bend : -bend)} ${y1}, ${x2 - (leftToRight ? bend : -bend)} ${y2}, ${x2} ${y2}`;
    return `<path d="${d}"/><circle cx="${x1}" cy="${y1}" r="3"/><circle cx="${x2}" cy="${y2}" r="3"/>`;
  }).join('');
}

function renderCards() {
  const query = searchInput.value.trim().toLocaleLowerCase('pt-BR');
  cardsLayer.innerHTML = board.cards.map((card) => {
    const isDocument = card.type === 'document' || card.type === 'file';
    const action = card.url || card.blobId ? (card.type === 'link' ? 'ABRIR LINK ↗' : 'ABRIR DOCUMENTO ↗') : 'VER DETALHES →';
    const cover = card.cover && ['brand', 'vision', 'design', 'research'].includes(card.cover)
      ? `<div class="card-cover cover-${card.cover}"><strong>${escapeHtml(card.cover === 'brand' ? 'a era do\ncriar.' : card.cover === 'vision' ? 'por você.' : card.cover === 'design' ? 'marca em\npartes.' : 'referência.')}</strong></div>` : '';
    return `<article class="card ${escapeHtml(card.type)} ${cover ? '' : 'simple'} ${selectedId === card.id ? 'selected' : ''} ${query && !cardSummary(card).includes(query) ? 'dimmed' : ''}" data-id="${escapeHtml(card.id)}" style="left:${Number(card.x)}px;top:${Number(card.y)}px">
      <div class="card-handle"><span class="card-kicker"><span class="card-type-dot"></span>${escapeHtml(card.label || typeNames[card.type])}</span><span class="card-menu" aria-hidden="true">⋮</span></div>
      ${cover}
      <div class="card-body">${card.status ? `<span class="status-pill">● ${escapeHtml(card.status)}</span>` : ''}<h2>${escapeHtml(card.title)}</h2><p>${escapeHtml(card.body || 'Clique para adicionar informações.')}</p></div>
      <div class="card-footer"><span>${escapeHtml(typeNames[card.type] || 'ITEM')}</span><button class="card-action" type="button" data-action="${isDocument || card.type === 'link' ? 'open' : 'select'}">${action}</button></div>
    </article>`;
  }).join('');
  renderConnections();
  renderList();
  $('#cardCount').textContent = String(board.cards.length).padStart(2, '0');
}

function renderList() {
  const query = searchInput.value.trim().toLocaleLowerCase('pt-BR');
  itemList.innerHTML = board.cards.filter((card) => !query || cardSummary(card).includes(query))
    .map((card) => `<button type="button" data-id="${escapeHtml(card.id)}" class="${selectedId === card.id ? 'active' : ''}"><span class="list-glyph">${typeGlyphs[card.type]}</span><span class="list-title">${escapeHtml(card.title)}</span></button>`).join('') || '<p style="padding: 12px; font-size: 12px; color: #8b8d84">Nenhum item encontrado.</p>';
}

function renderInspector() {
  const card = cardById(selectedId);
  inspector.classList.toggle('open', Boolean(card));
  if (!card) {
    inspector.innerHTML = `<div class="inspector-inner"><span class="inspector-kicker">SEU ESPAÇO DE CRIAÇÃO</span><h2>Ideias ganham forma aqui.</h2><p class="lead">Selecione um cartão para editar, abrir documentos ou conectá-lo a outra parte do projeto.</p><div class="inspector-rule"></div><div class="inspector-brief"><strong>Comece pela Revista de Marca.</strong>Ela orienta a visão, a experiência e o design da Per Parte. O quadro pode crescer conforme as decisões forem tomadas.</div><div class="inspector-rule"></div><div class="inspector-brief"><strong>Como navegar</strong>Arraste o fundo para mover o quadro; use a roda do mouse ou os controles para ampliar. Arraste o topo de um cartão para reposicioná-lo.</div></div>`;
    return;
  }
  const linked = board.edges.filter((edge) => edge.from === card.id || edge.to === card.id);
  inspector.innerHTML = `<div class="inspector-inner">
    <button type="button" class="inspector-close" id="closeInspector" aria-label="Fechar detalhes">×</button>
    <span class="inspector-kicker">${escapeHtml(typeNames[card.type])} / EDITAR ITEM</span>
    <h2>${escapeHtml(card.title)}</h2>
    ${connectFrom ? `<div class="connecting-banner">Selecione outro cartão para conectar a “${escapeHtml(cardById(connectFrom)?.title || '')}”. Pressione Esc para cancelar.</div>` : ''}
    <div class="inspector-rule"></div>
    <label class="field"><span class="field-label">TÍTULO</span><input data-field="title" maxlength="100" value="${escapeHtml(card.title)}" /></label>
    <label class="field"><span class="field-label">DESCRIÇÃO / NOTAS</span><textarea data-field="body" maxlength="4000">${escapeHtml(card.body || '')}</textarea></label>
    <label class="field"><span class="field-label">CATEGORIA</span><input data-field="label" maxlength="45" value="${escapeHtml(card.label || '')}" placeholder="EX.: PESQUISA" /></label>
    ${card.type === 'link' ? `<label class="field"><span class="field-label">ENDEREÇO (HTTPS)</span><input data-field="url" type="url" value="${escapeHtml(card.url || '')}" placeholder="https://..." /></label>` : ''}
    ${card.type === 'decision' ? `<label class="field"><span class="field-label">ESTADO</span><select data-field="status">${['EM ABERTO', 'PROPOSTA', 'PROVISÓRIO', 'DECIDIDO'].map((status) => `<option ${card.status === status ? 'selected' : ''}>${status}</option>`).join('')}</select></label>` : ''}
    <div class="inspector-buttons">
      ${card.url || card.blobId ? '<button type="button" class="primary" data-inspector-action="open">Abrir ↗</button>' : ''}
      <button type="button" data-inspector-action="connect">Conectar</button>
      <button type="button" class="danger" data-inspector-action="delete">Excluir</button>
    </div>
    <div class="inspector-meta"><span class="meta-label">CONEXÕES</span><p>${linked.length ? linked.map((edge) => escapeHtml(cardById(edge.from === card.id ? edge.to : edge.from)?.title || '')).join(' · ') : 'Este item ainda não está conectado.'}</p>
    <span class="meta-label">ORIGEM</span><p>${card.blobId ? 'Arquivo guardado neste navegador.' : card.url?.startsWith('/conteudo/') ? 'Documento do repositório Per Parte.' : card.url ? escapeHtml(card.url) : 'Criado no quadro.'}</p></div>
  </div>`;
}

function selectCard(id, focus = false) {
  if (connectFrom && id !== connectFrom) {
    if (!board.edges.some((edge) => (edge.from === connectFrom && edge.to === id) || (edge.from === id && edge.to === connectFrom))) {
      board.edges.push({ from: connectFrom, to: id });
      queueSave();
      notify('Itens conectados.');
    }
    connectFrom = null;
  }
  selectedId = id;
  renderCards();
  renderInspector();
  if (focus) focusCard(id);
}

function focusCard(id) {
  const card = cardById(id);
  if (!card) return;
  const rect = viewport.getBoundingClientRect();
  offsetX = rect.width / 2 - (card.x + 147) * scale;
  offsetY = rect.height / 2 - (card.y + 115) * scale;
  renderTransform();
}

function screenToWorld(clientX, clientY) {
  const rect = viewport.getBoundingClientRect();
  return { x: (clientX - rect.left - offsetX) / scale, y: (clientY - rect.top - offsetY) / scale };
}

function centerWorldPoint() {
  const rect = viewport.getBoundingClientRect();
  return screenToWorld(rect.left + rect.width / 2, rect.top + rect.height / 2);
}

function newCard(type, overrides = {}, point = centerWorldPoint()) {
  const titles = { note: 'Nova nota', link: 'Novo link', file: 'Novo arquivo', decision: 'Nova decisão' };
  const card = {
    id: uid(), type, title: titles[type], body: '', label: typeNames[type],
    x: Math.round(point.x - 147), y: Math.round(point.y - 100),
    ...overrides
  };
  board.cards.push(card);
  queueSave();
  selectCard(card.id, true);
  setTimeout(() => inspector.querySelector('[data-field="title"]')?.focus(), 0);
  return card;
}

async function addFiles(files, point) {
  let x = point?.x ?? centerWorldPoint().x;
  let y = point?.y ?? centerWorldPoint().y;
  for (const file of files) {
    if (file.size > 80 * 1024 * 1024) { notify(`“${file.name}” excede o limite de 80 MB.`); continue; }
    const blobId = uid();
    try {
      await putRecord('files', blobId, { blob: file, name: file.name, type: file.type });
      newCard('file', { title: file.name, label: 'ARQUIVO ADICIONADO', body: `${(file.size / 1024 / 1024).toFixed(2)} MB · salvo neste navegador`, blobId }, { x, y });
      x += 32; y += 32;
    } catch { notify(`Não foi possível guardar “${file.name}”.`); }
  }
}

async function openCard(card) {
  if (card.blobId) {
    const record = await getRecord('files', card.blobId);
    if (!record) { notify('Arquivo não encontrado neste navegador.'); return; }
    const url = URL.createObjectURL(record.blob);
    window.open(url, '_blank', 'noopener,noreferrer');
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
    return;
  }
  const url = safeUrl(card.url);
  if (!url) { notify('Adicione um endereço válido para abrir.'); return; }
  window.open(url, '_blank', 'noopener,noreferrer');
}

function setZoom(next, clientX, clientY) {
  const rect = viewport.getBoundingClientRect();
  const sx = clientX ?? rect.left + rect.width / 2;
  const sy = clientY ?? rect.top + rect.height / 2;
  const point = screenToWorld(sx, sy);
  scale = Math.max(.35, Math.min(1.7, next));
  offsetX = sx - rect.left - point.x * scale;
  offsetY = sy - rect.top - point.y * scale;
  renderTransform();
}

function fitBoard() {
  if (!board.cards.length) return;
  const rect = viewport.getBoundingClientRect();
  const minX = Math.min(...board.cards.map((card) => card.x)) - 80;
  const maxX = Math.max(...board.cards.map((card) => card.x + 294)) + 80;
  const minY = Math.min(...board.cards.map((card) => card.y)) - 85;
  const maxY = Math.max(...board.cards.map((card) => card.y + (card.cover ? 300 : 210))) + 90;
  scale = Math.max(.35, Math.min(1, Math.min(rect.width / (maxX - minX), rect.height / (maxY - minY))));
  offsetX = (rect.width - (maxX + minX) * scale) / 2;
  offsetY = (rect.height - (maxY + minY) * scale) / 2;
  renderTransform();
}

function deleteSelected() {
  const card = cardById(selectedId);
  if (!card || !window.confirm(`Excluir “${card.title}” do quadro?`)) return;
  board.cards = board.cards.filter((item) => item.id !== card.id);
  board.edges = board.edges.filter((edge) => edge.from !== card.id && edge.to !== card.id);
  if (card.blobId) deleteRecord('files', card.blobId).catch(() => {});
  selectedId = null;
  connectFrom = null;
  queueSave();
  renderCards(); renderInspector();
  notify('Item excluído.');
}

function readBlobAsDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

async function exportBoard() {
  const files = {};
  for (const card of board.cards.filter((item) => item.blobId)) {
    const record = await getRecord('files', card.blobId);
    if (record) files[card.blobId] = { name: record.name, type: record.type, data: await readBlobAsDataUrl(record.blob) };
  }
  const data = new Blob([JSON.stringify({ format: 'perparte-quadro', version: 1, board, files }, null, 2)], { type: 'application/json' });
  const anchor = document.createElement('a');
  anchor.href = URL.createObjectURL(data);
  anchor.download = `perparte-quadro-${new Date().toISOString().slice(0, 10)}.json`;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(anchor.href), 30_000);
  notify('Cópia do quadro exportada.');
}

async function importBoard(file) {
  if (!file || file.size > 120 * 1024 * 1024) throw new Error('Arquivo muito grande.');
  const parsed = JSON.parse(await file.text());
  if (parsed.format !== 'perparte-quadro' || !Array.isArray(parsed.board?.cards) || !Array.isArray(parsed.board?.edges)) throw new Error('Formato do quadro inválido.');
  const ids = new Set();
  const cards = parsed.board.cards.map((item) => {
    if (!item || typeof item.id !== 'string' || ids.has(item.id) || !allowedTypes.has(item.type) || !Number.isFinite(item.x) || !Number.isFinite(item.y)) throw new Error('Cartões inválidos.');
    ids.add(item.id);
    return { id: item.id, type: item.type, title: String(item.title || '').slice(0, 100), body: String(item.body || '').slice(0, 4000), label: String(item.label || '').slice(0, 45), status: String(item.status || '').slice(0, 30), url: safeUrl(item.url) || '', blobId: typeof item.blobId === 'string' ? item.blobId : undefined, cover: item.cover, x: item.x, y: item.y };
  });
  const edges = parsed.board.edges.filter((edge) => ids.has(edge.from) && ids.has(edge.to) && edge.from !== edge.to).map((edge) => ({ from: edge.from, to: edge.to }));
  if (!window.confirm('Importar este arquivo substituirá o quadro atual neste navegador. Continuar?')) return;
  for (const [id, record] of Object.entries(parsed.files || {})) {
    if (!cards.some((card) => card.blobId === id) || typeof record.data !== 'string' || !record.data.startsWith('data:')) continue;
    const blob = await (await fetch(record.data)).blob();
    await putRecord('files', id, { blob, name: String(record.name || 'Arquivo'), type: String(record.type || '') });
  }
  board = { version: 1, cards, edges };
  selectedId = null;
  queueSave();
  renderCards(); renderInspector(); fitBoard();
  notify('Quadro importado.');
}

document.querySelectorAll('[data-create]').forEach((button) => button.addEventListener('click', () => {
  const type = button.dataset.create;
  if (type === 'file') $('#fileInput').click(); else newCard(type);
}));
$('#fileInput').addEventListener('change', async (event) => { await addFiles(event.target.files); event.target.value = ''; });
$('#exportButton').addEventListener('click', () => exportBoard().catch(() => notify('Não foi possível exportar o quadro.')));
$('#importButton').addEventListener('click', () => $('#importInput').click());
$('#importInput').addEventListener('change', async (event) => {
  try { await importBoard(event.target.files[0]); } catch (error) { notify(error.message || 'Não foi possível importar.'); }
  event.target.value = '';
});
searchInput.addEventListener('input', renderCards);
itemList.addEventListener('click', (event) => { const button = event.target.closest('button[data-id]'); if (button) selectCard(button.dataset.id, true); });
$('#zoomIn').addEventListener('click', () => setZoom(scale * 1.2));
$('#zoomOut').addEventListener('click', () => setZoom(scale / 1.2));
$('#fitBoard').addEventListener('click', fitBoard);

cardsLayer.addEventListener('click', async (event) => {
  const element = event.target.closest('.card');
  if (!element || gesture?.moved) return;
  const card = cardById(element.dataset.id);
  if (!card) return;
  if (connectFrom) { selectCard(card.id); return; }
  if (event.target.closest('[data-action="open"]')) { await openCard(card); return; }
  selectCard(card.id);
});

cardsLayer.addEventListener('pointerdown', (event) => {
  const handle = event.target.closest('.card-handle');
  if (!handle || event.button !== 0) return;
  const element = handle.closest('.card');
  const card = cardById(element.dataset.id);
  if (!card) return;
  event.stopPropagation();
  gesture = { kind: 'card', card, element, startX: event.clientX, startY: event.clientY, initialX: card.x, initialY: card.y, moved: false };
  element.classList.add('dragging');
});

viewport.addEventListener('pointerdown', (event) => {
  if (event.target.closest('.card') || event.button !== 0) return;
  gesture = { kind: 'pan', startX: event.clientX, startY: event.clientY, initialX: offsetX, initialY: offsetY, moved: false };
  viewport.classList.add('panning');
});

window.addEventListener('pointermove', (event) => {
  if (!gesture) return;
  const dx = event.clientX - gesture.startX;
  const dy = event.clientY - gesture.startY;
  if (Math.abs(dx) + Math.abs(dy) > 3) gesture.moved = true;
  if (gesture.kind === 'pan') { offsetX = gesture.initialX + dx; offsetY = gesture.initialY + dy; renderTransform(); }
  else { gesture.card.x = Math.round(gesture.initialX + dx / scale); gesture.card.y = Math.round(gesture.initialY + dy / scale); gesture.element.style.left = `${gesture.card.x}px`; gesture.element.style.top = `${gesture.card.y}px`; renderConnections(); }
});

window.addEventListener('pointerup', () => {
  if (!gesture) return;
  const wasCard = gesture.kind === 'card';
  const cardId = gesture.card?.id;
  const moved = gesture.moved;
  gesture.element?.classList.remove('dragging');
  viewport.classList.remove('panning');
  gesture = null;
  if (wasCard) { if (moved) { queueSave(); renderCards(); } else selectCard(cardId); }
});

viewport.addEventListener('wheel', (event) => { event.preventDefault(); setZoom(scale * (event.deltaY > 0 ? .9 : 1.1), event.clientX, event.clientY); }, { passive: false });
viewport.addEventListener('dblclick', (event) => { if (!event.target.closest('.card')) newCard('note', {}, screenToWorld(event.clientX, event.clientY)); });
viewport.addEventListener('dragover', (event) => { event.preventDefault(); event.dataTransfer.dropEffect = 'copy'; });
viewport.addEventListener('drop', async (event) => { event.preventDefault(); await addFiles(event.dataTransfer.files, screenToWorld(event.clientX, event.clientY)); });

inspector.addEventListener('click', (event) => {
  if (event.target.id === 'closeInspector') { selectedId = null; connectFrom = null; renderCards(); renderInspector(); return; }
  const action = event.target.dataset.inspectorAction;
  if (!action) return;
  const card = cardById(selectedId);
  if (!card) return;
  if (action === 'open') openCard(card);
  if (action === 'connect') { connectFrom = card.id; renderInspector(); notify('Selecione o cartão de destino.'); }
  if (action === 'delete') deleteSelected();
});

function updateFromInspector(event) {
  const field = event.target.dataset.field;
  const card = cardById(selectedId);
  if (!field || !card) return;
  card[field] = event.target.value;
  if (field === 'title') inspector.querySelector('h2').textContent = card.title;
  queueSave(); renderCards();
}
inspector.addEventListener('input', updateFromInspector);
inspector.addEventListener('change', updateFromInspector);

document.addEventListener('keydown', (event) => {
  const editing = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName);
  if (event.key === 'Escape') { connectFrom = null; selectedId = null; renderCards(); renderInspector(); document.activeElement?.blur(); }
  if (!editing && event.key === '/') { event.preventDefault(); searchInput.focus(); }
  if (!editing && event.key.toLowerCase() === 'n') newCard('note');
  if (!editing && (event.key === 'Delete' || event.key === 'Backspace')) deleteSelected();
});

async function start() {
  try {
    db = await openDatabase();
    board = await getRecord('state', 'main') || structuredClone(seed);
    if (!Array.isArray(board.cards) || !Array.isArray(board.edges)) board = structuredClone(seed);
    renderCards(); renderInspector(); renderTransform();
    if (!await getRecord('state', 'main')) queueSave();
  } catch (error) {
    console.error(error);
    board = structuredClone(seed);
    renderCards(); renderInspector(); renderTransform();
    saveState.textContent = 'Armazenamento indisponível';
    notify('O navegador não permitiu salvar arquivos locais.');
  }
}
start();
