import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ command, mode }) => {
  // Use the actual repository name
  const repoName = process.env.GITHUB_REPOSITORY?.split('/')[1] || 'Cloud_Designer';
  
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
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'icons': ['lucide-react'],
          'core-components': [
            './src/components/NetworkDesigner',
            './src/components/network-designer/Canvas',
            './src/components/network-designer/Node',
            './src/components/network-designer/Edge',
            './src/components/network-designer/Toolbar'
          ]
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
