var locomotive = require('locomotive')
    , Controller = locomotive.Controller;
var passport = require('passport');
var mongoose = require('mongoose');
var bcrypt  = require('bcrypt-nodejs');
var con_login = require('connect-ensure-login');
var options = require('../files/options.json');
var nodemailer = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');
var formidable = require('formidable'),
    http = require('http'),
    util = require('util'),
    fs   = require('fs-extra'),
    changecase = require('change-case');

var path = require('path');
var async = require('async');
var crypto = require('crypto');
var geoip = require('geoip-lite');
var request = require('request');
var _ = require('underscore');
var countryData = require('country-data');
var globalConfig = require('../../config/globals');

var transport = nodemailer.createTransport(smtpTransport(globalConfig.smtpTransport));

var AccountController = new Controller();

var tokenExpiryLimit = 48; //number of hours a reset token or verification token is valid

AccountController.signup = function() { //signup form
    //this.options = options;
    this.user = this.req.user;
    this.userCart = this.req.userCart;
    
    var ip =this.req.param("ip"); // for testing purpose
    ip = ip || this.req.headers['x-forwarded-for'] || this.req.connection.remoteAddress  ||  this.__req.socket.remoteAddress || this.__req.connection.socket.remoteAddress;

    var geo = geoip.lookup(ip);

    if(geo) {
        this.geoCountry = geo.country;
    } else {
        this.geoCountry = '';
    }

	this.countries = _.sortBy(countryData.countries.all, 'name');
	//console.log(this.countries);
    
    this.render();
}

AccountController.individual = function() { //signup form
    //console.log(this.settings.env);
    this.user = this.req.user;
    this.userCart = this.req.userCart;
    this.render();
}

AccountController.company = function() { //signup form
    this.user = this.req.user;
    this.userCart = this.req.userCart;
    this.render();

}

AccountController.create = function () { //register or signup
    var user = mongoose.model('user');
    var account = new user();

    account.email = this.param('email');
    account.username = this.param('username');
    account.password = account.generateHash(this.param('password'));
    account.firstname = this.param('firstname');
    account.lastname = this.param('lastname');
    account.usertype = this.param('usertype');
    account.country = this.param('country');
	  account.hostname = this.req.headers.host;
	  account.isEmailVerified = false;
    account.locations = {"country":account.country};

    if(!account.username) {
        account.username = account.email;
    }

    var self = this;
    self.countries = countryData.countries.all;
	self.userDetails = account;

    account.save(function (err) {

        if (err){
            console.log(err.err);

            var ip =self.req.param("ip"); // for testing purpose
            ip = ip || self.req.headers['x-forwarded-for'] || self.req.connection.remoteAddress  ||  self.__req.socket.remoteAddress || self.__req.connection.socket.remoteAddress;

            var geo = geoip.lookup(ip);


            if(geo) {
                self.geoCountry = geo.country;
            } else {
                self.geoCountry = '';
            }

            if( err.err.indexOf("username_1") >= 0 && err.err.indexOf("dup key") >= 0) {
                return self.render("signup", {message: "Email " + account.email + " was already registered. Please use a different email."});
            }
            // catch all error message if above specific error conditions are not met
            return self.render("signup", {message: "Error found in account registration"});


        }
        async.waterfall([
            function(done) {
                crypto.randomBytes(20, function(err, buf) {
                    var token = buf.toString('hex');
                    done(err, token);
                });
            },
            function(token, done) {

                account.username = account.email;
                account.token =  account.generateHash(token);
				        account.save(function(err) {
                    done(err);
                });

            },
            function(done) {
                // initialize email template library
                var EmailTemplate = require('email-templates').EmailTemplate;

                // initialize the root template directory
                var emailTemplatesDir = path.resolve(__dirname, '..', 'emails')

                // initialize the actual email template
                var welcomeEmail = new EmailTemplate(path.join(emailTemplatesDir, 'welcome'));

                // merge the template with actual data
                var mailBody = {};

                welcomeEmail.render(account, function (err, results) {
	                if (err || typeof results === 'undefined' || results === null) {
		                 return;
		             }

		                    var mailOptions = {
		                        from: 'kreateve <hello@kreateve.com>',
		                        to: account.email,
		                        subject: 'Welcome to kreateve',
		                        html: results.html,
		                        text: results.text
		             };

	                    transport.sendMail(mailOptions, function (error, response) {
	                        if (error) {
	                            console.log(error);
	                        } else {
	                            console.log("Message sent: " + JSON.stringify(response));
	                        }
	                        transport.close(); // shut down the connection pool, no more messages
	                    });

	                });
		    }
         ], function(err) {
                    if (err) return next(err);
         	});

        var hostname = self.req.headers.host; // hostname = 'localhost:8080'
        var URL = 'http://' + hostname + '/';
        self.baseUrl = URL;
		return self.render('account/verifyEmail');
    });
};

