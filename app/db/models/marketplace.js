var mongoose = require('mongoose'),
monguurl = require('monguurl');

var schema = {
    projectId: {type: mongoose.Schema.Types.ObjectId, ref: 'project'},
    name: {type: String},
    author: {type: String},
    slug: {type: String, unique:true},
    coverPhoto: {type: String, default: null},
    description: {type: String},
    category: {type: String},
    visibility: {type: Boolean},
    files: [{
	    type: {type: String},
	    location: {type: String}
    }],
    price: {type: Number},
    comments: [{
    	location: {type: String},
    	user: {type: mongoose.Schema.Types.ObjectId, ref: 'user'},
    	date: {type: Date},
    	body: {type: String},
    	reply: [{
	    	user: {type: mongoose.Schema.Types.ObjectId, ref: 'user'},
	    	date: {type: Date},
	    	body: {type: String}
	    }]
    }],
    createdCountry: {type: String},
    createdBy: {type: mongoose.Schema.Types.ObjectId, ref: 'user'},
    createDate: {type: Date, default: Date.now}
};
schema = mongoose.Schema(schema, {collection: 'marketplace'});

schema.plugin(monguurl({
  source: 'name',
  target: 'slug'
}));
schema.statics.findOneByProjectId = function (projectId, cb) {
    return this.findOne({ projectId: projectId }, cb);
};
var model = mongoose.model('marketplace_item', schema);
module.exports = model;


