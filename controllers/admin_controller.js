const multer = require('multer');
const path = require('path');
const bcrypt = require("bcrypt");
const Admin = require("../models/admin_schema");
const Hospital = require("../models/hospital_schema");
const Queue = require("../models/queue_schema");
const Token = require("../models/token_schema");
const { createOrGetDefaultLocation } = require("../controllers/queueController");
const nodemailer = require("nodemailer");
const Salon = require('../models/salon_schema'); // ✅ new





exports.registerAdmin = async (req, res) => {
  try {
    // 🛡️ OTP verification check
    if (!req.session.otpVerified) {
      return res.status(403).send("OTP verification required before registration.");
    }

    // Reset OTP session
    req.session.otpVerified = false;
    req.session.adminOtp = null;
    req.session.adminEmail = null;

    // 🧾 Extract and sanitize inputs
    let {
      name,
      sectorname,
      shopname,
      shopaddress,
      email,
      phone,
      password,
      locationMapUrl,
      estimatedWaitTime,
      specialist,
      lat,
      lng,
      other_sectorname,
    } = req.body;

    const shopImage = req.file?.filename;

    // Replace 'others' with custom value
    const finalSectorName = sectorname === "others" ? other_sectorname : sectorname;

    // ✅ Validation
    if (!name || !finalSectorName || !shopname || !email || !password || !shopaddress || !phone || !shopImage || !estimatedWaitTime) {
      return res.status(400).send("All fields are required including image.");
    }

    // 🔎 Check for duplicate email and duplicate phone
    const existingPhone = await Admin.findOne({ phone });
    if (existingPhone) {
      return res.status(409).send("⚠️ Phone number is already registered.");
    }

    // 🔎 Check for duplicate email
    const existingEmail = await Admin.findOne({ email });
    if (existingEmail) {
      return res.status(409).send("⚠️ Email is already registered.");
    }


    // 🔐 Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 📝 Create Admin
    const newAdmin = new Admin({
      name,
      sectorname: finalSectorName,
      sector: finalSectorName,
      shopname,
      phone,
      shopImage: `/uploads/shopImages/${shopImage}`,
      specialist,
      email,
      shopaddress,
      password: hashedPassword,
      estimatedWaitTimeRange: estimatedWaitTime,
      estimatedWaitTime,
      isVerified: true,
    });

    const savedAdmin = await newAdmin.save();

    // 🏥 Handle sector-specific model creation
    const medicalSectors = ["hospital", "clinic", "others"];
    if (medicalSectors.includes(sectorname)) {
      const hospital = new Hospital({
        adminId: savedAdmin._id,
        name,
        sectorname: finalSectorName,
        shopname,
        shopaddress,
        phone,
        shopImage: `/uploads/shopImages/${shopImage}`,
        specialist: specialist || "General Physician",
        locationMapUrl: String(locationMapUrl),
        lat,
        lng,
        queueStatus: "Light",
        tokens: [],
        estimatedWaitTime,
        isOpen: false,
      });
      await hospital.save();
    } else if (sectorname === "salon") {
      const salon = new Salon({
        adminId: savedAdmin._id,
        name,
        sectorname: "salon",
        shopname,
        shopaddress,
        phone,
        shopImage: `/uploads/shopImages/${shopImage}`,
        specialist: specialist || "Haircut, Spa",
        locationMapUrl: String(locationMapUrl),
        lat,
        lng,
        tokens: [],
        estimatedWaitTime,
        isOpen: false,
      });
      await salon.save();
    }

    // 🔐 Store session
    req.session.admin = {
      name: savedAdmin.name,
      email: savedAdmin.email,
      sectorname: savedAdmin.sectorname,
      _id: savedAdmin._id,
    };

    // 📊 Prepare dashboard data
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [tokens, servedTokens, tokensServed] = await Promise.all([
      Token.find({
        adminId: savedAdmin._id,
        status: "waiting",
        createdAt: { $gte: todayStart },
      }).sort({ serialNumber: 1 }),
      Token.find({
        adminId: savedAdmin._id,
        status: "served",
        createdAt: { $gte: todayStart },
      }).sort({ servedAt: -1 }),
      Token.countDocuments({
        adminId: savedAdmin._id,
        status: "served",
        createdAt: { $gte: todayStart },
      }),
    ]);

    const currentWaitingToken = tokens[0] || null;
    const currentToken = currentWaitingToken?.serialNumber || 0;
    const currentWaitingTokenId = currentWaitingToken?._id || null;

    const chartBookedData = [];
    const chartServedData = [];
    const labels = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);

      const start = new Date(date.setHours(0, 0, 0, 0));
      const end = new Date(date.setHours(23, 59, 59, 999));

      const [bookedCount, servedCount] = await Promise.all([
        Token.countDocuments({
          adminId: savedAdmin._id,
          createdAt: { $gte: start, $lte: end },
        }),
        Token.countDocuments({
          adminId: savedAdmin._id,
          status: "served",
          createdAt: { $gte: start, $lte: end },
        }),
      ]);

      chartBookedData.push(bookedCount);
      chartServedData.push(servedCount);
      labels.push(start.toLocaleDateString("en-IN", { weekday: "short" }));
    }

   
    // 📧 Send welcome email
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"QueueLeap" <${process.env.EMAIL_USER}>`,
      to: savedAdmin.email,
      subject: "🎉 Welcome to QueueLeap!",
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <img src="https://i.postimg.cc/XqB8HwLS/queuesys-banner.png" alt="Welcome Banner" style="width: 100%; max-width: 600px; border-radius: 10px;" />
          <h2>Welcome, ${savedAdmin.name}!</h2>
          <p>Your admin account has been successfully registered for <strong>${savedAdmin.shopname}</strong> in the <strong>${savedAdmin.sectorname}</strong> sector.</p>
          <p>🚀 Start managing your queue live from your dashboard with powerful real-time controls.</p>
          <p>🎁 <strong>Enjoy your 1-month free trial</strong> and explore all the premium features available.</p>
          <p>This is just the beginning — your journey with the <strong>QueueLeap App</strong> starts now!</p>
          <p>
            <a href="http://localhost:3000/admin-dashboard" style="background: #2563eb; padding: 10px 20px; color: white; border-radius: 5px; text-decoration: none;">Go to Dashboard</a>
          </p>
          <p>If you need help logging in, <a href="http://localhost:3000/login">click here</a>.</p>
          <p>Thanks for joining <strong>QueueLeap</strong> 🙌</p>
        </div>
      `,
    };

    transporter.sendMail(mailOptions)
      .then(() => console.log("✅ Welcome email sent"))
      .catch(err => console.error("❌ Email error:", err));

    // 🚦 Determine isOpen state
    const isOpen = medicalSectors.includes(sectorname);


    
    const getSectorIcon = (sector) => {
      switch (sector.toLowerCase()) {
        case 'hospital':
          return 'fas fa-hospital-symbol';
        case 'salon':
          return 'fas fa-cut';
        case 'clinic':
          return 'fas fa-stethoscope';
        case 'bank':
          return 'fas fa-university';
        case 'pharmacy':
          return 'fas fa-pills';
        case 'others':
          return 'fas fa-briefcase-medical';
        default:
          return 'fas fa-store'; // default generic icon
      }
    };

    let shop;
    if (medicalSectors.includes(sectorname)) {
      shop = await Hospital.findOne({ adminId: savedAdmin._id });
    } else if (sectorname === "salon") {
      shop = await Salon.findOne({ adminId: savedAdmin._id });
    }

    // registerAdmin
