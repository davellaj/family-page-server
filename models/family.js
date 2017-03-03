const mongoose = require('mongoose');

mongoose.Promise = global.Promise;

const Schema = mongoose.Schema;

const familySchema = new Schema({
  name: { type: String, required: true },
  created: { type: Date, default: Date.now },
  admins: [Schema.Types.ObjectId],
  members: [{ type: Schema.Types.ObjectId, ref: 'user' }],
  avatar: String,
});

const Family = mongoose.model('family', familySchema);

module.exports = Family;
