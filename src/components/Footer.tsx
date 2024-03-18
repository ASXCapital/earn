import React from 'react';
import styles from './Footer.module.css'; // Ensure the path matches your file structure

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
      <div className={styles.footerBottom}>
        <div className={styles.followUs}>
          <h4>Follow Us</h4>
          <div className={styles.socialLinks}>
            <a href="https://twitter.com">Twitter</a>
            <a href="https://linkedin.com">LinkedIn</a>
            {/* Add more social links as needed */}
          </div>
        </div>
        <p className={styles.rights}>© {new Date().getFullYear()} Your Company. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
