import express from 'express';
import { isAuthenticatedUser, authorizeRoles } from '../middleware/auth.js';
import { handleProductImageUpload, deleteImageFromS3 } from '../middleware/uploadMiddleware.js';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  createProductReview,
  getProductReviews,
  deleteReview,
  getSellerProducts
} from '../controllers/productController.js';

const router = express.Router();

// Public routes
router.get('/', getProducts);
router.get('/:id', getProductById);

// Protected routes
router.post('/new', isAuthenticatedUser, authorizeRoles('seller', 'admin'), handleProductImageUpload, createProduct);
router.put('/:id', isAuthenticatedUser, authorizeRoles('seller', 'admin'), handleProductImageUpload, updateProduct);
router.delete('/:id', isAuthenticatedUser, authorizeRoles('seller', 'admin'), deleteProduct);

// Review routes
router.put('/review/:id', isAuthenticatedUser, createProductReview);
router.get('/reviews/:id', getProductReviews);
router.delete('/reviews/:id', isAuthenticatedUser, deleteReview);

// Seller routes
router.get('/seller/products', isAuthenticatedUser, authorizeRoles('seller'), getSellerProducts);

export default router; 