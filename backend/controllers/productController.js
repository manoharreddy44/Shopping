import Product from '../models/Product.js';
import { deleteImageFromS3 } from '../middleware/uploadMiddleware.js';

// Get all products
export const getProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    let query = {};

    // Filter by active status
    if (req.query.isActive !== undefined) {
      query.isActive = req.query.isActive === 'true';
    }

    // Search by keyword
    if (req.query.keyword) {
      query.$or = [
        { name: { $regex: req.query.keyword, $options: 'i' } },
        { description: { $regex: req.query.keyword, $options: 'i' } }
      ];
    }

    // Filter by category
    if (req.query.category) {
      query.category = req.query.category;
    }

    // Filter by price range
    if (req.query.minPrice || req.query.maxPrice) {
      query.price = {};
      if (req.query.minPrice) query.price.$gte = parseFloat(req.query.minPrice);
      if (req.query.maxPrice) query.price.$lte = parseFloat(req.query.maxPrice);
    }

    // Filter by rating
    if (req.query.rating) {
      query.ratings = { $gte: parseFloat(req.query.rating) };
    }

    // Get featured products only
    if (req.query.isFeatured) {
      query.isFeatured = true;
    }

    console.log('Product query:', query); // Add logging to see the query being used

    const products = await Product.find(query)
      .populate('seller', 'name email')
      .skip(skip)
      .limit(limit)
      .sort(req.query.sort || '-createdAt');

    const total = await Product.countDocuments(query);

    res.status(200).json({
      success: true,
      products,
      page,
      pages: Math.ceil(total / limit),
      total
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      message: 'Error getting products',
      error: error.message
    });
  }
};

// Get single product
export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('seller', 'name email')
      .populate('reviews.user', 'name email');

    if (!product) {
      return res.status(404).json({
        message: 'Product not found'
      });
    }

    res.status(200).json({
      success: true,
      product
    });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({
      message: 'Error getting product',
      error: error.message
    });
  }
};

// Create product
export const createProduct = async (req, res) => {
  try {
    console.log('Request body:', req.body);
    console.log('User:', req.user);
    
    // Validate required fields
    if (!req.body.name || !req.body.description || !req.body.price || !req.body.category) {
      console.log('Missing required fields');
      return res.status(400).json({
        message: 'Please provide all required fields: name, description, price, category'
      });
    }

    // Validate images
    if (!req.body.images || !req.body.images.length) {
      console.log('Missing images');
      return res.status(400).json({
        message: 'Please provide at least one product image'
      });
    }

    // Set seller
    req.body.seller = req.user.id;
    
    console.log('Creating product with data:', req.body);
    const product = await Product.create(req.body);
    console.log('Product created:', product);

    res.status(201).json({
      success: true,
      product
    });
  } catch (error) {
    // Delete uploaded images if product creation fails
    if (req.body.images) {
      for (const image of req.body.images) {
        await deleteImageFromS3(image.key);
      }
    }

    console.error('Create product error:', error);
    res.status(500).json({
      message: 'Error creating product',
      error: error.message
    });
  }
};

// Update product
export const updateProduct = async (req, res) => {
  try {
    let product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        message: 'Product not found'
      });
    }

    // Check ownership
    if (product.seller.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        message: 'You can only update your own products'
      });
    }

    // Handle image updates
    if (req.body.images) {
      // Delete old images from S3
      for (const image of product.images) {
        await deleteImageFromS3(image.key);
      }
    }

    product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    res.status(200).json({
      success: true,
      product
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({
      message: 'Error updating product',
      error: error.message
    });
  }
};

// Delete product
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        message: 'Product not found'
      });
    }

    // Check ownership
    if (product.seller.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        message: 'You can only delete your own products'
      });
    }

    // Delete images from S3
    for (const image of product.images) {
      await deleteImageFromS3(image.key);
    }

    await product.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({
      message: 'Error deleting product',
      error: error.message
    });
  }
};

// Create/Update review
export const createProductReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;

    const review = {
      user: req.user._id,
      rating: Number(rating),
      comment
    };

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        message: 'Product not found'
      });
    }

    const isReviewed = product.reviews.find(
      r => r.user.toString() === req.user._id.toString()
    );

    if (isReviewed) {
      product.reviews.forEach(review => {
        if (review.user.toString() === req.user._id.toString()) {
          review.comment = comment;
          review.rating = rating;
        }
      });
    } else {
      product.reviews.push(review);
      product.numOfReviews = product.reviews.length;
    }

    product.ratings = product.reviews.reduce((acc, item) => item.rating + acc, 0) / product.reviews.length;

    await product.save();

    res.status(200).json({
      success: true
    });
  } catch (error) {
    console.error('Review error:', error);
    res.status(500).json({
      message: 'Error creating review',
      error: error.message
    });
  }
};

// Get product reviews
export const getProductReviews = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('reviews.user', 'name email');

    if (!product) {
      return res.status(404).json({
        message: 'Product not found'
      });
    }

    res.status(200).json({
      success: true,
      reviews: product.reviews
    });
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({
      message: 'Error getting reviews',
      error: error.message
    });
  }
};

// Delete review
export const deleteReview = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        message: 'Product not found'
      });
    }

    const reviews = product.reviews.filter(
      review => review._id.toString() !== req.query.reviewId.toString()
    );

    const ratings = reviews.length === 0 ? 0 : reviews.reduce((acc, item) => item.rating + acc, 0) / reviews.length;

    await Product.findByIdAndUpdate(
      req.params.id,
      {
        reviews,
        ratings,
        numOfReviews: reviews.length
      },
      {
        new: true,
        runValidators: true
      }
    );

    res.status(200).json({
      success: true
    });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({
      message: 'Error deleting review',
      error: error.message
    });
  }
};

// Get seller products
export const getSellerProducts = async (req, res) => {
  try {
    const products = await Product.find({ seller: req.user.id })
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      products
    });
  } catch (error) {
    console.error('Get seller products error:', error);
    res.status(500).json({
      message: 'Error getting seller products',
      error: error.message
    });
  }
}; 