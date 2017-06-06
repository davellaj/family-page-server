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
const Family = require('./models/family');

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
    res.redirect(`${frontendUrl}/#/app?token=${user.accessToken}`);
  }
);

app.get('/auth/logout', (req, res) => {
  req.logout();
  res.redirect(frontendUrl);
});

app.get('/messages/:family',
  passport.authenticate('bearer', { session: false }),

  ({ user, params }, res) => {
    // check whether family param is in User's family list (authed for this family?)
    // add error handling: if :family exists
    Messages.find({ family: params.family })
    .sort({ date: -1 })
    .then(messages =>
      res.json({
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
    )
    .catch((err) => {
      log(`Err: ${err}`);
      res.sendStatus(404);
    });
  }
);

app.post('/messages',
  passport.authenticate('bearer', { session: false }),
  ({ user, body }, res) => {
  // log(`POST /messages, body: ${body} and user ${user}`);
  // Security / Error checking - to make sure user in family before creating DB post
    // do not know how to send response if the user isn't in the family. It currently
    // just does not allow for a database post if it doesnt find the logged in user in
    // TODO the family no indication on server logs or frontend, I would like to implement this

    Family.findOne({ _id: body.family })
    .populate('members', 'id')
    .then((data) => {
      const usrStr = user.id;
      console.log(typeof usrStr);
      console.log(data.members.includes(user.id));

      for (let i = 0; i < data.members.length; i++) {
        const familyMember = data.members[i].id;
        console.log(typeof familyMember);

        if (usrStr === familyMember) {
          // If authorized user is in family, create a new message
          Messages.create(Object.assign(body, { userId: user._id }))
          .then(({ _id }) => {
            res.status(201).json({ _id });
          })
          .catch((err) => {
            log(`Could not create Message, Err: ${err}`);
            res.sendStatus(404);
          });
          break;
        }
      }
    })
    .catch((err) => {
      log(`Could not find family, Err: ${err}`);
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

// ===== FAMILIES =====

app.post('/family', passport.authenticate('bearer', { session: false }),
  ({ user, body }, res) => {
    Family.create(Object.assign(body, { admins: [user._id], members: [user._id] }))
    .then(({ _id }) => res.json(_id));
  }
);

// ===== CURRENT USER =====

app.get('/user', passport.authenticate('bearer', { session: false }),
  ({ user }, res) => {
    Family.find()
    .populate('members', 'nickname userName email avatar')
    .populate('admins', 'nickname userName email avatar')
    .then(data =>
      // log('family data:??', data);
       data)
    .then(allFamilies => allFamilies.filter(({ members }) =>
        members.some(member => member.equals(user._id))
      )
    )
    .then(families =>
      res.json({
        currentUser: {
          id: user._id,
          avatar: user.avatar,
          nickname: user.nickname,
          fullname: user.userName,
          families
        }
      })
    )
    .catch(console.error);
  });

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