req.session.adminData = {
  tokens,
  servedTokens,
  stats: {
    usersInQueue: tokens.length,
    tokensServed,
    currentToken,
  },
  labels,
  chartBookedData,
  chartServedData,
  currentWaitingTokenId,
  shop,
  isOpen,
};
return res.redirect("/admin-dashboard");


  } catch (err) {
    console.error("❌ Admin Registration Error:", err);
    return res.status(500).send("Something went wrong during registration.");
  }
};



exports.sendAdminOtpEmail = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required." });
  }

  // ✅ Generate OTP on backend
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // ✅ Save to session
  req.session.adminOtp = otp;
  req.session.adminEmail = email;
  req.session.adminOtpExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes

  const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,          // ✅ use 587 for TLS (STARTTLS)
  secure: false,      // ✅ false for port 587
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    minVersion: "TLSv1.2",  // force TLS 1.2+
  },
});


  const mailOptions = {
  from: `"QueueLeap" <${process.env.EMAIL_USER}>`,
  to: email,
  subject: "QueueLeap OTP Verification",
  html: `
    <h2>This is your Admin Registration OTP</h2>
    <p><strong>Your OTP is:</strong> <code style="font-size: 20px;">${otp}</code></p>
    <p>This OTP expires in 10 minutes.</p>
  `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("✅ OTP sent to", email);
    return res.status(200).json({ message: "OTP sent successfully" });
  } catch (err) {
    console.error("❌ Failed to send OTP:", err);
    return res.status(500).json({ message: "Failed to send OTP" });
  }
};


