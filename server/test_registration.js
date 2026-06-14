const API_URL = 'http://localhost:5000/api/auth/register';

async function runTests() {
  console.log('--- Starting Registration API Tests ---');
  let testsPassed = 0;
  let totalTests = 4;

  const uniqueEmail = `test_user_${Date.now()}@example.com`;

  // Test 1: Successful registration & checking response payload
  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: '   Test Registration User   ', // with spaces to test trim
        email: `   ${uniqueEmail}   `,        // with spaces to test trim
        password: '   securePassword123   '   // with spaces to test trim
      })
    });

    const data = await res.json();
    console.log('\n[Test 1] Registration Response Status:', res.status);
    console.log('[Test 1] Registration Response Data:', JSON.stringify(data, null, 2));

    if (res.status === 201 && data.user) {
      const u = data.user;
      const hasPassword = 'password' in u || 'password' in data || JSON.stringify(data).toLowerCase().includes('securepassword123');
      const isTrimmed = u.name === 'Test Registration User' && u.email === uniqueEmail;

      if (!hasPassword && isTrimmed) {
        console.log('✅ Test 1 Passed: Successfully registered user with trimmed values and no password returned!');
        testsPassed++;
      } else {
        console.log('❌ Test 1 Failed: Trim failed or password fields were leaked in the response.');
      }
    } else {
      console.log('❌ Test 1 Failed: Status not 201 or user payload is missing.');
    }
  } catch (err) {
    console.error('❌ Test 1 Error:', err.message);
  }

  // Test 2: Duplicate email registration error
  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Another Name',
        email: uniqueEmail,
        password: 'anotherPassword'
      })
    });

    const data = await res.json();
    console.log('\n[Test 2] Duplicate Registration Response Status:', res.status);
    console.log('[Test 2] Duplicate Registration Response Data:', data);

    if (res.status === 400 && data.error && data.error.includes('already exists')) {
      console.log('✅ Test 2 Passed: Correctly blocked duplicate email registration!');
      testsPassed++;
    } else {
      console.log('❌ Test 2 Failed: Did not return correct error or status code for duplicate registration.');
    }
  } catch (err) {
    console.error('❌ Test 2 Error:', err.message);
  }

  // Test 3: Validation block on empty strings or only whitespace
  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: '   ',
        email: '  test@example.com  ',
        password: 'password123'
      })
    });

    const data = await res.json();
    console.log('\n[Test 3] Empty spaces validation Status:', res.status);
    console.log('[Test 3] Empty spaces validation Response Data:', data);

    if (res.status === 400 && data.error && data.error.includes('enter all fields')) {
      console.log('✅ Test 3 Passed: Correctly blocked registration when name is only whitespace!');
      testsPassed++;
    } else {
      console.log('❌ Test 3 Failed: Accepted empty/whitespace input or did not return correct status.');
    }
  } catch (err) {
    console.error('❌ Test 3 Error:', err.message);
  }

  // Test 4: Missing password validation
  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Valid Name',
        email: `valid_email_${Date.now()}@example.com`
      })
    });

    const data = await res.json();
    console.log('\n[Test 4] Missing password validation Status:', res.status);
    console.log('[Test 4] Missing password validation Response Data:', data);

    if (res.status === 400 && data.error && data.error.includes('enter all fields')) {
      console.log('✅ Test 4 Passed: Correctly blocked registration when password is missing!');
      testsPassed++;
    } else {
      console.log('❌ Test 4 Failed: Accepted input with missing password.');
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
