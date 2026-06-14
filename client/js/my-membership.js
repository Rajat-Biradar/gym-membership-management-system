document.addEventListener('DOMContentLoaded', () => {
  const membershipDetailsBlock = document.getElementById('membershipDetailsBlock');
  const membershipNoneBlock = document.getElementById('membershipNoneBlock');
  
  const membershipPlan = document.getElementById('membershipPlan');
  const membershipStatus = document.getElementById('membershipStatus');
  const membershipStart = document.getElementById('membershipStart');
  const membershipExpiry = document.getElementById('membershipExpiry');
  const membershipDaysRemaining = document.getElementById('membershipDaysRemaining');
  const expiryWarningMessage = document.getElementById('expiryWarningMessage');

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

  // 3. Fetch and Render Membership Details
  const fetchMembershipDetails = async () => {
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

        // Format dates
        const startDate = new Date(activeMembership.startDate);
        const expiryDate = new Date(activeMembership.expiryDate);

        if (membershipPlan) membershipPlan.textContent = activeMembership.plan;
        
        if (membershipStatus) {
          membershipStatus.textContent = activeMembership.status;
          membershipStatus.className = `status-badge ${activeMembership.status === 'active' ? 'status-badge-active' : 'status-badge-inactive'}`;
        }

        if (membershipStart) {
          membershipStart.textContent = startDate.toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });
        }

        if (membershipExpiry) {
          membershipExpiry.textContent = expiryDate.toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });
        }

        // Calculate Days Remaining
        const today = new Date();
        // Reset times to midnight for date-only integer comparison
        const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const expiryMidnight = new Date(expiryDate.getFullYear(), expiryDate.getMonth(), expiryDate.getDate());

        const diffTime = expiryMidnight - todayMidnight;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        let daysToDisplay = diffDays;
        let warningText = '';

        if (activeMembership.status === 'inactive') {
          warningText = 'Your membership plan is currently set to inactive.';
          daysToDisplay = Math.max(0, diffDays);
        } else if (diffDays < 0) {
          daysToDisplay = 0;
          warningText = 'Your subscription plan has expired. Please contact the administrator to renew.';
          if (membershipDaysRemaining) membershipDaysRemaining.style.color = 'var(--error)';
        } else if (diffDays === 0) {
          daysToDisplay = 0;
          warningText = 'Your subscription expires today!';
          if (membershipDaysRemaining) membershipDaysRemaining.style.color = 'var(--error)';
        } else if (diffDays <= 7) {
          warningText = 'Expiring soon! Please renew your subscription plan shortly.';
          if (membershipDaysRemaining) membershipDaysRemaining.style.color = '#d97706'; // warning orange
        } else {
          warningText = 'Your plan is active and in good standing.';
          if (membershipDaysRemaining) membershipDaysRemaining.style.color = 'var(--success)';
        }

        if (membershipDaysRemaining) membershipDaysRemaining.textContent = daysToDisplay;
        if (expiryWarningMessage) expiryWarningMessage.textContent = warningText;

        if (membershipDetailsBlock) membershipDetailsBlock.style.display = 'block';
        if (membershipNoneBlock) membershipNoneBlock.style.display = 'none';

        // Fetch current renewal request status
        await fetchRenewalRequestStatus(activeMembership._id);
      } else {
        if (membershipDetailsBlock) membershipDetailsBlock.style.display = 'none';
        if (membershipNoneBlock) membershipNoneBlock.style.display = 'flex';
      }
    } catch (err) {
      console.error('Membership Details Fetch Error:', err);
      if (membershipDetailsBlock) membershipDetailsBlock.style.display = 'none';
      if (membershipNoneBlock) membershipNoneBlock.style.display = 'flex';
    }
  };

  // Helper utility to show dynamic status alerts
  const showAlert = (message, type) => {
    if (alertBox) {
      alertBox.textContent = message;
      alertBox.className = `alert-box ${type}`;
      alertBox.style.display = 'block';
    }
  };

  // Fetch and Display Renewal Request Status
  const fetchRenewalRequestStatus = async (membershipId) => {
    const renewalRequestForm = document.getElementById('renewalRequestForm');
    const renewalStatusContainer = document.getElementById('renewalStatusContainer');
    const renewalStatusBadge = document.getElementById('renewalStatusBadge');
    const renewRequestBtn = document.getElementById('renewRequestBtn');
    const renewalPlanSelect = document.getElementById('renewalPlanSelect');

    try {
      const response = await fetch('http://localhost:5000/api/renewals', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok && Array.isArray(data)) {
        // Find if there is a pending request
        const pendingRequest = data.find(r => r.status === 'pending');
        
        if (pendingRequest) {
          // Hide form, show pending badge
          if (renewalRequestForm) renewalRequestForm.style.display = 'none';
          if (renewalStatusContainer) renewalStatusContainer.style.display = 'flex';
          if (renewalStatusBadge) {
            renewalStatusBadge.textContent = 'Pending';
            renewalStatusBadge.className = 'status-badge status-badge-pending';
          }
        } else {
          // No pending request, show form
          if (renewalRequestForm) renewalRequestForm.style.display = 'flex';
          
          // Check if there is a rejected or approved request to display
          const latestReviewed = data[0]; // sorted by requestedAt DESC
          if (latestReviewed) {
            if (renewalStatusContainer) renewalStatusContainer.style.display = 'flex';
            if (renewalStatusBadge) {
              renewalStatusBadge.textContent = latestReviewed.status;
              renewalStatusBadge.className = `status-badge ${latestReviewed.status === 'approved' ? 'status-badge-approved' : 'status-badge-rejected'}`;
            }
          } else {
            if (renewalStatusContainer) renewalStatusContainer.style.display = 'none';
          }
          
          // Setup submission trigger
          if (renewRequestBtn) {
            // Remove any existing click listeners to prevent duplicates
            const newBtn = renewRequestBtn.cloneNode(true);
            renewRequestBtn.replaceWith(newBtn);
            
            newBtn.addEventListener('click', async () => {
              const requestedPlan = renewalPlanSelect.value;
              
              // Reset alert
              if (alertBox) {
                alertBox.style.display = 'none';
                alertBox.textContent = '';
              }
              
              try {
                const res = await fetch('http://localhost:5000/api/renewals', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                  },
                  body: JSON.stringify({ membershipId, requestedPlan })
                });
                
                const resData = await res.json();
                
                if (res.ok) {
                  showAlert('Renewal request submitted successfully!', 'success');
                  await fetchRenewalRequestStatus(membershipId); // refresh status
                } else {
                  showAlert(resData.error || 'Failed to submit renewal request.', 'error');
                }
              } catch (err) {
                console.error('Submit Renewal Error:', err);
                showAlert('Connection error. Failed to submit renewal request.', 'error');
              }
            });
          }
        }
      }
    } catch (err) {
      console.error('Fetch Renewal Request Status Error:', err);
    }
  };

  fetchMembershipDetails();

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
