import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Use the actual repository name
  const repoName = (globalThis as any).process?.env?.GITHUB_REPOSITORY?.split('/')[1] || 'Cloud_Designer';

  return {
  base: mode === 'production' ? `/${repoName}/` : '/',
  plugins: [react()],
  build: {
    target: 'esnext',
    minify: 'esbuild',
    cssMinify: true,
    reportCompressedSize: false,
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      output: {
        // Vendor-only chunking. Manual chunking of APP code split an
        // import cycle (utils <-> icon components) across chunks, which
        // initialized out of order in production and crashed first paint
        // with a TDZ ReferenceError - while dev mode (unchunked) worked.
        // Rollup orders cycles correctly when it controls placement, and
        // the lazy-loaded views already get their own chunks via dynamic
        // import. Never manually chunk app modules here again.
        manualChunks: (id) => {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'react-vendor';
          }
          if (id.includes('node_modules/lucide-react')) {
            return 'react-vendor';
          }
          if (id.includes('node_modules/jspdf') || id.includes('node_modules/html2canvas')) {
            return 'pdf-libs';
          }
          if (id.includes('node_modules/zustand')) {
            return 'state-management';
          }
        }
      }
    }
  },
  server: {
    fs: {
      strict: true
    }
  }
  };
});
