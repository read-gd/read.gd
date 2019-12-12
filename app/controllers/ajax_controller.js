"use strict";

var locomotive = require('locomotive')
    , Controller = locomotive.Controller;
var options = require('../files/options.json'),
	changecase = require('change-case'),
	mongoose = require('mongoose'),
	bcrypt  = require('bcrypt-nodejs'),
	fs = require('fs-extra'),
	async = require('async'),
	_ = require('underscore');
var globalConfig = require('../../config/globals');

var nodemailer = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');
var path = require('path');
var passport = require('passport');


var AjaxController = new Controller();

var transport = nodemailer.createTransport(smtpTransport(globalConfig.smtpTransport));

AjaxController.options = function(req, res) {
	this.options = options;
	this.user = this.req.user;
	this.userCart = this.req.userCart;
	var user = this.req.user;
	this.changecase = changecase;
    //console.log(this.options);

    var professionslist = options.professions,
	specializationlist = [],
	skillsetlist = [],
	skills = [],
	specializations = [],
	settings = {},

	professions_input = [],
	professions_input = this.param('professions'),
	specialization_input = [],
	specialization_input = this.param('specialization'),
	skills_input = [],
	skills_input = this.param('skills');
	//return;

	//usertypes = JSON.parse(JSON.stringify(professions));

    Array.prototype.contains = function(elem){
	   for (var i in this) {
	       if (this[i] == elem) return true;
	   }
	   return false;
	}

	if (professionslist) {
	    professionslist.forEach(function(item) {
		    var specialization = item.specialization,
		    skillset = item.skillset,
			value = item.name;

		    if (professions_input && professions_input.contains((value).toLowerCase())) {
			   	for (var j = 0; j < skillset.length; j++) {
				    skillsetlist.push(skillset[j]);
				}
			    for (var k = 0; k < specialization.length; k++) {
				    specializationlist.push((specialization[k]).toLowerCase());
				}
			}
		});
	}

	if (specializationlist) {
		specializationlist.forEach(function(item){
			if (specialization_input && specialization_input.contains(item)) {
				specializations += "<option value='"+(item).toLowerCase()+"' selected>"+changecase.titleCase(item)+"</option>";
			} else {
				specializations += "<option value='"+(item).toLowerCase()+"'>"+changecase.titleCase(item)+"</option>";
	    }});
    }

    var skillslist = options.skills;
    if (skillsetlist) {
	    skillsetlist.forEach(function(item){
	    	if (skills_input && skills_input.contains(item)) {
				skills += "<div class='col-md-3'><div class='checkbox'><label><input name='skills' type='checkbox' value='"+item+"' checked='checked'>"+skillslist[item-1].name+"</label></div></div>";
		    } else {
		    	skills += "<div class='col-md-3'><div class='checkbox'><label><input name='skills' type='checkbox' value='"+item+"'>"+skillslist[item-1].name+"</label></div></div>";

		}});
	}
	//this.render();
	settings = {
		"skills": skills,
		"specializations": specializations
	}
	//console.log(settings);
	this.res.send(JSON.stringify(settings));

}

AjaxController.changepassword = function(req, res) {
	this.user = this.req.user;
	this.userCart = this.req.userCart;
	var user = this.req.user,
	account = {},
	oldpassword = this.param('oldpassword'),
	newpassword = this.param('newpassword'),
	confirmpassword = this.param('confirmpassword'),
	email = this.param('username'),
	token = this.param('token'),
	that = this;
	var output ={};

	if( email && token ) {
		console.log('Username: ' + email + ' Token: ' + token );
	}

	account.password = bcrypt.hashSync(newpassword, bcrypt.genSaltSync(8), null);

	var usermodel = this.models['user'];

	if (bcrypt.compareSync(oldpassword, user.password)){
		usermodel.findByIdAndUpdate(user._id, {$set: account}, function(err, inst){
	        if (!err){

						  output = {"success": "Your password has been changed."};

						  console.log("Response: " + JSON.stringify(inst));

							// initialize email template library
							var EmailTemplate = require('email-templates').EmailTemplate;

							// initialize the root template directory
							var emailTemplatesDir = path.resolve(__dirname, '..', 'emails')

							// initialize the actual email template
							var changePasswordEmail = new EmailTemplate(path.join(emailTemplatesDir, 'change-passwd'));

							// merge the template with actual data
							var mailBody = {};

							changePasswordEmail.render(account, function (err, results) {

								var mailOptions = {
									from: 'kreateve <hello@kreateve.com>',
									to: inst.email,
									subject: 'Password Change Notification',
									html: results.html,
									text: results.text
								}

								transport.sendMail(mailOptions, function (error, response) {
									if (error) {
										console.log(error);
									} else {
										console.log("Message sent: " + JSON.stringify(response));
									}
									transport.close(); // shut down the connection pool, no more messages
								});

							});

	        }else{
	            output = {"error": "An error occured."};
	        }
	        that.res.send(JSON.stringify(output));
	    });
	} else {
		output = {"error": "Current password is wrong."};
		this.res.send(JSON.stringify(output));
	}
}

