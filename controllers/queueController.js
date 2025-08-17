const Queue = require('../models/queue_schema');
const Admin = require('../models/admin_schema');
const Token = require('../models/token_schema');
const Hospital = require('../models/hospital_schema');
const Location = require("../models/location_schema");   //Location Id for admin regestration in AdminController
const ExpiredToken = require('../models/expired_token');

const QRCode = require('qrcode');
const moment = require('moment');
const cron = require('node-cron');




// Reusable function that returns the locationId or creates one
async function createOrGetDefaultLocation() {
  const existing = await Location.findOne({ name: "Default Location" });
  if (existing) return existing._id;

  const newLocation = new Location({
    name: "Default Location",
    address: "Hyderabad, Telangana",
  });

  const savedLocation = await newLocation.save();
  return savedLocation._id;
}
// Export the reusable function
exports.createOrGetDefaultLocation = createOrGetDefaultLocation;


// Express route handler that uses the reusable function and sends response
exports.createDefaultLocation = async (req, res) => {
  try {
    const locationId = await createOrGetDefaultLocation();
    res.status(200).json({
      message: "Default location ready",
      locationId,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create or get location" });
  }
};














// //book token
// const bookToken = async (req, res) => {
//   const { name, phone } = req.body;
//   const hospitalId = req.params.id;
//   const io = req.app.get('io');

//   try {
//     const hospital = await Hospital.findById(hospitalId).populate('adminId', 'name');
//     if (!hospital) return res.status(404).send("Hospital not found");

//     const admin = hospital.adminId;
//     const formattedTime = moment().format("YYYY-MM-DD hh:mm A");

//     const lastToken = await Token.findOne({ phoneNumber: phone, adminId: admin._id }).sort({ timestamp: -1 });
//     if (lastToken) {
//       const timeDiffInHours = moment().diff(moment(lastToken.timestamp), 'hours');
//       if (timeDiffInHours < 24) {
//         req.flash('error', `Token already booked. Try again in ${24 - timeDiffInHours} hour(s).`);
//         return res.redirect(`/hospital/${hospitalId}`);
//       }
//     }

//     const todayStart = new Date();
//     todayStart.setHours(0, 0, 0, 0);

//     const todayTokenCount = await Token.countDocuments({ adminId: admin._id, createdAt: { $gte: todayStart } });

//     const newToken = new Token({
//       fullName: name,
//       phoneNumber: phone,
//       serialNumber: todayTokenCount + 1,
//       adminId: admin._id,
//       timestamp: new Date(),
//       status: 'waiting'
//     });

//     await newToken.save();



//   const sendSMS = require('../utils/sendSMS');
//      const tokenWaitingCount = updatedQueue.length;
//   // const hospital = await Hospital.findOne({ adminId: newToken.adminId });
//   // const estimatedWait = hospital?.estimatedWaitTime || 10;
//   const estimatedWait = tokenWaitingCount * averageWait;
//   const trackUrl = `http://localhost:3000/track/token/${newToken._id}`;

//   await sendSMS(newToken.phoneNumber, 
//     `🎫 Token Booked!\nHi ${newToken.fullName}, your Token #${newToken.serialNumber} has been booked at ${hospital?.shopname}.\nETA: ${estimatedWait} min\nTrack here: ${trackUrl}`
//   );








    
// // ⏱️ Emit real-time chart stats update for dashboard

//       const [tokensServedToday, peopleInQueueToday] = await Promise.all([
//         Token.countDocuments({
//           adminId: admin._id,
//           status: "served",
//           createdAt: { $gte: todayStart }
//         }),
//         Token.countDocuments({
//           adminId: admin._id,
//           status: "waiting",
//           createdAt: { $gte: todayStart }
//         })
//       ]);

//       io.to(admin._id.toString()).emit("queueChartStatusUpdate", {
//         adminId: admin._id.toString(),
//         tokensServed: tokensServedToday,
//         peopleInQueue: peopleInQueueToday
//       });


//     const Admin = require("../models/admin_schema");
//     await Admin.findByIdAndUpdate(admin._id, {
//       $push: {
//         queue: {
//           fullName: name,
//           phoneNumber: phone,
//           serialNumber: newToken.serialNumber,
//           status: 'waiting',
//           timestamp: newToken.timestamp
//         }
//       }
//     });

//     const updatedQueue = await Token.find({ adminId: admin._id, status: 'waiting' }).sort({ serialNumber: 1 });
//     io.to(admin._id.toString()).emit('queueUpdate', updatedQueue);

//     const qrData = 
// `🏥 Hospital: ${hospital.shopname}
// 📍 Location: ${hospital.shopaddress}
// 👤 Admin: ${admin?.name || 'N/A'}
// 👨‍⚕️ Patient: ${name}
// 📞 Phone: ${phone}
// 🔢 Token Number: ${newToken.serialNumber}
// ⏰ Booked At: ${formattedTime}`;

//     const qrImage = await QRCode.toDataURL(qrData);

//     // const tokenWaitingCount = updatedQueue.length;
//     const latestServed = await Token.findOne({ adminId: admin._id, status: 'served' }).sort({ timestamp: -1 });
//     const currentToken = latestServed?.serialNumber || 0;

//     const adminData = await Admin.findById(admin._id);
//     const estimatedRange = adminData.estimatedWaitTimeRange || "0–10 min";
//     const [min, max] = estimatedRange.split("–").map(s => parseInt(s));
//     const averageWait = (min + max) / 2;
//     // const estimatedWait = tokenWaitingCount * averageWait;
//     const fillPercent = Math.min((tokenWaitingCount / 40) * 100, 100);


//     io.emit('hospitalCardUpdate', {
//        hospitalId: hospital._id.toString(),
//         tokenCount: tokenWaitingCount,
//         estimatedWaitTime: estimatedWait,
//         fillPercent
//     });

//  // ⏱️ Calculate waitTimePercent logic (example)
//   const total = await Token.countDocuments({ adminId: admin._id,});
//   const served = await Token.countDocuments({ adminId: admin._id, status: 'served' });
//   const waitTimePercent = Math.floor((served / total) * 100);
//       io.emit("updateProgress", {
//       hospitalId: admin._id.toString(),
//       newPercent: waitTimePercent,
//       });
//       io.emit('hospitalQueueUpdate', {
//       hospitalId: hospital._id.toString(),
//       queueLength: tokenWaitingCount
//       });

//       io.to(admin._id.toString()).emit('tokenUpdate', {
//       type: 'new',
//       message: `New token booked: #${newToken.serialNumber}`
//       });

//       io.to(admin._id.toString()).emit('tokenUpdate', {
//       type: 'now',
//       message: `Token #${currentToken} is now being served`
//       });

//       io.to(admin._id.toString()).emit('tokenUpdate', {
//         type: 'completed',
//       message: `Token #${latestServed?.serialNumber || 'N/A'} completed`
//       });

//       const tokensServed = await Token.countDocuments({ adminId: admin._id, status: 'served' });
//         io.to(admin._id.toString()).emit('queueStatsUpdate', {
//         estimatedWait,
//         peopleInQueue: tokenWaitingCount,
//         tokensServed
//       });

    

//     const allWaitingTokens = await Token.find({ adminId: admin._id, status: 'waiting' }).sort('createdAt');
//     const userIndex = allWaitingTokens.findIndex(t => t._id.toString() === newToken._id.toString());

//     const firstWaiting = allWaitingTokens[0];
//     io.to(admin._id.toString()).emit("currentWaitingTokenUpdate", {
//       tokenId: firstWaiting?._id.toString() || null
//     });

//     // ✅ REDIRECT instead of render (fixes refresh resubmit issue)
//     const encodedQR = encodeURIComponent(qrImage);
//     res.redirect(`/hospital/${hospitalId}?success=true&token=${newToken.serialNumber}&qr=${encodedQR}`);

//   } catch (error) {
//     console.error("Error booking token:", error);
//     res.status(500).send("Internal Server Error");
//   }
// };

// exports.bookToken = bookToken;


































// ✅ GET: Service Page
exports.getHospitalServicePage = async (req, res) => {
  try {
    const tokenData = req.session.tokenData;

    if (!tokenData || tokenData.hospitalId !== req.params.id) {
      return res.redirect(`/hospital/${req.params.id}`);
    }

    req.session.tokenData = null;

    return res.render('hospital_service', tokenData);
  } catch (error) {
    console.error("Error rendering service page:", error);
    res.status(500).send("Internal Server Error");
  }
};







// Delete token 
const deleteToken = async (req, res) => {
  const hospitalId = req.params.id;
  const phone = req.body.phone;

  try {
    const hospital = await Hospital.findById(hospitalId).populate('adminId');
    if (!hospital) {
      req.flash('deleteError', 'Hospital not found.');
      return res.redirect('back');
    }

    const adminId = hospital.adminId._id;

    // Find token
    const token = await Token.findOne({ phoneNumber: phone, adminId });

    if (!token) {
      req.flash('deleteError', 'No token found for the given phone number.');
      return res.redirect(`/hospital/${hospitalId}`);
    }

    // Check if the token is already served
    if (token.status === 'served' || token.status === 'completed') {
      req.flash('deleteError', 'Token already served by the admin and cannot be deleted.');
      return res.redirect(`/hospital/${hospitalId}`);
    }

    // Delete the token
    await Token.deleteOne({ _id: token._id });

    // Optional: Remove from Hospital.tokens array (if used)
    await Hospital.updateOne(
      { _id: hospitalId },
      { $pull: { tokens: { phoneNumber: phone } } }
    );

    req.flash('success', `Token for phone number ${phone} deleted successfully.`);
    res.redirect(`/hospital/${hospitalId}`);

  } catch (err) {
    console.error("Error deleting token:", err);
    req.flash('deleteError', 'Something went wrong while deleting token.');
    res.redirect(`/hospital/${hospitalId}`);
  }
};
exports.deleteToken = deleteToken;



// completed token
const completeToken = async (req, res) => {
  const tokenId = req.params.id;
  const io = req.app.get('io');

  try {
    const token = await Token.findByIdAndUpdate(tokenId, { status: 'completed' }, { new: true });
    if (!token) return res.status(404).send('Token not found');

    const adminId = token.adminId.toString();

    const updatedQueue = await Token.find({ adminId, status: 'waiting' }).sort({ serialNumber: 1 });
    const latestServed = await Token.findOne({ adminId, status: 'served' }).sort({ timestamp: -1 });

    await sendSMS(token.phoneNumber, `✅ Your token #${token.serialNumber} has been served. Thank you!`);

    io.to(adminId).emit('queueUpdate', updatedQueue);

    io.to(adminId).emit('tokenUpdate', {
      type: 'completed',
      message: `Token #${token.serialNumber} completed`
    });

    res.redirect(`/admin-dashboard`);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
};


















const getAllHospitals = async (req, res) => {
  try {
    const hospitals = await Hospital.find({}).populate('adminId', 'name estimatedWaitTimeRange isOpen');

    hospitals.forEach(h => {
      if (!h.adminId) {
        console.warn(`⚠️ Hospital "${h.shopname}" has no admin assigned!`);
      }
    });

    const io = req.app.get('io'); // ✅ Make sure this is defined

    const hospitalsWithQueueStats = await Promise.all(
      hospitals
        .filter(hospital => hospital.adminId)
        .map(async (hospital) => {
          const admin = hospital.adminId;
          const adminId = admin._id;

  

          const todayStart = moment().startOf('day').toDate();

          const tokenCount = await Token.countDocuments({
            adminId,
            status: 'waiting',
            createdAt: { $gte: todayStart } // ✅ Only count today's tokens
          });


          const range = admin.estimatedWaitTimeRange || "5–10 min";
          const [minStr, maxStr] = range.replace(/\s+/g, '').split(/[-–]/);
          const min = parseInt(minStr);
          const max = parseInt(maxStr);
          const avgWait = Math.round((min + max) / 2) || 5;

          const estimatedWaitTime = tokenCount * avgWait;
          const fillPercent = Math.min((tokenCount / 40) * 100, 100);

          const hrs = Math.floor(estimatedWaitTime / 60);
          const mins = estimatedWaitTime % 60;
          const formattedWait = hrs > 0
            ? `${hrs} hr${mins > 0 ? ` ${mins} min` : ''}`
            : `${mins} min`;

          // ✅ Emit real-time update for hospital card
          io.emit('hospitalCardUpdate', {
            hospitalId: hospital._id.toString(),
            tokenCount,
            estimatedWaitTime,
            fillPercent
          });

          return {
            ...hospital.toObject(),
            adminId: admin,
            hospitalId: hospital._id.toString(),
            tokenCount,
            estimatedWaitTime,
            formattedWait,
            fillPercent,
            estimatedRange: range
          };
        })
    );

    hospitalsWithQueueStats.forEach(hospital => {
      console.log("✅ hospital image:", hospital.shopImage);
    });

    res.render('hospitals', { hospitals: hospitalsWithQueueStats });
  } catch (error) {
    console.error("Error fetching hospitals:", error);
    res.status(500).send("Internal Server Error");
  }
};

exports.getAllHospitals = getAllHospitals;








//get the hospitals and clinics details on the page.
const getHospitalDetails = async (req, res) => {
  try {
    const hospital = await Hospital.findById(req.params.id).populate('adminId', 'name estimatedWaitTimeRange');
    if (!hospital) return res.status(404).send("Hospital not found");

    const admin = hospital.adminId;
    const adminId = admin._id;
    const todayStart = moment().startOf('day').toDate();
    const userPhone = req.session.user?.phoneNumber;

    const waitingTokens = await Token.find({ adminId, status: 'waiting', createdAt: { $gte: todayStart } }).sort({ createdAt: 1 });
    const tokenCount = waitingTokens.length;

    const currentToken = await Token.findOne({ adminId, status: 'served', createdAt: { $gte: todayStart } }).sort({ timestamp: -1 });
    const lastUpdated = currentToken?.timestamp ? moment(currentToken.timestamp).format("hh:mm A") : moment().format("hh:mm A");
    const currentTokenNumber = currentToken?.serialNumber || 0;

  
    const range = admin.estimatedWaitTimeRange || "5–10 min";
    const [minStr, maxStr] = range.replace(/\s+/g, '').split(/[-–]/);
    const min = parseInt(minStr);
    const max = parseInt(maxStr);
    const avg = Math.round((min + max) / 2) || 5;
    const estimatedWait = tokenCount * avg;
    const fillPercent = Math.min((tokenCount / 40) * 100, 100);

    io.emit('queueUpdate', {
      hospitalId: hospital._id.toString(), // ✅ FIXED
      tokenCount,
      estimatedWait,
    });

    const updates = [
      { type: 'now', message: `Token #${currentTokenNumber} is now being served` },
      { type: 'completed', message: `Token #${currentToken?.serialNumber || 'N/A'} completed` }
    ];

    let userHasActiveToken = false;
    if (userPhone) {
      const activeToken = await Token.findOne({ phoneNumber: userPhone, adminId, status: { $in: ['booked', 'waiting'] } });
      if (activeToken) userHasActiveToken = true;
    }

    // ✅ NEW: extract query values for success & token modal
    const success = req.query.success === 'true';
    const tokenNumber = req.query.token || null;
    const qrImage = req.query.qr || null;

    res.render('hospital_service', {
      hospital,
      queueStats: {
        currentToken: currentTokenNumber,
        peopleInQueue: tokenCount,
        estimatedWait,
        range,
        fillPercent
      },
      tokenBooked: success,
      tokenNumber,
      qrImage,
      updates,
      adminRoomId: adminId.toString(),
      lastUpdated,
      locationMapUrl: hospital.locationMapUrl,
      userHasActiveToken
    });

  } catch (error) {
    console.error("Error fetching hospital:", error);
    res.status(500).send("Internal Server Error");
  }
};

exports.getHospitalDetails = getHospitalDetails;







// controllers/queueController.js
exports.getHomePage = (req, res) => {
  const flashMessage = req.session.flashMessage; // ✅ fetch flash message
  delete req.session.flashMessage;              // ✅ delete it after fetching (one-time show)

  const message = req.session.goodbyeMessage;
  delete req.session.goodbyeMessage;

  const user = req.session.user || {};
  const isLoggedIn = !!req.session.user || !!req.session.admin;

  res.render("index", {
    isLoggedIn,
    message,
    flashMessage, // ✅ pass flashMessage to EJS
    role: user.role || "guest",
    email: user.email || "",
    siteKey: process.env.RECAPTCHA_SITE_KEY,
  });
};








// Search the hospitals in the hospitals page(hospitals.ejs)

const searchHospitals = async (req, res) => {
  const query = req.query.q?.trim();

  try {
    const searchCriteria = query
      ? {
          $or: [
            { shopname: { $regex: query, $options: 'i' } },
            { shopaddress: { $regex: query, $options: 'i' } },
            { sectorname: { $regex: query, $options: 'i' } },
            { phone: { $regex: query, $options: 'i' } }
          ]
        }
      : {};

    const hospitals = await Hospital.find(searchCriteria).populate('adminId', 'name');

    if (!hospitals || hospitals.length === 0) {
      return res.status(200).json({ message: 'No hospitals found', hospitals: [] });
    }

    return res.status(200).json({ hospitals });
  } catch (err) {
    console.error('Search error:', err);
    return res.status(500).json({ error: 'Server error while searching hospitals' });
  }
};
exports.searchHospitals = searchHospitals;






// Helper function: Haversine formula
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const getNearbyHospitals = async (req, res) => {
  const { lat, lng } = req.query;

  if (!lat || !lng) {
    return res.status(400).json({ error: "Latitude and longitude are required." });
  }

  try {
    const hospitals = await Hospital.find({});

    const nearby = hospitals
      .map(h => {
        const distance = getDistanceFromLatLonInKm(lat, lng, h.lat, h.lng);
        const tokenCount = h.tokens?.length || 0;
        const fillPercent = Math.min((tokenCount / 30) * 100, 100);
        const base = h.estimatedWaitTime || 5;
        const formattedWait = `${base}–${base + 5} min`;

        return {
          ...h._doc,
          distance: parseFloat(distance.toFixed(2)),
          tokenCount,
          fillPercent,
          formattedWait
        };
      })
      .filter(h => h.distance <= 5) // ✅ LIMIT TO 5 KM
      .sort((a, b) => a.distance - b.distance); // Sort by closest first

    res.json(nearby);
  } catch (err) {
    console.error("Nearby fetch error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.getNearbyHospitals=getNearbyHospitals;






















const serveToken = async (req, res) => {
  const tokenId = req.params.id;
  const io = req.app.get('io');

  try {
    // Step 1: Mark this token as served
    const token = await Token.findByIdAndUpdate(tokenId, {
      status: 'served',
      servedAt: new Date()
    }, { new: true });

    if (!token) return res.status(404).send('Token not found');

    const adminId = token.adminId.toString();

    // Step 2: Get updated queue
    const updatedQueue = await Token.find({ adminId, status: 'waiting' }).sort({ serialNumber: 1 });

    // Step 3: Calculate stats
    const tokensServed = await Token.countDocuments({ adminId, status: 'served' });
    const peopleInQueue = updatedQueue.length;

    // Latest served token
    const latestServed = await Token.findOne({ adminId, status: 'served' }).sort({ servedAt: -1 });
    const currentToken = latestServed?.serialNumber || 0;

    // Estimated wait time
    const adminData = await Admin.findById(adminId);
    const estimatedRange = adminData?.estimatedWaitTimeRange || "0–10 min";
    const [min, max] = estimatedRange.split("–").map(s => parseInt(s));
    const averageWait = (min + max) / 2;
    const estimatedWait = peopleInQueue * averageWait;

    // Step 4: Notify next waiting user via SMS
    const nextToken = await Token.findOne({
      adminId,
      status: 'waiting',
      serialNumber: { $gt: currentToken }
    }).sort({ serialNumber: 1 });

    if (nextToken) {
      const hospital = await Hospital.findOne({ adminId });

      const trackUrl = `http://localhost:3000/track/token/${nextToken._id}`;
      const smsMessage = `🕒 Now serving Token #${currentToken} at ${hospital?.shopname || 'our service'}.
You're Token #${nextToken.serialNumber}. Please arrive soon.
Track Live: ${trackUrl}`;

      await sendSMS(nextToken.phoneNumber, smsMessage);
    }

    // Step 5: Emit WebSocket updates
    io.to(adminId).emit('queueUpdate', updatedQueue);

    io.to(adminId).emit('tokenUpdate', {
      type: 'completed',
      message: `Token #${token.serialNumber} completed`
    });

    io.to(adminId).emit('tokenUpdate', {
      type: 'now',
      message: `Now serving token #${currentToken}`
    });

    io.to(adminId).emit('queueStatsUpdate', {
      tokensServed,
      peopleInQueue,
      estimatedWait
    });

    const nextWaiting = await Token.findOne({ adminId, status: 'waiting' }).sort({ serialNumber: 1 });
    io.to(adminId).emit("currentWaitingTokenUpdate", {
      tokenId: nextWaiting?._id.toString() || null
    });

    // Emit public hospital status update
    io.emit('queueUpdate', {
      hospitalId: token.hospitalId?.toString() || null,
      tokenCount: peopleInQueue,
      estimatedWaitTime: estimatedWait
    });

    res.redirect('/admin-dashboard');
  } catch (err) {
    console.error('❌ Error in serveToken:', err);
    res.status(500).send("Server Error");
  }
};

exports.serveToken = serveToken;











// // serve token 
// const serveToken = async (req, res) => {
//   const tokenId = req.params.id;
//   const io = req.app.get('io');

//   try {
//     // Step 1: Mark this token as served
//     const token = await Token.findByIdAndUpdate(tokenId, {
//       status: 'served',
//       servedAt: new Date()
//     }, { new: true });

//     if (!token) return res.status(404).send('Token not found');

//     const adminId = token.adminId.toString();

//     // Step 2: Get updated queue
//     const updatedQueue = await Token.find({ adminId, status: 'waiting' }).sort({ serialNumber: 1 });

//     // Step 3: Calculate new stats
//     const tokensServed = await Token.countDocuments({ adminId, status: 'served' });
//     const peopleInQueue = updatedQueue.length;

//     // Get latest served token
//     const latestServed = await Token.findOne({ adminId, status: 'served' }).sort({ timestamp: -1 });
//     const currentToken = latestServed?.serialNumber || 0;

//     // Get estimated wait time range from admin config
//     const adminData = await Admin.findById(adminId);
//     const estimatedRange = adminData.estimatedWaitTimeRange || "0–10 min";
//     const [min, max] = estimatedRange.split("–").map(s => parseInt(s));
//     const averageWait = (min + max) / 2;
//     const estimatedWait = peopleInQueue * averageWait;




   

//         const sendSMS = require('../utils/sendSMS');

//     const nextToken = await Token.findOne({
//       adminId: currentToken.adminId,
//       status: 'waiting',
//       serialNumber: { $gt: currentToken.serialNumber }
//     }).sort({ serialNumber: 1 });

//     if (nextToken) {
//       const hospital = await Hospital.findOne({ adminId: currentToken.adminId });
//       const trackUrl = `http://localhost:3000/track/token/${nextToken._id}`;

//       await sendSMS(nextToken.phoneNumber, 
//         `🕒 Now serving Token #${currentToken.serialNumber + 1} at ${hospital?.shopname}.\nYou're Token #${nextToken.serialNumber}. Please arrive soon.\nTrack: ${trackUrl}`
//       );
//     }














//     // Step 4: Emit updates
//     io.to(adminId).emit('queueUpdate', updatedQueue);

//     io.to(adminId).emit('tokenUpdate', {
//       type: 'completed',
//       message: `Token #${token.serialNumber} completed`
//     });

//     io.to(adminId).emit('tokenUpdate', {
//       type: 'now',
//       message: `Now serving token #${currentToken}`
//     });

//     io.to(adminId).emit('queueStatsUpdate', {
//       tokensServed,
//       peopleInQueue,
//       estimatedWait
//     });

//     const nextWaiting = await Token.findOne({ adminId, status: 'waiting' }).sort({ serialNumber: 1 });

//     io.to(adminId).emit("currentWaitingTokenUpdate", {
//       tokenId: nextWaiting?._id.toString() || null
//     });

//     io.emit('queueUpdate', {
//       hospitalId: token.hospitalId?.toString(), // optional if needed for public
//       tokenCount: peopleInQueue,
//       estimatedWaitTime: estimatedWait
//     });

//     res.redirect('/admin-dashboard');
//   } catch (err) {
//     console.error('Error in serveToken:', err);
//     res.status(500).send("Server Error");
//   }
// };

// exports.serveToken = serveToken;

























// jobs/periodicAlerts.js
const sendSMS = require("../utils/sendSMS");

const checkAndNotifyWaitingUsers = async () => {
  const tokens = await Token.find({ status: 'waiting' });

  for (let token of tokens) {
    const admin = await Admin.findById(token.adminId);
    const trackUrl = `https://yourdomain.com/track/token/${token._id}`;
    
    // Calculate estimated wait from position
    const position = await Token.countDocuments({
      adminId: token.adminId,
      status: 'waiting',
      serialNumber: { $lt: token.serialNumber }
    });

    const [min, max] = (admin.estimatedWaitTimeRange || "0–10 min").split("–").map(x => parseInt(x));
    const avg = (min + max) / 2;
    const estimatedWait = position * avg;

    if (estimatedWait <= 15) {
      const msg = `⏱️ Update: Your token #${token.serialNumber} is approaching soon at ${admin.name}. ETA: ~${estimatedWait} mins.
Track: ${trackUrl}`;
      await sendSMS(token.phoneNumber, msg);
    }
  }
};

exports.checkAndNotifyWaitingUsers= checkAndNotifyWaitingUsers;












const runTokenSmsAlerts = () => {
  cron.schedule("*/15 * * * *", async () => {
    console.log("🔔 Running token SMS alert job");

    const waitingTokens = await Token.find({ status: "waiting" });

    for (const token of waitingTokens) {
      const hospital = await Hospital.findOne({ adminId: token.adminId });
      if (!hospital) continue;

      const positionInQueue = await Token.countDocuments({
        adminId: token.adminId,
        status: "waiting",
        serialNumber: { $lt: token.serialNumber }
      });

      const avgWait = parseInt(hospital.estimatedWaitTime || "10"); // Assume avg
      const totalETA = positionInQueue * avgWait;

      if (totalETA <= 15) {
        const trackUrl = `http://localhost:3000/track/token/${token._id}`;

        await sendSMS(token.phoneNumber, 
          `⌛ Heads up! Your Token #${token.serialNumber} is approaching soon at ${hospital.shopname}.\nETA: ~${totalETA} min\nTrack: ${trackUrl}`
        );
      }
    }
  });
};

exports.runTokenSmsAlerts = runTokenSmsAlerts;





































































const bookToken = async (req, res) => {
 
  const { name, phone } = req.body;
  const hospitalId = req.params.id;
  const io = req.app.get('io');

  try {
    const hospital = await Hospital.findById(hospitalId).populate('adminId', 'name');
    if (!hospital) return res.status(404).send("Hospital not found");

    const admin = hospital.adminId;
    const formattedTime = moment().format("YYYY-MM-DD hh:mm A");

    // Prevent multiple bookings in 24 hours
    const lastToken = await Token.findOne({ phoneNumber: phone, adminId: admin._id }).sort({ timestamp: -1 });
    if (lastToken) {
      const timeDiffInHours = moment().diff(moment(lastToken.timestamp), 'hours');
      if (timeDiffInHours < 24) {
        req.flash('error', `Token already booked. Try again in ${24 - timeDiffInHours} hour(s).`);
        return res.redirect(`/hospital/${hospitalId}`);
      }
    }

    // Calculate today's serial number
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayTokenCount = await Token.countDocuments({
      adminId: admin._id,
      createdAt: { $gte: todayStart }
    });

    const newToken = new Token({
      fullName: name,
      phoneNumber: phone,
      serialNumber: todayTokenCount + 1,
      adminId: admin._id,
      timestamp: new Date(),
      status: 'waiting'
    });

    await newToken.save();

    // Add to admin queue
    await Admin.findByIdAndUpdate(admin._id, {
      $push: {
        queue: {
          fullName: name,
          phoneNumber: phone,
          serialNumber: newToken.serialNumber,
          status: 'waiting',
          timestamp: newToken.timestamp
        }
      }
    });

    // Get updated queue (waitlist)
    const updatedQueue = await Token.find({ adminId: admin._id, status: 'waiting' }).sort({ serialNumber: 1 });

    // Wait estimation
    const adminData = await Admin.findById(admin._id);
    const estimatedRange = adminData.estimatedWaitTimeRange || "0–10 min";
    const [min, max] = estimatedRange.split("–").map(s => parseInt(s));
    const averageWait = (min + max) / 2;
    const tokenWaitingCount = updatedQueue.length;
    const estimatedWait = tokenWaitingCount * averageWait;

    // Send SMS
    const trackUrl = `http://localhost:3000/track/token/${newToken._id}`;
    await sendSMS(newToken.phoneNumber,
      `🎫 Token Booked!\nHi ${newToken.fullName}, your Token #${newToken.serialNumber} has been booked at ${hospital?.shopname}.\nETA: ${estimatedWait} min\nTrack here: ${trackUrl}`
    );

    // QR code generation
    const qrData = `
🏥 Hospital: ${hospital.shopname}
📍 Location: ${hospital.shopaddress}
👤 Admin: ${admin?.name || 'N/A'}
👨‍⚕️ Patient: ${name}
📞 Phone: ${phone}
🔢 Token Number: ${newToken.serialNumber}
⏰ Booked At: ${formattedTime}`;
    const qrImage = await QRCode.toDataURL(qrData);

    // Dashboard & Chart updates
    const [tokensServedToday, peopleInQueueToday] = await Promise.all([
      Token.countDocuments({
        adminId: admin._id,
        status: "served",
        createdAt: { $gte: todayStart }
      }),
      Token.countDocuments({
        adminId: admin._id,
        status: "waiting",
        createdAt: { $gte: todayStart }
      })
    ]);

    const latestServed = await Token.findOne({ adminId: admin._id, status: 'served' }).sort({ timestamp: -1 });
    const currentToken = latestServed?.serialNumber || 0;
    const total = await Token.countDocuments({ adminId: admin._id });
    const served = await Token.countDocuments({ adminId: admin._id, status: 'served' });
    const waitTimePercent = Math.floor((served / total) * 100);
    const fillPercent = Math.min((tokenWaitingCount / 40) * 100, 100);

    io.to(admin._id.toString()).emit("queueChartStatusUpdate", {
      adminId: admin._id.toString(),
      tokensServed: tokensServedToday,
      peopleInQueue: peopleInQueueToday
    });

    io.to(admin._id.toString()).emit('queueUpdate', updatedQueue);
    io.emit('hospitalCardUpdate', {
      hospitalId: hospital._id.toString(),
      tokenCount: tokenWaitingCount,
      estimatedWaitTime: estimatedWait,
      fillPercent
    });
    io.emit("updateProgress", {
      hospitalId: admin._id.toString(),
      newPercent: waitTimePercent
    });
    io.emit('hospitalQueueUpdate', {
      hospitalId: hospital._id.toString(),
      queueLength: tokenWaitingCount
    });

    io.to(admin._id.toString()).emit('tokenUpdate', {
      type: 'new',
      message: `New token booked: #${newToken.serialNumber}`
    });
    io.to(admin._id.toString()).emit('tokenUpdate', {
      type: 'now',
      message: `Token #${currentToken} is now being served`
    });
    io.to(admin._id.toString()).emit('tokenUpdate', {
      type: 'completed',
      message: `Token #${latestServed?.serialNumber || 'N/A'} completed`
    });

    const tokensServed = await Token.countDocuments({ adminId: admin._id, status: 'served' });
    io.to(admin._id.toString()).emit('queueStatsUpdate', {
      estimatedWait,
      peopleInQueue: tokenWaitingCount,
      tokensServed
    });

    const allWaitingTokens = await Token.find({ adminId: admin._id, status: 'waiting' }).sort('createdAt');
    const firstWaiting = allWaitingTokens[0];
    io.to(admin._id.toString()).emit("currentWaitingTokenUpdate", {
      tokenId: firstWaiting?._id.toString() || null
    });

    // Redirect with QR
    const encodedQR = encodeURIComponent(qrImage);
    res.redirect(`/hospital/${hospitalId}?success=true&token=${newToken.serialNumber}&qr=${encodedQR}`);

  } catch (error) {
    console.error("Error booking token:", error);
    res.status(500).send("Internal Server Error");
  }
};

exports.bookToken = bookToken;
