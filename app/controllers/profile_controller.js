var locomotive = require('locomotive'),
  Controller = locomotive.Controller,
  options = require('../files/options.json');
var moment = require('moment');
var async = require('async');

var ProfileController = new Controller();

ProfileController.show = function() {
	//this.user = this.req.user;
	if ( ! id)
	var id = this.param("user_id");
	var user = this.req.user;
	this.user = this.req.user;
    this.userCart = this.req.userCart;
	var profile = this.models['user'];
	var self = this;
	self.hostname = self.__req.headers.host;
	var project = this.models['projects'];
	var opportunity = this.models['opportunities'];
	var marketplace = this.models['marketplace'];
	self.moment = moment;
    async.parallel(
	    [
	        function(callback){
	            project.find({createdBy: id, status: 'Published'}, null, {sort:{ createDate: -1 }}, callback);
	        },
	        function(callback){
	            opportunity.find({createdBy: id}, null, {sort:{ createDate: -1 }}, callback);
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

				profile.findById(id, function(err, item){
			       if ( !err){
			          self.results = {
							projects: results[0],
							opportunities: results[1],
							marketplaceItems: marketplaceItemsResult
						};
			          self.profile = item;
			          self.render();
			       }else{
			           self.render("app_notfound");
			       }

			    });
			});
	    }
	);

    //this.render();
}

//ServicesController.before([], require('connect-ensure-login').ensureLoggedIn('account/login'));

ProfileController.before('*', function(req, res, next){
    // this executes before any action is invoked
    // if you want to insert a middleware
	require('connect-ensure-login').ensureLoggedIn('account/login')(req,res,next);
    // or
    //next();
});

module.exports = ProfileController;
