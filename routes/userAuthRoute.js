const express = require("express");
const router = express.Router();
const passport = require("passport");
const authController = require("../controllers/authController");

// Email Registration
router.post("/register/email", authController.registerWithEmail);

// Phone OTP
router.post("/register/phone/send-otp", authController.sendOtp);
router.post("/register/phone/verify-otp", authController.verifyOtpAndRegister);

// Google OAuth
router.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));
router.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/", successRedirect:"/"}),
  authController.googleOAuthCallback
);

module.exports = router;
