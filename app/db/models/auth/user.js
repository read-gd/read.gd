/**
 * User: saf
 */
var mongoose = require('mongoose');
var objectId = mongoose.Schema.ObjectId;
//require('./clients');
var bcrypt   = require('bcrypt-nodejs');
var cartmodel = require('../cart');

var schema = {
    username: {type: String, unique:true},
    photo: {type: String, default: ''},
    usertype: [{type: String, default: ''}],
    firstname: {type: String, default: ''},
    lastname: {type: String, default: ''},
    email: {type: String, unique:true},
    password: {type: String},
    token: {type: String},
    company: {type: String, default: ''},
    number: {type: String, default: ''},
    website: {type: String, default: ''},
    description: {type: String, default: ''},
    locations: [{
        street: {type: String},
        suite: {type: String},
        city: {type: String},
        zip: {type: String},
        state: {type: String},
        country: {type: String},
        lat: {type: String},
        lng: {type: String}
    }],
    portfolio: [{
        name: {type: String},
        description: {type: String},
        url: {type: String},
        photo: {type: String}
    }],
    specialization: [{type: String, default: ''}], //must take from : http://www.onetcenter.org/taxonomy.html
    skills: [{type: Number}],
    yearStarted: {type: Number},
    rate: {type: Number},
    stripe: {
        customerId: {type: String},
        cards: [{
            id: {type: String},
            last4: {type: String}
        }],
        account: {
            accessToken: {type: String},
            refreshToken: {type: String},
            publishableKey: {type: String},
            userId: {type: String},
            scope: {type: String}
        }
    },
    createDate: {type: Date, default: Date.now},
    deleteDate: {type: Date },
    tokenDate: {type: Date, default: Date.now},
    isAdmin: {type: Boolean},
    isEmailVerified: {type: Boolean}
};

var schema = new mongoose.Schema(schema, {collection: 'users'});

schema.virtual('name').get(function () {
    return this.firstname+ " " + this.lastname;
}).set(function (name) {
    name = name.split(" ");
    this.firstname = name[0];
    this.lastname = name[1];
});

schema.methods.getCart = function(cb) {
    cartmodel.find({userId: this._id}, cb);
};

schema.methods.clearCart = function(cb) {
    cartmodel.remove({userId: this._id}, cb);
};

/*schema.virtual('password').get(function () {
    return this._password;
}).set(function (password) {
        this._password = password;
        var salt = this.salt = bcrypt.genSaltSync(10);
        this.hash = bcrypt.hashSync(password, salt);
    });

schema.method('checkPassword', function (password, callback) {
    bcrypt.compare(password, this.hash, callback);
});

schema.method('checkPassword', function (password, callback) {
    callback(false, password == this.password);
});*/

// methods ======================
// generating a hash
schema.methods.generateHash = function(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

// checking if password is valid
schema.methods.validPassword = function(password) {
    return bcrypt.compareSync(password, this.password);
};

schema.static('authenticate', function (email, password, callback) {
    this.findOne({$or:[{email: email }, {username: email }]}, function(err, user) {
        if (err)
            return callback(err);

        if (!user)
            return callback(null, false);

        // if the user is found but the password is wrong
        if (!user.validPassword(password))
            return callback(null, false/*, req.flash('loginMessage', 'Oops! Wrong password.')*/); // create the loginMessage and save it to session as flashdata

        // all is well, return successful user
        return callback(null, user);

        // checking if password is valid

        /*user.checkPassword(password, function(err, passwordCorrect) {
            if (err)
                return callback(err);

            if (!passwordCorrect)
                return callback(null, false);

            return callback(null, user);
        });*/
    });
});

// checking if password is valid
schema.methods.validToken = function(token) {
    return bcrypt.compareSync(token, this.token);
};

schema.static('authenticateWithToken', function (email, token, callback) {
    this.findOne({$or:[{email: email }, {username: email }]}, function(err, user) {
        if (err)
            return callback(err);

        if (!user)
            return callback(null, false);

        // if the user is found but the token is wrong
        if (!user.validToken(token))
            return callback(null, false);

        // all is well, return successful user
        return callback(null, user);

    });
});


var model = mongoose.model('user', schema);
module.exports = model;