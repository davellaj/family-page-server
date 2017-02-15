const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');

const Messages = require('./models/messages');
const Members = require('./models/members');

const HOST = process.env.HOST;

dotenv.config();

mongoose.Promise = global.Promise;

console.log(`Server running in ${process.env.NODE_ENV} mode`);

const app = express();
app.use(bodyParser.json());

app.all('/*', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With');
  next();
});

app.get('/', (req, res) => {
  res.status(200).json({ message: 'Hello from the server.' });
});

// ===== MESSAGES =====

app.get('/messages', (req, res) => {
  Messages.find()
  .then((messages) => {
    res.status(200).json(messages);
  });
});

app.post('/messages', ({ body }, res) => {
  console.log(body);

  Messages.create(body)
  .then(({ _id }) => {
    res.status(201).json({ _id });
  });
});

app.delete('/messages/:messageId/:user', (req, res) => {
  Messages.findById(req.params.messageId,
    (error) => {
      if (error) {
        console.error(error);
        res.sendStatus(404);
      }
    })
    .then((messageToDelete) => {
      if (!messageToDelete) {
        res.sendStatus(404);
        return;
      }
      if (req.params.user === messageToDelete.userId) {
        messageToDelete.remove();
        res.sendStatus(200);
      }
      res.sendStatus(403);
    })
    .catch(console.error);
});

// ===== MEMBERS =====

app.get('/members', (req, res) => {
  Members.find()
  .then(members =>
    res.status(200).json(members));
});

app.post('/members', ({ body }, res) => {
  Members.create(body)
  .then(data => res.status(200).json(data));
});

// ===== COMMENTS =====

app.post('/comments/:userId/:messageId', (req, res) => {
  console.log('post comments endpoint hit');

  Messages.update(
    { _id: req.params.messageId },
    { $push: { comments: req.body } }
  )

  .then((data) => {
    console.log(data);
    if (data.nModified > 0) {
      res.sendStatus(200);
    } else {
      res.sendStatus(404);
    }
  })

  .catch(console.error);
});

app.delete('/comments/:userId/:messageId/:commentId',
  ({ params: { userId, messageId, commentId } }, res) => {
    console.log(`DELETE /comments/${userId}/:${messageId}/:${commentId}`);

    Messages.update(
      { _id: messageId },
      { $pull: { comments: { _id: commentId } } }
    )

    .then((status) => {
      console.log(status);
      if (status.nModified > 0) {
        res.sendStatus(202);
      } else {
        res.sendStatus(404);
      }
    })

    .catch(console.error);
  }
);

// ===== SERVER =====

let server;

function runServer(callback) {
  return new Promise((resolve, reject) => {
    mongoose.connect(process.env.DATABASE_URL, (err) => {
      if (err && callback) {
        console.log(err);
        return callback(err);
      }
      return null;
    });
    server = app.listen(process.env.PORT, HOST, () => {
      console.log(`Your app is listening on port ${process.env.PORT}`);
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
    console.log('Closing server');
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
