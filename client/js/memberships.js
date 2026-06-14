document.addEventListener('DOMContentLoaded', () => {
  const membershipsTableBody = document.getElementById('membershipsTableBody');
  const membershipUserSelect = document.getElementById('membershipUserSelect');
  const membershipForm = document.getElementById('membershipForm');
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
        membershipUserSelect.innerHTML = '<option value="" disabled selected>-- Select a Member --</option>';

        data.forEach(member => {
          // Populate Create Dropdown
          const option = document.createElement('option');
          option.value = member._id;
          option.textContent = `${member.name} (${member.email})`;
          membershipUserSelect.appendChild(option);
        });
      } else {
        showAlert(data.error || 'Failed to load members dropdown.', 'error');
      }
    } catch (err) {
      console.error('Fetch Members Dropdown Error:', err);
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

  // Hook up Logout event trigger
  const handleLogout = () => {
    localStorage.clear();
    window.location.href = 'login.html';
  };

  const logoutSidebarLink = document.getElementById('logoutSidebarLink');
  if (logoutSidebarLink) {
    logoutSidebarLink.addEventListener('click', handleLogout);
  }

  // Load datasets
  fetchMembers();
  fetchMemberships();
});
