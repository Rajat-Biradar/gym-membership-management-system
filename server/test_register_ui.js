const fs = require('fs');
const path = require('path');

async function runTests() {
  console.log('--- Verifying Frontend Registration Page Components ---');
  let testsPassed = 0;
  let totalTests = 5;

  const htmlPath = path.join(__dirname, '../client/pages/register.html');
  const jsPath = path.join(__dirname, '../client/js/register.js');
  const cssPath = path.join(__dirname, '../client/css/style.css');

  // Test 1: register.html exists and contains necessary input fields and scripts
  try {
    if (fs.existsSync(htmlPath)) {
      const htmlContent = fs.readFileSync(htmlPath, 'utf8');
      const hasName = htmlContent.includes('id="name"');
      const hasEmail = htmlContent.includes('id="email"');
      const hasPassword = htmlContent.includes('id="password"');
      const hasForm = htmlContent.includes('id="registerForm"');
      const hasAlert = htmlContent.includes('id="alertBox"');
      const linksScript = htmlContent.includes('src="../js/register.js"');
      const linksStylesheet = htmlContent.includes('href="../css/style.css"');

      if (hasName && hasEmail && hasPassword && hasForm && hasAlert && linksScript && linksStylesheet) {
        console.log('✅ Test 1 Passed: register.html is complete and properly linked!');
        testsPassed++;
      } else {
        console.log('❌ Test 1 Failed: register.html is missing some key elements or scripts.');
      }
    } else {
      console.log('❌ Test 1 Failed: register.html does not exist.');
    }
  } catch (err) {
    console.error('❌ Test 1 Error:', err.message);
  }

  // Test 2: register.html contains the logo brand and the login navigation link
  try {
    if (fs.existsSync(htmlPath)) {
      const htmlContent = fs.readFileSync(htmlPath, 'utf8');
      const hasLogo = htmlContent.includes('class="logo"') && htmlContent.includes('FitPulse Gym');
      const hasLoginLink = htmlContent.includes('href="login.html"') && htmlContent.includes('Already have an account?');

      if (hasLogo && hasLoginLink) {
        console.log('✅ Test 2 Passed: register.html contains unified logo headers and redirect navigation links!');
        testsPassed++;
      } else {
        console.log('❌ Test 2 Failed: register.html branding or login helper links are missing.');
      }
    } else {
      console.log('❌ Test 2 Failed: register.html does not exist.');
    }
  } catch (err) {
    console.error('❌ Test 2 Error:', err.message);
  }

  // Test 3: register.js contains fetch call to register API and handles submit event
  try {
    if (fs.existsSync(jsPath)) {
      const jsContent = fs.readFileSync(jsPath, 'utf8');
      const usesRegisterFetch = jsContent.includes("fetch('http://localhost:5000/api/auth/register'") || 
                                jsContent.includes('fetch("http://localhost:5000/api/auth/register"');
      const usesPostMethod = jsContent.includes("method: 'POST'") || jsContent.includes('method: "POST"');
      const handlesSubmit = jsContent.includes("addEventListener('submit'") || jsContent.includes('addEventListener("submit"');

      if (usesRegisterFetch && usesPostMethod && handlesSubmit) {
        console.log('✅ Test 3 Passed: register.js correctly intercepts form submissions and dispatches POST requests to registration API!');
        testsPassed++;
      } else {
        console.log('❌ Test 3 Failed: register.js fetch API configurations are missing or incorrect.');
      }
    } else {
      console.log('❌ Test 3 Failed: register.js does not exist.');
    }
  } catch (err) {
    console.error('❌ Test 3 Error:', err.message);
  }

  // Test 4: register.js implements alert box changes and delays redirects on success
  try {
    if (fs.existsSync(jsPath)) {
      const jsContent = fs.readFileSync(jsPath, 'utf8');
      const hasAlertSuccess = jsContent.includes('showAlert') && jsContent.includes('success');
      const hasAlertError = jsContent.includes('showAlert') && jsContent.includes('error');
      const hasTimeoutRedirect = jsContent.includes('setTimeout') && jsContent.includes('window.location.href = \'login.html\'');

      if (hasAlertSuccess && hasAlertError && hasTimeoutRedirect) {
        console.log('✅ Test 4 Passed: register.js successfully implements visual notifications and transitions on registration success!');
        testsPassed++;
      } else {
        console.log('❌ Test 4 Failed: register.js status alerts or delay loops are missing.');
      }
    } else {
      console.log('❌ Test 4 Failed: register.js does not exist.');
    }
  } catch (err) {
    console.error('❌ Test 4 Error:', err.message);
  }

  // Test 5: End-to-end integration: check backend user registration default role model in memory
  try {
    const User = require('./models/User');
    const user = new User({
      name: 'E2E Test User',
      email: 'e2etest@example.com',
      password: 'somehashpassword'
    });

    if (user.role === 'user') {
      console.log('✅ Test 5 Passed: Mongoose schema and backend configurations strictly default newly registered users to role="user"!');
      testsPassed++;
    } else {
      console.log('❌ Test 5 Failed: Mongoose model role default is not "user".');
    }
  } catch (err) {
    console.error('❌ Test 5 Error:', err.message);
  }

  console.log(`\n--- Verification Summary: ${testsPassed}/${totalTests} Tests Passed ---`);
  if (testsPassed === totalTests) {
    console.log('ALL FRONTEND REGISTRATION TESTS PASSED SUCCESSFULLY! 🎉');
    process.exit(0);
  } else {
    console.log('SOME FRONTEND REGISTRATION TESTS FAILED.');
    process.exit(1);
  }
}

runTests();
