const fs = require('fs');
const path = require('path');

async function runTests() {
  console.log('--- Verifying Frontend Membership Display Integration Components ---');
  let testsPassed = 0;
  let totalTests = 4;

  const htmlPath = path.join(__dirname, '../client/pages/dashboard.html');
  const jsPath = path.join(__dirname, '../client/js/dashboard.js');

  // Test 1: dashboard.html structure and membership display nodes
  try {
    if (fs.existsSync(htmlPath)) {
      const htmlContent = fs.readFileSync(htmlPath, 'utf8');
      const hasMembershipInfo = htmlContent.includes('id="membershipInfo"');
      const hasMemberPlan = htmlContent.includes('id="memberPlan"');
      const hasMemberStatus = htmlContent.includes('id="memberStatus"');
      const hasMemberExpiry = htmlContent.includes('id="memberExpiry"');
      const hasMembershipNone = htmlContent.includes('id="membershipNone"');

      if (hasMembershipInfo && hasMemberPlan && hasMemberStatus && hasMemberExpiry && hasMembershipNone) {
        console.log('✅ Test 1 Passed: dashboard.html template contains all necessary membership display containers!');
        testsPassed++;
      } else {
        console.log('❌ Test 1 Failed: dashboard.html is missing some membership elements.');
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
      const redirectsIfMissing = jsContent.includes("window.location.href = 'login.html'");

      if (readsToken && redirectsIfMissing) {
        console.log('✅ Test 2 Passed: dashboard.js correctly enforces active token checks and guards the profile view!');
        testsPassed++;
      } else {
        console.log('❌ Test 2 Failed: dashboard.js lacks token checks or page security redirect.');
      }
    } else {
      console.log('❌ Test 2 Failed: dashboard.js does not exist.');
    }
  } catch (err) {
    console.error('❌ Test 2 Error:', err.message);
  }

  // Test 3: Authenticated Fetch header binding in dashboard.js to GET /api/memberships
  try {
    if (fs.existsSync(jsPath)) {
      const jsContent = fs.readFileSync(jsPath, 'utf8');
      
      const usesFetch = jsContent.includes("fetch('http://localhost:5000/api/memberships'") || jsContent.includes('fetch("http://localhost:5000/api/memberships"');
      const attachesAuth = jsContent.includes("'Authorization': `Bearer ${token}`") || jsContent.includes('"Authorization": `Bearer ${token}`') || jsContent.includes('Authorization: `Bearer ${token}`');

      if (usesFetch && attachesAuth) {
        console.log('✅ Test 3 Passed: dashboard.js fetch to memberships endpoint is secure and authenticated via Bearer token!');
        testsPassed++;
      } else {
        console.log('❌ Test 3 Failed: dashboard.js memberships fetch configuration is incorrect or unauthenticated.');
      }
    } else {
      console.log('❌ Test 3 Failed: dashboard.js does not exist.');
    }
  } catch (err) {
    console.error('❌ Test 3 Error:', err.message);
  }

  // Test 4: Dynamic details and empty membership fallback rendering
  try {
    if (fs.existsSync(jsPath)) {
      const jsContent = fs.readFileSync(jsPath, 'utf8');
      
      const setsPlan = jsContent.includes("document.getElementById('memberPlan').textContent =");
      const setsStatus = jsContent.includes("document.getElementById('memberStatus').textContent =");
      const setsExpiry = jsContent.includes("document.getElementById('memberExpiry').textContent =");
      const togglesDisplayNone = jsContent.includes("membershipNone.style.display = 'block'") || jsContent.includes('membershipNone.style.display = "block"');
      const togglesDisplayInfo = jsContent.includes("membershipInfo.style.display = 'block'") || jsContent.includes('membershipInfo.style.display = "block"');

      if (setsPlan && setsStatus && setsExpiry && togglesDisplayNone && togglesDisplayInfo) {
        console.log('✅ Test 4 Passed: dashboard.js dynamically updates membership variables and supports empty fallsafes!');
        testsPassed++;
      } else {
        console.log('❌ Test 4 Failed: dashboard.js membership display logic is incomplete.');
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
