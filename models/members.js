const mongoose = require('mongoose');

mongoose.Promise = global.Promise;

const members = new mongoose.Schema({
  fullname: { type: String, required: true },
  nickname: { type: String, required: true },
  avatar: String,
});

const Members = mongoose.model('members', members);

module.exports = Members;
