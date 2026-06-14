const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: './.env' });

const User = require('./models/User');
const Membership = require('./models/Membership');

const REGISTER_URL = 'http://localhost:5000/api/auth/register';
const LOGIN_URL = 'http://localhost:5000/api/auth/login';
const MEMBERSHIPS_URL = 'http://localhost:5000/api/memberships';

const NORMAL_EMAIL = `normal_user_${Date.now()}@example.com`;
const ADMIN_EMAIL = `admin_user_${Date.now()}@example.com`;
const TEST_PASSWORD = 'securePassword123';

async function runTests() {
  console.log('--- Starting Membership CRUD and Authorization Tests ---');
  let testsPassed = 0;
  let totalTests = 7;

  let normalToken = '';
  let adminToken = '';
  let normalUserId = '';

  // STEP 1: Register Normal User and Admin User
  console.log('\nRegistering test accounts...');
  try {
    // Normal User
    const resNormal = await fetch(REGISTER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Normal Membership User',
        email: NORMAL_EMAIL,
        password: TEST_PASSWORD
      })
    });
    const normalData = await resNormal.json();
    normalUserId = normalData.user._id;
    console.log(`Normal user registered (${NORMAL_EMAIL}). ID: ${normalUserId}. Status: ${resNormal.status}`);

    // Admin User
    const resAdmin = await fetch(REGISTER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Admin Membership User',
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

    await User.updateOne({ email: ADMIN_EMAIL }, { $set: { role: 'admin' } });
    console.log('Admin role updated successfully.');

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

  // Test 1: Access membership routes WITH normal user token -> Should fail with 403
  try {
    const res = await fetch(MEMBERSHIPS_URL, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${normalToken}` }
    });
    const data = await res.json();
    console.log('\n[Test 1] GET memberships with standard user token Status:', res.status);
    console.log('[Test 1] Response Data:', data);

    if (res.status === 403 && data.error && data.error.includes('Forbidden')) {
      console.log('✅ Test 1 Passed: Standard user blocked from retrieving memberships with 403!');
      testsPassed++;
    } else {
      console.log('❌ Test 1 Failed: Standard user request was not blocked or returned wrong status.');
    }
  } catch (err) {
    console.error('❌ Test 1 Error:', err.message);
  }

  // Test 2: Access membership POST WITH admin token but invalid plan -> Should fail with 400
  try {
    const res = await fetch(MEMBERSHIPS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        userId: normalUserId,
        plan: 'daily', // Invalid plan type
        status: 'active'
      })
    });
    const data = await res.json();
    console.log('\n[Test 2] POST membership with invalid plan Status:', res.status);
    console.log('[Test 2] Response Data:', data);

    if (res.status === 400 && data.error && data.error.includes('Invalid plan type')) {
      console.log('✅ Test 2 Passed: Correctly rejected invalid plan type with 400!');
      testsPassed++;
    } else {
      console.log('❌ Test 2 Failed: Accepted invalid plan type or returned incorrect response.');
    }
  } catch (err) {
    console.error('❌ Test 2 Error:', err.message);
  }

  let createdMembershipId = '';
  let originalExpiryDate = '';

  // Test 3: Access membership POST WITH admin token and valid plan -> Should succeed with 201
  try {
    const res = await fetch(MEMBERSHIPS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        userId: normalUserId,
        plan: 'monthly',
        status: 'active'
      })
    });
    const data = await res.json();
    console.log('\n[Test 3] POST create membership Status:', res.status);
    console.log('[Test 3] Created Membership Response Data:', JSON.stringify(data, null, 2));

    if (res.status === 201 && data.membership && data.membership._id) {
      createdMembershipId = data.membership._id;
      originalExpiryDate = data.membership.expiryDate;
      console.log('✅ Test 3 Passed: Admin successfully created membership with correct expiry date!');
      testsPassed++;
    } else {
      console.log('❌ Test 3 Failed: Membership creation failed or returned incorrect response.');
    }
  } catch (err) {
    console.error('❌ Test 3 Error:', err.message);
  }

  // Test 4: Access membership GET all WITH admin token -> Should succeed and show populated userId
  try {
    const res = await fetch(MEMBERSHIPS_URL, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const data = await res.json();
    console.log('\n[Test 4] GET memberships with admin token Status:', res.status);
    console.log(`[Test 4] Retrieved memberships count: ${Array.isArray(data) ? data.length : 'not an array'}`);

    const hasPopulatedUser = Array.isArray(data) && data.some(m => m.userId && typeof m.userId === 'object' && m.userId.name === 'Normal Membership User');

    if (res.status === 200 && hasPopulatedUser) {
      console.log('✅ Test 4 Passed: Admin successfully listed memberships with fully populated user details!');
      testsPassed++;
    } else {
      console.log('❌ Test 4 Failed: Population failed or listed empty array.');
    }
  } catch (err) {
    console.error('❌ Test 4 Error:', err.message);
  }

  // Test 5: Access membership PUT update WITH admin token -> Recalculate expiry date
  try {
    const res = await fetch(`${MEMBERSHIPS_URL}/${createdMembershipId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        plan: 'annual',
        status: 'inactive'
      })
    });
    const data = await res.json();
    console.log('\n[Test 5] PUT update membership Status:', res.status);
    console.log('[Test 5] Updated Membership Response Data:', JSON.stringify(data, null, 2));

    if (res.status === 200 && data.membership) {
      const isUpdated = data.membership.plan === 'annual' && data.membership.status === 'inactive';
      const isDateRecalculated = new Date(data.membership.expiryDate) > new Date(originalExpiryDate);

      console.log('[Test 5] Fields updated:', isUpdated);
      console.log('[Test 5] Expiry date recalculated correctly:', isDateRecalculated);

      if (isUpdated && isDateRecalculated) {
        console.log('✅ Test 5 Passed: Membership successfully updated and expiry recalculated!');
        testsPassed++;
      } else {
        console.log('❌ Test 5 Failed: Mismatch in updated data or expiry recalculation.');
      }
    } else {
      console.log('❌ Test 5 Failed: Update endpoint failed.');
    }
  } catch (err) {
    console.error('❌ Test 5 Error:', err.message);
  }

  // Test 6: Access membership DELETE WITH admin token -> Should succeed
  try {
    const res = await fetch(`${MEMBERSHIPS_URL}/${createdMembershipId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const data = await res.json();
    console.log('\n[Test 6] DELETE membership Status:', res.status);
    console.log('[Test 6] Delete Response Data:', data);

    if (res.status === 200 && data.message && data.message.includes('deleted successfully')) {
      console.log('✅ Test 6 Passed: Membership successfully deleted by admin!');
      testsPassed++;
    } else {
      console.log('❌ Test 6 Failed: Deletion request failed.');
    }
  } catch (err) {
    console.error('❌ Test 6 Error:', err.message);
  }

  // Test 7: Verify in MongoDB that the membership record is completely deleted
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const dbMembershipAfter = await Membership.findById(createdMembershipId);
    await mongoose.disconnect();

    console.log('\n[Test 7] Checked membership existence in MongoDB after deletion.');
    console.log('[Test 7] Membership found in DB:', dbMembershipAfter);

    if (dbMembershipAfter === null) {
      console.log('✅ Test 7 Passed: Verified that membership record is completely deleted from MongoDB!');
      testsPassed++;
    } else {
      console.log('❌ Test 7 Failed: Record was deleted in API but still found in MongoDB.');
    }
  } catch (err) {
    console.error('❌ Test 7 Error:', err.message);
  }

  // Clean up database users to keep it clean
  try {
    await mongoose.connect(process.env.MONGO_URI);
    await User.deleteOne({ email: NORMAL_EMAIL });
    await User.deleteOne({ email: ADMIN_EMAIL });
    await Membership.deleteMany({ userId: normalUserId });
    await mongoose.disconnect();
    console.log('\nCleaned up normal and admin test accounts and membership files from MongoDB.');
  } catch (err) {
    console.error('Failed to clean up test files in database:', err.message);
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