AjaxController.editorSectionAdd = function(req, res) {
	var project_id = this.param('project_id'),
	section_id = parseInt(this.param('section_id')),
	order = parseInt(this.param('order'));
	this.user = this.req.user;
	this.userCart = this.req.userCart;
	var user = this.req.user,
	update = {},
	output = {},
	that = this;

	update.id = section_id;
	update.order = order;
	update.title = "Chapter "+ section_id;
	update.content = "";

	//update.body = JSON.stringify(update.body);

	var project = this.models['projects'];

	project.findById(project_id, function (err, item) {
		if (!err){
            var body = item.body;
            body.push(update);
			item.save();
            output = {
	            "success": "Section created",
				"date": Date.now()
	        };
        }else{
            output = {"error": "An error occured."};
        }
        that.res.send(JSON.stringify(output));
	});

}

AjaxController.editorSectionOrder = function(req, res) {
	var project_id = this.param('project_id'),
	order = this.param('order');
	this.user = this.req.user;
	this.userCart = this.req.userCart;
	var user = this.req.user,
	output = {},
	that = this;

	//update.body = JSON.stringify(update.body);

	//console.log(order);

	var project = this.models['projects'];

	order.forEach(function(item){
		//console.log(item);
		project.findOneAndUpdate({ _id: project_id, 'body.id': parseInt(item.id)}, { 'body.$.order': parseInt(item.order) }, function (err, section) {
			if (!err){
	            //console.log(section);
	            //var body = _.where(item.body , { id : section_id });
	            //item.content = update.body;
	            //section_id = parseInt(section_id) - 1;
				//body.splice(section_id, 1, update.body);
				//item.save();
	            output = {
	            	"success": "Reorder Done",
					"date": Date.now()
	            };
	        }else{
	            output = {"error": "An error occured."};
	        }

		});
	});

	that.res.send(JSON.stringify(output));


	/*project.findById(project_id, function (err, item) {
		if (!err){
            item.order = orderlist;
			//console.log(item.order);
			item.save();
            output = {
            	"success": "Section reordered",
				"date": Date.now()
            };
        }else{
            output = {"error": "An error occured."};
        }
        that.res.send(JSON.stringify(output));
	});*/

}

AjaxController.editorSectionLoad = function(req, res) {
	var project_id = this.param('project_id'),
	section_id = parseInt(this.param('section_id'));
	//console.log(section_id);
	this.user = this.req.user;
	this.userCart = this.req.userCart;
	var user = this.req.user,
	output = {},
	that = this;

	//update.body = this.param('data');
	//update.body = JSON.stringify(update.body);

	//console.log(project_id+" "+section_id);

	var project = this.models['projects'];
	project.findOne({ _id: project_id, 'body.id': section_id}, { 'body.$': 1 }, function (err, item) {
		if (!err){
			var body = _.where(item.body , { id : section_id });
			//console.log(body);
            output = {
            	"success": "Loaded",
				"data": body
            };
        }else{
            output = {"error": "An error occured."};
        }
        that.res.send(JSON.stringify(output));
	});

}

