/**
 * Normalize BTCPAY_URL environment variable
 * 
 * Handles malformed values like:
 * - "BTCPAY_URL=btcpay483258.lndyn.com" -> strips prefix
 * - "btcpay483258.lndyn.com" -> adds https://
 * - "https://btcpay483258.lndyn.com/" -> removes trailing slash
 * 
 * @param {string} raw - Raw BTCPAY_URL value from process.env
 * @returns {string} Normalized URL (always starts with https://, no trailing slash)
 * @throws {Error} If resulting URL is invalid or hostname is empty
 */
function normalizeBtcpayUrl(raw) {
  if (!raw || typeof raw !== 'string') {
    throw new Error('BTCPAY_URL is required and must be a string');
  }

  // Step 1: Trim whitespace
  let normalized = raw.trim();

  // Step 2: Remove "BTCPAY_URL=" prefix if present (handles malformed env vars)
  if (normalized.includes('BTCPAY_URL=')) {
    const prefixIndex = normalized.indexOf('BTCPAY_URL=');
    normalized = normalized.substring(prefixIndex + 'BTCPAY_URL='.length).trim();
  }

  // Step 3: Remove trailing slash
  normalized = normalized.replace(/\/$/, '');

  // Step 4: Add protocol if missing
  if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
    normalized = `https://${normalized}`;
  }

  // Step 5: Validate URL
  let urlObj;
  try {
    urlObj = new URL(normalized);
  } catch (error) {
    throw new Error(`Invalid BTCPAY_URL format: "${raw}" -> "${normalized}" (${error.message})`);
  }

  // Step 6: Validate hostname is not empty
  if (!urlObj.hostname || urlObj.hostname.trim() === '') {
    throw new Error(`BTCPAY_URL has empty hostname: "${raw}" -> "${normalized}"`);
  }

  return normalized;
}

/**
 * Self-check function for development
 * Runs examples to verify normalization works correctly
 */
function runSelfCheck() {
  if (process.env.NODE_ENV === 'production') {
    return; // Skip in production
  }

  console.log('\n[BTCPay URL Normalization] Running self-check...');
  
  const testCases = [
    { input: 'btcpay483258.lndyn.com', expected: 'https://btcpay483258.lndyn.com' },
    { input: 'https://btcpay483258.lndyn.com/', expected: 'https://btcpay483258.lndyn.com' },
    { input: 'BTCPAY_URL=btcpay483258.lndyn.com', expected: 'https://btcpay483258.lndyn.com' },
    { input: 'https://btcpay483258.lndyn.com', expected: 'https://btcpay483258.lndyn.com' },
    { input: '  btcpay483258.lndyn.com  ', expected: 'https://btcpay483258.lndyn.com' },
  ];

  let passed = 0;
  let failed = 0;

  testCases.forEach(({ input, expected }) => {
    try {
      const result = normalizeBtcpayUrl(input);
      if (result === expected) {
        console.log(`  ✅ "${input}" -> "${result}"`);
        passed++;
      } else {
        console.error(`  ❌ "${input}" -> "${result}" (expected "${expected}")`);
        failed++;
      }
    } catch (error) {
      console.error(`  ❌ "${input}" -> ERROR: ${error.message}`);
      failed++;
    }
  });

  console.log(`[BTCPay URL Normalization] Self-check complete: ${passed} passed, ${failed} failed\n`);
}

module.exports = {
  normalizeBtcpayUrl,
  runSelfCheck
};

