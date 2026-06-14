document.addEventListener('DOMContentLoaded', () => {
  const userName = document.getElementById('userName');
  const userEmail = document.getElementById('userEmail');
  const userRole = document.getElementById('userRole');
  const attendanceBtn = document.getElementById('attendanceBtn');
  const logoutBtn = document.getElementById('logoutBtn');
  const alertBox = document.getElementById('alertBox');
  const membershipInfo = document.getElementById('membershipInfo');
  const membershipNone = document.getElementById('membershipNone');

  // 1. Security Check: Retrieve authentication token and profile from localStorage
  const token = localStorage.getItem('token');
  const userJson = localStorage.getItem('user');

  // 2. Redirect to login page if unauthenticated
  if (!token || !userJson) {
    window.location.href = 'login.html';
    return;
  }

  // 3. Render user details dynamically
  const user = JSON.parse(userJson);
  userName.textContent = user.name;
  userEmail.textContent = user.email;
  userRole.textContent = user.role;

  const welcomeUserName = document.getElementById('welcomeUserName');
  if (welcomeUserName) {
    welcomeUserName.textContent = user.name;
  }

  // Render admin navigation panel link if user has admin role privileges
  const adminNavbarLink = document.getElementById('adminNavbarLink');
  if (user.role === 'admin' && adminNavbarLink) {
    adminNavbarLink.style.display = 'inline-block';
  }

  // Helper utility to show dynamic status alerts
  const showAlert = (message, type) => {
    alertBox.textContent = message;
    alertBox.className = `alert-box ${type}`;
    alertBox.style.display = 'block';
  };

  // 4. Fetch and Display Membership Details for Logged-In User
  const fetchMembership = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/memberships', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}` // Attach secure Bearer token
        }
      });

      const data = await response.json();

      if (response.ok && Array.isArray(data) && data.length > 0) {
        // Identify the user's active membership (or fallback to the first record)
        const activeMembership = data.find(m => m.status === 'active') || data[0];

        // Render membership details
        document.getElementById('memberPlan').textContent = activeMembership.plan;
        
        document.getElementById('memberStatus').textContent = activeMembership.status;
        const statusSpan = document.getElementById('memberStatus');
        statusSpan.style.color = activeMembership.status === 'active' ? 'var(--success)' : 'var(--error)';

        // Localized Date format
        const expiryDate = new Date(activeMembership.expiryDate);
        document.getElementById('memberExpiry').textContent = expiryDate.toLocaleDateString(undefined, {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });

        membershipInfo.style.display = 'block';
        membershipNone.style.display = 'none';
      } else {
        // Membership not found or fetch was unsuccessful
        membershipInfo.style.display = 'none';
        membershipNone.style.display = 'block';
      }
    } catch (err) {
      console.error('Membership Fetch Error:', err);
      membershipInfo.style.display = 'none';
      membershipNone.style.display = 'block';
    }
  };

  // Execute membership loading
  fetchMembership();

  // 5. Handle "Mark Attendance" button triggers
  attendanceBtn.addEventListener('click', async () => {
    // Reset alert box states
    alertBox.style.display = 'none';
    alertBox.textContent = '';

    try {
      // Send POST request with authenticated headers
      const response = await fetch('http://localhost:5000/api/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // Securely attach standard Bearer token
        }
      });

      const data = await response.json();

      if (response.ok) {
        showAlert('Attendance marked successfully!', 'success');
      } else {
        showAlert(data.error || 'Failed to mark attendance.', 'error');
      }
    } catch (err) {
      console.error('Attendance Fetch Error:', err);
      showAlert('Server connection error. Please try again later.', 'error');
    }
  });

  // 6. Handle Sign Out triggers
  const handleLogout = () => {
    localStorage.clear();
    window.location.href = 'login.html';
  };

  if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
  const logoutNavbarLink = document.getElementById('logoutNavbarLink');
  if (logoutNavbarLink) logoutNavbarLink.addEventListener('click', handleLogout);
  const logoutSidebarLink = document.getElementById('logoutSidebarLink');
  if (logoutSidebarLink) logoutSidebarLink.addEventListener('click', handleLogout);
});
