// pages/index.tsx
import { NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import styles from "../styles/Home.module.css";
import AINewsComponent from "../components/AINewsComponent";

const Home: NextPage = () => {
  return (
    <div className={styles.container}>
      <Head>
        <title>ASX - Earn Products</title>
        <meta name="description" content="Earn with ASX" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>
          <span className={`${styles.IndexHeader} ${styles.IndexHeaderA}`}>A</span>
          <span className={`${styles.IndexHeader} ${styles.IndexHeaderA}`}>S</span>
          <span className={`${styles.IndexHeader} ${styles.IndexHeaderX}`}>X</span>
        </h1>

        <p className={styles.description}>
          Asset Diversification Made Simple.
        </p>

        <div className={styles.grid}>
          <div className={styles.row}>
            <div className={styles.CardContainer}>
              <Link href="/staking" passHref>
                <div className={styles.card}>
                  <h2>STAKE &rarr;</h2>
                  <p>Stake ASX & LP tokens and earn rewards</p>
                </div>
              </Link>
            </div>

            <div className={styles.CardContainer}>
              <Link href="/vaults" passHref>
                <div className={styles.card}>
                  <h2>VAULTS &rarr;</h2>
                  <p>Earn Yield on BNB, ETH and BTC</p>
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* AI News Section */}
        <section className={styles.newsSection}>
          <AINewsComponent />
        </section>
      </main>
    </div>
  );
};

export default Home;
