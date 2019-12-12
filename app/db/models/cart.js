var mongoose = require('mongoose');
var schema = {
    marketplaceId: {type: mongoose.Schema.Types.ObjectId, ref: 'marketplace_item'},
    date: {type: Date},
    name: {type: String},
    description: {type: String},
    price: {type: Number},
    userId: {type: mongoose.Schema.Types.ObjectId, ref: 'user'}
};
var schema = mongoose.Schema(schema, {collection: 'cart'});
var model = mongoose.model('cart_item', schema);
module.exports = model;


