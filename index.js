const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const passport = require('passport');
const BearerStrategy = require('passport-http-bearer').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;

const Messages = require('./models/messages');
const User = require('./models/user');

const HOST = process.env.HOST;

dotenv.config();

mongoose.Promise = global.Promise;

// Prepend timestamp to all `logs`
const log = (...args) => console.log(new Date().toISOString(), ...args);

log(`Server running in ${process.env.NODE_ENV} mode`);

const app = express();
app.use(bodyParser.json());

app.all('/*', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers',
    'Content-Type, '
    + 'Access-Control-Allow-Headers, '
    + 'Authorization, '
    + 'X-Requested-With'
  );
  next();
});

// ===== AUTH =====

passport.use(new BearerStrategy(
    (accessToken, done) => {
      log('token', accessToken);
      User.findOne({ accessToken })
      .then(user => done(null, user, { scope: 'read' }));
    }
));

passport.use(new GoogleStrategy({
  clientID: process.env.CLIENTID,
  clientSecret: process.env.CLIENTSECRET,
  callbackURL: 'http://localhost:8080/auth/google/callback'
}, (accessToken, refreshToken, profile, done) => {
  log('=======', accessToken);

  User.findOneAndUpdate({ googleId: profile.id },
    {
      $set: {
        googleId: profile.id,
        nickname: profile.name.givenName || '',
        userName: profile.displayName || '',
        email: profile.emails[0].value || '',
        avatar: profile.photos[0].value || '',
        accessToken
      }
    },
    { upsert: true, new: true, setDefaultsOnInsert: true })
    .then((user) => {
      log('user', user);
      done(null, user);
    })
    .catch((err) => {
      log(err);
    });
}));

app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: 'http://localhost:3000/', session: false }),
  ({ user }, res) => {
    log('req.user', user);
    res.cookie('accessToken', user.accessToken, { expires: 0 });
    res.redirect('http://localhost:3000/#/app');
  }
);

app.get('/auth/logout', (req, res) => {
  req.logout();
  res.redirect('http://localhost:3000/');
});

// ===== MESSAGES =====

app.get('/messages',
  passport.authenticate('bearer', { session: false }),
  ({ user }, res) => {
    log('GET /messages/');

    Messages.find()
    .then((messages) => {
      log(messages[0]);
      res.json({
        currentUser: user._id,
        currentAvatar: user.avatar,
        currentNickname: user.nickname,
        messages: messages.map(message =>
          Object.assign(message, {
            comments: message.comments.filter(comment =>
              user._id.equals(comment.from) || user._id.equals(comment.to)
            )
          })
        )
      });
    });
  }
);

app.post('/messages',
  passport.authenticate('bearer', { session: false }),
  ({ user, body }, res) => {
    log(`POST /messages, body: ${body}`);

    Messages.create(Object.assign(body, { userId: user._id }))
    .then(({ _id }) => {
      res.status(201).json({ _id });
    });
  }
);

app.delete('/messages/:messageId', passport.authenticate('bearer', { session: false }),
  ({ user, params: { messageId } }, res) => {
    log(`DELETE /messages/${messageId}`);

    Messages.findById(messageId)
      .then((messageToDelete) => {
        if (!messageToDelete) {
          res.sendStatus(404);
          return;
        }
        if (user._id.equals(messageToDelete.userId)) {
          messageToDelete.remove();
          res.sendStatus(200);
        } else {
          res.sendStatus(401);
        }
      })
      .catch((err) => {
        console.error(err);
        res.sendStatus(400);
      });
  }
);

// ===== MEMBERS =====

app.get('/members', passport.authenticate('bearer', { session: false }),
  (req, res) => {
    log('GET /members');

    User.find()

    .then(data => res.json(data))

    .catch((err) => {
      console.error(err);
      res.sendStatus(400);
    });
  }
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

// TODO authenticate
app.delete('/comments/:userId/:messageId/:commentId',
  ({ params: { userId, messageId, commentId } }, res) => {
    log(`DELETE /comments/${userId}/:${messageId}/:${commentId}`);

    Messages.update(
      { _id: messageId },
      { $pull: { comments: { _id: commentId } } }
    )

    .then((status) => {
      if (status.nModified > 0) {
        res.sendStatus(202);
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
    server = app.listen(process.env.PORT, HOST, () => {
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
