import React from 'react';
import styles from './PaymentLogos.module.css';

/**
 * LogoBox - Reusable logo container component
 * Forces consistent sizing and prevents distortion
 */
const LogoBox = ({ src, alt, title, logoType = '' }) => {
  return (
    <div className={styles.logoBox}>
      <img 
        src={src} 
        alt={alt}
        title={title}
        className={`${styles.logoMedia} ${logoType ? styles[logoType] : ''}`}
      />
    </div>
  );
};

/**
 * PaymentLogos - Professional payment method logos
 * Uses real brand SVGs with zero distortion
 */
const PaymentLogos = () => {
  const logos = [
    {
      src: '/payment-logos/visa.png',
      alt: 'Visa',
      title: 'Visa',
      logoType: 'visa'
    },
    {
      src: '/payment-logos/mastercard.png',
      alt: 'Mastercard',
      title: 'Mastercard',
      logoType: 'mastercard'
    },
    {
      src: '/payment-logos/amex.png',
      alt: 'American Express',
      title: 'American Express',
      logoType: 'amex'
    },
    {
      src: '/payment-logos/interac.png',
      alt: 'Interac',
      title: 'Interac',
      logoType: 'interac'
    }
  ];

  return (
    <div className={styles.container}>
      <div className={styles.row}>
        {logos.map((logo, index) => (
          <LogoBox
            key={index}
            src={logo.src}
            alt={logo.alt}
            title={logo.title}
            logoType={logo.logoType}
          />
        ))}
      </div>
    </div>
  );
};

export default PaymentLogos;

