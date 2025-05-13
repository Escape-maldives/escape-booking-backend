const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// PostgreSQL connection using environment variable
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Required for Railway hosted PostgreSQL
  }
});

// Health check route
app.get('/', (req, res) => {
  res.send('Escape Speedboat Booking API is running');
});

// POST: Create new booking
app.post('/api/bookings', async (req, res) => {
  const { name, route, departureDate, departureTime, pax } = req.body;

  if (!name || !route || !departureDate || !departureTime || !pax) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO bookings (name, route, departure_date, departure_time, pax) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, route, departureDate, departureTime, pax]
    );

    res.status(201).json({ success: true, booking: result.rows[0] });
  } catch (err) {
    console.error('Error saving booking:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET: All bookings (optional testing route)
app.get('/api/bookings', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM bookings ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
