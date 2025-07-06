import express from 'express';
import { body, validationResult } from 'express-validator';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import { isAuthenticatedUser, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

// Get logged in user orders => /api/orders/me
router.get('/me', isAuthenticatedUser, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .populate('orderItems.product', 'name price images')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      orders
    });
  } catch (error) {
    console.error('Get user orders error:', error);
    res.status(500).json({
      message: 'Error getting orders',
      error: error.message
    });
  }
});

// Get seller stats => /api/orders/seller/stats
router.get('/seller/stats', isAuthenticatedUser, authorizeRoles('seller', 'admin'), async (req, res) => {
  try {
    // Get seller's products
    const products = await Product.find({ seller: req.user._id });
    const productIds = products.map(product => product._id);

    // Get orders containing seller's products
    const orders = await Order.find({
      'orderItems.product': { $in: productIds }
    }).populate('orderItems.product');

    // Calculate stats
    let totalRevenue = 0;
    let totalOrders = 0;
    const customerSet = new Set();

    orders.forEach(order => {
      order.orderItems.forEach(item => {
        if (productIds.includes(item.product._id)) {
          totalRevenue += item.product.price * item.quantity;
          totalOrders += 1;
          customerSet.add(order.user.toString());
        }
      });
    });

    res.status(200).json({
      success: true,
      totalProducts: products.length,
      totalOrders,
      totalRevenue,
      totalCustomers: customerSet.size
    });
  } catch (error) {
    console.error('Get seller stats error:', error);
    res.status(500).json({
      message: 'Error getting seller stats',
      error: error.message
    });
  }
});

// Get seller's recent orders => /api/orders/seller/recent
router.get('/seller/recent', isAuthenticatedUser, authorizeRoles('seller', 'admin'), async (req, res) => {
  try {
    // Get seller's products
    const products = await Product.find({ seller: req.user._id });
    const productIds = products.map(product => product._id);

    // Get recent orders containing seller's products
    const orders = await Order.find({
      'orderItems.product': { $in: productIds }
    })
    .populate('orderItems.product')
    .populate('user', 'name email')
    .sort('-createdAt')
    .limit(10);

    // Format orders for response
    const formattedOrders = orders.map(order => ({
      _id: order._id,
      status: order.orderStatus,
      totalAmount: order.totalAmount,
      createdAt: order.createdAt,
      customer: {
        name: order.user.name,
        email: order.user.email
      },
      items: order.orderItems.filter(item => 
        productIds.includes(item.product._id)
      )
    }));

    res.status(200).json({
      success: true,
      orders: formattedOrders
    });
  } catch (error) {
    console.error('Get seller recent orders error:', error);
    res.status(500).json({
      message: 'Error getting recent orders',
      error: error.message
    });
  }
});

// Get all orders - ADMIN => /api/orders/admin/all
router.get('/admin/all', isAuthenticatedUser, authorizeRoles('admin'), async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('user', 'name email')
      .populate('orderItems.product', 'name price')
      .sort('-createdAt');

    let totalAmount = 0;
    orders.forEach(order => {
      totalAmount += order.totalAmount;
    });

    res.status(200).json({
      success: true,
      totalAmount,
      orders
    });
  } catch (error) {
    console.error('Get all orders error:', error);
    res.status(500).json({
      message: 'Error getting orders',
      error: error.message
    });
  }
});

// Create new order => /api/orders/new
router.post('/new', isAuthenticatedUser, [
  body('orderItems').isArray({ min: 1 }).withMessage('Order must contain at least one item'),
  body('shippingInfo.address').notEmpty().withMessage('Shipping address is required'),
  body('shippingInfo.city').notEmpty().withMessage('City is required'),
  body('shippingInfo.phoneNumber').notEmpty().withMessage('Phone number is required'),
  body('shippingInfo.postalCode').notEmpty().withMessage('Postal code is required'),
  body('shippingInfo.country').notEmpty().withMessage('Country is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { orderItems, shippingInfo, paymentInfo } = req.body;

    // Calculate total price
    let totalAmount = 0;
    for (const item of orderItems) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({
          message: `Product not found with id: ${item.product}`
        });
      }
      totalAmount += product.price * item.quantity;
    }

    const order = await Order.create({
      orderItems,
      shippingInfo,
      paymentInfo,
      totalAmount,
      user: req.user._id
    });

    res.status(201).json({
      success: true,
      order
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      message: 'Error creating order',
      error: error.message
    });
  }
});

// Update order status - ADMIN => /api/orders/admin/:id
router.put('/admin/:id', isAuthenticatedUser, authorizeRoles('admin'), async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        message: 'Order not found'
      });
    }

    if (order.orderStatus === 'Delivered') {
      return res.status(400).json({
        message: 'You have already delivered this order'
      });
    }

    // Update stock for each product
    for (const item of order.orderItems) {
      await updateStock(item.product, item.quantity);
    }

    order.orderStatus = req.body.status;
    order.deliveredAt = req.body.status === 'Delivered' ? Date.now() : null;

    await order.save();

    res.status(200).json({
      success: true,
      order
    });
  } catch (error) {
    console.error('Update order error:', error);
    res.status(500).json({
      message: 'Error updating order',
      error: error.message
    });
  }
});

// Get single order => /api/orders/:id
router.get('/:id', isAuthenticatedUser, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email')
      .populate('orderItems.product', 'name price images');

    if (!order) {
      return res.status(404).json({
        message: 'Order not found'
      });
    }

    // Check if user is authorized to view this order
    if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        message: 'You are not authorized to view this order'
      });
    }

    res.status(200).json({
      success: true,
      order
    });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({
      message: 'Error getting order',
      error: error.message
    });
  }
});

async function updateStock(productId, quantity) {
  const product = await Product.findById(productId);
  if (product) {
    product.stock = product.stock - quantity;
    await product.save({ validateBeforeSave: false });
  }
}

export default router; 