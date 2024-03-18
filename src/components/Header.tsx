// src/components/Header.tsx
import Link from 'next/link';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import styles from './Header.module.css'; // Ensure this path is correct
import Image from 'next/image'; // Import the Image component for optimized images
import logo from '/public/logo.png'; // Import the logo image

const Header = () => {
  return (
    <header className={styles.header}>
      <nav className={styles.navbar}>
        <Link href="/" passHref>
        <Image src={logo} alt="ASX Logo" width={100} height={37} className={styles.logo} />

        </Link>
        <div className={styles.navLinks}>
          {/* Add your navigation links here */}
        </div>
        <ConnectButton />
      </nav>
    </header>
  );
};

export default Header;
