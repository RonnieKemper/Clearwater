var express = require('express');
var models = require('../models'); //<--- Add models
var authService = require('../services/auth'); //<--- Add authentication service
var router = express.Router();
const { body, validationResult } = require('express-validator');
const mysql = require('mysql2');
const { findAll } = require('sequelize/lib/model');
var passport = require('../services/passport'); // <--- Add this code
/* GET home page. */

router.get('/', function (req, res, next) {
  res.render('index', { title: 'Express' });
});


router.post('/signup', function (req, res, next) {
  models.cwCustomers
    .findOrCreate({
      where: {
        Username: req.body.username
      },
      defaults: {

        FirstName: req.body.firstName,
        LastName: req.body.lastName,
        Username: req.body.Username,
        Email: req.body.email,
        Password: authService.hashPassword(req.body.password), //<--- Change to this code here
        phonenumber: req.body.phonenumber,
        zip: req.body.zip
      }
    })
    .then(function (result, created) {
      //console.log(result)
      console.log(result[1])
      //console.log(created)
      // if (result.cwCustomers.isNewRecord == 'True') {
      //   res.json({account_creation: 'success'});
      // }
      if (result[1] == false) {
        res.send({account_creation: 'failure'});
        
      }
      if (result[1] == true) {
        //res.setHeader('Content-Type', 'application/json');
        //res.send(JSON.stringify(actorsFound));
        //res.send('User successfully created');
        res.send({account_creation: 'success'});
      } 

    });
});

router.get('/login', function (req, res, next) {
  res.render('login');
});

router.post('/login', function (req, res, next) {
  //console.log(req);
  //console.log(req.body.g);
  //console.log(req.body.creds);
  console.log(req.body.username);
  console.log(req.body.password);
  models.cwCustomers
    .findOne({
      where: {
        Username: req.body.username,
      },
    })
    .then((user) => {
      if (!user) {
        console.log('User not found');
        return res.status(401).json({
          message: 'Login Failed',
        });
      } else {
        let passwordMatch = authService.comparePasswords(
          req.body.password,
          user.Password
        );
        if (passwordMatch) {
          let token = authService.signUser(user);
          res.cookie('jwt', token);
          console.log(token);
          res.send({Login: 'success'});
          
          //res.send(router.get('/profile'))
        } else {
          console.log('Wrong password');
          res.send('Wrong password');
        }
      }
    });
});
// router.post('/login', passport.authenticate('local', { failureRedirect: '/users/login' }),
//   function (req, res, next) { res.redirect('profile') });  //<--- Called Without UserID

router.get('/profile', function (req, res, next) {
  let token = req.cookies.jwt;
  if (token) {
    authService.verifyUser(token).then((user) => {
      if (user) {
        res.send(JSON.stringify(user));
      } else {
        res.status(401);
        res.send('Invalid authentication token');
      }
    });
  } else {
    res.status(401);
    res.send('Must be logged in');
  }
});
// router.get('/profile', function (req, res, next) {
//   if (req.user) {
//     models.users
//       .findByPk(parseInt(req.user.Userid))
//       .then(user => {
//         if (user) {
//           res.render('profile', {
//             FirstName: user.FirstName,
//             LastName: user.LastName,
//             Email: user.Email,
//             Username: user.Username
//           });
//         } else {
//           res.send('User not found');
//         }
//       });
//   } else {
//     res.redirect('login');
//   }
// });


// router.get('/profile/:id', function (req, res, next) {
//   models.users
//     .findByPk(parseInt(req.params.id))
//     .then(user => {
//       if (user) {
//         res.render('profile', {
//           FirstName: user.FirstName,
//           LastName: user.LastName,
//           Email: user.Email,
//           Username: user.Username
//         });
//       } else {
//         res.send('User not found');
//       }
//     });
// });

router.get('/logout', function (req, res, next) {
  res.cookie('jwt', '', { expires: new Date(0) });
  res.send('Logged out');
});

router.get('/profile/:id', authService.verifyUser, function(req, res, next) {
  if (!req.isAuthenticated()) {
    return res.send('You are not authenticated');
  }
  if (req.params.id !== String(req.user.UserId)) {
    res.send('This is not your profile');
  } else {
    let status;
    if (req.user.Admin) {
      status = 'Admin';
    } else {
      status = 'Normal user';
    }

    res.render('profile', {
      FirstName: req.user.FirstName,
      LastName: req.user.LastName,
      Email: req.user.Email,
      UserId: req.user.UserId,
      Username: req.user.Username,
      Status: status
    });
  }
});
router.post('/book-appointment', (req, res, next) => {
  // Destructuring the data received in the request body
  const { time, day, month, year } = req.body;

  // Check if all necessary fields (time, day, month, year) are provided
  if (!time || !day || !month || !year) {
    // If any field is missing, return a 400 status with an error message
    return res.status(400).send({ message: 'Invalid data, all fields are required.' });
  }

  // Format the response message with the provided data
  const appointmentMessage = `Appointment booked for ${time} on ${day} ${month}, ${year}`;

  // Send the response with status 200 and the formatted appointment message
  return res.status(200).send({ message: appointmentMessage });
});


router.get('musician-roster')
router.get('create-band')
router.get('create-project')
// router.post('/login', passport.authenticate('local', {
//   failureRedirect: '/users/login'
//   }),
//   function (req, res, next) {
//     res.redirect('profile/' + req.user.UserId);
// });
// module.exports = router;
// Route to book an appointment


module.exports = router;
