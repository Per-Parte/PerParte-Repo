const formulario = document.querySelector('#formulario-captacao');
const botao = document.querySelector('#enviar-cadastro');
const resultado = document.querySelector('#resultado-cadastro');
let enviando = false;

function informar(mensagem, estado) {
  resultado.textContent = mensagem;
  resultado.dataset.estado = estado;
  resultado.focus({ preventScroll: true });
}

formulario.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  if (enviando || !formulario.reportValidity()) return;
  enviando = true;
  botao.disabled = true;
  botao.querySelector('span').textContent = 'Guardando seu cadastro…';
  formulario.setAttribute('aria-busy', 'true');
  resultado.textContent = '';
  const dados = new FormData(formulario);
  const controlador = new AbortController();
  const temporizador = setTimeout(() => controlador.abort(), 20000);
  try {
    const resposta = await fetch('/api/captacao', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      signal: controlador.signal,
      body: JSON.stringify({
        email: String(dados.get('email') || '').trim(),
        nome: String(dados.get('nome') || '').trim(),
        consentimento: dados.get('consentimento') === 'on',
        versaoConsentimento: '2026-10-14',
        website: String(dados.get('website') || ''),
      }),
    });
    const conteudo = await resposta.json().catch(() => null);
    if (!resposta.ok || conteudo?.ok !== true) {
      const mensagens = {
        CADASTRO_INDISPONIVEL: 'O cadastro está temporariamente indisponível. Tente novamente mais tarde.',
        LIMITE_REQUISICOES: 'Aguarde um pouco antes de tentar novamente.',
      };
      informar(mensagens[conteudo?.erro?.codigo] || conteudo?.erro?.mensagem || 'Não foi possível confirmar seu cadastro. Tente novamente em instantes.', 'erro');
      return;
    }
    informar('Você faz parte do começo. Seu cadastro foi recebido pela Per Parte.', 'sucesso');
    formulario.reset();
  } catch (erro) {
    informar(erro.name === 'AbortError'
      ? 'A confirmação demorou mais que o esperado. Você pode tentar novamente com o mesmo e-mail.'
      : 'Não foi possível conectar. Confira sua internet e tente novamente.', 'erro');
  } finally {
    clearTimeout(temporizador);
    enviando = false;
    botao.disabled = false;
    botao.querySelector('span').textContent = 'Quero fazer parte';
    formulario.removeAttribute('aria-busy');
  }
});
