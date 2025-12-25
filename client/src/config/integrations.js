/**
 * Integration metadata configuration
 * Single source of truth for all platform integrations
 */

export const INTEGRATIONS = [
  {
    id: "shopify",
    name: "Shopify",
    logoSrc: "/integrations/shopify.svg",
    status: "in-development",
    description:
      "Sync Shopify orders into ShipCanary, generate labels in one click, and push tracking back to your store."
  },
  {
    id: "etsy",
    name: "Etsy",
    logoSrc: "/integrations/etsy.svg",
    status: "planned",
    description:
      "Import Etsy orders automatically and ship them with negotiated USPS rates."
  },
  {
    id: "amazon",
    name: "Amazon",
    logoSrc: "/integrations/amazon.svg",
    status: "planned",
    description:
      "Aggregate Amazon orders inside ShipCanary for centralized fulfillment and tracking."
  },
  {
    id: "ebay",
    name: "eBay",
    logoSrc: "/integrations/ebay.svg",
    status: "planned",
    description:
      "Connect your eBay store and turn sold orders into ready-to-print labels."
  },
  {
    id: "woocommerce",
    name: "WooCommerce",
    logoSrc: "/integrations/woocommerce.svg",
    status: "planned",
    description:
      "Tie your WooCommerce storefront directly into ShipCanary for streamlined shipping."
  },
  {
    id: "bigcommerce",
    name: "BigCommerce",
    logoSrc: "/integrations/bigcommerce.svg",
    status: "planned",
    description:
      "Automate label creation from BigCommerce orders and keep customers updated with tracking."
  }
];



