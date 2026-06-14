document.addEventListener('DOMContentLoaded', () => {
  const membersTableBody = document.getElementById('membersTableBody');
  const attendanceTableBody = document.getElementById('attendanceTableBody');
  const membershipsTableBody = document.getElementById('membershipsTableBody');
  const membershipUserSelect = document.getElementById('membershipUserSelect');
  const membershipForm = document.getElementById('membershipForm');
  const alertBox = document.getElementById('alertBox');
  const logoutBtn = document.getElementById('logoutBtn');

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

  // 4. Fetch and render all members (and populate creation dropdown)
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
        membershipUserSelect.innerHTML = '<option value="" disabled selected>-- Select a Member --</option>';

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
              <button class="delete-btn detail-member-btn" data-id="${member._id}" data-name="${member.name}" data-email="${member.email}" data-role="${member.role}" style="background-color: var(--primary); margin-right: 0.5rem;">View Details</button>
              <button class="delete-btn delete-member-btn" data-id="${member._id}" data-email="${member.email}">Delete</button>
            </td>
          `;
          membersTableBody.appendChild(row);

          // Populate Create Dropdown
          const option = document.createElement('option');
          option.value = member._id;
          option.textContent = `${member.name} (${member.email})`;
          membershipUserSelect.appendChild(option);
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
        showAlert('Member and related membership/attendance logs cascade deleted successfully!', 'success');
        // Refresh all lists live
        await fetchMembers();
        await fetchMemberships();
        await fetchAttendance();
      } else {
        showAlert(data.error || 'Failed to delete member.', 'error');
      }
    } catch (err) {
      console.error('Delete Member Error:', err);
      showAlert('Server connection error. Failed to delete member.', 'error');
    }
  };

  // 5. Fetch and render all memberships records
  const fetchMemberships = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/memberships', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok && Array.isArray(data)) {
        membershipsTableBody.innerHTML = '';
        if (data.length === 0) {
          membershipsTableBody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted);">No memberships records found.</td></tr>`;
          return;
        }

        data.forEach(membership => {
          // Identify user name and email from populated object
          const recordUser = membership.userId || { name: 'Deleted User', email: 'N/A' };
          const userText = typeof recordUser === 'object' ? `${recordUser.name} (${recordUser.email})` : recordUser;

          const expiryDate = new Date(membership.expiryDate);
          const formattedExpiry = expiryDate.toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });

          const row = document.createElement('tr');
          row.innerHTML = `
            <td>${userText}</td>
            <td style="text-transform: capitalize;">${membership.plan}</td>
            <td style="text-transform: capitalize; font-weight: 600; color: ${membership.status === 'active' ? 'var(--success)' : 'var(--error)'}">${membership.status}</td>
            <td>${formattedExpiry}</td>
            <td>
              <button class="delete-btn" data-id="${membership._id}">Delete</button>
            </td>
          `;
          membershipsTableBody.appendChild(row);
        });

        // Attach event listeners to all delete buttons
        document.querySelectorAll('.delete-btn').forEach(btn => {
          btn.addEventListener('click', async (e) => {
            const id = e.target.getAttribute('data-id');
            if (confirm('Are you sure you want to delete this membership?')) {
              await deleteMembership(id);
            }
          });
        });
      } else {
        showAlert(data.error || 'Failed to load membership records.', 'error');
      }
    } catch (err) {
      console.error('Fetch Memberships Error:', err);
      showAlert('Server connection error. Failed to load membership records.', 'error');
    }
  };

  // 6. Delete Membership logic
  const deleteMembership = async (id) => {
    clearAlert();
    try {
      const response = await fetch(`http://localhost:5000/api/memberships/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        showAlert('Membership deleted successfully!', 'success');
        await fetchMemberships(); // Refresh list live
      } else {
        showAlert(data.error || 'Failed to delete membership.', 'error');
      }
    } catch (err) {
      console.error('Delete Membership Error:', err);
      showAlert('Server connection error. Failed to delete membership.', 'error');
    }
  };

  // 7. Create Membership logic on form submit
  membershipForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearAlert();

    const userId = membershipUserSelect.value;
    const plan = document.getElementById('membershipPlanSelect').value;
    const status = document.getElementById('membershipStatusSelect').value;

    try {
      const response = await fetch('http://localhost:5000/api/memberships', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userId, plan, status })
      });

      const data = await response.json();

      if (response.ok) {
        showAlert('Membership created successfully!', 'success');
        membershipForm.reset();
        await fetchMemberships(); // Refresh list live
      } else {
        showAlert(data.error || 'Failed to create membership.', 'error');
      }
    } catch (err) {
      console.error('Create Membership Error:', err);
      showAlert('Server connection error. Failed to create membership.', 'error');
    }
  });

  // 8. Fetch and render all attendance records
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
          statusSpan.style.color = membership.status === 'active' ? 'var(--success)' : 'var(--error)';

          const expiryDate = new Date(membership.expiryDate);
          detailExpiry.textContent = expiryDate.toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });

          detailMembershipInfo.style.display = 'block';
          detailMembershipNone.style.display = 'none';
        } else {
          detailMembershipInfo.style.display = 'none';
          detailMembershipNone.style.display = 'block';
        }
      } else {
        detailMembershipInfo.style.display = 'none';
        detailMembershipNone.style.display = 'block';
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
        detailAttendanceTableBody.innerHTML = '';

        if (data.length === 0) {
          detailAttendanceTableWrapper.style.display = 'none';
          detailAttendanceNone.style.display = 'block';
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
        detailAttendanceTableWrapper.style.display = 'none';
        detailAttendanceNone.style.display = 'block';
      }
    } catch (err) {
      console.error('Fetch Details Attendance Error:', err);
      detailAttendanceTableWrapper.style.display = 'none';
      detailAttendanceNone.style.display = 'block';
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

  // Run all data loading
  fetchMembers();
  fetchMemberships();
  fetchAttendance();

  // 9. Handle Sign Out triggers
  const handleLogout = () => {
    localStorage.clear();
    window.location.href = 'login.html';
  };

  if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
  const logoutNavbarLink = document.getElementById('logoutNavbarLink');
  if (logoutNavbarLink) logoutNavbarLink.addEventListener('click', handleLogout);
});