AjaxController.readerSectionLoad = function(req, res) {
	var project_id = this.param('project_id'),
	section_id = parseInt(this.param('section_id'));
	//console.log(section_id);
	this.user = this.req.user;
	this.userCart = this.req.userCart;
	var user = this.req.user,
	output = {},
	that = this;

	//update.body = this.param('data');
	//update.body = JSON.stringify(update.body);

	//console.log(project_id+" "+section_id);

	var project = this.models['projects'];
	project.findOne({ _id: project_id, 'body.id': section_id}, { 'body.$': 1 }, function (err, item) {
		if (!err){
			var body = _.where(item.body , { id : section_id });
			//console.log(body);
            output = {
            	"success": "Loaded",
				"data": body
            };
        }else{
            output = {"error": "An error occured."};
        }
        that.res.send(JSON.stringify(output));
	});

}

AjaxController.editorSectionDelete = function(req, res) {
	var project_id = this.param('project_id'),
	section_id = parseInt(this.param('section_id'));
	//data = this.param('data');
	//console.log(section_id);
	this.user = this.req.user;
	this.userCart = this.req.userCart;
	var user = this.req.user,
	update = {},
	output = {},
	that = this;

	//update.body = this.param('data');
	//update.body = JSON.stringify(update.body);

	var project = this.models['projects'];

	project.findOneAndUpdate(
    {_id: project_id},
    {$pull: {body: { id: section_id}}},
    function(err, item) {
	    if (!err){

			console.log(item);

        } else {
            output = {"error": "An error occured."};
        }
        that.res.send(JSON.stringify(output));
    });

	/*project
	.findOne({'_id': project_id })
	.where('body.id').equals(section_id)
	.exec(function (err, item) {
		if (!err){

			console.log(item);

        } else {
            output = {"error": "An error occured."};
        }
        that.res.send(JSON.stringify(output));
	});*/

}

AjaxController.editorSave = function(req, res) {
	var project_id = this.param('project_id'),
	section_id = parseInt(this.param('section_id')),
	data = this.param('data');
	//console.log(section_id);
	this.user = this.req.user;
	this.userCart = this.req.userCart;
	var user = this.req.user,
	update = {},
	output = {},
	that = this;

	update.body = this.param('data');
	//update.body = JSON.stringify(update.body);

	var project = this.models['projects'];

	project.findOneAndUpdate({ _id: project_id, 'body.id': section_id}, { 'body.$.content': update.body }, function (err, item) {
		if (!err){
            //console.log(item);
            //var body = _.where(item.body , { id : section_id });
            //item.content = update.body;
            //section_id = parseInt(section_id) - 1;
			//body.splice(section_id, 1, update.body);
			//item.save();
            output = {
            	"success": "Saved",
				"date": Date.now()
            };
        }else{
            output = {"error": "An error occured."};
        }
        that.res.send(JSON.stringify(output));
	});

}

AjaxController.titleSave = function(req, res) {
	var project_id = this.param('project_id'),
	section_id = parseInt(this.param('section_id')),
	title = this.param('title').trim();
	//console.log(section_id);
	this.user = this.req.user;
	this.userCart = this.req.userCart;
	var user = this.req.user,
	update = {},
	output = {},
	that = this;

	//update.body = this.param('data');
	//update.body = JSON.stringify(update.body);

	var project = this.models['projects'];

	project.findOneAndUpdate({ _id: project_id, 'body.id': section_id}, { 'body.$.title': title }, function (err, item) {
		if (!err){
            //console.log(item);
            //var body = _.where(item.body , { id : section_id });
            //item.content = update.body;
            //section_id = parseInt(section_id) - 1;
			//body.splice(section_id, 1, update.body);
			//item.save();
            output = {
            	"success": "Title Saved",
				"date": Date.now()
            };
        }else{
            output = {"error": "An error occured."};
        }
        that.res.send(JSON.stringify(output));
	});

}

AjaxController.booknameSave = function(req, res) {
	var project_id = this.param('project_id'),
	name = this.param('name').trim(),
	author = this.param('author').trim();
	//console.log(section_id);
	this.user = this.req.user;
	this.userCart = this.req.userCart;
	var user = this.req.user,
	update = {},
	output = {},
	that = this;

	//update.body = this.param('data');
	//update.body = JSON.stringify(update.body);
	console.log(name)

	var project = this.models['projects'];

	project.findOneAndUpdate({ _id: project_id}, { 'name': name, 'author': author }, function (err, item) {
		if (!err){
            //console.log(item);
            //var body = _.where(item.body , { id : section_id });
            //item.content = update.body;
            //section_id = parseInt(section_id) - 1;
			//body.splice(section_id, 1, update.body);
			//item.save();
            output = {
            	"success": "Book name saved",
				"date": Date.now()
            };
        }else{
            output = {"error": "An error occured."};
        }
        that.res.send(JSON.stringify(output));
	});

}

