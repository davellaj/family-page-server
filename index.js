const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const { DATABASE_URL, PORT, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } = require('./config')
const GoogleStrategy = require('passport-google-oauth20')
const passport = require('passport')
const BearerStrategy = require('passport-http-bearer')
const User = require('./models/user');

const HOST = process.env.HOST;

console.log(`Server running in ${process.env.NODE_ENV} mode` );

const app = express();
const jsonParser = bodyParser.json();

app.use(jsonParser);

app.all('/*', function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
  next();
});

mongoose.Promise = global.Promise;

//google auth
passport.use(new GoogleStrategy({
    clientID: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    callbackURL: '/auth/google/callback'
  },
  (accessToken, refreshToken, profile, cb) => {
    console.log("this is the profile photo", profile.photos[0].value)
    User.findOneAndUpdate({ googleId: profile.id },
          {
            $set: {
              googleId: profile.id,
              name: profile.name,
              userName: profile.displayName,
              email: profile.emails[0].value,
              picture: profile.photos[0].value,
              accessToken
            }
          },
          { upsert: true, new: true, setDefaultsOnInsert: true })
          .then(user => {
            console.log(user)
              cb(null, user);
          })
          .catch((err) => {
              console.log('catch error', err);
          });
    }
  ));

app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/', session: false }),
  (req, res) => {
    res.cookie('accessToken', req.user.accessToken, { expires: 0, httpOnly: false });
    // Successful authentication, redirect home.
    res.redirect('/');
  });

// passport bearer Strategy
passport.use(new BearerStrategy(
  (accessToken, done) => {
    User.findOne({
      accessToken
    }).then(user => {
      done(null, user, { scope: 'read' });
    }).catch(err => {
      done(err, null);
    });
  }
));

// get users homepage with authenticated route
app.get('/', passport.authenticate('bearer', { session: false }),
  (req, res) => {
    res.status(200).json({message: 'Hello from the server this route was protected'})
})

let server;

function runServer(callback) {
  return new Promise((resolve, reject) => {
    mongoose.connect(DATABASE_URL, err => {
      if (err && callback) {
        console.log(err);
        return callback(err);
      }
    });
    server = app.listen(PORT, HOST, () => {
      console.log(`Your app is listening on port ${PORT}`);
      if (callback) {
        callback();
      }
      resolve(server);
    }).on('error', err => {
      reject(err);
    });
  });
}

function closeServer() {
  return new Promise((resolve, reject) => {
    console.log('Closing server');
    server.close(err => {
      if (err) {
        reject(err);
        return;
      }
      resolve();
    });
  });
}

if (require.main === module) {
  runServer();
}

module.exports = app;
