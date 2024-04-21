// pages/dashboard.tsx

import React from "react";
import ChainBalances from "../components/dashboard/ChainBalances";
import CryptoTable from "../components/dashboard/CryptoTable";

import TokenBalances from "../components/dashboard/TokenBalances";

const DashboardPage = () => {
  return (
    <div>
      <CryptoTable />
      <TokenBalances />
      <ChainBalances />
    </div>
  );
};

export default DashboardPage;
