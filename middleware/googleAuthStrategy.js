const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const authController = require("../controllers/authController");

require('dotenv').config();  // Add this if not added yet
const { googleAuthRegistration } = require('../controllers/authController');

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/auth/google/callback"
  },
  googleAuthRegistration // ✅ Now this is correct
));




