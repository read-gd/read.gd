
var locomotive = require('locomotive'),
	Controller = locomotive.Controller;
var passport = require('passport');
var mongoose = require('mongoose');
var con_login = require('connect-ensure-login');
var options = require('../files/options.json');
var moment = require('moment');
var geoip = require('geoip-lite');
var url = require('url');
var async = require('async');
var _ = require('underscore');
var fs = require('fs-extra');

var ProjectsController = new Controller();

ProjectsController.show = function() {
	this.user = this.req.user;
	this.userCart = this.req.userCart;
	var id = this.param("project_id");
	var user = this.req.user;
	var project = this.models['projects'];
	var self = this;
	project.findById(id, function(err, item) {
		if (!err) {
			self.project = item;
			self.render();
		} else {
			self.render("app_notfound");
		}
	});
	//this.render();
}

ProjectsController.read = function() {
	this.user = this.req.user;
	this.userCart = this.req.userCart;
	var id = this.param("project_id");
	var user = this.req.user;
	var project = this.models['marketplace'];
	var self = this;

	project.findById(id)
    .populate('createdBy projectId')
    .exec(function(err, item){
        if (!err) {
			self.project = item;
			self.body = item.projectId.body;
			//self.hostname = self.__req.headers.host;
			self.render();
		} else {
			self.render("app_notfound");
		}
    });

	//this.render();
}

ProjectsController.createForm = function() {
	this.user = this.req.user;
	this.userCart = this.req.userCart;
	this.type = this.param('projectType');

	if(this.type === "book") {
		this.projectDisplay = "Book";
		this.projectType = this.type;

	} else if(this.type === "shortstory") {
		this.projectDisplay = "Short Story";
		this.projectType = this.type;

	} else if(this.type === "magazine") {
		this.projectDisplay = "Magazine";
		this.projectType = this.type;

	} else if(this.type === "playwright") {
		this.projectDisplay = "Playwright";
		this.projectType = this.type;

	} else if(this.type === "research") {
		this.projectDisplay = "Research Paper";
		this.projectType = this.type;

	} else if(this.type === "screenplay") {
		this.projectDisplay = "Screenplay";
		this.projectType = this.type;

	} else if(this.type === "design") {
		this.projectDisplay = "Design";
		this.projectType = this.type;

	} else {
		this.projectDisplay = "Project";
		this.projectType = this.type;
	}

	this.render();

}
ProjectsController.create = function() { //register or signup
	this.user = this.req.user;
	this.userCart = this.req.userCart;
	var project = mongoose.model('project');
	var item = new project();
	var user = this.req.user,
	body = {};
	//item.name = this.param('project');
	//item.type = this.param('type');
	item.name = "Untitled";
	item.type = this.param('projectType');
	//item.category = this.param('category');
	//var services = this.param('services');
	//item.services = [];

	if(item.type){
		item.type = item.type.toLowerCase();
	}

	/*if (services) {
		if(services.constructor === Array) {
			services.forEach(function (service) {
				//console.log(JSON.parse(address));
				service = JSON.parse(service);
				//console.log(address.street);
				item.services.push(service);
			});
		} else {
			item.services.push(JSON.parse(services));
		}

	}*/
	item.createdBy = user;
	var self = this;

	body.id = 1;
	body.order = 1;
	body.title = "Chapter 1";
	body.content = "";

	item.body.push(body);

	item.save(function(err, item) {
		if (err) return self.render("create", {
			message: "error found"
		});
		self.project = item;
		//console.log(self.project._id);
		return self.redirect('/projects/edit/' + self.project._id);
		//self.redirect('/project/edit');
	});
}
ProjectsController.editForm = function(id) {
	this.user = this.req.user;
	this.userCart = this.req.userCart;
	var id = this.param("project_id");
	var user = this.req.user;
	var project = this.models['projects'];
	var self = this;
	project.findById(id, function(err, item) {
		if (!err) {
			self.project = item;
			self.project.body = _.sortBy(self.project.body, 'order');
			self.moment = moment;
			self.user = user;
			//console.log(user);
			self.hostname = self.__req.headers.host;
			self.render("edit_written_form");
			
		} else {
			console.log(err);
			self.render("app_notfound");
		}
	});
};

