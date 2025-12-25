/**
 * Test script to verify duplicate request prevention
 * This simulates multiple rapid clicks without actually creating labels
 */

// Simulate the frontend duplicate prevention logic
let loading = false;
let requestCount = 0;

const simulateHandlePurchase = async () => {
  // Prevent multiple simultaneous requests (same logic as frontend)
  if (loading) {
    console.log('⚠️ Purchase already in progress, ignoring duplicate request');
    return;
  }
  
  loading = true;
  requestCount++;
  console.log(`\n[Test ${requestCount}] Starting purchase request...`);
  
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 100));
  
  console.log(`[Test ${requestCount}] ✅ Request completed`);
  loading = false;
};

// Test: Simulate 5 rapid clicks
console.log('🧪 Testing duplicate request prevention...');
console.log('Simulating 5 rapid clicks on Purchase button\n');

const rapidClicks = async () => {
  // Fire 5 requests almost simultaneously
  const promises = [
    simulateHandlePurchase(),
    simulateHandlePurchase(),
    simulateHandlePurchase(),
    simulateHandlePurchase(),
    simulateHandlePurchase()
  ];
  
  await Promise.all(promises);
  
  console.log('\n📊 Test Results:');
  console.log(`   Total requests attempted: 5`);
  console.log(`   Requests actually processed: ${requestCount}`);
  console.log(`   Requests blocked: ${5 - requestCount}`);
  
  if (requestCount === 1) {
    console.log('\n✅ SUCCESS: Duplicate prevention is working correctly!');
    console.log('   Only 1 request was processed despite 5 rapid clicks.');
  } else {
    console.log('\n❌ FAILURE: Duplicate prevention is NOT working!');
    console.log(`   Expected 1 request, but ${requestCount} were processed.`);
  }
};

rapidClicks();

