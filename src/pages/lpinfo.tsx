// pages/lpinfo.tsx
import React from "react";
import DebankLPTrack from "../components/DebankLPTrack";
import styles from "../styles/lpinfo.module.css";

const LPInfoPage = () => {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>LP Information & Diversification</h1>
      <p className={styles.paragraph}>
        ASX manages a diverse set of liquidity pools to provide our holders with exposure to large cap cryptocurrencies, emerging blue chip defi tokens, and stable coins.

        The growth of our liquidity is continuously enabled via sell tax reflections and yield fund buybacks.      </p>
      <div className={styles.debankLPTrack}>
        <DebankLPTrack />
      </div>
    </div>
  );
};

export default LPInfoPage;
