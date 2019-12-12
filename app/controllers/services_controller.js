var locomotive = require('locomotive')
    , Controller = locomotive.Controller;

var ServicesController = new Controller();
var countries = require('country-data').countries;

ServicesController.show = function() {
    this.user = this.req.user;
    this.userCart = this.req.userCart;
    var usertype = this.param("usertype");
    if ( ! usertype) {
        var url = {'usertype': {$in: ['designer', 'editor', 'publicist']}};
    } else {
        var url = {'usertype': usertype};
    }

    var service = this.models['user'],
        self = this;

    service.find(url, 'firstname lastname photo _id locations', function(err, servicelist){
        if(!err){
            var countryName=[];
            for (var i = 0; i < servicelist.length; i++) {
                if (!!servicelist[i].locations[0]) {
                    var key = "US";

                    if(!!servicelist[i].locations[0].country){
                        key = servicelist[i].locations[0].country;
                    }
                    var values = eval("countries." + key + ".name");

                    if (!(key in countryName )) {
                        countryName[i] = {code: key, description: values};
                    }
                }
            }

            //this will sort the country in ascending order
            countryName.sort(function(a, b){
                if( a.description < b.description){
                    return -1;
                }
                if( a.description > b.description){
                    return 1;
                }
                return 0;
            });

            //this will cleanup the countryName list and remove duplicate country
            function cleanup(arr, prop) {
                var new_arr = [];
                var lookup  = {};

                for (var i in arr) {
                    lookup[arr[i][prop]] = arr[i];
                }

                for (i in lookup) {
                    new_arr.push(lookup[i]);
                }

                return new_arr;
            }

            var uniqueCountry = cleanup(countryName, 'code');


            self.countryNameList = uniqueCountry;

            self.list = servicelist;
            self.render('show');
        }else{
            self.render('/error');
        }

    });
    //this.render();
}

//ServicesController.before(['dashboard', 'solutions', 'services'], require('connect-ensure-login').ensureLoggedIn('account/login'));

ServicesController.before('*', function(req, res, next){
    // this executes before any action is invoked
    // if you want to insert a middleware
    require('connect-ensure-login').ensureLoggedIn('account/login')(req,res,next);
    // or
    //next();
});

module.exports = ServicesController;
