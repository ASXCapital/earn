// pages/dashboard.tsx

import React from 'react';
import ChainBalances from '../components/dashboard/ChainBalances';
import CryptoTable from '../components/CryptoTable';
import CoinData from '../components/CoinData';

const DashboardPage = () => {
    return (
        <div>

            
              <CryptoTable/>

            <ChainBalances />
        </div>
    );
};

export default DashboardPage;
