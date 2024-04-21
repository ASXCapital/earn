import React, { useState, useEffect } from "react";
import poolsConfig from "../config/poolsConfig";
import TVLAndAPRDisplay from "./TVLAndAPRDisplay";

const OverallTVLDisplay: React.FC = () => {
  const [poolTVLs, setPoolTVLs] = useState<{ [key: string]: number }>({});

  const handleUpdateTVL = (newTVL: number, poolId: string) => {
    setPoolTVLs(prevPoolTVLs => ({
      ...prevPoolTVLs,
      [poolId]: newTVL
    }));
  };

  // Calculate total TVL only once all pool TVLs have been updated.
  const totalTVL = Object.values(poolTVLs).reduce((acc, tvl) => acc + tvl, 0);

  // Initialize pool TVL states to zero on mount
  useEffect(() => {
    const initialPoolTVLs = poolsConfig.reduce((acc, pool) => ({
      ...acc,
      [pool.id]: 0
    }), {});
    setPoolTVLs(initialPoolTVLs);
  }, []);

  return (
    <div>
      <h3>TVL: ${totalTVL.toFixed(2)}</h3>
      {poolsConfig.map((pool) => (
        <TVLAndAPRDisplay
          key={pool.id}
          poolId={pool.id}
          onUpdateTVL={(tvl) => handleUpdateTVL(tvl, pool.id)}
          isVisible={false}
        />)
      )}
    </div>
  );
};

export default OverallTVLDisplay;