ProjectsController.coverPhoto = function() {
	this.user = this.req.user;
	this.userCart = this.req.userCart;
	var id = this.param("project_id");
	var project = this.models['projects'];
	var self = this;
	var projectDir = 'public/projects_data/' + id;
	var fileUpload = this.param("")

	project.findById(id, function(err, item) {
		if (err) {
			console.log(err);
			return self.render("app_notfound");
		}

		if (typeof self.__req.file !== 'undefined') {
			var fileName = self.__req.file.filename;
			console.log(fileName);
			var fileExtension = self.__req.file.originalname.substr(self.__req.file.originalname.indexOf('.'));
			fs.ensureDir(projectDir, function(err) {
				fs.move('public/uploads/' + fileName, projectDir + '/' + fileName + fileExtension, function(err) {
					if (err) {
						console.log(err);
						return self.render("app_notfound");
					}
					item.coverPhoto = '/projects_data/' + id + '/' + fileName + fileExtension;

					console.log(item.files);
					if (item.files) {
						item.files.push({'location':item.coverPhoto, 'type':'design'});
					} else {
						item.files = [];
						item.files.push('/projects_data/' + id + '/' + fileName + fileExtension)
					}

					saveProjectCoverPhoto(item);
				});
			});
		} else {
			item.coverPhoto = null;
			//item.files.push('/projects_data/' + id + '/' + fileName + fileExtension);
			saveProjectCoverPhoto(item);
		}
	});
	var saveProjectCoverPhoto = function(item) {
		item.save(function(err, result) {
			if (err) {
				console.log(err);
				self.render("app_notfound");
			} else {
				self.redirect("/projects/edit/" + result._id);
			}
		});
	};
};

ProjectsController.uploadImage = function() {
	this.user = this.req.user;
	this.userCart = this.req.userCart;
	var id = this.param("project_id");
	var project = this.models['projects'];
	var self = this;
	var projectDir = 'projects_data/' + id;

	fs.ensureDirSync(projectDir);
	console.log(projectDir);
	project.findById(id, function(err, item) {
		if (err) {
			console.log(err);
			return self.render("app_notfound");
		}

		var fileName = self.__req.file.filename;
		var fileExtension = self.__req.file.originalname.substr(self.__req.file.originalname.indexOf('.'));
		fs.ensureDir('public/' + projectDir, function(err) {
			fs.move('public/uploads/' + fileName, 'public/' + projectDir + '/' + fileName + fileExtension, function(err) {
				if (err) {
					self.err_msg = err.message;
					return self.render('app_notfound');
					console.log(err.message);
				}
				var projectImagesJsonFile = projectDir + '/' + id + '_imagesjson.json';
				console.log(projectImagesJsonFile);
				fs.ensureFile(projectImagesJsonFile, function(err) {
					var newImageJsonEntry = {
						thumb: '/' + projectDir + '/' + fileName + fileExtension,
						image: '/' + projectDir + '/' + fileName + fileExtension,
						title: ''
					};
					fs.readJson(projectImagesJsonFile, function(err, content) {
						if (typeof content === 'undefined' || content === null) {
							content = [];
						}
						content.push(newImageJsonEntry);
						console.log(newImageJsonEntry);
						fs.writeJson(projectImagesJsonFile, content, function(err) {
							if (err) {
								self.err_msg = err.message;
								console.log(err.message);
								return self.render('app_notfound');
							}
							console.log(content);
							return self.res.json({
								filelink: '/' + projectDir + '/' + fileName + fileExtension
							});
						});
					});
				});
			});
		});
	});
};

ProjectsController.getImagesJson = function() {
	var id = this.param("project_id");
	this.user = this.req.user;
	this.userCart = this.req.userCart;
	var project = this.models['projects'];
	var self = this;

	project.findOne({_id: id, createdBy: self.user._id.toString()}, function(err, item) {
		if (err) {
			return self.res.status(500).end();
		}
		if (typeof item === 'undefined' || item === null) {
			return self.res.status(403).end();
		}

		var projectImagesJsonFile = 'projects_data/' + id + '/' + id + '_imagesjson.json';
		fs.ensureFile(projectImagesJsonFile, function(err) {
			if (err) {
				return self.res.status(500).end();
			}
			fs.readJson(projectImagesJsonFile, function(err, content) {
				if (err) {
					return self.res.status(500).end();
				}
				return self.res.json(content);
			});
		});
	});
};

ProjectsController.getPrinted = function() {
	var id = this.param("project_id");
	this.user = this.req.user;
	this.userCart = this.req.userCart;
	var project = this.models['projects'];
	var self = this;
	var printedType = this.param("print_type");

	project.findOne({_id: id, createdBy: self.user._id.toString()}, function(err, item) {
		if (err) {
			return self.res.status(500).end();
		}
		if (typeof item === 'undefined' || item === null) {
			return self.res.status(403).end();
		}

		if (printedType === 'epub') {
			return self.res.download('projects_data/' + id + '/' + id + '.epub');
		} else if (printedType === 'mobi') {
			return self.res.download('projects_data/' + id + '/' + id + '.mobi');
		}
	});
};

ProjectsController.deleteConfirm = function() {
	this.user = this.req.user;
	this.userCart = this.req.userCart;
	var id = this.param("project_id");
	var user = this.req.user;
	var project = this.models['projects'];
	var self = this;
	project.findById(id, function(err, item) {
		if (!err) {
			self.project = item;
			self.render();
		} else {
			self.render("app_notfound");
		}
	});
	//this.render();
}

ProjectsController.deleteProject = function(id) {
	this.user = this.req.user;
	this.userCart = this.req.userCart;
	var id = this.param("project_id");
	var user = this.req.user;
	var project = this.models['projects'];
	var self = this;
	project.findByIdAndRemove(id, function(err, item) {
		if (!err) {
			fs.remove('projects_data/' + id, function() {});
			fs.remove('public/projects_data/' + id, function() {});
			return self.redirect('/dashboard');
		} else {
			console.log(err);
			//self.render("app_notfound");
		}
	});
}

