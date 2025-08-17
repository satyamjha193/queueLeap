const Admin = require('../models/admin_schema');
const Token = require('../models/token_schema'); // Make sure this is your token model

module.exports = function(io) {
  io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id);

    // When admin dashboard loads
    socket.on('joinAdminRoom', async (adminId) => {
      const admin = await Admin.findById(adminId);
      if (!admin) return;

      socket.join(adminId); // Join socket room for targeted updates

      // ✅ Get current queue from Token model
      const queue = await Token.find({
        adminId,
        status: 'pending' // or whatever you use ('inqueue', 'waiting', etc.)
      }).sort({ serialNumber: 1 });

      socket.emit('queueUpdate', queue);
    });

    // Triggered after user joins queue (via controller)
    socket.on('userJoinedQueue', async (adminId) => {
      if (!adminId) return;

      const queue = await Token.find({
        adminId,
        status: 'pending'
      }).sort({ serialNumber: 1 });

      io.to(adminId).emit('queueUpdate', queue);
    });
  });
};