exports.verifyAdminOtp = (req, res) => {
  const { email, enteredOtp } = req.body;

  const savedOtp = req.session.adminOtp;
  const savedEmail = req.session.adminEmail;
  const adminOtpExpiry = req.session.adminOtpExpiry;

  if (!savedOtp || !savedEmail || !adminOtpExpiry) {
    return res.status(400).json({ message: "No OTP session found. Please request OTP again." });
  }

  if (savedEmail !== email) {
    return res.status(400).json({ message: "Email does not match the one OTP was sent to." });
  }

  // Check expiry
  if (Date.now() > adminOtpExpiry) {
    req.session.adminOtp = null;
    req.session.adminEmail = null;
    req.session.adminOtpExpiry = null;
    req.session.otpAttempts = 0;
    return res.status(410).json({ message: "OTP expired. Please request a new one." });
  }

  // Initialize attempt counter
  if (!req.session.otpAttempts) req.session.otpAttempts = 0;

  // Check OTP
  if (enteredOtp !== savedOtp) {
    req.session.otpAttempts += 1;

    if (req.session.otpAttempts >= 5) {
      // Block further attempts
      req.session.adminOtp = null;
      req.session.adminEmail = null;
      req.session.adminOtpExpiry = null;
      req.session.otpAttempts = 0;

      return res.status(403).json({ message: "Too many failed attempts. Please request a new OTP." });
    }

    return res.status(401).json({
      message: `Invalid OTP. Attempt ${req.session.otpAttempts}/5`,
    });
  }

  // ✅ Valid OTP — reset session
  req.session.adminOtp = null;
  req.session.adminEmail = null;
  req.session.adminOtpExpiry = null;
  req.session.otpAttempts = 0;
  req.session.otpVerified = true;

  return res.status(200).json({ message: "OTP verified successfully ✅" });
};








