const express = require('express');
const { body, validationResult } = require('express-validator');
const axios = require('axios');
const auth = require('../middleware/auth');
const Order = require('../models/Order');
const User = require('../models/User');
const Address = require('../models/Address');
const Package = require('../models/Package');
const shippingService = require('../services/shippingService');
const shippfast = require('../services/shippfast'); // Keep for label types (services display)

const router = express.Router();

// Get all orders for user - ONLY show user's own orders from local database
router.get('/', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const perPage = parseInt(req.query.per_page) || 10;
    const skip = (page - 1) * perPage;

    // Get ONLY this user's orders from local database
    const orders = await Order.find({ userId: req.user._id })
      .populate('fromAddress')
      .populate('toAddress')
      .populate('package')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(perPage);

    const totalOrders = await Order.countDocuments({ userId: req.user._id });

    // Format orders for response
    const formattedOrders = orders.map(order => {
      const fromAddr = order.fromAddress || order.fromAddressData;
      const toAddr = order.toAddress || order.toAddressData;
      const pkg = order.package || order.packageData;

      return {
        _id: order._id,
        id: order._id.toString(),
        trackingNumber: order.trackingNumber,
        uspsService: order.uspsService,
        cost: order.cost,
        // Do not expose external labelUrl - use proxy endpoint instead
        // labelUrl is available via /api/orders/:id/label endpoint
        trackingStatus: order.status === 'completed' ? 'Label Created' : order.status,
        status: order.status,
        fromAddress: fromAddr ? {
          name: fromAddr.name,
          company: fromAddr.company,
          street1: fromAddr.street1,
          street2: fromAddr.street2,
          city: fromAddr.city,
          state: fromAddr.state,
          zip: fromAddr.zip,
          country: fromAddr.country
        } : null,
        toAddress: toAddr ? {
          name: toAddr.name,
          company: toAddr.company,
          street1: toAddr.street1,
          street2: toAddr.street2,
          city: toAddr.city,
          state: toAddr.state,
          zip: toAddr.zip,
          country: toAddr.country
        } : null,
        package: pkg ? {
          length: pkg.length,
          width: pkg.width,
          height: pkg.height,
          weight: pkg.weight
        } : null,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt
      };
    });

    res.json({
      orders: formattedOrders,
      pagination: {
        page,
        per_page: perPage,
        total: totalOrders,
        total_pages: Math.ceil(totalOrders / perPage)
      }
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

// Create order (label)
// POST /api/orders - Creates a new shipping label order
router.post('/', auth, async (req, res) => {
    console.log('[CreateOrder] ========================================');
    console.log('[CreateOrder] POST /api/orders - Creating new order/label');
    console.log('[CreateOrder] User ID:', req.user._id);
    console.log('[CreateOrder] Request body:', JSON.stringify(req.body, null, 2));
    console.log('[CreateOrder] ========================================');
    
    // 6) Improve error handling: Check for missing API key at runtime
    if (!process.env.SHIPLABEL_API_KEY || process.env.SHIPLABEL_API_KEY === 'undefined') {
      console.error('[CreateOrder] ❌ FATAL: SHIPLABEL_API_KEY missing at runtime');
      return res.status(500).json({
        message: 'Server misconfigured: SHIPLABEL_API_KEY missing',
        provider: 'shiplabel',
        status: 500,
        isShippingError: false, // This is a server config error, not a shipping API error
        details: 'The server is not properly configured. Please contact support.'
      });
    }
    
    try {
      const { labelTypeId, fromAddressId, toAddressId, packageId, fromAddress, toAddress, package: packageData } = req.body;

      // Validate required fields
      if (!labelTypeId) {
        console.error('[CreateOrder] ❌ Validation failed: labelTypeId is required');
        return res.status(400).json({ 
          message: 'Label type ID is required',
          details: 'Please select a shipping service'
        });
      }

      let fromAddr, toAddr, pkg;

      // Handle from address - either use saved or create new
      // Normalize empty string to null/undefined for cleaner checks
      const normalizedFromAddressId = (fromAddressId && typeof fromAddressId === 'string' && fromAddressId.trim() !== '') ? fromAddressId : null;
      
      if (normalizedFromAddressId) {
        console.log('[CreateOrder] Using saved From address ID:', normalizedFromAddressId);
        fromAddr = await Address.findOne({ _id: normalizedFromAddressId, userId: req.user._id });
        if (!fromAddr) {
          console.error('[CreateOrder] ❌ Validation failed: From address not found for ID:', normalizedFromAddressId);
          return res.status(404).json({ 
            message: 'From address not found',
            details: `Address ID ${normalizedFromAddressId} does not exist`
          });
        }
      } else if (fromAddress) {
        // Create temporary address object from request
        // Normalize address/name fields to UPPERCASE before saving
        fromAddr = {
          name: fromAddress.name ? String(fromAddress.name).trim().toUpperCase() : '',
          company: fromAddress.company ? String(fromAddress.company).trim().toUpperCase() : '',
          street1: fromAddress.street1 ? String(fromAddress.street1).trim().toUpperCase() : '',
          street2: fromAddress.street2 ? String(fromAddress.street2).trim().toUpperCase() : '',
          city: fromAddress.city ? String(fromAddress.city).trim().toUpperCase() : '',
          state: fromAddress.state ? String(fromAddress.state).trim().toUpperCase() : '',
          zip: fromAddress.zip,
          phone: fromAddress.phone,
          email: fromAddress.email,
          country: fromAddress.country || 'US'
        };
      } else {
        return res.status(400).json({ message: 'From address is required' });
      }
      
      // Normalize saved from address fields to uppercase (if using saved address)
      if (fromAddressId && fromAddr) {
        fromAddr.name = fromAddr.name ? String(fromAddr.name).trim().toUpperCase() : '';
        fromAddr.company = fromAddr.company ? String(fromAddr.company).trim().toUpperCase() : '';
        fromAddr.street1 = fromAddr.street1 ? String(fromAddr.street1).trim().toUpperCase() : '';
        fromAddr.street2 = fromAddr.street2 ? String(fromAddr.street2).trim().toUpperCase() : '';
        fromAddr.city = fromAddr.city ? String(fromAddr.city).trim().toUpperCase() : '';
        fromAddr.state = fromAddr.state ? String(fromAddr.state).trim().toUpperCase() : '';
      }

      // Handle to address - either use saved or create new
      // Normalize empty string to null/undefined for cleaner checks
      const normalizedToAddressId = (toAddressId && typeof toAddressId === 'string' && toAddressId.trim() !== '') ? toAddressId : null;
      
      if (normalizedToAddressId) {
        console.log('[CreateOrder] Using saved To address ID:', normalizedToAddressId);
        toAddr = await Address.findOne({ _id: normalizedToAddressId, userId: req.user._id });
        if (!toAddr) {
          console.error('[CreateOrder] ❌ Validation failed: To address not found for ID:', normalizedToAddressId);
          return res.status(404).json({ 
            message: 'To address not found',
            details: `Address ID ${normalizedToAddressId} does not exist`
          });
        }
      } else if (toAddress && toAddress.street1 && toAddress.city && toAddress.state && toAddress.zip) {
        console.log('[CreateOrder] Using new To address from request');
        // Create temporary address object from request
        // Normalize address/name fields to UPPERCASE before saving
        toAddr = {
          name: toAddress.name ? String(toAddress.name).trim().toUpperCase() : '',
          company: toAddress.company ? String(toAddress.company).trim().toUpperCase() : '',
          street1: toAddress.street1 ? String(toAddress.street1).trim().toUpperCase() : '',
          street2: toAddress.street2 ? String(toAddress.street2).trim().toUpperCase() : '',
          city: toAddress.city ? String(toAddress.city).trim().toUpperCase() : '',
          state: toAddress.state ? String(toAddress.state).trim().toUpperCase() : '',
          zip: toAddress.zip,
          phone: toAddress.phone,
          email: toAddress.email,
          country: toAddress.country || 'US'
        };
        
        // Validate required fields
        if (!toAddr.street1 || !toAddr.city || !toAddr.state || !toAddr.zip) {
          console.error('[CreateOrder] ❌ Validation failed: To address missing required fields');
          return res.status(400).json({ 
            message: 'To address is incomplete',
            details: 'Please provide street address, city, state, and zip code'
          });
        }
      } else {
        console.error('[CreateOrder] ❌ Validation failed: To address is required');
        console.error('[CreateOrder] toAddressId:', toAddressId);
        console.error('[CreateOrder] toAddress:', toAddress);
        return res.status(400).json({ 
          message: 'To address is required',
          details: 'Please provide a recipient address (either select a saved address or enter a new one)'
        });
      }
      
      // Normalize saved to address fields to uppercase (if using saved address)
      if (toAddressId && toAddr) {
        toAddr.name = toAddr.name ? String(toAddr.name).trim().toUpperCase() : '';
        toAddr.company = toAddr.company ? String(toAddr.company).trim().toUpperCase() : '';
        toAddr.street1 = toAddr.street1 ? String(toAddr.street1).trim().toUpperCase() : '';
        toAddr.street2 = toAddr.street2 ? String(toAddr.street2).trim().toUpperCase() : '';
        toAddr.city = toAddr.city ? String(toAddr.city).trim().toUpperCase() : '';
        toAddr.state = toAddr.state ? String(toAddr.state).trim().toUpperCase() : '';
      }

      // Handle package - either use saved or create new
      // Normalize empty string to null/undefined for cleaner checks
      const normalizedPackageId = (packageId && typeof packageId === 'string' && packageId.trim() !== '') ? packageId : null;
      
      if (normalizedPackageId) {
        console.log('[CreateOrder] Using saved Package ID:', normalizedPackageId);
        pkg = await Package.findOne({ _id: normalizedPackageId, userId: req.user._id });
        if (!pkg) {
          console.error('[CreateOrder] ❌ Validation failed: Package not found for ID:', normalizedPackageId);
          return res.status(404).json({ 
            message: 'Package not found',
            details: `Package ID ${normalizedPackageId} does not exist`
          });
        }
      } else if (packageData) {
        // Create temporary package object from request
        pkg = {
          label: packageData.label || 'Package',
          length: packageData.length,
          width: packageData.width,
          height: packageData.height,
          weight: packageData.weight,
          description: packageData.description
        };
      } else {
        console.error('[CreateOrder] ❌ Validation failed: Package is required');
        return res.status(400).json({ 
          message: 'Package is required',
          details: 'Please provide package dimensions and weight'
        });
      }

      // Get label type info (original ShippFast label types for validation/pricing)
      const labelType = shippfast.getLabelTypeById(labelTypeId);
      if (!labelType) {
        console.error('[CreateOrder] ❌ Validation failed: Invalid label type ID:', labelTypeId);
        return res.status(400).json({ 
          message: 'Invalid label type',
          details: `Label type ${labelTypeId} not found`
        });
      }

      // Validate weight
      if (pkg.weight > labelType.maxWeight) {
        return res.status(400).json({ 
          message: `Package weight exceeds ${labelType.maxWeight} lbs limit for ${labelType.name}` 
        });
      }

      // Validate dimensions (total inches: length + width + height)
      const totalDimensions = (pkg.length || 0) + (pkg.width || 0) + (pkg.height || 0);
      if (labelType.maxDimensions && totalDimensions > labelType.maxDimensions) {
        return res.status(400).json({ 
          message: `Package dimensions (${totalDimensions} inches total) exceed ${labelType.maxDimensions} inches limit for ${labelType.name}` 
        });
      }

      // Check balance (use original label type price for validation)
      const estimatedCost = labelType.price;
      if (req.user.balance < estimatedCost) {
        return res.status(400).json({ message: 'Insufficient balance' });
      }

      // Note: We'll use ShipLabel API for actual label creation, but keep original pricing
      const apiLabelTypeId = labelType.apiId || labelTypeId;
      
      // Get SKU/Description from package for ShipLabel metadata
      const getDescription = () => {
        const desc = (pkg.description && String(pkg.description).trim()) ||
                    (req.body.package && req.body.package.description && String(req.body.package.description).trim()) ||
                    (req.body.description && String(req.body.description).trim());
        return (desc && desc.length > 0) ? desc : '';
      };
      const skuDescription = getDescription();
      
      // Get English product name for ShipLabel metadata
      const getEnglishProductName = () => {
        let name = (req.body.description && String(req.body.description).trim()) ||
                   (req.body.package && req.body.package.description && String(req.body.package.description).trim());
        
        if (!name || name.length === 0) {
          name = (pkg.description && String(pkg.description).trim());
        }
        
        if (!name || name.length === 0) {
          name = (pkg.label && String(pkg.label).trim()) || 
                 (req.body.package && req.body.package.label && String(req.body.package.label).trim());
        }
        
        if (!name || name.length === 0) {
          name = (req.body.english_product_name && String(req.body.english_product_name).trim());
        }
        
        return (name && name.length > 0) ? name : 'Shipping Package';
      };
      const englishProductName = getEnglishProductName();
      
      // Create label using ShipLabel API
      console.log('\n╔════════════════════════════════════════════════════════════════════════════╗');
      console.log('║                    STARTING LABEL CREATION PROCESS                        ║');
      console.log('╚════════════════════════════════════════════════════════════════════════════╝');
      console.log('[CreateOrder] Step 1: Preparing to fetch rates from ShipLabel');
      console.log('[CreateOrder] From Address:', JSON.stringify({
        name: fromAddr.name,
        city: fromAddr.city,
        state: fromAddr.state,
        zip: fromAddr.zip
      }, null, 2));
      console.log('[CreateOrder] To Address:', JSON.stringify({
        name: toAddr.name,
        city: toAddr.city,
        state: toAddr.state,
        zip: toAddr.zip
      }, null, 2));
      console.log('[CreateOrder] Package:', JSON.stringify({
        weight: pkg.weight,
        length: pkg.length,
        width: pkg.width,
        height: pkg.height
      }, null, 2));
      
      // First, fetch rates from ShipLabel to get the correct rate ID
      let labelResult;
      let selectedServiceName = 'USPS Ground Advantage'; // Default service name, will be updated from selectedRate
      try {
        console.log('[CreateOrder] Step 2: Calling shippingService.getRatesWithFailover()');
        // Fetch rates from ShipLabel to find matching service
        const rates = await shippingService.getRatesWithFailover({
          fromAddress: fromAddr,
          toAddress: toAddr,
          parcels: [{
            weight: pkg.weight,
            length: pkg.length || 1,
            width: pkg.width || 1,
            height: pkg.height || 1
          }]
        });
        
        console.log('[CreateOrder] ✅ Step 2 SUCCESS: Received', rates.length, 'rates from ShipLabel');
        console.log('[CreateOrder] Available rates:', JSON.stringify(rates.map(r => ({
          id: r.rateId,
          service: r.service,
          price: r.amount
        })), null, 2));
        
        // Check if we have any rates
        if (!rates || rates.length === 0) {
          console.error('[CreateOrder] ❌ Step 2 FAILED: No rates returned from ShipLabel');
          throw new Error('No shipping rates returned from ShipLabel');
        }
        
        // ONLY use label ID 369 ($1.40 one)
        const selectedRate = rates.find(r => String(r.rateId) === '369');
        
        if (!selectedRate) {
          console.error('[CreateOrder] ❌ Step 2 FAILED: Label ID 369 not found');
          console.error('[CreateOrder] Available rates:', JSON.stringify(rates.map(r => ({
            rateId: r.rateId,
            service: r.service,
            price: r.amount
          })), null, 2));
          console.error('[CreateOrder] Rates count:', rates.length);
          throw new Error('Label ID 369 ($1.40 service) not available from ShipLabel');
        }
        
        console.log('[CreateOrder] Step 3: Selected rate for label creation:', JSON.stringify({
          rateId: selectedRate.rateId,
          service: selectedRate.service,
          price: selectedRate.amount
        }, null, 2));
        
        // Store the selected rate service name for later use (labelResult.service might be a number)
        selectedServiceName = selectedRate.service || 'USPS Ground Advantage';
        
        console.log('[CreateOrder] Step 4: Calling shippingService.createLabelWithFailover()');
        // Create label using ShipLabel API with the selected rate ID
        labelResult = await shippingService.createLabelWithFailover({
          rateId: selectedRate.rateId.toString(), // ShipLabel rate ID
          from: fromAddr,
          to: toAddr,
          weight: pkg.weight,
          length: pkg.length || 1,
          width: pkg.width || 1,
          height: pkg.height || 1,
          metadata: {
            englishProductName: englishProductName,
            description: skuDescription,
            reference1: req.body.reference1 || null,
            reference2: req.body.reference2 || null,
            labelTypeId: labelTypeId // Keep original ShippFast label type ID for reference
          }
        });
        
        console.log('[CreateOrder] ✅ Step 4 SUCCESS: Label created successfully');
        console.log('[CreateOrder] Label Result:', JSON.stringify({
          trackingNumber: labelResult.trackingNumber,
          labelUrl: labelResult.labelUrl,
          provider: labelResult.provider
        }, null, 2));
      } catch (error) {
        // 6) Improve error handling: Check for missing API key errors
        if (error.message && error.message.includes('SHIPLABEL_API_KEY missing')) {
          console.error('[CreateOrder] ❌ FATAL: SHIPLABEL_API_KEY missing');
          return res.status(500).json({
            message: 'Server misconfigured: SHIPLABEL_API_KEY missing',
            provider: 'shiplabel',
            status: 500,
            isShippingError: false,
            details: 'The server is not properly configured. Please contact support.'
          });
        }
        
        // Log the full error for debugging
        console.error('\n╔════════════════════════════════════════════════════════════════════════════╗');
        console.error('║                    LABEL CREATION FAILED                                    ║');
        console.error('╚════════════════════════════════════════════════════════════════════════════╝');
        console.error('[CreateOrder] ❌ ERROR DETAILS:');
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.error('[CreateOrder] Error message:', error.message);
        console.error('[CreateOrder] Error provider:', error.provider || 'unknown');
        console.error('[CreateOrder] Error type:', error.name || 'Unknown');
        console.error('[CreateOrder] Error stack:', error.stack);
        
        if (error.response) {
          console.error('[CreateOrder] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.error('[CreateOrder] HTTP RESPONSE ERROR:');
          console.error('[CreateOrder] Status Code:', error.response.status);
          console.error('[CreateOrder] Status Text:', error.response.statusText);
          console.error('[CreateOrder] Response Headers:', JSON.stringify(error.response.headers, null, 2));
          console.error('[CreateOrder] Response Data:', JSON.stringify(error.response.data, null, 2));
          
          if (error.config) {
            console.error('[CreateOrder] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.error('[CreateOrder] REQUEST DETAILS:');
            console.error('[CreateOrder] URL:', error.config.url);
            console.error('[CreateOrder] Method:', error.config.method);
            console.error('[CreateOrder] Base URL:', error.config.baseURL);
            console.error('[CreateOrder] Full URL:', error.config.baseURL + error.config.url);
            
            // Log headers (but mask API key)
            const headersToLog = { ...error.config.headers };
            if (headersToLog.Authorization) {
              headersToLog.Authorization = headersToLog.Authorization.substring(0, 20) + '...';
            }
            console.error('[CreateOrder] Request Headers:', JSON.stringify(headersToLog, null, 2));
            console.error('[CreateOrder] Request Data:', JSON.stringify(error.config.data, null, 2));
          }
        } else if (error.request) {
          console.error('[CreateOrder] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.error('[CreateOrder] NO RESPONSE RECEIVED (Network Error):');
          console.error('[CreateOrder] Request made but no response:', error.request);
        } else {
          console.error('[CreateOrder] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.error('[CreateOrder] REQUEST SETUP ERROR:');
          console.error('[CreateOrder] Error setting up request:', error.message);
        }
        
        console.error('[CreateOrder] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.error('[CreateOrder] Error response status:', error.response?.status);
        console.error('[CreateOrder] Error response data:', JSON.stringify(error.response?.data, null, 2));
        console.error('[CreateOrder] Request payload sent to shipping service:', {
          rateId: labelTypeId,
          from: { name: fromAddr.name, city: fromAddr.city, state: fromAddr.state },
          to: { name: toAddr.name, city: toAddr.city, state: toAddr.state },
          weight: pkg.weight,
          dimensions: `${pkg.length}x${pkg.width}x${pkg.height}`
        });
        
        // Log ShipLabel-specific errors
        if (error.provider === 'shiplabel' || error.provider === 'primary') {
          console.error('[CreateOrder] ShipLabel API error:', {
            status: error.response?.status,
            data: error.response?.data,
            message: error.message,
          });
        }
        
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        
        // Extract error message with provider context
        console.log('[CreateOrder] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('[CreateOrder] EXTRACTING ERROR MESSAGE:');
        console.log('[CreateOrder] error.response?.data:', JSON.stringify(error.response?.data, null, 2));
        console.log('[CreateOrder] error.response?.data?.message:', error.response?.data?.message);
        console.log('[CreateOrder] error.message:', error.message);
        console.log('[CreateOrder] error.provider:', error.provider);
        console.log('[CreateOrder] error.constructor.name:', error.constructor.name);
        console.log('[CreateOrder] All error properties:', Object.keys(error));
        
        let errorMessage = error.response?.data?.message || 
                          error.response?.data?.status_reason ||
                          error.response?.data?.error?.message ||
                          error.response?.data?.error ||
                          (typeof error.response?.data === 'string' ? error.response.data : null) ||
                          error.message || 
                          'Failed to create label';
        
        console.log('[CreateOrder] Extracted errorMessage:', errorMessage);
        
        // Add provider context if available
        if (error.provider) {
          errorMessage = `[${error.provider.toUpperCase()}] ${errorMessage}`;
          console.log('[CreateOrder] Added provider prefix:', errorMessage);
        } else {
          console.warn('[CreateOrder] ⚠️ No provider set on error, defaulting to "unknown"');
          // Try to infer provider from error message or response
          if (error.message?.includes('ShipLabel') || error.response?.config?.url?.includes('shiplabel')) {
            error.provider = 'shiplabel';
            console.log('[CreateOrder] Inferred provider: shiplabel');
          }
        }
        
        // Determine HTTP status code
        // IMPORTANT: Never return 401 for shipping service errors - convert to 400 or 500
        // 401 should only be used for our own authentication failures
        // 4) If empty services, return 502 (Bad Gateway) with details
        let statusCode = error.status || error.response?.status || 400;
        
        console.log('[CreateOrder] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('[CreateOrder] STATUS CODE CONVERSION LOGIC:');
        console.log('[CreateOrder] Original statusCode:', statusCode);
        console.log('[CreateOrder] Error.status:', error.status);
        console.log('[CreateOrder] Error provider:', error.provider);
        console.log('[CreateOrder] Error has response:', !!error.response);
        console.log('[CreateOrder] Error isShippingError flag:', error.isShippingError);
        
        // 4) Preserve 502 status if ShipLabel returned empty services
        if (error.status === 502) {
          console.log('[CreateOrder] ✅ Preserving 502 status (empty services from ShipLabel)');
          statusCode = 502;
        } else {
          // Convert shipping provider 401 errors to 400 (bad request)
          // This prevents frontend from thinking it's an auth error
          // Check if this is a shipping error (has provider OR isShippingError flag OR error.response exists)
          const isShippingError = error.provider || error.isShippingError || !!error.response;
          if (statusCode === 401 && isShippingError) {
            console.warn('[CreateOrder] ⚠️ Converting shipping provider 401 to 400 - this is a provider auth/config error, not our auth');
            console.warn('[CreateOrder] Reason: Shipping service returned 401 (likely ShipLabel API key issue)');
            statusCode = 400; // Bad request - provider authentication/config issue
          }
          
          // If it's a 5xx from provider (but not 502), convert to 500
          if (statusCode >= 500 && statusCode !== 502) {
            statusCode = 500;
          }
        }
        
        console.log('[CreateOrder] Final statusCode:', statusCode);
        console.log('[CreateOrder] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        // Ensure provider is set correctly
        let finalProvider = error.provider || 'unknown';
        if (finalProvider === 'unknown') {
          // Try to infer from error source
          if (error.response?.config?.url?.includes('shiplabel') || 
              error.response?.config?.baseURL?.includes('shiplabel')) {
            finalProvider = 'shiplabel';
          } else if (error.message?.includes('ShipLabel') || error.message?.includes('shiplabel')) {
            finalProvider = 'shiplabel';
          }
        }
        
        console.log('[CreateOrder] Final provider:', finalProvider);
        console.log('[CreateOrder] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        // 4) Return 502 with details if ShipLabel returned empty services
        const responseBody = { 
          message: errorMessage,
          provider: finalProvider,
          status: statusCode,
          isShippingError: true, // Flag to help frontend distinguish from auth errors
          details: error.details || error.response?.data || null // Include full error details for debugging
        };
        
        // If 502 (empty services), include full ShipLabel response
        if (statusCode === 502 && error.details) {
          responseBody.shipLabelResponse = error.details;
        }
        
        return res.status(statusCode).json(responseBody);
      }

      // Use original label type price (not ShipLabel price) to maintain original pricing
      const actualCost = labelType.price;

      // Check balance again with actual cost
      if (req.user.balance < actualCost) {
        return res.status(400).json({ message: 'Insufficient balance for this order' });
      }

      // Deduct balance
      req.user.balance -= actualCost;
      
      // Mark that user has used their credit (fraud prevention)
      if (!req.user.hasUsedCredit) {
        req.user.hasUsedCredit = true;
        req.user.firstOrderDate = new Date();
      }
      
      await req.user.save();

      // Save order locally for reference
      // Store IDs if available, otherwise store the data directly
      
        // Map ShipLabel service name to valid Order model enum value
        // Order model enum: ['Priority Mail', 'Priority Mail Express', 'First-Class Package', 'Parcel Select', 'Media Mail', 'USPS Ground', 'USPS Ground Advantage']
        // Use selectedServiceName (from selectedRate.service) instead of labelResult.service
        // because labelResult.service might be a number (labelTypeId or rateId)
        let mappedUspsService = 'USPS Ground Advantage'; // Default for ShipLabel services
        // Safely convert to string - selectedServiceName is set above, but fallback to labelResult.service if needed
        const serviceName = String(selectedServiceName || (labelResult?.service ? String(labelResult.service) : '') || '').toLowerCase();
      if (serviceName.includes('ground advantage') || serviceName.includes('ground')) {
        mappedUspsService = 'USPS Ground Advantage';
      } else if (serviceName.includes('priority mail express')) {
        mappedUspsService = 'Priority Mail Express';
      } else if (serviceName.includes('priority mail')) {
        mappedUspsService = 'Priority Mail';
      } else if (serviceName.includes('first-class')) {
        mappedUspsService = 'First-Class Package';
      } else if (serviceName.includes('parcel select')) {
        mappedUspsService = 'Parcel Select';
      } else if (serviceName.includes('media mail')) {
        mappedUspsService = 'Media Mail';
      }
      
      const orderToSave = {
        userId: req.user._id,
        uspsService: mappedUspsService, // Use mapped enum value, not raw ShipLabel service name
        cost: actualCost,
        trackingNumber: labelResult.trackingNumber,
        labelUrl: labelResult.labelUrl,
        provider: labelResult.provider || 'primary', // Store which provider was used
        shippfastOrderId: null // ShippFast disabled
      };

      if (fromAddressId) {
        orderToSave.fromAddress = fromAddressId;
      } else {
        // fromAddr is already normalized to uppercase above
        orderToSave.fromAddressData = fromAddr;
      }

      if (toAddressId) {
        orderToSave.toAddress = toAddressId;
      } else {
        // toAddr is already normalized to uppercase above
        orderToSave.toAddressData = toAddr;
      }

      if (packageId) {
        orderToSave.package = packageId;
      } else {
        orderToSave.packageData = pkg;
      }

      const order = new Order(orderToSave);

      await order.save();

      // Populate order for response (only if IDs exist)
      if (order.fromAddress) await order.populate('fromAddress');
      if (order.toAddress) await order.populate('toAddress');
      if (order.package) await order.populate('package');

      console.log('\n╔════════════════════════════════════════════════════════════════════════════╗');
      console.log('║                    ✅ ORDER CREATED SUCCESSFULLY                            ║');
      console.log('╚════════════════════════════════════════════════════════════════════════════╝');
      console.log('[CreateOrder] ✅ Order created successfully');
      console.log('[CreateOrder] Order ID:', order._id);
      console.log('[CreateOrder] ════════════════════════════════════════════════════════════════');
      console.log('[CreateOrder] PROVIDER USED:', labelResult.provider === 'primary' ? 'SHIPLABEL.NET (PRIMARY)' : 
                                                      labelResult.provider === 'backup' ? 'SHIPFAST (BACKUP)' : 
                                                      labelResult.provider?.toUpperCase() || 'UNKNOWN');
      console.log('[CreateOrder] Tracking Number:', labelResult.trackingNumber);
      console.log('[CreateOrder] Label URL:', labelResult.labelUrl);
      console.log('[CreateOrder] Price:', labelResult.price);
      console.log('[CreateOrder] ════════════════════════════════════════════════════════════════\n');
      
      // Map provider to readable string for frontend
      const providerName = labelResult.provider === 'primary' ? 'shiplabel' : 
                          labelResult.provider === 'backup' ? 'shipfast' : 
                          labelResult.provider || 'unknown';
      
      res.status(201).json({
        order: {
          ...order.toObject(),
          trackingNumber: labelResult.trackingNumber,
          // Do not expose external labelUrl - use proxy endpoint instead
          // labelUrl is available via /api/orders/:id/label endpoint
          status: 'completed',
          provider: providerName // 'shiplabel' or 'shipfast' - frontend can verify this
        },
        provider: providerName, // Top-level provider field for easy access
        providerUsed: labelResult.provider === 'primary' ? 'ShipLabel.net (PRIMARY)' : 
                      labelResult.provider === 'backup' ? 'ShipFast (BACKUP)' : 
                      'Unknown',
        newBalance: req.user.balance
      });
    } catch (error) {
      console.error('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.error('[CreateOrder] ❌ ERROR CREATING ORDER:');
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.error('[CreateOrder] Error type:', error.constructor.name);
      console.error('[CreateOrder] Error message:', error.message);
      console.error('[CreateOrder] Error stack:', error.stack);
      console.error('[CreateOrder] Error response:', error.response?.data);
      console.error('[CreateOrder] Error status:', error.response?.status);
      console.error('[CreateOrder] Error provider:', error.provider || 'unknown');
      console.error('[CreateOrder] Request body at time of error:', JSON.stringify(req.body, null, 2));
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      
      // Extract error message with priority: response data > error message > generic
      let errorMessage = error.response?.data?.message || 
                        error.response?.data?.status_reason ||
                        error.response?.data?.error?.message ||
                        error.response?.data?.error ||
                        (typeof error.response?.data === 'string' ? error.response.data : null) ||
                        error.message || 
                        'Server error occurred. Please try again.';
      
      // Extract details if available
      const errorDetails = error.response?.data?.details || 
                          error.response?.data?.error?.details ||
                          error.details ||
                          null;
      
      const statusCode = error.response?.status || 500;
      
      // Determine if this is a shipping service error
      const isShippingError = !!error.provider || 
                             error.message?.includes('[SHIPLABEL]') ||
                             error.message?.includes('[SHIPPFAST]') ||
                             error.message?.includes('[BACKUP]');
      
      res.status(statusCode).json({ 
        message: errorMessage,
        provider: error.provider || 'unknown',
        status: statusCode,
        isShippingError: isShippingError,
        details: errorDetails
      });
    }
  }
);

// Test ShipLabel authentication endpoint
// GET /api/orders/test-shiplabel-auth
router.get('/test-shiplabel-auth', auth, async (req, res) => {
  try {
    console.log('\n[TestShipLabelAuth] ════════════════════════════════════════════════════════════════');
    console.log('[TestShipLabelAuth] 🧪 TESTING SHIPLABEL AUTHENTICATION');
    console.log('[TestShipLabelAuth] ════════════════════════════════════════════════════════════════');
    
    // Call ShipLabel /services endpoint (simplest endpoint to test auth)
    const rates = await shippingService.getRatesWithFailover({
      fromAddress: {
        name: 'Test',
        street1: '123 Test St',
        city: 'Test City',
        state: 'CA',
        zip: '12345',
        country: 'US'
      },
      toAddress: {
        name: 'Test',
        street1: '456 Test St',
        city: 'Test City',
        state: 'NY',
        zip: '54321',
        country: 'US'
      },
      parcels: [{
        weight: 1,
        length: 1,
        width: 1,
        height: 1
      }]
    });
    
    console.log('[TestShipLabelAuth] ✅ Authentication successful!');
    console.log('[TestShipLabelAuth] Received', rates.length, 'rates');
    console.log('[TestShipLabelAuth] ════════════════════════════════════════════════════════════════\n');
    
    res.json({
      success: true,
      message: 'ShipLabel authentication successful',
      ratesCount: rates.length,
      rates: rates.slice(0, 3) // Return first 3 rates as sample
    });
  } catch (error) {
    console.error('[TestShipLabelAuth] ❌ Authentication failed!');
    console.error('[TestShipLabelAuth] Error:', error.message);
    console.error('[TestShipLabelAuth] Status:', error.response?.status);
    console.error('[TestShipLabelAuth] Response:', JSON.stringify(error.response?.data, null, 2));
    console.error('[TestShipLabelAuth] ════════════════════════════════════════════════════════════════\n');
    
    res.status(error.response?.status || 500).json({
      success: false,
      message: 'ShipLabel authentication failed',
      error: error.message,
      status: error.response?.status,
      response: error.response?.data,
      provider: error.provider || 'unknown'
    });
  }
});

// Get available rates/services from ShipLabel
// This endpoint fetches rates from ShipLabel API based on provided addresses and package info
// IMPORTANT: Specific routes must come BEFORE parameterized routes
router.post('/rates', auth, async (req, res) => {
  try {
    const { fromAddress, toAddress, weight, length, width, height } = req.body;
    
    // Validate required fields
    if (!fromAddress || !toAddress) {
      return res.status(400).json({ message: 'From and to addresses are required' });
    }
    
    // Call ShipLabel rates API
    const rates = await shippingService.getRatesWithFailover({
      fromAddress: {
        name: fromAddress.name || '',
        company: fromAddress.company || '',
        street1: fromAddress.street1 || fromAddress.address || '',
        street2: fromAddress.street2 || fromAddress.address2 || '',
        city: fromAddress.city || '',
        state: fromAddress.state || '',
        zip: fromAddress.zip || '',
        country: fromAddress.country || 'US'
      },
      toAddress: {
        name: toAddress.name || '',
        company: toAddress.company || '',
        street1: toAddress.street1 || toAddress.address || '',
        street2: toAddress.street2 || toAddress.address2 || '',
        city: toAddress.city || '',
        state: toAddress.state || '',
        zip: toAddress.zip || '',
        country: toAddress.country || 'US'
      },
      parcels: [{
        weight: parseFloat(weight) || 1,
        length: parseFloat(length) || 1,
        width: parseFloat(width) || 1,
        height: parseFloat(height) || 1
      }]
    });
    
    res.json(rates);
  } catch (error) {
    console.error('Error fetching rates:', error);
    res.status(500).json({ 
      message: error.message || 'Failed to fetch rates',
      provider: error.provider || 'unknown'
    });
  }
});

// Get available label types - Returns original ShippFast label types with prices
// These are used for display and pricing. Label creation uses ShipLabel API.
router.get('/label-types', auth, async (req, res) => {
  try {
    // Return original ShippFast label types (for display/pricing)
    // Label creation will use ShipLabel API instead
    const labelTypes = shippfast.getLabelTypes();
    res.json(labelTypes);
  } catch (error) {
    console.error('Error fetching label types:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Proxy endpoint for label PDF download (hides external URL from client)
// This route must come AFTER /label-types to avoid route conflicts
router.get('/:orderId/label', auth, async (req, res) => {
  console.log(`[Label Proxy] Request received for orderId: ${req.params.orderId}`);
  try {
    const { orderId } = req.params;

    // Validate orderId format
    if (!orderId || orderId.length < 10) {
      return res.status(400).json({ error: 'Invalid order ID' });
    }

    // Find the order and verify it belongs to the authenticated user
    const order = await Order.findOne({ 
      _id: orderId, 
      userId: req.user._id 
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Get the external label URL from the database (not exposed to client)
    const externalLabelUrl = order.labelUrl;

    if (!externalLabelUrl) {
      return res.status(400).json({ error: 'Label URL not available for this order' });
    }

    // Fetch the PDF from the external URL
    try {
      const response = await axios.get(externalLabelUrl, {
        responseType: 'stream',
        timeout: 30000, // 30 second timeout
        headers: {
          'Accept': 'application/pdf'
        }
      });

      // Set appropriate headers for PDF display in browser
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="label.pdf"`);
      res.setHeader('Cache-Control', 'private, max-age=3600');

      // Stream the PDF to the client
      response.data.pipe(res);

      // Handle stream errors
      response.data.on('error', (streamError) => {
        console.error('Error streaming PDF:', streamError.message);
        if (!res.headersSent) {
          res.status(502).json({ error: 'Unable to fetch label PDF' });
        }
      });

    } catch (error) {
      console.error('Error fetching label from external URL:', error.message);
      // Do not expose the external URL in the error message
      if (!res.headersSent) {
        res.status(502).json({ error: 'Unable to fetch label PDF' });
      }
    }
  } catch (error) {
    console.error('Error in label proxy endpoint:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Server error' });
    }
  }
});

module.exports = router;

