// file: / pages/_app.tsx

import React from 'react';

import '../styles/globals.css';
import '@rainbow-me/rainbowkit/styles.css';
import type { AppProps } from 'next/app';
import Layout from '../components/Layout';
import '../styles/Home.module.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { bsc, mainnet, polygon, optimism, arbitrum, base, sepolia } from 'wagmi/chains';
import { getDefaultConfig, RainbowKitProvider, midnightTheme } from '@rainbow-me/rainbowkit';
import { PoolDataProvider } from '../contexts/PoolDataContext'; // Import the PoolDataProvider

const config = getDefaultConfig({
  appName: 'ASX',
  projectId: '3d9fa35fb220fd48a2ede5c61b71ca78',
  chains: [
    bsc,
    mainnet,
    polygon,
    optimism,
    arbitrum,
    base,
    ...(process.env.NEXT_PUBLIC_ENABLE_TESTNETS === 'true' ? [sepolia] : []),
  ],
  ssr: true, // Set to true if using server side rendering
});

const queryClient = new QueryClient();

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <PoolDataProvider> 
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          coolMode
          locale='en'
          theme={midnightTheme({
            accentColor: '#0BF3E7',
            accentColorForeground: 'black',
            borderRadius: 'medium',
            fontStack: 'system',
            overlayBlur: 'small',
          })}
        >
          
            <Layout>
              <Component {...pageProps} />
            </Layout>
          </RainbowKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </PoolDataProvider>
  );
}

export default MyApp;
