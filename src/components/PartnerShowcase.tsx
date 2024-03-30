import React from 'react';
import styles from '../styles/PartnerShowcase.module.css'; // Adjusted import path

const PartnerShowcase = () => {
    const partners = [
       { url: 'https://aveai.com/',
        logo: '/logos/partners/aveai.png' },
       { url: 'https://coingecko.com/',
        logo: '/logos/partners/coingecko.webp' },
       { url: 'https://d3ploy.com/',
        logo: '/logos/partners/d3ploy.png' },
       { url: 'https://friend3.com/',
        logo: '/logos/partners/friend3.svg' },
       { url: 'https://gnosis.io/',
        logo: '/logos/partners/gnosis2.svg' },
       { url: 'https://prismre.com/',
        logo: '/logos/partners/PrismRE.png' },
       { url: 'https://rainbow.me/',
        logo: '/logos/partners/rainbow-logo.webp' },
       { url: 'https://thumbtack.com/',
        logo: '/logos/partners/bscn.png' },
        { url: 'https://github.com/ASXCapital/earn', 
        logo: '/logos/partners/wagmi.svg'}
    ];



    const doubledPartners = [...partners, ...partners]; // Duplicate the logos for seamless looping

    return (
        <div className={styles.partnerShowcaseContainer}>
            {doubledPartners.map((partner, index) => (
                <div key={index} className={styles.logoContainer}>
                    <a href={partner.url} target="_blank" rel="noopener noreferrer">
                        <img src={partner.logo} alt={`Partner ${index % partners.length + 1}`} className={styles.partnerLogo} />
                    </a>
                </div>
            ))}
        </div>
        );
        };

export default PartnerShowcase;


