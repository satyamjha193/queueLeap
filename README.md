# QueueLeap 🚀
_A Digital Queue Management System_

QueueLeap is a web-based platform designed to eliminate long waiting lines in places like **hospitals, clinics, salons, pharmacies, and more**.  
Admins can manage their shops, track queues in real-time, and serve customers efficiently using digital tokens in the form of QR's.


---

## ✨ Features

- 📝 **Admin Registration & Login**
  - OTP verification during registration
  - Secure password hashing with `bcrypt`

- 📊 **Admin Dashboard**
  - Real-time queue tracking with Socket.io
  - Token management (waiting / served)
  - Weekly stats and charts for performance tracking
  - Shop status toggle (Open/Closed)
  - map to reach the shop

- 🏥 **Sector-specific Shops**
  - Hospitals, clinics, salons, and more
  - Support for "others" with custom sector names
  - Specialist info and estimated wait time

- 🔒 **Authentication & Sessions**
  - Express sessions for secure admin login
  - Protected routes with custom middleware

- 📧 **Email Notifications**
  - Welcome email sent on registration (via Nodemailer + Gmail)

- 🖼️ **Shop Profile**
  - Upload shop images
  - Manage profile settings

---

## 🛠️ Tech Stack

- **Backend:** Node.js, Express.js  
- **Frontend:** EJS templates, CSS ,js (optional for styling)  
- **Database:** MongoDB with Mongoose  
- **Authentication:** Express-session, OTP verification  
- **Real-time:** Socket.io  
- **Email Service:** Nodemailer (Gmail SMTP)  
- **Other Tools:** Multer (file uploads), Bcrypt (password hashing)  

---

## 🚀 Installation & Setup

### 1️⃣ Clone the repo
```bash
git clone https://github.com/satyamjha193/queueLeap.git
cd queueLeap



2️⃣ Install dependencies
npm install express mongoose express-session bcrypt nodemailer multer socket.io dotenv ejs connect-flash 





3️⃣ Setup environment variables

Create a .env file in the root directory:

PORT=3000
MONGO_URI=mongodb://localhost:27017/queueleap
SESSION_SECRET=yourStrongSecret
EMAIL_USER=yourEmail@gmail.com
EMAIL_PASS=yourAppPassword


4️⃣ Run the server
npm start

Server will run on: http://localhost:3000


📂 Project Structure
queueLeap/
│── controllers/       # Route controllers (admin, tokens, etc.)
│── models/            # Mongoose models (Admin, Hospital, Salon, Token, etc.)
│── middleware/        # Auth & session middleware
│── routes/            # Express routes
│── views/             # EJS templates for frontend
│── public/            # Static assets (CSS, JS, images)
│── uploads/           # Uploaded shop images
│── app.js             # Main Express app
│── package.json       
│── .env.example       # Example environment file
