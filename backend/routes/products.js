const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Product = require('../models/product');

// Create product
router.post('/', auth, async (req, res) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json({
      status: 'success',
      data: product
    });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create product'
    });
  }
});

// Get all products
router.get('/', async (req, res) => {
  try {
    const products = await Product.findAll(req.query);
    res.json({
      status: 'success',
      data: products
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch products'
    });
  }
});

// Get product by ID
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        status: 'error',
        message: 'Product not found'
      });
    }
    res.json({
      status: 'success',
      data: product
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch product'
    });
  }
});

// Update product
router.put('/:id', auth, async (req, res) => {
  try {
    const product = await Product.update(req.params.id, req.body);
    if (!product) {
      return res.status(404).json({
        status: 'error',
        message: 'Product not found'
      });
    }
    res.json({
      status: 'success',
      data: product
    });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update product'
    });
  }
});

// Delete product
router.delete('/:id', auth, async (req, res) => {
  try {
    const productId = req.params.id;
    console.log('Attempting to delete product with ID:', productId);
    const deleted = await Product.delete(productId);
    if (!deleted) {
      console.log('Product not found for deletion:', productId);
      return res.status(404).json({
        status: 'error',
        message: 'Product not found'
      });
    }
    console.log('Successfully deleted product with ID:', productId);
    res.json({
      status: 'success',
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete product'
    });
  }
});

module.exports = router;