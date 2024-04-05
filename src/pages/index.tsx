import { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import styles from '../styles/Home.module.css';
import CryptoTable from '../components/CryptoTable';


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
          <span className={styles.IndexHeader}>ASX</span>
        </h1>

        <p className={styles.description}>
          Asset Diversitification Made Simple.
        </p>

        <div className={styles.grid}>
          <div className={styles.CardContainer}>
          <Link href="/staking" passHref>
            <div className={styles.card}>
              <h2>Staking &rarr;</h2>
              <p>Stake your ASX tokens and earn rewards.</p>
            </div>
          </Link>
          </div>
          
          <div className={styles.marketsContainer}>
  <CryptoTable className={styles.cryptoTable} />
</div>



          {/*

          <Link href="/vaults" passHref>
            <div className={styles.card}>
              <h2>Vaults &rarr;</h2>
              <p>Deposit into optimized yield-generating vaults.</p>
            </div>
          </Link>

          <Link href="/treasury" passHref>
            <div className={styles.card}>
              <h2>Treasury Dashboard &rarr;</h2>
              <p>Track CONTENT.</p>
            </div>
          </Link>

          <Link href="/lp-dashboard" passHref>
            <div className={styles.card}>
              <h2>LP Dashboard &rarr;</h2>
              <p>Manage your liquidity provider positions.</p>
            </div>
          </Link>

          <Link href="/rwa" passHref>
            <div className={styles.card}>
              <h2>Real World Assets &rarr;</h2>
              <p>Explore tokenized real-world asset opportunities.</p>
            </div>
          </Link>

  */}

        </div>
      </main>
    </div>
  );
};

export default Home;
