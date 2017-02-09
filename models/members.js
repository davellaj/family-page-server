const mongoose = require('mongoose');

const members = new mongoose.Schema({
  email: { type: String, required: true },
  fullname: { type: String, required: true },
  nickname: { type: String, required: true },
  avatar: String,
});

const Members = mongoose.model('members', members);

module.exports = Members;