//Admin Login and render that particular Admin to their dashboard.
exports.adminLogin = async (req, res) => {
  const { email, password } = req.body;
  const Admin = require("../models/admin_schema");
  const bcrypt = require("bcrypt");

  try {
    // Check if user exists
    const admin = await Admin.findOne({ email });
    if (!admin) {
       req.flash("error", "Invalid email or password");
        return res.redirect("/login");
    }

    // Compare password
    const match = await bcrypt.compare(password, admin.password);
    if (!match) {
       req.flash("error", "Invalid email or password");
        return res.redirect("/login");
    }

    
    // ✅ Store in req.session.admin for consistency
    req.session.admin = {
      name: admin.name,
      email: admin.email,
      sectorname: admin.sectorname,
      _id: admin._id
    };

      // Save session first, then redirect
    req.session.save(() => {
      // AFTER successful login:
      res.redirect("/admin-dashboard");

    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).send("Internal server error");
  }
};




// get phone number login for admin  .
const twilio = require('twilio');
const session = require('express-session');
const client = new twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// In-memory OTP storage
const otpStore = new Map();

/**
 * Send OTP to Admin's phone
 */
exports.sendOtpToPhone = async (req, res) => {
  let { phone } = req.body;

  // Ensure only digits and prefix with +91
  phone = phone.trim();
  if (!/^[6-9]\d{9}$/.test(phone)) {
    return res.status(400).send('Invalid phone number format');
  }

  const formattedPhone = `+91${phone}`;
  console.log(`📲 OTP request received for phone: ${formattedPhone}`);

  try {
    const admin = await Admin.findOne({ phone });

    if (!admin) {
      console.log(`❌ No admin found with phone: ${phone}`);
      return res.status(404).send('Admin with this phone not found.');
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    console.log(`✅ Generated OTP: ${otp} for phone: ${formattedPhone}`);

    // Store OTP temporarily for 5 minutes
    otpStore.set(phone, otp);
    setTimeout(() => {
      otpStore.delete(phone);
      console.log(`⏱️ OTP for phone ${phone} expired.`);
    }, 5 * 60 * 1000);

    await client.messages.create({
      body: `Your admin login OTP is ${otp}`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: formattedPhone,
    });

    console.log(`📤 OTP sent to ${formattedPhone} successfully.`);
    res.send('OTP sent successfully!');
  } catch (error) {
    console.error(`❌ Error sending OTP:`, error.message);
    res.status(500).send('Failed to send OTP');
  }
};

/**
 * Verify OTP and create admin session
 */
exports.verifyOtpAndLogin = async (req, res) => {
  let { phone, otp } = req.body;

  phone = phone.trim();
  console.log(`🔐 Verifying OTP for phone: ${phone} with OTP: ${otp}`);

  const savedOtp = otpStore.get(phone);

  if (!savedOtp || savedOtp !== otp) {
    console.log(`❌ Invalid or expired OTP for phone: ${phone}`);
    return res.status(401).send('Invalid or expired OTP');
  }

  try {
    const admin = await Admin.findOne({ phone });

    if (!admin) {
      console.log(`❌ Admin not found for phone: ${phone}`);
      return res.status(404).send('Admin not found.');
    }

    // Save session
    req.session.admin = {
      id: admin._id,
      name: admin.name,
      email: admin.email,
      shopname: admin.shopname,
      sectorname: admin.sectorname,
    };

    console.log(`✅ OTP verified and admin session created for phone: ${phone}`);
    otpStore.delete(phone); // Clean up OTP
    res.redirect('/admin-dashboard');
  } catch (error) {
    console.error(`❌ Error during OTP verification:`, error.message);
    res.status(500).send('Internal Server Error');
  }
};




// ====== Admin Logout ======
exports.logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Logout error:", err);
      return res.status(500).send("Logout failed");
    }
    res.clearCookie("connect.sid");
    res.redirect("/");
  });
};




// // ====== Google OAuth Callback ======
exports.googleAuthCallback = (req, res) => {
  // Save minimal info to session after successful Google Auth
  req.session.admin = {
    id: req.user._id,
    name: req.user.name,
    email: req.user.email,
  };
  res.redirect("/admin-dashboard");
};



const AdminDeletionLog = require("../models/adminDeletionSchema");