AjaxController.generate = function(req, res) {
	var project_id = this.param('project_id');
	this.user = this.req.user;
	this.userCart = this.req.userCart;
	var user = this.req.user,
	update = {},
	output = {},
	that = this,
	files = [];

	//update.body = this.param('data');
	//update.body = JSON.stringify(update.body);

	var project = this.models['projects'];

	project.findById(project_id, function (err, item) {
		if (!err){

            var body = _.sortBy(item.body, 'order'),
            book = "",
            sections = "",
            new_location = 'projects_data/'+project_id+'/',
            clog = console.log;
			var prefix = '<img src="/projects_data/';

			fs.ensureDirSync('projects_data/' + project_id);

			_.forEach(body, function(iteratee) {
				var iterateeContent = iteratee.content;
				while (iterateeContent.indexOf(prefix) > -1 ) {
					iterateeContent = iterateeContent.replace(prefix, '<img src="public/projects_data/');
				}
				iteratee.content = iterateeContent;
			});

            //clog(user);
			if (item.coverPhoto === null) {
				item.coverPhoto = '/assets/images/kk-cover.png';
			}

            var cover_image = 'public' + item.coverPhoto;

            var meta_file = new_location+'metadata.xml';

            var file = new_location+project_id+'.html';

            var title_file = new_location+'title.txt';

            var title_details = "% "+item.name+"\n" +
		            			"% "+user.name+"\n";

		    var book_metadata = "<dc:title>"+item.name+"</dc:title>" +
						"<dc:creator>"+user.firstname+" "+user.lastname+"</dc:creator>" +
						"<dc:rights>Creative Commons</dc:rights>" +
						"<dc:language>en-US</dc:language>" +
						"<dc:creator opf:file-as=\""+user.lastname+", "+user.firstname+"\" opf:role=\"aut\">"+user.name+"</dc:creator>" +
						"<dc:publisher>kreateve</dc:publisher>" +
						"<dc:date opf:event=\"publication\">"+ Date.now() +"</dc:date>" +
						"<dc:rights>Copyright ©2013 by "+user.name+"</dc:rights>";

            fs.readdir(new_location, function(err, flist){
			   if (err) {
			      //clog('Error reading directory ' + new_location);
			      //clog(err);
				}

				fs.mkdir(new_location, function(err, dir){});

			});

			//section_id = parseInt(section_id) - 1;
			//body.splice(section_id, 1, update.body);
			//item.save();
            var header = '<!DOCTYPE html><html class="no-js" lang="en-US"></head><body>';
            var footer = '</body></html>';

			body.forEach(function(section) {
	            sections += '<h1>'+section.title+'</h1>'+section.content;
            });

            book = header + sections + footer;

			fs.writeFile(title_file, title_details, function(err, title){

				fs.writeFileSync(meta_file, book_metadata);

				fs.writeFileSync(file, book);

				var exec = require('child_process').exec,
				epub,
				mobi;

				epub = exec('pandoc -o '+new_location+project_id+'.epub '+file+' --epub-cover-image='+cover_image+' --epub-metadata='+meta_file+' --toc',
				  function (error, stdout, stderr) {
					console.log("The epub file was saved!");
				    //console.log('stdout: ' + stdout);
				    //console.log('stderr: ' + stderr);

				    if (error !== null) {
				      console.log('exec error: ' + error);
				    }

					var epubfile = {type: 'EPUB', location: 'projects/'+project_id+'/printed/epub' };
					files.push(epubfile);

					mobi = exec('./kindle/kindlegen '+new_location+project_id+'.epub -o '+project_id+'.mobi',
					  function (error, stdout, stderr) {
						console.log("The mobi file was saved!");
					    //console.log('stdout: ' + stdout);
					    //console.log('stderr: ' + stderr);
					    if (error !== null) {
					      console.log('exec error: ' + error);
					    }

						var mobifile = {type: 'MOBI', location: 'projects/'+project_id+'/printed/mobi' };
						files.push(mobifile);

						//console.log(files);

						item.files = files;

						output = {
			            	"success": "Files Generated",
							"files": item.files
			            };

						item.save();

						var marketplace = that.models['marketplace'];

						marketplace.findOneByProjectId(item._id.toString(), function (err, marketplaceItem) {
							if (marketplaceItem === null) {
								return that.res.send(JSON.stringify(output));
							}

							marketplaceItem.files = files;
							marketplaceItem.save(function(err) {
								if (err) {
									output = {"error": "An error occured."};
									return that.res.send(JSON.stringify(output));
								}
								return that.res.send(JSON.stringify(output));
							});
						});
					});

				});

			});

		} else {
            output = {"error": "An error occured."};
			return that.res.send(JSON.stringify(output));
        }

	});

};

