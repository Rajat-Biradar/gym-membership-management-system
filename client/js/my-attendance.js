document.addEventListener('DOMContentLoaded', () => {
  const myAttendanceTableWrapper = document.getElementById('myAttendanceTableWrapper');
  const myAttendanceTableBody = document.getElementById('myAttendanceTableBody');
  const myAttendanceNone = document.getElementById('myAttendanceNone');
  const myAttendanceCount = document.getElementById('myAttendanceCount');

  const alertBox = document.getElementById('alertBox');

  // 1. Security Check: Retrieve authentication token and profile from localStorage
  const token = localStorage.getItem('token');
  const userJson = localStorage.getItem('user');

  // 2. Redirect to login page if unauthenticated
  if (!token || !userJson) {
    window.location.href = 'login.html';
    return;
  }

  const user = JSON.parse(userJson);

  // Render admin navigation panel link if user has admin privileges
  const adminNavbarLink = document.getElementById('adminNavbarLink');
  if (user.role === 'admin' && adminNavbarLink) {
    adminNavbarLink.style.display = 'inline-block';
  }

  // 3. Fetch and Render Attendance Logs for Logged-In User
  const fetchMyAttendance = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/attendance', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok && Array.isArray(data)) {
        // Update count badge
        if (myAttendanceCount) myAttendanceCount.textContent = data.length;

        myAttendanceTableBody.innerHTML = '';

        if (data.length === 0) {
          if (myAttendanceTableWrapper) myAttendanceTableWrapper.style.display = 'none';
          if (myAttendanceNone) myAttendanceNone.style.display = 'flex';
          return;
        }

        // Sort: Newest First (descending order by check-in timestamp)
        data.sort((a, b) => new Date(b.checkInTime) - new Date(a.checkInTime));

        data.forEach(record => {
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
            <td>${formattedDate}</td>
            <td>${formattedTime}</td>
          `;
          myAttendanceTableBody.appendChild(row);
        });

        if (myAttendanceTableWrapper) myAttendanceTableWrapper.style.display = 'block';
        if (myAttendanceNone) myAttendanceNone.style.display = 'none';
      } else {
        if (myAttendanceCount) myAttendanceCount.textContent = 0;
        if (myAttendanceTableWrapper) myAttendanceTableWrapper.style.display = 'none';
        if (myAttendanceNone) myAttendanceNone.style.display = 'flex';
      }
    } catch (err) {
      console.error('Attendance Fetch Error:', err);
      if (myAttendanceCount) myAttendanceCount.textContent = 0;
      if (myAttendanceTableWrapper) myAttendanceTableWrapper.style.display = 'none';
      if (myAttendanceNone) myAttendanceNone.style.display = 'flex';
    }
  };

  fetchMyAttendance();

  // 4. Handle Sign Out triggers
  const handleLogout = () => {
    localStorage.clear();
    window.location.href = 'login.html';
  };

  const logoutSidebarLink = document.getElementById('logoutSidebarLink');
  if (logoutSidebarLink) {
    logoutSidebarLink.addEventListener('click', handleLogout);
  }
});
