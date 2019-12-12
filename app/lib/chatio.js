"use strict";

var options = require('../files/options.json'),
    changecase = require('change-case'),
    mongoose = require('mongoose'),
    fs = require('fs-extra'),
    async = require('async'),
    _ = require('underscore'),
    path = require('path'),
    passport = require('passport'),
    gravatar = require('gravatar');


module.exports = function(){

  var $this = this;


  // Initialize a new socket.io application, named 'chat'
  var chat = $this.sio.on('connection', function (socket) {

    // When the client emits the 'load' event, reply with the
    // number of people in this chat room

    socket.on('load', function (data) {

      console.log("Server onLoad");

      var room = findClientsSocket(data);

      if (room.length === 0) {
        socket.emit('peopleinchat', {number: 0});
      }
      else if (room.length === 1) {

        socket.emit('peopleinchat', {
          number: 1,
          user: room[0].username,
          avatar: room[0].avatar,
          roomId: data
        });
      }
      else if (room.length >= 2) {

        chat.emit('tooMany', {boolean: true});
      }
    });

    socket.on('monitorInvite', function (data) {
	//console.log(data);
      var room = findClientsSocket(data.recipientId);

      if (room.length === 0) {
        socket.emit('requestChat', {number: 0, recipientId:data.recipientId, senderId:data.senderId});
      }
      else if (room.length === 1) {

        socket.broadcast.to(data.recipientId).emit('requestChat',  {
          number: 1,
          user: room[0].username,
          avatar: room[0].avatar,
          recipientId: data.recipientId,
          senderId: data.senderId
        });

      }
      else if (room.length >= 2) {

        //chat.emit('tooMany', {boolean: true});
      }



      console.log("Server onMonitor " + data.recipientId + " " + room.length);

    });


    // When the client emits 'login', save his name and avatar,
    // and add them to the room
    socket.on('connectChat', function(data) {



      var room = findClientsSocket(data.recipientId);
      // Only two people per room are allowed
      if (room.length < 2) {

        // Use the socket object to store data. Each client gets
        // their own unique socket object

        socket.username = data.user;
        socket.room = data.recipientId; // is this really needed?
        socket.avatar = gravatar.url(data.avatar, {s: '140', r: 'x', d: 'mm'});

        // Add the client to the room
        socket.join(data.recipientId);

        if (room.length == 1) {

          var usernames = [],
              avatars = [];

          usernames.push(room[0].username);
          usernames.push(socket.username);

          avatars.push(room[0].avatar);
          avatars.push(socket.avatar);

          // Send the startChat event to all the people in the
          // room, along with a list of people that are in it.

          chat.in(data.recipientId).emit('alertChat', {
            boolean: true,
            recipientId: data.recipientId,
            senderId: data.senderId,
            users: usernames,
            avatars: avatars,
            name: data.name,
            email: data.email
          });
        }
      }
      else {
        //socket.emit('tooMany', {boolean: true});
      }

      console.log("Server onLoginMonitor " + data.senderId + " - " + room.length);

    });

    // When the client emits 'login', save his name and avatar,
    // and add them to the room
    socket.on('login', function(data) {



      var room = findClientsSocket(data.roomId);
      // Only two people per room are allowed
      if (room.length < 2) {

        // Use the socket object to store data. Each client gets
        // their own unique socket object

        socket.username = data.user;
        socket.room = data.roomId;
        socket.avatar = gravatar.url(data.avatar, {s: '140', r: 'x', d: 'mm'});

        // Tell the person what he should use for an avatar
        socket.emit('img', socket.avatar);


        // Add the client to the room
        socket.join(data.roomId);

        if (room.length == 1) {

          var usernames = [],
              avatars = [];

          usernames.push(room[0].username);
          usernames.push(socket.username);

          avatars.push(room[0].avatar);
          avatars.push(socket.avatar);

          // Send the startChat event to all the people in the
          // room, along with a list of people that are in it.

          chat.in(data.roomId).emit('startChat', {
            boolean: true,
            roomId: data.roomId,
            users: usernames,
            avatars: avatars
          });
        }
      }
      else {
        socket.emit('tooMany', {boolean: true});
      }

      console.log("Server onLogin " + data.roomId + " - " + room.length);
    });


    // Somebody left the chat
    socket.on('disconnect', function() {

      console.log("Server onDisconnect");
      // Notify the other person in the chat room
      // that his partner has left

      socket.broadcast.to(this.room).emit('leave', {
        boolean: true,
        room: this.room,
        user: this.username,
        avatar: this.avatar
      });

      // leave the room
      socket.leave(socket.room);
    });


    // Handle the sending of messages
    socket.on('msg', function(data){

      console.log("Server onMsg");

      // When the server receives a message, it sends it to the other person in the room.
      socket.broadcast.to(socket.room).emit('receive', {msg: data.msg, user: data.user, img: data.img});
    });
  });

  function findClientsSocket(roomId, namespace) {
    var res = [],
        ns = $this.sio.of(namespace ||"/");    // the default namespace is "/"

    if (ns) {
      for (var id in ns.connected) {

        if(roomId) {

			var index = _.indexOf(_.values(ns.connected[id].rooms), roomId);
          //var index = ns.connected[id].rooms.indexOf(roomId);
          //var index = _.indexOf(ns.connected[id].rooms, roomId);

          //console.log(index);

          if(index !== -1) {
            res.push(ns.connected[id]);
          }
        }
        else {
          res.push(ns.connected[id]);
        }
      }
    }
    return res;
  }
}