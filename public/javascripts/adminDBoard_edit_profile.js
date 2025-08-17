// =======================
// 1. Toggle Profile Edit Form
// =======================
function toggleEdit(showForm) {
  document.querySelector(".profile-card").style.display = showForm ? "none" : "block";
  document.getElementById("profileEdit").style.display = showForm ? "block" : "none";
}

// =======================
// 2. DOMContentLoaded Initialization
// =======================
document.addEventListener("DOMContentLoaded", function () {
  const deleteBtn = document.getElementById("deleteAccountBtn");
  const cancelBtn = document.getElementById("cancelDelete");
  const modal = document.getElementById("deleteModal");
  const darkToggle = document.getElementById("darkModeToggle");
  const backBtn = document.getElementById("backToDashboardBtn");
  const body = document.body;

  // 🌙 Dark Mode Persistence
  if (localStorage.getItem("darkMode") === "enabled") {
    body.classList.add("dark-mode");
    if (darkToggle) darkToggle.checked = true;
  }

  if (darkToggle) {
    darkToggle.addEventListener("change", () => {
      body.classList.toggle("dark-mode");
      localStorage.setItem("darkMode", body.classList.contains("dark-mode") ? "enabled" : "disabled");
    });
  }

  // 🏠 Back to Dashboard
  if (backBtn) {
    backBtn.addEventListener("click", () => {
      window.location.href = "/admin-dashboard";
    });
  }

  // 🗑️ Show Delete Modal
  if (deleteBtn && modal) {
    deleteBtn.addEventListener("click", () => {
      modal.style.display = "block";
    });
  }

  // ❌ Hide Delete Modal
  if (cancelBtn && modal) {
    cancelBtn.addEventListener("click", () => {
      modal.style.display = "none";
    });
  }

  // 🔲 Close modal on outside click
  window.addEventListener("click", (event) => {
    if (event.target === modal) {
      modal.style.display = "none";
    }
  });

  // 🖼️ Show uploaded profile pic name
  const profileInput = document.getElementById('profilePic');
  if (profileInput) {
    profileInput.addEventListener('change', function () {
      const fileName = this.files[0] ? this.files[0].name : 'No file chosen';
      document.getElementById('fileName').textContent = fileName;
    });
  }

  // 📩 Notification Preference Listeners
  ['email', 'push', 'sms', 'report'].forEach(type => {
    const el = document.getElementById(`${type}Notif`);
    if (el) {
      el.onchange = e => saveNotificationPref(type, e.target.checked);
    }
  });
});

// =======================
// 3. AOS Animation Init (after script load)
// =======================
if (typeof AOS !== 'undefined') {
  AOS.init();
}

// =======================
// 4. Toggle Sidebar Drawer
// =======================
function toggleDrawer() {
  const sidebar = document.getElementById('sidebar');
  const container = document.getElementById('main-container');
  sidebar.classList.toggle('hide');
  container.classList.toggle('full');
}

// =======================
// 5. Submit Profile Edit Form (Btn click)
// =======================
document.getElementById("saveChangesBtn")?.addEventListener("click", function () {
  document.getElementById("adminEditForm")?.submit();
});

// =======================
// 6. Submit Profile Edit Form via Fetch
// =======================
const form = document.querySelector('.edit-form');
if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(form);

    try {
      const res = await fetch('/admin/updateProfile', {
        method: 'POST',
        body: formData
      });

      if (res.ok) {
        alert('Profile updated successfully!');
        location.reload();
      } else {
        alert('Failed to update profile');
      }
    } catch (error) {
      console.error(error);
      alert('Something went wrong');
    }
  });
}

// =======================
// 7. Change Password Modal
// =======================
function openChangePasswordModal() {
  document.getElementById("changePasswordBox").style.display = "flex";
}

function closeChangePasswordModal() {
  document.getElementById("changePasswordBox").style.display = "none";
}

// Close when clicked outside the modal
window.onclick = function (event) {
  const box = document.getElementById("changePasswordBox");
  if (event.target === box) {
    box.style.display = "none";
  }
};

// =======================
// 8. Submit Password Change
// =======================
document.querySelector('#changePasswordBox form')?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const currentPassword = document.getElementById('currentPassword').value;
  const newPassword = document.getElementById('newPassword').value;
  const confirmPassword = document.getElementById('confirmPassword').value;

  if (newPassword !== confirmPassword) {
    alert("New passwords do not match.");
    return;
  }

  try {
    const response = await fetch('/admin/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword, newPassword })
    });

    const data = await response.json();
    if (response.ok) {
      alert(data.message);
      closeChangePasswordModal();
    } else {
      alert(data.error);
    }
  } catch (err) {
    console.error(err);
    alert("Something went wrong!");
  }
});

// =======================
// 9. Toggle 2FA
// =======================
function toggle2FA(enabled) {
  fetch('/admin/toggle-2fa', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ enabled })
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        alert("2FA updated");
        location.reload();
      } else {
        alert("Could not update 2‑Factor Authentication");
      }
    })
    .catch(err => {
      console.error(err);
      alert("Server error while updating 2FA");
    });
}

// =======================
// 10. Socket.IO Notification Preference Sync
// =======================
const socket = io(); // Ensure socket.io client script is loaded

function emitNotificationPref(type, value) {
  socket.emit("updateNotificationPref", { type, value });
  saveNotificationPref(type, value); // Optional fallback
}

function saveNotificationPref(type, value) {
  fetch('/admin/notification-preferences', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, value })
  })
    .then(res => res.json())
    .then(data => {
      if (!data.success) alert("Failed to update");
    })
    .catch(() => alert("Server error"));
}

// Receive updated prefs from server
socket.on("prefUpdated", ({ type, value }) => {
  const checkbox = document.getElementById(`${type}Notif`);
  if (checkbox) checkbox.checked = value;
});
