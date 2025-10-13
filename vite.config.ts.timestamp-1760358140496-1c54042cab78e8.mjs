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
          manualChunks: {
            "react-vendor": ["react", "react-dom"],
            "icons": ["lucide-react"],
            "core-components": [
              "./src/components/NetworkDesigner",
              "./src/components/network-designer/Canvas",
              "./src/components/network-designer/Node",
              "./src/components/network-designer/Edge",
              "./src/components/network-designer/Toolbar"
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
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9wcm9qZWN0XCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvaG9tZS9wcm9qZWN0L3ZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9ob21lL3Byb2plY3Qvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJztcbmltcG9ydCByZWFjdCBmcm9tICdAdml0ZWpzL3BsdWdpbi1yZWFjdCc7XG5cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZygoeyBjb21tYW5kLCBtb2RlIH0pID0+IHtcbiAgLy8gVXNlIHRoZSBhY3R1YWwgcmVwb3NpdG9yeSBuYW1lXG4gIGNvbnN0IHJlcG9OYW1lID0gcHJvY2Vzcy5lbnYuR0lUSFVCX1JFUE9TSVRPUlk/LnNwbGl0KCcvJylbMV0gfHwgJ0Nsb3VkX0Rlc2lnbmVyJztcbiAgXG4gIHJldHVybiB7XG4gIGJhc2U6IG1vZGUgPT09ICdwcm9kdWN0aW9uJyA/IGAvJHtyZXBvTmFtZX0vYCA6ICcvJyxcbiAgcGx1Z2luczogW3JlYWN0KCldLFxuICBidWlsZDoge1xuICAgIHRhcmdldDogJ2VzbmV4dCcsXG4gICAgbWluaWZ5OiAnZXNidWlsZCcsXG4gICAgY3NzTWluaWZ5OiB0cnVlLFxuICAgIHJlcG9ydENvbXByZXNzZWRTaXplOiBmYWxzZSxcbiAgICBjaHVua1NpemVXYXJuaW5nTGltaXQ6IDUwMCxcbiAgICByb2xsdXBPcHRpb25zOiB7XG4gICAgICBvdXRwdXQ6IHtcbiAgICAgICAgbWFudWFsQ2h1bmtzOiB7XG4gICAgICAgICAgJ3JlYWN0LXZlbmRvcic6IFsncmVhY3QnLCAncmVhY3QtZG9tJ10sXG4gICAgICAgICAgJ2ljb25zJzogWydsdWNpZGUtcmVhY3QnXSxcbiAgICAgICAgICAnY29yZS1jb21wb25lbnRzJzogW1xuICAgICAgICAgICAgJy4vc3JjL2NvbXBvbmVudHMvTmV0d29ya0Rlc2lnbmVyJyxcbiAgICAgICAgICAgICcuL3NyYy9jb21wb25lbnRzL25ldHdvcmstZGVzaWduZXIvQ2FudmFzJyxcbiAgICAgICAgICAgICcuL3NyYy9jb21wb25lbnRzL25ldHdvcmstZGVzaWduZXIvTm9kZScsXG4gICAgICAgICAgICAnLi9zcmMvY29tcG9uZW50cy9uZXR3b3JrLWRlc2lnbmVyL0VkZ2UnLFxuICAgICAgICAgICAgJy4vc3JjL2NvbXBvbmVudHMvbmV0d29yay1kZXNpZ25lci9Ub29sYmFyJ1xuICAgICAgICAgIF1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfSxcbiAgc2VydmVyOiB7XG4gICAgZnM6IHtcbiAgICAgIHN0cmljdDogdHJ1ZVxuICAgIH1cbiAgfVxuICB9O1xufSk7XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQXlOLFNBQVMsb0JBQW9CO0FBQ3RQLE9BQU8sV0FBVztBQUVsQixJQUFPLHNCQUFRLGFBQWEsQ0FBQyxFQUFFLFNBQVMsS0FBSyxNQUFNO0FBRWpELFFBQU0sV0FBVyxRQUFRLElBQUksbUJBQW1CLE1BQU0sR0FBRyxFQUFFLENBQUMsS0FBSztBQUVqRSxTQUFPO0FBQUEsSUFDUCxNQUFNLFNBQVMsZUFBZSxJQUFJLFFBQVEsTUFBTTtBQUFBLElBQ2hELFNBQVMsQ0FBQyxNQUFNLENBQUM7QUFBQSxJQUNqQixPQUFPO0FBQUEsTUFDTCxRQUFRO0FBQUEsTUFDUixRQUFRO0FBQUEsTUFDUixXQUFXO0FBQUEsTUFDWCxzQkFBc0I7QUFBQSxNQUN0Qix1QkFBdUI7QUFBQSxNQUN2QixlQUFlO0FBQUEsUUFDYixRQUFRO0FBQUEsVUFDTixjQUFjO0FBQUEsWUFDWixnQkFBZ0IsQ0FBQyxTQUFTLFdBQVc7QUFBQSxZQUNyQyxTQUFTLENBQUMsY0FBYztBQUFBLFlBQ3hCLG1CQUFtQjtBQUFBLGNBQ2pCO0FBQUEsY0FDQTtBQUFBLGNBQ0E7QUFBQSxjQUNBO0FBQUEsY0FDQTtBQUFBLFlBQ0Y7QUFBQSxVQUNGO0FBQUEsUUFDRjtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUEsSUFDQSxRQUFRO0FBQUEsTUFDTixJQUFJO0FBQUEsUUFDRixRQUFRO0FBQUEsTUFDVjtBQUFBLElBQ0Y7QUFBQSxFQUNBO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
