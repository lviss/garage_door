var express = require('express')
  , passport = require('passport')
  , GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;

var JwtStrategy = require('passport-jwt').Strategy
var jwt = require('jsonwebtoken');
var cookieParser = require('cookie-parser');
var cookieparser = require('cookieparser');

var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

// load config from file
var fs = require('fs');
var config = JSON.parse(fs.readFileSync('config.json', 'utf8'));

// an object to keep track of what we know about the garage door
var state = {
  door_open: false,
  unknown: true
};

//TODO read sensor data
state.unknown = false;

io.on('connection', function(socket) { // whenever a client connects
  if (socket.handshake.headers.cookie) {
    var token = cookieparser.parse(socket.handshake.headers.cookie).jwt;
    if(token) {
      jwt.verify(token, opts.secretOrKey, function(err, decoded) {
        if (!err) {
          socket.emit('state', state);
          socket.on('toggle door', function(){
            state.unknown = true;
            io.emit('state', state);
          });
        } else {
          socket.disconnect(); // not authenticated
        }
      });
    } else {
      socket.disconnect(); // not authenticated
    }
  } else {
    socket.disconnect(); // not authenticated
  }
});

// set up our authentication methods (google and jwt).
var opts = {
  jwtFromRequest: function(req) {
    var token = null;
    if (req && req.cookies)
    {
        token = req.cookies['jwt'];
    }
    return token;
  },
  secretOrKey: 'Oequeit4quaKaiYi'
};
passport.use(new JwtStrategy(opts, function(jwt_payload, done) {
  done(null, jwt_payload);
}));
passport.use(new GoogleStrategy(config.google_auth, function(accessToken, refreshToken, profile, done) {
    return done(null, profile);
  }
));

app.use(cookieParser());
app.use(passport.initialize());

// set up pages handled by webserver
app.get('/auth/google', passport.authenticate('google', { scope: ['profile'], session: false }));

app.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/auth/google', session: false }), function(req, res) {
  if (config.allowed_user_ids.indexOf(req.user.id) != -1) { // if this user is whitelisted in the config
    // Successful authentication, redirect home.
    var token = jwt.sign({ user: { name: req.user.displayName }}, opts.secretOrKey, {
      expiresIn: 10080 // in seconds
    });
    res.cookie('jwt', token, { maxAge: 900000, httpOnly: true });
    res.redirect('/');
  } else {
    // not in our allowed list
    res.status(402).send('unauthorized.');
  }
});

app.use( "/", [ passport.authenticate('jwt', { session: false, failureRedirect: '/auth/google' }), express.static( __dirname + "/public" ) ] );

http.listen(config.web_port);
console.log('listening.');

// set up another express instance to listen on another port which recieves sensor data.
var sensor_app = express();
sensor_app.get('/doorstatus', function(req, res) {
  state.door_open = req.query.open && req.query.open == 'true';
  state.unknown = false;
  io.emit('state', state);
  res.status(200).send();
});
var sensor_http = require('http').Server(sensor_app);
sensor_http.listen(config.sensor_port);
