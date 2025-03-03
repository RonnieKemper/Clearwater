var express = require('express');
var models = require('../models');
var authService = require('../services/auth');
var router = express.Router();
const { body, validationResult } = require('express-validator');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// GET home page
router.get('/', function (req, res, next) {
  res.render('index', { title: 'Express' });
});

router.post('/signup', async function (req, res, next) {
  try {
    const verificationToken = crypto.randomBytes(32).toString('hex');

    const [user, created] = await models.cwCustomers.findOrCreate({
      where: {
        Username: req.body.username,
      },
      defaults: {
        FirstName: req.body.firstName,
        LastName: req.body.lastName,
        Username: req.body.username,
        Email: req.body.email,
        Password: authService.hashPassword(req.body.password),
        phonenumber: req.body.phonenumber,
        zip: req.body.zip,
        IsVerified: false,
        VerificationToken: verificationToken,
      },
    });

    if (created) {
      const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
          user: 'ronspoolco@gmail.com',
          pass: 'zvec xzid ztzu rzjw', // Replace with environment variables in production
        },
      });

      // Point verification URL to frontend route
      const verificationUrl = `http://71.72.230.163:4200/verify-email?token=${verificationToken}`;
      await transporter.sendMail({
        from: 'ronspoolco@gmail.com',
        to: req.body.email,
        subject: 'Email Verification',
        html: `<p>Please verify your email by clicking <a href="${verificationUrl}">here</a>.</p>`,
      });

      res.status(201).send({ account_creation: 'success', message: 'Account created. Please verify your email.' });
    } else {
      res.status(409).send({ account_creation: 'failure', message: 'Username already exists' });
    }
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      res.status(409).send({ account_creation: 'failure', message: 'Duplicate entry detected' });
    } else {
      console.error(error);
      res.status(500).send({ account_creation: 'failure', message: 'Internal server error' });
    }
  }
});

// GET /verify-email
router.post('/verify-email', async function (req, res, next) {
  const { token } = req.body; // Extract token from request body
  console.log("API endpoint hit");
  console.log('Cookies:', req.cookies); // Log cookies for debugging
  console.log('Body:', req.body);       // Log request body

  try {
    // Check if the token is provided
    if (!token) {
      console.log('Missing token in the request');
      return res.status(400).send({ message: 'Missing token' });
    }

    // Attempt to find the user by the token
    console.log('Searching for user with token:', token);
    const user = await models.cwCustomers.findOne({ where: { VerificationToken: token } });

    if (!user) {
      console.log('Invalid or expired token:', token);
      return res.status(400).send({ message: 'Invalid or expired token.' });
    }

    // Update the user's verification status
    user.IsVerified = true;
    user.VerificationToken = null;
    await user.save();

    console.log('Email verified for user:', user.Username);
    return res.send({ message: 'Email successfully verified! You can now log in.' });
  } catch (error) {
    // Handle unexpected errors
    console.error('Error during email verification:', error);
    return res.status(500).send({ message: 'Internal server error' });
  }
});




// POST /login with verification check
router.post('/login', async function (req, res, next) {
  try {
    const user = await models.cwCustomers.findOne({
      where: {
        Username: req.body.username,
      },
    });

    if (!user) {
      return res.status(401).send({ message: 'User not found' });
    }

    if (!user.IsVerified) {
      return res.status(403).send({ message: 'Please verify your email before logging in.' });
    }

    const passwordMatch = authService.comparePasswords(req.body.password, user.Password);

    if (passwordMatch) {
      const token = authService.signUser(user);
      res.cookie('jwt', token);
      res.send({ Login: 'success' });
    } else {
      res.status(401).send({ message: 'Invalid password' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: 'Internal server error' });
  }
});

// GET /profile
router.get('/profile', function (req, res, next) {
  const token = req.cookies.jwt;
  if (token) {
    authService.verifyUser(token).then((user) => {
      if (user) {
        res.send(JSON.stringify(user));
      } else {
        res.status(401).send('Invalid authentication token');
      }
    });
  } else {
    res.status(401).send('Must be logged in');
  }
});

// GET /logout
router.get('/logout', function (req, res, next) {
  res.cookie('jwt', '', { expires: new Date(0) });
  res.send('Logged out');
});

module.exports = router;