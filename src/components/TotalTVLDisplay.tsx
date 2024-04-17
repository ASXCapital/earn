// file: earn/components/TotalTVLDisplay.tsx

import React, { useState, useEffect } from 'react';
import poolsConfig from '../config/poolsConfig';
import TVLAndAPRDisplay from './TVLAndAPRDisplay';

/**
 * Component to display the aggregate Total Value Locked (TVL) across all configured pools.
 * This component uses child components to calculate TVLs individually but does not render them visually.
 */
const OverallTVLDisplay: React.FC = () => {
  // State for storing the total TVL calculated from all pools.
  const [totalTVL, setTotalTVL] = useState(0);

  // State to track if component has been initialized, used to reset the total TVL.
  const [initialized, setInitialized] = useState(false);

  /**
   * Updates the total TVL by adding the TVL from an individual pool.
   * @param {number} newTVL - The TVL to add to the total.
   * @param {string} poolId - The identifier of the pool that the TVL comes from.
   */
  const handleUpdateTVL = (newTVL: number, poolId: string) => {
    setTotalTVL(prevTotalTVL => prevTotalTVL + newTVL);
  };

  // Effect to initialize and cleanup component state.
  useEffect(() => {
    // Set the total TVL to zero and mark as initialized when component mounts.
    setTotalTVL(0);
    setInitialized(true);

    // Cleanup function to reset the initialization flag when component unmounts.
    return () => {
      setInitialized(false);
    };
  }, []);

  // Effect to reset total TVL when all components have been initialized.
  useEffect(() => {
    if (initialized) {
      setTotalTVL(0);
    }
  }, [initialized]);

  return (
    <div>
      <h3>TVL: ${totalTVL.toFixed(2)}</h3>
      {poolsConfig.map(pool => (
        <TVLAndAPRDisplay
          key={pool.id}
          poolId={pool.id}
          onUpdateTVL={(tvl) => handleUpdateTVL(tvl, pool.id)}
          isVisible={false}  // This prevents the TVLAndAPRDisplay components from rendering visually.
        />
      ))}
    </div>
  );
};

export default OverallTVLDisplay;
