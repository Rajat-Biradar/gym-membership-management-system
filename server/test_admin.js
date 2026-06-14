const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: './.env' });

const User = require('./models/User');

const REGISTER_URL = 'http://localhost:5000/api/auth/register';
const LOGIN_URL = 'http://localhost:5000/api/auth/login';
const ADMIN_TEST_URL = 'http://localhost:5000/api/auth/admin-test';

const NORMAL_EMAIL = `normal_user_${Date.now()}@example.com`;
const ADMIN_EMAIL = `admin_user_${Date.now()}@example.com`;
const TEST_PASSWORD = 'securePassword123';

async function runTests() {
  console.log('--- Starting Admin Authorization Middleware Tests ---');
  let testsPassed = 0;
  let totalTests = 4;

  let normalToken = '';
  let adminToken = '';

  // STEP 1: Register Normal User and Admin User (which initially has 'user' role)
  console.log('\nRegistering test accounts...');
  try {
    // Normal User
    const resNormal = await fetch(REGISTER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Normal Test User',
        email: NORMAL_EMAIL,
        password: TEST_PASSWORD
      })
    });
    console.log(`Normal user registered (${NORMAL_EMAIL}). Status: ${resNormal.status}`);

    // Admin User
    const resAdmin = await fetch(REGISTER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Admin Test User',
        email: ADMIN_EMAIL,
        password: TEST_PASSWORD
      })
    });
    console.log(`Admin user registered (${ADMIN_EMAIL}). Status: ${resAdmin.status}`);

    if (resNormal.status !== 201 || resAdmin.status !== 201) {
      console.error('Account registration failed.');
      process.exit(1);
    }
  } catch (err) {
    console.error('Account setup failed with error:', err.message);
    process.exit(1);
  }

  // STEP 2: Update the Admin user's role in MongoDB to 'admin' using relative mongoose connection
  console.log('\nUpdating admin user role to "admin" in MongoDB...');
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB.');

    const updateResult = await User.updateOne({ email: ADMIN_EMAIL }, { $set: { role: 'admin' } });
    console.log('Update result:', updateResult);

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  } catch (err) {
    console.error('Failed to update admin role in MongoDB:', err.message);
    process.exit(1);
  }

  // STEP 3: Log in both users to obtain JWT tokens
  console.log('\nLogging in both users to retrieve tokens...');
  try {
    // Login Normal User
    const resNormalLog = await fetch(LOGIN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: NORMAL_EMAIL, password: TEST_PASSWORD })
    });
    const normalData = await resNormalLog.json();
    normalToken = normalData.token;

    // Login Admin User
    const resAdminLog = await fetch(LOGIN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: ADMIN_EMAIL, password: TEST_PASSWORD })
    });
    const adminData = await resAdminLog.json();
    adminToken = adminData.token;

    console.log('Successfully retrieved normal and admin user JWT tokens.');
  } catch (err) {
    console.error('Login requests failed:', err.message);
    process.exit(1);
  }

  // Test 1: Access /admin-test WITHOUT token
  try {
    const res = await fetch(ADMIN_TEST_URL, { method: 'GET' });
    const data = await res.json();
    console.log('\n[Test 1] Access WITHOUT token Status:', res.status);
    console.log('[Test 1] Response Data:', data);

    if (res.status === 401 && data.error && data.error.includes('token missing')) {
      console.log('✅ Test 1 Passed: Request without token blocked with 401!');
      testsPassed++;
    } else {
      console.log('❌ Test 1 Failed: Request was not blocked or returned wrong status.');
    }
  } catch (err) {
    console.error('❌ Test 1 Error:', err.message);
  }

  // Test 2: Access /admin-test WITH normal user token
  try {
    const res = await fetch(ADMIN_TEST_URL, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${normalToken}` }
    });
    const data = await res.json();
    console.log('\n[Test 2] Access with standard user token Status:', res.status);
    console.log('[Test 2] Response Data:', data);

    if (res.status === 403 && data.error && data.error.includes('Forbidden, admin access required')) {
      console.log('✅ Test 2 Passed: Standard user request was blocked with 403 Forbidden!');
      testsPassed++;
    } else {
      console.log('❌ Test 2 Failed: Did not return correct status or forbidden message.');
    }
  } catch (err) {
    console.error('❌ Test 2 Error:', err.message);
  }

  // Test 3: Access /admin-test WITH admin user token
  try {
    const res = await fetch(ADMIN_TEST_URL, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const data = await res.json();
    console.log('\n[Test 3] Access with admin token Status:', res.status);
    console.log('[Test 3] Response Data:', JSON.stringify(data, null, 2));

    if (res.status === 200 && data.message && data.message.includes('Admin access granted')) {
      console.log('✅ Test 3 Passed: Admin successfully authorized with 200 OK!');
      testsPassed++;
    } else {
      console.log('❌ Test 3 Failed: Admin access request failed.');
    }
  } catch (err) {
    console.error('❌ Test 3 Error:', err.message);
  }

  // Test 4: Verify returned user payload matches the admin user profile and role
  try {
    const res = await fetch(ADMIN_TEST_URL, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const data = await res.json();
    const userPayload = data.user;
    
    const isCorrectAdmin = userPayload && userPayload.role === 'admin';
    const noSensitiveData = userPayload && !('password' in userPayload) && !('email' in userPayload);

    console.log('\n[Test 4] User role in payload is admin:', isCorrectAdmin);
    console.log('[Test 4] Payload contains no sensitive information:', noSensitiveData);

    if (isCorrectAdmin && noSensitiveData) {
      console.log('✅ Test 4 Passed: Admin payload is completely correct and secure!');
      testsPassed++;
    } else {
      console.log('❌ Test 4 Failed: Payload is incorrect or leaks sensitive data.');
    }
  } catch (err) {
    console.error('❌ Test 4 Error:', err.message);
  }

  // Clean up database users to keep it clean
  try {
    await mongoose.connect(process.env.MONGO_URI);
    await User.deleteOne({ email: NORMAL_EMAIL });
    await User.deleteOne({ email: ADMIN_EMAIL });
    await mongoose.disconnect();
    console.log('\nCleaned up normal and admin test accounts from MongoDB.');
  } catch (err) {
    console.error('Failed to clean up test accounts in database:', err.message);
  }

  console.log(`\n--- Verification Summary: ${testsPassed}/${totalTests} Tests Passed ---`);
  if (testsPassed === totalTests) {
    console.log('ALL TESTS PASSED SUCCESSFULLY! 🎉');
    process.exit(0);
  } else {
    console.log('SOME TESTS FAILED.');
    process.exit(1);
  }
}

runTests();
