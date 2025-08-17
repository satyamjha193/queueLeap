const QRCode = require('qrcode');
const Token = require('../models/token_schema');
const Salon = require('../models/salon_schema');
const moment = require('moment');

const bookToken = async (req, res) => {
  const { name, phone } = req.body;
  const salonId = req.params.id;
  const io = req.app.get('io');

  try {
    const salon = await Salon.findById(salonId).populate('adminId', 'name');
    if (!salon) return res.status(404).send("Salon not found");

    const admin = salon.adminId;
    const formattedTime = moment().format("YYYY-MM-DD hh:mm A");

    const lastToken = await Token.findOne({ phoneNumber: phone, adminId: admin._id }).sort({ timestamp: -1 });
    if (lastToken) {
      const timeDiffInHours = moment().diff(moment(lastToken.timestamp), 'hours');
      if (timeDiffInHours < 24) {
        req.flash('error', `Token already booked. Try again in ${24 - timeDiffInHours} hour(s).`);
        return res.redirect(`/salon/${salonId}`);
      }
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayTokenCount = await Token.countDocuments({ adminId: admin._id, createdAt: { $gte: todayStart } });

    const newToken = new Token({
      fullName: name,
      phoneNumber: phone,
      serialNumber: todayTokenCount + 1,
      adminId: admin._id,
      timestamp: new Date(),
      status: 'waiting'
    });

    await newToken.save();

    const Admin = require("../models/admin_schema");
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

    const updatedQueue = await Token.find({ adminId: admin._id, status: 'waiting' }).sort({ serialNumber: 1 });
    io.to(admin._id.toString()).emit('queueUpdate', updatedQueue);

    const qrData =
`💈 Salon: ${salon.shopname}
📍 Location: ${salon.shopaddress}
👤 Admin: ${admin?.name || 'N/A'}
👨‍🎤 Customer: ${name}
📞 Phone: ${phone}
🔢 Token Number: ${newToken.serialNumber}
⏰ Booked At: ${formattedTime}`;

    const qrImage = await QRCode.toDataURL(qrData);

    const tokenWaitingCount = updatedQueue.length;
    const latestServed = await Token.findOne({ adminId: admin._id, status: 'served' }).sort({ timestamp: -1 });
    const currentToken = latestServed?.serialNumber || 0;

    const adminData = await Admin.findById(admin._id);
    const estimatedRange = adminData.estimatedWaitTimeRange || "0–10 min";
    const [min, max] = estimatedRange.split("–").map(s => parseInt(s));
    const averageWait = (min + max) / 2;
    const estimatedWait = tokenWaitingCount * averageWait;
    const fillPercent = Math.min((tokenWaitingCount / 40) * 100, 100);

    // 🔁 Real-time updates for salon card
    io.emit('salonCardUpdate', {
      salonId: salon._id.toString(),
      tokenCount: tokenWaitingCount,
      estimatedWaitTime: estimatedWait,
      fillPercent
    });

    const total = await Token.countDocuments({ adminId: admin._id });
    const served = await Token.countDocuments({ adminId: admin._id, status: 'served' });
    const waitTimePercent = Math.floor((served / total) * 100);

    io.emit("updateProgress", {
      salonId: admin._id.toString(),
      newPercent: waitTimePercent
    });

    io.emit('salonQueueUpdate', {
      salonId: salon._id.toString(),
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

    // ✅ REDIRECT (not render)
    const encodedQR = encodeURIComponent(qrImage);
    res.redirect(`/salon/${salonId}?success=true&token=${newToken.serialNumber}&qr=${encodedQR}`);

  } catch (error) {
    console.error("Error booking salon token:", error);
    res.status(500).send("Internal Server Error");
  }
};

exports.bookToken = bookToken;










// Delete token for salon
const deleteSalonToken = async (req, res) => {
  const salonId = req.params.id;
  const phone = req.body.phone;

  try {
    const salon = await Salon.findById(salonId).populate('adminId');
    if (!salon) {
      req.flash('deleteError', 'Salon not found.');
      return res.redirect('back');
    }

    const adminId = salon.adminId._id;

    // Find token
    const token = await Token.findOne({ phoneNumber: phone, adminId });

    if (!token) {
      req.flash('deleteError', 'No token found for the given phone number.');
      return res.redirect(`/salon/${salonId}`);
    }

    // If already served or completed
    if (token.status === 'served' || token.status === 'completed') {
      req.flash('deleteError', 'Token already served/completed and cannot be deleted.');
      return res.redirect(`/salon/${salonId}`);
    }

    // Delete the token
    await Token.deleteOne({ _id: token._id });

    // Optional cleanup in salon schema (if salon.tokens array exists)
    await Salon.updateOne(
      { _id: salonId },
      { $pull: { tokens: { phoneNumber: phone } } }
    );

    req.flash('success', `Token for phone number ${phone} deleted successfully.`);
    res.redirect(`/salon/${salonId}`);

  } catch (err) {
    console.error("Error deleting salon token:", err);
    req.flash('deleteError', 'Something went wrong while deleting token.');
    res.redirect(`/salon/${salonId}`);
  }
};

exports.deleteSalonToken = deleteSalonToken;


//complete token  for salon
const completeToken = async (req, res) => {
  const tokenId = req.params.id;
  const io = req.app.get('io');

  try {
    const token = await Token.findByIdAndUpdate(
      tokenId,
      { status: 'completed' },
      { new: true }
    );
    if (!token) return res.status(404).send('Token not found');

    const adminId = token.adminId.toString();

    // Send updated waiting queue to frontend
    const updatedQueue = await Token.find({
      adminId,
      status: 'waiting'
    }).sort({ serialNumber: 1 });

    const latestServed = await Token.findOne({
      adminId,
      status: 'served'
    }).sort({ timestamp: -1 });

    // Emit socket events
    io.to(adminId).emit('queueUpdate', updatedQueue);

    io.to(adminId).emit('tokenUpdate', {
      type: 'completed',
      serialNumber: token.serialNumber,
      message: `Token #${token.serialNumber} marked as completed`,
    });

    res.redirect('/admin/dashboard');
  } catch (err) {
    console.error('❌ Error completing token:', err);
    res.status(500).send('Server Error');
  }
};

exports.completeToken = completeToken;



const cron = require('node-cron');

const ExpiredToken = require('../models/expired_token');



const startCleanupJob = (io) => {
  cron.schedule('0 0 * * *', async () => {
    console.log("⏰ Midnight cleanup started for salons");

    const todayStart = moment().startOf('day').toDate();

    try {
      const expiredTokens = await Token.find({
        status: 'waiting',
        createdAt: { $lt: todayStart }
      });

      if (expiredTokens.length === 0) {
        console.log("✅ No expired tokens to archive");
        return;
      }

      const updatedAdmins = new Set();

      for (const token of expiredTokens) {
        const archived = {
          fullName: token.fullName,
          phoneNumber: token.phoneNumber,
          serialNumber: token.serialNumber,
          timestamp: token.timestamp,
          status: 'expired',
          adminId: token.adminId,
          expiredAt: new Date(),
          originalCreatedAt: token.createdAt
        };

        await ExpiredToken.create(archived);
        await Token.findByIdAndDelete(token._id);

        // Emit real-time update to dashboard
        if (!updatedAdmins.has(token.adminId.toString())) {
          io.to(token.adminId.toString()).emit('expiredTokenUpdate', {
            fullName: archived.fullName,
            phoneNumber: archived.phoneNumber,
            serialNumber: archived.serialNumber,
            timestamp: archived.timestamp,
            expiredAt: archived.expiredAt
          });

          updatedAdmins.add(token.adminId.toString());
        }
      }

      // Emit real-time queue reset to salon service cards
      const affectedAdminIds = [...updatedAdmins];

      for (const adminId of affectedAdminIds) {
        const salon = await Salon.findOne({ adminId });

        if (salon) {
          io.emit('queueUpdate', {
            salonId: salon._id.toString(),
            tokenCount: 0,
            estimatedWaitTime: 0
          });
        }
      }

      console.log(`✅ Archived & deleted ${expiredTokens.length} expired salon tokens and reset queues.`);
    } catch (err) {
      console.error("❌ Error in salon token cleanup:", err);
    }
  });
};

exports.startCleanupJob = startCleanupJob;





// ✅ GET ALL SALONS CONTROLLER
const getAllSalons = async (req, res) => {
  try {
    // ✅ Fetch all salons with populated admin details
    const salons = await Salon.find({}).populate('adminId', 'name estimatedWaitTimeRange isOpen');

    salons.forEach(s => {
      if (!s.adminId) {
        console.warn(`⚠️ Salon "${s.shopname}" has no admin assigned!`);
      }
    });

    const io = req.app.get('io'); // ✅ Get socket instance

    // ✅ Add queue stats and emit real-time updates
    const salonsWithQueueStats = await Promise.all(
      salons
        .filter(salon => salon.adminId)
        .map(async (salon) => {
          const admin = salon.adminId;
          const adminId = admin._id;

          const todayStart = moment().startOf('day').toDate();

          const tokenCount = await Token.countDocuments({
            adminId,
            status: 'waiting',
            createdAt: { $gte: todayStart }
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

          // ✅ Emit real-time update to salons (can customize socket event if needed)
          io.emit('salonCardUpdate', {
            salonId: salon._id.toString(),
            tokenCount,
            estimatedWaitTime,
            fillPercent
          });

          return {
            ...salon.toObject(),
            adminId: admin,
            salonId: salon._id.toString(),
            tokenCount,
            estimatedWaitTime,
            formattedWait,
            fillPercent,
            estimatedRange: range
          };
        })
    );

    salonsWithQueueStats.forEach(salon => {
      console.log("✅ salon image:", salon.shopImage);
    });

    // ✅ Render salon page with enhanced data
    res.render('salon', { salons: salonsWithQueueStats }); // <-- Update EJS if needed
  } catch (error) {
    console.error("Error fetching salons:", error);
    res.status(500).send("Internal Server Error");
  }
};

exports.getAllSalons = getAllSalons;







// ✅ GET the salon details on the service page
const getSalonDetails = async (req, res) => {
  try {
    // ✅ Change schema to Salon instead of Hospital
    const salon = await Salon.findById(req.params.id).populate('adminId', 'name estimatedWaitTimeRange');
    if (!salon) return res.status(404).send("Salon not found");

    const admin = salon.adminId;
    const adminId = admin._id;
    const todayStart = moment().startOf('day').toDate();
    const userPhone = req.session.user?.phoneNumber;

    const waitingTokens = await Token.find({ adminId, status: 'waiting', createdAt: { $gte: todayStart } }).sort({ createdAt: 1 });
    const tokenCount = waitingTokens.length;

    const currentToken = await Token.findOne({ adminId, status: 'served', createdAt: { $gte: todayStart } }).sort({ timestamp: -1 });
    const lastUpdated = currentToken?.timestamp ? moment(currentToken.timestamp).format("hh:mm A") : moment().format("hh:mm A");
    const currentTokenNumber = currentToken?.serialNumber || 0;

    // ✅ Calculate estimated wait
    const range = admin.estimatedWaitTimeRange || "5–10 min";
    const [minStr, maxStr] = range.replace(/\s+/g, '').split(/[-–]/);
    const min = parseInt(minStr);
    const max = parseInt(maxStr);
    const avg = Math.round((min + max) / 2) || 5;
    const estimatedWait = tokenCount * avg;
    const fillPercent = Math.min((tokenCount / 40) * 100, 100);

    // ✅ Emit update with salon ID
    io.emit('queueUpdate', {
      hospitalId: salon._id.toString(), // Can rename to `salonId` on frontend if needed
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

    // ✅ Extract query values for modal
    const success = req.query.success === 'true';
    const tokenNumber = req.query.token || null;
    const qrImage = req.query.qr || null;

    // ✅ Render salon service page (not hospital_service)
    res.render('salon_service', {
      salon,
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
      locationMapUrl: salon.locationMapUrl,
      userHasActiveToken
    });

  } catch (error) {
    console.error("Error fetching salon:", error);
    res.status(500).send("Internal Server Error");
  }
};

// ✅ EXPORT the new salon controller
exports.getSalonDetails = getSalonDetails;






// 👉 Serve a salon token
const serveSalonToken = async (req, res) => {
  const tokenId = req.params.id;
  const io = req.app.get('io');

  try {
    // ✅ Step 1: Mark this token as "served"
    const token = await Token.findByIdAndUpdate(tokenId, {
      status: 'served',
      servedAt: new Date()
    }, { new: true });

    if (!token) return res.status(404).send('Token not found');

    const adminId = token.adminId.toString();

    // ✅ Step 2: Fetch updated queue of waiting tokens for this admin (salon)
    const updatedQueue = await Token.find({ adminId, status: 'waiting' }).sort({ serialNumber: 1 });

    // ✅ Step 3: Calculate stats — total served, people in queue, estimated wait time
    const tokensServed = await Token.countDocuments({ adminId, status: 'served' });
    const peopleInQueue = updatedQueue.length;

    // 🧮 Get the latest served token for salon
    const latestServed = await Token.findOne({ adminId, status: 'served' }).sort({ timestamp: -1 });
    const currentToken = latestServed?.serialNumber || 0;

    // 🧮 Fetch estimated wait time range from Admin config (salon-specific)
    const adminData = await Admin.findById(adminId);
    const estimatedRange = adminData.estimatedWaitTimeRange || "0–10 min";
    const [min, max] = estimatedRange.split("–").map(s => parseInt(s));
    const averageWait = (min + max) / 2;
    const estimatedWait = peopleInQueue * averageWait;

    // ✅ Step 4: Emit WebSocket updates to salon dashboard
    io.to(adminId).emit('queueUpdate', updatedQueue);

    // 🔔 Token served update
    io.to(adminId).emit('tokenUpdate', {
      type: 'completed',
      message: `Salon Token #${token.serialNumber} completed`
    });

    // 🎯 Now serving token update
    io.to(adminId).emit('tokenUpdate', {
      type: 'now',
      message: `Now serving Salon Token #${currentToken}`
    });

    // 📊 Update stats for salon dashboard
    io.to(adminId).emit('queueStatsUpdate', {
      tokensServed,
      peopleInQueue,
      estimatedWait
    });

    // 👉 Let frontend know the next waiting token ID
    const nextWaiting = await Token.findOne({ adminId, status: 'waiting' }).sort({ serialNumber: 1 });
    io.to(adminId).emit("currentWaitingTokenUpdate", {
      tokenId: nextWaiting?._id.toString() || null
    });

    // 🔁 Optional: Public-facing stats emit (if salonService.ejs uses this)
    io.emit('queueUpdate', {
      salonId: token.salonId?.toString(), // Optional: Only if salonId used
      tokenCount: peopleInQueue,
      estimatedWaitTime: estimatedWait
    });

    // 👈 Redirect back to salon dashboard
    res.redirect('/salon-dashboard');

  } catch (err) {
    console.error('Error in serveSalonToken:', err);
    res.status(500).send("Server Error");
  }
};

exports.serveSalonToken = serveSalonToken;
