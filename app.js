var locomotive  = require('locomotive'),
    bootable = require('bootable'),
    path        = require('path'),
    httpSocketioServer = require('locomotive-http-socketio-server');


var settings = {
    port: process.argv[2] || 3000, // default
    host: '127.0.0.1',
    env : process.env.NODE_ENV || 'production'
};

// Create a new application and initialize it with *required* support for
// controllers and views.  Move (or remove) these lines at your own peril.
var app = new locomotive.Application();
app.phase(locomotive.boot.controllers(__dirname + '/app/controllers'));
app.phase(locomotive.boot.views());

// Add phases to configure environments, run initializers, draw routes, and
// start an HTTP server.  Additional phases can be inserted as neeeded, which
// is particularly useful if your application handles upgrades from HTTP to
// other protocols such as WebSocket.
app.phase(require('bootable-environment')(__dirname + '/config/environments'));
app.phase(bootable.initializers(__dirname + '/config/initializers'));
app.phase(locomotive.boot.routes(__dirname + '/config/routes'));
app.phase(locomotive.boot.httpServer(settings));
//app.phase(httpSocketioServer(settings));
//app.phase(require(__dirname + '/app/lib/chatio'));

// Boot the application.  The phases registered above will be executed
// sequentially, resulting in a fully initialized server that is listening
// for requests.
app.boot(function(err) {
    if (err) {
        console.error(err.message);
        console.error(err.stack);
        return process.exit(-1);
    }
});


