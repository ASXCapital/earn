// src/components/Header.tsx
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import styles from './Header.module.css'; 
import Image from 'next/image'; 
import logo from '/public/logo.png'; 
import CoinGeckoWidget from '../utils/CoinGeckoWidget'; 
import TokenInfo from '../components/TokenInfo';


const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null); // Ref to the dropdown menu
  const burgerRef = useRef(null); // Ref to the burger icon
  const [isHovered, setIsHovered] = useState(false);
  

  
  const handleMouseEnter = () => {
    setIsHovered(true);
  };
  const handleMouseLeave = () => {
    setIsHovered(false);
  };
  const toggleMenu = (event) => {
    // Check if the dropdown is open and if the click is on the burger icon
    if (isOpen && burgerRef.current && burgerRef.current.contains(event.target)) {
      setIsOpen(false); // Close the dropdown
    } else {
      setIsOpen(!isOpen); // Otherwise, toggle the dropdown state
    }
  };
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        !burgerRef.current.contains(event.target) // Check if the click is not on the burger icon
      ) {
        setIsOpen(false); // Close dropdown when clicking outside
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownRef, burgerRef]);




  return (
    <header className={styles.header}>
      <div style={{ position: 'absolute', top: 0, width: '100%', zIndex: 1 }}>
            
      </div>
      <nav className={styles.navbar} style={{ marginTop: '0px' }}> {/* Adjust the marginTop value as needed */}
      <div className={styles.LogoAndInfo}>
        <Link href="/" passHref>
          <Image src={logo} alt="ASX Logo" width={100} height={37} className={styles.logo} />
          
        </Link>
      
        </div>


        <div className={styles.navLinks}>
          {/*
        
            <Link href="/staking" passHref>
              <button className={styles.dropdownItem}>Staking</button>
            </Link>
            <Link href="https://www.asx.capital/" passHref>
              <button className={styles.dropdownItem}>Back to V1</button>
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

  */}

   
   </div>


        
        
   <ConnectButton
  accountStatus={{
    smallScreen: 'avatar',
    largeScreen: 'full',
    
  }}
  showBalance={{
    smallScreen: false,
    largeScreen: true,
  }}
/>
        
  
      </nav>
    </header>
  );
};

export default Header;