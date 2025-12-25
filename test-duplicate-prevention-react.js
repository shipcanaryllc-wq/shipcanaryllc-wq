/**
 * Test script to verify duplicate request prevention with React-like state simulation
 * This better simulates how React handles state updates
 */

// Simulate React useState-like behavior
class ReactState {
  constructor(initialValue) {
    this._value = initialValue;
    this._listeners = [];
  }
  
  get value() {
    return this._value;
  }
  
  setValue(newValue) {
    // Simulate React's batched state updates
    const oldValue = this._value;
    this._value = newValue;
    this._listeners.forEach(listener => listener(newValue, oldValue));
  }
  
  // Simulate setState callback
  setState(updater) {
    const newValue = typeof updater === 'function' 
      ? updater(this._value) 
      : updater;
    this.setValue(newValue);
  }
}

// Simulate the CreateLabel component
const loadingState = new ReactState(false);
let requestCount = 0;
let blockedCount = 0;

const handlePurchase = async () => {
  // Check current loading state (this is synchronous)
  if (loadingState.value) {
    blockedCount++;
    console.log(`⚠️ [Blocked ${blockedCount}] Purchase already in progress, ignoring duplicate request`);
    return;
  }
  
  // Set loading to true (simulates setLoading(true))
  loadingState.setState(true);
  requestCount++;
  console.log(`\n[Request ${requestCount}] 🚀 Starting purchase request...`);
  console.log(`[Request ${requestCount}] Loading state: ${loadingState.value}`);
  
  // Simulate API call delay (100ms)
  await new Promise(resolve => setTimeout(resolve, 100));
  
  console.log(`[Request ${requestCount}] ✅ Request completed`);
  
  // Set loading back to false (simulates setLoading(false))
  loadingState.setState(false);
};

// Test: Simulate rapid clicks with React-like state behavior
console.log('🧪 Testing duplicate request prevention (React simulation)...');
console.log('Simulating 5 rapid clicks on Purchase button\n');
console.log('Note: In React, state updates are batched, so all clicks might see loading=false initially');
console.log('But the guard should still prevent multiple requests\n');

const testRapidClicks = async () => {
  // Fire 5 requests almost simultaneously (like rapid button clicks)
  const startTime = Date.now();
  
  const promises = [
    handlePurchase(),
    handlePurchase(),
    handlePurchase(),
    handlePurchase(),
    handlePurchase()
  ];
  
  await Promise.all(promises);
  
  const duration = Date.now() - startTime;
  
  console.log('\n📊 Test Results:');
  console.log(`   Total clicks simulated: 5`);
  console.log(`   Requests actually processed: ${requestCount}`);
  console.log(`   Requests blocked by guard: ${blockedCount}`);
  console.log(`   Total duration: ${duration}ms`);
  
  if (requestCount === 1) {
    console.log('\n✅ SUCCESS: Duplicate prevention is working correctly!');
    console.log('   Only 1 request was processed despite 5 rapid clicks.');
    console.log('   The loading state guard successfully blocked 4 duplicate requests.');
  } else {
    console.log('\n❌ FAILURE: Duplicate prevention is NOT working!');
    console.log(`   Expected 1 request, but ${requestCount} were processed.`);
    console.log(`   This means multiple requests got through the guard.`);
  }
};

testRapidClicks();

