const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const BOOKINGS_FILE = path.join(__dirname, "bookings.json");

// Buchungen lesen
function readBookings() {
  if (!fs.existsSync(BOOKINGS_FILE)) return [];
  return JSON.parse(fs.readFileSync(BOOKINGS_FILE, "utf8"));
}

// Buchungen schreiben
function writeBookings(data) {
  fs.writeFileSync(BOOKINGS_FILE, JSON.stringify(data, null, 2));
}

// ✉️ Neue Buchung empfangen
app.post("/api/bookings", (req, res) => {
  const data = req.body;

  if (!data.name || !data.departureDate || !data.departureTime || !data.route || !data.pax) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const bookings = readBookings();
  bookings.push(data);
  writeBookings(bookings);

  res.status(201).json({ message: "Booking saved successfully" });
});

// 📅 Verfügbarkeit prüfen
app.get("/availability", (req, res) => {
  const { route, date, time } = req.query;

  if (!route || !date || !time) {
    return res.status(400).json({ error: "Missing query parameters" });
  }

  // Dummy-Logik zur Verfügbarkeit
  const maxCapacity = 12;
  const bookings = readBookings();

  const paxBooked = bookings
    .filter(b =>
      b.route === route &&
      b.departureDate === date &&
      b.departureTime === time
    )
    .reduce((total, b) => total + parseInt(b.pax), 0);

  const available = maxCapacity - paxBooked;

  res.json({
    route,
    date,
    time,
    paxBooked,
    paxAvailable: available > 0 ? available : 0
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
