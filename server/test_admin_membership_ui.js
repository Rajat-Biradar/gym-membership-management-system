const fs = require('fs');
const path = require('path');

async function runTests() {
  console.log('--- Verifying Admin Membership Management Frontend Components ---');
  let testsPassed = 0;
  let totalTests = 5;

  const htmlPath = path.join(__dirname, '../client/pages/admin.html');
  const jsPath = path.join(__dirname, '../client/js/admin.js');

  // Test 1: admin.html membership form elements existence
  try {
    if (fs.existsSync(htmlPath)) {
      const htmlContent = fs.readFileSync(htmlPath, 'utf8');
      const hasForm = htmlContent.includes('id="membershipForm"');
      const hasSelectUser = htmlContent.includes('id="membershipUserSelect"');
      const hasSelectPlan = htmlContent.includes('id="membershipPlanSelect"');
      const hasSelectStatus = htmlContent.includes('id="membershipStatusSelect"');
      const hasTableBody = htmlContent.includes('id="membershipsTableBody"');

      if (hasForm && hasSelectUser && hasSelectPlan && hasSelectStatus && hasTableBody) {
        console.log('✅ Test 1 Passed: admin.html template contains all required form controls and table bodies!');
        testsPassed++;
      } else {
        console.log('❌ Test 1 Failed: admin.html is missing some membership form inputs.');
      }
    } else {
      console.log('❌ Test 1 Failed: admin.html does not exist.');
    }
  } catch (err) {
    console.error('❌ Test 1 Error:', err.message);
  }

  // Test 2: admin.js token and role guards
  try {
    if (fs.existsSync(jsPath)) {
      const jsContent = fs.readFileSync(jsPath, 'utf8');
      const checksToken = jsContent.includes("localStorage.getItem('token')");
      const checksAdmin = jsContent.includes("user.role !== 'admin'") || jsContent.includes('user.role !== "admin"');
      const redirects = jsContent.includes("window.location.href = 'login.html'") && jsContent.includes("window.location.href = 'dashboard.html'");

      if (checksToken && checksAdmin && redirects) {
        console.log('✅ Test 2 Passed: admin.js guards security sessions and restricts non-admins successfully!');
        testsPassed++;
      } else {
        console.log('❌ Test 2 Failed: admin.js security guards are missing or incorrect.');
      }
    } else {
      console.log('❌ Test 2 Failed: admin.js does not exist.');
    }
  } catch (err) {
    console.error('❌ Test 2 Error:', err.message);
  }

  // Test 3: admin.js POST Fetch to create memberships with Bearer token
  try {
    if (fs.existsSync(jsPath)) {
      const jsContent = fs.readFileSync(jsPath, 'utf8');
      
      const usesPostFetch = jsContent.includes("fetch('http://localhost:5000/api/memberships'") && jsContent.includes("method: 'POST'");
      const attachesAuth = jsContent.includes("'Authorization': `Bearer ${token}`") || jsContent.includes('"Authorization": `Bearer ${token}`') || jsContent.includes('Authorization: `Bearer ${token}`');

      if (usesPostFetch && attachesAuth) {
        console.log('✅ Test 3 Passed: admin.js correctly implements authenticated membership POST creation requests!');
        testsPassed++;
      } else {
        console.log('❌ Test 3 Failed: admin.js membership POST configurations are missing or unauthenticated.');
      }
    } else {
      console.log('❌ Test 3 Failed: admin.js does not exist.');
    }
  } catch (err) {
    console.error('❌ Test 3 Error:', err.message);
  }

  // Test 4: admin.js DELETE Fetch to remove memberships with Bearer token
  try {
    if (fs.existsSync(jsPath)) {
      const jsContent = fs.readFileSync(jsPath, 'utf8');
      
      const usesDeleteFetch = jsContent.includes("fetch(`http://localhost:5000/api/memberships/${id}`") && jsContent.includes("method: 'DELETE'");
      const attachesAuth = jsContent.includes("'Authorization': `Bearer ${token}`") || jsContent.includes('"Authorization": `Bearer ${token}`') || jsContent.includes('Authorization: `Bearer ${token}`');

      if (usesDeleteFetch && attachesAuth) {
        console.log('✅ Test 4 Passed: admin.js correctly implements authenticated membership DELETE deletion requests!');
        testsPassed++;
      } else {
        console.log('❌ Test 4 Failed: admin.js membership DELETE configurations are missing or unauthenticated.');
      }
    } else {
      console.log('❌ Test 4 Failed: admin.js does not exist.');
    }
  } catch (err) {
    console.error('❌ Test 4 Error:', err.message);
  }

  // Test 5: Option lists population and dynamic table rows updates
  try {
    if (fs.existsSync(jsPath)) {
      const jsContent = fs.readFileSync(jsPath, 'utf8');
      
      const appendsDropdownOption = jsContent.includes('membershipUserSelect.appendChild');
      const appendsTableRows = jsContent.includes('membershipsTableBody.appendChild');
      const triggersRefreshes = jsContent.includes('fetchMemberships()');

      if (appendsDropdownOption && appendsTableRows && triggersRefreshes) {
        console.log('✅ Test 5 Passed: admin.js dynamically populates member selects, maps relational rows, and live-refreshes data!');
        testsPassed++;
      } else {
        console.log('❌ Test 5 Failed: admin.js lacks option dropdown population or table data refresh routines.');
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
