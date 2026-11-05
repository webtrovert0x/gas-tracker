import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load .env into process.env server-side
dotenv.config();

function configMiddleware(req, res, next) {
  if (req.url === '/api/config' || req.url?.startsWith('/api/config')) {
    // Re-read .env dynamically so any update to .env is immediately reflected
    const envConfig = dotenv.parse(fs.readFileSync(path.resolve(__dirname, '.env'), 'utf8'));
    res.setHeader('Content-Type', 'application/json');
    res.end(
      JSON.stringify({
        reownId: envConfig.REOWN_ID || process.env.REOWN_ID || '',
        rpcUrl: envConfig.RPC_URL || process.env.RPC_URL || 'https://rpc.bohr.life',
        chainId: Number(envConfig.CHAIN_ID || process.env.CHAIN_ID) || 968,
        contractAddress: envConfig.BOT_GAS_TRACKER_ADDRESS || process.env.BOT_GAS_TRACKER_ADDRESS || '',
      })
    );
    return;
  }
  next();
}

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'server-config-api',
      configureServer(server) {
        server.middlewares.use(configMiddleware);
      },
      configurePreviewServer(server) {
        server.middlewares.use(configMiddleware);
      },
    },
  ],
  server: {
    port: 3000,
    host: true,
  },
  preview: {
    port: 3000,
    host: true,
  },
});
