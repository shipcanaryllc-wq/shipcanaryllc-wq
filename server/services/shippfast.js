const axios = require('axios');

const SHIPPFAST_BASE_URL = process.env.SHIPPFAST_BASE_URL || 'https://shippfast.net/api/v1';
const SHIPPFAST_API_TOKEN = process.env.SHIPPFAST_API_TOKEN;

// Create axios instance with default headers
const shippfastClient = axios.create({
  baseURL: SHIPPFAST_BASE_URL,
  headers: {
    'Accept': 'application/json',
    'Authorization': `Bearer ${SHIPPFAST_API_TOKEN}`,
    'Content-Type': 'application/json'
  }
});

/**
 * Get user dashboard information including balance
 */
async function getUserInfo() {
  try {
    const response = await shippfastClient.get('/user');
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to fetch user info');
  } catch (error) {
    console.error('ShippFast getUserInfo error:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Create a shipping label
 */
async function createOrder(orderData) {
  try {
    // Log the exact payload being sent in the HTTP request
    console.log('\n');
    console.log('╔════════════════════════════════════════════════════════════════════════════╗');
    console.log('║        SHIPFAST HTTP REQUEST - PAYLOAD BEING SENT TO API                  ║');
    console.log('╚════════════════════════════════════════════════════════════════════════════╝');
    console.log('\n');
    console.log('Endpoint: POST /order');
    console.log('Full URL:', `${SHIPPFAST_BASE_URL}/order`);
    console.log('\n');
    console.log('Request Payload:');
    console.log(JSON.stringify(orderData, null, 2));
    console.log('\n');
    console.log('╔════════════════════════════════════════════════════════════════════════════╗');
    console.log('║                    SENDING REQUEST TO SHIPFAST                            ║');
    console.log('╚════════════════════════════════════════════════════════════════════════════╝');
    console.log('\n');
    
    const response = await shippfastClient.post('/order', orderData);
    
    // Log the response
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('SHIPFAST API RESPONSE:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(JSON.stringify(response.data, null, 2));
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    if (response.data.success) {
      return response.data.data;
    }
    // Return error details from API response
    const errorMessage = response.data.message || response.data.status_reason || 'Failed to create order';
    return {
      status: 'failed',
      status_reason: errorMessage,
      message: errorMessage
    };
  } catch (error) {
    // Enhanced error logging
    console.error('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('SHIPFAST API ERROR (in shippfast.js):');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('Error message:', error.message);
    console.error('Error response status:', error.response?.status);
    console.error('Error response data:', JSON.stringify(error.response?.data, null, 2));
    console.error('Full error object keys:', Object.keys(error));
    if (error.response) {
      console.error('Response headers:', error.response.headers);
    }
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // Extract error message from response if available
    const errorMessage = error.response?.data?.message || 
                        error.response?.data?.status_reason || 
                        error.response?.data?.error?.message ||
                        error.response?.data?.error ||
                        (typeof error.response?.data === 'string' ? error.response.data : null) ||
                        error.message || 
                        'Failed to create order';
    throw new Error(errorMessage);
  }
}

/**
 * Get order history
 */
async function getOrderHistory(page = 1, perPage = 10) {
  try {
    const response = await shippfastClient.get('/order/list', {
      params: { page, per_page: perPage }
    });
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to fetch order history');
  } catch (error) {
    console.error('ShippFast getOrderHistory error:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Get label types (USPS Ground options)
 * All use USPS API (ID 126) but with different weight/dimension tiers
 */
const LABEL_TYPES = [
  {
    id: 1261, // Unique frontend ID
    apiId: 126, // API ID to use when creating orders
    name: 'USPS Ground',
    maxWeight: 1,
    maxDimensions: 21, // total inches (length + width + height)
    price: 4.25,
    description: 'USPS Ground - Max 21 inches total, Max 1 lb'
  },
  {
    id: 1262, // Unique frontend ID
    apiId: 126, // API ID to use when creating orders
    name: 'USPS Ground',
    maxWeight: 10,
    maxDimensions: 108, // total inches (length + width + height)
    price: 6.70,
    description: 'USPS Ground - Max 108 inches total, Max 10 lbs'
  },
  {
    id: 1263, // Unique frontend ID
    apiId: 126, // API ID to use when creating orders
    name: 'USPS Ground',
    maxWeight: 25,
    maxDimensions: 108, // total inches (length + width + height)
    price: 14.99,
    description: 'USPS Ground - Max 108 inches total, Max 25 lbs'
  },
  {
    id: 1264, // Unique frontend ID
    apiId: 126, // API ID to use when creating orders
    name: 'USPS Ground',
    maxWeight: 40,
    maxDimensions: 108, // total inches (length + width + height)
    price: 29.99,
    description: 'USPS Ground - Max 108 inches total, Max 40 lbs'
  },
  {
    id: 1265, // Unique frontend ID
    apiId: 126, // API ID to use when creating orders
    name: 'USPS Ground',
    maxWeight: 60,
    maxDimensions: 108, // total inches (length + width + height)
    price: 49.99,
    description: 'USPS Ground - Max 108 inches total, Max 60 lbs'
  },
  // Priority (apiId: 373)
  {
    id: 3731,
    apiId: 373,
    name: "USPS Priority",
    maxWeight: 1,
    maxDimensions: 21,
    price: 6.45,
    description: "USPS Priority — up to 1 lb, max 21 inches total",
  },
  {
    id: 3732,
    apiId: 373,
    name: "USPS Priority",
    maxWeight: 10,
    maxDimensions: 100,
    price: 8.70,
    description: "USPS Priority — Max 108 inches total, Max 10 lbs",
  },
  {
    id: 3733,
    apiId: 373,
    name: "USPS Priority",
    maxWeight: 5,
    maxDimensions: 40,
    price: 24.99,
    description: "USPS Priority — Max 108 inches total, Max 25 lbs",
  },
  {
    id: 3734,
    apiId: 373,
    name: "USPS Priority",
    maxWeight: 10,
    maxDimensions: 60,
    price: 44.99,
    description: "USPS Priority — Max 108 inches total, Max 40 lbs",
  },
  {
    id: 3735,
    apiId: 373,
    name: "USPS Priority",
    maxWeight: 20,
    maxDimensions: 80,
    price: 69.99,
    description: "USPS Priority — Max 108 inches total, Max 60 lbs",
  }
];

function getLabelTypes() {
  return LABEL_TYPES;
}

function getLabelTypeById(id) {
  return LABEL_TYPES.find(type => type.id === parseInt(id));
}

module.exports = {
  getUserInfo,
  createOrder,
  getOrderHistory,
  getLabelTypes,
  getLabelTypeById
};

