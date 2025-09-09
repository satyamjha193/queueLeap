//✅ 1. OTP Email Flow (Step 1 & Step 2 toggle)
async function handleOtpRequest() {
  const email = document.querySelector('input[name="email"]').value;
  if (!email) return alert("Please enter your email.");

  try {
    const res = await fetch("/send-admin-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const data = await res.json();

    if (res.ok) {
      // ✅ Show Step 2
      document.getElementById("emailForm").style.display = "none";
      document.getElementById("step2-section").style.display = "block";
      document.getElementById("backToStep1Btn").style.display = "inline-block";
      document.querySelector(".step-indicator .step:nth-child(1)").classList.remove("active");
      document.querySelector(".step-indicator .step:nth-child(3)").classList.add("active");
    } else {
      alert(data.message || "Failed to send OTP");
    }
  } catch (err) {
    console.error(err);
    alert("Something went wrong.");
  }
}


// Handle OTP Verification
document.getElementById("emailOtpForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const enteredOtp = document.getElementById("emailOtp").value;
  const email = document.querySelector('input[name="email"]').value;

  const res = await fetch("/verify-admin-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, enteredOtp }),
  });

  const data = await res.json();
  if (res.ok) {
    alert(data.message);  // ✅ Automatically submit full registration form
    document.getElementById("emailForm").submit();
  } else {
    alert(data.message || "OTP verification failed");
  }
});

// Back to Step 1
document.addEventListener("DOMContentLoaded", () => {
  const backBtn = document.getElementById("backToStep1Btn");
  if (backBtn) {
    backBtn.addEventListener("click", function () {
      document.getElementById("emailForm").style.display = "block";
      document.getElementById("step2-section").style.display = "none";
      this.style.display = "none";
      document.querySelector(".step-indicator .step:nth-child(1)").classList.add("active");
      document.querySelector(".step-indicator .step:nth-child(3)").classList.remove("active");
    });
  }
});





//✅ 2. Map + Auto Location from Address
let map = L.map('map').setView([17.385044, 78.486671], 13); // Hyderabad default
let marker;

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors'
}).addTo(map);

