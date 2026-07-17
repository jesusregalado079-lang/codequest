import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  base: './', // relative URLs — works at domain root and GitHub Pages subpath
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        play: resolve(import.meta.dirname, 'play.html'),
        world: resolve(import.meta.dirname, 'world.html'),
        quiz: resolve(import.meta.dirname, 'quiz.html'),
        game: resolve(import.meta.dirname, 'game.html'),
        code: resolve(import.meta.dirname, 'code.html'),
        build: resolve(import.meta.dirname, 'build.html'),
        pro: resolve(import.meta.dirname, 'pro.html'),
      },
    },
  },
});
