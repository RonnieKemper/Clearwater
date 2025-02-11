var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
var logger = require('morgan');
var models = require('./models'); //<--- Add this line
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
//var ScheduleRouter = require('./routes/Schedule');
const https = require('https');
const { User } = require('./models'); // Import the User model
const cors = require("cors");
const redirectSSL = require('redirect-ssl');
//const scheduleRoutes = require('./routes/Schedule');

var app = express();
//view engine setup
// app.set('port', process.env.PORT || 3000);
// var server = app.listen(app.get('port'), function() {
//   console.log('Express server listening on port ' + server.address().port);
// });

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors());
// Import routes
// const scheduleRoutes = require('./routes/Schedule'); // Adjust path as needed
//app.use('.routes/Schedule', ScheduleRouter);

//app.use(redirectSSL);

app.enable('trust proxy')
app.use('/', indexRouter);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});
// Authenticate the user
app.use(async (req, res, next) => {
  const token = req.cookies['jwt'];
  if (token) {
    try {
      // Verify the JWT
      const decodedToken = jwt.verify(token, '<insert secret here>');

      // Check if the user exists in the database
      const user = await User.findOne({ username: decodedToken.username });
      if (user) {
        // The user exists, so allow the request to proceed
        next();
      } else {
        // The user does not exist, so return an error
        res.status(401).send({ error: 'Invalid JWT' });
      }
    } catch (err) {
      // The provided JWT is invalid, so return an error
      res.status(401).send({ error: 'Invalid JWT' });
    }
  } else {
    // No JWT was provided, so return an error
    res.status(401).send({ error: 'No JWT was provided' });
  }
});

// The API endpoint
// app.get('/api', (req, res) => {
//   // This route is only accessible if the user has been authenticated
//   res.send({
//     message: 'Hello from the API endpoint!'
//   });
// });


// app.use(function(request, response, next) {
//   const port = ":8080"
//   if (process.env.NODE_ENV != 'development' && !request.secure) {
//      return response.redirect("https://" + request.headers.host + port + request.url);
//   }

//   next();
// })

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  // res.header("Access-Control-Allow-Origin", "*") //
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});
// Start the server
// const port = 3000;
// https.createServer({
//   // Provide your HTTPS server options here (e.g. SSL certificates)
// }, app).listen(port, () => {
//   console.log(`Listening on port ${port}`);
// });
module.exports = app;
