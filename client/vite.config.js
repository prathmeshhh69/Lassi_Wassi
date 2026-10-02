import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const backendUrl = env.VITE_API_URL?.trim() || "http://localhost:5000";
  const repository = process.env.GITHUB_REPOSITORY;
  const [owner, repositoryName] = repository?.split("/") ?? [];
  const base = repositoryName
    ? repositoryName.toLowerCase() === `${owner}.github.io`.toLowerCase()
      ? "/"
      : `/${repositoryName}/`
    : "/";

  return {
    base,
    plugins: [react()],
    server: {
      host: "0.0.0.0",
      port: 5173,
      proxy: {
        "/api": {
          target: backendUrl,
          changeOrigin: true,
        },
      },
    },
  };
});