// Delete admin account along with the data (hospitals)
exports.deleteAdminAccount = async (req, res) => {
  try {
    const adminId = req.session.admin?._id;
    if (!adminId) return res.status(403).send("Not authorized");

    const { reason } = req.body;

    const admin = await Admin.findById(adminId);
    if (!admin) return res.status(404).send("Admin not found");

    console.log("🗑️ Account deletion reason:", reason);

    // ✅ Log deletion before actual removal
    await AdminDeletionLog.create({
      adminId: admin._id,
      name: admin.name,
      email: admin.email,
      shopname: admin.shopname,
      sectorname: admin.sectorname,
      reason: reason
    });

    await Admin.findByIdAndDelete(adminId);
    await Hospital.deleteMany({ adminId });

    // ✅ Send Goodbye Email
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

   
    // ✅ Send Goodbye Email
const feedbackLink = `http://localhost:3000/feedback?email=${admin.email}`;
const rejoinLink = "http://localhost:3000/register";

const mailOptions = {
  from: `"QueueLeap" <${process.env.EMAIL_USER}>`,
  to: admin.email,
  subject: "👋 Your QueueLeap account has been deleted",
  html: `
    <div style="font-family: Arial, sans-serif; line-height: 1.6;">
      <h2>Goodbye, ${admin.name}</h2>
      <p>Your admin account associated with <strong>${admin.shopname}</strong> in the <strong>${admin.sectorname}</strong> sector has been successfully deleted.</p>
      <p>We’re sad to see you go, but we truly value your feedback.</p>

      <p>📋 <strong>Why did you leave?</strong> Let us know here: 
        <a href="${feedbackLink}" target="_blank" style="color: #2563eb;">Submit Feedback</a>
      </p>

      <p>💡 Changed your mind? You can rejoin QueueLeap anytime:</p>
      <p><a href="${rejoinLink}" style="background: #10b981; padding: 10px 20px; color: white; border-radius: 6px; text-decoration: none;">Re-register Now</a></p>

      <p>Thanks again for trying <strong>QueueLeap</strong>. We hope to serve you again in the future. 🚀</p>
      <p style="font-style: italic;">– The Queueleap Team</p>
    </div>
  `
};


    transporter.sendMail(mailOptions)
      .then(() => console.log("✅ Goodbye email sent"))
      .catch((err) => console.error("❌ Failed to send goodbye email:", err));

    // ✅ End session
    req.session.destroy((err) => {
      if (err) return res.status(500).send("Something went wrong clearing session");
      res.clearCookie("connect.sid");
      return res.redirect("/");
    });

  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).send("Error deleting account");
  }
};



// GET: Show Feedback Form (Public)
exports.getFeedbackForm = (req, res) => {
  const role = req.session.admin
    ? "admin"
    : req.session.user
    ? "user"
    : "guest";

  const email =
    req.session.admin?.email ||
    req.session.user?.email ||
    req.query.email ||
    "";

  res.render("feedback_form", { email, role ,siteKey: process.env.RECAPTCHA_SITE_KEY, });
};





//feedback controller .
const axios = require("axios");
const Feedback = require("../models/feedback_schema");

// GET: Render Feedback Page
exports.getFeedbackForm = (req, res) => {
  res.render("index", {
    role: req.user?.role || "guest",
    email: req.user?.email || "",
    siteKey: process.env.RECAPTCHA_SITE_KEY,
  });
};

// POST: Submit Feedback Form
exports.submitFeedback = async (req, res) => {
  const {
    name,
    email,
    reason,
    role,
    rating,
    recaptchaToken,
  } = req.body;

  // Check for missing captcha token
  if (!recaptchaToken) {
    return res.status(400).send("Captcha token missing.");
  }

  try {
    // Verify reCAPTCHA
    const verifyUrl = `https://www.google.com/recaptcha/api/siteverify`;
    const response = await axios.post(verifyUrl, null, {
      params: {
        secret: process.env.RECAPTCHA_SECRET_KEY,
        response: recaptchaToken,
      },
    });

    const { success, score } = response.data;

    if (!success || score < 0.5) {
      return res.status(400).send("Captcha failed. Are you a robot?");
    }

    // Save feedback to DB
    const feedback = new Feedback({
      name,
      email,
      reason,
      role,
      rating,
    });

    await feedback.save();

    // Set success message
    req.session.goodbyeMessage = "✅ Feedback received!";
    res.redirect("/");

  } catch (err) {
    console.error("Captcha verification failed:", err);
    res.status(500).send("Internal server error.");
  }
};





// 🔐 Admin: View All Feedbacks
exports.viewAllFeedbacks = async (req, res) => {
  try {
    const feedbacks = await Feedback.find().sort({ submittedAt: -1 });
    res.render("view_feedbacks", { feedbacks });
  } catch (err) {
    console.error("❌ Feedback viewer error:", err);
    res.status(500).send("Error loading feedbacks.");
  }
};




