"use strict";

var locomotive = require('locomotive'),
    Controller = locomotive.Controller;

var options = require('../files/options.json'),
    changecase = require('change-case'),
    mongoose = require('mongoose'),
    bcrypt = require('bcrypt-nodejs'),
    fs = require('fs-extra'),
    async = require('async'),
    _ = require('underscore'),
    path = require('path'),
    passport = require('passport');



var MessageController = new Controller();

MessageController.create = function() {

    // Generate unique id for the room
    var id = Math.round((Math.random() * 1000000));

    // Redirect to the random room
    this.redirect('/message/chat/'+id);
}

MessageController.chat = function() {
    this.user = this.req.user;
    this.render('');
}


module.exports = MessageController;