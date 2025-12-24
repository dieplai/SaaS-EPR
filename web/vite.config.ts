import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');

  // Port priority: ENV var > mode-specific default > fallback
  const getPort = () => {
    if (env.VITE_PORT) return parseInt(env.VITE_PORT);

    // Mode-specific defaults
    switch (mode) {
      case 'production':
        return 3000; // For docker build
      case 'staging':
        return 3001;
      default:
        return 8080; // Development
    }
  };

  return {
    server: {
      host: "::",
      port: getPort(),
      strictPort: false, // Allow fallback to next available port
      open: false,
    },
    preview: {
      port: 3000,
      strictPort: false,
    },
    plugins: [
      react(),
      mode === "development" && componentTagger()
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    // Expose all VITE_ prefixed env vars
    define: {
      'import.meta.env.VITE_PORT': JSON.stringify(getPort()),
    },
  };
});
