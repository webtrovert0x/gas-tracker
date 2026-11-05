import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { fetchServerConfig, setupAppKitAndWagmi } from './config/wagmi';
import App from './App';
import './index.css';

const queryClient = new QueryClient();

async function bootstrap() {
  const serverConfig = await fetchServerConfig();
  const { wagmiConfig } = setupAppKitAndWagmi(serverConfig.reownId);

  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          <App initialConfig={serverConfig} />
        </QueryClientProvider>
      </WagmiProvider>
    </React.StrictMode>
  );
}

bootstrap().catch((err) => {
  console.error('Fatal initialization error:', err);
});
