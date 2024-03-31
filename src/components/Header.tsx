// src/components/Header.tsx
import { useState } from 'react';
import Link from 'next/link';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import styles from './Header.module.css'; // Ensure this path is correct
import Image from 'next/image'; // Import the Image component for optimized images
import logo from '/public/logo.png'; // Import the logo image
import CoinGeckoWidget from '../utils/CoinGeckoWidget'; // adjust the path as needed

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <header className={styles.header}>
      <div style={{ position: 'absolute', top: 0, width: '100%', zIndex: 1 }}>
        <CoinGeckoWidget />
      </div>
      
      <nav className={styles.navbar} style={{ marginTop: '30px' }}> {/* Adjust the marginTop value as needed */}
        <Link href="/" passHref>
          <Image src={logo} alt="ASX Logo" width={100} height={37} className={styles.logo} />
        </Link>
        <div className={styles.WalletAndBurger}>
        <div className={styles.burger} onClick={toggleMenu}>
          &#9776;
        </div>
        {isOpen && (
          <div className={styles.dropdownMenu}>
            <Link href="/staking" passHref>
              <button className={styles.dropdownItem}>Staking</button>
            </Link>
            <Link href="/vaults" passHref>
              <button className={styles.dropdownItem}>Vaults</button>
            </Link>
            <Link href="/treasury" passHref>
              <button className={styles.dropdownItem}>Treasury Dashboard</button>
            </Link>
            <Link href="/lp-dashboard" passHref>
              <button className={styles.dropdownItem}>LP Dashboard</button>
            </Link>
            <Link href="/rwa" passHref>
              <button className={styles.dropdownItem}>Real World Assets</button>
            </Link>
          </div>
        )}
        <ConnectButton />
        
        </div>
      </nav>
    </header>
  );
};

export default Header;