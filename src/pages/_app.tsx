// file: / pages/_app.tsx

import React from 'react';
import type { AppProps } from 'next/app';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { bsc, arbitrum, bscTestnet } from 'wagmi/chains';
import '@rainbow-me/rainbowkit/styles.css'
import { 
  DisclaimerComponent, 
  getDefaultConfig, 
  RainbowKitProvider, 
  midnightTheme, 
  connectorsForWallets,
  useAddRecentTransaction, // IMPLEMNENT THIS****
 } from '@rainbow-me/rainbowkit';
import Layout from '../components/Layout';
import { PoolDataProvider } from '../contexts/PoolDataContext'; 
import '../styles/globals.css';
import '../styles/Home.module.css';
import '@rainbow-me/rainbowkit/styles.css';
import { UseConfigParameters } from 'wagmi';
import { coinbaseWallet, ledgerWallet, zerionWallet,
  trustWallet, metaMaskWallet, rainbowWallet, roninWallet,
braveWallet, uniswapWallet, phantomWallet, injectedWallet/*FALLBACK*/ } from '@rainbow-me/rainbowkit/wallets';


const projectId = "3d9fa35fb220fd48a2ede5c61b71ca78";

const connectors = connectorsForWallets(
  [
    {
      groupName: 'Recommended',
      wallets: [metaMaskWallet, coinbaseWallet, ledgerWallet, trustWallet],
    },
    {
      groupName: 'Explore More',
      wallets: [zerionWallet,  rainbowWallet, uniswapWallet, roninWallet, braveWallet, injectedWallet/*FALLBACK*/],
    },
  ],
  { appName: 'ASX', projectId: projectId },
);




const config = getDefaultConfig({
  appName: 'ASX',
  projectId: projectId,
  chains: [bsc, arbitrum, bscTestnet],
  
  ssr: false,
});


// DISCLAIMER COMPONENT
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
            <PoolDataProvider>
            <Layout>
              <Component {...pageProps} />
            </Layout>
            </PoolDataProvider>
          </RainbowKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
  );
}
export default MyApp;


