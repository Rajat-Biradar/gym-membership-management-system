document.addEventListener('DOMContentLoaded', () => {
  const registerForm = document.getElementById('registerForm');
  const nameInput = document.getElementById('name');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const alertBox = document.getElementById('alertBox');
  const registerBtn = document.getElementById('registerBtn');

  // Helper utility to show dynamic status alerts
  const showAlert = (message, type) => {
    alertBox.textContent = message;
    alertBox.className = `alert-box ${type}`;
    alertBox.style.display = 'block';
  };

  const clearAlert = () => {
    alertBox.style.display = 'none';
    alertBox.textContent = '';
  };

  // Submit form event handler
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearAlert();

    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    if (!name || !email || !password) {
      showAlert('Please enter all fields.', 'error');
      return;
    }

    // Disable button to prevent double submission
    registerBtn.disabled = true;
    registerBtn.textContent = 'Creating Account...';

    try {
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, email, password })
      });

      const data = await response.json();

      if (response.ok) {
        showAlert('Registration successful! Redirecting to login page...', 'success');
        registerForm.reset();
        
        // Redirect to login page after a short visual delay
        setTimeout(() => {
          window.location.href = 'login.html';
        }, 1500);
      } else {
        showAlert(data.error || 'Registration failed. Please try again.', 'error');
        registerBtn.disabled = false;
        registerBtn.textContent = 'Sign Up';
      }
    } catch (err) {
      console.error('Registration Fetch Error:', err);
      showAlert('Server connection error. Please try again later.', 'error');
      registerBtn.disabled = false;
      registerBtn.textContent = 'Sign Up';
    }
  });
});
