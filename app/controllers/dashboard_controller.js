var locomotive = require('locomotive')
  , Controller = locomotive.Controller;
var mongoose = require('mongoose');
var con_login = require('connect-ensure-login');
var options = require('../files/options.json');
var moment = require('moment');
var async = require('async');


var DashboardController = new Controller();

DashboardController.show = function() {
	this.user = this.req.user;
	this.userCart = this.req.userCart;
    var project = this.models['projects'];
	var opportunity = this.models['opportunities'];
	var marketplace = this.models['marketplace'];
	var self = this;
	self.moment = moment;
    async.parallel(
	    [
	        function(callback){
	            project.find({createdBy: self.user._id}, null, {sort:{ createDate: -1 }}, callback);
	        },
	        function(callback){
	            opportunity.find({createdBy: self.user._id}, null, {sort:{ createDate: -1 }}, callback);
	        }
	    ],
	    function(err, results){
			var marketplaceItemsResult = {};
	        // can use r.team and r.games as you wish
			if (err) {
				return self.render("app_notfound");
			}
			async.each(results[0], function(projectItem, cb) {
				if (projectItem.status !== 'Published') {
					return cb(null);
				}
				marketplace.findOneByProjectId(projectItem._id, function(err, marketplaceItem) {
					if (err) {
						return cb(err);
					}
					marketplaceItemsResult[projectItem._id] = marketplaceItem;
					cb(null);
				});
			}, function(err) {
				if (err) {
					return self.render("app_notfound");
				}
				self.results = {
					projects: results[0],
					opportunities: results[1],
					marketplaceItems: marketplaceItemsResult
				};
				self.render();
			});
	    }
	);

    //this.user = this.req.user;
    //this.render();
};

//PagesController.before(['dashboard', 'solutions', 'services'], require('connect-ensure-login').ensureLoggedIn('account/login'));
DashboardController.before('*', function(req, res, next){
    // this executes before any action is invoked
    // if you want to insert a middleware
	require('connect-ensure-login').ensureLoggedIn('account/login')(req,res,next);
    // or
    //next();
});

module.exports = DashboardController;