AccountController.resendverify = function () { //resend verification email
    var user = mongoose.model('user');
    var account = new user();

    account.hostname = this.req.headers.host;
    account.email = this.param('email');

    if (!account.username) {
        account.username = account.email;
    }

    var self = this;
    self.countries = countryData.countries.all;

    var usermodel = this.models['user'];

    usermodel.findOne({'email': account.email}, function (err, userObj) {
        if (!err) {

            console.log("Item found: " + JSON.stringify(userObj));

            if (userObj === null) {

                output = {
                    "error": "Cannot find the email from our database.  You can <a href=\"/account/signup\" class=\"btn-link\">click here to Signup for a new account</a>.",
                    "date": Date.now()
                };


            } else {


                async.waterfall([
                    function (done) {
                        crypto.randomBytes(20, function (err, buf) {
                            var token = buf.toString('hex');
                            done(err, token);
                        });
                    },
                    function (token, done) {

                        userObj.username = account.email;
                        userObj.token = account.token = account.generateHash(token);
                        userObj.save(function (err) {
                            done(err);
                        });

                    },
                    function (done) {
                        // initialize email template library
                        var EmailTemplate = require('email-templates').EmailTemplate;

                        // initialize the root template directory
                        var emailTemplatesDir = path.resolve(__dirname, '..', 'emails')

                        // initialize the actual email template
                        var verifyEmail = new EmailTemplate(path.join(emailTemplatesDir, 'verify-user'));

                        // merge the template with actual data
                        var mailBody = {};

                        verifyEmail.render(account, function (err, results) {
                            if (err || typeof results === 'undefined' || results === null) {
                                return;
                            }

                            var mailOptions = {
                                from: 'kreateve <hello@kreateve.com>',
                                to: account.email,
                                subject: 'Account Verification',
                                html: results.html,
                                text: results.text
                            };

                            transport.sendMail(mailOptions, function (error, response) {
                                if (error) {
                                    console.log(error);
                                } else {
                                    console.log("Message sent: " + JSON.stringify(response));
                                }
                                transport.close(); // shut down the connection pool, no more messages
                            });

                        });
                    }
                ], function (err) {
                    if (err) console.log("Error resending verification email " + JSON.stringify(err));
                });
            }
        } else {
            console.log( "An error occured. " + err);
        }
    });

    return self.render('account/verifyEmail');

};




AccountController.setpassword = function(req, res) {
    this.user = this.req.user;
    this.userCart = this.req.userCart;
    var user = this.req.user,
        account = {},
        newpassword = this.param('newpassword'),
        confirmpassword = this.param('confirmpassword'),
        email = this.param('email'),
        token = this.param('token'),
        that = this;
    var output ={};

    account.password = bcrypt.hashSync(newpassword, bcrypt.genSaltSync(8), null);

    var usermodel = this.models['user'];

    usermodel.findOneAndUpdate({'email':email, 'token':token}, {$set: account}, function (err, inst) {
        if (!err) {

            if(inst == null) {
                console.log("Email and token does not match in database");
                output = {"error": "Can't find a match"};

            } else {

                output = {"success": "Your password has been changed."};

                console.log("Response: " + JSON.stringify(inst));

                // initialize email template library
                var EmailTemplate = require('email-templates').EmailTemplate;

                // initialize the root template directory
                var emailTemplatesDir = path.resolve(__dirname, '..', 'emails')

                // initialize the actual email template
                var changePasswordEmail = new EmailTemplate(path.join(emailTemplatesDir, 'change-passwd'));

                // merge the template with actual data
                var mailBody = {};

                changePasswordEmail.render(account, function (err, results) {

                    var mailOptions = {
                        from: 'kreateve <hello@kreateve.com>',
                        to: inst.email,
                        subject: 'Password Change Notification',
                        html: results.html,
                        text: results.text
                    }

                    transport.sendMail(mailOptions, function (error, response) {
                        if (error) {
                            console.log(error);
                        } else {
                            console.log("Message sent: " + JSON.stringify(response));
                        }
                        transport.close(); // shut down the connection pool, no more messages
                    });

                });

                that.req.body.username = inst.username;
                that.req.body.password = newpassword;
                that.req.body.email = inst.email;

                console.log(" Auto login for: " + that.req.body.username + ' Email: ' + that.req.body.email   + ' ' + that.req.body.password );

                //authenticate user after password change
                passport.authenticate('local')(that.req, that.res, function () {
                	output = {"success": "Your password has been changed."};
                    that.res.redirect('/dashboard');
                });


            }
        } else {
            output = {"error": "An error occured."};
        }
        //that.res.send(JSON.stringify(output));
    });


}

