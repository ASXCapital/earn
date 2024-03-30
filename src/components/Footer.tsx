import React from 'react';
import styles from './Footer.module.css'; // Ensure the path matches your file structure
import PartnerShowcase from './PartnerShowcase';

const Footer = () => {
  return (
    <footer className={styles.footer}>
      
      <div className={styles.footerContent}>
        <section className={styles.footerSection}>
          <h4>About Us</h4>
          <p>Your company description here. It can span multiple lines as needed to fit your content.</p>
        </section>
        <section className={styles.footerSection}>
          <h4>Quick Links</h4>
          <ul>
            <li><a href="/products">Products</a></li>
            <li><a href="/services">Services</a></li>
            <li><a href="/contact">Contact Us</a></li>
          </ul>
        </section>
      </div>
      
      <h1><PartnerShowcase/></h1>
      <div className={styles.footerBottom}>
        <div className={styles.followUs}>
          <h4>Follow Us</h4>
          <div className={styles.socialLinks}>
            {/* LinkedIn Icon */}
            <a href="https://linkedin.com" title="LinkedIn">
              <img src="https://cdn-icons-png.flaticon.com/512/174/174857.png" alt="LinkedIn" style={{ width: '24px', marginRight: '10px' }} />
            </a>
            {/* Medium Icon */}
            <a href="https://medium.com" title="Medium">
              <img src="https://cdn-icons-png.flaticon.com/512/2111/2111505.png" alt="Medium" style={{ width: '24px', marginRight: '10px' }} />
            </a>
            {/* Your Brand Icon */}
            <a href="https://yourbrand.com" title="Your Brand">
              <img src="https://cdn-icons-png.flaticon.com/512/825/825540.png" alt="Your Brand" style={{ width: '24px', marginRight: '10px' }} />
            </a>
            {/* Telegram Icon */}
            <a href="https://telegram.org" title="Telegram">
              <img src="https://cdn-icons-png.flaticon.com/512/2111/2111646.png" alt="Telegram" style={{ width: '24px', marginRight: '10px' }} />
            </a>
          </div>
        </div>
        <p className={styles.rights}>© {new Date().getFullYear()} Your Company. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;