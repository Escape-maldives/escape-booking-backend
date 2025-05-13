const express = require("express");
const fs = require("fs");
const path = require("path");
const nodemailer = require("nodemailer");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;
app.use(cors());
app.use(express.json());

const BOOKINGS_FILE = path.join(__dirname, "bookings.json");

function readBookings() {
  if (!fs.existsSync(BOOKINGS_FILE)) return [];
  return JSON.parse(fs.readFileSync(BOOKINGS_FILE, "utf8"));
}

function writeBookings(data) {
  fs.writeFileSync(BOOKINGS_FILE, JSON.stringify(data, null, 2));
}

app.post("/api/bookings", (req, res) => {
  const data = req.body;

  if (!data.name || !data.email || !data.departureDate || !data.departureTime || !data.route || !data.pax) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const bookings = readBookings();

  const filtered = bookings.filter(b =>
    b.route === data.route &&
    b.departureDate === data.departureDate &&
    b.departureTime === data.departureTime
  );

  const totalPax = filtered.reduce((sum, b) => sum + b.pax, 0);

  if (totalPax + data.pax > 28) {
    return res.status(400).json({ error: "Not enough seats available" });
  }

  const newBooking = { ...data, status: "pending", id: Date.now() };
  bookings.push(newBooking);
  writeBookings(bookings);

  // Send email to admin
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.ADMIN_EMAIL,
      pass: process.env.ADMIN_PASS
    }
  });

  const mailOptions = {
    from: process.env.ADMIN_EMAIL,
    to: process.env.ADMIN_EMAIL,
    subject: "New Speedboat Booking Request",
    html: `<h3>New Booking:</h3>
           <p><b>Name:</b> ${data.name}</p>
           <p><b>Email:</b> ${data.email}</p>
           <p><b>Route:</b> ${data.route}</p>
           <p><b>Date:</b> ${data.departureDate}</p>
           <p><b>Time:</b> ${data.departureTime}</p>
           <p><b>Pax:</b> ${data.pax}</p>
           <p><b>Total Price:</b> ${data.totalPrice}</p>`
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) console.error("Email error:", error);
    else console.log("Email sent:", info.response);
  });

  res.json({ success: true, booking: newBooking });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
