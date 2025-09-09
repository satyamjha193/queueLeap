const express = require("express");
const router = express.Router();
const passport = require("passport");
const adminController = require("../controllers/admin_controller");
const upload = require("../middleware/multer");

const {
  isAdminLoggedIn,
  noCache,
  isAdmin,
} = require("../middleware/authMiddleware");


// ====== Admin Login Routes (GET) ======
const renderLoginPage = (req, res) => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
  res.set("Pragma", "no-cache");
  res.set("Expires", "0");
  res.render("admin_login");
};

router.get("/login", renderLoginPage);
router.get("/admin-login", renderLoginPage);

// ====== Admin Login Handler (POST) ======
router.post("/admin/dashboard", adminController.adminLogin);

// ====== Admin Dashboard (Protected) ======
router.get("/admin-dashboard", noCache, isAdminLoggedIn, adminController.getAdminDashboard);

// ====== Admin Profile Settings (Protected) ======
router.get("/admin_dashboard/profile_settings", noCache, isAdminLoggedIn, adminController.getProfileSettingsPage);

// ====== Admin Registration with service page sector (hospitals , salons etc )Image ======
router.post("/register/dashboard", upload.single("shopImage"), adminController.registerAdmin);


// OTP verfication for admin registration
//console.log("✅ typeof sendAdminOtpEmail:", typeof adminController.sendAdminOtpEmail);
router.post("/send-admin-otp", adminController.sendAdminOtpEmail);
router.post("/verify-admin-otp", adminController.verifyAdminOtp);


// 🔐 Logout Route
router.get('/admin/logout', adminController.logout);

// 🔑 Google OAuth Callback
router.get(
  '/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login', session: false }),
  adminController.googleAuthCallback
);



// ====== Google OAuth ======
router.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));


// ====== Delete Admin Account ======
router.post("/admin/delete-account", isAdminLoggedIn, adminController.deleteAdminAccount);



// Add this in your auth or session route file (to send amdin directly admin dashboard if they are logged in)
router.get("/api/check-admin-session", (req, res) => {
  const isLoggedIn = !!req.session.admin;
  res.json({ loggedIn: isLoggedIn });
});





// 🟢 Public Feedback Routes
router.get("/feedback", adminController.getFeedbackForm);
router.post("/feedback", adminController.submitFeedback);

// 🔐 Admin-Only: View Feedbacks
router.get("/admin/view-feedbacks", isAdminLoggedIn, adminController.viewAllFeedbacks);


//admin dp on the profile setting page
router.post("/admin/updateProfile", upload.single("profilePic"), adminController.updateProfile);
router.post('/admin/change-password', adminController.changePassword);

// POST: Update Notification Preferences
router.post('/admin/notification-preferences', adminController.updateNotificationPreferences);

// POST: Toggle Two-Factor Authentication
router.post('/admin/toggle-2fa', adminController.toggleTwoFA);




router.get("/api/token/:id", async (req, res) => {
  try {
    const token = await Token.findById(req.params.id);
    if (!token) return res.status(404).send("Token not found");
    res.json(token);
  } catch (err) {
    res.status(500).send("Server error");
  }
});














const Token = require('../models/token_schema'); // adjust path if different

router.delete("/admin/delete-token/:id", async (req, res) => {
  try {
    const tokenId = req.params.id;
    const adminId = req.session.admin._id;
    const io = req.app.get("io");

    await Token.findByIdAndDelete(tokenId);

    // ✅ Inline emitQueueUpdate logic here
    const tokens = await Token.find({ adminId }).sort({ serialNumber: 1});
    io.to(adminId.toString()).emit("queueUpdate", tokens);  // 📡 broadcast live update

    res.sendStatus(200);
  } catch (err) {
    console.error("Delete Token Error:", err);
    res.status(500).send("Internal Server Error");
  }
});



// POST /api/toggle-shop-status
router.post("/admin/toggle-shop-status",isAdminLoggedIn,adminController.toggleShopStatus);




router.get('/admin/analyticsReport', isAdminLoggedIn,adminController.getAnalyticsReport);
router.get('/admin/expired-tokens', isAdminLoggedIn,adminController.getExpiredTokens);
router.get('/admin/manageStaff', isAdminLoggedIn,adminController.manageStaff);







router.post('/send-phone-otp', adminController.sendOtpToPhone);
router.post('/phone-login', adminController.verifyOtpAndLogin);







router.get("/admin-dashboard/managestaff",isAdminLoggedIn,(req,res)=>{res.render("manage_staff")});



module.exports = router;




