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
        manualChunks: (id) => {
          // React core libraries
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'react-vendor';
          }

          // Icons
          if (id.includes('node_modules/lucide-react')) {
            return 'icons';
          }

          // PDF generation libraries (large)
          if (id.includes('node_modules/jspdf') || id.includes('node_modules/html2canvas')) {
            return 'pdf-libs';
          }

          // State management
          if (id.includes('node_modules/zustand')) {
            return 'state-management';
          }

          // Supabase
          if (id.includes('node_modules/@supabase')) {
            return 'supabase';
          }

          // Lazy-loaded views (already lazy loaded, but ensure they're chunked separately)
          if (id.includes('/global-view/')) {
            return 'global-view';
          }
          if (id.includes('/circuit-view/')) {
            return 'circuit-view';
          }
          if (id.includes('/simulation/')) {
            return 'simulation';
          }

          // AI and design assistant components
          if (id.includes('AIRecommendationEngine') || id.includes('DesignAssistant')) {
            return 'ai-components';
          }

          // Templates
          if (id.includes('/templates/')) {
            return 'templates';
          }

          // Utilities and services
          if (id.includes('/utils/') || id.includes('/services/')) {
            return 'utils-services';
          }

          // UI components
          if (id.includes('/components/ui/') || id.includes('/components/common/')) {
            return 'ui-components';
          }

          // Core network designer components
          if (id.includes('/components/network-designer/') &&
              (id.includes('Canvas') || id.includes('Node.') || id.includes('Edge.') ||
               id.includes('Toolbar') || id.includes('StatusBar'))) {
            return 'core-designer';
          }

          // Panels and configuration
          if (id.includes('/panels/') || id.includes('ConfigPanel')) {
            return 'panels';
          }

          // Hooks
          if (id.includes('/hooks/')) {
            return 'hooks';
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
