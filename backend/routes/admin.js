const express = require('express');
const router = express.Router();
const { createProduct, updateProduct, deleteProduct, getAllOrders } = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/auth');

router.use(protect, adminOnly);

router.post('/products', createProduct);
router.put('/products/:id', updateProduct);
router.delete('/products/:id', deleteProduct);
router.get('/orders', getAllOrders);

module.exports = router;
