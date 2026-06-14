const fs = require('fs');
const path = require('path');

async function runTests() {
  console.log('--- Verifying Responsive UI & Navigation Improvements ---');
  let testsPassed = 0;
  let totalTests = 5;

  const adminHtmlPath = path.join(__dirname, '../client/pages/admin.html');
  const dashboardHtmlPath = path.join(__dirname, '../client/pages/dashboard.html');
  const styleCssPath = path.join(__dirname, '../client/css/style.css');
  const adminJsPath = path.join(__dirname, '../client/js/admin.js');

  // Test 1: style.css contains media queries and responsive styling classes
  try {
    if (fs.existsSync(styleCssPath)) {
      const cssContent = fs.readFileSync(styleCssPath, 'utf8');
      const hasMediaQueries = cssContent.includes('@media') && cssContent.includes('max-width: 768px');
      const hasTableResponsive = cssContent.includes('.table-responsive');
      const hasVars = cssContent.includes('--primary') && cssContent.includes('--background');

      if (hasMediaQueries && hasTableResponsive && hasVars) {
        console.log('✅ Test 1 Passed: style.css contains variables, media queries, and .table-responsive styles!');
        testsPassed++;
      } else {
        console.log('❌ Test 1 Failed: style.css is missing responsive classes or media queries.');
      }
    } else {
      console.log('❌ Test 1 Failed: style.css does not exist.');
    }
  } catch (err) {
    console.error('❌ Test 1 Error:', err.message);
  }

  // Test 2: admin.html has the consistent header navigation & no internal styles
  try {
    if (fs.existsSync(adminHtmlPath)) {
      const htmlContent = fs.readFileSync(adminHtmlPath, 'utf8');
      const hasHeader = htmlContent.includes('<header>') && htmlContent.includes('</header>');
      const hasNav = htmlContent.includes('<nav>') && htmlContent.includes('</nav>');
      const hasActiveAdmin = htmlContent.includes('class="active"') && htmlContent.includes('admin.html');
      const hasNoInternalStyles = !htmlContent.includes('<style>') && !htmlContent.includes('</style>');

      if (hasHeader && hasNav && hasActiveAdmin && hasNoInternalStyles) {
        console.log('✅ Test 2 Passed: admin.html has consistent header navigation and zero internal style elements!');
        testsPassed++;
      } else {
        console.log('❌ Test 2 Failed: admin.html has internal style blocks or is missing the navigation header.');
      }
    } else {
      console.log('❌ Test 2 Failed: admin.html does not exist.');
    }
  } catch (err) {
    console.error('❌ Test 2 Error:', err.message);
  }

  // Test 3: admin.html wraps data tables inside table-responsive containers for mobile scaling
  try {
    if (fs.existsSync(adminHtmlPath)) {
      const htmlContent = fs.readFileSync(adminHtmlPath, 'utf8');
      const countTables = (htmlContent.match(/<table/g) || []).length;
      const countWrappers = (htmlContent.match(/class="table-responsive"/g) || []).length;

      if (countTables > 0 && countWrappers === countTables) {
        console.log(`✅ Test 3 Passed: All ${countTables} data tables in admin.html are wrapped in .table-responsive!`);
        testsPassed++;
      } else {
        console.log(`❌ Test 3 Failed: Data tables count (${countTables}) does not match .table-responsive wrappers (${countWrappers}).`);
      }
    } else {
      console.log('❌ Test 3 Failed: admin.html does not exist.');
    }
  } catch (err) {
    console.error('❌ Test 3 Error:', err.message);
  }

  // Test 4: admin.js handles logout from both button and navbar logout links
  try {
    if (fs.existsSync(adminJsPath)) {
      const jsContent = fs.readFileSync(adminJsPath, 'utf8');
      const bindsButtonLogout = jsContent.includes('logoutBtn.addEventListener') || jsContent.includes("logoutBtn')");
      const bindsNavbarLogout = jsContent.includes('logoutNavbarLink') && jsContent.includes('addEventListener');

      if (bindsButtonLogout && bindsNavbarLogout) {
        console.log('✅ Test 4 Passed: admin.js attaches sign out click actions to logoutBtn and logoutNavbarLink!');
        testsPassed++;
      } else {
        console.log('❌ Test 4 Failed: admin.js is missing logout bindings for one or both elements.');
      }
    } else {
      console.log('❌ Test 4 Failed: admin.js does not exist.');
    }
  } catch (err) {
    console.error('❌ Test 4 Error:', err.message);
  }

  // Test 5: dashboard.html has the responsive header layout with matching logo
  try {
    if (fs.existsSync(dashboardHtmlPath)) {
      const htmlContent = fs.readFileSync(dashboardHtmlPath, 'utf8');
      const hasLogo = htmlContent.includes('class="logo"') && htmlContent.includes('FitPulse Gym');
      const hasActiveDashboard = htmlContent.includes('class="active"') && htmlContent.includes('dashboard.html');

      if (hasLogo && hasActiveDashboard) {
        console.log('✅ Test 5 Passed: dashboard.html has consistent active navigation headers!');
        testsPassed++;
      } else {
        console.log('❌ Test 5 Failed: dashboard.html header structure or logo is inconsistent.');
      }
    } else {
      console.log('❌ Test 5 Failed: dashboard.html does not exist.');
    }
  } catch (err) {
    console.error('❌ Test 5 Error:', err.message);
  }

  console.log(`\n--- Verification Summary: ${testsPassed}/${totalTests} Tests Passed ---`);
  if (testsPassed === totalTests) {
    console.log('ALL RESPONSIVE UI AND NAVIGATION TESTS PASSED SUCCESSFULLY! 🎉');
    process.exit(0);
  } else {
    console.log('SOME RESPONSIVE UI AND NAVIGATION TESTS FAILED.');
    process.exit(1);
  }
}

runTests();
