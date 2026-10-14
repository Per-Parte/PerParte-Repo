import { criarAdaptadorVercel } from '../apps/site/vercel-adaptador.mjs';

// Uma única função para toda a API. As credenciais vêm do ambiente da hospedagem.
export default { fetch: criarAdaptadorVercel() };
