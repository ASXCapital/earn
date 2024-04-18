// src/hooks/usePools.ts
import { useContext } from "react";
import PoolDataContext from "../contexts/PoolDataContext";

export const usePools = () => {
  const context = useContext(PoolDataContext);

  if (context === undefined) {
    throw new Error("usePools must be used within a PoolDataProvider");
  }

  return context;
};
