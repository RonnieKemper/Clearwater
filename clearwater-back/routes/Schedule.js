const express = require('express');
const bodyParser = require('body-parser');
const app = express();

// Middleware to parse JSON bodies
app.use(bodyParser.json());

// Route to book an appointment
app.post('/book-appointment', (req, res) => {
  const { time, day, month, year } = req.body;

  if (!time || !day || !month || !year) {
    return res.status(400).send({ message: 'Invalid data' });
  }

  // Here, you would save the appointment to the database or take further action
  console.log(`Appointment booked for ${time} on ${day} ${month}, ${year}`);

  // Send response
  res.status(200).send({ message: 'Appointment booked' });
});

// Start the server
app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
