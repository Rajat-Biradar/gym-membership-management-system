const fs = require('fs');
const path = require('path');

async function runTests() {
  console.log('--- Verifying Frontend Attendance Integration Components ---');
  let testsPassed = 0;
  let totalTests = 4;

  const htmlPath = path.join(__dirname, '../client/pages/dashboard.html');
  const jsPath = path.join(__dirname, '../client/js/dashboard.js');

  // Test 1: dashboard.html structure and script binding
  try {
    if (fs.existsSync(htmlPath)) {
      const htmlContent = fs.readFileSync(htmlPath, 'utf8');
      const hasAttendanceBtn = htmlContent.includes('id="attendanceBtn"');
      const hasAlertBox = htmlContent.includes('id="alertBox"');
      const hasDashboardScript = htmlContent.includes('src="../js/dashboard.js"');

      if (hasAttendanceBtn && hasAlertBox && hasDashboardScript) {
        console.log('✅ Test 1 Passed: dashboard.html template contains essential check-in nodes and script bindings!');
        testsPassed++;
      } else {
        console.log('❌ Test 1 Failed: dashboard.html is missing components or script.');
      }
    } else {
      console.log('❌ Test 1 Failed: dashboard.html does not exist.');
    }
  } catch (err) {
    console.error('❌ Test 1 Error:', err.message);
  }

  // Test 2: dashboard.js check-in token reading and security redirects
  try {
    if (fs.existsSync(jsPath)) {
      const jsContent = fs.readFileSync(jsPath, 'utf8');
      const readsToken = jsContent.includes("localStorage.getItem('token')");
      const readsUser = jsContent.includes("localStorage.getItem('user')");
      const redirectsIfMissing = jsContent.includes("window.location.href = 'login.html'");

      if (readsToken && readsUser && redirectsIfMissing) {
        console.log('✅ Test 2 Passed: dashboard.js correctly retrieves tokens and protects client view!');
        testsPassed++;
      } else {
        console.log('❌ Test 2 Failed: dashboard.js lacks token validation or redirects.');
      }
    } else {
      console.log('❌ Test 2 Failed: dashboard.js does not exist.');
    }
  } catch (err) {
    console.error('❌ Test 2 Error:', err.message);
  }

  // Test 3: Authenticated Fetch header binding in dashboard.js
  try {
    if (fs.existsSync(jsPath)) {
      const jsContent = fs.readFileSync(jsPath, 'utf8');
      
      const usesFetch = jsContent.includes("fetch('http://localhost:5000/api/attendance'") || jsContent.includes('fetch("http://localhost:5000/api/attendance"');
      const attachesAuth = jsContent.includes("'Authorization': `Bearer ${token}`") || jsContent.includes('"Authorization": `Bearer ${token}`') || jsContent.includes('Authorization: `Bearer ${token}`');

      if (usesFetch && attachesAuth) {
        console.log('✅ Test 3 Passed: dashboard.js correctly binds authorization header as Bearer token!');
        testsPassed++;
      } else {
        console.log('❌ Test 3 Failed: dashboard.js fetch configuration is incorrect or unauthenticated.');
      }
    } else {
      console.log('❌ Test 3 Failed: dashboard.js does not exist.');
    }
  } catch (err) {
    console.error('❌ Test 3 Error:', err.message);
  }

  // Test 4: Alert status and element rendering checks in dashboard.js
  try {
    if (fs.existsSync(jsPath)) {
      const jsContent = fs.readFileSync(jsPath, 'utf8');
      
      const updatesText = jsContent.includes('alertBox.textContent =');
      const togglesDisplay = jsContent.includes("alertBox.style.display = 'block'") || jsContent.includes('alertBox.style.display = "block"');
      const setsSuccessClass = jsContent.includes('success');
      const setsErrorClass = jsContent.includes('error');

      if (updatesText && togglesDisplay && setsSuccessClass && setsErrorClass) {
        console.log('✅ Test 4 Passed: dashboard.js correctly handles DOM alerts and response status styling!');
        testsPassed++;
      } else {
        console.log('❌ Test 4 Failed: dashboard.js alerts management is incomplete.');
      }
    } else {
      console.log('❌ Test 4 Failed: dashboard.js does not exist.');
    }
  } catch (err) {
    console.error('❌ Test 4 Error:', err.message);
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
