var mongoose = require('mongoose');
var schema = {
    userId: {type: mongoose.Schema.Types.ObjectId, ref: 'user'},
    cardId: {type: String},
    charge: {type: Number},
    date: {type: Date}
};
schema = mongoose.Schema(schema, {collection: 'transactions'});
var model = mongoose.model('transaction_item', schema);
module.exports = model;


