// pages/dashboard.tsx

import React from 'react';
import ChainBalances from '../components/dashboard/ChainBalances';

const DashboardPage = () => {
    return (
        <div>
            <h2>Chain Balances</h2>
            <ChainBalances />
        </div>
    );
};

export default DashboardPage;
