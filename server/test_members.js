const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: './.env' });

const User = require('./models/User');

const REGISTER_URL = 'http://localhost:5000/api/auth/register';
const LOGIN_URL = 'http://localhost:5000/api/auth/login';
const MEMBERS_URL = 'http://localhost:5000/api/members';

const NORMAL_EMAIL = `normal_user_${Date.now()}@example.com`;
const ADMIN_EMAIL = `admin_user_${Date.now()}@example.com`;
const TEST_PASSWORD = 'securePassword123';

async function runTests() {
  console.log('--- Starting Member CRUD and Authorization Tests ---');
  let testsPassed = 0;
  let totalTests = 7;

  let normalToken = '';
  let adminToken = '';

  // STEP 1: Register Normal User and Admin User
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

  // Test 1: Hit GET /api/members WITH normal user token -> Should fail with 403
  try {
    const res = await fetch(MEMBERS_URL, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${normalToken}` }
    });
    const data = await res.json();
    console.log('\n[Test 1] GET members with standard user token Status:', res.status);
    console.log('[Test 1] Response Data:', data);

    if (res.status === 403 && data.error && data.error.includes('Forbidden')) {
      console.log('✅ Test 1 Passed: Standard user blocked from retrieving members with 403!');
      testsPassed++;
    } else {
      console.log('❌ Test 1 Failed: Standard user was not blocked or returned wrong status.');
    }
  } catch (err) {
    console.error('❌ Test 1 Error:', err.message);
  }

  // Test 2: Hit GET /api/members WITH admin token -> Should succeed with 200
  try {
    const res = await fetch(MEMBERS_URL, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const data = await res.json();
    console.log('\n[Test 2] GET members with admin token Status:', res.status);
    console.log(`[Test 2] Retrieved members count: ${Array.isArray(data) ? data.length : 'not an array'}`);

    const passwordsExposed = Array.isArray(data) && data.some(user => 'password' in user);

    if (res.status === 200 && Array.isArray(data) && !passwordsExposed) {
      console.log('✅ Test 2 Passed: Admin successfully retrieved members, and passwords are not exposed!');
      testsPassed++;
    } else {
      console.log('❌ Test 2 Failed: Retrieval failed, not an array, or passwords leaked.');
    }
  } catch (err) {
    console.error('❌ Test 2 Error:', err.message);
  }

  let createdMemberId = '';
  const newMemberEmail = `created_member_${Date.now()}@example.com`;
  const newMemberPassword = 'plainTextPassword123';

  // Test 3: Hit POST /api/members WITH admin token to create new member
  try {
    const res = await fetch(MEMBERS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        name: 'Admin-Created User',
        email: newMemberEmail,
        password: newMemberPassword,
        role: 'user'
      })
    });
    const data = await res.json();
    console.log('\n[Test 3] Admin POST create member Status:', res.status);
    console.log('[Test 3] Created Member Response Data:', JSON.stringify(data, null, 2));

    if (res.status === 201 && data.user && data.user._id) {
      createdMemberId = data.user._id;
      const noPasswordExposed = !('password' in data.user) && !JSON.stringify(data).includes(newMemberPassword);
      
      if (noPasswordExposed) {
        console.log('✅ Test 3 Passed: Admin successfully created a new member without password leakage!');
        testsPassed++;
      } else {
        console.log('❌ Test 3 Failed: Password leaked in creation response.');
      }
    } else {
      console.log('❌ Test 3 Failed: Creation endpoint failed or did not return user ID.');
    }
  } catch (err) {
    console.error('❌ Test 3 Error:', err.message);
  }

  // Test 4: Verify in MongoDB that the newly created member has a hashed password
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const dbUser = await User.findById(createdMemberId);
    await mongoose.disconnect();

    console.log('\n[Test 4] Checked newly created user in MongoDB.');
    console.log('[Test 4] Hashed Password in DB:', dbUser ? dbUser.password : 'user not found');

    const isHashed = dbUser && dbUser.password.startsWith('$2a$') && dbUser.password !== newMemberPassword;

    if (isHashed) {
      console.log('✅ Test 4 Passed: Verified that the created user password is securely hashed in MongoDB!');
      testsPassed++;
    } else {
      console.log('❌ Test 4 Failed: Password was not hashed properly in database.');
    }
  } catch (err) {
    console.error('❌ Test 4 Error:', err.message);
  }

  // Test 5: Hit PUT /api/members/:id WITH admin token to update the member's details
  try {
    const updatedName = 'Fully Updated Member Name';
    const res = await fetch(`${MEMBERS_URL}/${createdMemberId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        name: updatedName,
        role: 'admin'
      })
    });
    const data = await res.json();
    console.log('\n[Test 5] Admin PUT update member Status:', res.status);
    console.log('[Test 5] Updated Member Response Data:', JSON.stringify(data, null, 2));

    if (res.status === 200 && data.user && data.user.name === updatedName && data.user.role === 'admin') {
      console.log('✅ Test 5 Passed: Admin successfully updated user fields!');
      testsPassed++;
    } else {
      console.log('❌ Test 5 Failed: Update endpoint failed or returned mismatching updated data.');
    }
  } catch (err) {
    console.error('❌ Test 5 Error:', err.message);
  }

  // Test 6: Hit DELETE /api/members/:id WITH admin token to delete the member
  try {
    const res = await fetch(`${MEMBERS_URL}/${createdMemberId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const data = await res.json();
    console.log('\n[Test 6] Admin DELETE member Status:', res.status);
    console.log('[Test 6] Delete Response Data:', data);

    if (res.status === 200 && data.message && data.message.includes('deleted successfully')) {
      console.log('✅ Test 6 Passed: Admin successfully triggered member deletion!');
      testsPassed++;
    } else {
      console.log('❌ Test 6 Failed: Deletion request failed.');
    }
  } catch (err) {
    console.error('❌ Test 6 Error:', err.message);
  }

  // Test 7: Verify in MongoDB that the member is successfully removed from the database
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const dbUserAfter = await User.findById(createdMemberId);
    await mongoose.disconnect();

    console.log('\n[Test 7] Checked user existence in MongoDB after deletion.');
    console.log('[Test 7] Member found in DB:', dbUserAfter);

    if (dbUserAfter === null) {
      console.log('✅ Test 7 Passed: Verified that the deleted user is completely removed from MongoDB!');
      testsPassed++;
    } else {
      console.log('❌ Test 7 Failed: User was deleted in API but still found in MongoDB.');
    }
  } catch (err) {
    console.error('❌ Test 7 Error:', err.message);
  }

  // Clean up database users to keep it clean
  try {
    await mongoose.connect(process.env.MONGO_URI);
    await User.deleteOne({ email: NORMAL_EMAIL });
    await User.deleteOne({ email: ADMIN_EMAIL });
    // Also backup delete newMemberEmail just in case deletion test failed
    await User.deleteOne({ email: newMemberEmail });
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
