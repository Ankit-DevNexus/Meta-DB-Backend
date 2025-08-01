// middleware/uploadMiddleware.js
import multer from "multer";

// Store in memory
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /\.(xlsx|xls|csv)$/i;
    if (!allowedTypes.test(file.originalname)) {
      return cb(new Error("Only Excel (.xlsx, .xls) or CSV files are allowed"));
    }
    cb(null, true);
  }
});

export default upload;
