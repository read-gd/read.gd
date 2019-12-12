fvar locomotive = require('locomotive'),
	Controller = locomotive.Controller;
var passport = require('passport');
var mongoose = require('mongoose');
var con_login = require('connect-ensure-login');
var options = require('../files/options.json');
var moment = require('moment');

var OpportunitiesController = new Controller();

OpportunitiesController.show = function() {
	this.user = this.req.user;
    this.userCart = this.req.userCart;
	this.moment = moment;
	var opportunity = this.param("opportunities_id");
	if ( ! opportunity) {
		var url = {'category': {$in: ['fbook', 'designer', 'editor', 'engineer', 'investor', 'manufacturer', 'prototyper']}};
	} else {
		var url = {'category': solution};
	}

	var opportunities = this.models['opportunities'],
        self = this;

    opportunities.find(url, 'title description reward _id createDate problem', function(err, opportunitieslist){
        if(!err){
            self.list = opportunitieslist;
            self.render('show');
        }else{
            self.render('/error');
        }
    });
    //this.render();
}

OpportunitiesController.createForm = function() {
	this.user = this.req.user;
    this.userCart = this.req.userCart;
	this.render();
}

OpportunitiesController.create = function() {
	this.user = this.req.user;
    this.userCart = this.req.userCart;
    var opportunities = mongoose.model('opportunity');
    var opportunity = new opportunities();
	var user = this.req.user;

    opportunity.title = this.param('title');
    opportunity.category = this.param('category');
    opportunity.reward = this.param('reward');
    opportunity.problem = this.param('problem');
    opportunity.moredetails = this.param('moredetails');

    //var services = this.param('services');
    //item.services = [];

    /*if (files) {
		services.forEach(function(service){
		   	service = JSON.parse(service);
		  	item.services.push(service);
		});
	}*/

    opportunity.createdBy = user;

	var self = this;
    opportunity.save(function (err, opportunity) {
        if (err)
            return self.render("create", {message:"error found"});
		self.opportunity = opportunity;
		//console.log(self.project._id);
        return self.redirect('/opportunities/edit/'+self.opportunity._id);
        //self.redirect('/project/edit');
    });
}

OpportunitiesController.editForm = function(id) {
	this.user = this.req.user;
    this.userCart = this.req.userCart;
	if ( ! id) id = this.param("opportunities_id");
	var user = this.req.user;
	var opportunities = this.models['opportunities'];
	var self = this;
    opportunities.findById(id, function(err, item){
       if ( !err){
          self.opportunity = item;
          self.render("edit_form");

       }else{
           console.log(err);
           //self.render("app_notfound");
       }

    });

}

OpportunitiesController.update = function(id) {
	var id = this.param("opportunities_id");
	var user = this.req.user;
    this.user = this.req.user;
    this.userCart = this.req.userCart;
    var opportunity = {};
    var self = this;

	opportunity.title = this.param('title');
    opportunity.category = this.param('category');
    opportunity.reward = this.param('reward');
    opportunity.problem = this.param('problem');
    opportunity.moredetails = this.param('moredetails');

    var opportunities = this.models['opportunities'];
    opportunities.findByIdAndUpdate(id, {$set: opportunity}, function(err, inst){
        if (!err){
            self.redirect('dashboard');
            //console.log(err);
        }else{
            this.err_msg = err.message;
            //self.render();
            //AccountController.settings.call(self);
            //this.redirect('/');
        }
    });
}

OpportunitiesController.single = function() {
	if ( ! id)
	var id = this.param("opportunities_id");
	var user = this.req.user;
    this.user = this.req.user;
    this.userCart = this.req.userCart;
	var opportunities = this.models['opportunities'];
	var self = this;
    opportunities.findById(id, function(err, item){
       if ( !err){
          self.opportunity = item;
          self.render();
       }else{
           self.render("app_notfound");
       }

    });
}


//PagesController.before(['dashboard', 'solutions', 'services'], require('connect-ensure-login').ensureLoggedIn('account/login'));

OpportunitiesController.before('*', function(req, res, next){
    // this executes before any action is invoked
    // if you want to insert a middleware
	require('connect-ensure-login').ensureLoggedIn('account/login')(req,res,next);
    // or
    //next();
});

module.exports = OpportunitiesController;
