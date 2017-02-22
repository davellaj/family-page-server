const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const passport = require('passport');
const cors = require('cors');
const BearerStrategy = require('passport-http-bearer').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;

const Messages = require('./models/messages');
const User = require('./models/user');

dotenv.config();

const frontendUrl = process.env.FRONTEND_URL;

mongoose.Promise = global.Promise;

// Prepend timestamp to all `logs`
const log = (...args) => console.log(new Date().toISOString(), ...args);

log(`Server running in ${process.env.NODE_ENV} mode`);

const app = express();
app.use(cors());
app.use(bodyParser.json());

// ===== AUTH =====

passport.use(new BearerStrategy(
  (accessToken, done) => {
    if (!accessToken) {
      throw new Error({ message: 'Invalid or missing accessToken' });
    }
    User.findOne({ accessToken })
    .then((user) => {
      log(`userId: ${user._id}`);
      done(null, user, { scope: 'read' });
    })
    .catch((err) => {
      log(`Passport bearer error: ${err}`);
      done(err, null);
    });
  }
));

passport.use(new GoogleStrategy({
  clientID: process.env.CLIENTID,
  clientSecret: process.env.CLIENTSECRET,
  callbackURL: `${process.env.BACKEND_URL}/auth/google/callback`
}, (accessToken, refreshToken, profile, done) => {
  log(`accessToken: ${accessToken}`);
  User.findOneAndUpdate({
    googleId: profile.id
  }, {
    $set: {
      googleId: profile.id,
      nickname: profile.name.givenName || '',
      userName: profile.displayName || '',
      email: profile.emails[0].value || '',
      avatar: profile.photos[0].value || '',
      accessToken
    }
  }, {
    upsert: true, new: true, setDefaultsOnInsert: true
  })
  .then((user) => {
    log(`userId: ${user._id}`);
    done(null, user);
  })
  .catch((err) => {
    log(err);
  });
}));

app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get('/auth/google/callback',
  passport.authenticate('google',
    { failureRedirect: frontendUrl, session: false }
  ), ({ user }, res) => {
    log(`userId: ${user._id}`);
    res.redirect(`${frontendUrl}/#/app?token=${user.accessToken}`);
  }
);

app.get('/auth/logout', (req, res) => {
  req.logout();
  res.redirect(frontendUrl);
});

// ===== MESSAGES =====

app.get('/messages',
  passport.authenticate('bearer', { session: false }),

  ({ user }, res) => {
    log('GET /messages/');

    Messages.find().sort({ date: -1 })
    .then(messages =>
      res.json({
        currentUser: user._id,
        currentAvatar: user.avatar,
        currentNickname: user.nickname,
        messages: messages.map(message =>
          Object.assign(message, {
            comments: message.comments
              .filter(comment =>
                user._id.equals(comment.from) || user._id.equals(comment.to)
              )
              .sort((x, y) => new Date(x.date) - new Date(y.date))
          })
        ),
      })
    );
  }
);

app.post('/messages',
  passport.authenticate('bearer', { session: false }),
  ({ user, body }, res) => {
    log(`POST /messages, body: ${body}`);

    Messages.create(Object.assign(body, { userId: user._id }))
    .then(({ _id }) => {
      res.status(201).json({ _id });
    })
    .catch((err) => {
      log(`Err: ${err}`);
      res.sendStatus(404);
    });
  }
);

app.delete('/messages/:messageId',
  passport.authenticate('bearer', { session: false }),

  ({ user, params: { messageId } }, res) => {
    log(`DELETE /messages/${messageId}`);

    Messages.findOne({ _id: messageId, userId: user._id })
      .then((result) => {
        if (result) {
          result.remove();
          res.sendStatus(200);
        } else {
          res.sendStatus(404);
        }
      })
      .catch((err) => {
        console.error(err);
        res.sendStatus(404);
      });
  }
);

// ===== MEMBERS =====

app.get('/members', passport.authenticate('bearer', { session: false }),
  (req, res) => {
    log('GET /members');

    // When multiple families implemented, limit find to current family
    User.find({}, { accessToken: 0, __v: 0, googleId: 0 })

    .then(users => res.json(users))

    .catch((err) => {
      console.error(err);
      res.sendStatus(400);
    });
  }
);

// ===== CURRENT USER =====
// limited functionality now; to be used for multiple families functionality

app.get('/user', passport.authenticate('bearer', { session: false }),
  ({ user }, res) =>
    res.json({
      currentUser: {
        id: user._id,
        avatar: user.avatar,
        nickname: user.nickname,
        fullname: user.userName,
      }
    })
);

// ===== COMMENTS =====

app.post('/comments', passport.authenticate('bearer', { session: false }),
  ({ body, user }, res) => {
    log(`POST /comments/:${body.messageId}`);

    Messages.update(
      { _id: body.messageId },
      { $push: { comments: {
        from: user._id,
        to: body.to,
        text: body.text,
      } } }
    )

    .then((data) => {
      if (data.nModified > 0) {
        res.sendStatus(200);
      } else {
        res.sendStatus(404);
      }
    })

    .catch((err) => {
      console.error(err);
      res.sendStatus(404);
    });
  }
);

app.delete('/comments/:messageId/:commentId',
  passport.authenticate('bearer', { session: false }),
  ({ user, params: { messageId, commentId } }, res) => {
    log(`DELETE /comments/:${messageId}/:${commentId}`);

    Messages.update(
      { _id: messageId },
      { $pull: { comments: { _id: commentId, from: user._id } } }
    )
    .then((status) => {
      if (status.nModified > 0) {
        res.sendStatus(202);
      } else {
        res.sendStatus(404);
      }
    })
    .catch((err) => {
      console.error(err.message);
      return res.sendStatus(404);
    });
  }
);

// ===== SERVER =====

let server;

function runServer(callback) {
  return new Promise((resolve, reject) => {
    mongoose.connect(process.env.DATABASE_URL, (err) => {
      if (err && callback) {
        log(err);
        return callback(err);
      }
      return null;
    });
    server = app.listen(process.env.PORT, process.env.HOST, () => {
      log(`Your app is listening on port ${process.env.PORT}`);
      if (callback) {
        callback();
      }
      resolve(server);
    }).on('error', (err) => {
      reject(err);
    });
  });
}

function closeServer() {
  return new Promise((resolve, reject) => {
    log('Closing server');
    server.close((err) => {
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

module.exports = { app, runServer, closeServer };
