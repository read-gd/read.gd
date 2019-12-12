var locomotive = require('locomotive'),
    Controller = locomotive.Controller;

var passport = require('passport');
var mongoose = require('mongoose');
var con_login = require('connect-ensure-login');
var options = require('../files/options.json');
var moment = require('moment');
var geoip = require('geoip-lite');
var _ = require('lodash');
var url = require('url');
var globalConfig = require('../../config/globals');
var async = require('async');

var MarketplaceController = new Controller();

MarketplaceController.show = function() {

    this.user = this.req.user;
    this.userCart = this.req.userCart;
    var id = this.param("marketplace_id"),
        marketplace = this.models['marketplace'],
        self = this;
    var ip = this.req.param("ip"); // for testing purpose
    ip = ip || this.req.headers['x-forwarded-for'] || this.req.connection.remoteAddress  ||  this.__req.socket.remoteAddress || this.__req.connection.socket.remoteAddress;

    var geo = geoip.lookup(ip);
    var query = {};

    if (geo) {
        query = {createdCountry: geo.country};
    }

    console.log("Geolocation: " + JSON.stringify(geo));

	//marketplace.find({ sort:{ createDate: -1 } })
    marketplace.find()
        .populate('createdBy projectId')
        //.where('status').equals('Open')
        //.where('remote').equals(true)
        //.or([{ 'remote': true }, { 'location.country': country.name }])
        //.where('location.country').equals(country.name)
        .exec(function(err, list){
            if(!err){
                self.list = list;
                self.render();
            }else{
                self.render('/error');
            }
        });

    /*marketplace.find(id, function(err, item) {
     if (!err) {
     self.marketplace = item;
     self.moment = moment;

     self.render();

     } else {
     console.log(err);
     //self.render("app_notfound");
     }
     });*/

    //this.render();
}

MarketplaceController.single = function() {

    this.user = this.req.user;
    this.userCart = this.req.userCart;


    var id = this.param("id"),
        marketplace = this.models['marketplace'],
        self = this;

    //console.log("marketplace_id: " +  this.marketplace._id);


	marketplace.findById(id)
    .populate('createdBy projectId')
    //.where('status').equals('Open')
    //.where('remote').equals(true)
    //.or([{ 'remote': true }, { 'location.country': country.name }])
    //.where('location.country').equals(country.name)
    .exec(function(err, item){
        if(!err){
            self.marketplace = item;
            //console.log(self);
            self.moment = moment;
            self.render();
        }else{
            console.log(err);
            //self.render('/error');
        }
    });
    /*marketplace.findById(id, function(err, item) {
        if (!err) {
            self.marketplace = item;
            self.moment = moment;

            self.render();

        } else {
            console.log(err);
            //self.render("app_notfound");
        }
    });*/
}

MarketplaceController.editForm = function() {

    this.user = this.req.user;
    this.userCart = this.req.userCart;
    this.render();
}

MarketplaceController.checkoutList = function() {
    this.user = this.req.user;
    this.userCart = this.req.userCart;
    this.render();
};

