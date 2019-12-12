var locomotive = require('locomotive')
    , Controller = locomotive.Controller;
var passport = require('passport');
var mongoose = require('mongoose');
var con_login = require('connect-ensure-login');
var options = require('../files/options.json');
var nodemailer = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');
var formidable = require('formidable'),
    http = require('http'),
    util = require('util'),
    fs   = require('fs-extra'),
    changecase = require('change-case'),
    moment = require('moment');
var globalConfig = require('../../config/globals');

var transport = nodemailer.createTransport(smtpTransport(globalConfig.smtpTransport));
var AdminController = new Controller();

// segment.io setup
/*var Analytics = require('analytics-node');
var analytics = new Analytics(globalConfig.analytics.apiKey);*/

AdminController.individuals = function() {
	this.user = this.req.user;
    this.userCart = this.req.userCart;
	var usertype = this.param("usertype");
	this.moment = moment;

	var users = this.models['user'],
        self = this;

	users.find('firstname lastname photo _id locations', null, {sort:{ createDate: -1 }})
	.where("usertype").in(["author","editor", "designer", "publicist", "reader"])
    .exec(function(err, userlist){
        if(!err){
            self.list = userlist;
            self.render();
        }else{
            self.render('/error');
        }
    });
    /*
    users.find('firstname lastname photo _id', null, {sort:{ createDate: -1 }})
    .populate('createdBy')
    .where('status').equals('Open')
    .where('location.country').equals(country.name)
    .exec(function(err, userlist){
        if(!err){
            self.list = userlist;
            self.render();
        }else{
            self.render('/error');
        }
    });*/
    //this.render();
}

AdminController.companies = function() {
	this.user = this.req.user;
    this.userCart = this.req.userCart;
	var usertype = this.param("usertype");
	this.moment = moment;

	var users = this.models['user'],
        self = this;

	users.find('firstname lastname photo _id locations', null, {sort:{ createDate: -1 }})
	.where("usertype", "Company")
    .exec(function(err, userlist){
        if(!err){
            self.list = userlist;
            self.render();
        }else{
            self.render('/error');
        }
    });
    /*
    users.find('firstname lastname photo _id', null, {sort:{ createDate: -1 }})
    .populate('createdBy')
    .where('status').equals('Open')
    .where('location.country').equals(country.name)
    .exec(function(err, userlist){
        if(!err){
            self.list = userlist;
            self.render();
        }else{
            self.render('/error');
        }
    });*/
    //this.render();
}

AdminController.projects = function() {
	this.user = this.req.user;
    this.userCart = this.req.userCart;
	var usertype = this.param("usertype");
	this.moment = moment;

	var projects = this.models['projects'],
        self = this;

	projects.find('title createdBy createDate photo _id status', null, {sort:{ createDate: -1 }})
	.populate('createdBy')
    .exec(function(err, projectslist){
        if(!err){
            self.list = projectslist;
            self.render();
        }else{
            self.render('/error');
        }
    });
    /*
    users.find('firstname lastname photo _id', null, {sort:{ createDate: -1 }})
    .populate('createdBy')
    .where('status').equals('Open')
    .where('location.country').equals(country.name)
    .exec(function(err, userlist){
        if(!err){
            self.list = userlist;
            self.render();
        }else{
            self.render('/error');
        }
    });*/
    //this.render();
}



//========== filters
AdminController.before('*', function(req, res, next){
    // this executes before any action is invoked
    // if you want to insert a middleware
	require('connect-ensure-login').ensureLoggedIn('account/login')(req,res,next);
    // or
    //next();
    if (this.req.user && (this.req.user.isAdmin === true)) {
        //next();
      } else {
        //this.res.send(401, 'Unauthorized');
        //this.render('/', {message: "You Shall NOT Enter!"});
      }
    }
);
AdminController.before('loginForm', require('connect-ensure-login').ensureLoggedOut('/'));

module.exports = AdminController;

