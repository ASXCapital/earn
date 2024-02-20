import Head from "next/head";
import Image from "next/image";
import styles from "@/styles/Home.module.css";
import { useState } from "react";
import Soon from "@/components/Soon";

// Home page


export default function Home() {
    const [isNetworkSwitchHighlighted, setIsNetworkSwitchHighlighted] = useState(false);
    const [isConnectHighlighted, setIsConnectHighlighted] = useState(false);

    const closeAll = () => {
        setIsNetworkSwitchHighlighted(false);
        setIsConnectHighlighted(false);
    };

    const poolData = [
      { poolName: "Staking Pool 1", apr: "10", stakeAmount: "50" },
     
      // Add more pool objects as needed
    ];

    
    return (
        <>
            <Head>
				<title>ASX Capital</title>
				<meta
					name="ASX Capital"
					content="Providing efficient and open access across a number of on and off-chain asset classes including RWA's, DeFi and Venture Capital investments"
				/>
				<meta
					name="viewport"
					content="width=device-width, initial-scale=1"
				/>
				<link rel="icon" href="/favicon.ico" />
			</Head>
			<header>
				
  <div
    className={styles.backdrop}
    style={{
      opacity: isConnectHighlighted || isNetworkSwitchHighlighted ? 1 : 0,
    }}
  />
  
  <div className={styles.header}>
    <div className={styles.logo}>
      <Image src="/logo.png" alt="ASX Logo" height="44" width="120" />
    </div>
    <div className={styles.buttons}>
      <div
        onClick={closeAll}
        className={`${styles.highlight} ${
          isNetworkSwitchHighlighted ? styles.highlightSelected : ``
        }`}
      >
        <w3m-network-button />
      </div>
      <div
        onClick={closeAll}
        className={`${styles.highlight} ${
          isConnectHighlighted ? styles.highlightSelected : ``
        }`}
      >
        <w3m-button />
      </div>


    </div>
  </div>
</header>




    <Soon/>



		</>
	);
}
