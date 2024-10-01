// src/components/Header.tsx
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import styles from "./Header.module.css";
import Image from "next/image";
import logo from "/public/logo.png";






const Header = () => {


  return (
    <header className={styles.header}>
      <div
        style={{ position: "absolute", top: 0, width: "100%", zIndex: 1 }}
      ></div>
      <nav className={styles.navbar} style={{ marginTop: "0px" }}>
        {" "}
        {/* Adjust the marginTop value as needed */}
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
        <div className={styles.navLinks}>

          <Link href="/" passHref>
            <button className={styles.dropdownItem}>Home</button>
          </Link>

          <Link href="/staking" passHref>
            <button className={styles.dropdownItem}>Stake</button>
          </Link>

          <Link href="/vaults" passHref>
            <button className={styles.dropdownItem}>Vaults</button>
          </Link>

          <Link href="/lpinfo" passHref>
            <button className={styles.dropdownItem}>LP Info</button>
          </Link>



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
