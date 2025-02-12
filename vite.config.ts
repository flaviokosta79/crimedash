import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    strictPort: true // Isso fará com que o Vite falhe se a porta 3000 estiver em uso
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
