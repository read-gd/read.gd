var mongoose = require('mongoose');
var schema = {
    userId: {type: mongoose.Schema.Types.ObjectId, ref: 'user'},
    marketplaceId: {type: mongoose.Schema.Types.ObjectId, ref: 'marketplace_item'},
    purchaseDate: {type: Date}
};
schema = mongoose.Schema(schema, {collection: 'library'});
schema.statics.findItemsByUserId = function (userId, cb) {
    return this.find({ userId: userId })
        .populate('marketplaceId')
        .exec(cb);
};
var model = mongoose.model('library_item', schema);
module.exports = model;


