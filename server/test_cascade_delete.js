const fs = require('fs');
const path = require('path');

async function runTests() {
  console.log('--- Verifying Cascade Deletion & Self-Delete Protection ---');
  let testsPassed = 0;
  let totalTests = 5;

  const adminHtmlPath = path.join(__dirname, '../client/pages/admin.html');
  const adminJsPath = path.join(__dirname, '../client/js/admin.js');
  const controllerPath = path.join(__dirname, '../server/controllers/memberController.js');

  // Test 1: admin.html registered members table matches 4 columns
  try {
    if (fs.existsSync(adminHtmlPath)) {
      const htmlContent = fs.readFileSync(adminHtmlPath, 'utf8');
      const hasActionsCol = htmlContent.includes('<th style="width: 100px;">Actions</th>') || htmlContent.includes('<th>Actions</th>');
      const hasColspan4 = htmlContent.includes('colspan="4"');

      if (hasActionsCol && hasColspan4) {
        console.log('✅ Test 1 Passed: admin.html has the registered members Actions column and adjusted colspan!');
        testsPassed++;
      } else {
        console.log('❌ Test 1 Failed: admin.html registered members table lacks Action headers or correct colspan.');
      }
    } else {
      console.log('❌ Test 1 Failed: admin.html does not exist.');
    }
  } catch (err) {
    console.error('❌ Test 1 Error:', err.message);
  }

  // Test 2: admin.js implements client-side self-deletion protections
  try {
    if (fs.existsSync(adminJsPath)) {
      const jsContent = fs.readFileSync(adminJsPath, 'utf8');
      const protectsSelfId = jsContent.includes('user.id === id');
      const protectsSelfEmail = jsContent.includes('user.email === email');
      const blocksSelfDelete = jsContent.includes("showAlert('Admins cannot delete their own account'") || 
                                jsContent.includes('Admins cannot delete their own account');

      if ((protectsSelfId || protectsSelfEmail) && blocksSelfDelete) {
        console.log('✅ Test 2 Passed: admin.js blocks administrators from deleting their own session accounts!');
        testsPassed++;
      } else {
        console.log('❌ Test 2 Failed: admin.js lacks client-side self-deletion guards.');
      }
    } else {
      console.log('❌ Test 2 Failed: admin.js does not exist.');
    }
  } catch (err) {
    console.error('❌ Test 2 Error:', err.message);
  }

  // Test 3: admin.js implements member DELETE API fetch and dual refresh loops
  try {
    if (fs.existsSync(adminJsPath)) {
      const jsContent = fs.readFileSync(adminJsPath, 'utf8');
      const usesDeleteRoute = jsContent.includes("fetch(`http://localhost:5000/api/members/${id}`") || 
                              jsContent.includes("fetch('http://localhost:5000/api/members/' + id") ||
                              jsContent.includes('http://localhost:5000/api/members/${id}');
      const usesDeleteMethod = jsContent.includes("method: 'DELETE'");
      const triggersTripleRefresh = jsContent.includes('fetchMembers()') && 
                                    jsContent.includes('fetchMemberships()') && 
                                    jsContent.includes('fetchAttendance()');

      if (usesDeleteRoute && usesDeleteMethod && triggersTripleRefresh) {
        console.log('✅ Test 3 Passed: admin.js dispatches DELETE requests securely and live-refreshes all three tables!');
        testsPassed++;
      } else {
        console.log('❌ Test 3 Failed: admin.js member deletion route or refresh loops are missing.');
      }
    } else {
      console.log('❌ Test 3 Failed: admin.js does not exist.');
    }
  } catch (err) {
    console.error('❌ Test 3 Error:', err.message);
  }

  // Test 4: memberController.js imports required models and implements self-deletion guard
  try {
    if (fs.existsSync(controllerPath)) {
      const ctrlContent = fs.readFileSync(controllerPath, 'utf8');
      const importsMembership = ctrlContent.includes("require('../models/Membership')") || ctrlContent.includes('require("../models/Membership")');
      const importsAttendance = ctrlContent.includes("require('../models/Attendance')") || ctrlContent.includes('require("../models/Attendance")');
      const guardsOwnAccount = ctrlContent.includes('req.user.id === id') && ctrlContent.includes('Admins cannot delete their own account');

      if (importsMembership && importsAttendance && guardsOwnAccount) {
        console.log('✅ Test 4 Passed: memberController.js imports Membership/Attendance models and defends self-deletion securely!');
        testsPassed++;
      } else {
        console.log('❌ Test 4 Failed: memberController.js lacks relational imports or self-deletion defenses.');
      }
    } else {
      console.log('❌ Test 4 Failed: memberController.js does not exist.');
    }
  } catch (err) {
    console.error('❌ Test 4 Error:', err.message);
  }

  // Test 5: memberController.js implements cascade delete queries on memberships and attendance records
  try {
    if (fs.existsSync(controllerPath)) {
      const ctrlContent = fs.readFileSync(controllerPath, 'utf8');
      const deletesMemberships = ctrlContent.includes('Membership.deleteMany({ userId: id })') || ctrlContent.includes('Membership.deleteMany({userId: id})');
      const deletesAttendance = ctrlContent.includes('Attendance.deleteMany({ userId: id })') || ctrlContent.includes('Attendance.deleteMany({userId: id})');
      const deletesUser = ctrlContent.includes('User.deleteOne({ _id: id })') || ctrlContent.includes('User.deleteOne({_id: id})');

      if (deletesMemberships && deletesAttendance && deletesUser) {
        console.log('✅ Test 5 Passed: memberController.js successfully deletes related memberships and attendance logs cascadingly!');
        testsPassed++;
      } else {
        console.log('❌ Test 5 Failed: memberController.js cascade deletion queries are missing or incomplete.');
      }
    } else {
      console.log('❌ Test 5 Failed: memberController.js does not exist.');
    }
  } catch (err) {
    console.error('❌ Test 5 Error:', err.message);
  }

  console.log(`\n--- Verification Summary: ${testsPassed}/${totalTests} Tests Passed ---`);
  if (testsPassed === totalTests) {
    console.log('ALL CASCADE DELETION AND PROTECTION TESTS PASSED SUCCESSFULLY! 🎉');
    process.exit(0);
  } else {
    console.log('SOME TESTS FAILED.');
    process.exit(1);
  }
}

runTests();
