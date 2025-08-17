const sendOtpBtn = document.getElementById("sendOtpBtn");
const verifyOtpBtn = document.getElementById("verifyOtpBtn");
const phoneInput = document.getElementById("phoneInput");
const otpInput = document.getElementById("otpInput");
const phonePart = document.getElementById("phonePart");
const otpPart = document.getElementById("otpPart");

let resendTimer = null;

function formatPhone(phone) {
  phone = phone.trim();
  return phone.startsWith("+91") ? phone : "+91" + phone;
}

// 🔁 Resend Timer
function startResendTimer() {
  let timeLeft = 30;
  sendOtpBtn.disabled = true;
  sendOtpBtn.textContent = `Wait ${timeLeft}s`;

  resendTimer = setInterval(() => {
    timeLeft--;
    sendOtpBtn.textContent = `Wait ${timeLeft}s`;
    if (timeLeft <= 0) {
      clearInterval(resendTimer);
      sendOtpBtn.disabled = false;
      sendOtpBtn.textContent = "Resend OTP";
    }
  }, 1000);
}

sendOtpBtn.addEventListener("click", async () => {
  let phone = formatPhone(phoneInput.value);

  if (!/^\+91\d{10}$/.test(phone)) {
    return alert("Enter valid 10-digit phone number");
  }

  try {
    const res = await fetch("/register/phone/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    });

    const data = await res.json();
    console.log("OTP Send Response:", data); // ✅ Debugging log

    if (res.ok && data.success) {
      alert("✅ " + (data.message || "OTP sent!")); // ✅ Show backend message
      phonePart.style.display = "none";
      otpPart.style.display = "block";
      startResendTimer();
    } else {
      alert("❌ " + (data.message || "Failed to send OTP")); // ✅ Show error if available
    }
  } catch (err) {
    console.error("Send OTP error:", err);
    // alert("❌ Error sending OTP");
  }
});


verifyOtpBtn.addEventListener("click", async () => {
  let phone = formatPhone(phoneInput.value);
  let otp = otpInput.value.trim();

  if (!otp || otp.length !== 6) {
    return alert("Enter 6-digit OTP");
  }

  try {
    const res = await fetch("/register/phone/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, otp }),
    });

    const data = await res.json();

    if (res.ok && data.success) {
      alert("✅ OTP verified successfully!");
      window.location.href = "/"; // or anywhere else
    } else {
      alert(data.message || "❌ OTP verification failed");
    }
  } catch (err) {
    console.error("OTP verification error:", err);
    alert("❌ OTP verification failed");
  }
});
