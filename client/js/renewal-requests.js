document.addEventListener('DOMContentLoaded', () => {
  const renewalsTableBody = document.getElementById('renewalsTableBody');
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
    if (alertBox) {
      alertBox.textContent = message;
      alertBox.className = `alert-box ${type}`;
      alertBox.style.display = 'block';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const clearAlert = () => {
    if (alertBox) {
      alertBox.style.display = 'none';
      alertBox.textContent = '';
    }
  };

  // 4. Fetch and render all renewal requests
  const fetchRenewalRequests = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/renewals', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok && Array.isArray(data)) {
        renewalsTableBody.innerHTML = '';

        if (data.length === 0) {
          renewalsTableBody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted);">No renewal requests found.</td></tr>`;
          return;
        }

        data.forEach(req => {
          const memberName = req.userId ? req.userId.name : 'Deleted User';
          const currentPlan = req.membershipId ? req.membershipId.plan : 'N/A';
          const requestedPlan = req.requestedPlan;
          
          let expiryText = 'N/A';
          if (req.membershipId && req.membershipId.expiryDate) {
            const expiryDate = new Date(req.membershipId.expiryDate);
            expiryText = expiryDate.toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            });
          }

          const requestDate = new Date(req.requestedAt);
          const formattedRequestDate = requestDate.toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });

          // Action column buttons or text
          let actionsHtml = `<span style="color: var(--text-muted); font-size: 0.85rem;">Reviewed</span>`;
          if (req.status === 'pending') {
            actionsHtml = `
              <div class="actions-flex">
                <button class="btn-action btn-action-view approve-btn" data-id="${req._id}">Approve</button>
                <button class="btn-action btn-action-delete reject-btn" data-id="${req._id}">Reject</button>
              </div>
            `;
          }

          // Build status badge
          let badgeClass = 'status-badge-pending';
          if (req.status === 'approved') badgeClass = 'status-badge-approved';
          if (req.status === 'rejected') badgeClass = 'status-badge-rejected';

          const row = document.createElement('tr');
          row.innerHTML = `
            <td><strong>${memberName}</strong></td>
            <td style="text-transform: capitalize;">${currentPlan}</td>
            <td style="text-transform: capitalize; font-weight: 700; color: var(--primary);">${requestedPlan}</td>
            <td>${expiryText}</td>
            <td>${formattedRequestDate}</td>
            <td>
              <span class="status-badge ${badgeClass}" style="text-transform: capitalize;">${req.status}</span>
            </td>
            <td>${actionsHtml}</td>
          `;
          renewalsTableBody.appendChild(row);
        });

        // Event listener for Approve
        document.querySelectorAll('.approve-btn').forEach(btn => {
          btn.addEventListener('click', async (e) => {
            const id = e.target.getAttribute('data-id');
            if (confirm('Are you sure you want to APPROVE this membership renewal request?\nThis will extend their membership plan.')) {
              await reviewRequest(id, 'approved');
            }
          });
        });

        // Event listener for Reject
        document.querySelectorAll('.reject-btn').forEach(btn => {
          btn.addEventListener('click', async (e) => {
            const id = e.target.getAttribute('data-id');
            if (confirm('Are you sure you want to REJECT this membership renewal request?')) {
              await reviewRequest(id, 'rejected');
            }
          });
        });
      } else {
        showAlert(data.error || 'Failed to load renewal requests.', 'error');
      }
    } catch (err) {
      console.error('Fetch Renewal Requests Error:', err);
      showAlert('Server connection error. Failed to load renewal requests.', 'error');
    }
  };

  // 5. Submit Review request
  const reviewRequest = async (id, status) => {
    clearAlert();
    try {
      const response = await fetch(`http://localhost:5000/api/renewals/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });

      const data = await response.json();

      if (response.ok) {
        showAlert(`Renewal request was successfully ${status}!`, 'success');
        await fetchRenewalRequests(); // Refresh table live
      } else {
        showAlert(data.error || 'Failed to review renewal request.', 'error');
      }
    } catch (err) {
      console.error('Review Request Error:', err);
      showAlert('Server connection error. Failed to review renewal request.', 'error');
    }
  };

  fetchRenewalRequests();

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
