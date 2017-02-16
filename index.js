const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const passport = require('passport');
const BearerStrategy = require('passport-http-bearer').Strategy;

const Messages = require('./models/messages');
const Members = require('./models/members');

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
    'Content-Type, Access-Control-Allow-Headers, ' +
    'Authorization, X-Requested-With'
  );
  next();
});

passport.use(new BearerStrategy(
    (accessToken, done) => {
      console.log('token', accessToken);
      if (accessToken === 'token 123') {
        return done(null, { message: 'correct! you\'re in' }, { scope: 'read' });
      }
      return done(null, { message: 'incorrect token' });
    }
));

app.get('/', (req, res) => {
  res.status(200).json({ message: 'Hello from the server.' });
});

// ===== AUTH =====

app.get('/helloworld', passport.authenticate('bearer', { session: false }),
  (req, res) => {
    res.json(req.user.message);
  }
);


// ===== MESSAGES =====

app.get('/messages', (req, res) => {
  log('GET /messages');

  Messages.find()
  .then((messages) => {
    res.status(200).json(messages);
  });
});

app.post('/messages', ({ body }, res) => {
  log(`POST /messages, body: ${body}`);

  Messages.create(body)
  .then(({ _id }) => {
    res.status(201).json({ _id });
  });
});

app.delete('/messages/:messageId/:user',
  ({ params: { messageId, user } }, res) => {
    log(`DELETE /messages/${messageId}/${user}`);

    Messages.findById(messageId)
      .then((messageToDelete) => {
        if (!messageToDelete) {
          res.sendStatus(404);
          return;
        }
        if (user === messageToDelete.userId) {
          messageToDelete.remove();
          res.sendStatus(200);
        }
        res.sendStatus(403);
      })
      .catch((err) => {
        console.error(err);
        res.sendStatus(404);
      });
  }
);

// ===== MEMBERS =====

app.get('/members',
  (req, res) => {
    log('GET /members');

    Members.find()

    .then(members =>
      res.status(200).json(members))

    .catch((err) => {
      console.error(err);
      res.sendStatus(400);
    });
  }
);

app.post('/members',
  ({ body }, res) => {
    log(`POST /members, body: ${body}`);

    Members.create(body)

    .then(data =>
      res.status(200).json(data)
    )

    .catch((err) => {
      console.error(err);
      res.sendStatus(404);
    });
  }
);

// ===== COMMENTS =====

app.post('/comments/:userId/:messageId',
  ({ body, params: { userId, messageId } }, res) => {
    log(`POST /comments/${userId}/:${messageId}`);

    Messages.update(
      { _id: messageId },
      { $push: { comments: body } }
    )

    .then((data) => {
      log(data);
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

app.delete('/comments/:userId/:messageId/:commentId',
  ({ params: { userId, messageId, commentId } }, res) => {
    log(`DELETE /comments/${userId}/:${messageId}/:${commentId}`);

    Messages.update(
      { _id: messageId },
      { $pull: { comments: { _id: commentId } } }
    )

    .then((status) => {
      log(status);
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