AccountController.login = function() {
    this.user = this.req.user;
    passport.authenticate('local', {
            successReturnToOrRedirect: '/dashboard',
            failureRedirect: this.urlFor({ action: 'login' }) }
    )(this.__req, this.__res, this.__next);
};

AccountController.loginForm = function() {
    //this.user = this.req.user;
    this.render();
}

AccountController.settings = function() {
	this.user = this.req.user;
    this.userCart = this.req.userCart;
    this.options = options;
    this.changecase = changecase;

    if(this.user.locations && this.user.locations[0]) {
      this.user.location = this.user.locations[0];
    } else {
      this.user.location = {};
    }

	this.countries = _.sortBy(countryData.countries.all, 'name');
    //this.countries = countryData.countries.all;
    this.stripeClientId = globalConfig.stripe.clientId;
    this.stripeConnectUrl = globalConfig.stripe.siteUrl + globalConfig.stripe.authorizeUrl;

    this.render();
}

AccountController.stripeCallback = function() {
    this.user = this.req.user;
    this.userCart = this.req.userCart;
    var code = this.req.query.code;
    var self = this;

    request.post({
        url: globalConfig.stripe.siteUrl + globalConfig.stripe.tokenUrl,
        form: {
            grant_type: "authorization_code",
            client_id: globalConfig.stripe.clientId,
            code: code,
            client_secret: globalConfig.stripe.secretKey
        }
    }, function(err, r, body) {
        var accountData = JSON.parse(body);
        self.user.stripe.account.accessToken = accountData.access_token;
        self.user.stripe.account.publishableKey = accountData.stripe_publishable_key;
        self.user.stripe.account.refreshToken = accountData.refresh_token;
        self.user.stripe.account.scope = accountData.scope;
        self.user.stripe.account.userId = accountData.stripe_user_id;
        self.user.save(function(err) {
            if (err) {
                return self.render('/error');
            }
            self.redirect('/account/settings');
        });
    });
}

AccountController.password = function() {
	this.user = this.req.user;
    this.userCart = this.req.userCart;
    //this.options = options;
    this.changecase = changecase;
    //console.log(this.options);
    this.render();
}

AccountController.forgot = function() {
    this.user = this.req.user;
    this.userCart = this.req.userCart;
    this.message='';
    this.render();
}

AccountController.resetpasswd = function(req, res) {
    this.user = this.req.user;
    this.userCart = this.req.userCart;

    var token =  this.param('token');
    var email =  this.param('username');

    var account = {};

    var output = {};

    account.hostname = this.req.headers.host;
    //token = bcrypt.hashSync(token, bcrypt.genSaltSync(8), null);

    var usermodel = this.models['user'];
    var self = this;

    usermodel.findOneAndUpdate({'email': email, 'token':token}, {$set: account}, function (err, userObj) {

        if (!err) {

            console.log("Item found: " + JSON.stringify(userObj));

            if (userObj === null) {

                this.err_msg = "Reset Password Token is invalid. Enter email below to get a new token.";

                return self.render('account/forgot',{message:this.err_msg});


            } else {

                var timeDiff = new Object();

                var totalDiff = Date.now() - userObj.tokenDate;

                timeDiff.days = Math.floor(totalDiff / 1000 / 60 / 60 / 24);

                timeDiff.hours = Math.floor(totalDiff / 1000 / 60 / 60);

                console.log(" Reset Token duration: " + totalDiff + ' : ' + timeDiff.days + ' : ' + timeDiff.hours);

                if( timeDiff.hours < tokenExpiryLimit) {

                    console.log("Token and email successfully verified for " + email);
                    self.email = email;
                    self.token = token;
                    return self.render('account/resetpasswd');

                } else {
                    this.err_msg = "Reset Password Token is expired. Enter email below to get a new token.";

                    return self.render('account/forgot',{message:this.err_msg});
                }

            }
        } else {
            this.err_msg = err.message;
        }
    });
}



