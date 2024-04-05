import React from 'react';
import styles from '../styles/PartnerShowcase.module.css'; // Adjusted import path

const PartnerShowcase = () => {
    const partners = [
       { url: 'https://ave.ai/token/0xebd3619642d78f0c98c84f6fa9a678653fb5a99b-bsc?from=Default',
        logo: '/logos/partners/AveAi.png' },
       { url: 'https://www.coingecko.com/en/coins/asx-capital',
        logo: '/logos/partners/coingecko.webp' },
       { url: 'https://assets-global.website-files.com/621a140a057f392845dfaef3/6539fa54ccfe26e7c579f135_SmartContract_Audit_ASX_v1.1.pdf',
        logo: '/logos/partners/d3ploy.png' },
       { url: 'https://twitter.com/asx_capital/status/1741111969652871337?s=46&t=UGlPmQfBJBPdV7KBesWCeg',
        logo: '/logos/partners/friend3.svg' },
       { url: 'https://gnosis.io/',
        logo: '/logos/partners/gnosis2.svg' },
       { url: 'https://www.prismres.com/',
        logo: '/logos/partners/PrismRE.png' },
       { url: 'https://www.rainbowkit.com/',
        logo: '/logos/partners/rainbow-logo.webp' },
       { url: 'https://www.bsc.news/search?query=asx',
        logo: '/logos/partners/bscn.png' },
        { url: 'https://github.com/ASXCapital/earn', 
        logo: '/logos/partners/wagmi.svg'},
        { url: 'https://coredao.org/',
        logo: '/logos/partners/core.svg' },
        { url: 'https://www.dextools.io/app/en/bnb/pair-explorer/0x9f0faa9668ca7f0a0c1cef0d267fcd3af388941b?t=1711849478235',
        logo: '/logos/partners/dextools.svg' },
        { url: 'https://www.plena.finance/',
        logo: '/logos/partners/plena.svg' },
        
    ];



    const doubledPartners = [...partners, ...partners]; // Duplicate the logos for seamless looping

    return (
        <div className={styles.partnerShowcaseContainer}>
            {doubledPartners.map((partner, index) => (
                <div key={index} className={styles.logoContainer}>
                    <a href={partner.url} target="_blank" rel="noopener noreferrer">
                        <img src={partner.logo} alt={`Partner ${index % partners.length + 2}`} className={styles.partnerLogo} />
                    </a>
                </div>
            ))}
        </div>
        );
        };

export default PartnerShowcase;


