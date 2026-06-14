const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

// Load environment variables for JWT secret verification
dotenv.config({ path: 'c:/Users/rajat/Downloads/gym/server/.env' });

const REGISTER_URL = 'http://localhost:5000/api/auth/register';
const LOGIN_URL = 'http://localhost:5000/api/auth/login';

async function runTests() {
  console.log('--- Starting Login API Tests (Pure HTTP) ---');
  let testsPassed = 0;
  let totalTests = 6;

  const dynamicEmail = `test_login_${Date.now()}@example.com`;
  const dynamicPassword = 'securePassword123';

  // STEP 1: Register the test user so we have someone to login as
  console.log(`\nRegistering dynamic test user (${dynamicEmail})...`);
  try {
    const regRes = await fetch(REGISTER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Login Test User',
        email: dynamicEmail,
        password: dynamicPassword
      })
    });
    const regData = await regRes.json();
    console.log('Registration Status:', regRes.status);
    if (regRes.status !== 201) {
      console.error('Registration failed:', regData);
      process.exit(1);
    }
  } catch (err) {
    console.error('Registration failed with error:', err.message);
    process.exit(1);
  }

  // Test 1: Valid Login
  try {
    const res = await fetch(LOGIN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: dynamicEmail,
        password: dynamicPassword
      })
    });

    const data = await res.json();
    console.log('\n[Test 1] Valid Login Status:', res.status);
    console.log('[Test 1] Valid Login Response Data:', JSON.stringify(data, null, 2));

    if (res.status === 200 && data.token && data.user) {
      console.log('✅ Test 1 Passed: Valid credentials successfully logged in!');
      testsPassed++;
    } else {
      console.log('❌ Test 1 Failed: Status not 200 or payload missing.');
    }
  } catch (err) {
    console.error('❌ Test 1 Error:', err.message);
  }

  // Test 2: Invalid Email
  try {
    const res = await fetch(LOGIN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'nonexistent_email_12345@example.com',
        password: dynamicPassword
      })
    });

    const data = await res.json();
    console.log('\n[Test 2] Invalid Email Login Status:', res.status);
    console.log('[Test 2] Invalid Email Response Data:', data);

    if (res.status === 400 && data.error === 'Invalid email or password') {
      console.log('✅ Test 2 Passed: Rejected invalid email with generic error!');
      testsPassed++;
    } else {
      console.log('❌ Test 2 Failed: Did not return correct status or generic error message.');
    }
  } catch (err) {
    console.error('❌ Test 2 Error:', err.message);
  }

  // Test 3: Invalid Password
  try {
    const res = await fetch(LOGIN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: dynamicEmail,
        password: 'wrongPassword123'
      })
    });

    const data = await res.json();
    console.log('\n[Test 3] Invalid Password Login Status:', res.status);
    console.log('[Test 3] Invalid Password Response Data:', data);

    if (res.status === 400 && data.error === 'Invalid email or password') {
      console.log('✅ Test 3 Passed: Rejected invalid password with generic error!');
      testsPassed++;
    } else {
      console.log('❌ Test 3 Failed: Did not return correct status or generic error message.');
    }
  } catch (err) {
    console.error('❌ Test 3 Error:', err.message);
  }

  // Test 4: Verify JWT token signature and decode it
  try {
    const res = await fetch(LOGIN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: dynamicEmail,
        password: dynamicPassword
      })
    });

    const data = await res.json();
    if (data.token) {
      // Decode and verify token
      const decoded = jwt.verify(data.token, process.env.JWT_SECRET);
      console.log('\n[Test 4] Decoded JWT Payload:', decoded);

      const keys = Object.keys(decoded);
      // Expected keys: 'id', 'role', 'iat', 'exp'
      const hasOnlyIdAndRole = keys.includes('id') && keys.includes('role') && !keys.includes('password') && !keys.includes('email') && !keys.includes('name');

      if (hasOnlyIdAndRole) {
        console.log('✅ Test 4 Passed: JWT payload verified successfully! Contains only user ID and role.');
        testsPassed++;
      } else {
        console.log('❌ Test 4 Failed: JWT payload contains forbidden fields or lacks ID/role.');
      }
    } else {
      console.log('❌ Test 4 Failed: Token not found in response.');
    }
  } catch (err) {
    console.error('❌ Test 4 Error:', err.message);
  }

  // Test 5: Verify password field is NEVER in response
  try {
    const res = await fetch(LOGIN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: dynamicEmail,
        password: dynamicPassword
      })
    });

    const data = await res.json();
    const hasPasswordInResponse = JSON.stringify(data).toLowerCase().includes('password');

    console.log('\n[Test 5] Checking for "password" in raw response string:', hasPasswordInResponse);
    if (!hasPasswordInResponse) {
      console.log('✅ Test 5 Passed: Verified response body never contains password values or keys!');
      testsPassed++;
    } else {
      console.log('❌ Test 5 Failed: Password key or value found in the response.');
    }
  } catch (err) {
    console.error('❌ Test 5 Error:', err.message);
  }

  // Test 6: Verify validation of empty values or whitespaces on login
  try {
    const res = await fetch(LOGIN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: '   ',
        password: 'password123'
      })
    });

    const data = await res.json();
    console.log('\n[Test 6] Empty spaces validation Status:', res.status);
    console.log('[Test 6] Empty spaces Response Data:', data);

    if (res.status === 400 && data.error && data.error.includes('enter all fields')) {
      console.log('✅ Test 6 Passed: Correctly blocked whitespace-only inputs on login!');
      testsPassed++;
    } else {
      console.log('❌ Test 6 Failed: Accepted blank spaces or returned wrong status.');
    }
  } catch (err) {
    console.error('❌ Test 6 Error:', err.message);
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
