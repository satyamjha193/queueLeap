// routes/queueRoutes.js
const express = require("express");
const router = express.Router();
const passport = require("passport");

// Controllers
const queueController = require("../controllers/queueController");
const userControllers = require("../controllers/authController");
const otpController = require("../controllers/otpController");

// Middleware
const upload = require('../middleware/multer');

// Public pages
router.get("/", queueController.getHomePage);
router.get("/register", (req, res) => res.render("admin_registration"));
router.get("/user_register", (req, res) => res.render("user_registration"));
router.get("/about", (req, res) => res.redirect("/#about"));
router.get("/contact", (req, res) => res.redirect("/#contact"));
router.get("/home", (req, res) => res.redirect("/#home"));
router.get("/services", (req, res) => res.redirect("/#services"));
router.get("/hospital_services", (req, res) => res.render("hospital_service"));
router.get("/college", (req, res) => res.render("college"));



// Admin Registration (with image upload)
const adminController = require("../controllers/admin_controller"); // ✅ correct import

// Registration (admin)
router.post("/register/dashboard", upload.single('shopImage'), adminController.registerAdmin);

// Hospital Queue Routes
router.get("/hospitals", queueController.getAllHospitals);
router.get("/hospital/:id", queueController.getHospitalDetails);
router.post("/hospital/:id/book-token", queueController.bookToken);
router.post("/hospital/:id/delete-token", queueController.deleteToken);
router.get('/search-hospitals', queueController.searchHospitals);

// Admin subscription plan UI
router.get('/admin-subcription-plans', (req, res) => {
  res.render('subscriptionPlans');
});



const { getNearbyHospitals } = require("../controllers/queueController");
// GET /api/nearby-hospitals?lat=...&lng=...
router.get("/nearby-hospitals", getNearbyHospitals);



router.post('/admin/serve/:id', queueController.serveToken); // method from controller








// tools/cleanup.js or inside your admin route file
router.post('/cleanup-orphaned-hospitals', async (req, res) => {
  try {
    const result = await Hospital.deleteMany({ adminId: null });
    res.send(`✅ Deleted ${result.deletedCount} orphaned hospitals`);
  } catch (err) {
    console.error("❌ Cleanup failed:", err);
    res.status(500).send("❌ Cleanup failed");
  }
});






router.get("/track/token/:id", async (req, res) => {
  const token = await Token.findById(req.params.id).populate("adminId");
  if (!token) return res.status(404).send("Token not found");

  res.render("track_token", { token });
});

module.exports = router;


