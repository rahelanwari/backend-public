const express = require('express');
const pool = require('./db');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Root route (voor de homepage)
app.get('/', (req, res) => {
  res.send('🎉 Supply5 backend is running! Use /api/products or /api/orders.');
});

// GET all products
app.get('/api/products', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM products');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

// POST new order
app.post('/api/orders', async (req, res) => {
  const { customer_id, items } = req.body;

  try {
    let total = 0;
    items.forEach(item => {
      total += item.price * item.quantity;
    });

    const orderResult = await pool.query(
      'INSERT INTO orders (customer_id, total_amount) VALUES ($1, $2) RETURNING id',
      [customer_id, total]
    );
    const order_id = orderResult.rows[0].id;

    for (const item of items) {
      await pool.query(
        'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)',
        [order_id, item.product_id, item.quantity, item.price]
      );
    }

    res.status(201).json({ message: 'Order placed', order_id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Order error' });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
