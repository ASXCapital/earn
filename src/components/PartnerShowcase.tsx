import React from 'react';
import styles from '../styles/PartnerShowcase.module.css'; // Adjusted import path

const PartnerShowcase = () => {
    const partners = [
        '/logos/partners/AveAi.png',
        '/logos/partners/coingecko-branding-guide-8447de673439420efa0ab1e0e03a1f8b0137270fbc9c0b7c086ee284bd417fa1.webp',
        '/logos/partners/color-white.svg',
        '/logos/partners/d3ploy.png',
        '/logos/partners/friend3.png',
        '/logos/partners/PrismRE.png',
        '/logos/partners/rainbow-logo.webp',
        '/logos/partners/Safe_Logos_Partnerships_Powered-by_Green.svg',
        '/logos/partners/Thumb_white_1.png',
    ];

    const doubledPartners = [...partners, ...partners]; // Duplicate the logos for seamless looping

    return (
        <div className={styles.partnerShowcaseContainer}>
            {doubledPartners.map((logo, index) => (
                <div key={index} className={styles.logoContainer}>
                    <img src={logo} alt={`Partner ${index % partners.length + 1}`} className={styles.partnerLogo} />
                </div>
            ))}
        </div>
    );
};

export default PartnerShowcase;
