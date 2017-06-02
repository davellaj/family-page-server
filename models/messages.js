const mongoose = require('mongoose');

mongoose.Promise = global.Promise;

const Schema = mongoose.Schema;

const messages = new mongoose.Schema({
  // family: { type: Schema.Types.ObjectId, required: true },
  family: { type: Schema.Types.ObjectId, required: true },
  contentType: {
    type: String,
    required: true,
    enum: ['photo', 'announcement'],
  },
  url: { type: String },
  text: String,
  date: { type: Date, default: Date.now },
  userId: { type: Schema.Types.ObjectId, required: true },
  tags: Array,
  comments: [{
    from: { type: Schema.Types.ObjectId, required: true },
    to: { type: Schema.Types.ObjectId, required: true },
    text: { type: String, required: true },
    date: { type: Date, default: Date.now },
  }],
});

const Messages = mongoose.model('messages', messages);

module.exports = Messages;
