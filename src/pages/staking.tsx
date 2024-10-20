// file: src/pages/StakingPage.tsx

import React, { useEffect, useState } from "react";
import { usePools } from "../hooks/usePools";
import styles from "../styles/StakingPage.module.css";
import PoolCard from "../components/PoolCard";
import Image from "next/image";
import { useAccount } from "wagmi";

const StakingPage = () => {
  const { address } = useAccount();
  const [clientReady, setClientReady] = useState(false);

  const { pools } = usePools();

  // Updated poolTVLs to store chainId along with tvl
  const [poolTVLs, setPoolTVLs] = useState<
    Record<string | number, { chainId: number; tvl: number }>
  >({});

  const handleTVLChange = (
    poolId: string | number,
    chainId: number,
    tvl: number
  ) => {
    setPoolTVLs((prevTVLs) => ({
      ...prevTVLs,
      [poolId]: { chainId, tvl },
    }));
  };

  // Calculate overall TVL
  const overallTVL = Object.values(poolTVLs).reduce(
    (acc, { tvl }) => acc + tvl,
    0
  );
  const roundedOverallTVL = Math.round(overallTVL);
  const formattedOverallTVL = new Intl.NumberFormat("en-US").format(
    roundedOverallTVL
  );

  // Calculate TVL per chain
  const chainTVLs = Object.values(poolTVLs).reduce(
    (acc, { chainId, tvl }) => {
      acc[chainId] = (acc[chainId] || 0) + tvl;
      return acc;
    },
    {} as Record<number, number>
  );

  // Format TVL numbers
  const formatTVL = (tvl: number) =>
    new Intl.NumberFormat("en-US", {
      maximumFractionDigits: 0,
    }).format(Math.round(tvl));

  // State for glowing effects
  const [coreGlowing, setCoreGlowing] = useState(false);
  const [bnbGlowing, setBnbGlowing] = useState(false);

  // Random glow effect for Core
  useEffect(() => {
    const minInterval = 15000; // 15 seconds
    const maxInterval = 60000; // 60 seconds
    let timeoutId: NodeJS.Timeout;

    const triggerCoreGlow = () => {
      setCoreGlowing(true);
      setTimeout(() => setCoreGlowing(false), 1000); // Glow lasts 1 second
      const nextInterval =
        Math.random() * (maxInterval - minInterval) + minInterval;
      timeoutId = setTimeout(triggerCoreGlow, nextInterval);
    };

    triggerCoreGlow();

    return () => clearTimeout(timeoutId);
  }, []);

  // Random glow effect for BNB
  useEffect(() => {
    const minInterval = 15000; // 15 seconds
    const maxInterval = 60000; // 60 seconds
    let timeoutId: NodeJS.Timeout;

    const triggerBNBGlow = () => {
      setBnbGlowing(true);
      setTimeout(() => setBnbGlowing(false), 1000); // Glow lasts 1 second
      const nextInterval =
        Math.random() * (maxInterval - minInterval) + minInterval;
      timeoutId = setTimeout(triggerBNBGlow, nextInterval);
    };

    triggerBNBGlow();

    return () => clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    setClientReady(true);
  }, []);

  // State for selected chain
  const [selectedChainId, setSelectedChainId] = useState<number>(56);

  const chainOptions = [
    { id: 56, name: "BNB", logo: "logos/bnb-bnb-logo.svg" },
    { id: 1116, name: "CORE", logo: "logos/core-dao-core-logo.svg" },
  ];

  const handleChainChange = (chainId: number) => {
    setSelectedChainId(chainId);
  };

  if (!clientReady) {
    return <div>Loading...</div>;
  }

  return (
    <div className={styles.stakingWrapper}>
      <div className={styles.poolCardHeader}>
        <h1>
          Stake <b>$ASX</b> and <b>LPs</b>, Earn <b>$ASX</b>.
        </h1>
        <div className={styles.StakingIntro}>
          <p>
            Earn via staking with ASX. Simply stake your ASX tokens and receive
            ASX as the reward token. Alternatively, diversify your position and
            create an LP with either Ethereum, BNB, or Bitcoin.
          </p>
          <p>
            A comprehensive guide to staking with ASX and creation of LP tokens
            can be found{" "}
            <a href="https://medium.com/@ASXCapital/how-to-earn-with-asx-staking-5ba6c53f95f5">
              <u>here</u>
            </a>
            . To begin, connect your wallet to a chain we offer staking on.
          </p>

          <div>
            {roundedOverallTVL > 0 && (
              <div style={{ display: "flex", alignItems: "center" }}>
                <div style={{ flexGrow: 1 }}></div>
                <div className={styles.totalTVLContainerALL}>
                  <span className={styles.totalTVL}>
                    ${formattedOverallTVL}
                    <span className={styles.totalTVLmini}> TVL</span>
                  </span>
                  {/* Add chain-specific TVLs */}
                  <div className={styles.chainTVLs}>
                    <span
                      className={`${styles.coreTVL} ${coreGlowing ? styles.glow : ""
                        }`}
                    >
                      Core: $
                      {formatTVL(chainTVLs[1116] || 0)}
                    </span>{" "}
                    +{" "}
                    <span
                      className={`${styles.bnbTVL} ${bnbGlowing ? styles.glow : ""
                        }`}
                    >
                      BNB: $
                      {formatTVL(chainTVLs[56] || 0)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Chain selector */}
        <div className={styles.chainSelector}>
          {chainOptions.map((chain) => (
            <button
              key={chain.id}
              onClick={() => handleChainChange(chain.id)}
              className={
                selectedChainId === chain.id
                  ? styles.activeChainButton
                  : styles.chainButton
              }
            >
              {chain.name}
              <div className={styles.chainLogoContainer}>
                <Image
                  src={chain.logo}
                  alt={`${chain.name} logo`}
                  width={20}
                  height={20}
                  className={styles.chainLogo}
                />
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className={styles.poolsContainer}>
        {pools.map((pool) => (
          <PoolCard
            key={pool.id}
            pool={pool}
            onTVLChange={(poolId, tvl) =>
              handleTVLChange(poolId, pool.chainId, tvl)
            }
            accountAddress={address} // Pass the actual account address here
            onStakedUSDChange={(amount: number): void => {
              throw new Error("Function not implemented.");
            }}
            onClaimableRewardsUSDChange={(amount: number): void => {
              throw new Error("Function not implemented.");
            }}
            poolId={pool.id} // Pass the correct pool id here
            className={pool.chainId === selectedChainId ? "" : styles.hidden}
          />
        ))}
      </div>
    </div>
  );
};

export default StakingPage;
