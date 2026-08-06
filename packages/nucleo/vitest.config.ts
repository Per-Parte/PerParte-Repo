import { defineConfig } from "vitest/config";

/**
 * Os testes do núcleo são VARREDURAS de geometria, não testes de unidade
 * rápidos: alguns geram centenas de malhas (as 32 combinações forma ×
 * variação, os 576 cortes da ferramenta Fatiar, as matrizes de borda) e
 * verificam estanqueidade aresta por aresta em cada uma. Em máquina
 * ocupada — a do sócio, com o navegador aberto, ou um runner de CI
 * compartilhado — o teto padrão de 5 s por teste falha por falta de CPU
 * e não por defeito, o que é o pior tipo de teste vermelho.
 */
export default defineConfig({
  test: {
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
});
