var mongoose = require('mongoose');
var schema = {
    name: {type: String},
    author: {type: String},
    description: {type: String},
    type: {type: String},
    category: {type: String},
    status: {type: String, default: 'Unpublished'},
    services: [{type: Number}],
	coverPhoto: {type: String, default: null},
    collaborators: [{
	   user: {type: mongoose.Schema.Types.ObjectId, ref: 'user'},
	   position: {type: String},
	   startDate: {type: Date},
	   endDate: {type: Date},
	   price: {type: Number},
	   hours: {type: Number},
	   rating: {type: Number},
	   ratingComment: {type: String}
    }],
    visibility: {type: Boolean},
    files: [{
	    type: {type: String},
	    location: {type: String}
    }],
    body: [mongoose.Schema.Types.Mixed],
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
    createdBy: {type: mongoose.Schema.Types.ObjectId, ref: 'user'},
    createDate: {type: Date, default: Date.now}
};
var schema = mongoose.Schema(schema, {collection: 'projects'});
var model = mongoose.model('project', schema);
module.exports = model;


