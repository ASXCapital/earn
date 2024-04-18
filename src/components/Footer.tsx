// file: src/components/Footer.tsx

// Some logos in the socials in 'Partner Showcase' are sources from icons8, accessible at https://icons8.com/
// The 'Partner Showcase' component is imported from 'PartnerShowcase.tsx' in the same directory

// The 'Footer' component is a functional component that returns the footer of the website
// The footer contains the following sections:
// - A section containing the ASX and Core contract addresses, with an option to add the token to MetaMask
// - A section containing social media links
// - A section containing the 'All rights reserved' text
// - A section containing the 'Partner Showcase' component

import React from "react";
import styles from "./Footer.module.css";
import PartnerShowcase from "./PartnerShowcase";

const Footer = () => {
  const handleAddTokenToMetaMask = async (tokenData, requiredChainId) => {
    try {
      if (!window.ethereum || !window.ethereum.isMetaMask) {
        alert("MetaMask is not installed!");
        return;
      }

      const currentChainId = await window.ethereum.request({
        method: "eth_chainId",
      });
      if (currentChainId !== requiredChainId) {
        alert(`Please switch to the correct network in MetaMask.`);
        return;
      }

      await window.ethereum.request({
        method: "wallet_watchAsset",
        params: {
          type: "ERC20",
          options: tokenData,
        },
      });
    } catch (error) {
      console.error("Error adding token to MetaMask", error);
    }
  };
  return (
    <footer className={styles.footer}>
      <div className={styles.footerContent}>
        <section className={styles.footerSection}></section>

        <section className={styles.footerSection}>
          <ul>
            <li style={{ display: "flex", alignItems: "center" }}>
              <a href="https://bscscan.com/address/0xebd3619642d78f0c98c84f6fa9a678653fb5a99b">
                BNB: 0xebD3619642d78F0C98c84f6Fa9a678653fB5A99B
              </a>
              <img
                src="/logos/metamask.webp"
                alt="Add to MetaMask"
                style={{
                  cursor: "pointer",
                  marginLeft: "8px",
                  height: "1.5rem",
                }}
                onClick={() =>
                  handleAddTokenToMetaMask(
                    {
                      address: "0xebd3619642d78f0c98c84f6fa9a678653fb5a99b",
                      symbol: "ASX",
                      decimals: 18,
                    },
                    "0x38",
                  )
                }
              />
            </li>
            <li style={{ display: "flex", alignItems: "center" }}>
              <a href="https://scan.coredao.org/address/0xB28B43209d9de61306172Af0320f4f55e50E2f29">
                Core: 0xB28B43209d9de61306172Af0320f4f55e50E2f29
              </a>
              <img
                src="/logos/metamask.webp"
                alt="Add to MetaMask"
                style={{
                  cursor: "pointer",
                  marginLeft: "8px",
                  height: "1.5rem",
                }}
                onClick={() =>
                  handleAddTokenToMetaMask(
                    {
                      address: "0xB28B43209d9de61306172Af0320f4f55e50E2f29",
                      symbol: "ASX",
                      decimals: 18,
                    },
                    "0x45C",
                  )
                }
              />
            </li>
          </ul>
        </section>
      </div>

      <h1>
        <PartnerShowcase />
      </h1>
      <div className={styles.footerBottom}>
        <div className={styles.socialLinks}>
          {/* Icons */}
          <a href="https://t.me/ASXOfficial" title="Telegram">
            <img src="/logos/socials/telegram.svg" alt="Telegram" />
          </a>
          <a href="https://medium.com/@ASXCapital" title="Medium">
            <img src="/logos/socials/medium.svg" alt="Medium" />
          </a>
          <a href="https://twitter.com/asx_capital/" title="Twitter/X">
            <img src="/logos/socials/x.svg" alt="Twitter/X" />
          </a>
          <a href="https://github.com/ASXCapital/" title="GitHub">
            <img src="/logos/socials/github.svg" alt="GitHub" />
          </a>
        </div>
        {/* Join Us text in the center, smaller */}
        <p className={styles.joinUsText}>{/* empty content here atm*/}</p>

        {/* All rights reserved on the right */}
        <p className={styles.rights}>
          © {new Date().getFullYear()} ASX Capital. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
