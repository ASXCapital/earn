import React from 'react';
import styles from './Footer.module.css'; // Ensure the path matches your file structure
import PartnerShowcase from './PartnerShowcase';

const Footer = () => {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerContent}>
        <section className={styles.footerSection}>
         
         
        </section>


        {/*}
        <section className={styles.footerSection}>
          <h4>Quick Links</h4>
          <ul>
            <li><a href="/products">Products</a></li>
            <li><a href="/services">Services</a></li>
            <li><a href="/contact">Contact Us</a></li>
          </ul>
        </section>
         */}
      </div>
     
      <h1><PartnerShowcase/></h1>
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
<p className={styles.rights}>© {new Date().getFullYear()} ASX Capital. All rights reserved.</p>
</div>
      
      
        
      </footer>
  );
};

export default Footer;