AjaxController.download = function(req, res) {
	var project_id = this.param('project_id'),
	file = this.param('file');
	this.user = this.req.user;
	this.userCart = this.req.userCart;
	var user = this.req.user,
	filename = 'projects_data/'+project_id+'/'+file;

	console.log(filename + "sent;");

	this.res.download(filename, function(err){
		if (err) {
		// Handle error, but keep in mind the response may be partially-sent
		// so check res.headersSent
		} else {
		// decrement a download credit, etc.
		}
	});

}

AjaxController.addToCart = function(req, res) {
	var marketplace_id = this.param('marketplace_id'),
	user = this.req.user,
	output = {},
	input = {},
	that = this;

	var marketplacemodel = this.models['marketplace'],
		cartmodel = this.models['cart'],
		usermodel = this.models['user'];

	marketplacemodel.findById(marketplace_id, function (err, item) {
		if (!err) {
            input = {
				marketplaceId: marketplace_id,
				date: Date.now(),
				name: item.name,
				description: item.description,
				price: item.price,
				userId: user.id
        	};

			cartmodel.findOne({marketplaceId: marketplace_id, userId: user.id}, function(err, cartItem) {
				if (err) {
					output = {"error": "An error occured."};
					console.log(output);
					that.res.send(JSON.stringify(output));
					return;
				}

				if (typeof cartItem !== 'undefined' && cartItem !== null) {
					output = {"warning": "Item is already in your cart."};
					that.res.send(JSON.stringify(output));
					return;
				}

				var newCartItem = new cartmodel(input);
				newCartItem.save(function (err) {
					if (err) {
						output = {"error": "An error occured."};
						console.log(output);
						that.res.send(JSON.stringify(output));
						return;
					}

					cartmodel.find({userId: user.id}, function(err, userCartItems) {
						if (err) {
							output = {"error": "An error occured."};
							console.log(output);
							that.res.send(JSON.stringify(output));
							return;
						}
						output = {
							"success": userCartItems.length,
							"date": Date.now(),
							"cart": userCartItems
						};
						console.log(output);
						that.res.send(JSON.stringify(output));
					});
				});
			});
        } else {
			output = {"error": "An error occured."};
			console.log(output);
			that.res.send(JSON.stringify(output));
		}
    });

};

AjaxController.removeFromCart = function(req, res) {
	var cart_item_id = this.param('cart_item_id'),
		user = this.req.user,
		output = {},
		self = this;

	var cartmodel = this.models['cart'];

	cartmodel.remove({_id: cart_item_id}, function(err) {
		if (err) {
			output = {"error": "An error occured."};
			return self.res.send(JSON.stringify(output));
		}
		cartmodel.find({userId: user.id}, function(err, userCartItems) {
			if (err) {
				output = {"error": "An error occured."};
				return self.res.send(JSON.stringify(output));
			}
			output = {
				"success": userCartItems.length,
				"date": Date.now(),
				"cart": userCartItems
			};

			self.res.send(JSON.stringify(output));
		});
	});
};

//========== filters
//AjaxController.before('settings', require('connect-ensure-login').ensureLoggedIn('account/login'));
//AjaxController.before('loginForm', require('connect-ensure-login').ensureLoggedOut('/'));

module.exports = AjaxController;