const mongoose = require('mongoose');

mongoose.Promise = global.Promise;

const Schema = mongoose.Schema;

const userSchema = new Schema({
  googleId: String,
  name: Object,
  accessToken: String,
  userName: { type: String, required: true },
  email: Object,
  picture: String
});

const User = mongoose.model('user', userSchema);

module.exports = User;