// ✅ Update profile page admin details and sector details
const fs = require('fs');
exports.updateProfile = async (req, res) => {
  try {
    const adminId = req.session.admin._id;
    const admin = await Admin.findById(adminId);

    if (!admin) return res.status(404).send("Admin not found");

    const { name, hospital } = req.body; // Only accept editable fields

    // Only update allowed fields
    admin.name = name || admin.name;
    admin.shopname = hospital || admin.shopname;

    // Handle profile picture upload
    if (req.file) {
      const oldPath = path.join(__dirname, "../uploads/adminDP", admin.profilePic || "");
      if (admin.profilePic && fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      admin.profilePic = req.file.filename;
    }

    await admin.save({ validateBeforeSave: false });
    req.flash('success', 'Profile updated successfully!');
    res.redirect('/admin_dashboard/profile_settings?success=true');

  } catch (err) {
    console.error("❌ Error updating admin profile:", err);
    res.status(500).send("Internal Server Error");
  }
};






// controllers/admin_controller.js
const dayjs = require("dayjs");
const LoginLog = require("../models/loginLog");   // <- simple “who‑logged‑in‑when” collection (schema)

exports.getProfileSettingsPage = async (req, res) => {
  try {
    const adminId = req.session.admin._id;

    // ① admin profile
    const admin = await Admin.findById(adminId).lean();

    // ② most-recent login info (fallback to account-creation if none)
    const lastLogin = await LoginLog
      .findOne({ adminId })
      .sort({ createdAt: -1 })
      .lean();

    // ③ Format IP and login time
    const formatIP = (ip) => {
      if (!ip) return 'Unknown';
      if (ip === '::1') return '127.0.0.1';
      if (ip.startsWith('::ffff:')) return ip.replace('::ffff:', '');
      return ip;
    };

    const security = {
      twoFAEnabled: admin.twoFAEnabled || false,
      lastLoginIP: formatIP(lastLogin ? lastLogin.ip : req.ip),
      lastLoginStr: dayjs(lastLogin ? lastLogin.createdAt : admin.createdAt)
        .format("MMM D, YYYY h:mm A"),
    };

    // ④ Notification preferences (optional)
    const notifPrefs = admin.notificationPreferences || {};

    // ⑤ Render
    res.render("adminDBoard_edit_profile", {
      admin,
      security,
      notifPrefs
    });

  } catch (err) {
    console.error("❌ Error loading profile settings:", err);
    res.status(500).send("Internal Server Error");
  }
};




//change password
exports.changePassword = async (req, res) => {
  try {
    const adminId = req.session.admin?._id;
    const { currentPassword, newPassword } = req.body;

    if (!adminId) return res.status(401).json({ error: 'Unauthorized' });

    const admin = await Admin.findById(adminId);
    if (!admin) return res.status(404).json({ error: 'Admin not found' });

    const isMatch = await bcrypt.compare(currentPassword, admin.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    admin.password = hashedPassword;
   
    await admin.save({ validateBeforeSave: false });


    res.status(200).json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error('Password update error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};



// 🛡️ Toggle Two-Factor Authentication
exports.toggleTwoFA = async (req, res) => {
  try {
    const adminId = req.session.admin?._id;
    if (!adminId) return res.status(401).json({ success: false });

    const { enabled } = req.body;
    await Admin.findByIdAndUpdate(adminId, {
      $set: { twoFAEnabled: enabled }
    });

    return res.json({ success: true });

    
  } catch (err) {
    console.error("2FA toggle error:", err);
    res.status(500).json({ success: false });
  }
};




// 🔔 Update Notification Preferences
exports.updateNotificationPreferences = async (req, res) => {
  const adminId = req.session.admin?._id;
  const { type, value } = req.body;

  if (!['email', 'push', 'sms', 'report'].includes(type)) {
    return res.status(400).json({ success: false, message: 'Invalid notification type' });
  }

  try {
    await Admin.findByIdAndUpdate(adminId, {
      $set: { [`notificationPreferences.${type}`]: value }
    });

    res.json({ success: true });
  } catch (err) {
    console.error('Notification preference update error:', err);
    res.status(500).json({ success: false });
  }
};







//emit the queue members on queue update.
exports.emitQueueUpdate = async (io, adminId) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0); // midnight

    const tokens = await Token.find({
      adminId,
      status: 'waiting',
      createdAt: { $gte: todayStart }
    }).sort({ serialNumber: 1 });

    io.to(adminId.toString()).emit("queueUpdate", tokens);
  } catch (err) {
    console.error("emitQueueUpdate error:", err);
  }
};





//Get the expired tokens (when not served by the admin)
const ExpiredToken = require('../models/expired_token');
const moment = require('moment');
// Controller to show expired tokens
exports.getExpiredTokens = async (req, res) => {
  try {
    const adminSession = req.session.admin;
    if (!adminSession || !adminSession._id) {
      return res.redirect('/login');
    }

    const adminId = adminSession._id;
    const query = { adminId, status: 'waiting', expiredAt: { $exists: true } };

    // ⬇️ Insert the filter logic here
    const { day, month, year } = req.query;

    if (day && month && year) {
      const start = new Date(year, month - 1, day, 0, 0, 0);
      const end = new Date(year, month - 1, day, 23, 59, 59);
      query.expiredAt = { $gte: start, $lte: end };
    }

    const expiredTokens = await ExpiredToken.find(query).sort({ expiredAt: -1 });

    res.render('admin_expired_tokens', {
      expiredTokens,
      query: req.qyeuery, // 🔄 send selected filter values to EJS
      moment,
    });
  } catch (err) {
    console.error('Error fetching expired tokens:', err);
    res.status(500).send('Server Error');
  }
};




// ✅ Complete getAdminDashboard controller (Rewritten)
exports.getAdminDashboard = async (req, res) => {
  try {
    // 🔐 Session Check
    const adminSession = req.session.admin;
    if (!adminSession || !adminSession._id) {
      return res.redirect("/admin-login");
    }

    const adminId = adminSession._id;
     

    // ✅ Fetch admin details
    const admin = await Admin.findById(adminId);
    if (!admin) return res.status(404).send("Admin not found");



    const rawSector = admin.sectorname.toLowerCase();
    const sector = rawSector.includes("salon") ? "salon" : "hospital"; // support broader labels

    // ✅ Determine sector and fetch shop
    // const sector = admin.sectorname; // 'hospital', 'salon', etc.
    let shop = null;

    switch (sector) {
      case "salon":
        shop = await Salon.findOne({ adminId });
        break;
      case "hospital":
        shop = await Hospital.findOne({ adminId });
        break;
      // 🔧 Add more sectors if needed
    }

    // ✅ Fetch associated queue
    const queue = await Queue.findOne({ adminId });

    // ✅ Get today's date range
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // ✅ Fetch tokens for today
    const [tokens, servedTokens] = await Promise.all([
      Token.find({
        adminId,
        status: "waiting",
        createdAt: { $gte: todayStart },
      }).sort({ serialNumber: 1 }),

      Token.find({
        adminId,
        status: "served",
        createdAt: { $gte: todayStart },
      }).sort({ servedAt: -1 }),
    ]);

    // ✅ Token stats
    const currentWaitingToken = tokens[0] || null;
    const currentToken = currentWaitingToken?.serialNumber || 0;
    const currentWaitingTokenId = currentWaitingToken?._id || null;
    const tokenWaitingCount = tokens.length;
    const tokensServed = servedTokens.length;

    // ✅ Weekly Chart Stats
    const chartBookedData = [];
    const chartServedData = [];
    const labels = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const start = new Date(date.setHours(0, 0, 0, 0));
      const end = new Date(date.setHours(23, 59, 59, 999));

      const [bookedCount, servedCount] = await Promise.all([
        Token.countDocuments({
          adminId,
          createdAt: { $gte: start, $lte: end },
        }),
        Token.countDocuments({
          adminId,
          status: "served",
          createdAt: { $gte: start, $lte: end },
        }),
      ]);

      chartBookedData.push(bookedCount);
      chartServedData.push(servedCount);
      labels.push(start.toLocaleDateString("en-IN", { weekday: "short" }));
    }
     req.app.get("io").emit("queueChartStatusUpdate", {
        adminId: adminId.toString(),
        tokensServed,
        peopleInQueue: tokenWaitingCount,
      });



    // ✅ Sector icon helper
    const getSectorIcon = (sector) => {
      switch (sector.toLowerCase()) {
        case "hospital":
          return "fas fa-hospital-symbol";
        case "salon":
          return "fas fa-cut";
        case "clinic":
          return "fas fa-stethoscope";
        case "bank":
          return "fas fa-university";
        case "pharmacy":
          return "fas fa-pills";
        case "others":
          return "fas fa-briefcase-medical";
        default:
          return "fas fa-store";
      }
    };




    // ✅ Render dashboard view
    res.render("admin_dashboard", {
      admin,
      shop,
      sector,
      isOpen: shop?.isOpen || false,
      queue,
      tokens,
      servedTokens,
      stats: {
        usersInQueue: tokenWaitingCount,
        tokensServed,
        currentToken,
      },
      labels,
      chartBookedData,
      chartServedData,
      currentWaitingTokenId,
      getSectorIcon,
    });


// const adminData = req.session.adminData || {};
// delete req.session.adminData; // optional, clear after reading

// res.render("admin_dashboard", {
//   admin,
//   shop: adminData.shop,
//   isOpen: adminData.isOpen,
//   queue: null,
//   tokens: adminData.tokens || [],
//   servedTokens: adminData.servedTokens || [],
//   stats: adminData.stats || {},
//   labels: adminData.labels || [],
//   chartBookedData: adminData.chartBookedData || [],
//   chartServedData: adminData.chartServedData || [],
//   currentWaitingTokenId: adminData.currentWaitingTokenId,
//   getSectorIcon,
// });






  } catch (err) {
    console.error("Dashboard Load Error:", err);
    res.status(500).send("Something went wrong while loading the dashboard");
  }
};





// Toggle shop open/closed statusconst
exports.toggleShopStatus = async (req, res) => {
  const { shopId, isOpen, sectorname } = req.body;
  console.log("🟡 Toggle Request Body:", req.body);

  if (!shopId || typeof isOpen === 'undefined' || !sectorname) {
    return res.status(400).json({
      success: false,
      message: "Missing shopId, isOpen, or sector",
    });
  }

  try {
    let updatedShop;

    if (sectorname === "hospital") {
      updatedShop = await Hospital.findByIdAndUpdate(
        shopId,
        { isOpen },
        { new: true }
      );
    } else if (sectorname === "salon") {
      updatedShop = await Salon.findByIdAndUpdate(
        shopId,
        { isOpen },
        { new: true }
      );
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid sector. Must be 'hospital' or 'salon'",
      });
    }

    if (!updatedShop) {
      return res.status(404).json({
        success: false,
        message: "Shop not found",
      });
    }

    console.log("🧪 Updated Shop:", updatedShop);
    req.app.get("io").emit("shopStatusUpdate", { shopId, isOpen });
    res.json({ success: true, shopId, isOpen });
  } catch (error) {
    console.error("🔴 Toggle error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating shop status",
    });
  }
};




