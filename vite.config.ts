import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

// base relativa: funciona en GitHub Pages (/<repo>/) y en cualquier carpeta,
// porque el enrutado usa el hash (#/…).
export default defineConfig(({ mode }) => {
  // Cualquier modo que no sea «dj» (jugador, test, development…) es la edición de jugador:
  // así, por error, nunca se publica la del DJ.
  return {
    base: './',
    plugins: [svelte()],
    define: {
      __EDICION__: JSON.stringify(mode === 'dj' ? 'dj' : 'jugador'),
    },
    build: {
      target: 'es2022',
      sourcemap: mode === 'dj',
    },
    test: {
      include: ['src/**/*.test.ts'],
      environment: 'node',
    },
  };
});
