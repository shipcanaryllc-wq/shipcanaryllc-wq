/**
 * Integration metadata configuration
 * Single source of truth for all platform integrations
 */

export const INTEGRATIONS = [
  {
    id: "shopify",
    name: "Shopify",
    category: "Ecommerce",
    status: "in-development",
    description: "Sync orders, generate labels, and push tracking back to your store."
  },
  {
    id: "etsy",
    name: "Etsy",
    category: "Marketplace",
    status: "planned",
    description: "Import orders automatically and ship with negotiated USPS rates."
  },
  {
    id: "amazon",
    name: "Amazon",
    category: "Marketplace",
    status: "planned",
    description: "Aggregate orders for centralized fulfillment and tracking."
  },
  {
    id: "ebay",
    name: "eBay",
    category: "Marketplace",
    status: "planned",
    description: "Connect your store and turn sold orders into ready-to-print labels."
  },
  {
    id: "woocommerce",
    name: "WooCommerce",
    category: "Ecommerce",
    status: "planned",
    description: "Tie your storefront directly into ShipCanary for streamlined shipping."
  },
  {
    id: "bigcommerce",
    name: "BigCommerce",
    category: "Ecommerce",
    status: "planned",
    description: "Automate label creation and keep customers updated with tracking."
  }
];

export const CATEGORIES = ["All", "Ecommerce", "Marketplace"];




