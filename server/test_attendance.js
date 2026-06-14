const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: './.env' });

const User = require('./models/User');
const Attendance = require('./models/Attendance');

const REGISTER_URL = 'http://localhost:5000/api/auth/register';
const LOGIN_URL = 'http://localhost:5000/api/auth/login';
const ATTENDANCE_URL = 'http://localhost:5000/api/attendance';

const NORMAL_EMAIL = `normal_user_${Date.now()}@example.com`;
const ADMIN_EMAIL = `admin_user_${Date.now()}@example.com`;
const TEST_PASSWORD = 'securePassword123';

async function runTests() {
  console.log('--- Starting Attendance CRUD and Authorization Tests ---');
  let testsPassed = 0;
  let totalTests = 6;

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
        name: 'Normal Attendance User',
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
        name: 'Admin Attendance User',
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

  // Test 1: Logged-in user marks attendance -> Should succeed with 201
  try {
    const res = await fetch(ATTENDANCE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${normalToken}`
      }
      // No userId sent in body! Handled automatically by server from token
    });
    const data = await res.json();
    console.log('\n[Test 1] POST mark attendance Status:', res.status);
    console.log('[Test 1] Response Data:', JSON.stringify(data, null, 2));

    if (res.status === 201 && data.attendance && data.attendance.userId === normalUserId) {
      console.log('✅ Test 1 Passed: Normal user successfully checked in automatically via token!');
      testsPassed++;
    } else {
      console.log('❌ Test 1 Failed: Attendance marking failed.');
    }
  } catch (err) {
    console.error('❌ Test 1 Error:', err.message);
  }

  // Test 2: Double attendance on same calendar day -> Should fail with 400
  try {
    const res = await fetch(ATTENDANCE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${normalToken}`
      }
    });
    const data = await res.json();
    console.log('\n[Test 2] POST duplicate check-in Status:', res.status);
    console.log('[Test 2] Response Data:', data);

    if (res.status === 400 && data.error && data.error.includes('already marked for today')) {
      console.log('✅ Test 2 Passed: Correctly blocked duplicate check-in on the same day!');
      testsPassed++;
    } else {
      console.log('❌ Test 2 Failed: Accepted duplicate check-in or returned incorrect response.');
    }
  } catch (err) {
    console.error('❌ Test 2 Error:', err.message);
  }

  // Test 3: Normal user accesses admin attendance endpoints -> Should fail with 403
  try {
    const res = await fetch(ATTENDANCE_URL, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${normalToken}` }
    });
    const data = await res.json();
    console.log('\n[Test 3] Normal user GET all attendance Status:', res.status);
    console.log('[Test 3] Response Data:', data);

    if (res.status === 403 && data.error && data.error.includes('Forbidden')) {
      console.log('✅ Test 3 Passed: Non-admin blocked from inspecting attendance with 403!');
      testsPassed++;
    } else {
      console.log('❌ Test 3 Failed: Request was not blocked or returned wrong status.');
    }
  } catch (err) {
    console.error('❌ Test 3 Error:', err.message);
  }

  // Test 4: Admin views all attendance -> Should succeed with 200 and populated details
  try {
    const res = await fetch(ATTENDANCE_URL, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const data = await res.json();
    console.log('\n[Test 4] Admin GET all attendance Status:', res.status);
    console.log(`[Test 4] Retrieved records count: ${Array.isArray(data) ? data.length : 'not an array'}`);

    const hasPopulatedUser = Array.isArray(data) && data.some(record => record.userId && typeof record.userId === 'object' && record.userId.name === 'Normal Attendance User');

    if (res.status === 200 && hasPopulatedUser) {
      console.log('✅ Test 4 Passed: Admin successfully retrieved attendance showing populated user name and email!');
      testsPassed++;
    } else {
      console.log('❌ Test 4 Failed: Population failed or listed empty array.');
    }
  } catch (err) {
    console.error('❌ Test 4 Error:', err.message);
  }

  // Test 5: Admin views single user attendance history -> Should succeed with 200
  try {
    const res = await fetch(`${ATTENDANCE_URL}/${normalUserId}`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const data = await res.json();
    console.log('\n[Test 5] Admin GET single user history Status:', res.status);
    console.log(`[Test 5] History records count: ${Array.isArray(data) ? data.length : 'not an array'}`);

    if (res.status === 200 && Array.isArray(data) && data.length > 0) {
      console.log('✅ Test 5 Passed: Admin successfully retrieved single user check-in history!');
      testsPassed++;
    } else {
      console.log('❌ Test 5 Failed: History retrieval failed.');
    }
  } catch (err) {
    console.error('❌ Test 5 Error:', err.message);
  }

  // Test 6: Verify in MongoDB that attendance record persists correctly
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const dbRecord = await Attendance.findOne({ userId: normalUserId });
    await mongoose.disconnect();

    console.log('\n[Test 6] Verified record existence in MongoDB.');
    console.log('[Test 6] Document in DB:', dbRecord ? `Found (ID: ${dbRecord._id})` : 'Not Found');

    if (dbRecord && dbRecord.userId.toString() === normalUserId) {
      console.log('✅ Test 6 Passed: Check-in records persist accurately in MongoDB!');
      testsPassed++;
    } else {
      console.log('❌ Test 6 Failed: Record not found in database.');
    }
  } catch (err) {
    console.error('❌ Test 6 Error:', err.message);
  }

  // Clean up database users and attendance records to keep it clean
  try {
    await mongoose.connect(process.env.MONGO_URI);
    await User.deleteOne({ email: NORMAL_EMAIL });
    await User.deleteOne({ email: ADMIN_EMAIL });
    await Attendance.deleteMany({ userId: normalUserId });
    await mongoose.disconnect();
    console.log('\nCleaned up normal and admin test accounts and attendance records from MongoDB.');
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
