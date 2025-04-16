// middleware/fileUpload.js
const multer = require("multer");
const path = require("path");
const { ValidationError } = require("../exceptions/errors");

// Use memory storage for Supabase
const memoryStorage = multer.memoryStorage();

// File size limits
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB for all uploads

// File filter for message attachments
const messageFileFilter = (req, file, cb) => {
  const allowedTypes = [
    "application/pdf", // .pdf
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
    "application/vnd.openxmlformats-officedocument.presentationml.presentation", // .pptx
    "application/msword", // .doc
    "application/vnd.ms-powerpoint", // .ppt
    "application/vnd.ms-excel", // .xls
    "text/plain", // .txt
    "text/csv", // .csv
    "application/vnd.oasis.opendocument.text", // .odt
    "text/html", // .html, .htm
    "image/tiff", // .tiff
    "image/bmp", // .bmp
    "video/mp4", // .mp4
    "application/x-rar-compressed", // .rar
    "application/zip", // .zip
    "image/jpeg", // .jpeg
    "image/jpg", // .jpg
    "image/png", // .png
    "image/gif", // .gif
    "image/webp", // .webp
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new ValidationError(
        "Invalid file type. Only PDF, DOCX, XLSX, PPTX, DOC, PPT, XLS, TXT, CSV, ODT, HTML, TIFF, BMP, MP4, RAR, ZIP, and images are allowed."
      ),
      false
    );
  }
};

// File filter for images only
const imageFileFilter = (req, file, cb) => {
  const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new ValidationError(
        "Invalid file type. Only JPEG, JPG, PNG, GIF, and WEBP images are allowed."
      ),
      false
    );
  }
};

// Standard upload for message attachments
const upload = multer({
  storage: memoryStorage,
  fileFilter: messageFileFilter,
  limits: { fileSize: MAX_FILE_SIZE },
});

// Avatar upload
const avatarUpload = multer({
  storage: memoryStorage,
  fileFilter: imageFileFilter,
  limits: { fileSize: MAX_FILE_SIZE },
});

// Banner upload
const bannerUpload = multer({
  storage: memoryStorage,
  fileFilter: imageFileFilter,
  limits: { fileSize: MAX_FILE_SIZE },
});

module.exports = {
  upload,
  avatarUpload,
  bannerUpload,
  single: upload.single.bind(upload),
  array: upload.array.bind(upload),
  fields: upload.fields.bind(upload),
  none: upload.none.bind(upload),
};
