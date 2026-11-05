import { createAppKit } from '@reown/appkit/react';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { botChainTestnet } from './botchain';

// Function to fetch server-side config where REOWN_ID is kept safe
export async function fetchServerConfig() {
  try {
    const res = await fetch('/api/config');
    if (!res.ok) throw new Error('Failed to load server config');
    return await res.json();
  } catch (err) {
    console.warn('Could not load /api/config, falling back to defaults:', err);
    return {
      reownId: '',
      rpcUrl: 'https://rpc.bohr.life',
      chainId: 968,
      contractAddress: '',
    };
  }
}

export const metadata = {
  name: 'BOT GasTracker',
  description: 'BOT Chain Gas Analytics Platform',
  url: typeof window !== 'undefined' ? window.location.origin : 'https://scan.bohr.life',
  icons: ['https://scan.bohr.life/favicon.ico'],
};

export function setupAppKitAndWagmi(projectId) {
  const cleanId = (projectId && projectId.trim().length > 0)
    ? projectId.trim()
    : '00000000000000000000000000000000';

  const wagmiAdapter = new WagmiAdapter({
    networks: [botChainTestnet],
    projectId: cleanId,
    ssr: false,
  });

  let appKit = null;
  try {
    appKit = createAppKit({
      adapters: [wagmiAdapter],
      networks: [botChainTestnet],
      projectId: cleanId,
      metadata,
      features: {
        analytics: false,
      },
      themeMode: 'dark',
    });
    // Attach to window for easy access
    if (typeof window !== 'undefined') {
      window.appkit = appKit;
    }
  } catch (err) {
    console.warn('AppKit initialization notice:', err);
  }

  return {
    appKit,
    wagmiConfig: wagmiAdapter.wagmiConfig,
  };
}
