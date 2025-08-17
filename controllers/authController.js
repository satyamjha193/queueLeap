const User = require("../models/user_schema");
const bcrypt = require("bcrypt");
const twilio = require("twilio");

const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);
const serviceSid = process.env.TWILIO_SERVICE_SID;
const SALT_ROUNDS = 10;

// ✅ Register with Email + Password (with bcrypt hashing)
exports.registerWithEmail = async (req, res) => {
  const { email, password } = req.body;

  try {
    const existing = await User.findOne({ email });
    if (existing) {
      req.session.flashMessage = {
        type: "error",
        text: "Email already exists. Try logging in.",
      };
      return res.redirect("/");
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const user = new User({
      email,
      password: hashedPassword,
      authType: "email",
    });

    await user.save();

    req.session.user = {
      id: user._id,
      email: user.email,
    };

    req.session.flashMessage = {
      type: "success",
      text: `Welcome, ${user.name || "User"}!`,
    };

    res.redirect("/");
  } catch (err) {
    console.error("❌ Email registration error:", err);
    req.session.flashMessage = {
      type: "error",
      text: "Something went wrong. Please try again later.",
    };
    res.redirect("/");
  }
};

// ✅ Send OTP using Twilio
exports.sendOtp = async (req, res) => {
  const { phone } = req.body;

  try {
    await client.verify.v2
      .services(serviceSid)
      .verifications.create({ to: phone, channel: "sms" });

    res.status(200).json({ success: true, message: "OTP sent successfully" });
  } catch (err) {
    console.error("❌ OTP send error:", err.message);
    res.status(500).json({ success: false, message: "Failed to send OTP. Try again." });
  }
};

// ✅ Verify OTP and Register with Phone
exports.verifyOtpAndRegister = async (req, res) => {
  const { phone, otp } = req.body;

  try {
    const verification = await client.verify.v2
      .services(serviceSid)
      .verificationChecks.create({ to: phone, code: otp });

    if (verification.status === "approved") {
      let user = await User.findOne({ phone });

      if (!user) {
        user = new User({
          phone,
          authType: "phone",
        });
        await user.save();
      }

      req.session.user = {
        id: user._id,
        phone: user.phone,
      };

      req.session.flashMessage = {
        type: "success",
        text: `Welcome, ${user.name || "User"}!`,
      };

      return res.status(200).json({ success: true, message: "OTP verified" });
    } else {
      return res.status(401).json({ success: false, message: "Invalid OTP" });
    }
  } catch (err) {
    console.error("❌ OTP verify error:", err.message);
    return res.status(500).json({ success: false, message: "OTP verification failed" });
  }
};

// ✅ Google OAuth Redirect Callback (after login)
exports.googleOAuthCallback = (req, res) => {
  if (!req.user) {
    req.session.flashMessage = {
      type: "error",
      text: "Google login failed.",
    };
    return res.redirect("/");
  }

  req.session.user = {
    id: req.user._id,
    name: req.user.name,
    email: req.user.email,
  };

  req.session.flashMessage = {
    type: "success",
    text: `Welcome, ${req.user.name || "User"}!`,
  };

  res.redirect("/");
};

// ✅ Google Passport Strategy Logic
exports.googleAuthRegistration = async (accessToken, refreshToken, profile, done) => {
  try {
    const existingUser = await User.findOne({ googleId: profile.id });

    if (existingUser) return done(null, existingUser);

    const newUser = new User({
      name: profile.displayName,
      googleId: profile.id,
      profilePic: profile.photos?.[0]?.value || null,
      email: profile.emails?.[0]?.value || null,
      authType: "google",
    });

    await newUser.save();
    return done(null, newUser);
  } catch (err) {
    console.error("❌ Google OAuth Error:", err);
    return done(err, null);
  }
};
