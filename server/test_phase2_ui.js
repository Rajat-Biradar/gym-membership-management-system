const fs = require('fs');
const path = require('path');

async function runTests() {
  console.log('--- Verifying Phase 2 Members UI Cleanup and Card Details ---');
  let testsPassed = 0;
  let totalTests = 4;

  const htmlPath = path.join(__dirname, '../client/pages/members.html');
  const jsPath = path.join(__dirname, '../client/js/members.js');
  const cssPath = path.join(__dirname, '../client/css/style.css');

  // Test 1: Assert style.css contains all Phase 2 CSS classes
  try {
    if (fs.existsSync(cssPath)) {
      const cssContent = fs.readFileSync(cssPath, 'utf8');
      
      const requiredSelectors = [
        '.actions-flex',
        '.btn-action',
        '.btn-action-view',
        '.btn-action-delete',
        '.member-details-grid',
        '.details-card',
        '.status-badge',
        '.status-badge-active',
        '.status-badge-inactive',
        '.attendance-count-badge',
        '.scrollable-attendance-list',
        '.empty-state-card'
      ];

      let allSelectorsPresent = true;
      for (const selector of requiredSelectors) {
        if (!cssContent.includes(selector)) {
          console.log(`❌ Test 1 Failed: style.css is missing selector ${selector}`);
          allSelectorsPresent = false;
          break;
        }
      }

      if (allSelectorsPresent) {
        console.log('✅ Test 1 Passed: style.css contains all required layout and element styling classes for Phase 2!');
        testsPassed++;
      }
    } else {
      console.log('❌ Test 1 Failed: style.css does not exist.');
    }
  } catch (err) {
    console.error('❌ Test 1 Error:', err.message);
  }

  // Test 2: Assert members.html contains the card-based layout structure and details elements
  try {
    if (fs.existsSync(htmlPath)) {
      const htmlContent = fs.readFileSync(htmlPath, 'utf8');
      
      const hasGrid = htmlContent.includes('class="member-details-grid"');
      const hasProfileCard = htmlContent.includes('Member Profile');
      const hasPlanCard = htmlContent.includes('Membership Plan');
      const hasAttendanceCard = htmlContent.includes('Attendance History');
      const hasCountBadge = htmlContent.includes('id="detailAttendanceCount"');
      const hasEmptyState = htmlContent.includes('class="empty-state-card"');

      if (hasGrid && hasProfileCard && hasPlanCard && hasAttendanceCard && hasCountBadge && hasEmptyState) {
        console.log('✅ Test 2 Passed: members.html contains the three-card layout grid, status elements, and empty state templates!');
        testsPassed++;
      } else {
        console.log('❌ Test 2 Failed: members.html is missing details cards or empty state structures.');
      }
    } else {
      console.log('❌ Test 2 Failed: members.html does not exist.');
    }
  } catch (err) {
    console.error('❌ Test 2 Error:', err.message);
  }

  // Test 3: Assert members.js binds the action button classes in the rendering loop
  try {
    if (fs.existsSync(jsPath)) {
      const jsContent = fs.readFileSync(jsPath, 'utf8');
      
      const attachesActionsFlex = jsContent.includes('class="actions-flex"');
      const attachesBtnAction = jsContent.includes('class="btn-action btn-action-view detail-member-btn"');
      const attachesBtnDelete = jsContent.includes('class="btn-action btn-action-delete delete-member-btn"');

      if (attachesActionsFlex && attachesBtnAction && attachesBtnDelete) {
        console.log('✅ Test 3 Passed: members.js binds Phase 2 actions-flex wrapper and action button classes in table loop!');
        testsPassed++;
      } else {
        console.log('❌ Test 3 Failed: members.js lacks clean action button classes or flexbox wrapper.');
      }
    } else {
      console.log('❌ Test 3 Failed: members.js does not exist.');
    }
  } catch (err) {
    console.error('❌ Test 3 Error:', err.message);
  }

  // Test 4: Assert members.js updates status badges dynamically and updates attendance count
  try {
    if (fs.existsSync(jsPath)) {
      const jsContent = fs.readFileSync(jsPath, 'utf8');
      
      const bindsCount = jsContent.includes('detailAttendanceCount') && jsContent.includes('textContent = data.length');
      const mapsBadgeActive = jsContent.includes('status-badge-active');
      const mapsBadgeInactive = jsContent.includes('status-badge-inactive');
      const setsDisplayFlex = jsContent.includes("detailMembershipNone.style.display = 'flex'") || jsContent.includes('detailMembershipNone.style.display = "flex"');

      if (bindsCount && mapsBadgeActive && mapsBadgeInactive && setsDisplayFlex) {
        console.log('✅ Test 4 Passed: members.js correctly populates attendance badge count and updates active/inactive/empty state cards!');
        testsPassed++;
      } else {
        console.log('❌ Test 4 Failed: members.js does not correctly map badge classes, attendance totals, or empty state displays.');
      }
    } else {
      console.log('❌ Test 4 Failed: members.js does not exist.');
    }
  } catch (err) {
    console.error('❌ Test 4 Error:', err.message);
  }

  console.log(`\n--- Verification Summary: ${testsPassed}/${totalTests} Tests Passed ---`);
  if (testsPassed === totalTests) {
    console.log('ALL PHASE 2 TESTS PASSED SUCCESSFULLY! 🎉');
    process.exit(0);
  } else {
    console.log('SOME TESTS FAILED.');
    process.exit(1);
  }
}

runTests();
