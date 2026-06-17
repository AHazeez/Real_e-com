const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const env = require('../config/env');
const AppError = require('../utils/AppError');

const uploadPath = path.resolve(process.cwd(), env.uploadDir);
fs.mkdirSync(uploadPath, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadPath),
  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${crypto.randomBytes(12).toString('hex')}${extension}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
  const extension = path.extname(file.originalname).toLowerCase();

  if (!allowedMimeTypes.includes(file.mimetype) || !allowedExtensions.includes(extension)) {
    return cb(new AppError('Only JPG, PNG, and WEBP images are allowed', 400));
  }
  return cb(null, true);
};

const uploadProductImage = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: env.maxFileSizeMb * 1024 * 1024
  }
}).single('image');

module.exports = {
  uploadProductImage
};
