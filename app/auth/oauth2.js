/**
 * Module dependencies.
 */
var oauth2orize = require('oauth2orize')
    , passport = require('passport')
    , login = require('connect-ensure-login')
    , mongoose = require('mongoose')
    , utils = require('../util/util.js');

// create OAuth 2.0 server
var server = oauth2orize.createServer();

// Register serialialization and deserialization functions.
//
// When a client redirects a user to user authorization endpoint, an
// authorization transaction is initiated.  To complete the transaction, the
// user must authenticate and approve the authorization request.  Because this
// may involve multiple HTTP request/response exchanges, the transaction is
// stored in the session.
//
// An application must supply serialization functions, which determine how the
// client object is serialized into the session.  Typically this will be a
// simple matter of serializing the client's ID, and deserializing by finding
// the client by ID from the database.

server.serializeClient(function(client, done) {
    return done(null, client.id);
});

server.deserializeClient(function(id, done) {
    var client = mongoose.models['client'];

    client.findById(id, function(err, client) {
        if (err) { return done(err); }
        return done(null, client);
    });
});

// Register supported grant types.
//
// OAuth 2.0 specifies a framework that allows users to grant client
// applications limited access to their protected resources.  It does this
// through a process of the user granting access, and the client exchanging
// the grant for an access token.

// Grant authorization codes.  The callback takes the `client` requesting
// authorization, the `redirectURI` (which is used as a verifier in the
// subsequent exchange), the authenticated `user` granting access, and
// their response, which contains approved scope, duration, etc. as parsed by
// the application.  The application issues a code, which is bound to these
// values, and will be exchanged for an access token.

server.grant(oauth2orize.grant.code(function(client, redirectURI, user, ares, done) {
    var AuthCode = mongoose.models['AuthorizationCode'];
    AuthCode.findOne({client_id:client.id, user_id:user.id}, function(err, inst){
        if( err ){return done(err);}

        if( inst){
            return done(null, inst.code);
        }else{
            var code = utils.uid(16);
            var data = {code:code, client_id:client.id, redirect_uri:redirectURI, user_id:user.id};

            authCode = new AuthCode(data);
            authCode.save(function(err, inst) {
              if (err) { return done(err); }
              done(null, code);
            });
      }
    })

}));

// Grant implicit authorization.  The callback takes the `client` requesting
// authorization, the authenticated `user` granting access, and
// their response, which contains approved scope, duration, etc. as parsed by
// the application.  The application issues a token, which is bound to these
// values.

server.grant(oauth2orize.grant.token(function(client, user, ares, done) {
    var token = utils.uid(256);
    var AccessToken = mongoose.models['AccessToken'];
    var data = {token:token, user_id:user.id, client_id:client.id};
    accToken = new AccessToken(data);

    accToken.save(function(err, inst) {
        if (err) { return done(err); }
        done(null, token);
    });
}));

// Exchange authorization codes for access tokens.  The callback accepts the
// `client`, which is exchanging `code` and any `redirectURI` from the
// authorization request for verification.  If these values are validated, the
// application issues an access token on behalf of the user who authorized the
// code.

server.exchange(oauth2orize.exchange.code(function(client, code, redirectURI, done) {
    var AuthCode = mongoose.models['AuthorizationCode'],
        AccessToken = mongoose.models['AccessToken'];

    AuthCode.findOne({code:code}, function(err, authCode) {
        if (err) { return done(err); }

        if (client.id !== authCode.client_id) { return done(null, false); }
        if (redirectURI !== authCode.redirect_uri) { return done(null, false); }

        var token = utils.uid(256)
        var data = {token:token, user_id:authCode.user_id, client_id:authCode.client_id};
        accToken = new AccessToken(data);

        AccessToken.save(function(err, inst) {
            if (err) { return done(err); }
            done(null, token);
        });
    });
}));

// Exchange user id and password for access tokens.  The callback accepts the
// `client`, which is exchanging the user's name and password from the
// authorization request for verification. If these values are validated, the
// application issues an access token on behalf of the user who authorized the code.

