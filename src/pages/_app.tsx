// file: / pages/_app.tsx

import React from 'react';
import type { AppProps } from 'next/app';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider, http } from 'wagmi';
import { bsc, base, mainnet, polygon /*polygon, optimism, arbitrum, sepolia */ } from 'wagmi/chains';



import '@rainbow-me/rainbowkit/styles.css'

import { 
  DisclaimerComponent, 
  getDefaultConfig, 
  RainbowKitProvider, 
  midnightTheme, 
  useAddRecentTransaction,
  
  
 } from '@rainbow-me/rainbowkit';

import Layout from '../components/Layout';
import { PoolDataProvider } from '../contexts/PoolDataContext'; // Import the PoolDataProvider

import '../styles/globals.css';
import '../styles/Home.module.css';
import '@rainbow-me/rainbowkit/styles.css';



const projectId = "3d9fa35fb220fd48a2ede5c61b71ca78";



// RainbowKit configuration

const config = getDefaultConfig({
  appName: 'ASX',
  
  projectId: projectId,
  chains: [bsc, base, mainnet, polygon],
  ssr: true,


});


// Disclaimer component for RainbowKit

const Disclaimer: DisclaimerComponent = ({ Text, Link }) => (
  <Text>
  By connecting your wallet, you agree to the{' '}
  <Link href="https://www.asx.capital/terms">Terms and Conditions</Link> and
  acknowledge you are not a Restricted Person as defined in part 11 of the T&Cs under
  The Purchaser section{' '}
  <Link href="https://www.asx.capital/terms">here.</Link>
</Text>
);

const queryClient = new QueryClient();

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <PoolDataProvider> 
    <WagmiProvider 
    
    config={config}

    >
    
      
      <QueryClientProvider 
      client={queryClient}>
        <RainbowKitProvider
          
          initialChain={56}
          showRecentTransactions={true}
          appInfo={{
            appName: 'ASX',
            disclaimer: Disclaimer,
          }}
          coolMode
          
          theme={midnightTheme({
            accentColor: '#0BF3E7',
            accentColorForeground: 'black',
            borderRadius: 'medium',
            fontStack: 'system',
            overlayBlur: 'small',
          })}>
            
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