exports.cleanupExpiredTokens = async () => {
  try {
    const twentyFourHoursAgo = moment().subtract(24, 'hours').toDate();

    // Find tokens older than 24h and still waiting
    const expiredTokens = await Token.find({
      createdAt: { $lte: twentyFourHoursAgo },
      status: 'waiting'
    });

    if (expiredTokens.length === 0) {
      console.log('✅ No expired tokens found.');
      return;
    }

    // Move them to ExpiredToken collection
    const transformed = expiredTokens.map(token => {
      return {
        fullName: token.fullName,
        phoneNumber: token.phoneNumber,
        serialNumber: token.serialNumber,
        status: token.status,
        adminId: token.adminId,
        createdAt: token.createdAt,
        expiredAt: new Date()
      };
    });

    await ExpiredToken.insertMany(transformed);

    // Delete from Token collection
    const ids = expiredTokens.map(t => t._id);
    await Token.deleteMany({ _id: { $in: ids } });

    console.log(`🗑️ Moved ${transformed.length} expired tokens.`);
  } catch (error) {
    console.error('❌ Error cleaning expired tokens:', error);
  }
};


exports.getAnalyticsReport = (req,res) =>{
res.render('analyticsReport');
}
exports.manageStaff = (req,res) =>{
res.render('manage_staff');
}
