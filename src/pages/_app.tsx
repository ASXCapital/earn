// file: / pages/_app.tsx

import React from 'react';
import type { AppProps } from 'next/app';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { bsc, base, mainnet, polygon, optimism, arbitrum, sepolia } from 'wagmi/chains';

import { DisclaimerComponent, getDefaultConfig, RainbowKitProvider, midnightTheme, WalletList, connectorsForWallets } from '@rainbow-me/rainbowkit';

import Layout from '../components/Layout';
import { PoolDataProvider } from '../contexts/PoolDataContext'; // Import the PoolDataProvider

import '../styles/globals.css';
import '../styles/Home.module.css';
import '@rainbow-me/rainbowkit/styles.css';


const config = getDefaultConfig({
  appName: 'ASX Earn',
  projectId: '3d9fa35fb220fd48a2ede5c61b71ca78',
  chains: [
    bsc,
    base,
    mainnet,
    polygon,
    optimism,
    arbitrum,
    ...(process.env.NEXT_PUBLIC_ENABLE_TESTNETS === 'true' ? [sepolia] : []),
  ],
 
  
  
  ssr: true, // Set to true if using server side rendering
});
console.log(config);

const Disclaimer: DisclaimerComponent = ({ Text, Link }) => (
  <Text>
    By connecting your wallet, you agree to the{' '}
    <Link href="https://www.asx.capital/terms">Terms and Conditions</Link> and
    acknowledge you are not a 'Restricted Person' as defined in part 11 of the
    terms and conditions under 'The Purchaser' section{' '}
    <Link href="https://www.asx.capital/terms">here.</Link>
  </Text>
);

const queryClient = new QueryClient();

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <PoolDataProvider> 
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          appInfo={{
            appName: 'ASX',
            disclaimer: Disclaimer,
          
          }}
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
