document.addEventListener('DOMContentLoaded', () => {
  const membersTableBody = document.getElementById('membersTableBody');
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
    
    // Auto scroll to top to see alerts
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearAlert = () => {
    alertBox.style.display = 'none';
    alertBox.textContent = '';
  };

  // 4. Fetch and render all members
  const fetchMembers = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/members', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok && Array.isArray(data)) {
        membersTableBody.innerHTML = '';

        if (data.length === 0) {
          membersTableBody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--text-muted);">No members registered yet.</td></tr>`;
          return;
        }

        data.forEach(member => {
          // Append to Table
          const row = document.createElement('tr');
          row.innerHTML = `
            <td>${member.name}</td>
            <td>${member.email}</td>
            <td style="text-transform: capitalize;">${member.role}</td>
            <td>
              <div class="actions-flex">
                <button class="btn-action btn-action-view detail-member-btn" data-id="${member._id}" data-name="${member.name}" data-email="${member.email}" data-role="${member.role}">View Details</button>
                <button class="btn-action btn-action-delete delete-member-btn" data-id="${member._id}" data-email="${member.email}">Delete</button>
              </div>
            </td>
          `;
          membersTableBody.appendChild(row);
        });

        // Attach event listeners to all detail member buttons
        document.querySelectorAll('.detail-member-btn').forEach(btn => {
          btn.addEventListener('click', async (e) => {
            const id = e.target.getAttribute('data-id');
            const name = e.target.getAttribute('data-name');
            const email = e.target.getAttribute('data-email');
            const role = e.target.getAttribute('data-role');
            await showMemberDetails({ _id: id, name, email, role });
          });
        });

        // Attach event listeners to all delete member buttons
        document.querySelectorAll('.delete-member-btn').forEach(btn => {
          btn.addEventListener('click', async (e) => {
            const id = e.target.getAttribute('data-id');
            const email = e.target.getAttribute('data-email');
            
            // Self-delete protection check
            if (user.id === id || user.email === email) {
              showAlert('Admins cannot delete their own account', 'error');
              return;
            }

            if (confirm(`Are you sure you want to delete member ${email}?\nThis will also cascade-delete their related memberships and attendance logs.`)) {
              await deleteMember(id);
            }
          });
        });
      } else {
        showAlert(data.error || 'Failed to load members.', 'error');
      }
    } catch (err) {
      console.error('Fetch Members Error:', err);
      showAlert('Server connection error. Failed to load members.', 'error');
    }
  };

  // Delete Member logic
  const deleteMember = async (id) => {
    clearAlert();
    try {
      const response = await fetch(`http://localhost:5000/api/members/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        showAlert('Member and related records cascade deleted successfully!', 'success');
        // Close details if they were open
        document.getElementById('memberDetailsSection').style.display = 'none';
        // Refresh list live
        await fetchMembers();
      } else {
        showAlert(data.error || 'Failed to delete member.', 'error');
      }
    } catch (err) {
      console.error('Delete Member Error:', err);
      showAlert('Server connection error. Failed to delete member.', 'error');
    }
  };

  // Member detailed profiling and loading logic
  const showMemberDetails = async (member) => {
    const memberDetailsSection = document.getElementById('memberDetailsSection');
    const detailName = document.getElementById('detailName');
    const detailEmail = document.getElementById('detailEmail');
    const detailRole = document.getElementById('detailRole');
    
    const detailMembershipInfo = document.getElementById('detailMembershipInfo');
    const detailMembershipNone = document.getElementById('detailMembershipNone');
    const detailPlan = document.getElementById('detailPlan');
    const detailStatus = document.getElementById('detailStatus');
    const detailExpiry = document.getElementById('detailExpiry');

    const detailAttendanceTableWrapper = document.getElementById('detailAttendanceTableWrapper');
    const detailAttendanceTableBody = document.getElementById('detailAttendanceTableBody');
    const detailAttendanceNone = document.getElementById('detailAttendanceNone');
    const detailAttendanceCount = document.getElementById('detailAttendanceCount');

    // 1. Set general user profile
    detailName.textContent = member.name;
    detailEmail.textContent = member.email;
    detailRole.textContent = member.role;

    // 2. Fetch all memberships and find the record matching the member
    try {
      const response = await fetch('http://localhost:5000/api/memberships', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok && Array.isArray(data)) {
        const membership = data.find(m => m.userId && (m.userId._id === member._id || m.userId === member._id));

        if (membership) {
          detailPlan.textContent = membership.plan;
          detailStatus.textContent = membership.status;
          
          const statusSpan = document.getElementById('detailStatus');
          statusSpan.className = `status-badge ${membership.status === 'active' ? 'status-badge-active' : 'status-badge-inactive'}`;

          const expiryDate = new Date(membership.expiryDate);
          detailExpiry.textContent = expiryDate.toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });

          detailMembershipInfo.style.display = 'flex';
          detailMembershipNone.style.display = 'none';
        } else {
          detailMembershipInfo.style.display = 'none';
          detailMembershipNone.style.display = 'flex';
        }
      } else {
        detailMembershipInfo.style.display = 'none';
        detailMembershipNone.style.display = 'flex';
      }
    } catch (err) {
      console.error('Fetch Details Membership Error:', err);
      detailMembershipInfo.style.display = 'none';
      detailMembershipNone.style.display = 'block';
    }

    // 3. Fetch check-in logs history for user
    try {
      const response = await fetch(`http://localhost:5000/api/attendance/${member._id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok && Array.isArray(data)) {
        if (detailAttendanceCount) {
          detailAttendanceCount.textContent = data.length;
        }
        detailAttendanceTableBody.innerHTML = '';

        if (data.length === 0) {
          detailAttendanceTableWrapper.style.display = 'none';
          detailAttendanceNone.style.display = 'flex';
        } else {
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
            detailAttendanceTableBody.appendChild(row);
          });

          detailAttendanceTableWrapper.style.display = 'block';
          detailAttendanceNone.style.display = 'none';
        }
      } else {
        if (detailAttendanceCount) {
          detailAttendanceCount.textContent = 0;
        }
        detailAttendanceTableWrapper.style.display = 'none';
        detailAttendanceNone.style.display = 'flex';
      }
    } catch (err) {
      console.error('Fetch Details Attendance Error:', err);
      if (detailAttendanceCount) {
        detailAttendanceCount.textContent = 0;
      }
      detailAttendanceTableWrapper.style.display = 'none';
      detailAttendanceNone.style.display = 'flex';
    }

    // Toggle card block display and scroll smoothly to view
    memberDetailsSection.style.display = 'block';
    memberDetailsSection.scrollIntoView({ behavior: 'smooth' });
  };

  // Close member details card trigger
  const closeDetailsBtn = document.getElementById('closeDetailsBtn');
  if (closeDetailsBtn) {
    closeDetailsBtn.addEventListener('click', () => {
      document.getElementById('memberDetailsSection').style.display = 'none';
    });
  }

  // Hook up Logout event trigger
  const handleLogout = () => {
    localStorage.clear();
    window.location.href = 'login.html';
  };

  const logoutSidebarLink = document.getElementById('logoutSidebarLink');
  if (logoutSidebarLink) {
    logoutSidebarLink.addEventListener('click', handleLogout);
  }

  // Load members data
  fetchMembers();
});
