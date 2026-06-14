const fs = require('fs');
const path = require('path');

async function runTests() {
  console.log('--- Verifying Multi-Page Admin Dashboard and Sidebar Setup ---');
  let testsPassed = 0;
  let totalTests = 5;

  const pagesDir = path.join(__dirname, '../client/pages');
  const jsDir = path.join(__dirname, '../client/js');
  const cssFile = path.join(__dirname, '../client/css/style.css');

  // Test 1: Assert all four separate admin HTML pages exist and contain sidebar nav containers
  try {
    const expectedPages = ['admin-dashboard.html', 'members.html', 'memberships.html', 'attendance.html'];
    let allExistAndContainSidebar = true;

    for (const page of expectedPages) {
      const pagePath = path.join(pagesDir, page);
      if (!fs.existsSync(pagePath)) {
        console.log(`❌ Test 1 Failed: Page ${page} does not exist.`);
        allExistAndContainSidebar = false;
        break;
      }
      const content = fs.readFileSync(pagePath, 'utf8');
      if (!content.includes('class="admin-sidebar"') && !content.includes("class='admin-sidebar'")) {
        console.log(`❌ Test 1 Failed: Page ${page} is missing the sidebar container.`);
        allExistAndContainSidebar = false;
        break;
      }
    }

    if (allExistAndContainSidebar) {
      console.log('✅ Test 1 Passed: All 4 admin pages exist and contain sidebar nav containers!');
      testsPassed++;
    }
  } catch (err) {
    console.error('❌ Test 1 Error:', err.message);
  }

  // Test 2: Assert all four JavaScript controller files exist and implement authorization checks
  try {
    const expectedScripts = ['admin-dashboard.js', 'members.js', 'memberships.js', 'attendance.js'];
    let allValid = true;

    for (const script of expectedScripts) {
      const scriptPath = path.join(jsDir, script);
      if (!fs.existsSync(scriptPath)) {
        console.log(`❌ Test 2 Failed: Script ${script} does not exist.`);
        allValid = false;
        break;
      }
      const content = fs.readFileSync(scriptPath, 'utf8');
      const hasTokenCheck = content.includes("localStorage.getItem('token')");
      const hasUserCheck = content.includes("localStorage.getItem('user')");
      const hasRoleCheck = content.includes("role !== 'admin'");
      const hasLoginRedirect = content.includes("login.html");
      const hasDashboardRedirect = content.includes("dashboard.html");

      if (!hasTokenCheck || !hasUserCheck || !hasRoleCheck || !hasLoginRedirect || !hasDashboardRedirect) {
        console.log(`❌ Test 2 Failed: Script ${script} is missing authentication or role-based dashboard redirects.`);
        allValid = false;
        break;
      }
    }

    if (allValid) {
      console.log('✅ Test 2 Passed: All 4 admin JS files exist and implement authorization guards and redirects!');
      testsPassed++;
    }
  } catch (err) {
    console.error('❌ Test 2 Error:', err.message);
  }

  // Test 3: Assert style.css includes admin layout selectors (.admin-wrapper, .admin-sidebar, .admin-main)
  try {
    if (fs.existsSync(cssFile)) {
      const cssContent = fs.readFileSync(cssFile, 'utf8');
      const hasWrapper = cssContent.includes('.admin-wrapper');
      const hasSidebar = cssContent.includes('.admin-sidebar');
      const hasMain = cssContent.includes('.admin-main');

      if (hasWrapper && hasSidebar && hasMain) {
        console.log('✅ Test 3 Passed: style.css contains all required layout selectors (.admin-wrapper, .admin-sidebar, .admin-main)!');
        testsPassed++;
      } else {
        console.log('❌ Test 3 Failed: style.css is missing one or more layout selectors.');
      }
    } else {
      console.log('❌ Test 3 Failed: style.css does not exist.');
    }
  } catch (err) {
    console.error('❌ Test 3 Error:', err.message);
  }

  // Test 4: Assert admin.html implements automatic redirect to admin-dashboard.html
  try {
    const adminHtmlPath = path.join(pagesDir, 'admin.html');
    if (fs.existsSync(adminHtmlPath)) {
      const adminHtmlContent = fs.readFileSync(adminHtmlPath, 'utf8');
      const hasRefreshMeta = adminHtmlContent.includes('http-equiv="refresh"') && adminHtmlContent.includes('url=admin-dashboard.html');
      const hasJsRedirect = adminHtmlContent.includes('window.location.href') && adminHtmlContent.includes('admin-dashboard.html');

      if (hasRefreshMeta || hasJsRedirect) {
        console.log('✅ Test 4 Passed: admin.html correctly implements redirect to admin-dashboard.html for backward compatibility!');
        testsPassed++;
      } else {
        console.log('❌ Test 4 Failed: admin.html is missing correct redirect directives.');
      }
    } else {
      console.log('❌ Test 4 Failed: admin.html does not exist.');
    }
  } catch (err) {
    console.error('❌ Test 4 Error:', err.message);
  }

  // Test 5: Assert HTML pages have correct script tags loaded
  try {
    let allScriptsCorrect = true;
    const pageScriptMapping = {
      'admin-dashboard.html': 'admin-dashboard.js',
      'members.html': 'members.js',
      'memberships.html': 'memberships.js',
      'attendance.html': 'attendance.js'
    };

    for (const [page, script] of Object.entries(pageScriptMapping)) {
      const pagePath = path.join(pagesDir, page);
      const content = fs.readFileSync(pagePath, 'utf8');
      if (!content.includes(`src="../js/${script}"`)) {
        console.log(`❌ Test 5 Failed: Page ${page} does not include correct script tag src="../js/${script}"`);
        allScriptsCorrect = false;
        break;
      }
    }

    if (allScriptsCorrect) {
      console.log('✅ Test 5 Passed: All admin HTML pages load their correct corresponding controller JS script files!');
      testsPassed++;
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