server.exchange(oauth2orize.exchange.password(function(client, username, password, scope, done) {
    var client = mongoose.models['client']
        , user = mongoose.models['user']
        , AccessToken = mongoose.models['AccessToken'];

    //Validate the client
    client.findById(client.id, function(err, localClient) {
        if (err) { return done(err); }
        if(localClient === null) {
            return done(null, false);
        }
        if(localClient.client_secret !== client.client_secret) {
            return done(null, false);
        }
        //Validate the user
        user.findOne({$or:[{email: username }, {username: username }]}, function(err, user) {
            if (err) { return done(err); }
            if(user === null) {
                return done(null, false);
            }
            if(password !== user.password) {
                return done(null, false);
            }
            //Everything validated, return the token
            var token = utils.uid(256);
            var data = {token:token, user_id:user.id, client_id:client.id};
            accToken = new AccessToken(data);

            accToken.save(function(err) {
                if (err) { return done(err); }
                done(null, token);
            });
        });
    });
}));

// Exchange the client id and password/secret for an access token.  The callback accepts the
// `client`, which is exchanging the client's id and password/secret from the
// authorization request for verification. If these values are validated, the
// application issues an access token on behalf of the client who authorized the code.

server.exchange(oauth2orize.exchange.clientCredentials(function(client, scope, done) {
    var client = mongoose.models['client']
        , user = mongoose.models['user']
        , AccessToken = mongoose.models['AccessToken'];

    //Validate the client
    client.findById(client.id, function(err, localClient) {
        if (err) { return done(err); }
        if(localClient === null) {
            return done(null, false);
        }
        if(localClient.client_secret !== client.client_secret) {
            return done(null, false);
        }

        var token = utils.uid(256);
        var data = {token:token, client_id:client.id};
        accToken = new AccessToken(data);
        //Pass in a null for user id since there is no user with this grant type
        accToken.save(function(err) {
            if (err) { return done(err); }
            done(null, token);
        });
    });
}));

// user authorization endpoint
//
// `authorization` middleware accepts a `validate` callback which is
// responsible for validating the client making the authorization request.  In
// doing so, is recommended that the `redirectURI` be checked against a
// registered value, although security requirements may vary accross
// implementations.  Once validated, the `done` callback must be invoked with
// a `client` instance, as well as the `redirectURI` to which the user will be
// redirected after an authorization decision is obtained.
//
// This middleware simply initializes a new authorization transaction.  It is
// the application's responsibility to authenticate the user and render a dialog
// to obtain their approval (displaying details about the client requesting
// authorization).  We accomplish that here by routing through `ensureLoggedIn()`
// first, and rendering the `dialog` view. 

exports.authorization = [
    login.ensureLoggedIn('account/login'),
    server.authorization(function(clientID, redirectURI, done) {
        var client = mongoose.models['client']
            , user = mongoose.models['user']
            , AccessToken = mongoose.models['AccessToken'];

        client.findById(clientID, function(err, client) {
            if (err) { return done(err); }

            // you can comment below 2 lines
            if (!client) { return done(null, false); }
//            if (!client.callback_uri != redirectURI) { return done(null, false); }

            //          been warned.
            return done(null, client, redirectURI);
        });
    })/*,  // this is because I used my own controller
    function(req, res){
        res.render('account/dialog', { transactionID: req.oauth2.transactionID, user: req.user, client: req.oauth2.client });
    }*/
]

// user decision endpoint
//
// `decision` middleware processes a user's decision to allow or deny access
// requested by a client application.  Based on the grant type requested by the
// client, the above grant middleware configured above will be invoked to send
// a response.

exports.decision = [
    login.ensureLoggedIn('account/login'),
    server.decision()
]


// token endpoint
//
// `token` middleware handles client requests to exchange authorization grants
// for access tokens.  Based on the grant type being exchanged, the above
// exchange middleware will be invoked to handle the request.  Clients must
// authenticate when making requests to this endpoint.

exports.token = [
    passport.authenticate(['basic', 'oauth2-client-password'], { session: false }),
    server.token(),
    server.errorHandler()
]