AccountController.reset = function (req, res) {
    this.user = this.req.user;
    this.userCart = this.req.userCart;
    var account = {},
        user = this.user,
        email = this.param('email'),
        that = this;

    var output = {};

    account.hostname = this.req.headers.host;
    account.password = bcrypt.hashSync("n", bcrypt.genSaltSync(8), null);
    account.tokenDate = Date.now();

    var usermodel = this.models['user'];

    console.log("Email :  " + email);

    usermodel.findOneAndUpdate({'email': email}, {$set: account}, function (err, userObj) {
        if (!err) {

            console.log("Item found: " + JSON.stringify(userObj));
            if (userObj === null) {

                output = {
                    "error": "Cannot find the email from our database.  You can <a href=\"/account/signup\" class=\"btn-link\">click here to Signup for a new account</a>.",
                    "date": Date.now()
                };

            } else {

                output = {
                    "success": "Your temporary password was sent to your email."
                };

                // execute array of functions one after another
                async.waterfall([
                    function(done) {
                        crypto.randomBytes(20, function(err, buf) {
                            var token = buf.toString('hex');
                            done(err, token);
                        });
                    },
                    function(token, done) {

                        userObj.token = userObj.generateHash(token);
                            //user.tokenExpires = Date.now() + 3600000; // future

                        userObj.save(function(err) {
                                done(err, token);
                        });

                        account.username = email;
                        account.token = userObj.token;

                    },
                    function(token, done) {
                        // initialize email template library
                        var EmailTemplate = require('email-templates').EmailTemplate;

                        // initialize the root template directory
                        var emailTemplatesDir = path.resolve(__dirname, '..', 'emails')

                        // initialize the actual email template
                        var forgotPasswordEmail = new EmailTemplate(path.join(emailTemplatesDir, 'forgot-passwd'));

                        // merge the template with actual data
                        var mailBody = {};

                        forgotPasswordEmail.render(account, function (err, results) {

                            var mailOptions = {
                                from: 'kreateve <hello@kreateve.com>',
                                to: email,
                                subject: 'Forgot Password Notification',
                                html: results.html,
                                text: results.text
                            }

                            transport.sendMail(mailOptions, function (error, response) {
                                if (error) {
                                    console.log( "Error sending Forgot password email" + error);
                                } else {

                                    console.log("Message sent: " + JSON.stringify(response));
                                }
                                transport.close(); // shut down the connection pool, no more messages
                                //done(error, 'done');

                            });

                        });
                    }
                ], function(err) {
                    if (err) return next(err);
                });
            }
        } else {
            output = {"error": "Error resetting password!"};
        }

        that.res.send(JSON.stringify(output));
    });
}

