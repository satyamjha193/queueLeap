

// authMiddleware.js
exports.isAdminLoggedIn = (req, res, next) => {
  // ⛔ Skip logging for static files or socket.io
  if (req.originalUrl.includes(".js") || req.originalUrl.includes(".css") || req.originalUrl.includes("socket.io")) {
    return next();
  }

  if (req.session && req.session.admin && req.session.admin._id) {
    console.log("✅ Admin session verified:", req.session.admin);
    return next();
  }

  console.log("⛔ No admin session.");
  return res.redirect("/login");
};























// ✅ For regular users (stored in req.session.user)
exports.isUser = (req, res, next) => {
  if (req.session && req.session.user && req.session.user._id) {
    return next();
  }
  return res.redirect("/login");
};

// ✅ For both user or admin access
exports.ensureAuthenticated = (req, res, next) => {
  if (req.session && (req.session.user || req.session.admin)) {
    return next();
  }
  req.flash("error_msg", "Please log in to continue.");
  return res.redirect("/login");
};

// ✅ Role-based check: only if role is admin
exports.isAdmin = (req, res, next) => {
  if (req.session.user && req.session.user.role === "admin") {
    return next();
  }
  return res.redirect("/login");
};

// ✅ Used after Google OAuth (optional)
exports.googleSessionCheck = (req, res, next) => {
  if (req.session && req.session.user) {
    return next();
  }
  return res.redirect("/login");
};



// middleware/noCache.js
const noCache = (req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
};

exports.noCache = noCache;
