"use client";
import React from 'react';
import { Button } from '@/components/common/Button';

interface ContractRef { label: string; address: string; }

const NFT_CONTRACTS: ContractRef[] = [
  { label: 'FJC NFT', address: '0x8a747b5797b3164a64759a3d77f5a0f4e758283b' },
  { label: 'MVA NFT', address: '0x649edd9af91646348aa4ba197d71eb05b9546d5a' }
];

export const WelcomeBar: React.FC = () => {
  const addNetwork = async (net: 'bsc' | 'core') => {
    try {
      if (!(window as any).ethereum) return;
      if (net === 'bsc') {
        await (window as any).ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: '0x38',
            chainName: 'BNB Smart Chain',
            nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
            rpcUrls: ['https://bsc-dataseed1.binance.org'],
            blockExplorerUrls: ['https://bscscan.com']
          }]
        });
      } else {
        await (window as any).ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: '0x45C',
            chainName: 'Core',
            nativeCurrency: { name: 'CORE', symbol: 'CORE', decimals: 18 },
            rpcUrls: ['https://rpc.ankr.com/core'],
            blockExplorerUrls: ['https://scan.coredao.org']
          }]
        });
      }
    } catch {/* ignore */ }
  };

  const addToken = async (token: 'asx-core' | 'asx-bsc') => {
    try {
      if (!(window as any).ethereum) return;
      if (token === 'asx-core') {
        await (window as any).ethereum.request({
          method: 'wallet_watchAsset',
          params: {
            type: 'ERC20',
            options: {
              address: '0xb28b43209d9de61306172af0320f4f55e50e2f29',
              symbol: 'ASX',
              decimals: 18,
              image: '/asx_white_square1200_transparent.png'
            }
          }
        });
      } else if (token === 'asx-bsc') {
        await (window as any).ethereum.request({
          method: 'wallet_watchAsset',
          params: {
            type: 'ERC20',
            options: {
              address: '0xebD3619642d78F0C98c84f6Fa9a678653fB5A99B',
              symbol: 'ASX',
              decimals: 18,
              image: '/asx_white_square1200_transparent.png'
            }
          }
        });
      }
    } catch {/* ignore */ }
  };

  return (
    <div className="relative rounded-lg border border-white/10 bg-white/[0.04] p-4 flex flex-col gap-4">
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <div className="flex items-center gap-3">
          <img src="https://rabby.io/assets/logos/symbol-new.svg" alt="Rabby" className="h-8 w-8" />
          <div className="space-y-0.5">
            <p className="text-sm font-medium">Welcome to ASX Earn</p>
            <p className="text-2xs text-white/60 max-w-xl">We recommend using Rabby Wallet for the smoothest multi-chain experience. <a href="https://rabby.io/" target="_blank" rel="noopener" className="text-asx-cyan hover:underline">Download here</a>.</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 md:ml-auto">
          <Button onClick={() => addNetwork('bsc')} size="sm" variant="outline">Add BSC</Button>
          <Button onClick={() => addNetwork('core')} size="sm" variant="outline">Add Core</Button>
          <Button
            onClick={() => addToken('asx-core')}
            size="sm"
            variant="outline"
            className="border-asx-cyan/50 text-asx-cyan hover:border-asx-cyan/80 hover:text-asx-cyan"
          >
            Add ASX (Core)
          </Button>
          <Button
            onClick={() => addToken('asx-bsc')}
            size="sm"
            variant="outline"
            className="border-asx-cyan/30 text-asx-cyan/90 hover:border-asx-cyan/60 hover:text-asx-cyan/90"
          >
            Add ASX (BSC)
          </Button>
        </div>
      </div>
      <div className="text-3xs text-white/50 space-y-1">
        <p className="font-semibold text-white/70">Verify official NFT contracts:</p>
        <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-1">
          {NFT_CONTRACTS.map(c => (
            <li key={c.label} className="flex items-center gap-1.5">
              <span className="text-white/40">{c.label}:</span>
              <code className="text-4xs bg-white/5 px-1.5 py-0.5 rounded select-all">{c.address}</code>
            </li>
          ))}
        </ul>
        <p>Always double-check addresses to avoid scams.</p>
      </div>
    </div>
  );
};
