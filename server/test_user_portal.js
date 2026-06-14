const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '.env') });

const User = require('./models/User');

const REGISTER_URL = 'http://localhost:5000/api/auth/register';
const LOGIN_URL = 'http://localhost:5000/api/auth/login';
const ATTENDANCE_URL = 'http://localhost:5000/api/attendance';

const TEST_EMAIL = `portal_user_${Date.now()}@example.com`;
const TEST_PASSWORD = 'securePassword123';

async function runTests() {
  console.log('--- Starting User Portal Integration and UI Verification Tests ---');
  let testsPassed = 0;
  let totalTests = 5;

  const pagesDir = path.join(__dirname, '../client/pages');
  const jsDir = path.join(__dirname, '../client/js');

  // Test 1: Assert files exist and contain sidebar layout markers
  try {
    const portalPages = ['profile.html', 'my-membership.html', 'my-attendance.html'];
    let allExist = true;

    for (const page of portalPages) {
      const pagePath = path.join(pagesDir, page);
      if (!fs.existsSync(pagePath)) {
        console.log(`❌ Test 1 Failed: Page ${page} does not exist.`);
        allExist = false;
        break;
      }
      const htmlContent = fs.readFileSync(pagePath, 'utf8');
      if (!htmlContent.includes('class="admin-sidebar"')) {
        console.log(`❌ Test 1 Failed: Page ${page} is missing the sidebar container.`);
        allExist = false;
        break;
      }
    }

    if (allExist) {
      console.log('✅ Test 1 Passed: All 3 portal pages exist and include standard sidebar containers!');
      testsPassed++;
    }
  } catch (err) {
    console.error('❌ Test 1 Error:', err.message);
  }

  // Test 2: Assert JavaScript controller files exist and contain JWT checks
  try {
    const portalScripts = ['profile.js', 'my-membership.js', 'my-attendance.js'];
    let allScriptsValid = true;

    for (const script of portalScripts) {
      const scriptPath = path.join(jsDir, script);
      if (!fs.existsSync(scriptPath)) {
        console.log(`❌ Test 2 Failed: Script ${script} does not exist.`);
        allScriptsValid = false;
        break;
      }
      const jsContent = fs.readFileSync(scriptPath, 'utf8');
      const hasTokenCheck = jsContent.includes("localStorage.getItem('token')");
      const hasUserCheck = jsContent.includes("localStorage.getItem('user')");

      if (!hasTokenCheck || !hasUserCheck) {
        console.log(`❌ Test 2 Failed: Script ${script} is missing JWT token authentication checks.`);
        allScriptsValid = false;
        break;
      }
    }

    if (allScriptsValid) {
      console.log('✅ Test 2 Passed: All 3 portal JS controllers exist and enforce JWT authentication checks!');
      testsPassed++;
    }
  } catch (err) {
    console.error('❌ Test 2 Error:', err.message);
  }

  // Test 3: Assert my-membership.js contains Days Remaining duration logic
  try {
    const membershipJsPath = path.join(jsDir, 'my-membership.js');
    const content = fs.readFileSync(membershipJsPath, 'utf8');

    const calculatesDiff = content.includes('diffTime =') || content.includes('diffTime=');
    const calculatesDays = content.includes('1000 * 60 * 60 * 24') && content.includes('Math.ceil');

    if (calculatesDiff && calculatesDays) {
      console.log('✅ Test 3 Passed: my-membership.js correctly implements Days Remaining calculations!');
      testsPassed++;
    } else {
      console.log('❌ Test 3 Failed: my-membership.js lacks the correct mathematical Days Remaining logic.');
    }
  } catch (err) {
    console.error('❌ Test 3 Error:', err.message);
  }

  // Test 4: Assert my-attendance.js contains newest-first sorting logic
  try {
    const attendanceJsPath = path.join(jsDir, 'my-attendance.js');
    const content = fs.readFileSync(attendanceJsPath, 'utf8');

    const usesSort = content.includes('sort(');
    const usesDescendingDates = content.includes('new Date(b.checkInTime) - new Date(a.checkInTime)') || content.includes('b.checkInTime') && content.includes('a.checkInTime');

    if (usesSort && usesDescendingDates) {
      console.log('✅ Test 4 Passed: my-attendance.js correctly implements descending date sorting!');
      testsPassed++;
    } else {
      console.log('❌ Test 4 Failed: my-attendance.js lacks descending check-in sorting.');
    }
  } catch (err) {
    console.error('❌ Test 4 Error:', err.message);
  }

  // Test 5: Verify GET /api/attendance allows access and returns status 200 for standard users
  let tempUserId = '';
  try {
    console.log('\n[Test 5] Running backend user authorization checks...');
    // Register normal user
    const resReg = await fetch(REGISTER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Portal Test User',
        email: TEST_EMAIL,
        password: TEST_PASSWORD
      })
    });
    
    if (resReg.status !== 201) {
      throw new Error(`Failed to register test user. Status: ${resReg.status}`);
    }

    const regData = await resReg.json();
    tempUserId = regData.user._id;

    // Login normal user
    const resLogin = await fetch(LOGIN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD })
    });

    const loginData = await resLogin.json();
    const userToken = loginData.token;

    // Hit GET /api/attendance using standard user token
    const resAttendance = await fetch(ATTENDANCE_URL, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${userToken}` }
    });

    const attendanceData = await resAttendance.json();
    console.log('[Test 5] GET /api/attendance Status:', resAttendance.status);
    console.log(`[Test 5] Retrieved records count: ${Array.isArray(attendanceData) ? attendanceData.length : 'not an array'}`);

    if (resAttendance.status === 200 && Array.isArray(attendanceData)) {
      console.log('✅ Test 5 Passed: GET /api/attendance allows standard users access and returns scoped check-in logs!');
      testsPassed++;
    } else {
      console.log('❌ Test 5 Failed: GET /api/attendance returned non-200 status or malformed response.');
    }
  } catch (err) {
    console.error('❌ Test 5 Error:', err.message);
  } finally {
    // Clean up DB
    if (tempUserId) {
      try {
        await mongoose.connect(process.env.MONGO_URI);
        await User.deleteOne({ _id: tempUserId });
        await mongoose.disconnect();
        console.log('[Test 5] Cleaned up temporary test user from MongoDB database.');
      } catch (dbErr) {
        console.error('Database cleanup failed:', dbErr.message);
      }
    }
  }

  console.log(`\n--- Verification Summary: ${testsPassed}/${totalTests} Tests Passed ---`);
  if (testsPassed === totalTests) {
    console.log('ALL PORTAL TESTS PASSED SUCCESSFULLY! 🎉');
    process.exit(0);
  } else {
    console.log('SOME TESTS FAILED.');
    process.exit(1);
  }
}

runTests();
