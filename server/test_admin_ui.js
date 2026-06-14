const fs = require('fs');
const path = require('path');

async function runTests() {
  console.log('--- Verifying Admin Dashboard Frontend Components ---');
  let testsPassed = 0;
  let totalTests = 5;

  const htmlPath = path.join(__dirname, '../client/pages/admin.html');
  const jsPath = path.join(__dirname, '../client/js/admin.js');

  // Test 1: admin.html structure and script binding
  try {
    if (fs.existsSync(htmlPath)) {
      const htmlContent = fs.readFileSync(htmlPath, 'utf8');
      const hasMembersTable = htmlContent.includes('id="membersTableBody"');
      const hasAttendanceTable = htmlContent.includes('id="attendanceTableBody"');
      const hasAdminScript = htmlContent.includes('src="../js/admin.js"');

      if (hasMembersTable && hasAttendanceTable && hasAdminScript) {
        console.log('✅ Test 1 Passed: admin.html template contains all members/attendance tables and bindings!');
        testsPassed++;
      } else {
        console.log('❌ Test 1 Failed: admin.html is missing some structural tables.');
      }
    } else {
      console.log('❌ Test 1 Failed: admin.html does not exist.');
    }
  } catch (err) {
    console.error('❌ Test 1 Error:', err.message);
  }

  // Test 2: admin.js unauthenticated session redirects
  try {
    if (fs.existsSync(jsPath)) {
      const jsContent = fs.readFileSync(jsPath, 'utf8');
      const readsToken = jsContent.includes("localStorage.getItem('token')");
      const redirectsIfMissing = jsContent.includes("window.location.href = 'login.html'");

      if (readsToken && redirectsIfMissing) {
        console.log('✅ Test 2 Passed: admin.js correctly enforces active token checks and redirects unauthenticated users!');
        testsPassed++;
      } else {
        console.log('❌ Test 2 Failed: admin.js lacks basic login session guard.');
      }
    } else {
      console.log('❌ Test 2 Failed: admin.js does not exist.');
    }
  } catch (err) {
    console.error('❌ Test 2 Error:', err.message);
  }

  // Test 3: admin.js client-side role guards
  try {
    if (fs.existsSync(jsPath)) {
      const jsContent = fs.readFileSync(jsPath, 'utf8');
      const checksRole = jsContent.includes("user.role !== 'admin'") || jsContent.includes('user.role !== "admin"');
      const redirectsToDashboard = jsContent.includes("window.location.href = 'dashboard.html'") || jsContent.includes('window.location.href = "dashboard.html"');

      if (checksRole && redirectsToDashboard) {
        console.log('✅ Test 3 Passed: admin.js correctly implements client-side role guard redirecting standard users!');
        testsPassed++;
      } else {
        console.log('❌ Test 3 Failed: admin.js role validation or redirection is missing.');
      }
    } else {
      console.log('❌ Test 3 Failed: admin.js does not exist.');
    }
  } catch (err) {
    console.error('❌ Test 3 Error:', err.message);
  }

  // Test 4: Authenticated fetches to members and attendance endpoints
  try {
    if (fs.existsSync(jsPath)) {
      const jsContent = fs.readFileSync(jsPath, 'utf8');
      
      const fetchesMembers = jsContent.includes("fetch('http://localhost:5000/api/members'") || jsContent.includes('fetch("http://localhost:5000/api/members"');
      const fetchesAttendance = jsContent.includes("fetch('http://localhost:5000/api/attendance'") || jsContent.includes('fetch("http://localhost:5000/api/attendance"');
      const attachesAuth = jsContent.includes("'Authorization': `Bearer ${token}`") || jsContent.includes('"Authorization": `Bearer ${token}`') || jsContent.includes('Authorization: `Bearer ${token}`');

      if (fetchesMembers && fetchesAttendance && attachesAuth) {
        console.log('✅ Test 4 Passed: admin.js securely performs double fetches passing Bearer authentication headers!');
        testsPassed++;
      } else {
        console.log('❌ Test 4 Failed: admin.js fetches are incorrect or unauthenticated.');
      }
    } else {
      console.log('❌ Test 4 Failed: admin.js does not exist.');
    }
  } catch (err) {
    console.error('❌ Test 4 Error:', err.message);
  }

  // Test 5: Dynamic DOM population loops for tables
  try {
    if (fs.existsSync(jsPath)) {
      const jsContent = fs.readFileSync(jsPath, 'utf8');
      
      const appendsMemberRows = jsContent.includes('membersTableBody.appendChild');
      const appendsAttendanceRows = jsContent.includes('attendanceTableBody.appendChild');

      if (appendsMemberRows && appendsAttendanceRows) {
        console.log('✅ Test 5 Passed: admin.js successfully iterates and appends dynamic DOM table rows!');
        testsPassed++;
      } else {
        console.log('❌ Test 5 Failed: admin.js table row rendering is incomplete.');
      }
    } else {
      console.log('❌ Test 5 Failed: admin.js does not exist.');
    }
  } catch (err) {
    console.error('❌ Test 5 Error:', err.message);
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
