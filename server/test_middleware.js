const REGISTER_URL = 'http://localhost:5000/api/auth/register';
const LOGIN_URL = 'http://localhost:5000/api/auth/login';
const PROFILE_URL = 'http://localhost:5000/api/auth/profile';

async function runTests() {
  console.log('--- Starting Auth Middleware Verification Tests ---');
  let testsPassed = 0;
  let totalTests = 4;

  const dynamicEmail = `test_middleware_${Date.now()}@example.com`;
  const dynamicPassword = 'securePassword123';
  let validToken = '';
  let expectedUserId = '';

  // STEP 1: Register and Login to get a valid token
  console.log(`\nRegistering and logging in dynamic test user (${dynamicEmail})...`);
  try {
    const regRes = await fetch(REGISTER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Middleware Test User',
        email: dynamicEmail,
        password: dynamicPassword
      })
    });
    
    if (regRes.status !== 201) {
      const regData = await regRes.json();
      console.error('Registration failed:', regData);
      process.exit(1);
    }

    const logRes = await fetch(LOGIN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: dynamicEmail,
        password: dynamicPassword
      })
    });

    const logData = await logRes.json();
    if (logRes.status === 200 && logData.token) {
      validToken = logData.token;
      expectedUserId = logData.user._id;
      console.log('Successfully acquired valid JWT token.');
    } else {
      console.error('Login failed to yield a token:', logData);
      process.exit(1);
    }
  } catch (err) {
    console.error('Setup failed with error:', err.message);
    process.exit(1);
  }

  // Test 1: Hit protected route WITHOUT token
  try {
    const res = await fetch(PROFILE_URL, {
      method: 'GET'
      // No Authorization header
    });

    const data = await res.json();
    console.log('\n[Test 1] Profile access WITHOUT token Status:', res.status);
    console.log('[Test 1] Profile Response Data:', data);

    if (res.status === 401 && data.error && data.error.includes('token missing')) {
      console.log('✅ Test 1 Passed: Correctly blocked request without token with 401!');
      testsPassed++;
    } else {
      console.log('❌ Test 1 Failed: Request was not blocked or returned wrong status/message.');
    }
  } catch (err) {
    console.error('❌ Test 1 Error:', err.message);
  }

  // Test 2: Hit protected route WITH malformed/invalid token
  try {
    const res = await fetch(PROFILE_URL, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer invalid_token_value_123'
      }
    });

    const data = await res.json();
    console.log('\n[Test 2] Profile access WITH invalid token Status:', res.status);
    console.log('[Test 2] Profile Response Data:', data);

    if (res.status === 401 && data.error && data.error.includes('token invalid')) {
      console.log('✅ Test 2 Passed: Correctly blocked request with invalid token with 401!');
      testsPassed++;
    } else {
      console.log('❌ Test 2 Failed: Request was not blocked or returned wrong status/message.');
    }
  } catch (err) {
    console.error('❌ Test 2 Error:', err.message);
  }

  // Test 3: Hit protected route WITH valid token
  try {
    const res = await fetch(PROFILE_URL, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${validToken}`
      }
    });

    const data = await res.json();
    console.log('\n[Test 3] Profile access WITH valid token Status:', res.status);
    console.log('[Test 3] Profile Response Data:', JSON.stringify(data, null, 2));

    if (res.status === 200 && data.id && data.role) {
      console.log('✅ Test 3 Passed: Successfully accessed protected route with valid JWT!');
      testsPassed++;
    } else {
      console.log('❌ Test 3 Failed: Access failed or returned invalid response format.');
    }
  } catch (err) {
    console.error('❌ Test 3 Error:', err.message);
  }

  // Test 4: Verify ONLY id and role from req.user are returned
  try {
    const res = await fetch(PROFILE_URL, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${validToken}`
      }
    });

    const data = await res.json();
    const keys = Object.keys(data);
    const hasOnlyIdAndRole = keys.includes('id') && keys.includes('role') && keys.length === 2;
    const matchesExpectedData = data.id === expectedUserId && data.role === 'user';

    console.log('\n[Test 4] Payload contains only id & role:', hasOnlyIdAndRole);
    console.log('[Test 4] Returned user details match expected:', matchesExpectedData);

    if (hasOnlyIdAndRole && matchesExpectedData) {
      console.log('✅ Test 4 Passed: Verified profile endpoint outputs ONLY user ID and role, and they match the logged-in user!');
      testsPassed++;
    } else {
      console.log('❌ Test 4 Failed: Payload contained extra details or mismatched details.');
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
