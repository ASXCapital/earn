import React, { createContext, useContext, useState, ReactNode } from "react";

interface FinanceData {
  aprs: Record<string, number>;
  tvls: Record<string, number>;
  setApr: (poolId: string, apr: number) => void;
  setTvl: (poolId: string, tvl: number) => void;
}

const defaultValues: FinanceData = {
  aprs: {},
  tvls: {},
  setApr: () => {},
  setTvl: () => {},
};

const FinanceDataContext = createContext<FinanceData>(defaultValues);

export const FinanceDataProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [aprs, setAprs] = useState<Record<string, number>>({});
  const [tvls, setTvls] = useState<Record<string, number>>({});

  const setApr = (poolId: string, apr: number) => {
    setAprs((prev) => ({ ...prev, [poolId]: apr }));
  };

  const setTvl = (poolId: string, tvl: number) => {
    setTvls((prev) => ({ ...prev, [poolId]: tvl }));
  };

  return (
    <FinanceDataContext.Provider value={{ aprs, tvls, setApr, setTvl }}>
      {children}
    </FinanceDataContext.Provider>
  );
};

export const useFinanceData = () => useContext(FinanceDataContext);
