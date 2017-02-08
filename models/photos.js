const mongoose = require('mongoose');

const photos = new mongoose.Schema({
  url: { type: String, required: true },
  caption: String,
  date: { type: Date, default: Date.now },
  // TODO: convert userId to OID
  userId: { type: String, required: true },
  tags: Array,
});

const Photos = mongoose.model('photos', photos);

module.exports = Photos;
