// server.js

// ----------------------------
// 🌐 BASIC SETUP
// ----------------------------
const express = require("express");
const path = require("path");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const cors = require("cors");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const passport = require("passport");
const flash = require("connect-flash");
const http = require("http");
const dns = require("dns");
const fetch =  require("node-fetch")

// Load env variables from .env
dotenv.config();

// Initialize Express app and HTTP server
const app = express();
const server = http.createServer(app);

// ----------------------------
// 🔌 SOCKET.IO SETUP
// ----------------------------
const { Server } = require("socket.io");
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL,
    credentials: true,
  },
});
app.set("io", io);
global.io = io;

// ----------------------------
// 🔑 SESSION + AUTH CONFIG
// ----------------------------
const User = require("./models/user_schema");
require("./middleware/googleAuthStrategy");

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    rolling: true,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
      collectionName: "sessions",
    }),
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, // 1 day
      httpOnly: true,
      secure: false, // Set to true with HTTPS (production)
      // sameSite: "none", // uncomment when using HTTPS cross-domain
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

// Passport serialization
passport.serializeUser((user, done) => {
  done(null, user.id);
});
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

// ----------------------------
// 🧱 MIDDLEWARE
// ----------------------------

// Flash messages middleware
app.use(flash());
app.use((req, res, next) => {
  res.locals.flash = req.flash();
  next();
});

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS setup
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);

// Static file handling
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/shopImages", express.static(path.join(__dirname, "uploads/shopImages")));
app.use(express.static(path.join(__dirname, "public")));

// Set view engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Google Maps API key for views
app.locals.GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;


app.use((req, res, next) => {
  console.log("[LOG]", req.url);
  next();
});


// ----------------------------
// 📦 ROUTES
// ----------------------------
const adminRoutes = require("./routes/adminRoutes");
const queueRoutes = require("./routes/queueRoutes");
const salonQueueRoutes = require("./routes/salonQueueRoutes");
const userauthRoutes = require("./routes/userAuthRoute");

// For browser views
app.use("/", queueRoutes);
app.use("/", adminRoutes);
app.use("/", salonQueueRoutes);
app.use("/", userauthRoutes);

// For frontend API calls
app.use("/api", queueRoutes);
app.use("/api/admin", adminRoutes);

// ----------------------------
// 🌍 DATABASE CONNECTION
// ----------------------------
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));


// ----------------------------
// 🧠 SOCKET.IO LOGIC
// ----------------------------
const Admin = require("./models/admin_schema");

// Toggle shop status handler
const Hospital = require("./models/hospital_schema");
const Salon = require("./models/salon_schema");

const sectorModelMap = {
  hospital: Hospital,
  salon: Salon,
  // clinic: require('./models/clinic_schema'),
  // pharmacy: require('./models/pharmacy_schema'),
};

io.on("connection", (socket) => {
  console.log("🟢 Socket connected:", socket.id);

  // Attempt to join admin room if session exists
  const adminId = socket.handshake.session?.admin?._id;
  if (adminId) {
    socket.join(adminId);
    console.log(`Admin ${adminId} joined their socket room`);
  }

  // Admin manually joins room
  socket.on("joinRoom", (adminId) => {
    socket.join(adminId);
    console.log(`Socket ${socket.id} joined room ${adminId}`);
  });

  // Join admin room from client event
  socket.on("joinAdminRoom", (adminId) => {
    socket.join(adminId);
    console.log(`Admin ${adminId} joined room via client`);
  });

  // Admin updates notification preferences
  socket.on("updateNotificationPref", async ({ type, value }) => {
    if (!["email", "push", "sms", "report"].includes(type)) return;

    try {
      await Admin.findByIdAndUpdate(adminId, {
        $set: { [`notificationPreferences.${type}`]: value },
      });

      io.to(adminId).emit("prefUpdated", { type, value });
      console.log(`🔔 Preference updated: ${type} = ${value}`);
    } catch (err) {
      console.error("Socket update error:", err);
    }
  });

  // Admin toggles shop open/closed
  socket.on("adminToggleShopStatus", async ({ shopId, isOpen, sectorname }) => {
    console.log("📨 Toggle shop status request:", { shopId, isOpen, sectorname });

    try {
      const Model = sectorModelMap[sectorname?.toLowerCase()];
      if (!Model) return console.warn("❌ Invalid sector:", sectorname);

      const updatedShop = await Model.findByIdAndUpdate(
        shopId,
        { isOpen },
        { new: true }
      );

      if (!updatedShop) return console.warn("❌ Shop not found:", shopId);

      io.emit("shopStatusUpdate", {
        shopId: updatedShop._id.toString(),
        isOpen: updatedShop.isOpen,
      });

      console.log(
        `✅ [${sectorname}] ${updatedShop.shopname} is now ${isOpen ? "🟢 Open" : "🔴 Closed"}`
      );
    } catch (err) {
      console.error("❌ Toggle shop error:", err.message);
    }
  });

  // On disconnect
  socket.on("disconnect", () => {
    console.log("🔴 Socket disconnected:", socket.id);
  });
});





// Geocode API proxy
app.get("/api/geocode", async (req, res) => {
  try {
    const query = req.query.q;
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`,
      {
        headers: { "User-Agent": "QueueLeap/1.0 (admin@queueleap.com)" }, // required by Nominatim
      }
    );

    if (!response.ok) {
      return res
        .status(response.status)
        .json({ error: "Nominatim request failed" });
    }

    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error("Geocode error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});




// ----------------------------
// 🚀 START SERVER
// ----------------------------
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
