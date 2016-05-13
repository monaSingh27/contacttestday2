
var express     = require('express');
var app         = express();
var bodyParser  = require('body-parser');
var morgan      = require('morgan');
var mongoose    = require('mongoose');
var passport	=  require('passport');
var config      = require('./config/database'); // get db config file
var User        = require('./app/models/user'); // get the mongoose model
var Contact     = require('./app/models/contact');
var port        = 8080;
var jwt         = require('jwt-simple');


 
 
// get our request parameters
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
 
// log to console
app.use(morgan('dev'));
 
// Use the passport package in our application
app.use(passport.initialize());
 
// demo Route (GET http://localhost:8080)
app.get('/', function(req, res) {
  res.send('Hello! The API is at http://localhost:' + port + '/api');
});
 
 
// connect to database
mongoose.connect(config.database);


// pass passport for configuration
require('./config/passport')(passport);
 
// bundle our routes
var apiRoutes = express.Router();
 
// create a new user account (POST http://localhost:8080/api/signup)
apiRoutes.post('/signup', function(req, res) {
  if (!req.body.name || !req.body.password) {
    res.json({success: false, msg: 'Please pass name and password.'});
  } else {
    var newUser = new User({
      name: req.body.name,
      password: req.body.password
    });
    // save the user
    newUser.save(function(err) {
      if (err) {
        return res.json({success: false, msg: 'Username already exists.'});
      }
      res.json({success: true, msg: 'Successful created new user.'});
    });
  }
});


// create a new user account (POST http://localhost:8080/signup)
// ...
 
// route to authenticate a user (POST http://localhost:8080/api/authenticate)
apiRoutes.post('/authenticate', function(req, res) {
  User.findOne({
    name: req.body.name
  }, function(err, user) {
    if (err) throw err;
 
    if (!user) {
      res.send({success: false, msg: 'Authentication failed. User not found.'});
    } else {
      // check if password matches
      user.comparePassword(req.body.password, function (err, isMatch) {
        if (isMatch && !err) {
          // if user is found and password is right create a token
          var token = jwt.encode(user, config.secret);
          // return the information including token as JSON
          res.json({success: true, token: 'JWT ' + token});
        } else {
          res.send({success: false, msg: 'Authentication failed. Wrong password.'});
        }
      });
    }
  });
});



// route to authenticate a user (POST http://localhost:8080/api/authenticate)
// ...
 
// route to a restricted info (GET http://localhost:8080/api/memberinfo)
apiRoutes.get('/memberinfo', passport.authenticate('jwt', { session: false}), function(req, res) {
  var token = getToken(req.headers);
  // console.log('token: '+token);
  // console.log('hello');


  if (token) {
    var decoded = jwt.decode(token, config.secret);
    User.findOne({
      name: decoded.name
    }, function(err, user) {
        if (err) throw err;
 
        if (!user) {
          return res.status(403).send({success: false, msg: 'Authentication failed. User not found.'});
        } else {
          res.json({success: true, msg: 'Welcome ' + user.name + '!!!'});
        }
    });
  } else {
    return res.status(403).send({success: false, msg: 'No token provided.'});
  }
});
 

  apiRoutes.post('/member/addcontact',passport.authenticate('jwt', { session: false}),function(req, res) {
    

    var token = getToken(req.headers);

  if (token) { 


         var contact = new Contact();
        contact.name = req.body.name;  
        contact.email = req.body.email;
        contact.mobileno = req.body.mobileno;
  	    contact.token=token;

  	  console.log(token);

    contact.save(function(err) {
      if (err)
        res.send(err);

      res.json({ message: 'contact added!' });
    });

    
  }});

  apiRoutes.get('/member/viewcontact',passport.authenticate('jwt', { session: false}),function(req, res) {

      var htoken = getToken(req.headers);
      // console.log(htoken);

  if (htoken) {

  	 var decoded = jwt.decode(htoken, config.secret);
     var name = decoded.name

Contact.find({token: htoken},function(err, contacts) {

      if (err)
        res.send(err);

      // res.json('Conatcts of '+name);
      res.json(contacts);
    });

  }});


apiRoutes.get('/member/searchcontact/:email',passport.authenticate('jwt', { session: false}),function(req,res) {

	// get the contact with that id
 var htoken = getToken(req.headers);


  if (htoken) { 


     var decoded = jwt.decode(htoken, config.secret);
     var name = decoded.name
  				
		Contact.find({email:req.params.email,token: htoken}, function(err, contact) {
			if (err)
				res.send(err);
			
      // res.json('Conatcts of '+name);
      res.json(contact);


		});


	}});

		

apiRoutes.delete('/member/deletecontact/:email',passport.authenticate('jwt', { session: false}),function(req,res) {

	 var htoken = getToken(req.headers);

     if (htoken) { 

   

		Contact.remove({email:req.params.email,token: htoken}, function(err, contact) {
			if (err)
				res.send(err);

			res.json({ message: 'Successfully deleted' });
		});
	}});


getToken = function (headers) {
  if (headers && headers.authorization) {
    var parted = headers.authorization.split(' ');
    if (parted.length === 2) {
      return parted[1];
    } else {
      return null;
    }
  } else {
    return null;
  }
};
 
// connect the api routes under /api/*
app.use('/api', apiRoutes);
// Start the server
app.listen(port);
console.log('Starts on: http://localhost:' + port);