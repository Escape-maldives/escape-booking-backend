const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// PostgreSQL config via Railway environment variable
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

// POST /api/bookings
app.post('/api/bookings', async (req, res) => {
  const { name, route, departureDate, departureTime, pax } = req.body;

  if (!name || !route || !departureDate || !departureTime || !pax) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const query = `
      INSERT INTO bookings (name, route, departure_date, departure_time, pax)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;
    const values = [name, route, departureDate, departureTime, pax];

    const result = await pool.query(query, values);
    res.status(201).json({ message: 'Booking saved', booking: result.rows[0] });
  } catch (error) {
    console.error('Error saving booking:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/', (req, res) => {
  res.send('Escape Booking Backend is running!');
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