function actionAfterCharging(self, charge) {
    var stripeSecretKey = globalConfig.stripe.secretKey;
    var stripe = require("stripe")(stripeSecretKey);
    self.user.stripe.customerId = charge.customer;
    var foundCard = _.find(self.user.stripe.cards, 'id', charge.source.id);
    if (typeof foundCard === 'undefined') {
        self.user.stripe.cards.push({
            id: charge.source.id,
            last4: charge.source.last4
        });
    }

    self.user.save(function() {
        async.parallel([
            function(callback){
                var transaction = mongoose.model('transaction_item');
                var transactionItem = new transaction();
                transactionItem.userId = self.user._id;
                transactionItem.cardId = charge.source.id;
                transactionItem.charge = charge.amount;
                transactionItem.date = new Date();
                transactionItem.save(callback);
            },
            function(callback){
                var library = mongoose.model('library_item');
                var userModel = self.models['user'];
                var marketplaceModel = self.models['marketplace_item'];

                async.each(self.userCart, function(cartItem, cb) {
                    async.waterfall([
                        function(cb) {
                            var libraryItem = new library();
                            libraryItem.userId = self.user._id;
                            libraryItem.marketplaceId = cartItem.marketplaceId;
                            libraryItem.purchaseDate = new Date();
                            libraryItem.save(cb);
                        },
                        function(savedLibraryItem, cb) {
                            marketplaceModel.findById(savedLibraryItem.marketplaceId, cb);
                        },
                        function(foundMarketplaceItem, cb) {
                            if (foundMarketplaceItem === null) {
                                return cb(new Error('Marketplace item not found'));
                            }
                            userModel.findById(foundMarketplaceItem.createdBy, cb);
                        },
                        function(foundUser, cb) {
                            if (foundUser === null) {
                                return cb(new Error('User not found'));
                            }
                            stripe.transfers.create(
                                {
                                    amount: parseFloat(cartItem.price) * 0.9,
                                    destination: foundUser.stripe.account.userId
                                }
                            ).then(function(transferInfo) {
                                cb(null);
                            });
                        }
                    ], function(err) {
                        if (err) {
                            return cb(err);
                        }
                        cb(null);
                    });
                }, function(err) {
                    callback(err);
                });
            }
        ],
        function(err){
            if (err) {
                return self.render('/error');
            }
            self.user.clearCart(function() {
                self.redirect('marketplace/thankyou');
            });
        });
    });
}

MarketplaceController.checkoutUsingExistingCard = function() {
    this.user = this.req.user;
    this.userCart = this.req.userCart;
    var cardId = this.param('card_id');
    var totalAmount = this.param('total_amount') * 100;
    var self = this;
    var stripeSecretKey = globalConfig.stripe.secretKey;
    var stripe = require("stripe")(stripeSecretKey);

    stripe.customers.update(self.user.stripe.customerId, {
        default_source: cardId
    }).then(function(customer) {
        return stripe.charges.create({
            amount: totalAmount,
            currency: "usd",
            customer: customer.id
        });
    }).then(function(charge) {
        actionAfterCharging(self, charge);
    });
};

MarketplaceController.checkoutForm = function() {

    this.user = this.req.user;
    this.userCart = this.req.userCart;
    this.stripePublishableKey = globalConfig.stripe.publishableKey;
    this.render();
};

MarketplaceController.checkout = function() {

    this.user = this.req.user;
    this.userCart = this.req.userCart;
    var self = this;
    var stripeSecretKey = globalConfig.stripe.secretKey;
    // Set your secret key: remember to change this to your live secret key in production
    // See your keys here https://dashboard.stripe.com/account/apikeys
    var stripe = require("stripe")(stripeSecretKey),
        total = parseInt(this.param('total')) * 100,
        stripeToken = this.param('stripeToken');

    // (Assuming you're using express - expressjs.com)
    // Get the credit card details submitted by the form
    //var stripeToken = request.body.stripeToken;

    if (typeof self.user.stripe.customerId === 'undefined') {
        stripe.customers.create({
            source: stripeToken,
            description: "Order for "+this.user.email,
            email: this.user.email
        }).then(function(customer) {
            return stripe.charges.create({
                amount: total, // amount in cents, again
                currency: "usd",
                customer: customer.id
            });
        }).then(function(charge) {
            actionAfterCharging(self, charge);
        });
    } else {
        stripe.customers.createSource(
            self.user.stripe.customerId,
            {source: stripeToken}
        ).then(function(card) {
            return stripe.customers.update(self.user.stripe.customerId, {
                default_source: card.id
            });
        }).then(function(customer) {
            return stripe.charges.create({
                amount: total,
                currency: 'usd',
                customer: customer.id
            });
        }).then(function(charge) {
            actionAfterCharging(self, charge);
        });
    }
};

MarketplaceController.thankyou = function() {
    this.user = this.req.user;
    this.userCart = this.req.userCart;
    this.render();
}

//PagesController.before(['dashboard', 'solutions', 'services'], require('connect-ensure-login').ensureLoggedIn('account/login'));

MarketplaceController.before('*', function(req, res, next){
    // this executes before any action is invoked
    // if you want to insert a middleware
    require('connect-ensure-login').ensureLoggedIn('account/login')(req,res,next);
    // or
    //next();
});

module.exports = MarketplaceController;