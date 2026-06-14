const fs = require('fs');
const path = require('path');

async function runTests() {
  console.log('--- Verifying Member Detail View Feature ---');
  let testsPassed = 0;
  let totalTests = 5;

  const htmlPath = path.join(__dirname, '../client/pages/admin.html');
  const jsPath = path.join(__dirname, '../client/js/admin.js');

  // Test 1: admin.html has the details card container with all required selector nodes
  try {
    if (fs.existsSync(htmlPath)) {
      const htmlContent = fs.readFileSync(htmlPath, 'utf8');
      const hasCardSection = htmlContent.includes('id="memberDetailsSection"');
      const hasCloseBtn = htmlContent.includes('id="closeDetailsBtn"');
      const hasGeneralNodes = htmlContent.includes('id="detailName"') && 
                              htmlContent.includes('id="detailEmail"') && 
                              htmlContent.includes('id="detailRole"');
      
      if (hasCardSection && hasCloseBtn && hasGeneralNodes) {
        console.log('✅ Test 1 Passed: admin.html contains the memberDetailsSection card and general user info nodes!');
        testsPassed++;
      } else {
        console.log('❌ Test 1 Failed: admin.html is missing details card containers or main user info nodes.');
      }
    } else {
      console.log('❌ Test 1 Failed: admin.html does not exist.');
    }
  } catch (err) {
    console.error('❌ Test 1 Error:', err.message);
  }

  // Test 2: admin.html has membership and attendance details nodes with friendly empty fallbacks
  try {
    if (fs.existsSync(htmlPath)) {
      const htmlContent = fs.readFileSync(htmlPath, 'utf8');
      const hasMembershipInfo = htmlContent.includes('id="detailMembershipInfo"') && 
                                 htmlContent.includes('id="detailMembershipNone"') &&
                                 htmlContent.includes('id="detailPlan"') && 
                                 htmlContent.includes('id="detailStatus"') && 
                                 htmlContent.includes('id="detailExpiry"');
      const hasAttendanceInfo = htmlContent.includes('id="detailAttendanceTableWrapper"') && 
                                 htmlContent.includes('id="detailAttendanceTableBody"') && 
                                 htmlContent.includes('id="detailAttendanceNone"');

      if (hasMembershipInfo && hasAttendanceInfo) {
        console.log('✅ Test 2 Passed: admin.html contains all membership/attendance subnodes and empty fallback states!');
        testsPassed++;
      } else {
        console.log('❌ Test 2 Failed: admin.html is missing some membership plan or attendance subnodes.');
      }
    } else {
      console.log('❌ Test 2 Failed: admin.html does not exist.');
    }
  } catch (err) {
    console.error('❌ Test 2 Error:', err.message);
  }

  // Test 3: admin.js appends detail buttons to members rows and registers clicks
  try {
    if (fs.existsSync(jsPath)) {
      const jsContent = fs.readFileSync(jsPath, 'utf8');
      const appendsDetailButton = jsContent.includes('detail-member-btn');
      const registersDetailClick = jsContent.includes("document.querySelectorAll('.detail-member-btn')") && 
                                   jsContent.includes('addEventListener');

      if (appendsDetailButton && registersDetailClick) {
        console.log('✅ Test 3 Passed: admin.js dynamically appends View Details action buttons and binds event handlers!');
        testsPassed++;
      } else {
        console.log('❌ Test 3 Failed: admin.js is missing registered members View Details button or click binds.');
      }
    } else {
      console.log('❌ Test 3 Failed: admin.js does not exist.');
    }
  } catch (err) {
    console.error('❌ Test 3 Error:', err.message);
  }

  // Test 4: admin.js dispatches fetches for memberships and individual attendance logs
  try {
    if (fs.existsSync(jsPath)) {
      const jsContent = fs.readFileSync(jsPath, 'utf8');
      const fetchesMemberships = jsContent.includes("fetch('http://localhost:5000/api/memberships'") || 
                                 jsContent.includes('fetch("http://localhost:5000/api/memberships"');
      const fetchesUserAttendance = jsContent.includes('fetch(`http://localhost:5000/api/attendance/${member._id}') ||
                                   jsContent.includes('fetch(`http://localhost:5000/api/attendance/${member._id}`');

      if (fetchesMemberships && fetchesUserAttendance) {
        console.log('✅ Test 4 Passed: admin.js successfully performs dual fetches to verify membership and attendance history logs!');
        testsPassed++;
      } else {
        console.log('❌ Test 4 Failed: admin.js does not fetch memberships or user attendance details.');
      }
    } else {
      console.log('❌ Test 4 Failed: admin.js does not exist.');
    }
  } catch (err) {
    console.error('❌ Test 4 Error:', err.message);
  }

  // Test 5: admin.js implements show details scrolling and close details trigger
  try {
    if (fs.existsSync(jsPath)) {
      const jsContent = fs.readFileSync(jsPath, 'utf8');
      const implementsSmoothScroll = jsContent.includes('scrollIntoView') && jsContent.includes('behavior: \'smooth\'');
      const implementsCloseTrigger = jsContent.includes('closeDetailsBtn') && jsContent.includes("style.display = 'none'");

      if (implementsSmoothScroll && implementsCloseTrigger) {
        console.log('✅ Test 5 Passed: admin.js supports smooth details scrolling transitions and close toggle handlers!');
        testsPassed++;
      } else {
        console.log('❌ Test 5 Failed: admin.js lacks smooth scrolling behaviors or close button bindings.');
      }
    } else {
      console.log('❌ Test 5 Failed: admin.js does not exist.');
    }
  } catch (err) {
    console.error('❌ Test 5 Error:', err.message);
  }

  console.log(`\n--- Verification Summary: ${testsPassed}/${totalTests} Tests Passed ---`);
  if (testsPassed === totalTests) {
    console.log('ALL MEMBER DETAILED INSPECTOR TESTS PASSED SUCCESSFULLY! 🎉');
    process.exit(0);
  } else {
    console.log('SOME TESTS FAILED.');
    process.exit(1);
  }
}

runTests();