ProjectsController.edit = function() {
/*var client = {};
    var client_id = this.param("client_id");
    var user = this.req.user;
    var self = this;

    client.name=this.param('app_name');
    client.client_secret=this.param('client_secret');
    client._creator = user;


    var client = this.models['client'];
    client.findByIdAndUpdate(client_id, client, function(err, inst){
        if (!err){
            UserController.listApp.call(self);
        }else{
            this.err_msg = err.message;
            self.render('add_app_form');
        }
    });*/
}
ProjectsController.publishForm = function() {
	this.user = this.req.user;
	this.userCart = this.req.userCart;
	var id = this.param("project_id");
	var user = this.req.user,
	project = this.models['projects'],
	author = this.models['user'],
	marketplace = this.models['marketplace'],
	self = this,
	author_id = null;

	async.parallel(
	    {
	        projects: function(callback){
	            project.findById(id, function(err, projects) {
					if (!err) {
						callback(err, projects);
						//self.project = item;
						//author_id = projects._id;
						//console.log(projects);
						//self.render();
					} else {
						self.render("app_notfound");
					}
				});
	        },
	        authors: function(callback){
	            //console.log(async.parallel.projects._id);
	            author.findById(self.author_id, function(err, authors) {
					if (!err) {

						callback(err, authors);
					}
				});
	        },
			marketplaceItem: function(callback) {
				marketplace.findOneByProjectId(id, callback);
			}
	    },
	    function(e, results){
	        // can use r.team and r.games as you wish
	        self.results = results;
	        //console.log(results);
	        self.render();
	    }
	);

	/*async.parallel(
	    {
	        projects: function(callback){
	            project.find(
			    	{createdBy: user._id},
			    	null,
			    	{sort:{ createDate: -1 }},
			    	function(err, projects){
				        if ( !err){
				            //self.projects = projects;
				            callback(err, projects);
				        }else{
				            self.render("app_notfound");
				        }

			    });
	        },
	        opportunities: function(callback){
	            opportunity.find(
			    	{createdBy: user._id},
			    	null,
			    	{sort:{ createDate: -1 }},
			    	function(err, opportunities){
				        if ( !err){
				        	//self.solutions = solutions;
							callback(err, opportunities);
				        }else{
				        	self.render("app_notfound");
				        }

			    });
	        },
	    },
	    function(e, results){
	        // can use r.team and r.games as you wish
	        self.results = results;
	        self.render();
	    }
	);*/


};

ProjectsController.publish = function() {
	this.user = this.req.user;
	this.userCart = this.req.userCart;

	var ip = this.req.param("ip"); // for testing purpose
	ip = ip || this.req.headers['x-forwarded-for'] || this.req.connection.remoteAddress  ||  this.__req.socket.remoteAddress || this.__req.connection.socket.remoteAddress;

	var geo = geoip.lookup(ip);
	var countryLocation = null;

	if (geo) {
		countryLocation = geo.country;
	}

	var project = this.models['projects'];
	var self = this;
	project.findById(this.param("project_id"), function(err, projectItem) {
		if (err) {
			return self.render('/error');
		}
		var marketplace = self.models['marketplace'];
		marketplace.findOneByProjectId(self.param("project_id"), function(err, marketplaceItem) {
			if (err) {
				return self.render('/error');
			}
			var marketplaceModel = mongoose.model('marketplace_item');
			if (marketplaceItem === null) {
				marketplaceItem = new marketplaceModel();
			}
			marketplaceItem.projectId = self.param("project_id");
			marketplaceItem.name = self.param('name');
			marketplaceItem.files = projectItem.files;
			if (self.param('coverPhoto') !== '') {
				marketplaceItem.coverPhoto = self.param('coverPhoto');
			}
			marketplaceItem.description = self.param('description');
			marketplaceItem.price = self.param('price');
			marketplaceItem.createdCountry = countryLocation;
			marketplaceItem.category = self.param('category');
			marketplaceItem.createdBy = self.user;
			if (projectItem.author) {
				marketplaceItem.author = projectItem.author;
			}
			marketplaceItem.save(function(err, item) {
				if (err) return self.render("create", {
					message: "error found"
				});
				projectItem.status = 'Published';
				projectItem.save(function(err) {
					if (err) {
						return self.render('/error');
					}
					self.marketplace = item;
					return self.redirect('/marketplace/' + self.marketplace._id);
				});
			});
		});
	});
};
//ProjectController.before(['dashboard', 'solutions', 'services'], require('connect-ensure-login').ensureLoggedIn('account/login'));
ProjectsController.before('*', function(req, res, next) {
	// this executes before any action is invoked
	// if you want to insert a middleware
	require('connect-ensure-login').ensureLoggedIn('account/login')(req, res, next);
	// or
	//next();
});
module.exports = ProjectsController;