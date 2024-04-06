// file: / pages/_app.tsx

import React from 'react';
import type { AppProps } from 'next/app';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider, createConfig, http } from 'wagmi';




import { bsc, coreDao } from 'wagmi/chains';
import '@rainbow-me/rainbowkit/styles.css'
import { 
  DisclaimerComponent, 
  RainbowKitProvider, 
  midnightTheme, 
  connectorsForWallets, // IMPLEMNENT THIS****
 } from '@rainbow-me/rainbowkit';
import Layout from '../components/Layout';
import { PoolDataProvider } from '../contexts/PoolDataContext'; 
import '../styles/globals.css';
import '../styles/Home.module.css';
import '@rainbow-me/rainbowkit/styles.css';

import { coinbaseWallet, ledgerWallet, zerionWallet, braveWallet,
  trustWallet, metaMaskWallet, rainbowWallet, uniswapWallet, phantomWallet,
 } from '@rainbow-me/rainbowkit/wallets';

import { TokenPricesProvider } from '../contexts/TokenPricesContext';



const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;



const connectors = connectorsForWallets(
  [
    {
      groupName: 'Recommended',
      wallets: [metaMaskWallet, trustWallet, braveWallet],
    },
    {
      groupName: 'Explore More',
      wallets: [zerionWallet,  rainbowWallet, uniswapWallet, coinbaseWallet, phantomWallet, ledgerWallet /*FALLBACK*/],
    },
  ],
  {
    appName: 'ASX',
    projectId: projectId,
  }
  
);





const config = createConfig({
  chains: [bsc, coreDao],
  transports: {
    [bsc.id]: http (process.env.NEXT_PUBLIC_BSC_PROVIDER_QNODE),
    [coreDao.id]: http ('https://rpc.ankr.com/core'),
  },

  ssr: false, 
  syncConnectedChain: true, 
  connectors: connectors,

  
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
          })}

          
          >
            <TokenPricesProvider>
            <PoolDataProvider>
            
            <Layout>
              <Component {...pageProps} />
            </Layout>
           
            </PoolDataProvider>
            </TokenPricesProvider>
          </RainbowKitProvider>
        </QueryClientProvider>
        
      </WagmiProvider>
      
  );
}
export default MyApp;
