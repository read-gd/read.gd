var passport = require("passport")
    ,dummy = 1;
var multer  = require('multer'),
    upload = multer({ dest: 'public/uploads/' });

// Draw routes.  Locomotive"s router provides expressive syntax for drawing
// routes, including support for resourceful routes, namespaces, and nesting.
// MVC routes can be mapped mapped to controllers using convenient
// `controller#action` shorthand.  Standard middleware in the form of
// `function(req, res, next)` is also fully supported.  Consult the Locomotive
// Guide on [routing](http://locomotivejs.org/guide/routing.html) for additional
// information.

module.exports = function routes() {
    cl = require("connect-ensure-login");
    this.match("*", [userCartMiddleWare]);
    this.post("*", [userCartMiddleWare]);
    this.put("*", [userCartMiddleWare]);
    this.delete("*", [userCartMiddleWare]);
    this.match("/", "pages#main");
    this.match("tour", "pages#tour");
    this.match("pricing", "pages#pricing");
    this.match("contact", "pages#contact");
    this.match("developers", "pages#developers");
    this.match("terms", "pages#terms");
    this.match("privacy", "pages#privacy");

    this.match("dashboard", "dashboard#show");
	this.match("opportunities", "opportunities#show");
	this.match("marketplace", "marketplace#show");
	this.match("library", "library#show");
	this.match("services", "services#show");
	this.match('services/:usertype', "services#show");

	//========= opportunitiess creation
    this.match("opportunities/new", "opportunities#createForm");
	this.post("opportunities/new", "opportunities#create");
	//this.match("opportunities", "opportunities#show");
	this.match("opportunities/:opportunities_id", "opportunities#single");
	this.match("opportunities/edit/:opportunities_id", "opportunities#editForm");
	this.post("opportunities/edit/:opportunities_id", "opportunities#update");

    //========= project creation
	//this.match("projects/new", "projects#createForm");
	//this.match("projects/new/:projectType", "projects#createForm");
	//this.post("projects/new", "projects#create");
	this.match("projects/new/:projectType", "projects#create");
	this.post("projects/new/:projectType", "projects#create");
	this.match("projects/:project_id", "projects#show");
	this.match("projects/edit/:project_id", "projects#editForm");
	this.post("projects/edit/:project_id", "projects#edit");
    this.post("projects/coverphoto/:project_id", [upload.single('photo')]);
    this.post("projects/coverphoto/:project_id", "projects#coverPhoto");
	this.match("projects/delete/:project_id", "projects#deleteProject");
	this.match("projects/delete/confirm/:project_id", "projects#deleteConfirm");
	this.match("projects/publish/:project_id", "projects#publishForm");
	this.post("projects/publish/:project_id", "projects#publish");
	this.match("project_data/:project_id/:file", "ajax#download");
    this.post("projects/uploadimage/:project_id", [upload.single('file')]);
    this.post("projects/uploadimage/:project_id", "projects#uploadImage");
    this.match("projects/:project_id/images", "projects#getImagesJson");
    this.match("projects/:project_id/printed/:print_type", "projects#getPrinted");

	this.match("read/:project_id", "projects#read");

	//========= marketplace creation
	//this.match("marketplace", "marketplace#show");
    this.match("marketplace/checkoutlist", "marketplace#checkoutList");
    this.match("marketplace/checkoutusingexistingcard/:card_id/:total_amount", "marketplace#checkoutUsingExistingCard");
	this.match("marketplace/checkout", "marketplace#checkoutForm");
	this.post("marketplace/checkout", "marketplace#checkout");

	this.match("marketplace/thankyou", "marketplace#thankyou");

	//this.match("marketplace/:marketplace_id", "marketplace#single");
	this.match("marketplace/:id", "marketplace#single");
	this.match("marketplace/edit/:marketplace_id", "marketplace#editForm");
	this.post("marketplace/edit/:marketplace_id", "marketplace#update");

    //========= account creation
    this.match("account/login", "account#loginForm");
    this.post("account/login", "account#login");

	this.match("account/settings", "account#settings");
    //this.post("account/settings", [upload.single('photo')]);
    //this.post("account/settings", [upload.fields([ { name: 'photo', maxCount: 1 }, { name: 'portfoliophoto[]', maxCount: 20 } ])]);
    this.post("account/settings", [upload.any()]);
	this.post("account/settings", "account#update");
    this.match("account/stripecallback", "account#stripeCallback");

	this.match("account/signup", "account#signup");
    this.post("account/signup", "account#create");

    this.match("signup/individual", "account#individual");
    this.post("signup/individual", "account#create");

    this.match("signup/company", "account#company");
    this.post("signup/company", "account#create");

	this.match("account/password", "account#password");
    this.match("account/logout", "account#logout");

    this.match("account/forgot", "account#forgot");
    this.post("account/reset", "account#reset");


    this.match("account/resetpasswd", "account#resetpasswd");
    this.post("account/resetpasswd", "account#setpassword");

	  this.match("account/verifyemail", "account#verifyemail");
    this.post("account/verifyEmail", "account#resendverify");

    //========= user profiles
	this.match("profile/:user_id", "profile#show");

	//========= ajax calls
	this.match("ajax/options", "ajax#options");
	this.match("ajax/sectionload", "ajax#editorSectionLoad");
	this.match("ajax/sectionread", "ajax#readerSectionLoad");
	this.post("ajax/changepassword", "ajax#changepassword");
	this.post("ajax/editorsave", "ajax#editorSave");
	this.post("ajax/titlesave", "ajax#titleSave");
	this.post("ajax/booknamesave", "ajax#booknameSave");
	this.post("ajax/editordelete", "ajax#editorSectionDelete");
	this.post("ajax/sectionadd", "ajax#editorSectionAdd");
	this.post("ajax/sectionorder", "ajax#editorSectionOrder");
	this.post("ajax/generate", "ajax#generate");
	this.post("ajax/addtocart", "ajax#addToCart");
    this.post("ajax/removefromcart", "ajax#removeFromCart");

	this.match("admin/individuals", "admin#individuals");
	this.match("admin/companies", "admin#companies");
	this.match("admin/projects", "admin#projects");

  this.match("message/chat", "message#chat");
  this.match("message/chat/:sender/:recipient", "message#chat");
  this.match("message/home", "message#home");
  this.match("message/create", "message#create");



    //========== error handler

    function isLoggedIn(req, res, next) {

		// if user is authenticated in the session, carry on
		if (req.isAuthenticated())
			return true;

		// if they aren't redirect them to the home page
		//res.redirect('/');
	}

    function userCartMiddleWare(req, res, next) {
        if (req.user) {
            req.user.getCart(function(err, cartItems) {
                if (err) { return next(err); }
                req.userCart = cartItems;
                next();
            });
        } else {
            next();
        }
    }



    /*this.match('api/*', [ middlewareOne,         middlewareTwo ]);
    //resources
    this.namespace("api", function() {
        this.resources("jobPosts");
        this.resources("clients");
        this.resources("providers");
        this.resources("jobApplications");
        this.resources("lists");
        this.resources("states");

        // relational mapping
        this.resources("clients", function(){
            this.resources("jobPosts"); // api/clients/:client_id/jobposts
        })
        this.match('states/:state_code/cities', {
            controller: 'states',
            action: 'cities'
        });

        this.match('states/import/:city_or_state', {
            controller: 'states',
            action: 'importData'
        });

        this.match('client/:clientId/jobApplications/count', {
            controller: 'jobApplications',
            action: 'jobApplicationsCount'
        });

        this.match('client/:clientId/jobPosts/count', {
            controller: 'jobPosts',
            action: 'jobpostsCount'
        });

        this.match('clients/:clientId/jobposts', {
            controller: 'jobPosts',
            action: 'index'
        });

        this.match('providers/:providerId/jobposts', {

            controller: 'jobPosts',
            action: 'index'
        });

        this.match('providers/:providerId/clients', {
            controller: 'clients',
            action: 'index'
        });

        this.match('jobPosts/:jobPostId/jobApplications', {
            controller: 'jobApplications',
            action: 'index'
        });


    });*/

}

