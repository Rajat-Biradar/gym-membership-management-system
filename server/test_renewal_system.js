const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

const User = require('./models/User');
const Membership = require('./models/Membership');
const RenewalRequest = require('./models/RenewalRequest');

const REGISTER_URL = 'http://localhost:5000/api/auth/register';
const LOGIN_URL = 'http://localhost:5000/api/auth/login';
const MEMBERSHIPS_URL = 'http://localhost:5000/api/memberships';
const RENEWALS_URL = 'http://localhost:5000/api/renewals';

const MEMBER_EMAIL = `member_renew_${Date.now()}@example.com`;
const ADMIN_EMAIL = `admin_renew_${Date.now()}@example.com`;
const TEST_PASSWORD = 'securePassword123';

async function runTests() {
  console.log('--- Starting Membership Renewal Request System Tests ---');
  let testsPassed = 0;
  let totalTests = 6;

  let memberToken = '';
  let adminToken = '';
  let memberUserId = '';
  let adminUserId = '';
  let membershipId = '';
  let firstRequestId = '';
  let secondRequestId = '';
  let originalExpiryDate = null;

  // Setup: Register users
  console.log('\nSetting up test user accounts...');
  try {
    const resMember = await fetch(REGISTER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Renewal Test Member',
        email: MEMBER_EMAIL,
        password: TEST_PASSWORD
      })
    });
    const memberData = await resMember.json();
    memberUserId = memberData.user._id;

    const resAdmin = await fetch(REGISTER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Renewal Test Admin',
        email: ADMIN_EMAIL,
        password: TEST_PASSWORD
      })
    });
    const adminData = await resAdmin.json();
    adminUserId = adminData.user._id;

    if (resMember.status !== 201 || resAdmin.status !== 201) {
      throw new Error(`Failed to create users. Member status: ${resMember.status}, Admin status: ${resAdmin.status}`);
    }
    console.log('User accounts registered.');
  } catch (err) {
    console.error('Setup failed during user registration:', err.message);
    process.exit(1);
  }

  // Setup: Update Admin Role directly in DB
  console.log('\nUpgrading Admin user role to "admin" in MongoDB...');
  try {
    await mongoose.connect(process.env.MONGO_URI);
    await User.updateOne({ _id: adminUserId }, { $set: { role: 'admin' } });
    await mongoose.disconnect();
    console.log('Admin user role upgraded successfully.');
  } catch (err) {
    console.error('Setup failed during Admin role update:', err.message);
    process.exit(1);
  }

  // Setup: Login to obtain tokens
  console.log('\nLogging in to obtain JWT tokens...');
  try {
    const resMemLog = await fetch(LOGIN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: MEMBER_EMAIL, password: TEST_PASSWORD })
    });
    const memLogData = await resMemLog.json();
    memberToken = memLogData.token;

    const resAdmLog = await fetch(LOGIN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: ADMIN_EMAIL, password: TEST_PASSWORD })
    });
    const admLogData = await resAdmLog.json();
    adminToken = admLogData.token;

    console.log('JWT Tokens acquired.');
  } catch (err) {
    console.error('Setup failed during user login:', err.message);
    process.exit(1);
  }

  // Setup: Create initial membership for Member via Admin
  console.log('\nCreating initial membership for Member...');
  try {
    const res = await fetch(MEMBERSHIPS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        userId: memberUserId,
        plan: 'monthly',
        status: 'active'
      })
    });
    const data = await res.json();
    if (res.status !== 201 || !data.membership) {
      throw new Error(`Failed to create membership. Status: ${res.status}`);
    }
    membershipId = data.membership._id;
    originalExpiryDate = new Date(data.membership.expiryDate);
    console.log(`Initial monthly membership created with ID: ${membershipId}. Expiry: ${originalExpiryDate.toISOString()}`);
  } catch (err) {
    console.error('Setup failed during initial membership creation:', err.message);
    process.exit(1);
  }

  // --- Test 1: Standard Member submits renewal request ---
  try {
    console.log('\n[Test 1] POST /api/renewals - Standard user submits renewal request');
    const res = await fetch(RENEWALS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${memberToken}`
      },
      body: JSON.stringify({
        membershipId,
        requestedPlan: 'quarterly'
      })
    });
    const data = await res.json();
    console.log('Status:', res.status);
    console.log('Response:', data);

    if (res.status === 201 && data.request && data.request.status === 'pending' && data.request.requestedPlan === 'quarterly') {
      firstRequestId = data.request._id;
      console.log('✅ Test 1 Passed: Standard user successfully submitted a renewal request!');
      testsPassed++;
    } else {
      console.log('❌ Test 1 Failed: Renewal request submission did not return expected data.');
    }
  } catch (err) {
    console.error('❌ Test 1 Error:', err.message);
  }

  // --- Test 2: Standard Member tries to submit a duplicate pending request ---
  try {
    console.log('\n[Test 2] POST /api/renewals - Submit duplicate pending request');
    const res = await fetch(RENEWALS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${memberToken}`
      },
      body: JSON.stringify({
        membershipId,
        requestedPlan: 'annual'
      })
    });
    const data = await res.json();
    console.log('Status:', res.status);
    console.log('Response:', data);

    if (res.status === 400 && data.error && data.error.includes('pending renewal request')) {
      console.log('✅ Test 2 Passed: Duplicate pending request correctly rejected with 400!');
      testsPassed++;
    } else {
      console.log('❌ Test 2 Failed: Duplicate request was not rejected as expected.');
    }
  } catch (err) {
    console.error('❌ Test 2 Error:', err.message);
  }

  // --- Test 3: Admin retrieves all renewal requests ---
  try {
    console.log('\n[Test 3] GET /api/renewals - Admin retrieves all requests');
    const res = await fetch(RENEWALS_URL, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const data = await res.json();
    console.log('Status:', res.status);
    console.log('Requests Count:', Array.isArray(data) ? data.length : 'not an array');

    const found = Array.isArray(data) && data.some(r => r._id === firstRequestId && r.userId && r.userId.name === 'Renewal Test Member');
    if (res.status === 200 && found) {
      console.log('✅ Test 3 Passed: Admin successfully retrieved populated renewal requests!');
      testsPassed++;
    } else {
      console.log('❌ Test 3 Failed: Admin GET renewals did not return populated list or request was missing.');
    }
  } catch (err) {
    console.error('❌ Test 3 Error:', err.message);
  }

  // --- Test 4: Admin approves the renewal request and verifies membership expiry date extension ---
  try {
    console.log('\n[Test 4] PUT /api/renewals/:id - Admin approves request');
    const res = await fetch(`${RENEWALS_URL}/${firstRequestId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ status: 'approved' })
    });
    const data = await res.json();
    console.log('Status:', res.status);
    console.log('Response:', data);

    // Verify membership updates
    await mongoose.connect(process.env.MONGO_URI);
    const updatedMembership = await Membership.findById(membershipId);
    await mongoose.disconnect();

    console.log('Original Expiry:', originalExpiryDate.toISOString());
    console.log('Updated Expiry:', updatedMembership.expiryDate.toISOString());
    console.log('Updated Plan:', updatedMembership.plan);
    console.log('Updated Status:', updatedMembership.status);

    // Verify correct extension: baseDate is max(originalExpiry, now).
    // In our test, originalExpiry is set to 1 month from now. So originalExpiry is later than now.
    // Therefore, updatedExpiry should be exactly 3 months (quarterly) from originalExpiry.
    const expectedExpiry = new Date(originalExpiryDate);
    expectedExpiry.setMonth(expectedExpiry.getMonth() + 3);

    const matchPlan = updatedMembership.plan === 'quarterly';
    const matchStatus = updatedMembership.status === 'active';
    const matchExpiry = Math.abs(updatedMembership.expiryDate.getTime() - expectedExpiry.getTime()) < 1000; // tolerance of 1s

    console.log(`Checks - Plan: ${matchPlan}, Status: ${matchStatus}, Expiry Date Match: ${matchExpiry}`);

    if (res.status === 200 && data.request && data.request.status === 'approved' && matchPlan && matchStatus && matchExpiry) {
      console.log('✅ Test 4 Passed: Admin approved renewal, changing plan to quarterly and correctly extending expiry!');
      testsPassed++;
    } else {
      console.log('❌ Test 4 Failed: Renewal approval logic or membership recalculation failed.');
    }
  } catch (err) {
    console.error('❌ Test 4 Error:', err.message);
  }

  // --- Test 5: Member submits a second request (should work since first request is approved, not pending) ---
  try {
    console.log('\n[Test 5] POST /api/renewals - Submit second request after first is resolved');
    const res = await fetch(RENEWALS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${memberToken}`
      },
      body: JSON.stringify({
        membershipId,
        requestedPlan: 'annual'
      })
    });
    const data = await res.json();
    console.log('Status:', res.status);
    console.log('Response:', data);

    if (res.status === 201 && data.request && data.request.status === 'pending' && data.request.requestedPlan === 'annual') {
      secondRequestId = data.request._id;
      console.log('✅ Test 5 Passed: Member successfully submitted a second renewal request!');
      testsPassed++;
    } else {
      console.log('❌ Test 5 Failed: Second renewal submission failed.');
    }
  } catch (err) {
    console.error('❌ Test 5 Error:', err.message);
  }

  // --- Test 6: Admin rejects the second request (membership must not change) ---
  try {
    console.log('\n[Test 6] PUT /api/renewals/:id - Admin rejects second request');
    
    // Fetch membership values before rejection
    await mongoose.connect(process.env.MONGO_URI);
    const membershipBefore = await Membership.findById(membershipId);
    await mongoose.disconnect();

    const res = await fetch(`${RENEWALS_URL}/${secondRequestId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ status: 'rejected' })
    });
    const data = await res.json();
    console.log('Status:', res.status);
    console.log('Response:', data);

    // Fetch membership values after rejection
    await mongoose.connect(process.env.MONGO_URI);
    const membershipAfter = await Membership.findById(membershipId);
    await mongoose.disconnect();

    const noChangePlan = membershipBefore.plan === membershipAfter.plan;
    const noChangeExpiry = membershipBefore.expiryDate.getTime() === membershipAfter.expiryDate.getTime();
    console.log(`Checks - No plan change: ${noChangePlan}, No expiry change: ${noChangeExpiry}`);

    if (res.status === 200 && data.request && data.request.status === 'rejected' && noChangePlan && noChangeExpiry) {
      console.log('✅ Test 6 Passed: Admin rejected renewal request, status marked rejected, membership unchanged!');
      testsPassed++;
    } else {
      console.log('❌ Test 6 Failed: Rejection logic or membership preservation failed.');
    }
  } catch (err) {
    console.error('❌ Test 6 Error:', err.message);
  }

  // Cleanup DB
  console.log('\nCleaning up database resources...');
  try {
    await mongoose.connect(process.env.MONGO_URI);
    await User.deleteMany({ _id: { $in: [memberUserId, adminUserId] } });
    await Membership.deleteMany({ _id: membershipId });
    await RenewalRequest.deleteMany({ userId: { $in: [memberUserId, adminUserId] } });
    await mongoose.disconnect();
    console.log('Cleanup complete.');
  } catch (err) {
    console.error('Cleanup failed:', err.message);
  }

  console.log(`\n--- Verification Summary: ${testsPassed}/${totalTests} Tests Passed ---`);
  if (testsPassed === totalTests) {
    console.log('ALL RENEWAL TESTS PASSED SUCCESSFULLY! 🎉');
    process.exit(0);
  } else {
    console.log('SOME RENEWAL TESTS FAILED.');
    process.exit(1);
  }
}

runTests();
