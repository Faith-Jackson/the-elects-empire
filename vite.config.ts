import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    build: {
      // Production build optimizations
      target: 'es2022',
      sourcemap: false,
      minify: 'esbuild',
      cssMinify: true,
      rollupOptions: {
        output: {
          // Code splitting for better caching
          manualChunks: {
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            'supabase': ['@supabase/supabase-js'],
            'ui-vendor': ['motion', 'lucide-react', 'recharts'],
            'editor': ['@tiptap/react', '@tiptap/starter-kit'],
          },
        },
      },
      // Warn on large chunks
      chunkSizeWarningLimit: 500,
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
