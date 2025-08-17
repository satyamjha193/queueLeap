const express = require("express");
const router = express.Router();
const Salon  =  require("../models/salon_schema");

router.get('/salon', async (req, res) => {
  try {
    const salons = await Salon.find().populate('adminId');
    res.render('salon', { salons });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});



const salonQueueController = require("../controllers/salonQueueController");

// Salon Service Page (Main Public View)
router.get("/salon_services", salonQueueController.getSalonDetails);

// View Specific Salon
router.get("/salon/:id", salonQueueController.getSalonDetails);

// Book Token
router.post("/salon/:id/book-token", salonQueueController.bookToken);

// Delete Token
router.post("/salon/:id/delete-token", salonQueueController.deleteSalonToken);

// Serve Token
router.post("/salon/:id/serve-token", salonQueueController.serveSalonToken);

// Complete Token
router.post("/salon/:id/complete-token", salonQueueController.completeToken);


module.exports = router;