AccountController.update = function() {
    //console.log(" Calling Account Update ");
    var user = this.req.user;
    this.user = this.req.user;
    this.userCart = this.req.userCart;
    //this.options = options;
    //this.changecase = changecase;
    this.stripeClientId = globalConfig.stripe.clientId;
    this.stripeConnectUrl = globalConfig.stripe.siteUrl + globalConfig.stripe.authorizeUrl;
    var account = {},
    self = this;
    self.photos = [];
    var accountDir = 'public/accounts_data/' + user._id;
    account.portfolio = {};
    //account.portfolio.photos = [];

    this.countries = countryData.countries.all;

    //console.log(self.__req.body);
    //console.log(self.__req.files['portfoliophoto[]']);
    //return;

    var composeAndUpdateAccount = function() {

        account.photo = self.photos['photo'] != undefined ? self.photos['photo'] : '';
        account.firstname = self.__req.body.firstname === undefined ? '' : self.__req.body.firstname;
        account.lastname = self.__req.body.lastname === undefined ? '' : self.__req.body.lastname;
        account.email = self.__req.body.email === undefined ? '' : self.__req.body.email;
        account.number = self.__req.body.number === undefined ? '' : self.__req.body.number;
        account.company = self.__req.body.company === undefined ? '' : self.__req.body.company;
        account.description = self.__req.body.description === undefined ? '' : self.__req.body.description;
        account.website = self.__req.body.website === undefined ? '' : self.__req.body.website;
        account.locations = self.user.locations;
        account.locations[0] = {
            'street': !!self.__req.body.street  ?  self.__req.body.street : '',
            'suite': !!self.__req.body.suite  ?  self.__req.body.suite : '',
            'city': !!self.__req.body.city  ? self.__req.body.city : '',
            'zip': !!self.__req.body.zip  ? self.__req.body.zip : '',
            'state': !!self.__req.body.state  ? self.__req.body.state : '',
            'country' : !!self.__req.body.country  ?  self.__req.body.country : ''
        }

		//account.portfolio.names = self.__req.body.portfolioname === undefined ? '' : self.__req.body.portfolioname;
        //account.portfolio.descriptions = self.__req.body.portfoliodescription === undefined ? '' : self.__req.body.portfoliodescription;
        //account.portfolio.urls = self.__req.body.portfoliourl === undefined ? '' : self.__req.body.portfoliourl;
        //account.portfolio.photos = self.photos === undefined ? '' : self.photos;

        var count = self.__req.body.portfolioname.length,
        portfoio = [];

        console.log(self.photos);

        if (count > 0 /*&& (self.__req.body.portfoliodescription != undefined) && (self.__req.body.portfoliourl != undefined) && (self.photos != undefined)*/){
	        for(var i = 0; i < count; i++){
		        var current = {};

		        //console.log("i is: "+i+" and count is: "+ count);

		        current.name = self.__req.body.portfolioname[i];
		        current.description = self.__req.body.portfoliodescription[i];
		        current.url = self.__req.body.portfoliourl[i];
		        current.photo = self.photos['portfoliophoto['+i+']'] != undefined ? self.photos['portfoliophoto['+i+']'] : self.__req.body.portfoliophoto[i];
				console.log(current.photo);
				//console.log(typeof self.__req.body.portfoliophoto[i]);

		        /*if (!self.__req.body.portfoliophoto) {
			        console.log('photo has been uploaded');
			        current.photo = self.photos['portfoliophoto['+i+']'];
			        //current.photo = _.propertyOf(self.photos)("'portfoliophoto["+i+"]'");
			        console.log(current.photo);
		        } else {
			        console.log('photo was already on page');
			        current.photo = self.__req.body.portfoliophoto[i];
			        console.log(current.photo);
		        }*/

		        portfoio.push(current);
		        console.log(current);
	        }

        }

        account.portfolio = portfoio;

        console.log(account);

		var usermodel = self.models['user'];
        usermodel.findByIdAndUpdate(user._id, {$set: account}, function(err, inst){
            if (!err){
                //AccountController.settings.call(self);
                self.user = inst;

                if(self.user.locations && self.user.locations[0]) {
                    self.user.location = self.user.locations[0];
                } else {
                    self.user.location = {};
                }

                // initialize email template library
                var EmailTemplate = require('email-templates').EmailTemplate;

                // initialize the root template directory
                var emailTemplatesDir = path.resolve(__dirname, '..', 'emails')

                // initialize the actual email template
                var profileInfoChangeEmail = new EmailTemplate(path.join(emailTemplatesDir, 'change-profile'));

                // merge the template with actual data
                var mailBody = {};

                profileInfoChangeEmail.render(account, function (err, results) {

                    var mailOptions = {
                        from: 'kreateve <hello@kreateve.com>',
                        to: inst.email,
                        subject: 'Profile Change Notification',
                        html: results.html,
                        text: results.text
                    }

                    transport.sendMail(mailOptions, function (error, response) {
                        if (error) {
                            console.log(error);
                        } else {
                            console.log("Message sent: " + JSON.stringify(response));
                        }
                        transport.close(); // shut down the connection pool, no more messages
                    });

                });

                self.render('account/settings');
                //console.log(err);
            }else{
                this.err_msg = err.message;
                self.render('account/settings');
                console.log(err);
            }
        });
    };

	if (typeof self.__req.files !== 'undefined') {

	    /*if (typeof self.__req.files.photo !== 'undefined') {
			var fileName = self.__req.files.filename;
	        var fileExtension = self.__req.file.originalname.substr(self.__req.file.originalname.indexOf('.'));
	        account.photo = '/accounts_data/' + user._id + '/' + fileName + fileExtension;
	        fs.ensureDir(accountDir, function (err) {
	            fs.move('public/uploads/' + fileName, accountDir + '/' + fileName + fileExtension, function (err) {
	                if (err) {
	                    self.err_msg = err.message;

	                    if(self.user.locations && self.user.locations[0]) {
	                        self.user.location = self.user.locations[0];
	                    } else {
	                        self.user.location = {};
	                    }

	                    return self.render('account/settings');
	                }

	                //composeAndUpdateAccount();
	            });
	        });
		}*/

		if (typeof self.__req.files !== 'undefined') {
			self.photos = {};
			self.__req.files.forEach(function(item) {
				console.log(item);
				var fieldName = item.fieldname;
				var fileName = item.filename;
		        var fileExtension = item.originalname.substr(item.originalname.indexOf('.'));


		        self.photos[fieldName] = '/accounts_data/' + user._id + '/' + fileName + fileExtension;
		        //item.path = '/accounts_data/' + user._id + '/' + fileName + fileExtension;



		        fs.ensureDir(accountDir, function (err) {
		            fs.move('public/uploads/' + fileName, accountDir + '/' + fileName + fileExtension, function (err) {
		                if (err) {
		                    self.err_msg = err.message;

		                    if(self.user.locations && self.user.locations[0]) {
		                        self.user.location = self.user.locations[0];
		                    } else {
		                        self.user.location = {};
		                    }

		                    return self.render('account/settings');
		                }
		                //composeAndUpdateAccount();
		            });
		        });
		    });
		    //.push(entry);
		}
		//console.log(self.__req);
		composeAndUpdateAccount();

    } /*else {
        if (typeof self.__req.body.photo !== 'undefined' && self.__req.body.photo !== null && self.__req.body.photo !== '' ) {
            account.photo = self.__req.body.photo;
        } else {
            account.photo = null;
        }
		composeAndUpdateAccount();
    }*/

	/*if (typeof self.__req.files !== 'undefined') {
	    var fileName = self.__req.files.filename;
        var fileExtension = self.__req.file.originalname.substr(self.__req.file.originalname.indexOf('.'));
        fs.ensureDir(accountDir, function (err) {
            fs.move('public/uploads/' + fileName, accountDir + '/' + fileName + fileExtension, function (err) {
                if (err) {
                    self.err_msg = err.message;

                    if(self.user.locations && self.user.locations[0]) {
                        self.user.location = self.user.locations[0];
                    } else {
                        self.user.location = {};
                    }

                    return self.render('account/settings');
                }
                account.photo = '/accounts_data/' + user._id + '/' + fileName + fileExtension;
                 composeAndUpdateAccount();
            });
        });
    } else {
        if (typeof self.__req.body.photo !== 'undefined' && self.__req.body.photo !== null && self.__req.body.photo !== '' ) {
            account.photo = self.__req.body.photo;
        } else {
            account.photo = null;
        }
      composeAndUpdateAccount();
    }*/

}

