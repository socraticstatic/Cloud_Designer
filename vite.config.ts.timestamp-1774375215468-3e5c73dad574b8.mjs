// vite.config.ts
import { defineConfig } from "file:///home/project/node_modules/vite/dist/node/index.js";
import react from "file:///home/project/node_modules/@vitejs/plugin-react/dist/index.mjs";
var vite_config_default = defineConfig(({ command, mode }) => {
  const repoName = process.env.GITHUB_REPOSITORY?.split("/")[1] || "Cloud_Designer";
  return {
    base: mode === "production" ? `/${repoName}/` : "/",
    plugins: [react()],
    build: {
      target: "esnext",
      minify: "esbuild",
      cssMinify: true,
      reportCompressedSize: false,
      chunkSizeWarningLimit: 500,
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            if (id.includes("node_modules/react") || id.includes("node_modules/react-dom")) {
              return "react-vendor";
            }
            if (id.includes("node_modules/lucide-react")) {
              return "react-vendor";
            }
            if (id.includes("node_modules/jspdf") || id.includes("node_modules/html2canvas")) {
              return "pdf-libs";
            }
            if (id.includes("node_modules/zustand")) {
              return "state-management";
            }
            if (id.includes("node_modules/@supabase")) {
              return "supabase";
            }
            if (id.includes("/global-view/")) {
              return "global-view";
            }
            if (id.includes("/circuit-view/")) {
              return "circuit-view";
            }
            if (id.includes("/simulation/")) {
              return "simulation";
            }
            if (id.includes("AIRecommendationEngine") || id.includes("DesignAssistant")) {
              return "ai-components";
            }
            if (id.includes("/templates/")) {
              return "templates";
            }
            if (id.includes("/utils/") || id.includes("/services/")) {
              return "utils-services";
            }
            if (id.includes("/components/ui/") || id.includes("/components/common/")) {
              return "ui-components";
            }
            if (id.includes("/components/network-designer/") && (id.includes("Canvas") || id.includes("Node.") || id.includes("Edge.") || id.includes("Toolbar") || id.includes("StatusBar"))) {
              return "core-designer";
            }
            if (id.includes("/panels/") || id.includes("ConfigPanel")) {
              return "panels";
            }
            if (id.includes("/hooks/")) {
              return "hooks";
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
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9wcm9qZWN0XCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvaG9tZS9wcm9qZWN0L3ZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9ob21lL3Byb2plY3Qvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJztcbmltcG9ydCByZWFjdCBmcm9tICdAdml0ZWpzL3BsdWdpbi1yZWFjdCc7XG5cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZygoeyBjb21tYW5kLCBtb2RlIH0pID0+IHtcbiAgLy8gVXNlIHRoZSBhY3R1YWwgcmVwb3NpdG9yeSBuYW1lXG4gIGNvbnN0IHJlcG9OYW1lID0gcHJvY2Vzcy5lbnYuR0lUSFVCX1JFUE9TSVRPUlk/LnNwbGl0KCcvJylbMV0gfHwgJ0Nsb3VkX0Rlc2lnbmVyJztcblxuICByZXR1cm4ge1xuICBiYXNlOiBtb2RlID09PSAncHJvZHVjdGlvbicgPyBgLyR7cmVwb05hbWV9L2AgOiAnLycsXG4gIHBsdWdpbnM6IFtyZWFjdCgpXSxcbiAgYnVpbGQ6IHtcbiAgICB0YXJnZXQ6ICdlc25leHQnLFxuICAgIG1pbmlmeTogJ2VzYnVpbGQnLFxuICAgIGNzc01pbmlmeTogdHJ1ZSxcbiAgICByZXBvcnRDb21wcmVzc2VkU2l6ZTogZmFsc2UsXG4gICAgY2h1bmtTaXplV2FybmluZ0xpbWl0OiA1MDAsXG4gICAgcm9sbHVwT3B0aW9uczoge1xuICAgICAgb3V0cHV0OiB7XG4gICAgICAgIG1hbnVhbENodW5rczogKGlkKSA9PiB7XG4gICAgICAgICAgLy8gUmVhY3QgY29yZSBsaWJyYXJpZXNcbiAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoJ25vZGVfbW9kdWxlcy9yZWFjdCcpIHx8IGlkLmluY2x1ZGVzKCdub2RlX21vZHVsZXMvcmVhY3QtZG9tJykpIHtcbiAgICAgICAgICAgIHJldHVybiAncmVhY3QtdmVuZG9yJztcbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvLyBJY29ucyBcdTIwMTQgYnVuZGxlZCB3aXRoIHJlYWN0LXZlbmRvciB0byBndWFyYW50ZWUgUmVhY3QgaXMgbG9hZGVkIGZpcnN0XG4gICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKCdub2RlX21vZHVsZXMvbHVjaWRlLXJlYWN0JykpIHtcbiAgICAgICAgICAgIHJldHVybiAncmVhY3QtdmVuZG9yJztcbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvLyBQREYgZ2VuZXJhdGlvbiBsaWJyYXJpZXMgKGxhcmdlKVxuICAgICAgICAgIGlmIChpZC5pbmNsdWRlcygnbm9kZV9tb2R1bGVzL2pzcGRmJykgfHwgaWQuaW5jbHVkZXMoJ25vZGVfbW9kdWxlcy9odG1sMmNhbnZhcycpKSB7XG4gICAgICAgICAgICByZXR1cm4gJ3BkZi1saWJzJztcbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvLyBTdGF0ZSBtYW5hZ2VtZW50XG4gICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKCdub2RlX21vZHVsZXMvenVzdGFuZCcpKSB7XG4gICAgICAgICAgICByZXR1cm4gJ3N0YXRlLW1hbmFnZW1lbnQnO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIFN1cGFiYXNlXG4gICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKCdub2RlX21vZHVsZXMvQHN1cGFiYXNlJykpIHtcbiAgICAgICAgICAgIHJldHVybiAnc3VwYWJhc2UnO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIExhenktbG9hZGVkIHZpZXdzIChhbHJlYWR5IGxhenkgbG9hZGVkLCBidXQgZW5zdXJlIHRoZXkncmUgY2h1bmtlZCBzZXBhcmF0ZWx5KVxuICAgICAgICAgIGlmIChpZC5pbmNsdWRlcygnL2dsb2JhbC12aWV3LycpKSB7XG4gICAgICAgICAgICByZXR1cm4gJ2dsb2JhbC12aWV3JztcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKCcvY2lyY3VpdC12aWV3LycpKSB7XG4gICAgICAgICAgICByZXR1cm4gJ2NpcmN1aXQtdmlldyc7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChpZC5pbmNsdWRlcygnL3NpbXVsYXRpb24vJykpIHtcbiAgICAgICAgICAgIHJldHVybiAnc2ltdWxhdGlvbic7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gQUkgYW5kIGRlc2lnbiBhc3Npc3RhbnQgY29tcG9uZW50c1xuICAgICAgICAgIGlmIChpZC5pbmNsdWRlcygnQUlSZWNvbW1lbmRhdGlvbkVuZ2luZScpIHx8IGlkLmluY2x1ZGVzKCdEZXNpZ25Bc3Npc3RhbnQnKSkge1xuICAgICAgICAgICAgcmV0dXJuICdhaS1jb21wb25lbnRzJztcbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvLyBUZW1wbGF0ZXNcbiAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoJy90ZW1wbGF0ZXMvJykpIHtcbiAgICAgICAgICAgIHJldHVybiAndGVtcGxhdGVzJztcbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvLyBVdGlsaXRpZXMgYW5kIHNlcnZpY2VzXG4gICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKCcvdXRpbHMvJykgfHwgaWQuaW5jbHVkZXMoJy9zZXJ2aWNlcy8nKSkge1xuICAgICAgICAgICAgcmV0dXJuICd1dGlscy1zZXJ2aWNlcyc7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gVUkgY29tcG9uZW50c1xuICAgICAgICAgIGlmIChpZC5pbmNsdWRlcygnL2NvbXBvbmVudHMvdWkvJykgfHwgaWQuaW5jbHVkZXMoJy9jb21wb25lbnRzL2NvbW1vbi8nKSkge1xuICAgICAgICAgICAgcmV0dXJuICd1aS1jb21wb25lbnRzJztcbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvLyBDb3JlIG5ldHdvcmsgZGVzaWduZXIgY29tcG9uZW50c1xuICAgICAgICAgIGlmIChpZC5pbmNsdWRlcygnL2NvbXBvbmVudHMvbmV0d29yay1kZXNpZ25lci8nKSAmJlxuICAgICAgICAgICAgICAoaWQuaW5jbHVkZXMoJ0NhbnZhcycpIHx8IGlkLmluY2x1ZGVzKCdOb2RlLicpIHx8IGlkLmluY2x1ZGVzKCdFZGdlLicpIHx8XG4gICAgICAgICAgICAgICBpZC5pbmNsdWRlcygnVG9vbGJhcicpIHx8IGlkLmluY2x1ZGVzKCdTdGF0dXNCYXInKSkpIHtcbiAgICAgICAgICAgIHJldHVybiAnY29yZS1kZXNpZ25lcic7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gUGFuZWxzIGFuZCBjb25maWd1cmF0aW9uXG4gICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKCcvcGFuZWxzLycpIHx8IGlkLmluY2x1ZGVzKCdDb25maWdQYW5lbCcpKSB7XG4gICAgICAgICAgICByZXR1cm4gJ3BhbmVscyc7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gSG9va3NcbiAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoJy9ob29rcy8nKSkge1xuICAgICAgICAgICAgcmV0dXJuICdob29rcyc7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9LFxuICBzZXJ2ZXI6IHtcbiAgICBmczoge1xuICAgICAgc3RyaWN0OiB0cnVlXG4gICAgfVxuICB9XG4gIH07XG59KTtcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBeU4sU0FBUyxvQkFBb0I7QUFDdFAsT0FBTyxXQUFXO0FBRWxCLElBQU8sc0JBQVEsYUFBYSxDQUFDLEVBQUUsU0FBUyxLQUFLLE1BQU07QUFFakQsUUFBTSxXQUFXLFFBQVEsSUFBSSxtQkFBbUIsTUFBTSxHQUFHLEVBQUUsQ0FBQyxLQUFLO0FBRWpFLFNBQU87QUFBQSxJQUNQLE1BQU0sU0FBUyxlQUFlLElBQUksUUFBUSxNQUFNO0FBQUEsSUFDaEQsU0FBUyxDQUFDLE1BQU0sQ0FBQztBQUFBLElBQ2pCLE9BQU87QUFBQSxNQUNMLFFBQVE7QUFBQSxNQUNSLFFBQVE7QUFBQSxNQUNSLFdBQVc7QUFBQSxNQUNYLHNCQUFzQjtBQUFBLE1BQ3RCLHVCQUF1QjtBQUFBLE1BQ3ZCLGVBQWU7QUFBQSxRQUNiLFFBQVE7QUFBQSxVQUNOLGNBQWMsQ0FBQyxPQUFPO0FBRXBCLGdCQUFJLEdBQUcsU0FBUyxvQkFBb0IsS0FBSyxHQUFHLFNBQVMsd0JBQXdCLEdBQUc7QUFDOUUscUJBQU87QUFBQSxZQUNUO0FBR0EsZ0JBQUksR0FBRyxTQUFTLDJCQUEyQixHQUFHO0FBQzVDLHFCQUFPO0FBQUEsWUFDVDtBQUdBLGdCQUFJLEdBQUcsU0FBUyxvQkFBb0IsS0FBSyxHQUFHLFNBQVMsMEJBQTBCLEdBQUc7QUFDaEYscUJBQU87QUFBQSxZQUNUO0FBR0EsZ0JBQUksR0FBRyxTQUFTLHNCQUFzQixHQUFHO0FBQ3ZDLHFCQUFPO0FBQUEsWUFDVDtBQUdBLGdCQUFJLEdBQUcsU0FBUyx3QkFBd0IsR0FBRztBQUN6QyxxQkFBTztBQUFBLFlBQ1Q7QUFHQSxnQkFBSSxHQUFHLFNBQVMsZUFBZSxHQUFHO0FBQ2hDLHFCQUFPO0FBQUEsWUFDVDtBQUNBLGdCQUFJLEdBQUcsU0FBUyxnQkFBZ0IsR0FBRztBQUNqQyxxQkFBTztBQUFBLFlBQ1Q7QUFDQSxnQkFBSSxHQUFHLFNBQVMsY0FBYyxHQUFHO0FBQy9CLHFCQUFPO0FBQUEsWUFDVDtBQUdBLGdCQUFJLEdBQUcsU0FBUyx3QkFBd0IsS0FBSyxHQUFHLFNBQVMsaUJBQWlCLEdBQUc7QUFDM0UscUJBQU87QUFBQSxZQUNUO0FBR0EsZ0JBQUksR0FBRyxTQUFTLGFBQWEsR0FBRztBQUM5QixxQkFBTztBQUFBLFlBQ1Q7QUFHQSxnQkFBSSxHQUFHLFNBQVMsU0FBUyxLQUFLLEdBQUcsU0FBUyxZQUFZLEdBQUc7QUFDdkQscUJBQU87QUFBQSxZQUNUO0FBR0EsZ0JBQUksR0FBRyxTQUFTLGlCQUFpQixLQUFLLEdBQUcsU0FBUyxxQkFBcUIsR0FBRztBQUN4RSxxQkFBTztBQUFBLFlBQ1Q7QUFHQSxnQkFBSSxHQUFHLFNBQVMsK0JBQStCLE1BQzFDLEdBQUcsU0FBUyxRQUFRLEtBQUssR0FBRyxTQUFTLE9BQU8sS0FBSyxHQUFHLFNBQVMsT0FBTyxLQUNwRSxHQUFHLFNBQVMsU0FBUyxLQUFLLEdBQUcsU0FBUyxXQUFXLElBQUk7QUFDeEQscUJBQU87QUFBQSxZQUNUO0FBR0EsZ0JBQUksR0FBRyxTQUFTLFVBQVUsS0FBSyxHQUFHLFNBQVMsYUFBYSxHQUFHO0FBQ3pELHFCQUFPO0FBQUEsWUFDVDtBQUdBLGdCQUFJLEdBQUcsU0FBUyxTQUFTLEdBQUc7QUFDMUIscUJBQU87QUFBQSxZQUNUO0FBQUEsVUFDRjtBQUFBLFFBQ0Y7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUFBLElBQ0EsUUFBUTtBQUFBLE1BQ04sSUFBSTtBQUFBLFFBQ0YsUUFBUTtBQUFBLE1BQ1Y7QUFBQSxJQUNGO0FBQUEsRUFDQTtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
