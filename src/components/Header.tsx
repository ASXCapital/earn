// src/components/Header.tsx
import { useState } from "react";
import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import styles from "./Header.module.css";
import Image from "next/image";
import logo from "/public/logo.png";
import React from "react";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [clickedItem, setClickedItem] = useState<string | null>(null);

  const handleMenuItemClick = (itemId: string) => {
    setClickedItem(itemId);
    setTimeout(() => {
      setIsMenuOpen(false);
      setClickedItem(null);
    }, 300); // Duration of the flash animation
  };

  const menuItems = (
    <>
      <Link href="/" passHref>
        <button
          className={`${styles.dropdownItem} ${clickedItem === "home" ? styles.flash : ""
            }`}
          onClick={() => handleMenuItemClick("home")}
        >
          Home
        </button>
      </Link>

      <Link href="/staking" passHref>
        <button
          className={`${styles.dropdownItem} ${clickedItem === "stake" ? styles.flash : ""
            }`}
          onClick={() => handleMenuItemClick("stake")}
        >
          Stake
        </button>
      </Link>

      <Link href="/vaults" passHref>
        <button
          className={`${styles.dropdownItem} ${clickedItem === "vaults" ? styles.flash : ""
            }`}
          onClick={() => handleMenuItemClick("vaults")}
        >
          Vaults
        </button>
      </Link>

      <Link href="/lpinfo" passHref>
        <button
          className={`${styles.dropdownItem} ${clickedItem === "lpinfo" ? styles.flash : ""
            }`}
          onClick={() => handleMenuItemClick("lpinfo")}
        >
          LP Info
        </button>
      </Link>
    </>
  );

  return (
    <header className={styles.header}>
      <nav className={styles.navbar}>
        <div className={styles.LogoAndInfo}>
          <Link href="/" passHref>
            <Image
              src={logo}
              alt="ASX Logo"
              width={100}
              height={37}
              className={styles.logo}
            />
          </Link>
        </div>
        <div className={styles.navLinks}>{menuItems}</div>
        <div className={styles.WalletAndBurger}>
          <ConnectButton
            accountStatus={{
              smallScreen: "avatar",
              largeScreen: "full",
            }}
            showBalance={{
              smallScreen: false,
              largeScreen: true,
            }}
          />
          <button
            className={styles.burger}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            ☰
          </button>
        </div>
        {isMenuOpen && <div className={styles.mobileMenu}>{menuItems}</div>}
      </nav>
    </header>
  );
};

export default Header;
