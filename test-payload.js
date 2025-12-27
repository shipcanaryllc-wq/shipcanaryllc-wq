/**
 * Test script to inspect the ShipFast order payload
 * This simulates what happens when creating an order
 */

// Simulate the package data structure
const testPackage = {
  label: 'Test Package',
  length: 18,
  width: 5,
  height: 3,
  weight: 5,
  description: 'AX-04'  // This is the SKU/Description from the form
};

// Simulate the request body
const testReqBody = {
  labelTypeId: 1262,
  package: {
    label: 'Test Package',
    length: 18,
    width: 5,
    height: 3,
    weight: 5,
    description: 'AX-04'  // SKU/Description
  }
};

// Simulate the logic from orders.js
const getDescription = () => {
  const desc = (testPackage.description && String(testPackage.description).trim()) ||
              (testReqBody.package && testReqBody.package.description && String(testReqBody.package.description).trim()) ||
              (testReqBody.description && String(testReqBody.description).trim());
  return (desc && desc.length > 0) ? desc : '';
};

const getEnglishProductName = () => {
  let name = (testPackage.description && String(testPackage.description).trim()) ||
             (testReqBody.package && testReqBody.package.description && String(testReqBody.package.description).trim()) ||
             (testReqBody.description && String(testReqBody.description).trim());
  
  if (!name || name.length === 0) {
    name = (testPackage.label && String(testPackage.label).trim()) || 
           (testReqBody.package && testReqBody.package.label && String(testReqBody.package.label).trim());
  }
  
  if (!name || name.length === 0) {
    name = (testReqBody.english_product_name && String(testReqBody.english_product_name).trim());
  }
  
  const finalName = (name && name.length > 0) ? name : 'Shipping Package';
  return finalName;
};

const skuDescription = getDescription();
const englishProductName = getEnglishProductName();

// Build the order data exactly as it would be in the real code
const orderData = {
  label_type_id: 126,
  weight: testPackage.weight,
  from_country: 'US',
  from_name: 'Test From',
  from_company: null,
  from_street: '123 Test St',
  from_street2: null,
  from_city: 'Test City',
  from_state: 'SC',
  from_zip: '29376',
  to_country: 'US',
  to_name: 'Test To',
  to_company: null,
  to_street: '456 Test Ave',
  to_street2: null,
  to_city: 'Test City',
  to_state: 'SC',
  to_zip: '29376',
  length: testPackage.length || 1,
  width: testPackage.width || 1,
  height: testPackage.height || 1,
  english_product_name: englishProductName,
  product_name_english: englishProductName,
  description: skuDescription,
  reference_1: null,
  reference_2: null
};

// Print the results
console.log('\n');
console.log('╔════════════════════════════════════════════════════════════════════════════╗');
console.log('║                    TEST PAYLOAD INSPECTION                                ║');
console.log('╚════════════════════════════════════════════════════════════════════════════╝');
console.log('\n');

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('COMPLETE PAYLOAD:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(JSON.stringify(orderData, null, 2));
console.log('\n');

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('FIELD VALUES:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`english_product_name: "${orderData.english_product_name}"`);
console.log(`  - Type: ${typeof orderData.english_product_name}`);
console.log(`  - Length: ${orderData.english_product_name?.length || 0}`);
console.log(`  - Is Empty: ${!orderData.english_product_name || orderData.english_product_name.length === 0}`);
console.log(`\ndescription: "${orderData.description}"`);
console.log(`  - Type: ${typeof orderData.description}`);
console.log(`  - Length: ${orderData.description?.length || 0}`);
console.log(`  - Is Empty: ${!orderData.description || orderData.description.length === 0}`);
console.log('\n');

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('ALL KEYS IN PAYLOAD:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(Object.keys(orderData).join(', '));
console.log('\n');

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('CHECKING FOR 英文品名 FIELD:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
const englishNameFields = ['english_product_name', 'product_name_english', 'english_name', 'en_name'];
let found = false;
englishNameFields.forEach(field => {
  if (orderData.hasOwnProperty(field)) {
    console.log(`✓ Found "${field}": "${orderData[field]}"`);
    found = true;
  }
});
if (!found) {
  console.log('✗ MISSING 英文品名 field!');
}
console.log('\n');




