// file: src/contexts/PoolDataContext.tsx

import React, { createContext, useContext, ReactNode } from 'react';
import poolsConfig, { PoolConfig } from '../config/poolsConfig';

// Define the context data shape
interface PoolDataContextType {
  pools: PoolConfig[];
}

// Create the context with an initial default value
const PoolDataContext = createContext<PoolDataContextType>({ pools: [] });


interface PoolDataProviderProps {
    children: ReactNode;
  }
  
  export const PoolDataProvider: React.FC<PoolDataProviderProps> = ({ children }) => {
    // The value that will be supplied to any descendants of this provider.
    const value = { pools: poolsConfig };
  
    return (
      <PoolDataContext.Provider value={value}>
        {children}
      </PoolDataContext.Provider>
    );
  };
  
  export default PoolDataContext;