document.addEventListener('DOMContentLoaded', () => {
  const attendanceTableBody = document.getElementById('attendanceTableBody');
  const alertBox = document.getElementById('alertBox');

  // 1. Security Check: Retrieve authentication token and profile from localStorage
  const token = localStorage.getItem('token');
  const userJson = localStorage.getItem('user');

  // 2. Redirect to login page if unauthenticated
  if (!token || !userJson) {
    window.location.href = 'login.html';
    return;
  }

  // 3. Authorization Check: Redirect to standard dashboard if user is not an admin
  const user = JSON.parse(userJson);
  if (user.role !== 'admin') {
    window.location.href = 'dashboard.html';
    return;
  }

  // Helper utility to show dynamic status alerts
  const showAlert = (message, type) => {
    alertBox.textContent = message;
    alertBox.className = `alert-box ${type}`;
    alertBox.style.display = 'block';
  };

  // 4. Fetch and render all attendance records
  const fetchAttendance = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/attendance', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok && Array.isArray(data)) {
        attendanceTableBody.innerHTML = '';
        if (data.length === 0) {
          attendanceTableBody.innerHTML = `<tr><td colspan="3" style="text-align: center; color: var(--text-muted);">No check-in logs found.</td></tr>`;
          return;
        }

        data.forEach(record => {
          const recordUser = record.userId || { name: 'Unknown User', email: '' };
          const checkInDate = new Date(record.checkInTime);
          
          const formattedDate = checkInDate.toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });

          const formattedTime = checkInDate.toLocaleTimeString(undefined, {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          });

          const row = document.createElement('tr');
          row.innerHTML = `
            <td>${recordUser.name}</td>
            <td>${formattedDate}</td>
            <td>${formattedTime}</td>
          `;
          attendanceTableBody.appendChild(row);
        });
      } else {
        showAlert(data.error || 'Failed to load check-in logs.', 'error');
      }
    } catch (err) {
      console.error('Fetch Attendance Error:', err);
      showAlert('Server connection error. Failed to load check-in logs.', 'error');
    }
  };

  // Hook up Logout event trigger
  const handleLogout = () => {
    localStorage.clear();
    window.location.href = 'login.html';
  };

  const logoutSidebarLink = document.getElementById('logoutSidebarLink');
  if (logoutSidebarLink) {
    logoutSidebarLink.addEventListener('click', handleLogout);
  }

  // Load check-in records
  fetchAttendance();
});
