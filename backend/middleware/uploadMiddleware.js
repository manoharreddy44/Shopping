import multer from 'multer';
import multerS3 from 'multer-s3';
import { DeleteObjectCommand } from '@aws-sdk/client-s3';
import s3Client from '../config/s3.js';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: './config.env' });

// Configure multer for S3 upload
const upload = multer({
  storage: multerS3({
    s3: s3Client,
    bucket: process.env.AWS_BUCKET_NAME,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, 'products/' + uniqueSuffix + path.extname(file.originalname));
    }
  }),
  fileFilter: (req, file, cb) => {
    // Allow only images
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Not an image! Please upload only images.'), false);
    }
  },
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB limit
  }
});

// Middleware for handling multiple image uploads
const uploadProductImages = upload.array('images', 5); // Max 5 images

// Wrapper function to handle multer errors
export const handleProductImageUpload = (req, res, next) => {
  uploadProductImages(req, res, function (error) {
    if (error instanceof multer.MulterError) {
      // A Multer error occurred when uploading
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          message: 'File too large. Maximum size is 2MB'
        });
      }
      if (error.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({
          message: 'Too many files. Maximum is 5 images'
        });
      }
      return res.status(400).json({
        message: error.message
      });
    } else if (error) {
      // An unknown error occurred
      return res.status(400).json({
        message: error.message
      });
    }
    
    // Everything went fine
    if (req.files) {
      // Transform the files array to include only necessary information
      req.body.images = req.files.map(file => ({
        url: file.location,
        key: file.key
      }));
    }
    
    next();
  });
};

// Function to delete image from S3
export const deleteImageFromS3 = async (key) => {
  try {
    if (!key) {
      console.warn('No key provided for S3 deletion');
      return false;
    }

    const deleteCommand = new DeleteObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key
    });

    await s3Client.send(deleteCommand);
    return true;
  } catch (error) {
    console.error('Error deleting image from S3:', error);
    return false;
  }
}; 