// Bring in the required libraries
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var models = require('../models');

// Configure the login validation
passport.use(
  'local',
  new LocalStrategy(function (username, password, done) {
    models.users.findOne({ where: { Username: username } })
      .then(user => {
        if (!user) {
          return done(null, false, { message: 'Incorrect username.' });
        }
        if (user.Password !== password) {
          return done(null, false, { message: 'Incorrect password.' });
        }
        return done(null, user);
      })
      .catch(err => {
        if (err) { return done(err); }
      });
  })
);

// Stores the user id in the user session
passport.serializeUser((user, callback) => {
  callback(null, user.UserId);
});

// Queries the database for the user details and adds to the request object in the routes
passport.deserializeUser((id, callback) => {
  models.users
    .findByPk(id)
    .then(user => callback(null, user))
    .catch(err => callback(err));
});

module.exports = passport;