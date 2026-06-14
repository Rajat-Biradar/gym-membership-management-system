document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const errorMessage = document.getElementById('errorMessage');

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Reset error display and content
    errorMessage.style.display = 'none';
    errorMessage.textContent = '';

    // Extract input elements and values
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();

    try {
      // Send login credentials via POST request
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok) {
        // Store JWT token and user profile object in localStorage
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));

        // Redirect to dashboard page
        window.location.href = 'dashboard.html';
      } else {
        // Show validation error payload
        errorMessage.textContent = data.error || 'Login failed. Please check credentials.';
        errorMessage.style.display = 'block';
      }
    } catch (err) {
      console.error('Login Fetch Error:', err);
      errorMessage.textContent = 'Server connection error. Please try again later.';
      errorMessage.style.display = 'block';
    }
  });
});