map.on('click', function (e) {
  const { lat, lng } = e.latlng;
  if (marker) {
    marker.setLatLng(e.latlng);
  } else {
    marker = L.marker(e.latlng).addTo(map);
  }

  document.getElementById("lat").value = lat.toFixed(6);
  document.getElementById("lng").value = lng.toFixed(6);
  document.getElementById("locationMapUrl").value = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=18/${lat}/${lng}`;
});

document.addEventListener("DOMContentLoaded", () => {
  const addressInput = document.getElementById("shopaddress");
  const statusText = document.getElementById("address-status");

  if (!addressInput || !statusText) {
    console.warn("⚠️ Missing shopaddress or address-status element in DOM");
    return; // exit safely
  }

  let debounceTimer;
  addressInput.addEventListener("input", function () {
    const address = this.value.trim();
    clearTimeout(debounceTimer);

    if (address.length > 3) {
      statusText.textContent = "🔍 Searching...";
      debounceTimer = setTimeout(() => {
        fetch(`/api/geocode?q=${encodeURIComponent(address)}`)
          .then(res => res.json())
          .then(data => {
            if (data.length > 0) {
              const lat = parseFloat(data[0].lat);
              const lon = parseFloat(data[0].lon);
              map.setView([lat, lon], 15);

              if (!marker) {
                marker = L.marker([lat, lon]).addTo(map);
              } else {
                marker.setLatLng([lat, lon]);
              }

              document.getElementById("lat").value = lat.toFixed(6);
              document.getElementById("lng").value = lon.toFixed(6);
              document.getElementById("locationMapUrl").value =
                `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=18/${lat}/${lon}`;
              statusText.textContent = "✅ Location found!";
            } else {
              statusText.textContent = "❌ Address not found. Try refining it.";
              document.getElementById("locationMapUrl").value = "";
            }
          })
          .catch(() => {
            statusText.textContent = "⚠️ Error contacting location service.";
          });
      }, 600);
    } else {
      statusText.textContent = "";
      document.getElementById("locationMapUrl").value = "";
    }
  });
});



// ✅ 3. Stripe Plan Toggle Logic
const toggle = document.getElementById('planToggle');
const labels = document.querySelectorAll('.plan-label');

toggle.addEventListener('change', () => {
  labels.forEach(l => l.classList.remove('active'));
  if (toggle.checked) {
    document.querySelector('[data-plan="yearly"]').classList.add('active');
  } else {
    document.querySelector('[data-plan="monthly"]').classList.add('active');
  }
});


//✅ 4. Google Auth + Phone Tab Logic (if using)
function handleGoogleAuth() {
  window.location.href = "/auth/google";
}

function showTab(tab) {
  document.querySelectorAll('.tab-buttons button').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
  document.getElementById(tab).classList.add('active');
  event.target.classList.add('active');
}

function sendOTP(e) {
  e.preventDefault();
  const phone = document.getElementById("phoneNumber").value;
  if (phone.length < 10) return alert("Enter valid phone number.");

  console.log("Sending OTP to", phone);
  document.getElementById("phoneForm").style.display = "none";
  document.getElementById("otpForm").style.display = "block";
}

function submitOTP(e) {
  e.preventDefault();
  const otp = document.getElementById("otpCode").value;
  console.log("Verifying OTP:", otp);
  alert("Phone verified & registered!");
}





function validateRegistrationForm() {
  const requiredFields = [
    "name",              // Full name
    "sectorname",        // Sector / area name
    "shopname",          // Hospital / Shop name
    "shopaddress",       // Address input
    "email",             // Email
    "phone",             // Phone number
    "password",          // Account password
    "estimatedWaitTime", // Estimated wait time in minutes
    "lat",               // Latitude from map
    "lng",               // Longitude from map
    "locationMapUrl",    // Generated OpenStreetMap link
    "specialist",        // Specialist
  ];

  for (let field of requiredFields) {
    const input = document.querySelector(`[name="${field}"]`);
    if (!input || !input.value.trim()) {
      alert(`⚠️ Missing field: ${field}`);
      input?.focus();
      return false;
    }
  }

  // ✅ Image validation
  const imageInput = document.querySelector('[name="shopImage"]');
  if (!imageInput || imageInput.files.length === 0) {
    alert("⚠️ Please upload a shop image.");
    imageInput?.focus();
    return false;
  }

  // ✅ Phone number validation
  const phone = document.querySelector('[name="phone"]').value.trim();
  if (!/^\d{10}$/.test(phone)) {
    alert("⚠️ Enter a valid 10-digit phone number.");
    return false;
  }

  // ✅ Email validation
  const email = document.querySelector('[name="email"]').value.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    alert("⚠️ Enter a valid email address.");
    return false;
  }

  return true;
}

// Hook into OTP request

async function handleOtpRequest() {
  if (!validateRegistrationForm()) return; // ⛔ Stop if invalid

  const email = document.querySelector('input[name="email"]').value;

  // ✅ Select the button and disable it BEFORE sending OTP
  const otpBtn = document.querySelector('button[onclick="handleOtpRequest()"]');
  otpBtn.disabled = true;

  // ✅ Show loader
  const loader = document.getElementById("loadingSpinner");
  loader.style.display = "block";

  try {
    const res = await fetch("/send-admin-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const data = await res.json();

    // ✅ Hide loader and re-enable button
    loader.style.display = "none";
    otpBtn.disabled = false;

    if (res.ok) {
      // ✅ Show Step 2
      document.getElementById("emailForm").style.display = "none";
      document.getElementById("step2-section").style.display = "block";
      document.getElementById("backToStep1Btn").style.display = "inline-block";
      document.querySelector(".step-indicator .step:nth-child(1)").classList.remove("active");
      document.querySelector(".step-indicator .step:nth-child(3)").classList.add("active");
    } else {
      alert(data.message || "Failed to send OTP");
    }
  } catch (err) {
    console.error(err);
    loader.style.display = "none";  // ✅ Hide loader on error
    otpBtn.disabled = false;         // ✅ Re-enable button on error
    alert("Something went wrong.");
  }
}

