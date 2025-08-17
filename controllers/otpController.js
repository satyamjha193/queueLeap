const twilio = require("twilio");

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

exports.sendOtp = async (req, res) => {
  let { phone } = req.body;
  if (!phone.startsWith("+91")) {
    phone = "+91" + phone;
  }

  try {
    await client.verify.v2
      .services(process.env.TWILIO_SERVICE_SID)
      .verifications.create({
        to: phone,
        channel: "sms",
      });

    console.log("✅ OTP sent to", phone);
    res.status(200).json({ success: true, message: "OTP sent successfully" });  // ✅ Add message here
  } catch (err) {
    console.error("❌ Error sending OTP:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};







exports.verifyOtp = async (req, res) => {
  let { phone, otp } = req.body;
  if (!phone.startsWith("+91")) {
    phone = "+91" + phone;
  }

  try {
    const verification = await client.verify.v2
      .services(process.env.TWILIO_SERVICE_SID)
      .verificationChecks.create({
        to: phone,
        code: otp,
      });

    if (verification.status === "approved") {
      console.log("✅ OTP verified for", phone);
      res.status(200).json({ success: true });
    } else {
      res.status(400).json({ success: false, message: "Invalid OTP" });
    }
  } catch (err) {
    console.error("❌ OTP verification error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};
