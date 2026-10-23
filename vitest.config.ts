import Vue from '@vitejs/plugin-vue';
import VueJsx from '@vitejs/plugin-vue-jsx';
import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [Vue(), VueJsx()],
  test: {
    environment: 'happy-dom',
    // Node原生用例由test:unit第二阶段执行。 Native Node tests run in the second test:unit phase.
    exclude: [...configDefaults.exclude, '**/e2e/**', '**/*.test.mjs'],
  },
});
