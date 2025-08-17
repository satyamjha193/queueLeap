const adminForm = document.getElementById('admin-form');
    const adminEmailLogin = document.getElementById('admin-email-login');
    const adminPhoneLogin = document.getElementById('admin-phone-login');
    const backBtnContainer = document.getElementById('back-btn-container');
    const adminConfirmGroup = document.getElementById('admin-confirm-group');
    const adminToggleMsg = document.getElementById('admin-toggle-msg');
    const formTitle = document.getElementById('form-title');

    let isAdminLogin = true;
    let isAdminPhoneLogin = false;

    function toggleAdminForm() {
      if (isAdminPhoneLogin) return;
      isAdminLogin = !isAdminLogin;
      formTitle.innerText = isAdminLogin ? 'Admin Login' : 'Admin Register';
      adminConfirmGroup.style.display = isAdminLogin ? 'none' : 'block';
      adminToggleMsg.innerHTML = isAdminLogin
        ? `New admin? <span onclick="toggleAdminForm()">Register</span>`
        : `Already registered? <span onclick="toggleAdminForm()">Login</span>`;
    }

    function loginWithAdminPhone() {
      isAdminPhoneLogin = true;
      formTitle.innerText = 'Admin Phone Login';
      adminEmailLogin.style.display = 'none';
      adminPhoneLogin.style.display = 'block';
      backBtnContainer.style.display = 'block';
      adminToggleMsg.style.display = 'none';
    }

    function switchToAdminEmail() {
      isAdminPhoneLogin = false;
      formTitle.innerText = isAdminLogin ? 'Admin Login' : 'Admin Register';
      adminEmailLogin.style.display = 'block';
      adminPhoneLogin.style.display = 'none';
      backBtnContainer.style.display = 'none';
      adminToggleMsg.style.display = 'block';
    }

    function loginWithGoogle() {
      alert('Redirecting to Google auth for admin...');
      // TODO: Implement OAuth logic
    }

    adminForm.addEventListener('submit', (e) => {
      e.preventDefault();

      if (isAdminPhoneLogin) {
        const phone = document.getElementById('admin-phone').value;
        if (!phone || phone.length < 10) {
          alert("Please enter a valid phone number.");
          return;
        }
        alert(`OTP sent to ${phone}`);
        // TODO: Handle OTP verification
      } else {
        const email = document.getElementById('admin-email').value;
        const password = document.getElementById('admin-password').value;
        const confirm = document.getElementById('admin-confirm').value;
        const shop = document.getElementById('admin-shop').value;

        if (!shop) {
          alert("Please select your shop/sector.");
          return;
        }

        if (!isAdminLogin && password !== confirm) {
          alert("Passwords do not match.");
          return;
        }

        alert(isAdminLogin
          ? `Logging in as admin of ${shop}...`
          : `Registering admin for ${shop}...`);
        // TODO: Handle real login/register
      }
    });