# Integration Logos

This directory is reserved for local logo assets if needed in the future.

Currently, logos are loaded from Simple Icons CDN:
- **Shopify**: `https://cdn.simpleicons.org/shopify/96BF48`
- **Etsy**: `https://cdn.simpleicons.org/etsy/F16521`
- **Amazon**: `https://cdn.simpleicons.org/amazon/FF9900`
- **eBay**: `https://cdn.simpleicons.org/ebay/E53238`
- **WooCommerce**: `https://cdn.simpleicons.org/woocommerce/96588A`
- **BigCommerce**: `https://cdn.simpleicons.org/bigcommerce/121118`

## Fallback Behavior

If a logo fails to load, the component will display a fallback badge with the first letter of the integration name.

## Local Assets (Optional)

To use local logo files instead of CDN:
1. Add SVG/PNG files to this directory (e.g., `shopify.svg`, `etsy.svg`)
2. Update `Integrations.js` to import and use local assets:
   ```javascript
   import shopifyLogo from '../../assets/logos/shopify.svg';
   import etsyLogo from '../../assets/logos/etsy.svg';
   // etc.
   ```




