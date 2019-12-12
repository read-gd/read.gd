var locomotive = require('locomotive')
  , Controller = locomotive.Controller;
var passport = require('passport');
var con_login = require('connect-ensure-login');

var PagesController = new Controller();

PagesController.main = function(req, res) {
	this.user = this.req.user; // from passport
	this.userCart = this.req.userCart;

	var marketplace = this.models['marketplace'],
        self = this,
        query = {};

    	//req.i18n.setLocale('en');
	//console.log(this.req.i18n.locale);
	//this.i18n = this.req.i18n;
	//console.log( this.req.i18n.__("Hello!") );
	self.l = {
        signup: this.req.i18n.__("Signup"),
        login: this.req.i18n.__("Login"),
        cover: this.req.i18n.__("The best way to publish your book"),
        tagline: this.req.i18n.__("<strong>kreateve</strong> is a simple and intuitive platform for digital self-publishing."),
        getstarted: this.req.i18n.__("Get Started"),
        projectDescription: this.req.i18n.__("You are able to create, edit and sell your work all in one place. We give you access to editors, designers, and publicists who will guide you in producing your best work."),
        projectSteps: this.req.i18n.__("<strong>kreateve</strong> simplifies the publishing process into 4 easy-to-follow steps:"),
        stepsSignup: this.req.i18n.__("The first step to reaching your dream. Once you're done your experience will be tailored to fit your user type."),
        stepsBook: this.req.i18n.__("Create your Book"),
        stepsBooksDesc: this.req.i18n.__("The Editor experience is very simple. Write your book and preview it as you go, to make sure everything meets your expectations."),
        stepsCrew: this.req.i18n.__("Build your Crew"),
        stepsCrewDesc: this.req.i18n.__("Whether you need the help of an editor, designer, or publicist. We streamline the process of finding help to fit your needs."),
        publish: this.req.i18n.__("Publish"),
        stepsPublishDesc: this.req.i18n.__("Once you're done writing, editing, and designing your masterpiece, publish it directly to our Marketplace to start selling immediately."),
        features: this.req.i18n.__("Features"),
        dashboard: this.req.i18n.__("Dashboard"),
        dashDesc: this.req.i18n.__("This is your portal to all parts of our platform. We provide you with real-time reader stats, marketplace stats, etc. You are able to see your project’s status, who else is working on the project with you and much more."),
        editInterface: this.req.i18n.__("Editing Interface"),
        editDesc: this.req.i18n.__("This is the heart of our platform. You have all you need to create your project and format it just the way you like."),
        marketplace: this.req.i18n.__("Marketplace"),
        marketDesc: this.req.i18n.__("You are in complete control of your pricing and branding. You also have the option to promote your newly published book using our advertising manager (coming soon)."),
        services: this.req.i18n.__("Services"),
        servicesDesc: this.req.i18n.__("Here you can find a list of all the service providers available, categorized by their type of service. Users can filter through, view, and contact service providers according to their type of service, location, experience, ratings, and prices."),
        welcomeFooter: this.req.i18n.__("Welcome to <strong>kreateve</strong>.<br>You can only find out how awesome this is by giving it a try!"),
        joinKreateve: this.req.i18n.__("Join kreateve")

    }
	marketplace.find(query, {}, { sort:{ createDate: -1 } })
        .populate('createdBy projectId')
        //.where('status').equals('Open')
        //.where('remote').equals(true)
        //.or([{ 'remote': true }, { 'location.country': country.name }])
        //.where('location.country').equals(country.name)
        .exec(function(err, list){
            if(!err){
                self.list = list;
                self.render();
            }else{
                self.render('/error');
            }
        });

}
PagesController.tour = function() {
	this.user = this.req.user; // from passport
	this.userCart = this.req.userCart;
	this.render();
}
PagesController.pricing = function() {
	this.user = this.req.user; // from passport
	this.userCart = this.req.userCart;
	this.render();
}

PagesController.contact = function() {
	this.user = this.req.user; // from passport
	this.userCart = this.req.userCart;
	this.render();
}

PagesController.developers = function() {
	this.user = this.req.user; // from passport
	this.userCart = this.req.userCart;
	this.render();
}

PagesController.terms = function() {
	this.user = this.req.user; // from passport
	this.userCart = this.req.userCart;
	this.render();
}

PagesController.privacy = function() {
	this.user = this.req.user; // from passport
	this.userCart = this.req.userCart;
	this.render();
}

//PagesController.before(['dashboard', 'solutions', 'services'], require('connect-ensure-login').ensureLoggedIn('account/login'));
/*
PagesController.before('*', function(req, res, next){
    // this executes before any action is invoked
    // if you want to insert a middleware
//    require('connect-ensure-login').ensureLoggedIn('account/login')(req,res,next);
    // or
    next();
});
*/
module.exports = PagesController;
