document.addEventListener('DOMContentLoaded', () => {
  const profileName = document.getElementById('profileName');
  const profileEmail = document.getElementById('profileEmail');
  const profileRole = document.getElementById('profileRole');
  const profileAttendanceCount = document.getElementById('profileAttendanceCount');
  
  const profileMembershipInfo = document.getElementById('profileMembershipInfo');
  const profileMembershipNone = document.getElementById('profileMembershipNone');
  const profilePlan = document.getElementById('profilePlan');
  const profileStatus = document.getElementById('profileStatus');

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

  // 3. Populate Profile Info
  if (profileName) profileName.textContent = user.name;
  if (profileEmail) profileEmail.textContent = user.email;
  if (profileRole) profileRole.textContent = user.role;

  // Render admin navigation panel link if user has admin privileges
  const adminNavbarLink = document.getElementById('adminNavbarLink');
  if (user.role === 'admin' && adminNavbarLink) {
    adminNavbarLink.style.display = 'inline-block';
  }

  // Helper utility to show dynamic status alerts
  const showAlert = (message, type) => {
    if (alertBox) {
      alertBox.textContent = message;
      alertBox.className = `alert-box ${type}`;
      alertBox.style.display = 'block';
    }
  };

  // 4. Fetch and Display Membership Summary
  const fetchMembership = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/memberships', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok && Array.isArray(data) && data.length > 0) {
        const activeMembership = data.find(m => m.status === 'active') || data[0];

        if (profilePlan) profilePlan.textContent = activeMembership.plan;
        
        if (profileStatus) {
          profileStatus.textContent = activeMembership.status;
          profileStatus.className = `status-badge ${activeMembership.status === 'active' ? 'status-badge-active' : 'status-badge-inactive'}`;
        }

        if (profileMembershipInfo) profileMembershipInfo.style.display = 'flex';
        if (profileMembershipNone) profileMembershipNone.style.display = 'none';
      } else {
        if (profileMembershipInfo) profileMembershipInfo.style.display = 'none';
        if (profileMembershipNone) profileMembershipNone.style.display = 'flex';
      }
    } catch (err) {
      console.error('Membership Fetch Error:', err);
      if (profileMembershipInfo) profileMembershipInfo.style.display = 'none';
      if (profileMembershipNone) profileMembershipNone.style.display = 'flex';
    }
  };

  // 5. Fetch and Display Attendance Summary Count
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
        if (profileAttendanceCount) {
          profileAttendanceCount.textContent = data.length;
        }
      } else {
        if (profileAttendanceCount) {
          profileAttendanceCount.textContent = 0;
        }
      }
    } catch (err) {
      console.error('Attendance Fetch Error:', err);
      if (profileAttendanceCount) {
        profileAttendanceCount.textContent = 0;
      }
    }
  };

  // Execute loading requests
  if (user.role === 'admin') {
    const membershipSummaryCard = document.getElementById('membershipSummaryCard');
    const attendanceSummaryCard = document.getElementById('attendanceSummaryCard');
    const accountInfoCard = document.getElementById('accountInfoCard');

    if (membershipSummaryCard) membershipSummaryCard.style.display = 'none';
    if (attendanceSummaryCard) attendanceSummaryCard.style.display = 'none';
    if (accountInfoCard) accountInfoCard.classList.add('admin-profile-full');
  } else {
    fetchMembership();
    fetchAttendance();
  }

  // 6. Handle Sign Out triggers
  const handleLogout = () => {
    localStorage.clear();
    window.location.href = 'login.html';
  };

  const logoutSidebarLink = document.getElementById('logoutSidebarLink');
  if (logoutSidebarLink) {
    logoutSidebarLink.addEventListener('click', handleLogout);
  }
});
