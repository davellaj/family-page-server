const mongoose = require('mongoose');

mongoose.Promise = global.Promise;

const Schema = mongoose.Schema;

const userSchema = new Schema({
  googleId: String,
  nickname: String,
  accessToken: String,
  userName: String,
  email: Object,
  avatar: String,
});

const User = mongoose.model('user', userSchema);

module.exports = User;
