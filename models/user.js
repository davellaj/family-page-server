const mongoose = require('mongoose');

mongoose.Promise = global.Promise;

const Schema = mongoose.Schema;

const userSchema = new Schema({
  googleId: String,
  name: Object,
  accessToken: String,
  userName: String,
  email: Object,
  avatar: String,
  families: [Schema.Types.ObjectId]
});

const User = mongoose.model('user', userSchema);

module.exports = User;
