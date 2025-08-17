const mongoose = require('mongoose');

// Replace with your actual user model path
const User = require('./models/user_schema'); 

// Replace with your actual MongoDB connection URI
const MONGODB_URI = process.env.MONGO_URI; 

async function dropIndexes() {
  try {
    // Connect to MongoDB, wait for connection success
    await mongoose.connect(`mongodb://localhost:27017/queueDB`, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Try dropping the indexes, ignore if they don't exist
    const indexesToDrop = ['phone_1', 'googleId_1', 'email_1'];
    for (const indexName of indexesToDrop) {
      try {
        await User.collection.dropIndex(indexName);
        console.log(`✅ Dropped index: ${indexName}`);
      } catch (err) {
        if (err.codeName === 'IndexNotFound') {
          console.log(`ℹ️ Index not found (skipped): ${indexName}`);
        } else {
          throw err; // unexpected error, throw it
        }
      }
    }

    // Disconnect cleanly
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');

    process.exit(0); // success exit
  } catch (error) {
    console.error('❌ Error dropping indexes:', error);
    process.exit(1); // failure exit
  }
}

// Run the script
dropIndexes();
