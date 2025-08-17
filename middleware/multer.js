



const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let folder = 'uploads/others/';
    if (file.fieldname === 'shopImage') {
      folder = 'uploads/shopImages/';
    } else if (file.fieldname === 'profilePic') {
      folder = 'uploads/adminDP/';
    }
    cb(null, folder);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const filename = `${Date.now()}-${file.fieldname}${ext}`;
    cb(null, filename);
  }
});

const fileFilter = function (req, file, cb) {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPG/PNG images allowed'), false);
  }
};

module.exports = multer({ storage, fileFilter });



