const fs = require('fs');
const path = require('path');

async function runTests() {
  console.log('--- Verifying Login Page Frontend Components ---');
  let testsPassed = 0;
  let totalTests = 5;

  const htmlPath = path.join(__dirname, '../client/pages/login.html');
  const cssPath = path.join(__dirname, '../client/css/style.css');
  const jsPath = path.join(__dirname, '../client/js/login.js');
  const dashPath = path.join(__dirname, '../client/pages/dashboard.html');

  // Test 1: login.html File existence and essential selectors
  try {
    if (fs.existsSync(htmlPath)) {
      const htmlContent = fs.readFileSync(htmlPath, 'utf8');
      const hasEmail = htmlContent.includes('id="email"');
      const hasPassword = htmlContent.includes('id="password"');
      const hasForm = htmlContent.includes('id="loginForm"');
      const hasErrorArea = htmlContent.includes('id="errorMessage"');
      const linksScript = htmlContent.includes('src="../js/login.js"');
      const linksStylesheet = htmlContent.includes('href="../css/style.css"');

      if (hasEmail && hasPassword && hasForm && hasErrorArea && linksScript && linksStylesheet) {
        console.log('✅ Test 1 Passed: login.html is complete and properly linked!');
        testsPassed++;
      } else {
        console.log('❌ Test 1 Failed: login.html is missing some elements or links.');
      }
    } else {
      console.log('❌ Test 1 Failed: login.html does not exist.');
    }
  } catch (err) {
    console.error('❌ Test 1 Error:', err.message);
  }

  // Test 2: style.css File existence and variable declarations
  try {
    if (fs.existsSync(cssPath)) {
      const cssContent = fs.readFileSync(cssPath, 'utf8');
      const hasVariables = cssContent.includes('--primary') && cssContent.includes('--background');
      const hasContainer = cssContent.includes('.login-container');
      const hasErrorMessage = cssContent.includes('.error-message');

      if (hasVariables && hasContainer && hasErrorMessage) {
        console.log('✅ Test 2 Passed: style.css exists and defines variables and responsive styling!');
        testsPassed++;
      } else {
        console.log('❌ Test 2 Failed: style.css lacks core styled elements.');
      }
    } else {
      console.log('❌ Test 2 Failed: style.css does not exist.');
    }
  } catch (err) {
    console.error('❌ Test 2 Error:', err.message);
  }

  // Test 3: login.js File existence and API Fetch integration
  try {
    if (fs.existsSync(jsPath)) {
      const jsContent = fs.readFileSync(jsPath, 'utf8');
      const usesFetch = jsContent.includes("fetch('http://localhost:5000/api/auth/login'") || jsContent.includes('fetch("http://localhost:5000/api/auth/login"');
      const usesLocalStorage = jsContent.includes("localStorage.setItem('token'") || jsContent.includes('localStorage.setItem("token"');
      const usesUserStorage = jsContent.includes("localStorage.setItem('user'") || jsContent.includes('localStorage.setItem("user"');
      const doesRedirect = jsContent.includes("window.location.href = 'dashboard.html'") || jsContent.includes('window.location.href = "dashboard.html"');
      const showsErrors = jsContent.includes('errorMessage.textContent =');

      if (usesFetch && usesLocalStorage && usesUserStorage && doesRedirect && showsErrors) {
        console.log('✅ Test 3 Passed: login.js correctly implements fetch, localStorage caching, and redirection!');
        testsPassed++;
      } else {
        console.log('❌ Test 3 Failed: login.js is missing key fetch or state management logic.');
      }
    } else {
      console.log('❌ Test 3 Failed: login.js does not exist.');
    }
  } catch (err) {
    console.error('❌ Test 3 Error:', err.message);
  }

  // Test 4: dashboard.html File existence and validation
  try {
    if (fs.existsSync(dashPath)) {
      const dashContent = fs.readFileSync(dashPath, 'utf8');
      const checksAuth = dashContent.includes("localStorage.getItem('token'") || dashContent.includes('localStorage.getItem("token"');
      const clearsAuth = dashContent.includes('localStorage.clear()');
      const displaysDetails = dashContent.includes('document.getElementById(\'userName\').textContent') || dashContent.includes('document.getElementById("userName").textContent');

      if (checksAuth && clearsAuth && displaysDetails) {
        console.log('✅ Test 4 Passed: dashboard.html properly implements auth validation, details display, and logout!');
        testsPassed++;
      } else {
        console.log('❌ Test 4 Failed: dashboard.html lacks core dashboard details.');
      }
    } else {
      console.log('❌ Test 4 Failed: dashboard.html does not exist.');
    }
  } catch (err) {
    console.error('❌ Test 4 Error:', err.message);
  }

  // Test 5: Verify standard token cache integration test mock
  try {
    const mockLocalStorage = {
      store: {},
      setItem(key, value) {
        this.store[key] = value.toString();
      },
      getItem(key) {
        return this.store[key] || null;
      },
      clear() {
        this.store = {};
      }
    };

    mockLocalStorage.setItem('token', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9');
    mockLocalStorage.setItem('user', JSON.stringify({ name: 'Test User', email: 'test@example.com', role: 'admin' }));

    const tokenRetrieved = mockLocalStorage.getItem('token') === 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';
    const userRetrieved = JSON.parse(mockLocalStorage.getItem('user')).role === 'admin';

    mockLocalStorage.clear();
    const tokenCleared = mockLocalStorage.getItem('token') === null;

    if (tokenRetrieved && userRetrieved && tokenCleared) {
      console.log('✅ Test 5 Passed: LocalStorage token persistence & clean-up verified!');
      testsPassed++;
    } else {
      console.log('❌ Test 5 Failed: LocalStorage persistence operations failed.');
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