AccountController.verifyemail= function(req,res){
	var token =  this.param('token');
    var email =  this.param('username');

	var account = {};

    var usermodel = this.models['user'];
 	  var self = this;
    self.email = email;

    usermodel.findOneAndUpdate({'email':email, 'token':token}, {'isEmailVerified': true}, function (err, userObj) {

    	if(!err){

			if(userObj == null){
				self.err_msg = "Cannot verify your account, token is invalid";
    			return self.render('account/invalidToken',{message:self.err_msg});
    		} else{

    			var timeDiff = new Object();

                var totalDiff = Date.now() - userObj.tokenDate;

                timeDiff.days = Math.floor(totalDiff / 1000 / 60 / 60 / 24);

                timeDiff.hours = Math.floor(totalDiff / 1000 / 60 / 60);

                console.log(" Reset Token duration: " + totalDiff + ' : ' + timeDiff.days + ' : ' + timeDiff.hours);

                if( timeDiff.hours < tokenExpiryLimit) {

    				userObj.save(function(err) {
                		console.log( "Update" );
            		});
            		self.userDetails = userObj;
            		return self.render('account/accountVerified');
            	} else{
            	    console.log("Token expired");
					self.err_msg = "Cannot verify your account, token is expired";

    				return self.render('account/invalidToken',{message:self.err_msg});
            	}
            }
    	} else{
    		console.log("error ");
			self.err_msg = "Cannot verify your account, token is invalid";
    		return self.render('account/invalidToken',{message:self.err_msg});
        }
    });

}

AccountController.logout= function() {
    this.req.logout();
    this.redirect('/');
}

//========== filters
AccountController.before('settings', require('connect-ensure-login').ensureLoggedIn('account/login'));
AccountController.before('loginForm', require('connect-ensure-login').ensureLoggedOut('/'));

module.exports = AccountController;

