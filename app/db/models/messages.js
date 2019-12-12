var mongoose = require('mongoose');
var schema = {
  senderId: {type: mongoose.Schema.Types.ObjectId, ref: 'user'},
  //recipientId: {type: mongoose.Schema.Types.ObjectId, ref: 'user'},
  status: {type: String},
  date: {type: Date}
};
schema = mongoose.Schema(schema, {collection: 'messages'});
var model = mongoose.model('message', schema);
module.exports = model;