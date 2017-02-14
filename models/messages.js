const mongoose = require('mongoose');

const messages = new mongoose.Schema({
  contentType: { type: String, required: true },
  url: { type: String, required: true },
  text: String,
  date: { type: Date, default: Date.now },
  userId: { type: String, required: true },
  tags: Array,
  comments: [{
    from: { type: String, required: true },
    to: { type: String, required: true },
    text: { type: String, required: true },
    date: { type: Date, default: Date.now }
  }]
});

const Messages = mongoose.model('photos', messages);

module.exports = Messages;
